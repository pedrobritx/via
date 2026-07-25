# Limitações e ética

Leia isto antes de usar qualquer número do VIA em decisão real.

Este documento existe porque a falha mais provável desta ferramenta não é dar um
número errado — é dar um número certo que alguém interpreta errado. Um índice
com dois dígitos e uma barra colorida tem aparência de medição. Boa parte do que
o VIA produz não é medição.

---

## 1. A limitação principal: pesos normativos

**Carga de deslocamento** e **impacto social** são índices compostos por médias
ponderadas. Os pesos — 40% tempo, 20% estresse, 15% conforto, 10% estacionamento,
15% imprevisibilidade; 30% idade, 30% mobilidade, 20% acompanhante, 20% renda —
**não saíram de regressão sobre dados de campo**. São uma posição do projeto
sobre o que pesa numa viagem.

É uma posição defensável: que o tempo domine o desgaste de um deslocamento é
consistente com a literatura de mobilidade urbana, e que uma pessoa com
mobilidade reduzida enfrente barreira desproporcional é consenso na OMS. Mas
defensável não é medido.

Três consequências práticas:

1. **Os índices compostos servem para comparar cenários entre si**, não como
   grandeza absoluta. "Carga 45 no presencial contra 10 no remoto" é uma
   afirmação útil. "Carga 45" sozinho não significa nada fora do VIA.
2. **São arredondados para múltiplos de 5.** Exibir "carga 47" sugeriria uma
   resolução que os pesos não sustentam, e convidaria a comparações espúrias
   entre 47 e 48. O arredondamento é uma declaração de honestidade embutida no
   número.
3. **Todo parâmetro normativo carrega `sourceId: "via-normative-v1"`**, e há
   teste garantindo que nenhum deles possa ser atribuído a uma medição. Na
   página de metodologia eles aparecem marcados como "normativo". Qualquer uso
   científico deve tratá-los como hipótese.

A validação por questionário com pacientes está no roadmap justamente para
substituir esses pesos por algo medido. Até lá, eles são o que são.

---

## 2. O índice social não classifica pessoas

Isto merece parágrafo próprio porque é o risco ético mais sério do projeto.

O índice de impacto social mede **o peso que um deslocamento específico impõe a
um perfil específico**. Ele não mede vulnerabilidade individual, não ordena
pessoas e não serve para priorizar quem merece atendimento.

Um valor alto significa: *esta viagem é especialmente onerosa para esta pessoa*.
A leitura correta é **remover a viagem** — oferecer teleconsulta, transporte
assistido, atendimento domiciliar. Nunca remover a pessoa da fila.

O uso que este projeto repudia explicitamente: alimentar o índice num sistema de
triagem que desprioriza quem pontua alto, sob qualquer racionalização de
eficiência. Se o VIA for usado assim, foi usado contra o que ele existe para
fazer.

Por isso o enquadramento viaja junto do número: toda resposta de API e todo
cartão da interface carregam essa ressalva em `caveats`. Não é rodapé — é parte
do dado.

Uma nota sobre a especificação original: ela somava pontos avulsos (idoso +50,
cadeirante +40, baixa renda +20). Além de estourar os 100 pontos e tornar a
escala ininterpretável, essa forma sugere que características se acumulam numa
"quantidade de vulnerabilidade" da pessoa. A média ponderada normalizada foi
adotada tanto por ser matematicamente sã quanto por não carregar essa sugestão.

---

## 3. Exclusão digital: por que a internet é um portão, não um peso

O VIA **não recomenda teleconsulta a quem declara não ter conexão confiável**.
`hasReliableInternet: false` faz `remoteViable` vir `false`, e a economia
calculada é apresentada como hipotética.

Isso é uma decisão de projeto, não uma limitação técnica. Seria trivial tratar
conectividade como mais um peso no índice — e seria errado. Recomendar
telemedicina a quem não tem internet transfere o problema para a pessoa e
chama isso de sustentabilidade. As populações com pior acesso digital no Brasil
se sobrepõem fortemente às que mais se beneficiariam de não viajar: idosas, de
baixa renda, do interior.

Quando o portão fecha, a mensagem aponta alternativas — transporte assistido,
atendimento domiciliar, ponto de telessaúde apoiado perto de casa — em vez de
apenas negar.

Pelo mesmo motivo, o cenário remoto **não zera** o índice social: 15% do ônus do
perfil permanece, referente à barreira de operar o meio digital. Zerar
esconderia exatamente o grupo que a ferramenta pretende enxergar.

---

## 4. Limitações dos dados

### Roteamento

Sem `VIA_ORS_API_KEY`, as distâncias vêm de um estimador geométrico: linha reta
corrigida por um fator de sinuosidade por modal. Isso **não consulta rua
nenhuma**. Erros de 20% a 40% são esperados em malhas irregulares, travessias de
rio e regiões montanhosas.

O estimador se declara: devolve `confidence: "low"` e a interface exibe o aviso.
Nunca cite um número do VIA sem verificar esse campo.

Mesmo com o ORS configurado, **ônibus e metrô não são roteados de verdade** — o
ORS não tem perfil de transporte público. Usamos o traçado rodoviário ajustado
pela sinuosidade típica do modal, o que é melhor que a linha reta e pior que um
GTFS. Esses resultados vêm marcados como `confidence: "medium"`.

### Fatores de emissão

- **Etanol**: contamos apenas a parcela fóssil, conforme o GHG Protocol
  brasileiro. O CO₂ da queima é biogênico e reportado à parte. A contabilidade
  de mudança de uso do solo do etanol é genuinamente contestada na literatura, e
  a faixa larga (0,03–0,11 kg/km) reflete essa disputa em vez de escondê-la.
