import { describe, expect, it } from "vitest";

import {
  certain,
  clamp,
  haversineKm,
  inverseRampScore,
  normalizeToScore,
  rampScore,
  roundTo,
  roundToStep,
  scaleParameter,
  sumUncertainty,
} from "./geo";
import type { Parameter } from "./parameters";

describe("haversineKm", () => {
  it("devolve zero para o mesmo ponto", () => {
    const p = { lat: -23.5558, lng: -46.6396 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("aproxima uma distância conhecida entre capitais", () => {
    // São Paulo (Praça da Sé) → Rio de Janeiro (Cristo Redentor).
    // A distância em linha reta é de aproximadamente 360 km.
    const sp = { lat: -23.5505, lng: -46.6333 };
    const rj = { lat: -22.9519, lng: -43.2105 };
    const d = haversineKm(sp, rj);
    expect(d).toBeGreaterThan(350);
    expect(d).toBeLessThan(370);
  });

  it("é simétrica", () => {
    const a = { lat: -23.5505, lng: -46.6333 };
    const b = { lat: -22.9519, lng: -43.2105 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });

  it("mede um grau de latitude como ~111 km", () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("atravessa o antimeridiano sem estourar", () => {
    const d = haversineKm({ lat: 0, lng: 179.9 }, { lat: 0, lng: -179.9 });
    expect(d).toBeLessThan(30);
    expect(Number.isFinite(d)).toBe(true);
  });
});

describe("clamp", () => {
  it("limita nos dois extremos e preserva o meio", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(42, 0, 100)).toBe(42);
  });

  it("devolve o mínimo para NaN em vez de propagar sujeira", () => {
    expect(clamp(Number.NaN, 0, 100)).toBe(0);
  });
});

describe("roundToStep", () => {
  it("arredonda para o múltiplo mais próximo", () => {
    expect(roundToStep(67, 5)).toBe(65);
    expect(roundToStep(68, 5)).toBe(70);
    expect(roundToStep(2.4, 5)).toBe(0);
  });

  it("devolve o valor original quando o passo é inválido", () => {
    expect(roundToStep(67, 0)).toBe(67);
  });
});

describe("roundTo", () => {
  it("respeita as casas decimais pedidas", () => {
    expect(roundTo(9.6049, 2)).toBe(9.6);
    expect(roundTo(9.6051, 2)).toBe(9.61);
  });
});

describe("normalizeToScore", () => {
  it("mapeia proporcionalmente e satura no referencial", () => {
    expect(normalizeToScore(90, 180)).toBe(50);
    expect(normalizeToScore(180, 180)).toBe(100);
    expect(normalizeToScore(400, 180)).toBe(100);
    expect(normalizeToScore(0, 180)).toBe(0);
  });
});

describe("rampScore", () => {
  it("fica em zero antes do início da rampa", () => {
    expect(rampScore(40, 60, 85)).toBe(0);
    expect(rampScore(60, 60, 85)).toBe(0);
  });

  it("interpola dentro da rampa e satura depois", () => {
    expect(rampScore(72.5, 60, 85)).toBeCloseTo(50, 6);
    expect(rampScore(85, 60, 85)).toBe(100);
    expect(rampScore(102, 60, 85)).toBe(100);
  });
});

describe("inverseRampScore", () => {
  it("vale 100 na origem e zera a partir do limiar", () => {
    expect(inverseRampScore(0, 3)).toBe(100);
    expect(inverseRampScore(1.5, 3)).toBe(50);
    expect(inverseRampScore(3, 3)).toBe(0);
    expect(inverseRampScore(12, 3)).toBe(0);
  });
});

describe("propagação de incerteza", () => {
  const factor: Parameter = {
    value: 0.192,
    low: 0.14,
    high: 0.26,
    unit: "kgCO2e/km",
    sourceId: "defra-2024",
  };

  it("escala a faixa junto com o valor central", () => {
    const u = scaleParameter(factor, 50);
    expect(u.value).toBeCloseTo(9.6, 6);
    expect(u.low).toBeCloseTo(7, 6);
    expect(u.high).toBeCloseTo(13, 6);
  });

  it("mantém low <= high mesmo com fator negativo", () => {
    const u = scaleParameter(factor, -50);
    expect(u.low).toBeLessThanOrEqual(u.high);
  });

  it("soma faixas componente a componente", () => {
    const total = sumUncertainty([
      { value: 10, low: 8, high: 12 },
      { value: 5, low: 4, high: 7 },
    ]);
    expect(total).toEqual({ value: 15, low: 12, high: 19 });
  });

  it("soma vazia é zero, não NaN", () => {
    expect(sumUncertainty([])).toEqual({ value: 0, low: 0, high: 0 });
  });

  it("certain() produz faixa degenerada", () => {
    expect(certain(7)).toEqual({ value: 7, low: 7, high: 7 });
  });
});
