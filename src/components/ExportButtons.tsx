"use client";

import { useState } from "react";

import { exportFilename, toCSV, toJSON } from "@/domain/export";
import type { ImpactResult } from "@/domain/types";
import type { Locale, Translator } from "@/i18n";
import { buildShareSummary } from "@/i18n/shareSummary";

/**
 * Export controls remain local-only. Unlike the existing full JSON/CSV exports,
 * copying a summary deliberately omits the patient profile and exact locations.
 * Clipboard content can be accessed by other apps; disclosure is user-initiated.
 */
export function ExportButtons({
  result,
  t,
  locale,
  stale = false,
}: {
  result: ImpactResult;
  t: Translator;
  locale: Locale;
  stale?: boolean;
}) {
  const [copyState, setCopyState] = useState<{
    resultId: string;
    status: "pending" | "success" | "failure";
  } | null>(null);

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

  const status =
    !stale && copyState?.resultId === result.computedAt
      ? copyState.status
      : null;

  async function copySummary() {
    // Do not silently copy a result invalidated by form changes.
    if (stale || status === "pending") return;
    const resultId = result.computedAt;
    setCopyState({ resultId, status: "pending" });
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(buildShareSummary(result, locale));
      setCopyState({ resultId, status: "success" });
    } catch {
      // No clipboard permission or unsupported browser must not imply success.
      setCopyState({ resultId, status: "failure" });
    }
  }

  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-4">
      <h3 id="export-heading" className="eyebrow">
        {t("export.title")}
      </h3>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            download(
              toJSON(result),
              exportFilename(result, "json"),
              "application/json",
            )
          }
          className="chip"
        >
          {t("export.json")}
        </button>
        <button
          type="button"
          onClick={() =>
            download(toCSV(result), exportFilename(result, "csv"), "text/csv")
          }
          className="chip"
        >
          {t("export.csv")}
        </button>
        <button
          type="button"
          onClick={() => void copySummary()}
          disabled={stale || status === "pending"}
          aria-describedby="copy-summary-privacy"
          className="chip disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("export.copySummary")}
        </button>
      </div>

      <p className="max-w-xl text-sm text-mute">{t("export.help")}</p>
      <p id="copy-summary-privacy" className="max-w-xl text-sm text-mute">
        {t("export.copyPrivacy")}
      </p>
      {stale ? (
        <p className="text-sm text-mute">{t("export.copyStale")}</p>
      ) : null}
      <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-mute">
        {status === "success"
          ? t("export.copySuccess")
          : status === "failure"
            ? t("export.copyFailure")
            : ""}
      </p>
    </section>
  );
}
