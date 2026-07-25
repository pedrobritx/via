/**
 * Monta a frase-resumo do resultado.
 *
 * Fica na camada de idioma, e não no domínio, porque é texto para pessoa ler:
 * precisa de separador decimal correto, de moeda formatada e de concordância.
 * O domínio decide o que é relevante mencionar (`significantSavings`); aqui a
 * frase é construída.
 *
 * O alvo é a frase que alguém repete para outra pessoa — "economizei uma hora e
 * meia e quarenta reais". Um número que ninguém consegue recontar não muda
 * decisão nenhuma.
 */

import { significantSavings } from "@/domain/compare";
import type { ImpactResult } from "@/domain/types";

import {
  DEFAULT_LOCALE,
  formatCurrency,
  formatDuration,
  formatMass,
  translate,
  type Locale,
} from "./index";

export function buildSummary(
  result: ImpactResult,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const kinds = significantSavings(result);

  if (kinds.length === 0) {
    return translate("summary.equivalent", locale);
  }

  const parts = kinds.map((kind) => {
    switch (kind) {
      case "time":
        return formatDuration(result.savings.timeMin, locale);
      case "cost":
        return formatCurrency(result.savings.costBRL, locale);
      case "carbon":
        return `${formatMass(result.savings.carbonKg, locale)} ${translate(
          "summary.ofCarbon",
          locale,
        )}`;
    }
  });

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} ${translate("summary.and", locale)} ${
          parts[parts.length - 1]
        }`;

  // O condicional importa: quando a teleconsulta não é viável para o perfil,
  // prometer economia no presente seria falso.
  const template = translate(
    result.remoteViable ? "summary.saved" : "summary.wouldSave",
    locale,
  );

  return template.replace("{list}", list);
}
