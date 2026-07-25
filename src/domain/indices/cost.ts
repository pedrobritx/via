/**
 * Índice de custo financeiro.
 *
 * Soma o que sai do bolso — combustível, tarifa, pedágio, estacionamento — e,
 * opcionalmente, o valor do tempo perdido.
 *
 * Duas decisões que evitam inventar prejuízo:
 *
 * 1. Sem renda declarada, a parcela de produtividade simplesmente não entra, e
 *    o resultado se declara parcial. Imputar o salário mínimo a quem não
 *    informou renda produziria um número com aparência de fato.
 * 2. `countProductivityLoss` existe para quem é aposentado, desempregado ou tem
 *    jornada flexível. Para essas pessoas a viagem custa tempo de vida, mas não
 *    salário, e converter uma coisa na outra seria uma conta falsa.
 *
 * O tempo de consulta remota também é convertido em dinheiro, quando cabe.
 * Descontar apenas o lado presencial exageraria a economia.
 */

import { certain, clamp, roundTo, sumUncertainty } from "../geo";
import {
  FUEL_CONSUMPTION_L_PER_KM,
  FUEL_PRICE_BRL_PER_L,
  INDEX_VERSION,
  TAXI_BASE_FARE_BRL,
  TAXI_PER_KM_BRL,
  TRANSIT_FARE_BRL,
  WORK_HOURS_PER_MONTH,
} from "../parameters";
import type {
  IndexBreakdown,
  IndexComponent,
  IndexInput,
  Uncertainty,
} from "../types";
import { isDrivenModal, isTransitModal } from "../types";
import { roundTripKm, type ScenarioContext } from "./context";

const LABEL = "Custo";
const UNIT = "R$";

// O acento vai como caractere, não como `\acute{a}`: no modo texto do KaTeX a
// macro de acento é inválida, e a fórmula inteira deixava de renderizar.
const FORMULA_IN_PERSON = String.raw`C = C_{\text{transporte}} + C_{\text{pedágio}} + C_{\text{estacionamento}} + \frac{R_{\text{mensal}}}{220} \times h`;

const FORMULA_REMOTE = String.raw`C = \frac{R_{\text{mensal}}}{220} \times h`;

