/**
 * Tipos do núcleo de cálculo do VIA.
 *
 * Este módulo — e todo o diretório `src/domain/` — é TypeScript puro. Não
 * importa React, não importa Next, não toca no DOM e não lê `process.env` fora
 * da fábrica de provedores. Essa restrição é o que permite testar o método
 * isoladamente, expô-lo por API e auditá-lo sem ler uma linha de interface.
 */

// ---------------------------------------------------------------------------
// Geografia
// ---------------------------------------------------------------------------

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place extends LatLng {
  /** Rótulo legível: "Hospital das Clínicas, São Paulo". */
  label: string;
  /**
   * Qual provedor resolveu este lugar: `nominatim`, `brasilapi-cep`,
   * `offline-fixtures` ou `coordenadas`. A interface exibe essa origem pelo
   * mesmo motivo que exibe a fonte de cada constante — um dado sem procedência
   * não é auditável.
   */
  source?: string;
}

// ---------------------------------------------------------------------------
// Modais de transporte
// ---------------------------------------------------------------------------

export const TRANSPORT_MODALS = [
  "car_gasoline",
  "car_ethanol",
  "motorcycle",
  "bus_urban",
  "metro_rail",
  "taxi_rideshare",
  "bicycle",
  "walking",
] as const;

export type TransportModal = (typeof TRANSPORT_MODALS)[number];

/**
 * Modais em que a pessoa dirige o próprio veículo. Só estes pagam combustível,
 * enfrentam procura de vaga e sofrem a penalidade de estacionamento no índice
 * de carga.
 */
export const DRIVEN_MODALS: readonly TransportModal[] = [
  "car_gasoline",
  "car_ethanol",
  "motorcycle",
];

/** Modais movidos pelo próprio corpo — emissão operacional zero. */
export const ACTIVE_MODALS: readonly TransportModal[] = ["bicycle", "walking"];

/** Modais de transporte público, cobrados por tarifa e sujeitos a baldeação. */
export const TRANSIT_MODALS: readonly TransportModal[] = [
  "bus_urban",
  "metro_rail",
];

export function isDrivenModal(modal: TransportModal): boolean {
  return DRIVEN_MODALS.includes(modal);
}

export function isActiveModal(modal: TransportModal): boolean {
  return ACTIVE_MODALS.includes(modal);
}

export function isTransitModal(modal: TransportModal): boolean {
  return TRANSIT_MODALS.includes(modal);
}

// ---------------------------------------------------------------------------
// Perfil do paciente
// ---------------------------------------------------------------------------

export type MobilityLevel = "none" | "mild" | "moderate" | "severe";

export const MOBILITY_LEVELS: readonly MobilityLevel[] = [
  "none",
  "mild",
  "moderate",
  "severe",
];

export interface PatientProfile {
  /** Idade em anos. */
  age: number;

  /** Grau de limitação de mobilidade declarado. */
  mobility: MobilityLevel;

  /**
   * Se a pessoa precisa de acompanhante. Dobra o ônus para o domicílio: outra
   * pessoa também perde o dia.
   */
  requiresCompanion: boolean;

  /**
   * Renda mensal do domicílio em reais. Opcional de propósito. Quando ausente,
   * a parcela de produtividade perdida é omitida e o custo é marcado como
   * parcial — nunca imputamos um salário silenciosamente.
   */
  monthlyIncomeBRL?: number;

  /**
   * Se a pessoa tem conexão de internet confiável.
   *
   * Isto é um portão de viabilidade, NÃO um peso em índice nenhum. Quando é
   * `false`, a teleconsulta deixa de ser recomendada. Sugerir telemedicina a
   * quem não tem internet reproduz exclusão digital em nome de
   * sustentabilidade.
   */
  hasReliableInternet: boolean;

  /**
   * Se o tempo gasto deve ser convertido em perda de renda. `false` para quem
   * é aposentado, desempregado ou tem jornada flexível — nesses casos a viagem
   * custa tempo de vida, mas não salário, e somar dinheiro ali seria inventar
   * um prejuízo que não existe.
   */
  countProductivityLoss: boolean;
}

// ---------------------------------------------------------------------------
// Entrada do cálculo
// ---------------------------------------------------------------------------

export interface ConsultationInput {
  origin: Place;
  destination: Place;
  modal: TransportModal;
  profile: PatientProfile;

  /** Pessoas dividindo o mesmo veículo, incluindo o paciente. Mínimo 1. */
  occupancy?: number;

  /** Baldeações no trajeto de ida (0 = direto). Afeta imprevisibilidade. */
  transfers?: number;

  /** Custo de pedágio por trajeto de ida, em reais. */
  tollBRL?: number;

  /** Custo de estacionamento pela visita inteira, em reais. */
  parkingBRL?: number;

  /**
   * Quão congestionado está o trajeto: 1.0 = fluxo livre, 2.0 = leva o dobro
   * do tempo. Afeta tempo, estresse e imprevisibilidade.
   */
  congestionFactor?: number;

  /** Duração da consulta em si, em minutos. Igual nos dois cenários. */
  consultationMinutes?: number;
}

