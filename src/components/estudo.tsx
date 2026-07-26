/**
 * Peças de texto acadêmico: citação, nota, destaque, transcrição.
 *
 * A regra que organiza o arquivo: **a chamada da citação é derivada da entrada
 * bibliográfica**, nunca digitada ao lado dela. Escrever `(Gadenz et al., 2025)`
 * à mão no parágrafo e `2025` na referência cria duas verdades que divergem na
 * primeira correção de ano — e divergem em silêncio, porque as duas continuam
 * parecendo certas. Aqui só existe o `id`; o resto é consequência.
 *
 * Sistema autor-data (NBR 10520:2023). O sobrenome sai em caixa mista, que é a
 * mudança de 2023 mais fácil de errar: a edição anterior pedia caixa alta e
 * quase todo modelo de TCC ainda ensina assim.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { REFERENCIAS_POR_ID } from "@/content/estudo/referencias";

/**
 * Citação entre parênteses (NBR 10520:2023, 6.1.3).
 *
 * `pagina` entra apenas em citação direta, como a norma pede.
 */
export function Cite({ id, pagina }: { id: string; pagina?: string }) {
  const ref = REFERENCIAS_POR_ID[id];
  if (!ref) return <FonteAusente id={id} />;

  return (
    <>
      (
      <a href={`#ref-${id}`} className="link">
        {ref.chamada}
      </a>
      {pagina ? `, p. ${pagina}` : ""})
    </>
  );
}

/**
 * Citação incluída na sentença (NBR 10520:2023, 6.1.4): o sobrenome faz parte
 * da frase e só o ano vai entre parênteses.
 */
export function CiteInline({ id, pagina }: { id: string; pagina?: string }) {
  const ref = REFERENCIAS_POR_ID[id];
  if (!ref) return <FonteAusente id={id} />;

  // `chamada` guarda "Sobrenome, ano"; na sentença o ano se separa.
  const virgula = ref.chamada.lastIndexOf(",");
  const autor = virgula > 0 ? ref.chamada.slice(0, virgula) : ref.chamada;
  const ano = virgula > 0 ? ref.chamada.slice(virgula + 1).trim() : ref.ano;

  return (
    <a href={`#ref-${id}`} className="link">
      {autor} ({ano}
      {pagina ? `, p. ${pagina}` : ""})
    </a>
  );
}

/**
 * Marca visível de citação quebrada.
 *
 * Falhar em silêncio aqui seria o pior desfecho: o parágrafo seguiria legível e
 * a afirmação ficaria sem lastro. Há teste impedindo que isto chegue a produzir
 * render, mas a marca existe para o caso de o teste ser contornado.
 */
function FonteAusente({ id }: { id: string }) {
  return (
    <span className="destaque" style={{ color: "var(--burden)" }}>
      [referência ausente: {id}]
    </span>
  );
}

/** Chamada de nota: numeral sobrescrito que leva ao rodapé. */
export function NotaRef({ n }: { n: number }) {
  return (
    <a
      id={`chamada-${n}`}
      href={`#nota-${n}`}
      className="nota-ref"
      aria-label={`Ver nota ${n}`}
    >
      {n}
    </a>
  );
}

/** Termo definido no próprio texto, com a definição no atributo. */
export function Termo({
  children,
  definicao,
}: {
  children: ReactNode;
  definicao: string;
}) {
  return (
    <dfn className="termo" title={definicao}>
      {children}
    </dfn>
  );
}

/** Destaque de trecho. Fundo lavado e linha inferior — nunca só cor. */
export function Destaque({ children }: { children: ReactNode }) {
  return <mark className="destaque">{children}</mark>;
}

/**
 * Citação direta com mais de três linhas (NBR 10520:2023, 7.1.1):
 * recuada, em corpo menor, espaço simples e **sem aspas**.
 */
export function Transcricao({
  children,
  fonte,
  pagina,
}: {
  children: ReactNode;
  fonte: string;
  pagina?: string;
}) {
  return (
    <blockquote className="bloco-citacao">
      {children} <Cite id={fonte} pagina={pagina} />
    </blockquote>
  );
}

/** Ligação externa, sempre marcada como tal. */
export function Externo({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link">
      {children}
    </a>
  );
}

/** Ligação para outra seção deste mesmo estudo. */
export function Secao({ para, children }: { para: string; children: ReactNode }) {
  return (
    <a href={`#${para}`} className="link">
      {children}
    </a>
  );
}

/** Ligação para outra página do VIA. */
export function Interno({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="link">
      {children}
    </Link>
  );
}
