/**
 * Todas as constantes do VIA vivem aqui, e cada uma carrega sua fonte.
 *
 * Regra do projeto: nenhum número mágico em fórmula. Se um cálculo precisa de
 * uma constante, ela está neste arquivo com `sourceId` apontando para uma
 * entrada de `docs/referencias.md`. Isso é o que permite a alguém de fora
 * conferir o método sem ler o código de cálculo, e o que permite ao endpoint
 * `GET /api/parameters` publicar a base inteira.
 *
 * Sobre as faixas `low`/`high`: elas não são enfeite. Fatores de emissão e
 * preços variam por cidade, por ano e por metodologia. A faixa é propagada
 * pelas fórmulas lineares e exibida ao usuário. Um valor central sem faixa
 * mente por omissão.
 */

import type { MobilityLevel, TransportModal } from "./types";

/**
 * Versão do conjunto de índices.
 *
 * Incrementar SEMPRE que uma fórmula, um peso ou uma constante mudar. Toda
 * resposta da API e toda exportação carrega esta string, para que um resultado
 * salvo há seis meses continue interpretável.
 *
 * Convenção semântica:
 *   major — mudou uma fórmula ou a definição de um índice
 *   minor — mudou um peso
 *   patch — mudou o valor de uma constante (preço, fator de emissão)
 */
export const INDEX_VERSION = "via-idx-0.1.0";

// ---------------------------------------------------------------------------
// Estrutura de um parâmetro
// ---------------------------------------------------------------------------

export interface Parameter {
  value: number;
  /** Extremo inferior plausível. Igual a `value` quando não há incerteza. */
  low: number;
  /** Extremo superior plausível. */
  high: number;
  unit: string;
  /** Chave em `SOURCES`. */
  sourceId: string;
  note?: string;
}

function p(
  value: number,
  low: number,
  high: number,
  unit: string,
  sourceId: string,
  note?: string,
): Parameter {
  return { value, low, high, unit, sourceId, note };
}

/** Parâmetro sem incerteza — uma escolha normativa nossa, não uma medição. */
function exact(
  value: number,
  unit: string,
  sourceId: string,
  note?: string,
): Parameter {
  return { value, low: value, high: value, unit, sourceId, note };
}

// ---------------------------------------------------------------------------
// Fontes
// ---------------------------------------------------------------------------

export interface Source {
  id: string;
  title: string;
  publisher: string;
  year: number;
  url?: string;
  /** Como esta fonte foi usada e o que ela não cobre. */
  note?: string;
}

