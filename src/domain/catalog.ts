/**
 * Catálogo publicável de parâmetros.
 *
 * Serializa todas as constantes do sistema, agrupadas, com suas fontes e a
 * versão dos índices. Alimenta tanto `GET /api/parameters` quanto a página
 * pública de metodologia.
 *
 * A página de metodologia é gerada a partir daqui, e não escrita à mão, pelo
 * mesmo motivo que o Modo Cientista renderiza o `IndexBreakdown`: documentação
 * mantida em paralelo ao código diverge do código. Documentação derivada dele
 * não tem como divergir.
 */

import {
  BURDEN_TIME_REFERENCE_MIN,
  BURDEN_WEIGHTS,
  COMPOSITE_ROUNDING_STEP,
  CONGESTION_UNPREDICTABILITY,
  CONSULTATION_MIN,
  DEFAULT_CONGESTION_FACTOR,
  DEFAULT_OCCUPANCY,
  EMISSION_FACTORS,
  FACILITY_WAIT_MIN,
  FUEL_CONSUMPTION_L_PER_KM,
  FUEL_PRICE_BRL_PER_L,
  INDEX_VERSION,
  MINIMUM_WAGE_BRL,
  MODAL_DETOUR_FACTOR,
  MODAL_DISCOMFORT,
  MODAL_OVERHEAD_MIN,
  MODAL_SPEED_KMH,
  MODAL_STRESS,
  PARKING_DIFFICULTY,
  REMOTE_DISCOMFORT,
  REMOTE_SETUP_MIN,
  REMOTE_SOCIAL_RESIDUAL,
  REMOTE_STRESS,
  REMOTE_UNPREDICTABILITY,
  SOCIAL_AGE_ONSET,
  SOCIAL_AGE_SATURATION,
  SOCIAL_INCOME_THRESHOLD_MW,
  SOCIAL_MINOR_SCORE,
  SOCIAL_MOBILITY_SCORE,
  SOCIAL_WEIGHTS,
  SOURCES,
  TAXI_BASE_FARE_BRL,
  TAXI_DEADHEAD_FACTOR,
  TAXI_PER_KM_BRL,
  TELECONSULT_EMISSION,
  TRANSIT_FARE_BRL,
  WORK_HOURS_PER_MONTH,
  type Parameter,
  type Source,
} from "./parameters";

export interface CatalogEntry extends Parameter {
  key: string;
}

export interface CatalogGroup {
  id: string;
  title: string;
  description: string;
  entries: CatalogEntry[];
}

export interface ParameterCatalog {
  indexVersion: string;
  compositeRoundingStep: number;
  groups: CatalogGroup[];
  sources: Source[];
}

function flatten(record: Record<string, Parameter>): CatalogEntry[] {
  return Object.entries(record).map(([key, param]) => ({ key, ...param }));
}

