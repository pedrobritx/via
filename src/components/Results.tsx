"use client";

/**
 * O painel de resultado.
 *
 * Aqui o sistema editorial cede espaço para estrutura. A narrativa da página
 * é composta e assimétrica; um comparativo de cinco índices em duas condições
 * não é — precisa alinhar, tabular e permitir conferência. A tipografia
 * continua, o ritmo generoso continua, mas os dados ficam em grade.
 *
 * Nenhuma explicação de cálculo é escrita aqui. Tudo que aparece ao expandir
 * um índice vem do `IndexBreakdown` que a função de cálculo devolveu.
 */

import type { ImpactResult, IndexBreakdown, ScenarioResult } from "@/domain/types";
import {
  formatCurrency,
  formatDuration,
  formatMass,
  formatNumber,
  type Locale,
  type Translator,
} from "@/i18n";
import { buildSummary } from "@/i18n/summary";

import { BarCompare } from "./BarCompare";
import { Note } from "./editorial";
import { ExportButtons } from "./ExportButtons";
import { IndicatorCard } from "./IndicatorCard";
import { JourneyStrip } from "./JourneyStrip";

const INDEX_COLORS: Record<string, string> = {
  carbon: "var(--carbon)",
  time: "var(--time)",
  cost: "var(--cost)",
  burden: "var(--burden)",
  social: "var(--social)",
};

type Formatter = (index: IndexBreakdown) => string;

function makeFormatter(locale: Locale): Formatter {
  return (index) => {
    switch (index.key) {
      case "carbon":
        return formatMass(index.value, locale);
      case "time":
        return formatDuration(index.value, locale);
      case "cost":
        return formatCurrency(index.value, locale);
      default:
        return formatNumber(index.value, locale, { maximumFractionDigits: 0 });
    }
  };
}

export function Results({
  result,
  scientistMode,
  onToggleScientist,
  locale,
  t,
}: {
  result: ImpactResult;
  scientistMode: boolean;
  onToggleScientist: (value: boolean) => void;
  locale: Locale;
  t: Translator;
}) {
  const format = makeFormatter(locale);

  const indices = (scenario: ScenarioResult): IndexBreakdown[] => [
    scenario.carbon,
    scenario.time,
    scenario.cost,
    scenario.burden,
    scenario.social,
  ];

  const lowConfidence = result.inPerson.route?.confidence === "low";

  return (
    <div className="mt-4 flex flex-col gap-16">
      {/* A frase que alguém consegue repetir para outra pessoa. */}
      <section aria-labelledby="resumo-heading">
        <h3 id="resumo-heading" className="eyebrow mb-5">
          {t("results.summary.label")}
        </h3>
        <p className="section-title border-l-2 border-gold pl-6">
          {buildSummary(result, locale)}
        </p>
      </section>

      {!result.remoteViable ? (
        <Note tone="warn" title={t("warning.remoteBlocked.title")}>
          {result.remoteBlockedReason}
        </Note>
      ) : null}

      {lowConfidence ? (
        <Note tone="warn" title={t("warning.lowConfidence.title")}>
          {t("warning.lowConfidence.body")}
        </Note>
      ) : null}

      <section aria-labelledby="compare-heading">
        <h3 id="compare-heading" className="eyebrow mb-8">
          {t("results.scenarioCompare")}
        </h3>
        <BarCompare
          inPersonLabel={t("results.inPerson")}
          remoteLabel={t("results.remote")}
          rows={indices(result.inPerson).map((index, i) => {
            const remote = indices(result.remote)[i];
            return {
              key: index.key,
              label: index.label,
              inPerson: index.value,
              remote: remote.value,
              inPersonText: format(index),
              remoteText: format(remote),
              color: INDEX_COLORS[index.key],
            };
          })}
        />
      </section>

      <section aria-labelledby="detalhe-heading">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h3 id="detalhe-heading" className="eyebrow">
            {t("results.inPerson")}
          </h3>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="checkbox"
              checked={scientistMode}
              onChange={(e) => onToggleScientist(e.target.checked)}
            />
            <span className="mono-label text-green">
              {t("scientist.toggle")}
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-4">
          {indices(result.inPerson).map((index) => (
            <IndicatorCard
              key={index.key}
              index={index}
              formatValue={(v) => format({ ...index, value: v })}
              color={INDEX_COLORS[index.key]}
              scientistMode={scientistMode}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="jornada-heading">
        <h3 id="jornada-heading" className="eyebrow mb-8">
          {t("journey.title")}
        </h3>
        <div className="grid gap-12 sm:grid-cols-2">
          <JourneyStrip
            time={result.inPerson.time}
            scenario="in_person"
            heading={t("results.inPerson")}
            t={t}
            locale={locale}
          />
          <JourneyStrip
            time={result.remote.time}
            scenario="remote"
            heading={t("results.remote")}
            t={t}
            locale={locale}
          />
        </div>
      </section>

      <Note title={t("warning.normative.title")}>
        {t("warning.normative.body")}
      </Note>

      {scientistMode && result.inPerson.route ? (
        <section aria-labelledby="rota-heading" className="card px-6 py-5">
          <h3 id="rota-heading" className="eyebrow-plain mb-4">
            {t("scientist.rawRoute")}
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="mono-label">{t("scientist.provider")}</dt>
            <dd className="numeric">{result.inPerson.route.providerId}</dd>
            <dt className="mono-label">{t("scientist.confidence")}</dt>
            <dd>
              {t(
                `scientist.confidence.${result.inPerson.route.confidence}` as never,
              )}
            </dd>
            <dt className="mono-label">{t("scientist.distance")}</dt>
            <dd className="numeric">
              {formatNumber(result.inPerson.route.distanceKm, locale)} km
            </dd>
            <dt className="mono-label">{t("scientist.duration")}</dt>
            <dd className="numeric">
              {formatNumber(result.inPerson.route.durationMin, locale)} min
            </dd>
            <dt className="mono-label">{t("scientist.indexVersion")}</dt>
            <dd className="numeric">{result.indexVersion}</dd>
          </dl>
          {result.inPerson.route.note ? (
            <p className="mt-4 text-sm text-mute">{result.inPerson.route.note}</p>
          ) : null}
        </section>
      ) : null}

      <ExportButtons result={result} t={t} />
    </div>
  );
}
