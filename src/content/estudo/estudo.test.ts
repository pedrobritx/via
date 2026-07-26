/**
 * Integridade do estudo.
 *
 * A regra que estes testes protegem é a segunda das cinco proibições do
 * projeto: **nenhuma fonte inventada**. Uma citação que aponta para uma
 * referência inexistente não quebra a página — ela renderiza um parágrafo
 * perfeitamente legível cuja afirmação não tem lastro, e é exatamente esse
 * silêncio que a torna perigosa.
 *
 * O arquivo de conteúdo é lido como texto, não importado, porque o que se quer
 * verificar é o que está escrito ali — inclusive uma citação que o TypeScript
 * aceitaria de bom grado, já que `id` é apenas `string`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { REFERENCIAS, REFERENCIAS_POR_ID } from "./referencias";
import { SECOES, CORPO, NOTAS } from "./pt-BR";
import { formatarReferencia, ordenarReferencias } from "./tipos";

const FONTE = readFileSync(join(__dirname, "pt-BR.tsx"), "utf8");

/** Todo `id="..."` usado num `<Cite>` ou `<CiteInline>` do conteúdo. */
function idsCitados(): string[] {
  const encontrados = new Set<string>();
  const padrao = /<Cite(?:Inline)?\s+id="([^"]+)"/g;
  for (const m of FONTE.matchAll(padrao)) encontrados.add(m[1]);

  // `<Transcricao fonte="...">` também é uma citação, com outra sintaxe.
  for (const m of FONTE.matchAll(/<Transcricao\s+fonte="([^"]+)"/g)) {
    encontrados.add(m[1]);
  }
  return [...encontrados];
}

describe("citações e referências", () => {
  it("toda citação do texto aponta para uma referência existente", () => {
    for (const id of idsCitados()) {
      expect(
        REFERENCIAS_POR_ID[id],
        `o texto cita "${id}", que não existe na bibliografia`,
      ).toBeDefined();
    }
  });

  it("toda referência da bibliografia é citada ao menos uma vez", () => {
    const citados = new Set(idsCitados());
    for (const ref of REFERENCIAS) {
      expect(
        citados.has(ref.id),
        `"${ref.id}" está na bibliografia mas nunca é citada — ` +
          "referência não usada infla a lista sem sustentar nada",
      ).toBe(true);
    }
  });

  it("o texto cita ao menos uma fonte", () => {
    expect(idsCitados().length).toBeGreaterThan(0);
  });

  it("nenhum identificador de referência se repete", () => {
    const ids = REFERENCIAS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("campos obrigatórios da referência (NBR 6023:2025)", () => {
  it("toda entrada traz autoria, título e ano", () => {
    for (const ref of REFERENCIAS) {
      expect(ref.autoria.trim().length, `${ref.id}: autoria`).toBeGreaterThan(0);
      expect(ref.titulo.trim().length, `${ref.id}: título`).toBeGreaterThan(0);
      expect(ref.ano, `${ref.id}: ano`).toMatch(/^\d{4}$/);
    }
  });

  it("todo material online declara data de acesso", () => {
    for (const ref of REFERENCIAS) {
      if (!ref.url && !ref.doi) continue;
      expect(
        ref.acesso,
        `${ref.id}: material online exige "Acesso em:"`,
      ).toBeTruthy();
    }
  });

  it("a chamada autor-data usa caixa mista, não caixa alta", () => {
    // A NBR 10520:2023 revogou a caixa alta. Siglas continuam permitidas, então
    // a checagem procura palavra longa inteiramente maiúscula.
    for (const ref of REFERENCIAS) {
      const caixaAlta = ref.chamada
        .split(/[\s,;]+/)
        .filter((p) => p.length > 5 && p === p.toUpperCase() && /[A-ZÀ-Ú]/.test(p));
      expect(
        caixaAlta,
        `${ref.id}: "${ref.chamada}" parece usar a caixa alta revogada em 2023`,
      ).toEqual([]);
    }
  });

  it("a referência formatada não deixa pontuação dobrada nem lacuna", () => {
    for (const ref of REFERENCIAS) {
      const f = formatarReferencia(ref);
      const inteira = `${f.antes}${f.destaque}${f.depois}`;
      expect(inteira, `${ref.id}`).not.toMatch(/\.\./);
      expect(inteira, `${ref.id}`).not.toMatch(/,,/);
      expect(inteira, `${ref.id}`).not.toMatch(/\s{2,}/);
      expect(f.destaque.trim().length, `${ref.id}: destaque vazio`).toBeGreaterThan(0);
    }
  });

  it("ordena alfabeticamente pela autoria", () => {
    const ordenadas = ordenarReferencias(REFERENCIAS).map((r) => r.autoria);
    const esperado = [...ordenadas].sort((a, b) => a.localeCompare(b, "pt-BR"));
    expect(ordenadas).toEqual(esperado);
  });
});

describe("estrutura do documento", () => {
  it("toda seção do sumário tem corpo, e todo corpo tem seção", () => {
    const idsSecoes = SECOES.map((s) => s.id);
    for (const id of idsSecoes) {
      expect(CORPO[id], `seção "${id}" está no sumário e não tem corpo`).toBeDefined();
    }
    for (const id of Object.keys(CORPO)) {
      expect(
        idsSecoes,
        `"${id}" tem corpo mas não aparece no sumário`,
      ).toContain(id);
    }
  });

  it("o indicativo numérico é progressivo e coerente com o nível", () => {
    for (const secao of SECOES) {
      const partes = secao.indicativo.split(".");
      expect(
        partes.length,
        `"${secao.indicativo}" não corresponde ao nível ${secao.nivel}`,
      ).toBe(secao.nivel);
      for (const p of partes) expect(p).toMatch(/^\d+$/);
    }
  });

  it("nenhum identificador de seção se repete", () => {
    const ids = SECOES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda chamada de nota no texto tem nota correspondente, e vice-versa", () => {
    const chamadas = new Set(
      [...FONTE.matchAll(/<NotaRef\s+n=\{(\d+)\}/g)].map((m) => Number(m[1])),
    );
    const definidas = new Set(NOTAS.map((n) => n.n));

    for (const n of chamadas) {
      expect(definidas.has(n), `o texto chama a nota ${n}, que não existe`).toBe(true);
    }
    for (const n of definidas) {
      expect(chamadas.has(n), `a nota ${n} existe mas nunca é chamada`).toBe(true);
    }
  });

  it("as notas são numeradas em sequência a partir de 1", () => {
    const numeros = NOTAS.map((n) => n.n).sort((a, b) => a - b);
    expect(numeros).toEqual(numeros.map((_, i) => i + 1));
  });
});