export const SOURCES: Record<string, Source> = {
  "defra-2024": {
    id: "defra-2024",
    title: "Greenhouse gas reporting: conversion factors",
    publisher: "UK Department for Energy Security and Net Zero (DESNZ/DEFRA)",
    year: 2024,
    url: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    note: "Base internacional mais completa e transparente para fatores por modal. Reflete a frota britânica; onde a frota ou a matriz brasileira diverge de forma relevante, o valor foi ajustado e a divergência está anotada no parâmetro.",
  },
  "ipcc-ar6": {
    id: "ipcc-ar6",
    title: "Sixth Assessment Report, Working Group III: Mitigation of Climate Change",
    publisher: "IPCC",
    year: 2022,
    url: "https://www.ipcc.ch/report/ar6/wg3/",
    note: "Referência para a contabilidade de CO₂ biogênico do etanol e para ordens de grandeza por modal.",
  },
  "ghg-protocol-br": {
    id: "ghg-protocol-br",
    title: "Programa Brasileiro GHG Protocol — Especificações",
    publisher: "FGV EAESP / WRI Brasil",
    year: 2023,
    url: "https://www.fgv.br/ghgprotocolo",
    note: "Define o tratamento do CO₂ biogênico do etanol: reportado à parte, não somado ao escopo fóssil.",
  },
  "ons-matriz-br": {
    id: "ons-matriz-br",
    title: "Fator médio de emissão da geração elétrica do SIN",
    publisher: "Operador Nacional do Sistema Elétrico / MCTI",
    year: 2024,
    url: "https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/sirene/dados-e-ferramentas/fatores-de-emissao",
    note: "A matriz brasileira é atipicamente limpa (predominância hídrica). Por isso metrô e teleconsulta emitem muito menos aqui do que os fatores europeus sugeririam. Usar DEFRA cru para eletricidade no Brasil superestima a emissão em cerca de quatro vezes.",
  },
  "anp-precos": {
    id: "anp-precos",
    title: "Levantamento de Preços de Combustíveis",
    publisher: "Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)",
    year: 2025,
    url: "https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos",
    note: "Preços médios nacionais. Variam bastante por estado — daí a faixa larga. REQUER ATUALIZAÇÃO PERIÓDICA.",
  },
  "antp-mobilidade": {
    id: "antp-mobilidade",
    title: "Sistema de Informações da Mobilidade Urbana — Relatório Geral",
    publisher: "Associação Nacional de Transportes Públicos (ANTP)",
    year: 2023,
    url: "https://www.antp.org.br/simob.html",
    note: "Velocidades médias urbanas, tarifas e tempos de espera do transporte público nas capitais brasileiras.",
  },
  "ibge-pnad": {
    id: "ibge-pnad",
    title: "Pesquisa Nacional por Amostra de Domicílios Contínua",
    publisher: "IBGE",
    year: 2024,
    url: "https://www.ibge.gov.br/estatisticas/sociais/trabalho/17270-pnad-continua.html",
    note: "Rendimento domiciliar e jornada de trabalho, usados na conversão de tempo em dinheiro.",
  },
  "br-salario-minimo": {
    id: "br-salario-minimo",
    title: "Decreto nº 12.342/2024 — Salário mínimo vigente em 2025",
    publisher: "Presidência da República",
    year: 2024,
    url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12342.htm",
    note: "ATENÇÃO: valor de 2025. O salário mínimo é reajustado anualmente e este parâmetro precisa ser revisto todo janeiro. Ele só normaliza a faixa de renda do índice social; um valor desatualizado desloca essa faixa, não invalida os demais índices.",
  },
  "ms-tempo-consulta": {
    id: "ms-tempo-consulta",
    title: "Parâmetros para programação de ações e serviços de saúde",
    publisher: "Ministério da Saúde / DataSUS",
    year: 2023,
    url: "https://datasus.saude.gov.br/",
    note: "Base para a duração típica de consulta ambulatorial e para o tempo de espera em unidade.",
  },
  "who-equity": {
    id: "who-equity",
    title: "Global report on health equity for persons with disabilities",
    publisher: "Organização Mundial da Saúde",
    year: 2022,
    url: "https://www.who.int/publications/i/item/9789240063600",
    note: "Fundamenta a ideia de que barreiras de deslocamento pesam de forma desproporcional sobre pessoas com deficiência e idosas. Fundamenta a direção do índice social, não os pesos numéricos.",
  },
  "via-normative-v1": {
    id: "via-normative-v1",
    title: "Escolhas normativas do VIA, versão 1",
    publisher: "Projeto VIA",
    year: 2026,
    note: "ESTE NÃO É UM DADO MEDIDO. Os pesos da carga de deslocamento e do impacto social são um juízo do projeto sobre o que pesa numa viagem, calibrado para ser defensável e explicável — não uma constante da natureza. Estão documentados em docs/limitacoes-e-etica.md e sujeitos a revisão por pesquisa de campo. Qualquer uso científico deve tratá-los como hipótese, não como achado.",
  },
  "via-operational": {
    id: "via-operational",
    title: "Premissas operacionais do VIA",
    publisher: "Projeto VIA",
    year: 2026,
    note: "Aproximações de engenharia para o estimador offline (fatores de sinuosidade, velocidades médias, tempos de embarque). Escolhidas para dar ordem de grandeza correta sem serviço externo. Quando há chave de roteamento configurada, as reais substituem estas.",
  },
};

// ---------------------------------------------------------------------------
// Fatores de emissão
// ---------------------------------------------------------------------------

/**
 * kg CO₂e por quilômetro. Para modais coletivos, por passageiro-quilômetro.
 */
