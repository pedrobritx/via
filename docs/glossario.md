# Glossário

Termos usados no código, na interface e na documentação do VIA.

---

### Carga de deslocamento

Índice composto de 0 a 100 que sintetiza o esforço de uma viagem: tempo,
estresse, desconforto, dificuldade de estacionar e imprevisibilidade. Pesos
normativos. Serve para comparar cenários entre si, não como grandeza absoluta.

### Cenário

Um dos dois modos de atendimento comparados: `in_person` (presencial) ou
`remote` (teleconsulta). Cada cenário recebe os cinco índices.

### Componente (`IndexComponent`)

Parcela **somável** de um índice. As contribuições de todos os componentes somam
exatamente o valor do índice — há teste garantindo isso. Distinto de *entrada*.

### Confiança (`confidence`)

Qualifica uma estimativa de rota: `low` (estimador geométrico, nenhuma rua
consultada), `medium` (traçado rodoviário ajustado, usado para transporte
coletivo) ou `high` (roteamento real sobre a malha). Nunca cite um número do VIA
sem verificar este campo.

### Deadhead

Trecho que um táxi ou carro de aplicativo percorre **sem passageiro**, entre uma
corrida e outra. Emitido em função da viagem e por isso atribuído a ela
(fator ≈ 1,4).

### Entrada (`IndexInput`)

Fator multiplicativo ou de contexto que participa do cálculo **sem ser uma
parcela somável** — um fator de emissão, uma ocupação, um preço. Separá-las dos
componentes é o que mantém verdadeira a invariante da soma.

### Fator de emissão

Quilogramas de CO₂ equivalente por quilômetro. Para modais coletivos, por
**passageiro**-quilômetro — razão pela qual não se divide de novo por ocupação.

### Fator de sinuosidade (*detour factor*)

Razão entre a distância percorrida e a linha reta entre origem e destino. Nenhum
trajeto real segue a reta; este fator aproxima a malha viária sem consultar
mapa. Varia por modal: ônibus 1,45 (linhas atendem demanda, não o passageiro),
metrô 1,25, carro 1,35.

### GHG Protocol

Padrão internacional de contabilidade de emissões. Sua versão brasileira define
o tratamento do CO₂ biogênico do etanol: reportado à parte, não somado ao escopo
fóssil.

### Impacto social

Índice composto de 0 a 100 que mede **o peso que um deslocamento impõe a um
perfil**. Não classifica pessoas e não ordena prioridade de atendimento. Valor
alto é argumento para remover a viagem.

### `IndexBreakdown`

O objeto que todo índice devolve: valor, unidade, incerteza, fórmula em LaTeX,
componentes, entradas, identificadores de fonte, versão e ressalvas. É o que o
Modo Cientista renderiza — por isso a explicação não pode divergir do número.

### `indexVersion`

Identificador da versão de fórmulas e constantes que produziu um resultado
(`via-idx-MAJOR.MINOR.PATCH`). Acompanha toda resposta e toda exportação, para
que um número guardado continue interpretável.

### Modo Cientista

Alternador da interface que revela, para cada índice, a fórmula renderizada,
os componentes com seus pesos, as entradas, as fontes e os dados brutos da rota.

### Normativo

Um parâmetro **escolhido pelo projeto**, não medido. Todos carregam
`sourceId: "via-normative-v1"` e aparecem marcados na página de metodologia.
Devem ser tratados como hipótese em qualquer uso científico.

### Overhead do modal

Minutos gastos fora do tempo em movimento: esperar o ônibus, procurar vaga,
caminhar até a plataforma. O componente mais subestimado por quem nunca dependeu
de transporte público.

### Provedor (`RouteProvider`, `GeocodeProvider`)

Interface que abstrai a origem dos dados de rota ou de geocodificação. O VIA
sempre tem uma implementação offline; as remotas são opcionais e degradam para a
offline quando falham.

### Ressalva (`caveat`)

Advertência que viaja **junto do número**, não em rodapé: custo parcial por falta
de renda declarada, índice normativo, estimativa de baixa confiança. Parte do
dado, não da decoração.

### Viabilidade remota (`remoteViable`)

Se a teleconsulta é opção real para aquele perfil. Vale `false` quando a pessoa
declara não ter conexão confiável — caso em que a economia é hipotética e a
interface diz isso. É um portão, não um peso: ver
[limitações](limitacoes-e-etica.md).

---

## Siglas

| Sigla | Significado |
| --- | --- |
| ANP | Agência Nacional do Petróleo, Gás Natural e Biocombustíveis |
| ANTP | Associação Nacional de Transportes Públicos |
| CNES | Cadastro Nacional de Estabelecimentos de Saúde |
| DEFRA / DESNZ | Órgãos britânicos que publicam fatores de conversão de GEE |
| GTFS | *General Transit Feed Specification*, formato de dados de transporte público |
| IBGE | Instituto Brasileiro de Geografia e Estatística |
| IPCC | Painel Intergovernamental sobre Mudanças Climáticas |
| LGPD | Lei Geral de Proteção de Dados (Lei 13.709/2018) |
| ORS | OpenRouteService |
| PNAD | Pesquisa Nacional por Amostra de Domicílios |
| SIN | Sistema Interligado Nacional (rede elétrica brasileira) |
| WCAG | *Web Content Accessibility Guidelines* |
