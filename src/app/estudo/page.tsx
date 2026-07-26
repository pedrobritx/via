import type { Metadata } from "next";
import Link from "next/link";

import { EmphasisTitle, Eyebrow, Note, Ornament } from "@/components/editorial";
import { BookIcon } from "@/components/icons";
import {
  CORPO,
  META,
  NOTAS,
  PALAVRAS_CHAVE,
  RESUMO,
  SECOES,
} from "@/content/estudo/pt-BR";
import { REFERENCIAS } from "@/content/estudo/referencias";
import { formatarReferencia, ordenarReferencias } from "@/content/estudo/tipos";
import { createTranslator } from "@/i18n";

export const metadata: Metadata = {
  title: "O custo invisível de uma consulta presencial — VIA",
  description:
    "Fundamentação, método e limites do Visualizador de Impacto Assistencial. " +
    "Evidência sobre emissões evitadas por telemedicina, barreira de transporte no " +
    "acesso à saúde e a distinção entre o que é medido e o que é escolha do projeto.",
};

/**
 * O estudo.
 *
 * Sumário, corpo e lista de referências saem todos da mesma estrutura de dados.
 * A NBR 6027 exige que a hierarquia do sumário seja idêntica à do texto, e a
 * forma barata de garantir isso é não ter dois lugares onde a hierarquia possa
 * ser escrita.
 */
export default function EstudoPage() {
  const t = createTranslator("pt-BR");
  const referencias = ordenarReferencias(REFERENCIAS);

  return (
    <>
      <header className="masthead">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-6 py-3.5">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="wordmark">{t("app.name")}</span>
            <span className="mono-label hidden sm:inline">
              {t("study.masthead")}
            </span>
          </Link>
          <Link href="/" className="btn-quiet">
            {t("study.backHome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-20 pb-24">
        {/* ------------------------------------------------------ folha de rosto */}
        <div className="flex items-center gap-3 text-green">
          <BookIcon size={22} />
          <Eyebrow plain>{t("study.eyebrow")}</Eyebrow>
        </div>

        <h1 className="display mt-8">{META.titulo}</h1>
        <p className="lede mt-6 max-w-2xl">{META.subtitulo}</p>

        <dl className="mono-label mt-10 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-5">
          <div className="flex gap-2">
            <dt>{t("study.version")}</dt>
            <dd className="text-ink">{META.versao}</dd>
          </div>
          <div className="flex gap-2">
            <dt>{t("study.date")}</dt>
            <dd className="text-ink">{META.data}</dd>
          </div>
        </dl>

        {/* ------------------------------------------------------------- resumo */}
        <section aria-labelledby="resumo" className="mt-16">
          <h2 id="resumo" className="eyebrow mb-5">
            {t("study.abstract")}
          </h2>
          <p className="text-soft">{RESUMO}</p>
          <p className="mt-5 text-sm text-mute">
            <strong className="mono-label">{t("study.keywords")}</strong>{" "}
            {PALAVRAS_CHAVE.join("; ")}.
          </p>
        </section>

        {/* ------------------------------------------------------------ sumário */}
        <nav aria-labelledby="sumario" className="mt-16 border-t border-line pt-8">
          <h2 id="sumario" className="eyebrow mb-5">
            {t("study.contents")}
          </h2>
          <ol className="sumario">
            {SECOES.map((secao) => (
              <li
                key={secao.id}
                className={secao.nivel === 2 ? "ml-6" : undefined}
              >
                <a href={`#${secao.id}`}>
                  <span className="indicativo">{secao.indicativo}</span>
                  <span>{secao.titulo}</span>
                  <span className="preenchimento" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Ornament />

        {/* -------------------------------------------------------------- corpo */}
        {SECOES.map((secao) => {
          const Cabecalho = secao.nivel === 1 ? "h2" : "h3";
          return (
            <section
              key={secao.id}
              id={secao.id}
              className={`scroll-mt-20 ${secao.nivel === 1 ? "mt-16" : "mt-12"}`}
            >
              <Cabecalho
                className={
                  secao.nivel === 1
                    ? "section-title mb-6"
                    : "subsection-title mb-4"
                }
              >
                {/*
                  Indicativo e título separados por espaço, sem ponto nem
                  travessão — a NBR 6024 é explícita quanto a não haver
                  pontuação entre um e outro.

                  O espaço é um caractere de verdade, não só a margem do CSS:
                  sem ele o nome acessível do cabeçalho vira "1Introdução", e
                  quem ouve a página perde a fronteira entre número e título.
                */}
                <span className="numeric mr-1 text-green">
                  {secao.indicativo}
                </span>{" "}
                {secao.titulo}
              </Cabecalho>

              <div className="flex flex-col gap-5">{CORPO[secao.id]}</div>
            </section>
          );
        })}

        <Ornament />

        {/* -------------------------------------------------------------- notas */}
        <section aria-labelledby="notas" className="mt-16 border-t border-line pt-8">
          <h2 id="notas" className="eyebrow mb-6">
            {t("study.notes")}
          </h2>
          <ol className="flex flex-col gap-4">
            {NOTAS.map((nota) => (
              <li
                key={nota.n}
                id={`nota-${nota.n}`}
                className="nota-rodape flex scroll-mt-20 gap-3"
              >
                <a
                  href={`#chamada-${nota.n}`}
                  className="numeric shrink-0 text-green"
                  aria-label={`Voltar ao texto da nota ${nota.n}`}
                >
                  {nota.n}
                </a>
                <span>{nota.texto}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* -------------------------------------------------------- referências */}
        <section
          aria-labelledby="referencias"
          className="mt-16 border-t border-line pt-8"
        >
          <h2 id="referencias" className="eyebrow mb-6">
            {t("study.references")}
          </h2>

          <div className="mb-8">
            <Note>{t("study.references.note")}</Note>
          </div>

          <ol className="flex flex-col gap-5">
            {referencias.map((ref) => {
              const f = formatarReferencia(ref);
              return (
                <li
                  key={ref.id}
                  id={`ref-${ref.id}`}
                  className="referencia scroll-mt-20"
                >
                  <p>
                    {f.antes}
                    <strong>{f.destaque}</strong>
                    {f.depois}
                    {f.doi ? (
                      <>
                        {" "}
                        DOI:{" "}
                        <a
                          href={`https://doi.org/${f.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link"
                        >
                          {f.doi}
                        </a>
                        .
                      </>
                    ) : null}
                    {f.url && !f.doi ? (
                      <>
                        {" "}
                        Disponível em:{" "}
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link break-all"
                        >
                          {f.url}
                        </a>
                        .
                      </>
                    ) : null}
                    {f.acesso ? ` Acesso em: ${f.acesso}.` : null}
                  </p>
                  {ref.papel ? (
                    <p className="mt-1.5 text-sm text-mute">{ref.papel}</p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ------------------------------------------------------------ rodapé */}
        <div className="mt-20 border-t border-line pt-8">
          <EmphasisTitle
            className="subsection-title"
            before={t("study.cta.before")}
            emphasis={t("study.cta.emphasis")}
            level={2}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/calculadora" className="btn">
              {t("study.cta.calculator")}
            </Link>
            <Link href="/metodologia" className="btn-quiet self-center">
              {t("study.cta.methodology")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
