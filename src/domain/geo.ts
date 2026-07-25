/**
 * Utilidades numéricas e geográficas do núcleo de cálculo.
 *
 * Sem dependências. Tudo aqui é determinístico: a mesma entrada produz sempre
 * a mesma saída, o que é requisito para que um resultado do VIA possa ser
 * reproduzido por terceiros meses depois.
 */

import type { Parameter } from "./parameters";
import type { LatLng, Uncertainty } from "./types";

/** Raio médio da Terra, em quilômetros (esfera de referência da IUGG). */
const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Distância em linha reta sobre a superfície da Terra, pela fórmula de
 * haversine.
 *
 * É a base do estimador offline. Note que é a distância do corvo, não a da
 * rua: quem consome este valor precisa aplicar o fator de sinuosidade do modal
 * antes de chamá-lo de "distância percorrida".
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Arredonda para um número fixo de casas decimais. */
export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Arredonda para o múltiplo mais próximo de `step`.
 *
 * Usado nos índices compostos. Ver `COMPOSITE_ROUNDING_STEP` em parameters.ts
 * para o porquê.
 */
export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/**
 * Converte uma grandeza para a escala 0–100, linearmente, saturando no
 * referencial. Valores acima de `reference` viram 100.
 */
export function normalizeToScore(value: number, reference: number): number {
  if (reference <= 0) return 0;
  return clamp((value / reference) * 100, 0, 100);
}

/**
 * Rampa linear entre dois pontos, devolvendo 0–100.
 *
 * Abaixo de `onset` devolve 0; acima de `saturation` devolve 100; no meio,
 * interpola. É a forma do componente de idade do índice social.
 */
export function rampScore(
  value: number,
  onset: number,
  saturation: number,
): number {
  if (saturation <= onset) return value >= saturation ? 100 : 0;
  return clamp(((value - onset) / (saturation - onset)) * 100, 0, 100);
}

/**
 * Rampa decrescente: 100 em zero, 0 a partir de `threshold`.
 *
 * É a forma do componente de renda — quanto menos se ganha, mais pesa.
 */
export function inverseRampScore(value: number, threshold: number): number {
  if (threshold <= 0) return 0;
  return clamp(((threshold - value) / threshold) * 100, 0, 100);
}

// ---------------------------------------------------------------------------
// Propagação de incerteza
// ---------------------------------------------------------------------------

/**
 * Multiplica um parâmetro por um fator conhecido, propagando a faixa.
 *
 * Só é honesto porque as fórmulas onde isso é usado (emissão, custo) são
 * lineares no parâmetro. Não use em relação não linear sem repensar.
 */
export function scaleParameter(
  param: Parameter,
  factor: number,
): Uncertainty {
  const lo = param.low * factor;
  const hi = param.high * factor;
  return {
    value: param.value * factor,
    low: Math.min(lo, hi),
    high: Math.max(lo, hi),
  };
}

/** Soma faixas de incerteza componente a componente. */
export function sumUncertainty(parts: Uncertainty[]): Uncertainty {
  return parts.reduce<Uncertainty>(
    (acc, part) => ({
      value: acc.value + part.value,
      low: acc.low + part.low,
      high: acc.high + part.high,
    }),
    { value: 0, low: 0, high: 0 },
  );
}

/** Um valor sem incerteza associada. */
export function certain(value: number): Uncertainty {
  return { value, low: value, high: value };
}

export function roundUncertainty(u: Uncertainty, decimals: number): Uncertainty {
  return {
    value: roundTo(u.value, decimals),
    low: roundTo(u.low, decimals),
    high: roundTo(u.high, decimals),
  };
}
