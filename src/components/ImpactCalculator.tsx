"use client";

import { useMemo, useState } from "react";

import type { ImpactResult, IndexBreakdown, ScenarioResult } from "@/domain/types";
import {
  createTranslator,
  formatCurrency,
  formatDuration,
  formatMass,
  formatNumber,
  type Locale,
} from "@/i18n";
import { buildSummary } from "@/i18n/summary";

import { BarCompare } from "./BarCompare";
import { ExportButtons } from "./ExportButtons";
import { ImpactForm, INITIAL_FORM, type FormState } from "./ImpactForm";
import { IndicatorCard } from "./IndicatorCard";
import { JourneyStrip } from "./JourneyStrip";

const INDEX_COLORS: Record<string, string> = {
  carbon: "var(--carbon)",
  time: "var(--time)",
  cost: "var(--cost)",
  burden: "var(--burden)",
  social: "var(--social)",
};

/** Converte o estado do formulário no corpo que a API espera. */
function toRequestBody(form: FormState) {
  const optionalNumber = (raw: string): number | undefined => {
    const trimmed = raw.trim().replace(",", ".");
    if (trimmed.length === 0) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    origin: form.origin,
    destination: form.destination,
    modal: form.modal,
    occupancy: form.occupancy,
    transfers: form.transfers,
    tollBRL: optionalNumber(form.tollBRL),
    parkingBRL: optionalNumber(form.parkingBRL),
    congestionFactor: form.congestionFactor,
    profile: {
      age: form.age,
      mobility: form.mobility,
      requiresCompanion: form.requiresCompanion,
      monthlyIncomeBRL: optionalNumber(form.monthlyIncomeBRL),
      countProductivityLoss: form.countProductivityLoss,
      hasReliableInternet: form.hasReliableInternet,
    },
  };
}

export function ImpactCalculator({ locale = "pt-BR" }: { locale?: Locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scientistMode, setScientistMode] = useState(false);

  const format = useMemo(() => makeFormatter(locale), [locale]);

  async function submit() {
    if (!form.origin || !form.destination) {
      setError(t("form.error.missingPlaces"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toRequestBody(form)),
      });

      const data = await response.json();

      if (!response.ok) {
        const issues = (data.issues ?? []) as Array<{ message: string }>;
        setError(
          issues.length > 0
            ? issues.map((i) => i.message).join(" ")
            : (data.error as string) ?? t("form.error.network"),
        );
        setResult(null);
        return;
      }

      setResult(data as ImpactResult);
    } catch {
      setError(t("form.error.network"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div>
        <ImpactForm
          state={form}
          onChange={setForm}
          onSubmit={submit}
          loading={loading}
          error={error}
          t={t}
        />
      </div>

      {/*
        aria-live garante que quem usa leitor de tela saiba que o resultado
        chegou. Sem isso, o cálculo termina em silêncio e a pessoa fica sem
        saber que a página mudou.
      */}
      <div aria-live="polite" aria-busy={loading}>
        {result ? (
          <Results
            result={result}
            scientistMode={scientistMode}
            onToggleScientist={setScientistMode}
            locale={locale}
            t={t}
            format={format}
          />
        ) : (
          <EmptyState t={t} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

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

function EmptyState({ t }: { t: ReturnType<typeof createTranslator> }) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">{t("results.emptyTitle")}</h2>
      <p className="max-w-sm text-sm text-muted">{t("results.emptyBody")}</p>
    </div>
  );
}

function Results({
  result,
  scientistMode,
  onToggleScientist,
  locale,
  t,
  format,
}: {
  result: ImpactResult;
  scientistMode: boolean;
  onToggleScientist: (value: boolean) => void;
  locale: Locale;
  t: ReturnType<typeof createTranslator>;
  format: Formatter;
}) {
  const indices = (scenario: ScenarioResult): IndexBreakdown[] => [
    scenario.carbon,
    scenario.time,
    scenario.cost,
    scenario.burden,
    scenario.social,
  ];

  const lowConfidence = result.inPerson.route?.confidence === "low";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("results.title")}</h2>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={scientistMode}
            onChange={(e) => onToggleScientist(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          <span className="font-medium">{t("scientist.toggle")}</span>
        </label>
      </header>

      {!result.remoteViable ? (
        <div
          role="note"
          className="rounded-lg border border-warn-line bg-warn-bg px-4 py-3 text-sm text-warn-ink"
        >
          <strong className="block">{t("warning.remoteBlocked.title")}</strong>
          <p className="mt-1">{result.remoteBlockedReason}</p>
        </div>
      ) : null}

      <p className="rounded-lg bg-primary-soft px-4 py-3 text-base font-medium">
        {buildSummary(result, locale)}
      </p>

      {lowConfidence ? (
        <div
          role="note"
          className="rounded-lg border border-warn-line bg-warn-bg px-4 py-3 text-xs text-warn-ink"
        >
          <strong className="block">{t("warning.lowConfidence.title")}</strong>
          <p className="mt-1">{t("warning.lowConfidence.body")}</p>
        </div>
      ) : null}

      <section aria-labelledby="compare-heading" className="flex flex-col gap-4">
        <h3 id="compare-heading" className="text-sm font-semibold">
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

      <section aria-labelledby="detail-heading" className="flex flex-col gap-3">
        <h3 id="detail-heading" className="text-sm font-semibold">
          {t("results.inPerson")}
        </h3>
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
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <JourneyStrip
          time={result.inPerson.time}
          scenario="in_person"
          t={t}
          locale={locale}
        />
        <JourneyStrip
          time={result.remote.time}
          scenario="remote"
          t={t}
          locale={locale}
        />
      </div>

      <div
        role="note"
        className="rounded-lg border border-line bg-sunken px-4 py-3 text-xs text-muted"
      >
        <strong className="block text-ink">{t("warning.normative.title")}</strong>
        <p className="mt-1">{t("warning.normative.body")}</p>
      </div>

      {scientistMode && result.inPerson.route ? (
        <section
          aria-labelledby="raw-heading"
          className="rounded-lg border border-line bg-sunken px-4 py-3"
        >
          <h3 id="raw-heading" className="mb-2 text-sm font-semibold">
            {t("scientist.rawRoute")}
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
            <dt className="text-muted">{t("scientist.provider")}</dt>
            <dd>{result.inPerson.route.providerId}</dd>
            <dt className="text-muted">{t("scientist.confidence")}</dt>
            <dd>
              {t(
                `scientist.confidence.${result.inPerson.route.confidence}` as never,
              )}
            </dd>
            <dt className="text-muted">{t("scientist.distance")}</dt>
            <dd>
              {formatNumber(result.inPerson.route.distanceKm, locale)} km
            </dd>
            <dt className="text-muted">{t("scientist.duration")}</dt>
            <dd>
              {formatNumber(result.inPerson.route.durationMin, locale)} min
            </dd>
            <dt className="text-muted">{t("scientist.indexVersion")}</dt>
            <dd>{result.indexVersion}</dd>
          </dl>
          {result.inPerson.route.note ? (
            <p className="mt-2 text-xs text-muted">
              {result.inPerson.route.note}
            </p>
          ) : null}
        </section>
      ) : null}

      <ExportButtons result={result} t={t} />
    </div>
  );
}
