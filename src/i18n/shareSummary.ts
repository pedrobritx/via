/**
 * Safe, explicitly requested clipboard summary.
 *
 * Constructed from the already localized aggregate summary and fixed
 * methodological/feasibility caveats only. Never serialize `result.input`,
 * `remoteBlockedReason` or source-location labels.
 */
import type { ImpactResult } from "@/domain/types";
import { DEFAULT_LOCALE, translate, type Locale } from "@/i18n";
import { buildSummary } from "./summary";

export function buildShareSummary(
  result: ImpactResult,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const lines = [
    buildSummary(result, locale),
    `${translate("export.copyVersion", locale)} ${result.indexVersion}`,
  ];

  if (!result.remoteViable) {
    lines.push(translate("export.copyNotViable", locale));
  }
  if (result.inPerson.route?.confidence === "low") {
    lines.push(translate("export.copyLowConfidence", locale));
  }
  lines.push(translate("export.copyCaveat", locale));

  return lines.join("\n\n");
}
