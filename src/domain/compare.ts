/**
 * Monta os dois cenários e os compara.
 *
 * A ordem importa: tempo é calculado antes de custo e carga, porque ambos
 * dependem do total de minutos. Fazer isso explicitamente, em vez de recalcular
 * o tempo dentro de cada índice, garante que os três olhem exatamente o mesmo
 * número.
 */

import { roundTo } from "./geo";
import { computeBurden } from "./indices/burden";
import { computeCarbon } from "./indices/carbon";
import {
  inPersonContext,
  normalizeInput,
  remoteContext,
  type NormalizedInput,
  type ScenarioContext,
} from "./indices/context";
import { computeCost } from "./indices/cost";
import { computeSocial } from "./indices/social";
import { computeTime } from "./indices/time";
import { INDEX_VERSION } from "./parameters";
import type {
  ConsultationInput,
  ImpactResult,
  RouteLeg,
  RouteProvider,
  Savings,
  ScenarioResult,
} from "./types";

function buildScenario(ctx: ScenarioContext): ScenarioResult {
  const time = computeTime(ctx);
  const totalMinutes = time.value;

  return {
    scenario: ctx.scenario,
    carbon: computeCarbon(ctx),
    time,
    cost: computeCost(ctx, totalMinutes),
    burden: computeBurden(ctx, totalMinutes),
    social: computeSocial(ctx),
    route: ctx.route,
  };
}

/**
 * Calcula o impacto a partir de uma rota já resolvida.
 *
 * Separado de `calculateImpact` para que o cálculo em si permaneça síncrono e
 * puro — dá para testá-lo com uma rota fixa, sem provedor nenhum.
 */
export function calculateImpactWithRoute(
  rawInput: ConsultationInput,
  route: RouteLeg,
): ImpactResult {
  const input: NormalizedInput = normalizeInput(rawInput);

  const inPerson = buildScenario(inPersonContext(input, route));
  const remote = buildScenario(remoteContext(input));

  const savings: Savings = {
    carbonKg: roundTo(inPerson.carbon.value - remote.carbon.value, 3),
    timeMin: roundTo(inPerson.time.value - remote.time.value, 1),
    costBRL: roundTo(inPerson.cost.value - remote.cost.value, 2),
    burdenPoints: roundTo(inPerson.burden.value - remote.burden.value, 1),
    socialPoints: roundTo(inPerson.social.value - remote.social.value, 1),
  };

  const remoteViable = input.profile.hasReliableInternet;

  const caveats = Array.from(
    new Set([
      ...inPerson.carbon.caveats,
      ...inPerson.time.caveats,
      ...inPerson.cost.caveats,
      ...inPerson.burden.caveats,
      ...inPerson.social.caveats,
      ...remote.carbon.caveats,
      ...remote.time.caveats,
      ...remote.cost.caveats,
      ...remote.burden.caveats,
      ...remote.social.caveats,
    ]),
  );

  return {
    indexVersion: INDEX_VERSION,
    computedAt: new Date().toISOString(),
    input,
    inPerson,
    remote,
    savings,
    remoteViable,
    remoteBlockedReason: remoteViable
      ? undefined
      : "O perfil declara não ter conexão de internet confiável. A economia abaixo é hipotética: " +
        "recomendar teleconsulta a quem não tem internet transfere o problema em vez de resolvê-lo. " +
        "Nesses casos, o caminho é transporte assistido, atendimento domiciliar ou um ponto de " +
        "telessaúde apoiado perto de casa.",
    caveats,
  };
}

/** Calcula o impacto resolvendo a rota pelo provedor configurado. */
export async function calculateImpact(
  rawInput: ConsultationInput,
  provider: RouteProvider,
): Promise<ImpactResult> {
  const route = await provider.estimate(
    rawInput.origin,
    rawInput.destination,
    rawInput.modal,
  );
  return calculateImpactWithRoute(rawInput, route);
}

/**
 * Quais economias são grandes o bastante para entrar no resumo.
 *
 * O domínio decide *o que* vale mencionar; quem monta a frase e formata os
 * números é a camada de apresentação, que conhece o idioma. Formatar aqui
 * produziria "146.84" no meio de uma interface que escreve "146,85".
 */
export function significantSavings(result: ImpactResult): Array<
  "time" | "cost" | "carbon"
> {
  const { savings } = result;
  const kinds: Array<"time" | "cost" | "carbon"> = [];

  if (savings.timeMin >= 1) kinds.push("time");
  if (savings.costBRL >= 0.5) kinds.push("cost");
  if (savings.carbonKg >= 0.01) kinds.push("carbon");

  return kinds;
}
