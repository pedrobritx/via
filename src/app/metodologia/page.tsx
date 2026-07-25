import type { Metadata } from "next";
import Link from "next/link";

import { buildParameterCatalog } from "@/domain/catalog";
import { createTranslator, formatNumber } from "@/i18n";

export const metadata: Metadata = {
  title: "Como calculamos — VIA",
  description:
    "Todas as constantes usadas pelo VIA, com faixa de incerteza e fonte. Página gerada a partir do próprio código.",
};

export default function MethodologyPage() {
  const t = createTranslator("pt-BR");
  const catalog = buildParameterCatalog();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            href="/"
            className="text-sm underline underline-offset-4 hover:no-underline"
          >
            ← {t("methodology.backToCalculator")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {t("methodology.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {t("methodology.intro")}
          </p>
          <p className="mt-3 font-mono text-xs text-muted">
            {t("methodology.version")}: {catalog.indexVersion}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div
          role="note"
          className="mb-8 rounded-lg border border-warn-line bg-warn-bg px-4 py-3 text-sm text-warn-ink"
        >
          {t("methodology.normativeWarning")}
        </div>

        <nav aria-label="Seções" className="mb-8">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {catalog.groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#${group.id}`}
                  className="underline underline-offset-2 hover:no-underline"
                >
                  {group.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#referencias"
                className="underline underline-offset-2 hover:no-underline"
              >
                {t("methodology.sourcesTitle")}
              </a>
            </li>
          </ul>
        </nav>

        {catalog.groups.map((group) => (
          <section key={group.id} id={group.id} className="mb-12 scroll-mt-6">
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <p className="mb-3 mt-1 text-sm text-muted">{group.description}</p>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                <thead className="bg-sunken">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      {t("methodology.parameter")}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      {t("index.value")}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      {t("methodology.range")}
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      {t("methodology.unit")}
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
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
                        <th
                          scope="row"
                          className="px-3 py-2 font-mono text-xs font-normal"
                        >
                          {entry.key}
                          {entry.note ? (
                            <span className="mt-1 block max-w-md font-sans text-xs text-muted">
                              {entry.note}
                            </span>
                          ) : null}
                        </th>
                        <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                          {formatNumber(entry.value, "pt-BR", {
                            maximumFractionDigits: 4,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted">
                          {entry.low === entry.high
                            ? "—"
                            : `${formatNumber(entry.low, "pt-BR", {
                                maximumFractionDigits: 4,
                              })} – ${formatNumber(entry.high, "pt-BR", {
                                maximumFractionDigits: 4,
                              })}`}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted">
                          {entry.unit}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <a
                            href={`#fonte-${entry.sourceId}`}
                            className="underline underline-offset-2"
                          >
                            {entry.sourceId}
                          </a>
                          {normative ? (
                            <span className="ml-1.5 rounded bg-warn-bg px-1.5 py-0.5 text-[0.65rem] font-medium text-warn-ink">
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

        <section id="referencias" className="scroll-mt-6">
          <h2 className="mb-3 text-lg font-semibold">
            {t("methodology.sourcesTitle")}
          </h2>
          <ul className="flex flex-col gap-4">
            {catalog.sources.map((source) => (
              <li
                key={source.id}
                id={`fonte-${source.id}`}
                className="scroll-mt-6 rounded-lg border border-line bg-surface px-4 py-3"
              >
                <p className="font-mono text-xs text-muted">{source.id}</p>
                <p className="mt-0.5 font-medium">
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
                </p>
                <p className="text-sm text-muted">
                  {source.publisher}, {source.year}
                </p>
                {source.note ? (
                  <p className="mt-1.5 text-sm text-muted">{source.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
