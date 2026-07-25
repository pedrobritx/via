/**
 * A jornada, etapa por etapa, com o tempo acumulado em cada ponto.
 *
 * A tira existe porque um total de "112 minutos" não comunica o mesmo que ver
 * a sequência casa → ônibus → espera → consulta → volta. O número diz quanto;
 * a sequência mostra do que ele é feito, e é isso que faz alguém reconhecer a
 * própria manhã ali.
 */

import type { IndexBreakdown } from "@/domain/types";
import { formatDuration, type Locale, type Translator } from "@/i18n";

interface JourneyStripProps {
  time: IndexBreakdown;
  scenario: "in_person" | "remote";
  t: Translator;
  locale: Locale;
}

const STEP_ICONS: Record<string, string> = {
  start: "🏠",
  outbound: "➜",
  modal_overhead: "⏳",
  facility_wait: "🪑",
  consultation: "🩺",
  return: "↩",
  setup: "💻",
};

export function JourneyStrip({
  time,
  scenario,
  t,
  locale,
}: JourneyStripProps) {
  // Ordem de leitura da jornada, que não é a ordem de composição do índice:
  // o overhead do modal acontece junto do deslocamento, não depois dele.
  const order =
    scenario === "remote"
      ? ["setup", "consultation"]
      : [
          "outbound",
          "modal_overhead",
          "facility_wait",
          "consultation",
          "return",
        ];

  const steps = order
    .map((key) => time.components.find((c) => c.key === key))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  let accumulated = 0;

  return (
    <section aria-labelledby="journey-heading" className="flex flex-col gap-3">
      <h3 id="journey-heading" className="text-sm font-semibold">
        {t("journey.title")}
      </h3>

      <ol className="flex flex-col gap-0">
        <li className="flex items-center gap-3">
          <Marker icon={STEP_ICONS.start} />
          <span className="text-sm font-medium">{t("journey.home")}</span>
        </li>

        {steps.map((step) => {
          accumulated += step.contribution;
          return (
            <li key={step.key} className="flex flex-col">
              <Connector />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Marker icon={STEP_ICONS[step.key] ?? "•"} />
                <span className="text-sm">{step.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted">
                  +{formatDuration(step.contribution, locale)}
                </span>
                <span className="ml-auto font-mono text-xs tabular-nums text-muted">
                  {formatDuration(accumulated, locale)} {t("journey.accumulated")}
                </span>
              </div>
            </li>
          );
        })}

        <li className="flex flex-col">
          <Connector />
          <div className="flex items-center gap-3">
            <Marker icon={STEP_ICONS.start} />
            <span className="text-sm font-medium">
              {scenario === "remote" ? t("journey.home") : t("journey.return")}
            </span>
          </div>
        </li>
      </ol>
    </section>
  );
}

function Marker({ icon }: { icon: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs"
    >
      {icon}
    </span>
  );
}

function Connector() {
  return (
    <span
      aria-hidden="true"
      className="ml-3.5 block h-4 w-px bg-line"
    />
  );
}
