"use client";

import { useId, useState } from "react";

import { SOURCES } from "@/domain/parameters";
import type { IndexBreakdown } from "@/domain/types";
import { formatNumber, type Locale, type Translator } from "@/i18n";

import { Formula } from "./Formula";
import { RadarChart } from "./RadarChart";

interface IndicatorCardProps {
  index: IndexBreakdown;
  /**
   * Formata um valor deste índice na unidade de leitura. Recebido pronto em vez
   * de derivado aqui para que o número em destaque e a faixa de incerteza
   * usem sempre a mesma unidade — exibir "676 g" ao lado de "0,436 – 1,199 kg"
   * obriga o leitor a converter de cabeça.
   */
  formatValue: (value: number) => string;
  color: string;
  scientistMode: boolean;
  locale: Locale;
  t: Translator;
}

/**
 * Cartão de um índice, expansível para mostrar a memória de cálculo.
 *
 * Tudo que aparece ao expandir vem do `IndexBreakdown` — fórmula, componentes,
 * entradas, fontes, ressalvas. Nada é escrito à mão aqui. É isso que garante
 * que a explicação não possa divergir do número: ela é o mesmo objeto.
 */
export function IndicatorCard({
  index,
  formatValue,
  color,
  scientistMode,
  locale,
  t,
}: IndicatorCardProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const expanded = open || scientistMode;

  const isComposite = index.key === "burden" || index.key === "social";

  return (
    <section
      className="overflow-hidden rounded-lg border border-line bg-surface"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted">
          {index.label}
        </h3>
        <p className="font-mono text-2xl font-semibold tabular-nums" style={{ color }}>
          {formatValue(index.value)}
        </p>
      </div>

      {index.uncertainty && index.uncertainty.low !== index.uncertainty.high ? (
        <p className="px-4 pt-1 text-xs text-muted">
          {t("index.uncertainty")}: {formatValue(index.uncertainty.low)}
          {" – "}
          {formatValue(index.uncertainty.high)}
        </p>
      ) : null}

      <div className="px-4 pb-3 pt-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium underline underline-offset-2 hover:no-underline"
        >
          {expanded ? t("index.collapse") : t("index.expand")}
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="flex flex-col gap-5 border-t border-line bg-sunken px-4 py-4"
        >
          <div>
            <Heading>{t("index.formula")}</Heading>
            <Formula tex={index.formulaTex} />
          </div>

          {isComposite && index.components.length >= 3 ? (
            <div>
              <RadarChart
                axes={index.components.map((c) => ({
                  label: c.label,
                  // Reconstrói a nota 0–100 a partir da contribuição e do peso.
                  value: c.weight && c.weight > 0 ? c.contribution / c.weight : 0,
                }))}
                title={`${index.label}: composição`}
                description={index.components
                  .map(
                    (c) =>
                      `${c.label}: ${Math.round(
                        c.weight && c.weight > 0 ? c.contribution / c.weight : 0,
                      )} de 100`,
                  )
                  .join("; ")}
                color={color}
              />
            </div>
          ) : null}

          <div>
            <Heading>{t("index.components")}</Heading>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      {t("index.component")}
                    </th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      {t("index.value")}
                    </th>
                    {index.components.some((c) => c.weight !== undefined) ? (
                      <th scope="col" className="py-1.5 pr-3 font-medium">
                        {t("index.weight")}
                      </th>
                    ) : null}
                    <th scope="col" className="py-1.5 text-right font-medium">
                      {t("index.contribution")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {index.components.map((c) => (
                    <tr key={c.key} className="border-b border-line/60">
                      <th scope="row" className="py-1.5 pr-3 font-normal">
                        {c.label}
                      </th>
                      <td className="py-1.5 pr-3 font-mono tabular-nums">
                        {formatNumber(c.input, locale)} {c.inputUnit}
                      </td>
                      {index.components.some((x) => x.weight !== undefined) ? (
                        <td className="py-1.5 pr-3 font-mono tabular-nums">
                          {c.weight !== undefined
                            ? formatNumber(c.weight, locale, {
                                style: "percent",
                                maximumFractionDigits: 0,
                              })
                            : "—"}
                        </td>
                      ) : null}
                      <td className="py-1.5 text-right font-mono tabular-nums">
                        {formatNumber(c.contribution, locale, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {index.inputs.length > 0 ? (
            <div>
              <Heading>{t("index.inputs")}</Heading>
              <ul className="flex flex-col gap-1 text-xs">
                {index.inputs.map((input) => (
                  <li key={input.key} className="flex flex-wrap gap-x-2">
                    <span className="text-muted">{input.label}:</span>
                    <span className="font-mono tabular-nums">
                      {formatNumber(input.value, locale, {
                        maximumFractionDigits: 4,
                      })}{" "}
                      {input.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {index.caveats.length > 0 ? (
            <div>
              <Heading>{t("index.caveats")}</Heading>
              <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs text-muted">
                {index.caveats.map((caveat) => (
                  <li key={caveat}>{caveat}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <Heading>{t("index.sources")}</Heading>
            <ul className="flex flex-col gap-1.5 text-xs text-muted">
              {index.sourceIds.map((id) => {
                const source = SOURCES[id];
                if (!source) return null;
                return (
                  <li key={id}>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                    {" — "}
                    {source.publisher}, {source.year}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="font-mono text-[0.68rem] text-muted">
            {t("scientist.indexVersion")}: {index.indexVersion}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-1.5 text-xs font-semibold tracking-wide uppercase text-muted">
      {children}
    </h4>
  );
}
