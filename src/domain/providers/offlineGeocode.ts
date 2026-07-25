/**
 * Geocodificação offline.
 *
 * Duas formas de resolver um lugar sem consultar serviço nenhum:
 *
 * 1. Coordenadas digitadas direto ("-23.5505, -46.6333"). Sempre funciona,
 *    para qualquer ponto do mundo.
 * 2. Uma lista curta de cidades e equipamentos de saúde brasileiros, suficiente
 *    para demonstrar o método e rodar os testes.
 *
 * A lista NÃO pretende ser um cadastro de estabelecimentos de saúde. Para uso
 * real, configure `VIA_GEOCODE_PROVIDER=nominatim` ou integre o CNES.
 *
 * Precisão: as coordenadas de cidade apontam para o centro do município e as
 * de equipamento, para o quarteirão. Num trajeto de dezenas de quilômetros, um
 * erro de algumas centenas de metros não altera nenhuma conclusão — mas seria
 * inadequado para navegação porta a porta.
 */

import type { GeocodeProvider, Place } from "../types";

export const OFFLINE_GEOCODE_PROVIDER_ID = "offline-fixtures";

export interface FixturePlace extends Place {
  /** "city" aponta para o centro do município; "facility", para o quarteirão. */
  precision: "city" | "facility";
  /** Termos alternativos de busca (siglas, nomes populares). */
  aliases?: string[];
}

export const PLACE_FIXTURES: FixturePlace[] = [
  // --- Equipamentos de saúde ---
  {
    label: "Hospital das Clínicas da FMUSP, São Paulo, SP",
    lat: -23.5558,
    lng: -46.6697,
    precision: "facility",
    aliases: ["HC FMUSP", "Hospital das Clinicas Sao Paulo", "HCFMUSP"],
  },
  {
    label: "Hospital de Clínicas de Porto Alegre, RS",
    lat: -30.0388,
    lng: -51.2065,
    precision: "facility",
    aliases: ["HCPA", "Hospital de Clinicas Porto Alegre"],
  },
  {
    label: "Instituto Nacional de Câncer (INCA), Rio de Janeiro, RJ",
    lat: -22.9083,
    lng: -43.1913,
    precision: "facility",
    aliases: ["INCA", "Instituto Nacional de Cancer"],
  },
  {
    label: "Hospital das Clínicas da UFMG, Belo Horizonte, MG",
    lat: -19.9227,
    lng: -43.9384,
    precision: "facility",
    aliases: ["HC UFMG", "Hospital das Clinicas Belo Horizonte"],
  },
  {
    label: "Hospital Universitário de Brasília, DF",
    lat: -15.796,
    lng: -47.876,
    precision: "facility",
    aliases: ["HUB", "Hospital Universitario Brasilia"],
  },
  {
    label: "Hospital das Clínicas da UFPE, Recife, PE",
    lat: -8.0523,
    lng: -34.949,
    precision: "facility",
    aliases: ["HC UFPE", "Hospital das Clinicas Recife"],
  },

  // --- Municípios ---
  { label: "São Paulo, SP", lat: -23.5505, lng: -46.6333, precision: "city", aliases: ["Sao Paulo", "SP"] },
  { label: "Rio de Janeiro, RJ", lat: -22.9068, lng: -43.1729, precision: "city", aliases: ["RJ"] },
  { label: "Belo Horizonte, MG", lat: -19.9167, lng: -43.9345, precision: "city", aliases: ["BH"] },
  { label: "Porto Alegre, RS", lat: -30.0346, lng: -51.2177, precision: "city", aliases: ["POA"] },
  { label: "Brasília, DF", lat: -15.7939, lng: -47.8828, precision: "city", aliases: ["Brasilia", "DF"] },
  { label: "Salvador, BA", lat: -12.9777, lng: -38.5016, precision: "city" },
  { label: "Fortaleza, CE", lat: -3.7319, lng: -38.5267, precision: "city" },
  { label: "Recife, PE", lat: -8.0476, lng: -34.877, precision: "city" },
  { label: "Curitiba, PR", lat: -25.4284, lng: -49.2733, precision: "city" },
  { label: "Manaus, AM", lat: -3.119, lng: -60.0217, precision: "city" },
  { label: "Campinas, SP", lat: -22.9099, lng: -47.0626, precision: "city" },
  { label: "Sorocaba, SP", lat: -23.5015, lng: -47.4526, precision: "city" },
  { label: "Ribeirão Preto, SP", lat: -21.1775, lng: -47.8103, precision: "city", aliases: ["Ribeirao Preto"] },
  { label: "Santos, SP", lat: -23.9608, lng: -46.3336, precision: "city" },
  { label: "São José dos Campos, SP", lat: -23.2237, lng: -45.9009, precision: "city", aliases: ["Sao Jose dos Campos", "SJC"] },
  { label: "Piracicaba, SP", lat: -22.7253, lng: -47.6492, precision: "city" },
  { label: "Juiz de Fora, MG", lat: -21.7642, lng: -43.3503, precision: "city" },
  { label: "Caxias do Sul, RS", lat: -29.1678, lng: -51.1794, precision: "city" },
  { label: "Feira de Santana, BA", lat: -12.2664, lng: -38.9663, precision: "city" },
];

/** Remove acentos e caixa, para que "Brasília" case com "brasilia". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Reconhece um par de coordenadas digitado direto.
 *
 * Aceita "-23.5505, -46.6333" e "-23.5505 -46.6333".
 */
export function parseLatLng(query: string): Place | null {
  const match = query
    .trim()
    .match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat,
    lng,
    label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}

export function searchFixtures(query: string, limit = 8): Place[] {
  const direct = parseLatLng(query);
  if (direct) return [direct];

  const needle = fold(query);
  if (needle.length === 0) return [];

  const scored = PLACE_FIXTURES.map((place) => {
    const haystacks = [place.label, ...(place.aliases ?? [])].map(fold);

    // Prefixo do nome principal vence; conter em qualquer campo vem depois.
    let score = -1;
    if (haystacks[0].startsWith(needle)) score = 3;
    else if (haystacks.some((h) => h.startsWith(needle))) score = 2;
    else if (haystacks.some((h) => h.includes(needle))) score = 1;

    return { place, score };
  })
    .filter((entry) => entry.score > 0)
    // Empate resolvido pelo rótulo, para que a saída seja determinística.
    .sort(
      (a, b) => b.score - a.score || a.place.label.localeCompare(b.place.label),
    );

  return scored
    .slice(0, limit)
    .map(({ place }) => ({
      lat: place.lat,
      lng: place.lng,
      label: place.label,
    }));
}

export const offlineGeocodeProvider: GeocodeProvider = {
  id: OFFLINE_GEOCODE_PROVIDER_ID,
  async search(query) {
    return searchFixtures(query);
  },
};
