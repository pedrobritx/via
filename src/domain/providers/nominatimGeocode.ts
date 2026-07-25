/**
 * Adaptador de geocodificação para o Nominatim (OpenStreetMap).
 *
 * Ativado com `VIA_GEOCODE_PROVIDER=nominatim`.
 *
 * A política de uso da instância pública do Nominatim exige User-Agent
 * identificável e limita a uma requisição por segundo. Por isso a chamada exige
 * `VIA_NOMINATIM_USER_AGENT` explicitamente, em vez de inventar um cabeçalho:
 * usar o serviço de forma anônima e em volume é abusar de infraestrutura
 * mantida por doação. Para produção, suba uma instância própria.
 */

import type { GeocodeProvider, Place } from "../types";

export const NOMINATIM_GEOCODE_PROVIDER_ID = "nominatim";

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT_MS = 8000;

export class NominatimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NominatimError";
  }
}

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
}

export interface NominatimOptions {
  userAgent: string;
  baseUrl?: string;
  /** Restringe a busca a um país (ISO 3166-1 alpha-2). */
  countryCodes?: string;
  fetchImpl?: typeof fetch;
}

export function createNominatimGeocodeProvider(
  options: NominatimOptions,
): GeocodeProvider {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = options.fetchImpl ?? globalThis.fetch;

  if (!options.userAgent) {
    throw new NominatimError(
      "VIA_NOMINATIM_USER_AGENT é obrigatório: a política de uso do Nominatim " +
        "exige identificação da aplicação.",
    );
  }

  return {
    id: NOMINATIM_GEOCODE_PROVIDER_ID,

    async search(query: string): Promise<Place[]> {
      const trimmed = query.trim();
      if (trimmed.length === 0) return [];

      const url = new URL(`${baseUrl}/search`);
      url.searchParams.set("q", trimmed);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "8");
      url.searchParams.set("addressdetails", "0");
      if (options.countryCodes) {
        url.searchParams.set("countrycodes", options.countryCodes);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await doFetch(url.toString(), {
          headers: {
            "User-Agent": options.userAgent,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new NominatimError(`Nominatim respondeu ${response.status}.`);
        }

        const payload = (await response.json()) as NominatimResult[];
        if (!Array.isArray(payload)) return [];

        return payload
          .map((item) => {
            const lat = Number(item.lat);
            const lng = Number(item.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              lat,
              lng,
              label: item.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            } satisfies Place;
          })
          .filter((place): place is Place => place !== null);
      } catch (cause) {
        if (cause instanceof NominatimError) throw cause;
        const reason =
          cause instanceof Error && cause.name === "AbortError"
            ? `sem resposta em ${REQUEST_TIMEOUT_MS} ms`
            : cause instanceof Error
              ? cause.message
              : "erro desconhecido";
        throw new NominatimError(`Falha ao consultar o Nominatim: ${reason}.`);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
