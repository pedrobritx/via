import type { Metadata } from "next";
import Link from "next/link";

import { EmphasisTitle, Eyebrow, Note } from "@/components/editorial";
import { buildParameterCatalog } from "@/domain/catalog";
import { createTranslator, formatNumber } from "@/i18n";

export const metadata: Metadata = {
  title: "Como calculamos — VIA",
  description:
    "Todas as constantes usadas pelo VIA, com faixa de incerteza e fonte. Página gerada a partir do próprio código.",
};

/**
 * A página é gerada do catálogo de parâmetros, nunca escrita à mão.
 *
 * Uma tabela de constantes redigida em Markdown ao lado do código diverge dele
 * na primeira mudança de peso, e a divergência passa despercebida justamente
 * porque o texto continua plausível. Aqui não há como: a fonte é o mesmo
 * módulo que o cálculo usa.
 */
export default function MethodologyPage() {
  const t = createTranslator("pt-BR");
  const catalog = buildParameterCatalog();

  return (
    <>
      <header className="masthead">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-6 py-3.5">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="wordmark">VIA</span>
            <span className="mono-label hidden sm:inline">
              {t("app.fullName")}
            </span>
          </Link>
          <Link href="/" className="btn-quiet">
            {t("methodology.backToCalculator")}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-20 pb-24">
        <Eyebrow>{t("methodology.version")} · {catalog.indexVersion}</Eyebrow>

        <EmphasisTitle
          level={1}
          className="display mt-8 max-w-3xl"
          before="Como o VIA"
          emphasis="calcula"
        />

        <p className="lede mt-10">{t("methodology.intro")}</p>

        <div className="mt-12">
          <Note tone="warn">{t("methodology.normativeWarning")}</Note>
        </div>

        <nav aria-label="Seções" className="mt-12 border-t border-line pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {catalog.groups.map((group) => (
              <li key={group.id}>
                <a href={`#${group.id}`} className="link text-sm">
                  {group.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#referencias" className="link text-sm">
                {t("methodology.sourcesTitle")}
              </a>
            </li>
          </ul>
        </nav>

        {catalog.groups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="mt-20 scroll-mt-20 border-t border-line pt-10"
          >
            <h2 className="section-title">{group.title}</h2>
            <p className="lede mt-4 mb-8">{group.description}</p>

            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                <thead className="bg-deep">
                  <tr>
                    <th scope="col" className="mono-label px-4 py-3">
                      {t("methodology.parameter")}
                    </th>
                    <th scope="col" className="mono-label px-4 py-3 text-right">
                      {t("index.value")}
                    </th>
                    <th scope="col" className="mono-label px-4 py-3 text-right">
                      {t("methodology.range")}
                    </th>
                    <th scope="col" className="mono-label px-4 py-3">
                      {t("methodology.unit")}
                    </th>
                    <th scope="col" className="mono-label px-4 py-3">
                      {t("methodology.source")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry) => {
                    const normative = entry.sourceId === "via-normative-v1";
                    return (
                        <tr
                          key={entry.key}
                          className="border-t border-line align-top"
                        >
                          <th scope="row" className="px-4 py-3 font-normal">
                            <span className="numeric text-xs text-ink">
                              {entry.key}
                            </span>
                            {entry.note ? (
                              <span className="mt-1.5 block max-w-md text-sm text-mute">
                                {entry.note}
                              </span>
                            ) : null}
                          </th>
                          <td className="numeric px-4 py-3 text-right text-xs">
                            {formatNumber(entry.value, "pt-BR", {
                              maximumFractionDigits: 4,
                            })}
                          </td>
                          <td className="numeric px-4 py-3 text-right text-xs text-mute">
                            {entry.low === entry.high
                              ? "—"
                              : `${formatNumber(entry.low, "pt-BR", {
                                  maximumFractionDigits: 4,
                                })} – ${formatNumber(entry.high, "pt-BR", {
                                  maximumFractionDigits: 4,
                                })}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-mute">
                            {entry.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <a href={`#fonte-${entry.sourceId}`} className="link">
                              {entry.sourceId}
                            </a>
                            {normative ? (
                              <span className="mono-label mt-1 block text-warn-ink">
                                normativo
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section
          id="referencias"
          className="mt-20 scroll-mt-20 border-t border-line pt-10"
        >
          <h2 className="section-title mb-8">{t("methodology.sourcesTitle")}</h2>
          <ul className="flex flex-col gap-6">
            {catalog.sources.map((source) => (
              <li
                key={source.id}
                id={`fonte-${source.id}`}
                className="card scroll-mt-20 px-6 py-5"
              >
                <p className="mono-label">{source.id}</p>
                <p className="subsection-title mt-2">
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
                </p>
                <p className="mt-1 text-sm text-mute">
                  {source.publisher}, {source.year}
                </p>
                {source.note ? (
                  <p className="mt-3 text-sm text-soft">{source.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
