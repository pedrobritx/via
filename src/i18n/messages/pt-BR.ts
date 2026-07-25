/**
 * Catálogo de mensagens em português do Brasil — o idioma de referência.
 *
 * Nenhum texto visível deve ser escrito direto em componente. Toda string passa
 * por aqui, mesmo enquanto só existe um idioma: é o que torna a tradução um
 * acréscimo, e não uma refatoração.
 *
 * Chaves são planas e pontuadas por área ("form.origin.label"). Cada uma é
 * usada em exatamente um lugar, e há teste garantindo que nenhuma sobra.
 */

export const ptBR = {
  // --- Cabeçalho e navegação ---
  "app.name": "VIA",
  "app.fullName": "Visualizador de Impacto Assistencial",
  "app.tagline":
    "Quanto custa, de verdade, ir a uma consulta médica?",
  "nav.methodology": "Como calculamos",
  "nav.skipToContent": "Pular para o conteúdo principal",

  // --- Formulário ---
  "form.title": "Descreva o deslocamento",
  "form.origin.label": "De onde a pessoa sai",
  "form.origin.placeholder": "CEP, endereço, cidade ou hospital",
  "form.origin.help":
    "Aceita CEP (01310-100), endereço completo, cidade ou nome de hospital. Também aceita coordenadas coladas, no formato -23.5505, -46.6333.",
  "form.destination.label": "Para onde vai",
  "form.destination.placeholder": "CEP, endereço ou nome da unidade",
  "form.searching": "Buscando…",
  "form.noResults":
    "Nenhum lugar encontrado. Tente o CEP, um endereço mais completo, ou cole as coordenadas.",
  "form.selected": "Selecionado",
  "form.source.nominatim": "endereço via OpenStreetMap",
  "form.source.brasilapi-cep": "CEP via BrasilAPI",
  "form.source.offline-fixtures": "da lista interna",
  "form.source.coordenadas": "coordenadas informadas",
  "form.clear": "Limpar",

  "form.modal.label": "Como se desloca",
  "form.modal.car_gasoline": "Carro (gasolina)",
  "form.modal.car_ethanol": "Carro (etanol)",
  "form.modal.motorcycle": "Motocicleta",
  "form.modal.bus_urban": "Ônibus urbano",
  "form.modal.metro_rail": "Metrô ou trem",
  "form.modal.taxi_rideshare": "Táxi ou aplicativo",
  "form.modal.bicycle": "Bicicleta",
  "form.modal.walking": "A pé",

  "form.trip.title": "Detalhes do trajeto",
  "form.occupancy.label": "Pessoas no veículo",
  "form.occupancy.help":
    "Dividir o carro divide a emissão por pessoa — mas não reduz o total lançado na atmosfera.",
  "form.transfers.label": "Baldeações na ida",
  "form.transfers.help": "Quantas vezes precisa trocar de veículo.",
  "form.toll.label": "Pedágio por trajeto",
  "form.parking.label": "Estacionamento na visita",
  "form.congestion.label": "Condição de trânsito",
  "form.congestion.typical": "Dia típico",
  "form.congestion.busy": "Movimentado",
  "form.congestion.heavy": "Hora do rush",
  "form.congestion.help":
    "As velocidades médias já consideram o trânsito de um dia comum. Escolha acima disso apenas para situações piores que o normal.",

  "form.profile.title": "Perfil de quem se desloca",
  "form.age.label": "Idade",
  "form.mobility.label": "Mobilidade",
  "form.mobility.none": "Sem limitação",
  "form.mobility.mild": "Anda, mas se cansa",
  "form.mobility.moderate": "Usa bengala, andador ou apoio",
  "form.mobility.severe": "Cadeira de rodas ou acamado",
  "form.companion.label": "Precisa de acompanhante",
  "form.income.label": "Renda mensal do domicílio",
  "form.income.placeholder": "Opcional",
  "form.income.help":
    "Se não informar, a produtividade perdida não entra na conta e o custo é apresentado como parcial. Não inventamos uma renda.",
  "form.productivity.label": "Faltar ao trabalho reduz a renda",
  "form.productivity.help":
    "Desmarque para quem é aposentado, desempregado ou tem jornada flexível. O tempo continua sendo gasto; ele só não vira desconto no salário.",
  "form.internet.label": "Tem internet confiável em casa",
  "form.internet.help":
    "Sem conexão confiável, a teleconsulta não é uma opção real — e o VIA não vai recomendá-la.",

  "form.submit": "Calcular impacto",
  "form.calculating": "Calculando…",
  "form.reset": "Recomeçar",
  "form.error.title": "Não foi possível calcular",
  "form.error.missingPlaces": "Escolha uma origem e um destino.",
  "form.error.network":
    "Falha de comunicação com o servidor. Verifique a conexão e tente de novo.",


  // --- Herói -----------------------------------------------------------
  "hero.eyebrow": "Visualizador de impacto assistencial · Método aberto",
  "hero.title.before": "Quanto custa, de verdade,",
  "hero.title.emphasis": "ir a uma consulta",
  "hero.lede":
    "O paciente vê “consulta às 14h”. Não vê as três horas de trânsito, os R$ 60, os 4,9 kg de CO₂, nem o desgaste — que para quem tem 80 anos ou anda com dificuldade é ordens de grandeza maior. Esta ferramenta calcula essa conta invisível, e mostra a conta inteira.",
  "hero.cue": "Comece pelo trajeto",
  // Rótulos da tira de dados do herói: nomeiam a grandeza, o valor vem ao lado.
  "hero.meta.indices": "Índices",
  "hero.meta.sources": "Fontes citadas",
  "hero.meta.open": "Fórmulas",
  "hero.meta.openLink": "Ver a metodologia",

  // --- Passo 01: o trajeto ---------------------------------------------
  "step.trip.num": "01",
  "step.trip.eyebrow": "Primeiro passo · Onde",
  "step.trip.title.before": "Todo cálculo começa por",
  "step.trip.title.emphasis": "uma distância",
  "step.trip.lede":
    "São necessários dois pontos. O VIA sempre conta ida e volta — o retorno é metade do custo e desaparece da maioria das estimativas. Informe o CEP, o endereço, o nome do hospital, ou cole as coordenadas.",

  // --- Passo 02: o deslocamento ----------------------------------------
  "step.modal.num": "02",
  "step.modal.eyebrow": "Segundo passo · Como",
  "step.modal.title.before": "O tempo que",
  "step.modal.title.emphasis": "não aparece no mapa",
  "step.modal.lede":
    "Um aplicativo de rota informa quanto tempo o veículo leva em movimento. Não informa os vinte e quatro minutos parados no ponto de ônibus, nem os dez procurando vaga. Esse tempo é vida igual — e é o componente de maior peso na carga de deslocamento.",
  "step.modal.pickLabel": "Escolha o modal",
  "step.modal.detailsTitle": "Detalhes que mudam a conta",

  // --- Passo 03: o perfil ----------------------------------------------
  "step.profile.num": "03",
  "step.profile.eyebrow": "Terceiro passo · Quem",
  "step.profile.title.before": "A mesma viagem",
  "step.profile.title.emphasis": "pesa diferente",
  "step.profile.lede":
    "Vinte quilômetros de ônibus para um adulto de 30 anos e para uma pessoa de 80 com dificuldade de andar são a mesma distância e experiências incomparáveis. O índice social mede esse peso — o peso que o deslocamento impõe à pessoa, nunca a pessoa.",
  "step.profile.ethics":
    "Um valor alto é argumento para remover a viagem: teleconsulta, transporte assistido, atendimento domiciliar. Nunca para restringir o acesso de alguém.",

  // --- Passo 04: o resultado -------------------------------------------
  "step.result.num": "04",
  "step.result.eyebrow": "O resultado",
  "step.result.title.before": "O que a viagem",
  "step.result.title.emphasis": "realmente custa",
  "step.result.lede":
    "Presencial e teleconsulta, lado a lado. Cada número abre para mostrar a fórmula que o produziu, os valores de entrada e a fonte de cada constante.",
  "step.result.waiting":
    "Escolha a origem e o destino no passo 01. Sem os dois pontos não há distância, e sem distância não há cálculo.",
  "step.result.stale":
    "Algum dado mudou desde o último cálculo. Os números abaixo ainda são os anteriores.",
  "form.recalculate": "Recalcular",

  // --- As cinco medidas (didático, no estado vazio) ---------------------
  "measures.eyebrow": "O que o VIA mede",
  "measures.title.before": "Cinco medidas de",
  "measures.title.emphasis": "um mesmo dia",
  "measures.lede":
    "Nenhuma delas sozinha descreve o custo de uma consulta. Juntas, começam a descrever.",
  "measures.carbon.body":
    "Distância de ida e volta multiplicada pelo fator do modal. Ônibus e metrô já são contados por passageiro; carro divide entre ocupantes — mas o total lançado na atmosfera não cai.",
  "measures.time.body":
    "Deslocamento, espera no ponto, procura de vaga, espera na unidade e a consulta. O tempo parado costuma superar o tempo em movimento.",
  "measures.cost.body":
    "Combustível, tarifas, pedágio, estacionamento. A renda perdida só entra se você informar a renda — não se inventa um salário para preencher a conta.",
  "measures.burden.body":
    "Índice de 0 a 100 que soma tempo, estresse, desconforto, estacionamento e imprevisibilidade. Os pesos são escolha do projeto, e isso está declarado em cada resultado.",
  "measures.social.body":
    "Quanto este deslocamento específico pesa neste perfil específico. Idade, mobilidade, acompanhante e renda. Mede a viagem, não a pessoa.",

  // --- Controles novos --------------------------------------------------
  "control.years": "anos",
  "control.people": "pessoas",
  "control.transfersUnit": "baldeações",
  "control.optional": "opcional",
  "control.step": "Passo",
  "control.of": "de",
  "control.pending": "aguardando os passos anteriores",
  "control.done": "concluído",

  "footer.builtWith": "Método aberto, código aberto.",

  // --- Resultados ---
  "results.title": "Resultado",
  "results.inPerson": "Presencial",
  "results.remote": "Teleconsulta",
  "results.difference": "Diferença",
  "results.summary.label": "Resumo",
  "results.scenarioCompare": "Comparação entre cenários",
  "results.emptyTitle": "Nenhum cálculo ainda",
  "results.emptyBody":
    "Preencha o formulário ao lado para ver o custo completo do deslocamento.",

  // --- Frase-resumo ---
  "summary.saved": "Com a teleconsulta, você economiza {list}.",
  "summary.wouldSave": "A teleconsulta economizaria {list}.",
  "summary.equivalent":
    "Neste caso, a teleconsulta e a consulta presencial têm impacto equivalente.",
  "summary.and": "e",
  "summary.ofCarbon": "de CO₂",

  "index.carbon": "Pegada de carbono",
  "index.time": "Tempo total",
  "index.cost": "Custo",
  "index.burden": "Carga de deslocamento",
  "index.social": "Impacto social",

  "index.carbon.short": "CO₂ evitado",
  "index.time.short": "Tempo economizado",
  "index.cost.short": "Dinheiro economizado",
  "index.burden.short": "Redução de carga",
  "index.social.short": "Redução de ônus social",

  "index.expand": "Ver como calculamos",
  "index.collapse": "Esconder o cálculo",
  "index.components": "Composição",
  "index.inputs": "Entradas do cálculo",
  "index.formula": "Fórmula",
  "index.sources": "Fontes",
  "index.caveats": "Ressalvas",
  "index.uncertainty": "Faixa estimada",
  "index.component": "Componente",
  "index.value": "Valor",
  "index.weight": "Peso",
  "index.contribution": "Contribuição",
  "index.unitPoints": "pontos",

  // --- Jornada ---
  "journey.title": "A jornada",
  "journey.home": "Casa",
  "journey.travel": "Deslocamento",
  "journey.wait": "Espera",
  "journey.consultation": "Consulta",
  "journey.return": "Volta para casa",
  "journey.remoteConnect": "Conecta de casa",
  "journey.accumulated": "acumulado",

  // --- Avisos ---
  "warning.remoteBlocked.title": "Teleconsulta não é uma opção viável aqui",
  "warning.lowConfidence.title": "Estimativa de baixa precisão",
  "warning.lowConfidence.body":
    "A distância foi calculada geometricamente, sem consultar a malha viária real. Configure uma chave de roteamento para números mais precisos.",
  "warning.normative.title": "Sobre os índices compostos",
  "warning.normative.body":
    "Carga de deslocamento e impacto social usam pesos normativos, escolhidos pelo projeto e documentados — não medidos em campo. Servem para comparar cenários entre si, não como grandeza física. Por isso são arredondados para múltiplos de 5.",

  // --- Modo Cientista ---
  "scientist.toggle": "Modo Cientista",
  "scientist.on": "ativado",
  "scientist.off": "desativado",
  "scientist.help":
    "Mostra fórmulas, pesos, valores de entrada e dados brutos da rota.",
  "scientist.rawRoute": "Dados da rota",
  "scientist.provider": "Provedor",
  "scientist.confidence": "Confiança",
  "scientist.confidence.low": "baixa",
  "scientist.confidence.medium": "média",
  "scientist.confidence.high": "alta",
  "scientist.distance": "Distância (ida)",
  "scientist.duration": "Tempo (ida)",
  "scientist.indexVersion": "Versão dos índices",
  "scientist.dataTable": "Tabela de dados do gráfico",

  // --- Exportação ---
  "export.title": "Exportar",
  "export.json": "Baixar JSON",
  "export.csv": "Baixar CSV",
  "export.help":
    "O arquivo inclui a versão dos índices e as fontes de cada constante, para que o cálculo possa ser refeito.",

  // --- Metodologia ---
  "methodology.title": "Como calculamos",
  "methodology.intro":
    "Todas as constantes usadas pelo VIA, com sua faixa de incerteza e sua fonte. Esta página é gerada a partir do próprio código: não existe forma de ela divergir do que o sistema calcula.",
  "methodology.version": "Versão dos índices",
  "methodology.parameter": "Parâmetro",
  "methodology.range": "Faixa",
  "methodology.unit": "Unidade",
  "methodology.source": "Fonte",
  "methodology.note": "Observação",
  "methodology.sourcesTitle": "Referências",
  "methodology.backToCalculator": "Voltar ao cálculo",
  "methodology.normativeWarning":
    "Parâmetros com a fonte “via-normative-v1” não são medições. São escolhas do projeto sobre o que pesa numa viagem — defensáveis e documentadas, mas normativas. Qualquer uso científico deve tratá-las como hipótese.",

  // --- Rodapé ---
  "footer.methodology": "Metodologia aberta",
  "footer.limitations": "Limitações e ética",
  "footer.api": "API",
  "footer.license": "Código sob MIT. Metodologia sob CC BY 4.0.",
} as const;

export type MessageKey = keyof typeof ptBR;
export type Messages = Record<MessageKey, string>;