export const EMISSION_FACTORS: Record<TransportModal, Parameter> = {
  car_gasoline: p(
    0.192,
    0.14,
    0.26,
    "kgCO2e/km",
    "defra-2024",
    "Carro de porte médio. No Brasil a gasolina C leva ~27% de etanol anidro, o que reduz a parcela fóssil frente ao valor britânico puro; a faixa cobre desde um compacto econômico até um utilitário.",
  ),
  car_ethanol: p(
    0.062,
    0.03,
    0.11,
    "kgCO2e/km",
    "ghg-protocol-br",
    "Apenas a parcela fóssil (plantio, transporte, processamento). O CO₂ da queima é biogênico e, pelo GHG Protocol, é reportado à parte. A faixa é larga porque a contabilidade de mudança de uso do solo é contestada — veja docs/limitacoes-e-etica.md.",
  ),
  motorcycle: p(
    0.113,
    0.08,
    0.15,
    "kgCO2e/km",
    "defra-2024",
    "Motocicleta média.",
  ),
  bus_urban: p(
    0.062,
    0.04,
    0.11,
    "kgCO2e/passageiro-km",
    "antp-mobilidade",
    "Ônibus urbano a diesel com ocupação típica de capital brasileira. O fator por passageiro cai quando o veículo está cheio e dispara quando está vazio — daí a faixa.",
  ),
  metro_rail: p(
    0.025,
    0.01,
    0.05,
    "kgCO2e/passageiro-km",
    "ons-matriz-br",
    "Tração elétrica sobre a matriz brasileira, predominantemente hídrica. Um fator europeu daria valor várias vezes maior e estaria errado para o Brasil.",
  ),
  taxi_rideshare: p(
    0.21,
    0.16,
    0.28,
    "kgCO2e/km",
    "defra-2024",
    "Fator do veículo em si. O deslocamento sem passageiro entre corridas é aplicado à parte, por TAXI_DEADHEAD_FACTOR.",
  ),
  bicycle: exact(
    0,
    "kgCO2e/km",
    "ipcc-ar6",
    "Emissão operacional zero. A energia metabólica extra e a emissão embutida na fabricação existem, mas são desprezíveis nesta escala e não são contabilizadas.",
  ),
  walking: exact(0, "kgCO2e/km", "ipcc-ar6", "Emissão operacional zero."),
};

/**
 * Corridas por aplicativo rodam vazias entre um passageiro e outro. Esse
 * trecho é emitido em função da viagem e precisa ser atribuído a ela.
 */
export const TAXI_DEADHEAD_FACTOR = p(
  1.4,
  1.2,
  1.7,
  "adimensional",
  "defra-2024",
  "Multiplicador sobre a distância para cobrir o percurso sem passageiro. Ignorá-lo subestima a emissão de táxi/app em torno de 30%.",
);

/**
 * Emissão de uma teleconsulta inteira: dispositivo do paciente, dispositivo do
 * profissional, rede e datacenter.
 */
export const TELECONSULT_EMISSION = p(
  0.01,
  0.004,
  0.03,
  "kgCO2e/consulta",
  "ons-matriz-br",
  "Não é zero, e apresentá-la como zero seria desonesto. Mas é duas a três ordens de grandeza menor que quase qualquer deslocamento motorizado, e a matriz elétrica brasileira reduz ainda mais o valor.",
);

// ---------------------------------------------------------------------------
// Estimador offline de rota
// ---------------------------------------------------------------------------

/** Velocidade porta a porta em contexto urbano brasileiro. */
export const MODAL_SPEED_KMH: Record<TransportModal, Parameter> = {
  car_gasoline: p(25, 15, 40, "km/h", "antp-mobilidade"),
  car_ethanol: p(25, 15, 40, "km/h", "antp-mobilidade"),
  motorcycle: p(30, 20, 45, "km/h", "antp-mobilidade"),
  bus_urban: p(15, 10, 22, "km/h", "antp-mobilidade", "Inclui paradas."),
  metro_rail: p(28, 20, 35, "km/h", "antp-mobilidade", "Inclui paradas."),
  taxi_rideshare: p(25, 15, 40, "km/h", "antp-mobilidade"),
  bicycle: p(13, 10, 18, "km/h", "via-operational"),
  walking: p(4.5, 3.5, 5.5, "km/h", "via-operational"),
};

/**
 * Razão entre a distância percorrida e a linha reta. Nenhum trajeto real segue
 * a reta entre dois pontos; este fator aproxima a malha sem consultar mapa.
 */
export const MODAL_DETOUR_FACTOR: Record<TransportModal, Parameter> = {
  car_gasoline: p(1.35, 1.2, 1.6, "adimensional", "via-operational"),
  car_ethanol: p(1.35, 1.2, 1.6, "adimensional", "via-operational"),
  motorcycle: p(1.3, 1.15, 1.5, "adimensional", "via-operational"),
  bus_urban: p(
    1.45,
    1.25,
    1.8,
    "adimensional",
    "via-operational",
    "Linhas de ônibus raramente vão direto: o traçado atende a demanda, não o passageiro individual.",
  ),
  metro_rail: p(1.25, 1.1, 1.5, "adimensional", "via-operational"),
  taxi_rideshare: p(1.35, 1.2, 1.6, "adimensional", "via-operational"),
  bicycle: p(1.3, 1.15, 1.5, "adimensional", "via-operational"),
  walking: p(1.25, 1.1, 1.45, "adimensional", "via-operational"),
};

