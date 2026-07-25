# Fase 2 — Metodologia e fórmulas

**Agentes:** pesquisa, depois metodologia
**Aprovação humana:** "essa conta faz sentido e é defensável?"

> Fase de maior esforço. Erro aqui não quebra o build — produz número errado com
> aparência de certo.

## Objetivo

Definir os cinco índices: fórmula, pesos, normalização, incerteza e fontes.

## Entregar

- Fórmula de cada índice, em texto e em LaTeX.
- Pesos, somando 1 nas médias ponderadas.
- Toda constante em `parameters.ts` com valor, faixa, unidade e `sourceId`.
- Decomposição em `components` (somáveis) e `inputs` (multiplicativos).
- Ressalvas por índice.
- Casos de teste calculados à mão.
- Limitações registradas em `docs/limitacoes-e-etica.md`.

## Critério de pronto

**Regra de ouro:** a fórmula é explicável em dois minutos para uma pessoa leiga.
Se não for, simplifique ou justifique a complexidade por escrito.

- Contribuições somam o valor do índice. Teste.
- Pesos somam 1. Teste.
- Índices permanecem na faixa em entradas extremas. Teste.
- Toda constante cita fonte existente; toda fonte é usada. Teste.
- Peso normativo marcado como normativo. Teste.
- Nenhuma fonte inventada.

## Arquivos permitidos

`src/domain/`, `docs/metodologia.md`, `docs/referencias.md`,
`docs/limitacoes-e-etica.md`

## Resultado desta fase

`via-idx-0.1.0`. Cinco índices, 91 constantes, 12 fontes.

Decisões de modelagem que uma implementação ingênua erra, todas registradas em
`docs/metodologia.md`: ocupação divide só para quem dirige; táxi paga o trecho
ocioso; congestionamento padrão 1,0 para não contar o trânsito duas vezes; a
consulta entra nos dois cenários; sem renda declarada não há produtividade
imputada; o índice social virou média ponderada normalizada em vez de soma de
pontos avulsos.
