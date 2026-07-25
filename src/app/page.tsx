import Link from "next/link";

import { EmphasisTitle, Eyebrow, Ornament, Reveal } from "@/components/editorial";
import { GuidedFlow } from "@/components/GuidedFlow";
import { createTranslator, type MessageKey } from "@/i18n";

/**
 * A página é uma leitura, não um painel.
 *
 * O herói e o bloco das cinco medidas são estáticos e renderizados no
 * servidor: quem chega lê o que a ferramenta faz antes de qualquer JavaScript
 * carregar. Só o percurso guiado é interativo, e ele começa depois.
 */

const MEASURES: Array<{
  key: string;
  label: MessageKey;
  body: MessageKey;
  color: string;
}> = [
  {
    key: "carbon",
    label: "index.carbon",
    body: "measures.carbon.body",
    color: "var(--carbon)",
  },
  {
    key: "time",
    label: "index.time",
    body: "measures.time.body",
    color: "var(--time)",
  },
  {
    key: "cost",
    label: "index.cost",
    body: "measures.cost.body",
    color: "var(--cost)",
  },
  {
    key: "burden",
    label: "index.burden",
    body: "measures.burden.body",
    color: "var(--burden)",
  },
  {
    key: "social",
    label: "index.social",
    body: "measures.social.body",
    color: "var(--social)",
  },
];

export default function Home() {
  const t = createTranslator("pt-BR");

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-green-deep focus:px-4 focus:py-2 focus:text-paper">
        {t("nav.skipToContent")}
      </a>

      <header className="masthead">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-6 py-3.5">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="wordmark">{t("app.name")}</span>
            <span className="mono-label hidden sm:inline">
              {t("app.fullName")}
            </span>
          </Link>

          <nav>
            <Link href="/metodologia" className="btn-quiet">
              {t("nav.methodology")}
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {/* ----------------------------------------------------------- herói */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <Reveal>
            <Eyebrow>{t("hero.eyebrow")}</Eyebrow>

            <EmphasisTitle
              level={1}
              className="display mt-8 max-w-4xl"
              before={t("hero.title.before")}
              emphasis={t("hero.title.emphasis")}
            />

            <p className="lede mt-10 max-w-2xl">{t("hero.lede")}</p>

            <div className="mt-14 flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-line pt-5">
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                <div>
                  <dt className="mono-label">{t("hero.meta.indices")}</dt>
                  <dd className="numeric mt-1 text-ink">5</dd>
                </div>
                <div>
                  <dt className="mono-label">{t("hero.meta.sources")}</dt>
                  <dd className="numeric mt-1 text-ink">12</dd>
                </div>
                <div>
                  <dt className="mono-label">{t("hero.meta.open")}</dt>
                  <dd className="mt-1">
                    <Link href="/metodologia" className="link text-sm">
                      {t("hero.meta.openLink")}
                    </Link>
                  </dd>
                </div>
              </dl>

              <p className="mono-label ml-auto text-green">
                <span aria-hidden="true">↓ </span>
                {t("hero.cue")}
              </p>
            </div>
          </Reveal>
        </section>

        <Ornament />

        {/* -------------------------------------------------- cinco medidas */}
        <section
          aria-labelledby="medidas-heading"
          className="mx-auto max-w-5xl px-6 pt-24 pb-8 sm:pt-32"
        >
          <Reveal>
            <Eyebrow>{t("measures.eyebrow")}</Eyebrow>
            <EmphasisTitle
              id="medidas-heading"
              className="section-title mt-5 max-w-2xl"
              before={t("measures.title.before")}
              emphasis={t("measures.title.emphasis")}
            />
            <p className="lede mt-6">{t("measures.lede")}</p>
          </Reveal>

          <dl className="mt-16">
            {MEASURES.map((measure) => (
              <Reveal key={measure.key}>
                <div className="grid gap-x-10 gap-y-3 border-t border-line py-8 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
                  <dt
                    className="subsection-title border-l-2 pl-4 sm:border-l-0 sm:pl-0"
                    style={{ borderColor: measure.color }}
                  >
                    <span
                      aria-hidden="true"
                      className="mr-2.5 hidden h-2.5 w-2.5 sm:inline-block"
                      style={{ backgroundColor: measure.color }}
                    />
                    {t(measure.label)}
                  </dt>
                  <dd className="text-soft">{t(measure.body)}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* -------------------------------------------------- percurso guiado */}
        <div className="mx-auto max-w-5xl px-6 pb-24">
          <GuidedFlow locale="pt-BR" />
        </div>
      </main>

      <footer className="inverted">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="eyebrow">{t("footer.builtWith")}</p>

          <nav className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
            <Link href="/metodologia" className="link">
              {t("footer.methodology")}
            </Link>
            <a
              href="https://github.com/pedrobritx/via/blob/main/docs/limitacoes-e-etica.md"
              className="link"
            >
              {t("footer.limitations")}
            </a>
            <a
              href="https://github.com/pedrobritx/via/blob/main/docs/api.md"
              className="link"
            >
              {t("footer.api")}
            </a>
          </nav>

          <p className="eyebrow-plain mt-10">{t("footer.license")}</p>
        </div>
      </footer>
    </>
  );
}