- **Ônibus**: o fator por passageiro depende fortemente da ocupação. Um veículo
  cheio emite muito menos por pessoa que um vazio. Usamos ocupação típica de
  capital; a faixa vai de 0,04 a 0,11.
- **Matriz elétrica**: metrô e teleconsulta usam o fator brasileiro
  (~0,1 kgCO₂/kWh, predominância hídrica). Aplicar um fator europeu aqui
  superestimaria a emissão em cerca de quatro vezes. Em compensação, **os
  resultados do VIA para modais elétricos não são transferíveis para outros
  países** sem trocar esse parâmetro.

### Custo

- A tarifa usada é **cheia**. Gratuidade para pessoas idosas (universal no
  Brasil acima de 65 anos) e integração tarifária reduzem o custo real, às vezes
  a zero. O VIA superestima o custo de transporte público para esse público.
- **Pedágio e estacionamento são informados pelo usuário.** Não temos base de
  dados deles.
- **Produtividade perdida não é somada sem renda declarada**, e o custo se
  declara parcial. Imputar salário mínimo a quem não informou renda produziria
  um número com aparência de fato.
- O tempo do **acompanhante não é convertido em dinheiro**. As passagens dele
  entram; as horas dele não. Isso subestima o custo domiciliar real.

### Parâmetros que envelhecem

- **Salário mínimo** (R$ 1.518, 2025): reajustado todo janeiro. Normaliza a
  faixa de renda do índice social; desatualizado, desloca essa faixa.
- **Preços de combustível** (ANP): variam mês a mês e por estado.
- **Tarifas de transporte**: variam por município.

Todos carregam nota de revisão periódica em `parameters.ts`. Um resultado do VIA
guardado por um ano deve ser reinterpretado conferindo o `indexVersion` contra o
catálogo vigente.

---

## 5. Limitações de método

**O componente de tempo da carga é linear até três horas.** Teoricamente, uma
curva saturante seria melhor: o custo marginal do 150º minuto de viagem é menor
que o do 10º. Escolhemos a linear porque o critério de aprovação da metodologia
é que ela possa ser explicada em dois minutos a quem não é da área, e "cada
minuto conta igual até três horas" passa nesse teste enquanto uma exponencial
não passa. É uma troca consciente de precisão por auditabilidade.

**A incerteza propagada só cobre relações lineares.** Emissão, custo e tempo
têm faixa porque são lineares nas constantes com faixa conhecida. Os índices
compostos não têm faixa — não porque sejam precisos, mas porque uma faixa ali
sugeriria um rigor estatístico que pesos normativos não têm. A ausência da faixa
é mais honesta que uma faixa inventada.

**Não modelamos**: qualidade do ar no trajeto, ruído, risco de acidente, custo
emocional de esperar por notícia, tempo de agendamento, faltas causadas por
dificuldade de deslocamento (que são possivelmente o maior efeito real da
barreira de transporte na saúde). O VIA mede uma viagem que acontece; não mede a
consulta que não aconteceu porque a viagem era inviável.

**Não modelamos os limites da teleconsulta.** O VIA compara custos de
deslocamento, não desfechos clínicos. Há consultas que exigem exame físico,
procedimento ou equipamento, e para essas a comparação é irrelevante — a
presencial não tem substituto. A decisão clínica é de quem atende; esta
ferramenta informa o custo do deslocamento, não a adequação do atendimento.

---

## 6. Privacidade

Nesta versão o VIA **não persiste nada**. Não há banco de dados, não há conta de
usuário, não há registro de consultas calculadas. A exportação é gerada no
navegador e o arquivo nunca passa por servidor.

O que trafega: as coordenadas e o perfil vão ao endpoint `/api/impact` para o
cálculo, e não são gravados. Se o roteamento externo estiver configurado, as
coordenadas de origem e destino são enviadas ao OpenRouteService — o que
significa que **um terceiro vê de onde a pessoa sai e para qual hospital vai**.
Para uso com dados reais de pacientes, use uma instância própria de roteamento.

Se uma versão futura passar a persistir dados, LGPD e HIPAA se tornam requisitos
concretos, não seções de documento: base legal por campo, consentimento
explícito, criptografia em repouso, direito à exclusão e registro de auditoria.
A ausência de persistência hoje é o que mantém isso simples.

---

## 7. Como citar

Ao publicar resultados obtidos com o VIA, informe:

- a versão dos índices (`indexVersion`, hoje `via-idx-0.1.0`);
- qual provedor de rota estava ativo (`providers.route` em `/api/parameters`);
- que os índices compostos usam pesos normativos, com referência a este
  documento.

O endpoint `GET /api/parameters` devolve o catálogo completo de constantes e
fontes vigentes, para anexar ao material.

---

## 8. Onde este documento pode estar errado

Um documento de limitações que não admite as próprias é propaganda.

Os pesos normativos foram escolhidos por julgamento e revisados quanto à
coerência interna, não validados externamente. As faixas de incerteza são
estimativas de ordem de grandeza, não intervalos de confiança estatísticos. As
coordenadas das fixtures offline apontam para centro de município ou quarteirão,
com erro de centenas de metros. E a escolha de quais dimensões entram nos
índices — tempo, estresse, conforto, estacionamento, imprevisibilidade — é ela
mesma normativa: outra equipe escolheria outras.

Correções, dados de campo e discordâncias fundamentadas são bem-vindos via
issue.