// ---------------------------------------------------------------------------
// Tempo
// ---------------------------------------------------------------------------

/**
 * Minutos adicionais na ida e volta somada, fora o tempo em movimento:
 * procurar vaga, esperar o ônibus, caminhar até a plataforma.
 */
export const MODAL_OVERHEAD_MIN: Record<TransportModal, Parameter> = {
  car_gasoline: p(10, 4, 25, "min", "via-operational", "Procura de vaga e caminhada do estacionamento até a porta."),
  car_ethanol: p(10, 4, 25, "min", "via-operational"),
  motorcycle: p(4, 2, 10, "min", "via-operational"),
  bus_urban: p(
    24,
    12,
    45,
    "min",
    "antp-mobilidade",
    "Espera média de 12 minutos por embarque, duas vezes. É o componente mais subestimado de quem nunca dependeu de ônibus.",
  ),
  metro_rail: p(12, 6, 20, "min", "antp-mobilidade"),
  taxi_rideshare: p(10, 4, 20, "min", "via-operational", "Espera do veículo nas duas pontas."),
  bicycle: p(6, 3, 12, "min", "via-operational"),
  walking: exact(0, "min", "via-operational"),
};

export const FACILITY_WAIT_MIN = p(
  30,
  10,
  90,
  "min",
  "ms-tempo-consulta",
  "Tempo entre chegar à unidade e ser atendido. Varia enormemente; a faixa reflete isso.",
);

export const CONSULTATION_MIN = p(
  15,
  10,
  30,
  "min",
  "ms-tempo-consulta",
  "Duração da consulta em si. Igual nos dois cenários — não é aí que está a diferença.",
);

export const REMOTE_SETUP_MIN = p(
  5,
  2,
  15,
  "min",
  "via-operational",
  "Abrir o link, testar câmera e microfone, esperar o profissional entrar.",
);

// ---------------------------------------------------------------------------
// Custo
// ---------------------------------------------------------------------------

/** Consumo urbano, em litros por quilômetro. */
export const FUEL_CONSUMPTION_L_PER_KM: Partial<
  Record<TransportModal, Parameter>
> = {
  car_gasoline: p(1 / 12, 1 / 16, 1 / 8, "L/km", "via-operational", "12 km/L em ciclo urbano."),
  car_ethanol: p(1 / 8.4, 1 / 11, 1 / 6, "L/km", "via-operational", "Etanol rende cerca de 70% da gasolina por litro."),
  motorcycle: p(1 / 35, 1 / 45, 1 / 25, "L/km", "via-operational"),
};

export const FUEL_PRICE_BRL_PER_L: Partial<Record<TransportModal, Parameter>> = {
  car_gasoline: p(6.09, 5.4, 7.2, "R$/L", "anp-precos"),
  car_ethanol: p(4.29, 3.6, 5.3, "R$/L", "anp-precos"),
  motorcycle: p(6.09, 5.4, 7.2, "R$/L", "anp-precos"),
};

export const TRANSIT_FARE_BRL: Partial<Record<TransportModal, Parameter>> = {
  bus_urban: p(5.0, 4.0, 6.5, "R$/viagem", "antp-mobilidade", "Tarifa cheia nas capitais. Não considera gratuidade para idosos nem integração — ambos reduzem o custo real."),
  metro_rail: p(5.2, 4.2, 7.0, "R$/viagem", "antp-mobilidade"),
};

export const TAXI_BASE_FARE_BRL = p(6.5, 5.0, 9.0, "R$", "via-operational", "Bandeirada típica de aplicativo.");
export const TAXI_PER_KM_BRL = p(2.6, 1.9, 4.0, "R$/km", "via-operational");

export const WORK_HOURS_PER_MONTH = exact(
  220,
  "h/mês",
  "ibge-pnad",
  "Jornada mensal padrão da CLT (44h semanais). Converte renda mensal em renda por hora.",
);

export const MINIMUM_WAGE_BRL = p(
  1518,
  1518,
  1518,
  "R$/mês",
  "br-salario-minimo",
  "Vigente em 2025. Usado apenas para normalizar a faixa de renda do índice social. REVISAR TODO JANEIRO.",
);

