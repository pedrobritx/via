/**
 * Tipos do estudo e o formatador de referências ABNT.
 *
 * A referência é **gerada** a partir de campos estruturados, nunca digitada
 * como texto corrido. É a mesma disciplina que vale para as constantes do
 * domínio, e pelo mesmo motivo: uma lista de referências escrita à mão adquire
 * pontuação inconsistente na terceira entrada e ninguém percebe, porque cada
 * linha continua parecendo uma referência.
 *
 * Norma aplicada: **NBR 6023:2025** (referências) e **NBR 10520:2023**
 * (citações). Duas consequências práticas dessa edição, ambas contraintuitivas
 * para quem aprendeu a norma antiga:
 *
 * 1. Em citação autor-data, o sobrenome vai em **caixa mista** — `(Silva, 2019)`,
 *    não `(SILVA, 2019)`. A regra de caixa alta foi revogada em 2023. Siglas
 *    institucionais continuam em caixa alta.
 * 2. Na lista de referências, **um único recurso tipográfico** destaca o título,
 *    aplicado igual em todas as entradas. Aqui é negrito: no periódico para
 *    artigos, no próprio título para monografias e relatórios.
 *
 * Este arquivo não conhece React. É dado e formatação de string.
 */

export type TipoReferencia = "artigo" | "relatorio" | "legislacao" | "site";

export interface Referencia {
  /** Âncora e chave de ligação entre citação e lista. */
  id: string;
  /**
   * Como a fonte aparece na chamada autor-data, em caixa mista
   * (NBR 10520:2023, 6.1.1.1). Ex.: `Gadenz et al., 2025`.
   */
  chamada: string;
  /** Autoria já invertida e pontuada: `GADENZ, S. D. et al.` */
  autoria: string;
  /** Título do trabalho, sem ponto final. */
  titulo: string;
  /** Periódico, editora ou órgão publicador. */
  veiculo?: string;
  /** `v. 15, n. 10, e092424` — volume, número, páginas. */
  detalhes?: string;
  local?: string;
  ano: string;
  doi?: string;
  url?: string;
  /** Data de acesso, obrigatória para material online (NBR 6023:2025, 6). */
  acesso?: string;
  tipo: TipoReferencia;
  /** Por que esta fonte está no estudo. Não faz parte da referência ABNT. */
  papel?: string;
}

/**
 * Monta a referência conforme a NBR 6023:2025.
 *
 * Devolve partes em vez de uma string única porque o título destacado precisa
 * sair em `<strong>`, e concatenar HTML aqui obrigaria o componente a confiar
 * numa string — exatamente o tipo de acoplamento que o resto do projeto evita.
 */
export interface ReferenciaFormatada {
  antes: string;
  destaque: string;
  depois: string;
  doi?: string;
  url?: string;
  acesso?: string;
}

export function formatarReferencia(ref: Referencia): ReferenciaFormatada {
  const partes: string[] = [];

  // Em artigo, o destaque é o periódico e o título do artigo vai antes dele.
  // Em monografia, relatório e site, o destaque é o próprio título.
  const ehArtigo = ref.tipo === "artigo";
  const destaque = ehArtigo ? (ref.veiculo ?? "") : ref.titulo;

  const antes = ehArtigo
    ? `${ref.autoria} ${terminar(ref.titulo)} `
    : `${ref.autoria} `;

  if (ehArtigo) {
    if (ref.local) partes.push(ref.local);
    if (ref.detalhes) partes.push(ref.detalhes);
    partes.push(ref.ano);
  } else {
    // Local: Editora, ano.
    const publicacao =
      ref.local && ref.veiculo
        ? `${ref.local}: ${ref.veiculo}`
        : (ref.veiculo ?? ref.local ?? "");
    if (publicacao) partes.push(publicacao);
    partes.push(ref.ano);
  }

  return {
    antes,
    destaque,
    depois: partes.length > 0 ? `, ${partes.join(", ")}.` : ".",
    doi: ref.doi,
    url: ref.url,
    acesso: ref.acesso,
  };
}

/** Garante ponto final sem duplicar quando o título já traz `?` ou `!`. */
function terminar(texto: string): string {
  return /[.?!]$/.test(texto) ? texto : `${texto}.`;
}

/**
 * Ordena alfabeticamente pela entrada, que é a autoria (NBR 6023:2025, 9.1).
 * `localeCompare` em pt-BR para que acentuação não jogue "Ó" depois de "Z".
 */
export function ordenarReferencias(refs: Referencia[]): Referencia[] {
  return [...refs].sort((a, b) => a.autoria.localeCompare(b.autoria, "pt-BR"));
}

// ---------------------------------------------------------------------------

export interface Secao {
  /** Indicativo numérico progressivo (NBR 6024). Ex.: `2`, `2.1`. */
  indicativo: string;
  /** Âncora estável — entra em link e no sumário. */
  id: string;
  titulo: string;
  /**
   * Nível hierárquico, 1 a 5. A NBR 6024 limita a cinco, e o sumário repete
   * exatamente esta hierarquia (NBR 6027).
   */
  nivel: 1 | 2;
}

/*
  A nota de rodapé mora no arquivo de conteúdo, não aqui: o texto dela carrega
  ligações e ênfase, logo é `ReactNode`, e este módulo não conhece React.
*/
