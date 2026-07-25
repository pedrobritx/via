/**
 * Índice de pegada de carbono.
 *
 *   kg CO₂e = distância_ida_e_volta × fator_do_modal ÷ ocupação
 *
 * Duas sutilezas que separam este cálculo de uma multiplicação ingênua:
 *
 * 1. A divisão por ocupação só se aplica a quem dirige. Fatores de transporte
 *    coletivo já são por passageiro-quilômetro; dividi-los de novo contaria a
 *    carona duas vezes.
 * 2. Táxi e aplicativo carregam o trecho rodado sem passageiro entre corridas.
 *    Ignorá-lo subestima a emissão em cerca de 30%.
 */

import { roundTo, roundUncertainty, scaleParameter } from "../geo";
import {
  EMISSION_FACTORS,
  INDEX_VERSION,
  TAXI_DEADHEAD_FACTOR,
  TELECONSULT_EMISSION,
} from "../parameters";
import type { IndexBreakdown, IndexComponent, IndexInput } from "../types";
import { isDrivenModal } from "../types";
import { roundTripKm, type ScenarioContext } from "./context";

const LABEL = "Pegada de carbono";
const UNIT = "kg CO₂e";

const FORMULA_IN_PERSON = String.raw`\mathrm{CO_2} = \frac{d_{\text{ida}} \times 2 \times f_{\text{modal}} \times k_{\text{ocioso}}}{n_{\text{ocupantes}}}`;

const FORMULA_REMOTE = String.raw`\mathrm{CO_2} = e_{\text{teleconsulta}}`;

export function computeCarbon(ctx: ScenarioContext): IndexBreakdown {
  return ctx.scenario === "remote" ? remoteCarbon() : inPersonCarbon(ctx);
}

function remoteCarbon(): IndexBreakdown {
  const value = TELECONSULT_EMISSION.value;

  const components: IndexComponent[] = [
    {
      key: "devices_network",
      label: "Dispositivos, rede e datacenter",
      input: 1,
      inputUnit: "consulta",
      contribution: value,
      sourceId: TELECONSULT_EMISSION.sourceId,
    },
  ];

  return {
    key: "carbon",
    label: LABEL,
    value: roundTo(value, 4),
    unit: UNIT,
    uncertainty: roundUncertainty(scaleParameter(TELECONSULT_EMISSION, 1), 4),
    formulaTex: FORMULA_REMOTE,
    components,
    inputs: [
      {
        key: "teleconsult_factor",
        label: "Emissão de uma teleconsulta",
        value: TELECONSULT_EMISSION.value,
        unit: TELECONSULT_EMISSION.unit,
        sourceId: TELECONSULT_EMISSION.sourceId,
      },
    ],
    sourceIds: [TELECONSULT_EMISSION.sourceId],
    indexVersion: INDEX_VERSION,
    caveats: [
      "A teleconsulta não emite zero. Emite pouco — mas apresentá-la como neutra seria o mesmo tipo de omissão que esta ferramenta existe para corrigir.",
    ],
  };
}

function inPersonCarbon(ctx: ScenarioContext): IndexBreakdown {
  const { modal } = ctx.input;
  const factor = EMISSION_FACTORS[modal];
  const totalKm = roundTripKm(ctx);

  // Só quem dirige divide a emissão entre os ocupantes. Fatores de coletivo já
  // são por passageiro.
  const occupancy = isDrivenModal(modal) ? ctx.input.occupancy : 1;
  const isTaxi = modal === "taxi_rideshare";
  const deadhead = isTaxi ? TAXI_DEADHEAD_FACTOR.value : 1;

  const effectiveKm = (totalKm * deadhead) / occupancy;
  const value = effectiveKm * factor.value;

  const outboundKm = totalKm / 2;
  const perLeg = value / 2;

  const components: IndexComponent[] = [
    {
      key: "outbound",
      label: "Trajeto de ida",
      input: roundTo(outboundKm, 2),
      inputUnit: "km",
      contribution: perLeg,
      sourceId: factor.sourceId,
    },
    {
      key: "return",
      label: "Trajeto de volta",
      input: roundTo(outboundKm, 2),
      inputUnit: "km",
      contribution: perLeg,
      sourceId: factor.sourceId,
    },
  ];

  const inputs: IndexInput[] = [
    {
      key: "emission_factor",
      label: `Fator de emissão (${modal})`,
      value: factor.value,
      unit: factor.unit,
      sourceId: factor.sourceId,
    },
    {
      key: "occupancy",
      label: "Ocupantes do veículo",
      value: occupancy,
      unit: "pessoas",
      sourceId: "via-operational",
    },
  ];

  if (isTaxi) {
    inputs.push({
      key: "deadhead",
      label: "Fator de rodagem sem passageiro",
      value: TAXI_DEADHEAD_FACTOR.value,
      unit: TAXI_DEADHEAD_FACTOR.unit,
      sourceId: TAXI_DEADHEAD_FACTOR.sourceId,
    });
  }

  const caveats: string[] = [];
  if (ctx.route?.confidence === "low") {
    caveats.push(
      "A distância veio de uma estimativa geométrica, não de roteamento sobre ruas. A emissão herda essa imprecisão.",
    );
  }
  if (modal === "car_ethanol") {
    caveats.push(
      "Apenas a parcela fóssil do etanol é contabilizada; o CO₂ da queima é biogênico. A contabilidade de mudança de uso do solo é contestada — veja docs/limitacoes-e-etica.md.",
    );
  }
  if (isDrivenModal(modal) && occupancy > 1) {
    caveats.push(
      `A emissão foi dividida entre ${occupancy} ocupantes. O total lançado na atmosfera é ${roundTo(value * occupancy, 2)} kg.`,
    );
  }

  const sourceIds = Array.from(
    new Set([factor.sourceId, ...(isTaxi ? [TAXI_DEADHEAD_FACTOR.sourceId] : [])]),
  );

  return {
    key: "carbon",
    label: LABEL,
    value: roundTo(value, 3),
    unit: UNIT,
    uncertainty: roundUncertainty(scaleParameter(factor, effectiveKm), 3),
    formulaTex: FORMULA_IN_PERSON,
    components,
    inputs,
    sourceIds,
    indexVersion: INDEX_VERSION,
    caveats,
  };
}
