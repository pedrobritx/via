/**
 * Índice de Carga de Deslocamento (0–100).
 *
 *   Carga = 0,40·T + 0,20·E + 0,15·C + 0,10·P + 0,15·U
 *
 * onde T é tempo, E é estresse, C é desconforto, P é estacionamento e U é
 * imprevisibilidade — todos normalizados em 0–100.
 *
 * ATENÇÃO, e isto precisa acompanhar qualquer uso do número: **os pesos são
 * normativos**. Eles expressam a posição do projeto de que o tempo domina o
 * desgaste de uma viagem, seguido pelo estresse. Não vieram de regressão sobre
 * dados de campo. A validação por questionário existe no roadmap justamente
 * para substituí-los por algo medido.
 *
 * O componente de tempo é linear até um teto de três horas. Uma curva saturante
 * seria teoricamente melhor — o custo marginal do 150º minuto é menor que o do
 * 10º —, mas o critério de aprovação da metodologia é que ela possa ser
 * explicada em dois minutos para quem não é da área, e "cada minuto conta igual
 * até três horas" passa nesse teste enquanto uma exponencial não passa.
 */

import { clamp, normalizeToScore, roundToStep } from "../geo";
import {
  BURDEN_TIME_REFERENCE_MIN,
  BURDEN_WEIGHTS,
  COMPOSITE_ROUNDING_STEP,
  CONGESTION_UNPREDICTABILITY,
  INDEX_VERSION,
  MODAL_DISCOMFORT,
  MODAL_OVERHEAD_MIN,
  MODAL_STRESS,
  PARKING_DIFFICULTY,
  REMOTE_DISCOMFORT,
  REMOTE_STRESS,
  REMOTE_UNPREDICTABILITY,
  TRANSFER_PENALTY,
} from "../parameters";
import type { IndexBreakdown, IndexComponent, IndexInput } from "../types";
import { isDrivenModal } from "../types";
import {
  roundTripTravelMin,
  type ScenarioContext,
} from "./context";

const LABEL = "Carga de deslocamento";
const UNIT = "pontos (0–100)";

const FORMULA = String.raw`\text{Carga} = 0{,}40\,T + 0{,}20\,E + 0{,}15\,C + 0{,}10\,P + 0{,}15\,U`;

const NORMATIVE_CAVEAT =
  "Os pesos deste índice são uma escolha normativa do projeto, não uma medição. " +
  "Servem para comparar cenários entre si; não são uma grandeza física. " +
  "Por isso o valor é arredondado para múltiplos de 5.";

export function computeBurden(
  ctx: ScenarioContext,
  totalMinutes: number,
): IndexBreakdown {
  const scores =
    ctx.scenario === "remote" ? remoteScores(totalMinutes) : inPersonScores(ctx);

  const components: IndexComponent[] = [
    buildComponent("time", "Tempo", scores.time, BURDEN_WEIGHTS.time.value, "min", scores.timeInput),
    buildComponent("stress", "Estresse", scores.stress, BURDEN_WEIGHTS.stress.value, "pontos", scores.stress),
    buildComponent("comfort", "Desconforto", scores.comfort, BURDEN_WEIGHTS.comfort.value, "pontos", scores.comfort),
    buildComponent("parking", "Estacionamento", scores.parking, BURDEN_WEIGHTS.parking.value, "pontos", scores.parking),
    buildComponent(
      "unpredictability",
      "Imprevisibilidade",
      scores.unpredictability,
      BURDEN_WEIGHTS.unpredictability.value,
      "pontos",
      scores.unpredictability,
    ),
  ];

  const raw = components.reduce((sum, c) => sum + c.contribution, 0);
  const value = clamp(roundToStep(raw, COMPOSITE_ROUNDING_STEP), 0, 100);

  const inputs: IndexInput[] = [
    {
      key: "time_reference",
      label: "Tempo que satura o componente de tempo",
      value: BURDEN_TIME_REFERENCE_MIN.value,
      unit: BURDEN_TIME_REFERENCE_MIN.unit,
      sourceId: BURDEN_TIME_REFERENCE_MIN.sourceId,
    },
  ];

  const caveats = [NORMATIVE_CAVEAT];
  if (ctx.route?.confidence === "low") {
    caveats.push(
      "O componente de tempo deriva de uma estimativa geométrica de rota.",
    );
  }

  return {
    key: "burden",
    label: LABEL,
    value,
    unit: UNIT,
    formulaTex: FORMULA,
    components,
    inputs,
    sourceIds: ["via-normative-v1"],
    indexVersion: INDEX_VERSION,
    caveats,
  };
}

interface BurdenScores {
  time: number;
  timeInput: number;
  stress: number;
  comfort: number;
  parking: number;
  unpredictability: number;
}

function inPersonScores(ctx: ScenarioContext): BurdenScores {
  const { modal, transfers, congestionFactor } = ctx.input;

  // O componente de tempo olha o deslocamento, não o total: a espera na
  // unidade e a consulta existem igualmente no cenário remoto e não são
  // carga de DESLOCAMENTO.
  const travelMin =
    roundTripTravelMin(ctx) + MODAL_OVERHEAD_MIN[modal].value;

  const stress = clamp(
    MODAL_STRESS[modal].value * congestionFactor,
    0,
    100,
  );

  const unpredictability = clamp(
    transfers * TRANSFER_PENALTY.value +
      CONGESTION_UNPREDICTABILITY.value * Math.max(0, congestionFactor - 1),
    0,
    100,
  );

  return {
    time: normalizeToScore(travelMin, BURDEN_TIME_REFERENCE_MIN.value),
    timeInput: Math.round(travelMin),
    stress,
    comfort: MODAL_DISCOMFORT[modal].value,
    parking: isDrivenModal(modal) ? PARKING_DIFFICULTY.value : 0,
    unpredictability,
  };
}

function remoteScores(totalMinutes: number): BurdenScores {
  return {
    // No cenário remoto não há deslocamento; o tempo que pesa é o da própria
    // consulta e do preparo.
    time: normalizeToScore(totalMinutes, BURDEN_TIME_REFERENCE_MIN.value),
    timeInput: Math.round(totalMinutes),
    stress: REMOTE_STRESS.value,
    comfort: REMOTE_DISCOMFORT.value,
    parking: 0,
    unpredictability: REMOTE_UNPREDICTABILITY.value,
  };
}

function buildComponent(
  key: string,
  label: string,
  score: number,
  weight: number,
  inputUnit: string,
  input: number,
): IndexComponent {
  return {
    key,
    label,
    input: Math.round(input),
    inputUnit,
    weight,
    contribution: score * weight,
    sourceId: "via-normative-v1",
  };
}
