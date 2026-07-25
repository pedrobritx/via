/**
 * A jornada, etapa por etapa, com o tempo acumulado em cada ponto.
 *
 * A tira existe porque um total de "112 minutos" não comunica o mesmo que ver
 * a sequência casa → ônibus → espera → consulta → volta. O número diz quanto;
 * a sequência mostra do que ele é feito, e é isso que faz alguém reconhecer a
 * própria manhã ali.
 *
 * Os marcadores são numerais e discos, não pictogramas. Um emoji de cadeira
 * para "espera na unidade" depende de o sistema operacional ter a fonte certa,
 * varia de desenho entre plataformas e é lido em voz alta pelo leitor de tela
 * com um nome que ninguém escolheu. O ordinal não tem nenhum desses problemas
 * e diz a mesma coisa: esta é a etapa três.
 */

import type { IndexBreakdown } from "@/domain/types";
import { formatDuration, type Locale, type Translator } from "@/i18n";

interface JourneyStripProps {
  time: IndexBreakdown;
  scenario: "in_person" | "remote";
  /** Nome do cenário, usado como título da tira. */
  heading: string;
  t: Translator;
  locale: Locale;
}

export function JourneyStrip({
  time,
  scenario,
  heading,
  t,
  locale,
}: JourneyStripProps) {
  // Ordem de leitura da jornada, que não é a ordem de composição do índice:
  // o overhead do modal acontece junto do deslocamento, não depois dele.
  const order =
    scenario === "remote"
      ? ["setup", "consultation"]
      : ["outbound", "modal_overhead", "facility_wait", "consultation", "return"];

  const steps = order
    .map((key) => time.components.find((c) => c.key === key))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  let accumulated = 0;

  return (
    <section className="flex flex-col gap-5">
      <h4 className="subsection-title">{heading}</h4>

      <ol className="flex flex-col">
        <li className="flex items-center gap-4">
          <Terminal />
          <span className="text-ink">{t("journey.home")}</span>
        </li>

        {steps.map((step, position) => {
          accumulated += step.contribution;
          return (
            <li key={step.key} className="flex flex-col">
              <Connector />
              {/*
                Grade, e não `flex-wrap`: com rótulo longo o tempo acumulado
                caía para a linha de baixo e perdia o alinhamento à direita,
                que é justamente o que permite ler a coluna de cima a baixo.
              */}
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <Ordinal n={position + 1} />
                <span className="text-ink">
                  {step.label}{" "}
                  <span className="numeric whitespace-nowrap text-sm text-mute">
                    +{formatDuration(step.contribution, locale)}
                  </span>
                </span>
                <span className="numeric col-start-2 whitespace-nowrap text-sm text-mute sm:col-start-3 sm:text-right">
                  {formatDuration(accumulated, locale)} {t("journey.accumulated")}
                </span>
              </div>
            </li>
          );
        })}

        <li className="flex flex-col">
          <Connector />
          <div className="flex items-center gap-4">
            <Terminal />
            <span className="text-ink">
              {scenario === "remote" ? t("journey.home") : t("journey.return")}
            </span>
          </div>
        </li>
      </ol>
    </section>
  );
}

/** Início e fim da jornada: disco cheio, sem número. */
function Terminal() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green"
    >
      <span className="size-2 rounded-full bg-paper" />
    </span>
  );
}

function Ordinal({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="numeric flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-deep text-xs text-green-deep"
    >
      {n}
    </span>
  );
}

function Connector() {
  return (
    <span aria-hidden="true" className="ml-[0.84rem] block h-5 w-px bg-line" />
  );
}
