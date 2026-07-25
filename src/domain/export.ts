/**
 * Exportação de resultados.
 *
 * O objetivo não é "salvar um arquivo": é permitir que outra pessoa refaça a
 * conta. Por isso ambos os formatos carregam a versão dos índices e o
 * identificador de fonte de cada linha. Um CSV com números soltos, sem dizer
 * de que versão do método vieram, é irreprodutível seis meses depois.
 */

import type { ImpactResult, ScenarioResult } from "./types";

export function toJSON(result: ImpactResult): string {
  return JSON.stringify(result, null, 2);
}

const CSV_HEADER = [
  "cenario",
  "indice",
  "indice_valor",
  "indice_unidade",
  "componente",
  "componente_entrada",
  "componente_entrada_unidade",
  "componente_peso",
  "componente_contribuicao",
  "fonte",
  "versao_indices",
] as const;

/**
 * Escapa um campo conforme RFC 4180.
 *
 * Rótulos em português trazem vírgulas e acentos com frequência; sem isso o
 * arquivo abre desalinhado em qualquer planilha.
 */
function csvField(value: string | number | undefined): string {
  if (value === undefined) return "";
  const text = String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function scenarioRows(
  scenario: ScenarioResult,
  indexVersion: string,
): string[] {
  const rows: string[] = [];
  const indices = [
    scenario.carbon,
    scenario.time,
    scenario.cost,
    scenario.burden,
    scenario.social,
  ];

  for (const index of indices) {
    for (const component of index.components) {
      rows.push(
        [
          scenario.scenario,
          index.label,
          index.value,
          index.unit,
          component.label,
          component.input,
          component.inputUnit,
          component.weight,
          component.contribution,
          component.sourceId,
          indexVersion,
        ]
          .map(csvField)
          .join(","),
      );
    }
  }

  return rows;
}

export function toCSV(result: ImpactResult): string {
  const lines = [
    CSV_HEADER.join(","),
    ...scenarioRows(result.inPerson, result.indexVersion),
    ...scenarioRows(result.remote, result.indexVersion),
  ];

  // BOM para que o Excel reconheça UTF-8 e não corrompa os acentos.
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Nome de arquivo estável e ordenável, sem caracteres problemáticos. */
export function exportFilename(
  result: ImpactResult,
  extension: "json" | "csv",
): string {
  const stamp = result.computedAt.replace(/[:.]/g, "-").replace(/Z$/, "");
  return `via-impacto-${stamp}.${extension}`;
}
