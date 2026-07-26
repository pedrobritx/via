import type { Metadata } from "next";
import Link from "next/link";

import { EmphasisTitle, Eyebrow } from "@/components/editorial";
import { ArrowIcon, BookIcon, GaugeIcon } from "@/components/icons";
import { SimpleCalculator } from "@/components/SimpleCalculator";
import { createTranslator } from "@/i18n";

export const metadata: Metadata = {
  title: "Calculadora rápida — VIA",
  description:
    "Calcule em poucos campos quanto uma consulta presencial custa em tempo, " +
    "dinheiro e CO₂, comparada a uma teleconsulta. Fórmulas e fontes abertas.",
};

export default function CalculadoraPage() {
  const t = createTranslator("pt-BR");

  return (
    <>
      <header className="masthead">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-6 py-3.5">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="wordmark">{t("app.name")}</span>
            <span className="mono-label hidden sm:inline">
              {t("calc.masthead")}
            </span>
          </Link>
          <nav className="flex gap-6">
            <Link href="/estudo" className="btn-quiet">
              {t("nav.study")}
            </Link>
            <Link href="/metodologia" className="btn-quiet">
              {t("nav.methodology")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-20 pb-24">
        <div className="flex items-center gap-3 text-green">
          <GaugeIcon size={22} />
          <Eyebrow plain>{t("calc.eyebrow")}</Eyebrow>
        </div>

        <EmphasisTitle
          level={1}
          className="display mt-8"
          before={t("calc.title.before")}
          emphasis={t("calc.title.emphasis")}
        />

        <p className="lede mt-8">{t("calc.lede")}</p>

        <div className="mt-16">
          <SimpleCalculator locale="pt-BR" />
        </div>

        <nav
          aria-label={t("nav.methodology")}
          className="mt-20 flex flex-col gap-4 border-t border-line pt-8"
        >
          <Link href="/" className="link flex items-center gap-2.5">
            <ArrowIcon size={16} />
            {t("calc.toFull")}
          </Link>
          <Link href="/estudo" className="link flex items-center gap-2.5">
            <BookIcon size={16} />
            {t("calc.toStudy")}
          </Link>
          <Link href="/metodologia" className="link flex items-center gap-2.5">
            <ArrowIcon size={16} />
            {t("calc.toMethodology")}
          </Link>
        </nav>
      </main>
    </>
  );
}
