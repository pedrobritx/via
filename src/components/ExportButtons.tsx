"use client";

import { exportFilename, toCSV, toJSON } from "@/domain/export";
import type { ImpactResult } from "@/domain/types";
import type { Translator } from "@/i18n";

/**
 * Baixa o resultado em JSON ou CSV.
 *
 * A geração é local — nada é enviado a servidor nenhum para produzir o arquivo.
 * Num sistema que lida com endereço residencial e condição de saúde, o dado não
 * sair do navegador é a única garantia que não depende de confiança.
 */
export function ExportButtons({
  result,
  t,
}: {
  result: ImpactResult;
  t: Translator;
}) {
  function download(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-2">
      <h3 id="export-heading" className="text-sm font-semibold">
        {t("export.title")}
      </h3>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            download(
              toJSON(result),
              exportFilename(result, "json"),
              "application/json",
            )
          }
          className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium"
        >
          {t("export.json")}
        </button>
        <button
          type="button"
          onClick={() =>
            download(toCSV(result), exportFilename(result, "csv"), "text/csv")
          }
          className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium"
        >
          {t("export.csv")}
        </button>
      </div>

      <p className="text-xs text-muted">{t("export.help")}</p>
    </section>
  );
}