// ---------------------------------------------------------------------------
// Índice de Carga de Deslocamento
// ---------------------------------------------------------------------------

/**
 * Pesos da carga de deslocamento. Somam 1,0 — há teste garantindo isso.
 *
 * São normativos. Representam a posição do projeto de que o tempo é o fator
 * dominante do desgaste de uma viagem, seguido pelo estresse. Não saíram de
 * regressão sobre dados de campo, e a validação por questionário está no
 * roadmap justamente para substituí-los.
 */
export const BURDEN_WEIGHTS = {
  time: exact(0.4, "peso", "via-normative-v1"),
  stress: exact(0.2, "peso", "via-normative-v1"),
  comfort: exact(0.15, "peso", "via-normative-v1"),
  parking: exact(0.1, "peso", "via-normative-v1"),
  unpredictability: exact(0.15, "peso", "via-normative-v1"),
} as const;

export const BURDEN_TIME_REFERENCE_MIN = p(
  180,
  120,
  240,
  "min",
  "via-normative-v1",
  "Três horas de deslocamento saturam o componente de tempo em 100 pontos. A relação é linear até esse teto; a alternativa saturante foi descartada por ser mais difícil de explicar a quem não é da área.",
);

/** Estresse típico do modal, 0–100, antes do efeito do congestionamento. */
export const MODAL_STRESS: Record<TransportModal, Parameter> = {
  car_gasoline: exact(60, "pontos", "via-normative-v1", "Dirigir em trânsito exige atenção contínua."),
  car_ethanol: exact(60, "pontos", "via-normative-v1"),
  motorcycle: exact(70, "pontos", "via-normative-v1", "Soma o risco percebido à exigência de atenção."),
  bus_urban: exact(75, "pontos", "via-normative-v1", "Lotação, ruído, imprevisibilidade e falta de controle sobre o percurso."),
  metro_rail: exact(50, "pontos", "via-normative-v1"),
  taxi_rideshare: exact(40, "pontos", "via-normative-v1"),
  bicycle: exact(35, "pontos", "via-normative-v1"),
  walking: exact(25, "pontos", "via-normative-v1"),
};

/** Desconforto físico do modal, 0–100. Quanto maior, pior. */
export const MODAL_DISCOMFORT: Record<TransportModal, Parameter> = {
  car_gasoline: exact(25, "pontos", "via-normative-v1"),
  car_ethanol: exact(25, "pontos", "via-normative-v1"),
  motorcycle: exact(55, "pontos", "via-normative-v1", "Exposição a clima e vibração."),
  bus_urban: exact(70, "pontos", "via-normative-v1", "Frequentemente em pé, sem climatização."),
  metro_rail: exact(55, "pontos", "via-normative-v1"),
  taxi_rideshare: exact(20, "pontos", "via-normative-v1"),
  bicycle: exact(50, "pontos", "via-normative-v1", "Esforço físico e exposição."),
  walking: exact(40, "pontos", "via-normative-v1", "Exposição a sol e chuva."),
};

export const PARKING_DIFFICULTY = p(
  70,
  30,
  100,
  "pontos",
  "via-normative-v1",
  "Dificuldade de estacionar perto de um equipamento de saúde urbano. Aplica-se apenas a quem dirige; zero para os demais modais.",
);

export const TRANSFER_PENALTY = exact(
  20,
  "pontos/baldeação",
  "via-normative-v1",
  "Cada troca de veículo adiciona um ponto de falha ao trajeto.",
);

export const CONGESTION_UNPREDICTABILITY = exact(
  40,
  "pontos",
  "via-normative-v1",
  "Multiplicado pelo excedente do fator de congestionamento acima de 1,0.",
);

// ---------------------------------------------------------------------------
// Índice de Impacto Social
// ---------------------------------------------------------------------------

/**
 * Pesos do impacto social. Somam 1,0 — há teste garantindo isso.
 *
 * Sobre o que este índice mede: o peso que ESTE deslocamento impõe A ESTA
 * pessoa. Ele não classifica pessoas, não mede vulnerabilidade individual e não
 * serve para priorizar quem merece atendimento. Um valor alto significa "esta
 * viagem é especialmente onerosa para este perfil", e a leitura correta é
 * remover a viagem — não a pessoa.
 */
export const SOCIAL_WEIGHTS = {
  age: exact(0.3, "peso", "via-normative-v1"),
  mobility: exact(0.3, "peso", "via-normative-v1"),
  companion: exact(0.2, "peso", "via-normative-v1"),
  income: exact(0.2, "peso", "via-normative-v1"),
} as const;

