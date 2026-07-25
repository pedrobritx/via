import Link from "next/link";

import { ImpactCalculator } from "@/components/ImpactCalculator";
import { createTranslator } from "@/i18n";

export default function Home() {
  const t = createTranslator("pt-BR");

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-ink"
      >
        {t("nav.skipToContent")}
      </a>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t("app.name")}
              <span className="ml-2 text-sm font-normal text-muted">
                {t("app.fullName")}
              </span>
            </h1>
            <p className="mt-0.5 text-sm text-muted">{t("app.tagline")}</p>
          </div>

          <nav>
            <Link
              href="/metodologia"
              className="text-sm font-medium underline underline-offset-4 hover:no-underline"
            >
              {t("nav.methodology")}
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <ImpactCalculator locale="pt-BR" />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-5 text-xs text-muted">
          <Link href="/metodologia" className="underline underline-offset-2">
            {t("footer.methodology")}
          </Link>
          <a
            href="https://github.com/pedrobritx/via/blob/main/docs/limitacoes-e-etica.md"
            className="underline underline-offset-2"
          >
            {t("footer.limitations")}
          </a>
          <a
            href="https://github.com/pedrobritx/via/blob/main/docs/api.md"
            className="underline underline-offset-2"
          >
            {t("footer.api")}
          </a>
          <span className="ml-auto">{t("footer.license")}</span>
        </div>
      </footer>
    </>
  );
}
