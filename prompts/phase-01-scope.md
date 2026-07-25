# Fase 1 — Visão e escopo

**Agente:** orquestrador
**Aprovação humana:** "isso é o que vamos construir mesmo?"

## Objetivo

Fixar o problema, o público e os limites do MVP antes de escrever uma linha.

## Entregar

- **Problema**, em uma frase, em termos de quem sofre com ele.
- **Público**: quem usa e o que cada um decide com o resultado.
- **Métricas do produto**: quais índices, em que unidade, para quê.
- **Limites do MVP**: o que fica de fora, explicitamente.
- **Riscos**, com o sinal de alerta de cada um.

## Critério de pronto

- Um leigo lê a definição de problema e reconhece a situação.
- O que está fora do escopo está escrito, não implícito.
- Os riscos incluem os de interpretação, não só os técnicos: qual é o pior uso
  plausível desta ferramenta, e o que no produto o desencoraja?

## Arquivos permitidos

`README.md`, `docs/`

## Resultado desta fase

Problema: o custo real de uma consulta presencial é invisível para quem decide.

Fora do escopo do MVP: persistência, contas de usuário, relatório em lote,
simulação de cenários agregados, PDF, tráfego em tempo real, GTFS.

Risco principal identificado: **falsa precisão**. Um índice de dois dígitos com
barra colorida parece medição. Mitigações adotadas — arredondamento para
múltiplos de 5, rótulo `via-normative-v1` visível, ressalvas viajando junto do
número em `caveats`, e `docs/limitacoes-e-etica.md` aberto no rodapé.

Risco ético identificado: o índice social ser lido como classificação de
pessoas. Mitigação — reenquadramento explícito no código, na interface e na
documentação; o índice mede o peso que a viagem impõe, não a pessoa.