export const SOCIAL_AGE_ONSET = exact(
  60,
  "anos",
  "who-equity",
  "Idade a partir da qual o deslocamento passa a pesar progressivamente mais. Coincide com a definição de pessoa idosa do Estatuto do Idoso.",
);

export const SOCIAL_AGE_SATURATION = exact(
  85,
  "anos",
  "via-normative-v1",
  "Idade em que o componente satura em 100 pontos.",
);

export const SOCIAL_MINOR_SCORE = exact(
  60,
  "pontos",
  "via-normative-v1",
  "Menores de 18 anos: o deslocamento sempre mobiliza um adulto junto.",
);

export const SOCIAL_MOBILITY_SCORE: Record<MobilityLevel, Parameter> = {
  none: exact(0, "pontos", "who-equity"),
  mild: exact(40, "pontos", "who-equity", "Anda sem apoio, mas se cansa."),
  moderate: exact(70, "pontos", "who-equity", "Depende de bengala, andador ou de terceiros."),
  severe: exact(100, "pontos", "who-equity", "Cadeira de rodas ou acamado: exige transporte adaptado."),
};

export const SOCIAL_INCOME_THRESHOLD_MW = exact(
  3,
  "salários mínimos",
  "ibge-pnad",
  "Renda domiciliar acima de três salários mínimos zera o componente. Abaixo disso, cresce linearmente até 100 na renda zero.",
);

// ---------------------------------------------------------------------------
// Apresentação
// ---------------------------------------------------------------------------

/**
 * Índices compostos são arredondados para múltiplos de 5.
 *
 * Exibir "carga 67" sugere uma precisão que pesos normativos não têm. O
 * arredondamento é uma declaração de honestidade embutida no número: a
 * resolução real do instrumento é grosseira, e fingir o contrário convida a
 * comparações espúrias entre 67 e 68.
 */
export const COMPOSITE_ROUNDING_STEP = 5;

/** Ocupação padrão de um veículo particular quando não informada. */
export const DEFAULT_OCCUPANCY = exact(
  1,
  "pessoas",
  "via-operational",
  "Assume-se que o paciente viaja sozinho, salvo indicação contrária.",
);

/**
 * Fator de congestionamento, relativo à condição urbana TÍPICA.
 *
 * O padrão é 1,0, e isso é deliberado. As velocidades de `MODAL_SPEED_KMH` já
 * são médias porta a porta em cidade brasileira, ou seja, já embutem o trânsito
 * de um dia comum. Adotar 1,3 como padrão contaria o congestionamento duas
 * vezes e inflaria todos os tempos. Valores acima de 1 significam "pior que o
 * dia típico" — hora do rush, chuva, obra.
 */
export const DEFAULT_CONGESTION_FACTOR = exact(
  1.0,
  "adimensional",
  "antp-mobilidade",
  "1,0 = condição urbana típica, já refletida nas velocidades médias. Acima de 1,0 = pior que o típico.",
);

// ---------------------------------------------------------------------------
// Cenário remoto
// ---------------------------------------------------------------------------

/**
 * A teleconsulta não é isenta de carga — apenas muito menor. Tratá-la como
 * zero absoluto seria o espelho do erro que o projeto denuncia.
 */
export const REMOTE_STRESS = exact(
  15,
  "pontos",
  "via-normative-v1",
  "Ansiedade de lidar com a tecnologia e de ser atendido por vídeo.",
);

export const REMOTE_DISCOMFORT = exact(
  5,
  "pontos",
  "via-normative-v1",
  "Consulta feita de casa, sentado.",
);

export const REMOTE_UNPREDICTABILITY = exact(
  20,
  "pontos",
  "via-normative-v1",
  "A chamada pode cair, o link pode não abrir, o áudio pode falhar.",
);

/**
 * Fração do ônus social do perfil que permanece na teleconsulta.
 *
 * Não é zero. Operar um aplicativo de vídeo é, em si, uma barreira para parte
 * das pessoas idosas e com deficiência — as mesmas que mais se beneficiariam de
 * não viajar. Zerar este componente esconderia justamente o grupo que a
 * ferramenta pretende enxergar.
 */
export const REMOTE_SOCIAL_RESIDUAL = exact(
  0.15,
  "adimensional",
  "via-normative-v1",
  "15% do ônus social do perfil permanece, referente à barreira de usar o meio digital.",
);