export function buildParameterCatalog(): ParameterCatalog {
  const groups: CatalogGroup[] = [
    {
      id: "emissions",
      title: "Fatores de emissão",
      description:
        "Quilogramas de CO₂ equivalente por quilômetro. Para modais coletivos, por passageiro-quilômetro.",
      entries: [
        ...flatten(EMISSION_FACTORS),
        { key: "taxi_deadhead", ...TAXI_DEADHEAD_FACTOR },
        { key: "teleconsult", ...TELECONSULT_EMISSION },
      ],
    },
    {
      id: "routing",
      title: "Estimador offline de rota",
      description:
        "Velocidades médias porta a porta e fatores de sinuosidade usados quando não há serviço de roteamento configurado.",
      entries: [
        ...flatten(MODAL_SPEED_KMH).map((e) => ({ ...e, key: `speed.${e.key}` })),
        ...flatten(MODAL_DETOUR_FACTOR).map((e) => ({
          ...e,
          key: `detour.${e.key}`,
        })),
      ],
    },
    {
      id: "time",
      title: "Tempo",
      description:
        "Minutos que não aparecem em aplicativo de rota: espera no ponto, procura de vaga, espera na unidade.",
      entries: [
        ...flatten(MODAL_OVERHEAD_MIN).map((e) => ({
          ...e,
          key: `overhead.${e.key}`,
        })),
        { key: "facility_wait", ...FACILITY_WAIT_MIN },
        { key: "consultation", ...CONSULTATION_MIN },
        { key: "remote_setup", ...REMOTE_SETUP_MIN },
        { key: "default_congestion", ...DEFAULT_CONGESTION_FACTOR },
      ],
    },
    {
      id: "cost",
      title: "Custo",
      description:
        "Preços de combustível, tarifas e a conversão de tempo em renda.",
      entries: [
        ...flatten(FUEL_CONSUMPTION_L_PER_KM as Record<string, Parameter>).map(
          (e) => ({ ...e, key: `consumption.${e.key}` }),
        ),
        ...flatten(FUEL_PRICE_BRL_PER_L as Record<string, Parameter>).map((e) => ({
          ...e,
          key: `fuel_price.${e.key}`,
        })),
        ...flatten(TRANSIT_FARE_BRL as Record<string, Parameter>).map((e) => ({
          ...e,
          key: `fare.${e.key}`,
        })),
        { key: "taxi_base_fare", ...TAXI_BASE_FARE_BRL },
        { key: "taxi_per_km", ...TAXI_PER_KM_BRL },
        { key: "work_hours_per_month", ...WORK_HOURS_PER_MONTH },
        { key: "minimum_wage", ...MINIMUM_WAGE_BRL },
        { key: "default_occupancy", ...DEFAULT_OCCUPANCY },
      ],
    },
    {
      id: "burden",
      title: "Carga de deslocamento",
      description:
        "Pesos e escalas do índice composto de esforço. ATENÇÃO: os pesos são normativos, não medidos.",
      entries: [
        ...flatten(BURDEN_WEIGHTS as unknown as Record<string, Parameter>).map(
          (e) => ({ ...e, key: `weight.${e.key}` }),
        ),
        { key: "time_reference", ...BURDEN_TIME_REFERENCE_MIN },
        ...flatten(MODAL_STRESS).map((e) => ({ ...e, key: `stress.${e.key}` })),
        ...flatten(MODAL_DISCOMFORT).map((e) => ({
          ...e,
          key: `discomfort.${e.key}`,
        })),
        { key: "parking_difficulty", ...PARKING_DIFFICULTY },
        { key: "congestion_unpredictability", ...CONGESTION_UNPREDICTABILITY },
        { key: "remote_stress", ...REMOTE_STRESS },
        { key: "remote_discomfort", ...REMOTE_DISCOMFORT },
        { key: "remote_unpredictability", ...REMOTE_UNPREDICTABILITY },
      ],
    },
    {
      id: "social",
      title: "Impacto social",
      description:
        "Pesos e escalas do ônus que o deslocamento impõe a cada perfil. ATENÇÃO: os pesos são normativos, não medidos.",
      entries: [
        ...flatten(SOCIAL_WEIGHTS as unknown as Record<string, Parameter>).map(
          (e) => ({ ...e, key: `weight.${e.key}` }),
        ),
        { key: "age_onset", ...SOCIAL_AGE_ONSET },
        { key: "age_saturation", ...SOCIAL_AGE_SATURATION },
        { key: "minor_score", ...SOCIAL_MINOR_SCORE },
        ...flatten(SOCIAL_MOBILITY_SCORE).map((e) => ({
          ...e,
          key: `mobility.${e.key}`,
        })),
        { key: "income_threshold", ...SOCIAL_INCOME_THRESHOLD_MW },
        { key: "remote_residual", ...REMOTE_SOCIAL_RESIDUAL },
      ],
    },
  ];

  return {
    indexVersion: INDEX_VERSION,
    compositeRoundingStep: COMPOSITE_ROUNDING_STEP,
    groups,
    sources: Object.values(SOURCES),
  };
}
