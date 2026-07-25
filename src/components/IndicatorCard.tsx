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
  const hasWeights = index.components.some((c) => c.weight !== undefined);

  return (
    <section
      className="border border-line bg-paper"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-6 pt-5">
        <h4 className="mono-label">{index.label}</h4>
        <p className="value-hero" style={{ color }}>
          {formatValue(index.value)}
        </p>
      </div>

      {index.uncertainty && index.uncertainty.low !== index.uncertainty.high ? (
        <p className="numeric px-6 pt-2 text-sm text-mute">
          {t("index.uncertainty")}: {formatValue(index.uncertainty.low)}
          {" – "}
          {formatValue(index.uncertainty.high)}
        </p>
      ) : null}

      <div className="px-6 pt-4 pb-5">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="btn-quiet"
        >
          {expanded ? t("index.collapse") : t("index.expand")}
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="flex flex-col gap-8 border-t border-line bg-deep px-6 py-6"
        >
          <div>
            <Heading>{t("index.formula")}</Heading>
            <Formula tex={index.formulaTex} />
          </div>

          {isComposite && index.components.length >= 3 ? (
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
          ) : null}

          <div>
            <Heading>{t("index.components")}</Heading>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="mono-label py-2 pr-4">
                      {t("index.component")}
                    </th>
                    <th scope="col" className="mono-label py-2 pr-4">
                      {t("index.value")}
                    </th>
                    {hasWeights ? (
                      <th scope="col" className="mono-label py-2 pr-4">
                        {t("index.weight")}
                      </th>
                    ) : null}
                    <th scope="col" className="mono-label py-2 text-right">
                      {t("index.contribution")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {index.components.map((c) => (
                    <tr key={c.key} className="border-b border-line/50">
                      <th scope="row" className="py-2 pr-4 font-normal">
                        {c.label}
                      </th>
                      <td className="numeric py-2 pr-4">
                        {formatNumber(c.input, locale)} {c.inputUnit}
                      </td>
                      {hasWeights ? (
                        <td className="numeric py-2 pr-4">
                          {c.weight !== undefined
                            ? formatNumber(c.weight, locale, {
                                style: "percent",
                                maximumFractionDigits: 0,
                              })
                            : "—"}
                        </td>
                      ) : null}
                      <td className="numeric py-2 text-right">
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
              <ul className="flex flex-col gap-1.5 text-sm">
                {index.inputs.map((input) => (
                  <li key={input.key} className="flex flex-wrap gap-x-2">
                    <span className="text-mute">{input.label}:</span>
                    <span className="numeric">
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
              <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-soft">
                {index.caveats.map((caveat) => (
                  <li key={caveat}>{caveat}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <Heading>{t("index.sources")}</Heading>
            <ul className="flex flex-col gap-2 text-sm text-soft">
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
                        className="link"
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

          <p className="mono-label">
            {t("scientist.indexVersion")}: {index.indexVersion}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h5 className="eyebrow-plain mb-3">{children}</h5>;
}
