# Fase 3 — UX e fluxo

**Agente:** frontend
**Aprovação humana:** "isso é intuitivo ou só bonito em slide?"

## Objetivo

Desenhar o fluxo de entrada e a apresentação do resultado, com acessibilidade
como requisito e não como acabamento.

## Entregar

- Fluxo de entrada com divulgação progressiva: campos que só aparecem quando o
  modal os torna relevantes.
- Painel de resultado com os cinco indicadores expansíveis.
- Comparação lado a lado e frase-resumo em linguagem simples.
- Visualização da jornada, etapa por etapa.
- Estados de vazio, carregando e erro.
- Microcópia que explica sem condescender.

## Critério de pronto

- Percurso completo por teclado, ordem lógica, foco visível.
- Contraste 4.5:1 **medido**, nos dois temas, sobre todas as superfícies.
- Cor nunca é o único portador de informação.
- Resultado assíncrono anunciado por `aria-live`.
- Layout responde de 320 px sem rolagem horizontal.
- Toda string no catálogo de i18n; toda formatação por `Intl`.

## Arquivos permitidos

`src/components/`, `src/app/`, `src/i18n/`

## Resultado desta fase

A frase-resumo é o elemento central: "Com a teleconsulta, você economiza 1h33,
R$ 20,00 e 666 g de CO₂." O alvo é ser repetível numa conversa — número que
ninguém consegue recontar não muda decisão.

A tira de jornada existe porque "112 minutos" não comunica o que a sequência
casa → ônibus → espera → consulta → volta comunica.