// ---------------------------------------------------------------------------
// Provedores de rota e geocodificação
// ---------------------------------------------------------------------------

export type Confidence = "low" | "medium" | "high";

export interface RouteLeg {
  distanceKm: number;
  durationMin: number;
  /** Identificador do provedor que produziu esta estimativa. */
  providerId: string;
  /**
   * Quanto confiar no número. O estimador offline devolve `low`: ele aproxima
   * a malha viária por um fator de sinuosidade e não conhece a rua. A interface
   * mostra isso — um número sem qualificação vale menos que nenhum.
   */
  confidence: Confidence;
  /** Mensagem opcional: por que caiu para o fallback, por exemplo. */
  note?: string;
}

export interface RouteProvider {
  readonly id: string;
  estimate(
    from: LatLng,
    to: LatLng,
    modal: TransportModal,
  ): Promise<RouteLeg>;
}

export interface GeocodeProvider {
  readonly id: string;
  search(query: string): Promise<Place[]>;
}

// ---------------------------------------------------------------------------
// Resultados
// ---------------------------------------------------------------------------

/**
 * Faixa de incerteza. `value` é a estimativa central; `low` e `high` vêm da
 * propagação das faixas das constantes usadas. Só existe onde a propagação é
 * honesta — fórmulas lineares sobre constantes com faixa conhecida.
 */
export interface Uncertainty {
  value: number;
  low: number;
  high: number;
}

/**
 * Uma parcela aditiva de um índice.
 *
 * Invariante: a soma das `contribution` de todos os componentes é igual ao
 * `value` do índice, antes de arredondamento. Há teste garantindo isso para os
 * cinco índices. Essa disciplina é o que permite exibir a composição sem que
 * ela precise ser mantida à mão — e o que impede que a explicação e o número
 * saiam de sincronia.
 */
export interface IndexComponent {
  key: string;
  label: string;
  /** Valor de entrada bruto, na unidade natural do componente. */
  input: number;
  inputUnit: string;
  /** Peso aplicado, quando o índice é uma média ponderada. */
  weight?: number;
  /** Contribuição para o valor final do índice, na unidade do índice. */
  contribution: number;
  /** Aponta para uma entrada em `docs/referencias.md`. */
  sourceId: string;
}

/**
 * Uma entrada multiplicativa ou de contexto, que participa do cálculo mas não
 * é uma parcela somável — um fator de emissão, uma ocupação, um preço.
 *
 * Separá-las dos componentes é o que mantém a invariante da soma verdadeira e
 * verificável, em vez de aproximada.
 */
export interface IndexInput {
  key: string;
  label: string;
  value: number;
  unit: string;
  sourceId: string;
}

/**
 * O que todo índice devolve.
 *
 * Esta é a peça central do projeto. O "Modo Cientista" da interface não é uma
 * tela com texto escrito à mão: ele renderiza este objeto. A fórmula exibida,
 * os pesos e os valores de entrada vêm do mesmo lugar que produziu o número.
 * Não existe caminho pelo qual a explicação divirja do resultado.
 */
export interface IndexBreakdown {
  key: IndexKey;
  label: string;
  value: number;
  unit: string;
  uncertainty?: Uncertainty;
  /** Fórmula em LaTeX, para renderizar com KaTeX. */
  formulaTex: string;
  /** Parcelas somáveis. Suas contribuições somam `value`. */
  components: IndexComponent[];
  /** Fatores e constantes que entraram no cálculo sem serem parcelas. */
  inputs: IndexInput[];
  sourceIds: string[];
  indexVersion: string;
  /**
   * Ressalvas que precisam viajar junto com o número: custo sem renda
   * declarada, índice normativo, estimativa de baixa confiança.
   */
  caveats: string[];
}

export type IndexKey = "carbon" | "time" | "cost" | "burden" | "social";

export const INDEX_KEYS: readonly IndexKey[] = [
  "carbon",
  "time",
  "cost",
  "burden",
  "social",
];

/** Os cinco índices de um cenário. */
export interface ScenarioResult {
  scenario: "in_person" | "remote";
  carbon: IndexBreakdown;
  time: IndexBreakdown;
  cost: IndexBreakdown;
  burden: IndexBreakdown;
  social: IndexBreakdown;
  /** A rota usada, quando houve deslocamento. */
  route?: RouteLeg;
}

export interface Savings {
  carbonKg: number;
  timeMin: number;
  costBRL: number;
  burdenPoints: number;
  socialPoints: number;
}

export interface ImpactResult {
  indexVersion: string;
  computedAt: string;
  input: ConsultationInput;
  inPerson: ScenarioResult;
  remote: ScenarioResult;
  savings: Savings;
  /**
   * Se a teleconsulta é uma opção real para este perfil. `false` quando a
   * pessoa declarou não ter conexão confiável — caso em que a economia
   * calculada é hipotética e a interface precisa dizer isso.
   */
  remoteViable: boolean;
  /** Motivo da inviabilidade, quando `remoteViable` é `false`. */
  remoteBlockedReason?: string;
  /** Ressalvas agregadas de todos os índices, sem repetição. */
  caveats: string[];
}
