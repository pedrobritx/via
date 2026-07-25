# Referências

Cada constante do VIA carrega um `sourceId` que aponta para uma entrada desta
lista. Os identificadores são os mesmos que aparecem em
[`src/domain/parameters.ts`](../src/domain/parameters.ts), em
`GET /api/parameters` e na página `/metodologia`.

A lista canônica é a do código — `SOURCES` em `parameters.ts` —, e há teste
garantindo que toda fonte declarada seja usada e que toda constante cite uma
fonte existente. Este documento é a versão legível dela.

---

## Fatores de emissão e clima

### `defra-2024`
**Greenhouse gas reporting: conversion factors**
UK Department for Energy Security and Net Zero (DESNZ/DEFRA), 2024
<https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting>

Base internacional mais completa e transparente para fatores por modal. Reflete
a frota britânica. Onde a frota ou a matriz brasileira divergem de forma
relevante — notadamente eletricidade e etanol — o valor foi ajustado e a
divergência está anotada no próprio parâmetro.

### `ipcc-ar6`
**Sixth Assessment Report, Working Group III: Mitigation of Climate Change**
IPCC, 2022
<https://www.ipcc.ch/report/ar6/wg3/>

Referência para a contabilidade de CO₂ biogênico e para ordens de grandeza por
modal.

### `ghg-protocol-br`
**Programa Brasileiro GHG Protocol — Especificações**
FGV EAESP / WRI Brasil, 2023
<https://www.fgv.br/ghgprotocolo>

Define o tratamento do CO₂ biogênico do etanol: reportado à parte, não somado ao
escopo fóssil. É a base da decisão de contar apenas a parcela fóssil do etanol.

### `ons-matriz-br`
**Fator médio de emissão da geração elétrica do SIN**
Operador Nacional do Sistema Elétrico / MCTI, 2024
<https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/sirene/dados-e-ferramentas/fatores-de-emissao>

A matriz brasileira é atipicamente limpa, com predominância hídrica. Por isso
metrô e teleconsulta emitem muito menos aqui do que fatores europeus sugeririam.
Usar o fator DEFRA de eletricidade sem ajuste superestimaria a emissão desses
modais em cerca de quatro vezes.

---

## Mobilidade e custos

### `antp-mobilidade`
**Sistema de Informações da Mobilidade Urbana — Relatório Geral**
Associação Nacional de Transportes Públicos (ANTP), 2023
<https://www.antp.org.br/simob.html>

Velocidades médias urbanas, tarifas, tempos de espera e ocupação típica do
transporte público nas capitais brasileiras.

### `anp-precos`
**Levantamento de Preços de Combustíveis**
Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP), 2025
<https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos>

Preços médios nacionais. Variam bastante por estado, daí a faixa larga.
**Requer atualização periódica.**

### `ibge-pnad`
**Pesquisa Nacional por Amostra de Domicílios Contínua**
IBGE, 2024
<https://www.ibge.gov.br/estatisticas/sociais/trabalho/17270-pnad-continua.html>

Rendimento domiciliar e jornada de trabalho, usados na conversão de tempo em
dinheiro e na normalização da faixa de renda do índice social.

### `br-salario-minimo`
**Decreto nº 12.342/2024 — Salário mínimo vigente em 2025**
Presidência da República, 2024
<https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12342.htm>

⚠️ **Valor de 2025.** O salário mínimo é reajustado anualmente e este parâmetro
precisa ser revisto todo janeiro. Ele só normaliza a faixa de renda do índice
social; desatualizado, desloca essa faixa sem invalidar os demais índices.

---

## Saúde

### `ms-tempo-consulta`
**Parâmetros para programação de ações e serviços de saúde**
Ministério da Saúde / DataSUS, 2023
<https://datasus.saude.gov.br/>

Base para a duração típica de consulta ambulatorial (15 min) e para o tempo de
espera em unidade.

### `who-equity`
**Global report on health equity for persons with disabilities**
Organização Mundial da Saúde, 2022
<https://www.who.int/publications/i/item/9789240063600>

Fundamenta a premissa de que barreiras de deslocamento pesam de forma
desproporcional sobre pessoas com deficiência e idosas. Sustenta a **direção**
do índice social — não os pesos numéricos, que são do projeto.

---

## Escolhas do projeto

As duas entradas abaixo **não são fontes externas**. Existem para tornar
explícito, no próprio dado, o que é escolha nossa e o que é literatura.

### `via-normative-v1`
**Escolhas normativas do VIA, versão 1**
Projeto VIA, 2026

⚠️ **Não é dado medido.** Os pesos da carga de deslocamento e do impacto social
são um juízo do projeto sobre o que pesa numa viagem, calibrado para ser
defensável e explicável. Estão documentados em
[limitações e ética](limitacoes-e-etica.md) e sujeitos a revisão por pesquisa de
campo. Qualquer uso científico deve tratá-los como hipótese, não como achado.

### `via-operational`
**Premissas operacionais do VIA**
Projeto VIA, 2026

Aproximações de engenharia para o estimador offline: fatores de sinuosidade,
velocidades de modais ativos, tempos de embarque, tarifas de aplicativo.
Escolhidas para dar ordem de grandeza correta sem depender de serviço externo.
Quando há chave de roteamento configurada, os valores reais substituem estes.

---

## Leitura de apoio

Não são fontes de constantes, mas embasam o problema que o VIA endereça.

- **Telemedicina e emissões evitadas.** Estudos de caso hospitalares brasileiros
  e internacionais quantificando CO₂ evitado por consultas remotas. O caso mais
  citado no Brasil — cerca de 50 mil teleconsultas evitando aproximadamente
  939 tCO₂ — é da ordem de grandeza que o VIA reproduz para trajetos
  metropolitanos típicos.
- **Barreira de transporte e faltas em consultas.** Literatura de saúde pública
  sobre não comparecimento associado a dificuldade de deslocamento. É o efeito
  que o VIA **não** mede — ele calcula a viagem que acontece, não a consulta que
  deixou de acontecer — e provavelmente o de maior impacto sanitário.
- **Estresse no trânsito e bem-estar.** Literatura de psicologia ambiental e
  mobilidade urbana que sustenta a direção dos componentes de estresse e
  desconforto, embora não seus valores numéricos.

Contribuições com referências específicas para esses três temas, especialmente
brasileiras, são bem-vindas via issue: elas são o caminho para substituir
`via-normative-v1` por parâmetros medidos.
