# Fase 5 — Transparência e ciência aberta

**Agentes:** frontend, documentação
**Aprovação humana:** "dá para auditar sem chorar?"

## Objetivo

Tornar cada número conferível por alguém de fora do projeto.

## Entregar

- Modo Cientista revelando fórmula, componentes, pesos, entradas e fontes.
- Página pública de metodologia, **gerada do catálogo de parâmetros**.
- Endpoint publicando todas as constantes, faixas, fontes e versão.
- Exportação em JSON e CSV, carregando versão e `sourceId`.
- `docs/limitacoes-e-etica.md`, `glossario.md`, `referencias.md`, ADRs.

## Critério de pronto

- **Nenhuma explicação escrita à mão.** O Modo Cientista renderiza o
  `IndexBreakdown`; a página de metodologia é gerada. Não pode existir caminho
  em que o texto divirja do número.
- Nenhum valor de constante copiado para Markdown.
- Todo exemplo de documentação foi executado.
- A exportação permite refazer a conta.
- Os ADRs registram as consequências ruins, não só as boas.

## Arquivos permitidos

`src/components/`, `src/app/`, `src/domain/catalog.ts`, `src/domain/export.ts`,
`docs/`

## Resultado desta fase

`GET /api/parameters` publica 91 constantes em 6 grupos com 12 fontes. A página
`/metodologia` renderiza a mesma estrutura. O Modo Cientista renderiza o objeto
que a função de cálculo devolveu — que é o que impede a divergência.

`docs/limitacoes-e-etica.md` termina com uma seção sobre onde o próprio
documento de limitações pode estar errado.
