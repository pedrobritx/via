/**
 * Tradução e formatação.
 *
 * Toda formatação de número, moeda e duração passa por `Intl`. Escrever
 * "R$ " + valor.toFixed(2) parece equivalente e não é: erra o separador
 * decimal, erra o agrupamento de milhar e quebra assim que existir um segundo
 * idioma. `Intl` já resolve isso em toda plataforma que roda o app.
 */

import { enUS } from "./messages/en-US";
import { ptBR, type MessageKey, type Messages } from "./messages/pt-BR";

export type Locale = "pt-BR" | "en-US";

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const LOCALES: readonly Locale[] = ["pt-BR", "en-US"];

const CATALOGS: Record<Locale, Partial<Messages>> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

/**
 * Traduz uma chave.
 *
 * Cai para o pt-BR quando o idioma ativo não tem a chave, e para a própria
 * chave se ela não existir em lugar nenhum — o que só acontece por erro de
 * digitação e aparece imediatamente na tela, em vez de renderizar vazio.
 */
export function translate(key: MessageKey, locale: Locale = DEFAULT_LOCALE): string {
  return CATALOGS[locale]?.[key] ?? ptBR[key] ?? key;
}

/** Fábrica de tradutor amarrado a um idioma. */
export function createTranslator(locale: Locale = DEFAULT_LOCALE) {
  return (key: MessageKey): string => translate(key, locale);
}

export type Translator = ReturnType<typeof createTranslator>;

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

const CURRENCY_BY_LOCALE: Record<Locale, string> = {
  "pt-BR": "BRL",
  "en-US": "BRL", // Os valores continuam em reais mesmo em inglês.
};

export function formatCurrency(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY_BY_LOCALE[locale],
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Duração legível: "1h35", "45 min".
 *
 * Preferida a "95 min" porque é assim que uma pessoa conta o tempo dela para
 * outra — e o objetivo do resumo é ser repetível numa conversa.
 */
export function formatDuration(
  minutes: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const total = Math.round(minutes);
  const hours = Math.floor(Math.abs(total) / 60);
  const mins = Math.abs(total) % 60;
  const sign = total < 0 ? "-" : "";

  if (hours === 0) return `${sign}${mins} min`;

  if (locale === "en-US") {
    if (mins === 0) return `${sign}${hours}h`;
    return `${sign}${hours}h${String(mins).padStart(2, "0")}`;
  }

  if (mins === 0) {
    return hours === 1 ? `${sign}1 hora` : `${sign}${hours} horas`;
  }
  return `${sign}${hours}h${String(mins).padStart(2, "0")}`;
}

/** Massa de CO₂ com unidade, escolhendo grama ou quilograma. */
export function formatMass(
  kg: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (Math.abs(kg) > 0 && Math.abs(kg) < 1) {
    return `${formatNumber(kg * 1000, locale, { maximumFractionDigits: 0 })} g`;
  }
  return `${formatNumber(kg, locale, { maximumFractionDigits: 2 })} kg`;
}

export function formatDateTime(
  iso: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export type { MessageKey, Messages };
