/**
 * Índice de tempo total.
 *
 * Presencial: ida + volta + overhead do modal + espera na unidade + consulta.
 * Remoto:     preparo + consulta.
 *
 * A consulta em si entra nos dois cenários, com a mesma duração. Isso é
 * proposital: ela não é o que difere entre eles, e mantê-la nos dois lados
 * impede que a comparação exagere a economia.
 *
 * O overhead do modal é o componente que quem nunca dependeu de transporte
 * público costuma esquecer. Vinte e quatro minutos parado num ponto de ônibus
 * não aparecem em nenhum aplicativo de rota, e são tempo de vida igual.
 */

import { certain, roundTo, sumUncertainty } from "../geo";
import {
  FACILITY_WAIT_MIN,
  INDEX_VERSION,
  MODAL_OVERHEAD_MIN,
  REMOTE_SETUP_MIN,
} from "../parameters";
import type { IndexBreakdown, IndexComponent, IndexInput } from "../types";
import {
  roundTripTravelMin,
  type ScenarioContext,
} from "./context";

const LABEL = "Tempo total";
const UNIT = "min";

const FORMULA_IN_PERSON = String.raw`T = (t_{\text{ida}} + t_{\text{volta}}) \times c + t_{\text{modal}} + t_{\text{espera}} + t_{\text{consulta}}`;

const FORMULA_REMOTE = String.raw`T = t_{\text{preparo}} + t_{\text{consulta}}`;

export function computeTime(ctx: ScenarioContext): IndexBreakdown {
  return ctx.scenario === "remote" ? remoteTime(ctx) : inPersonTime(ctx);
}

function remoteTime(ctx: ScenarioContext): IndexBreakdown {
  const setup = REMOTE_SETUP_MIN.value;
  const consultation = ctx.input.consultationMinutes;
  const value = setup + consultation;

  const components: IndexComponent[] = [
    {
      key: "setup",
      label: "Preparo: abrir o link, testar câmera e microfone",
      input: setup,
      inputUnit: UNIT,
      contribution: setup,
      sourceId: REMOTE_SETUP_MIN.sourceId,
    },
    {
      key: "consultation",
      label: "Consulta",
      input: consultation,
      inputUnit: UNIT,
      contribution: consultation,
      sourceId: "ms-tempo-consulta",
    },
  ];

  return {
    key: "time",
    label: LABEL,
    value: roundTo(value, 1),
    unit: UNIT,
    uncertainty: sumUncertainty([
      { value: setup, low: REMOTE_SETUP_MIN.low, high: REMOTE_SETUP_MIN.high },
      certain(consultation),
    ]),
    formulaTex: FORMULA_REMOTE,
    components,
    inputs: [],
    sourceIds: [REMOTE_SETUP_MIN.sourceId, "ms-tempo-consulta"],
    indexVersion: INDEX_VERSION,
    caveats: [],
  };
}

function inPersonTime(ctx: ScenarioContext): IndexBreakdown {
  const { modal, congestionFactor, consultationMinutes } = ctx.input;
  const overhead = MODAL_OVERHEAD_MIN[modal];

  const travelTotal = roundTripTravelMin(ctx);
  const outbound = travelTotal / 2;
  const wait = FACILITY_WAIT_MIN.value;

  const value =
    travelTotal + overhead.value + wait + consultationMinutes;

  const components: IndexComponent[] = [
    {
      key: "outbound",
      label: "Deslocamento de ida",
      input: roundTo(outbound, 1),
      inputUnit: UNIT,
      contribution: outbound,
      sourceId: ctx.route?.providerId === "openrouteservice"
        ? "via-operational"
        : "antp-mobilidade",
    },
    {
      key: "return",
      label: "Deslocamento de volta",
      input: roundTo(outbound, 1),
      inputUnit: UNIT,
      contribution: outbound,
      sourceId: ctx.route?.providerId === "openrouteservice"
        ? "via-operational"
        : "antp-mobilidade",
    },
    {
      key: "modal_overhead",
      label: overheadLabel(modal),
      input: overhead.value,
      inputUnit: UNIT,
      contribution: overhead.value,
      sourceId: overhead.sourceId,
    },
    {
      key: "facility_wait",
      label: "Espera na unidade de saúde",
      input: wait,
      inputUnit: UNIT,
      contribution: wait,
      sourceId: FACILITY_WAIT_MIN.sourceId,
    },
    {
      key: "consultation",
      label: "Consulta",
      input: consultationMinutes,
      inputUnit: UNIT,
      contribution: consultationMinutes,
      sourceId: "ms-tempo-consulta",
    },
  ];

  const inputs: IndexInput[] = [
    {
      key: "congestion",
      label: "Fator de congestionamento",
      value: congestionFactor,
      unit: "adimensional",
      sourceId: "antp-mobilidade",
    },
  ];

  const caveats: string[] = [];
  if (ctx.route?.confidence === "low") {
    caveats.push(
      "O tempo de deslocamento é uma estimativa geométrica baseada na velocidade média do modal, não em condições reais de trânsito.",
    );
  }
  if (ctx.input.profile.requiresCompanion) {
    caveats.push(
      "Este total é o tempo do paciente. O acompanhante gasta praticamente o mesmo, e esse custo não está somado aqui.",
    );
  }

  return {
    key: "time",
    label: LABEL,
    value: roundTo(value, 1),
    unit: UNIT,
    uncertainty: sumUncertainty([
      certain(travelTotal),
      { value: overhead.value, low: overhead.low, high: overhead.high },
      {
        value: wait,
        low: FACILITY_WAIT_MIN.low,
        high: FACILITY_WAIT_MIN.high,
      },
      certain(consultationMinutes),
    ]),
    formulaTex: FORMULA_IN_PERSON,
    components,
    inputs,
    sourceIds: Array.from(
      new Set([
        overhead.sourceId,
        FACILITY_WAIT_MIN.sourceId,
        "ms-tempo-consulta",
        "antp-mobilidade",
      ]),
    ),
    indexVersion: INDEX_VERSION,
    caveats,
  };
}

function overheadLabel(modal: string): string {
  switch (modal) {
    case "car_gasoline":
    case "car_ethanol":
      return "Procura de vaga e caminhada até a entrada";
    case "motorcycle":
      return "Estacionamento e equipamento";
    case "bus_urban":
      return "Espera nos pontos de ônibus (ida e volta)";
    case "metro_rail":
      return "Acesso às plataformas e espera";
    case "taxi_rideshare":
      return "Espera do veículo (ida e volta)";
    case "bicycle":
      return "Estacionar e se recompor";
    default:
      return "Tempo adicional do modal";
  }
}
