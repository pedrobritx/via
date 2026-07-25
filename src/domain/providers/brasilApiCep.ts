/**
 * Consulta de CEP pela BrasilAPI.
 *
 * Não exige chave, não exige cadastro, e cobre qualquer endereço brasileiro —
 * o que resolve o problema real: uma lista fixa de 27 lugares não é um
 * geocodificador, é um catálogo de demonstração.
 *
 * IMPORTANTE, e verificado na prática: a BrasilAPI **não devolve coordenadas**.
 * O campo `location.coordinates` vem vazio em todas as consultas que testamos,
 * porque o serviço que responde (`open-cep`) não as fornece. Ou seja, o CEP
 * sozinho não permite calcular distância nenhuma.
 *
 * Por isso este módulo só faz metade do trabalho: transforma um CEP em um
 * endereço legível. Quem converte esse endereço em latitude e longitude é o
 * Nominatim, na etapa seguinte da corrente (ver `compositeGeocode.ts`).
 */

const DEFAULT_BASE_URL = "https://brasilapi.com.br/api";
const REQUEST_TIMEOUT_MS = 8000;

export interface CepAddress {
  cep: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface BrasilApiCepResponse {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

/** Extrai os 8 dígitos de um CEP escrito de qualquer jeito ("01310-100", "01310100"). */
export function normalizeCep(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

/** Reconhece se o que foi digitado é um CEP, e não um endereço ou nome de lugar. */
export function looksLikeCep(raw: string): boolean {
  const trimmed = raw.trim();
  // Só considera CEP se o texto for essencialmente os dígitos, com hífen ou
  // espaço opcional. "Rua 1310100" não deve ser tratado como CEP.
  return /^\d{5}[-\s]?\d{3}$/.test(trimmed);
}

/** Monta a string de busca que o geocodificador entende melhor. */
export function cepAddressToQuery(address: CepAddress): string {
  return [address.street, address.neighborhood, address.city, address.state]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
}

/** Rótulo legível para exibir ao usuário, já com o CEP formatado. */
export function cepAddressToLabel(address: CepAddress): string {
  const parts = [address.street, address.neighborhood, address.city]
    .filter((part): part is string => Boolean(part && part.trim()));
  const place = parts.join(", ");
  const uf = address.state ? ` - ${address.state}` : "";
  const cep = address.cep
    ? ` (CEP ${address.cep.slice(0, 5)}-${address.cep.slice(5)})`
    : "";
  return `${place}${uf}${cep}`;
}

export class BrasilApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrasilApiError";
  }
}

export interface BrasilApiOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Busca um CEP. Devolve `null` quando o CEP não existe (404), porque "não
 * encontrei" é uma resposta legítima e não um erro de sistema.
 */
export async function lookupCep(
  rawCep: string,
  options: BrasilApiOptions = {},
): Promise<CepAddress | null> {
  const cep = normalizeCep(rawCep);
  if (!cep) return null;

  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = options.fetchImpl ?? globalThis.fetch;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await doFetch(`${baseUrl}/cep/v2/${cep}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new BrasilApiError(`BrasilAPI respondeu ${response.status}.`);
    }

    const payload = (await response.json()) as BrasilApiCepResponse;
    if (!payload || typeof payload !== "object") return null;

    return {
      cep,
      street: payload.street?.trim() || undefined,
      neighborhood: payload.neighborhood?.trim() || undefined,
      city: payload.city?.trim() || undefined,
      state: payload.state?.trim() || undefined,
    };
  } catch (cause) {
    if (cause instanceof BrasilApiError) throw cause;
    const reason =
      cause instanceof Error && cause.name === "AbortError"
        ? `sem resposta em ${REQUEST_TIMEOUT_MS} ms`
        : cause instanceof Error
          ? cause.message
          : "erro desconhecido";
    throw new BrasilApiError(`Falha ao consultar a BrasilAPI: ${reason}.`);
  } finally {
    clearTimeout(timeout);
  }
}
