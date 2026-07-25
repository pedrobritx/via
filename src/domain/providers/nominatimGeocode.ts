/**
 * Adaptador de geocodificação para o Nominatim (OpenStreetMap).
 *
 * É o provedor padrão de busca por endereço, porque é o único caminho gratuito
 * e sem cadastro que devolve **coordenadas** — e sem coordenadas não há
 * distância, logo não há cálculo nenhum.
 *
 * ## Mudança de decisão em relação ao ADR 0002
 *
 * A versão anterior exigia `VIA_NOMINATIM_USER_AGENT` explícito e caía para as
 * fixtures offline quando ele faltava. O raciocínio era não abusar de
 * infraestrutura mantida por doação usando-a anonimamente.
 *
 * O efeito prático foi outro: como ninguém configurava a variável, o app
 * respondia "nenhum lugar encontrado" para qualquer endereço real. Ou seja, a
 * cautela protegia o Nominatim de um tráfego que não existia, e quebrava o
 * produto para todo mundo.
 *
 * A política de uso do Nominatim pede um User-Agent que **identifique a
 * aplicação**. Um cabeçalho fixo e honesto (`via/0.1 (+repositório)`) atende
 * exatamente a isso — não é uso anônimo. Então o padrão passou a ser ligado,
 * com o cuidado que a política de fato exige:
 *
 * - **uma requisição por segundo, no máximo**, serializada por `RateLimiter`;
 * - **cache em memória**, para que digitar não gere uma consulta por tecla;
 * - User-Agent identificável, sobrescrevível por env var.
 *
 * Para volume de produção, continua valendo o conselho: suba uma instância
 * própria ou use um serviço pago. Um comentário no `.env.example` diz isso.
 */

import type { GeocodeProvider, Place } from "../types";

export const NOMINATIM_GEOCODE_PROVIDER_ID = "nominatim";

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT_MS = 8000;

/**
 * User-Agent padrão. Identifica a aplicação, como a política pede.
 * Sobrescreva com `VIA_NOMINATIM_USER_AGENT` se publicar sob outro domínio.
 */
export const DEFAULT_USER_AGENT =
  "via-visualizador-impacto-assistencial/0.1 (+https://github.com/pedrobritx/via)";

/** Intervalo mínimo entre requisições, conforme a política do Nominatim. */
const MIN_INTERVAL_MS = 1100;

const CACHE_MAX_ENTRIES = 300;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

/**
 * Serializa chamadas com um intervalo mínimo entre elas.
 *
 * Ressalva honesta: em ambiente serverless cada instância tem seu próprio
 * limitador, então isto não é uma garantia global de 1 req/s — é uma redução
 * substancial de rajadas. A garantia real viria de instância própria.
 */
class RateLimiter {
  private queue: Promise<unknown> = Promise.resolve();
  private lastRun = 0;

  constructor(private readonly minIntervalMs: number) {}

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      const wait = this.minIntervalMs - (Date.now() - this.lastRun);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.lastRun = Date.now();
      return task();
    });
    // A fila avança mesmo quando uma tarefa falha.
    this.queue = result.catch(() => undefined);
    return result;
  }
}

interface CacheEntry {
  places: Place[];
  storedAt: number;
}

class ResultCache {
  private readonly entries = new Map<string, CacheEntry>();

  get(key: string): Place[] | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
      this.entries.delete(key);
      return undefined;
    }
    // Reinsere para que o mais usado sobreviva ao descarte.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.places;
  }

  set(key: string, places: Place[]): void {
    if (this.entries.size >= CACHE_MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { places, storedAt: Date.now() });
  }
}

export interface NominatimOptions {
  /** Padrão: `DEFAULT_USER_AGENT`. */
  userAgent?: string;
  baseUrl?: string;
  /** Restringe a busca a um país (ISO 3166-1 alpha-2). */
  countryCodes?: string;
  fetchImpl?: typeof fetch;
  /** Injetáveis para teste; do contrário são criados por provedor. */
  rateLimiter?: RateLimiter;
  cache?: ResultCache;
}

export function createNominatimGeocodeProvider(
  options: NominatimOptions = {},
): GeocodeProvider {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = options.fetchImpl ?? globalThis.fetch;
  const userAgent = options.userAgent?.trim() || DEFAULT_USER_AGENT;
  const limiter = options.rateLimiter ?? new RateLimiter(MIN_INTERVAL_MS);
  const cache = options.cache ?? new ResultCache();

  return {
    id: NOMINATIM_GEOCODE_PROVIDER_ID,

    async search(query: string): Promise<Place[]> {
      const trimmed = query.trim();
      if (trimmed.length === 0) return [];

      const cacheKey = `${options.countryCodes ?? ""}|${trimmed.toLowerCase()}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const url = new URL(`${baseUrl}/search`);
      url.searchParams.set("q", trimmed);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "8");
      url.searchParams.set("addressdetails", "0");
      if (options.countryCodes) {
        url.searchParams.set("countrycodes", options.countryCodes);
      }

      const places = await limiter.run(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const response = await doFetch(url.toString(), {
            headers: { "User-Agent": userAgent, Accept: "application/json" },
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new NominatimError(`Nominatim respondeu ${response.status}.`);
          }

          const payload = (await response.json()) as NominatimResult[];
          if (!Array.isArray(payload)) return [];

          return payload
            .map((item): Place | null => {
              const lat = Number(item.lat);
              const lng = Number(item.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              return {
                lat,
                lng,
                label:
                  item.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                source: NOMINATIM_GEOCODE_PROVIDER_ID,
              };
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
      });

      cache.set(cacheKey, places);
      return places;
    },
  };
}
