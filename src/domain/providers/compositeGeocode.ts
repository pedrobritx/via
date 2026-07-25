/**
 * Geocodificador composto: resolve um texto qualquer em lugares com coordenadas.
 *
 * A ordem existe porque cada tipo de entrada tem um caminho certo, e tentar
 * tudo em todo lugar seria lento e impreciso:
 *
 * 1. **Coordenadas coladas** (`-23.55, -46.63`) — resposta imediata, sem rede.
 * 2. **CEP** — BrasilAPI devolve o endereço, e o Nominatim converte esse
 *    endereço em coordenadas. Duas chamadas, porque nenhuma das duas faz o
 *    trabalho inteiro: a BrasilAPI não tem coordenadas, e o Nominatim erra
 *    bastante quando recebe só oito dígitos.
 * 3. **Texto livre** — endereço, cidade ou nome de estabelecimento, direto no
 *    Nominatim, restrito ao Brasil.
 * 4. **Fixtures offline** — sempre consultadas em paralelo com o passo 3, e
 *    usadas sozinhas se a rede falhar. São 27 lugares conhecidos; servem de
 *    rede de segurança e de atalho para os hospitais de referência.
 *
 * Nenhum passo depende de chave de API. O app continua funcionando sem nenhuma
 * variável de ambiente configurada — se a rede cair, o passo 4 responde.
 */

import type { GeocodeProvider, Place } from "../types";
import {
  cepAddressToLabel,
  cepAddressToQuery,
  looksLikeCep,
  lookupCep,
  type BrasilApiOptions,
} from "./brasilApiCep";
import {
  OFFLINE_GEOCODE_PROVIDER_ID,
  parseLatLng,
  searchFixtures,
} from "./offlineGeocode";
import {
  createNominatimGeocodeProvider,
  type NominatimOptions,
} from "./nominatimGeocode";

export const COMPOSITE_GEOCODE_PROVIDER_ID = "composite-br";

export interface CompositeGeocodeOptions {
  nominatim?: NominatimOptions;
  brasilApi?: BrasilApiOptions;
  /** Desliga a rede por completo. Usado nos testes e como modo offline. */
  offlineOnly?: boolean;
}

/** Remove duplicatas por coordenada arredondada, preservando a ordem. */
function dedupe(places: Place[]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const place of places) {
    const key = `${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

export function createCompositeGeocodeProvider(
  options: CompositeGeocodeOptions = {},
): GeocodeProvider {
  const nominatim = options.offlineOnly
    ? null
    : createNominatimGeocodeProvider({
        countryCodes: "br",
        ...options.nominatim,
      });

  return {
    id: COMPOSITE_GEOCODE_PROVIDER_ID,

    async search(query: string): Promise<Place[]> {
      const trimmed = query.trim();
      if (trimmed.length === 0) return [];

      // 1. Coordenadas digitadas direto.
      const direct = parseLatLng(trimmed);
      if (direct) return [{ ...direct, source: "coordenadas" }];

      const fixtures = searchFixtures(trimmed).map((place) => ({
        ...place,
        source: OFFLINE_GEOCODE_PROVIDER_ID,
      }));

      if (!nominatim) return fixtures;

      // 2. CEP: endereço pela BrasilAPI, coordenadas pelo Nominatim.
      if (looksLikeCep(trimmed)) {
        try {
          const address = await lookupCep(trimmed, options.brasilApi);
          if (address) {
            const label = cepAddressToLabel(address);
            const geocoded = await nominatim.search(cepAddressToQuery(address));
            if (geocoded.length > 0) {
              // O rótulo do CEP é mais legível que o do Nominatim, mas as
              // coordenadas são as dele. Cada um no que é bom.
              return [
                {
                  lat: geocoded[0].lat,
                  lng: geocoded[0].lng,
                  label,
                  source: "brasilapi-cep",
                },
              ];
            }
          }
        } catch {
          // CEP inválido ou serviço fora do ar: segue para a busca livre.
        }
      }

      // 3. Texto livre.
      try {
        const found = await nominatim.search(trimmed);
        // Fixtures primeiro: são hospitais de referência, curados à mão, e
        // quem digita "HCPA" quer aquele hospital, não o que o OSM achar.
        return dedupe([...fixtures, ...found]).slice(0, 8);
      } catch {
        // 4. Rede fora: o que houver offline é melhor que nada.
        return fixtures;
      }
    },
  };
}
