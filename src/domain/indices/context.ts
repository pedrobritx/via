/**
 * Contexto de cálculo compartilhado pelos cinco índices.
 *
 * Normaliza a entrada uma única vez — aplica padrões, satura valores absurdos —
 * para que nenhum índice precise repetir essa lógica e para que todos vejam
 * exatamente os mesmos números.
 */

import { clamp } from "../geo";
import {
  CONSULTATION_MIN,
  DEFAULT_CONGESTION_FACTOR,
  DEFAULT_OCCUPANCY,
} from "../parameters";
import type { ConsultationInput, RouteLeg } from "../types";

/** Entrada com todos os opcionais resolvidos e saneados. */
export interface NormalizedInput extends ConsultationInput {
  occupancy: number;
  transfers: number;
  tollBRL: number;
  parkingBRL: number;
  congestionFactor: number;
  consultationMinutes: number;
}

/** Limites de sanidade. Protegem as fórmulas de entradas hostis ou digitadas errado. */
const MAX_OCCUPANCY = 8;
const MAX_TRANSFERS = 10;
const MAX_CONGESTION = 4;
const MAX_MONEY_BRL = 100_000;
const MAX_CONSULTATION_MIN = 480;

export function normalizeInput(input: ConsultationInput): NormalizedInput {
  return {
    ...input,
    occupancy: Math.round(
      clamp(input.occupancy ?? DEFAULT_OCCUPANCY.value, 1, MAX_OCCUPANCY),
    ),
    transfers: Math.round(clamp(input.transfers ?? 0, 0, MAX_TRANSFERS)),
    tollBRL: clamp(input.tollBRL ?? 0, 0, MAX_MONEY_BRL),
    parkingBRL: clamp(input.parkingBRL ?? 0, 0, MAX_MONEY_BRL),
    congestionFactor: clamp(
      input.congestionFactor ?? DEFAULT_CONGESTION_FACTOR.value,
      1,
      MAX_CONGESTION,
    ),
    consultationMinutes: clamp(
      input.consultationMinutes ?? CONSULTATION_MIN.value,
      0,
      MAX_CONSULTATION_MIN,
    ),
    profile: {
      ...input.profile,
      age: clamp(input.profile.age, 0, 120),
      monthlyIncomeBRL:
        input.profile.monthlyIncomeBRL === undefined
          ? undefined
          : clamp(input.profile.monthlyIncomeBRL, 0, MAX_MONEY_BRL),
    },
  };
}

export interface ScenarioContext {
  scenario: "in_person" | "remote";
  input: NormalizedInput;
  /** Presente apenas no cenário presencial. */
  route?: RouteLeg;
}

export function inPersonContext(
  input: NormalizedInput,
  route: RouteLeg,
): ScenarioContext {
  return { scenario: "in_person", input, route };
}

export function remoteContext(input: NormalizedInput): ScenarioContext {
  return { scenario: "remote", input };
}

/** Distância total percorrida: ida mais volta. */
export function roundTripKm(ctx: ScenarioContext): number {
  return (ctx.route?.distanceKm ?? 0) * 2;
}

/**
 * Tempo em movimento, ida mais volta, já corrigido pelo congestionamento.
 *
 * O fator padrão é 1,0 justamente para não contar o trânsito duas vezes: as
 * velocidades médias do estimador já são de cidade congestionada.
 */
export function roundTripTravelMin(ctx: ScenarioContext): number {
  return (ctx.route?.durationMin ?? 0) * 2 * ctx.input.congestionFactor;
}