export function computeCost(
  ctx: ScenarioContext,
  totalMinutes: number,
): IndexBreakdown {
  const { profile, modal, transfers, occupancy } = ctx.input;
  const components: IndexComponent[] = [];
  const inputs: IndexInput[] = [];
  const uncertainties: Uncertainty[] = [];
  const caveats: string[] = [];
  const sourceIds = new Set<string>();

  const isRemote = ctx.scenario === "remote";
  const totalKm = roundTripKm(ctx);

  // Passageiros que pagam tarifa: o paciente e, se houver, o acompanhante.
  const payingPassengers = 1 + (profile.requiresCompanion ? 1 : 0);

  if (!isRemote) {
    if (isDrivenModal(modal)) {
      const consumption = FUEL_CONSUMPTION_L_PER_KM[modal];
      const price = FUEL_PRICE_BRL_PER_L[modal];

      if (consumption && price) {
        const litres = totalKm * consumption.value;
        const fuel = litres * price.value;

        components.push({
          key: "fuel",
          label: "Combustível",
          input: roundTo(litres, 2),
          inputUnit: "L",
          contribution: fuel,
          sourceId: price.sourceId,
        });
        uncertainties.push({
          value: fuel,
          low: totalKm * consumption.low * price.low,
          high: totalKm * consumption.high * price.high,
        });
        inputs.push(
          {
            key: "fuel_price",
            label: "Preço do combustível",
            value: price.value,
            unit: price.unit,
            sourceId: price.sourceId,
          },
          {
            key: "fuel_consumption",
            label: "Consumo do veículo",
            value: roundTo(1 / consumption.value, 1),
            unit: "km/L",
            sourceId: consumption.sourceId,
          },
        );
        sourceIds.add(price.sourceId);
        sourceIds.add(consumption.sourceId);

        if (occupancy > 1) {
          caveats.push(
            `O combustível é do veículo inteiro, não dividido entre os ${occupancy} ocupantes.`,
          );
        }
      }
    } else if (isTransitModal(modal)) {
      const fare = TRANSIT_FARE_BRL[modal];
      if (fare) {
        // Uma passagem por embarque: (1 + baldeações), ida e volta, por pessoa.
        const rides = (1 + transfers) * 2 * payingPassengers;
        const total = rides * fare.value;

        components.push({
          key: "fare",
          label: "Passagens",
          input: rides,
          inputUnit: "embarques",
          contribution: total,
          sourceId: fare.sourceId,
        });
        uncertainties.push({
          value: total,
          low: rides * fare.low,
          high: rides * fare.high,
        });
        inputs.push({
          key: "fare_unit",
          label: "Tarifa unitária",
          value: fare.value,
          unit: fare.unit,
          sourceId: fare.sourceId,
        });
        sourceIds.add(fare.sourceId);

        caveats.push(
          "A tarifa é a cheia. Gratuidade para pessoas idosas e integração tarifária reduzem esse valor e não estão consideradas.",
        );
      }
    } else if (modal === "taxi_rideshare") {
      const trips = 2;
      const total =
        trips * TAXI_BASE_FARE_BRL.value + totalKm * TAXI_PER_KM_BRL.value;

      components.push({
        key: "taxi",
        label: "Corridas de táxi ou aplicativo",
        input: trips,
        inputUnit: "corridas",
        contribution: total,
        sourceId: TAXI_PER_KM_BRL.sourceId,
      });
      uncertainties.push({
        value: total,
        low: trips * TAXI_BASE_FARE_BRL.low + totalKm * TAXI_PER_KM_BRL.low,
        high: trips * TAXI_BASE_FARE_BRL.high + totalKm * TAXI_PER_KM_BRL.high,
      });
      inputs.push({
        key: "taxi_per_km",
        label: "Tarifa por quilômetro",
        value: TAXI_PER_KM_BRL.value,
        unit: TAXI_PER_KM_BRL.unit,
        sourceId: TAXI_PER_KM_BRL.sourceId,
      });
      sourceIds.add(TAXI_PER_KM_BRL.sourceId);
    }

    if (isDrivenModal(modal)) {
      if (ctx.input.tollBRL > 0) {
        const toll = ctx.input.tollBRL * 2;
        components.push({
          key: "toll",
          label: "Pedágio (ida e volta)",
          input: ctx.input.tollBRL,
          inputUnit: "R$/trajeto",
          contribution: toll,
          sourceId: "via-operational",
        });
        uncertainties.push(certain(toll));
        sourceIds.add("via-operational");
      }

      if (ctx.input.parkingBRL > 0) {
        components.push({
          key: "parking",
          label: "Estacionamento",
          input: ctx.input.parkingBRL,
          inputUnit: UNIT,
          contribution: ctx.input.parkingBRL,
          sourceId: "via-operational",
        });
        uncertainties.push(certain(ctx.input.parkingBRL));
        sourceIds.add("via-operational");
      }
    }
  }

  // --- Produtividade -------------------------------------------------------
  const income = profile.monthlyIncomeBRL;
  const hours = clamp(totalMinutes, 0, 24 * 60) / 60;

  if (profile.countProductivityLoss && income !== undefined && income > 0) {
    const hourly = income / WORK_HOURS_PER_MONTH.value;
    const lost = hourly * hours;

    components.push({
      key: "productivity",
      label: "Produtividade perdida",
      input: roundTo(hours, 2),
      inputUnit: "h",
      contribution: lost,
      sourceId: WORK_HOURS_PER_MONTH.sourceId,
    });
    uncertainties.push(certain(lost));
    inputs.push({
      key: "hourly_income",
      label: "Renda por hora",
      value: roundTo(hourly, 2),
      unit: "R$/h",
      sourceId: WORK_HOURS_PER_MONTH.sourceId,
    });
    sourceIds.add(WORK_HOURS_PER_MONTH.sourceId);
  } else if (!profile.countProductivityLoss) {
    caveats.push(
      "A perda de produtividade não foi somada, conforme indicado no perfil. O tempo continua sendo gasto — ele só não vira desconto no salário.",
    );
  } else if (income === undefined) {
    caveats.push(
      "Sem renda declarada, a produtividade perdida não entra na conta. Este custo é parcial: representa apenas o desembolso direto.",
    );
  }

  if (profile.requiresCompanion && payingPassengers > 1) {
    caveats.push(
      "As passagens incluem o acompanhante, mas o tempo dele não foi convertido em dinheiro.",
    );
  }

  // Um índice sem componente nenhum renderizaria uma tabela vazia e não citaria
  // fonte alguma. Custo zero é um resultado legítimo — caminhar sem converter
  // tempo em salário custa mesmo nada — e merece ser dito, não omitido.
  if (components.length === 0) {
    components.push({
      key: "no_out_of_pocket",
      label: isRemote
        ? "Sem desembolso: a consulta é feita de casa"
        : "Sem desembolso direto neste modal",
      input: 0,
      inputUnit: UNIT,
      contribution: 0,
      sourceId: "via-operational",
    });
    sourceIds.add("via-operational");
  }

  const value = components.reduce((sum, c) => sum + c.contribution, 0);

  return {
    key: "cost",
    label: LABEL,
    value: roundTo(value, 2),
    unit: UNIT,
    uncertainty: sumUncertainty(uncertainties),
    formulaTex: isRemote ? FORMULA_REMOTE : FORMULA_IN_PERSON,
    components,
    inputs,
    sourceIds: Array.from(sourceIds),
    indexVersion: INDEX_VERSION,
    caveats,
  };
}
