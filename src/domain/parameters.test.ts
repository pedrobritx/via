import { describe, expect, it } from "vitest";

import {
  BURDEN_WEIGHTS,
  CONSULTATION_MIN,
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
  type Parameter,
  PARKING_DIFFICULTY,
  REMOTE_SETUP_MIN,
  SOCIAL_MOBILITY_SCORE,
  SOCIAL_WEIGHTS,
  SOURCES,
  TAXI_DEADHEAD_FACTOR,
  TELECONSULT_EMISSION,
  TRANSIT_FARE_BRL,
  WORK_HOURS_PER_MONTH,
} from "./parameters";
import { DRIVEN_MODALS, MOBILITY_LEVELS, TRANSPORT_MODALS } from "./types";

/** Junta todos os parâmetros do sistema em uma lista nomeada. */
function allParameters(): Array<[string, Parameter]> {
  const entries: Array<[string, Parameter]> = [];

  const addRecord = (name: string, rec: Record<string, Parameter>) => {
    for (const [key, param] of Object.entries(rec)) {
      entries.push([`${name}.${key}`, param]);
    }
  };

  addRecord("EMISSION_FACTORS", EMISSION_FACTORS);
  addRecord("MODAL_SPEED_KMH", MODAL_SPEED_KMH);
  addRecord("MODAL_DETOUR_FACTOR", MODAL_DETOUR_FACTOR);
  addRecord("MODAL_OVERHEAD_MIN", MODAL_OVERHEAD_MIN);
  addRecord("MODAL_STRESS", MODAL_STRESS);
  addRecord("MODAL_DISCOMFORT", MODAL_DISCOMFORT);
  addRecord("SOCIAL_MOBILITY_SCORE", SOCIAL_MOBILITY_SCORE);
  addRecord("BURDEN_WEIGHTS", BURDEN_WEIGHTS as unknown as Record<string, Parameter>);
  addRecord("SOCIAL_WEIGHTS", SOCIAL_WEIGHTS as unknown as Record<string, Parameter>);
  addRecord(
    "FUEL_CONSUMPTION_L_PER_KM",
    FUEL_CONSUMPTION_L_PER_KM as Record<string, Parameter>,
  );
  addRecord(
    "FUEL_PRICE_BRL_PER_L",
    FUEL_PRICE_BRL_PER_L as Record<string, Parameter>,
  );
  addRecord("TRANSIT_FARE_BRL", TRANSIT_FARE_BRL as Record<string, Parameter>);

  entries.push(
    ["TELECONSULT_EMISSION", TELECONSULT_EMISSION],
    ["TAXI_DEADHEAD_FACTOR", TAXI_DEADHEAD_FACTOR],
    ["FACILITY_WAIT_MIN", FACILITY_WAIT_MIN],
    ["CONSULTATION_MIN", CONSULTATION_MIN],
    ["REMOTE_SETUP_MIN", REMOTE_SETUP_MIN],
    ["WORK_HOURS_PER_MONTH", WORK_HOURS_PER_MONTH],
    ["MINIMUM_WAGE_BRL", MINIMUM_WAGE_BRL],
    ["PARKING_DIFFICULTY", PARKING_DIFFICULTY],
  );

  return entries;
}

describe("integridade dos parâmetros", () => {
  const params = allParameters();

  it("todo parâmetro respeita low <= value <= high", () => {
    for (const [name, param] of params) {
      expect(param.low, `${name}.low > ${name}.value`).toBeLessThanOrEqual(
        param.value,
      );
      expect(param.value, `${name}.value > ${name}.high`).toBeLessThanOrEqual(
        param.high,
      );
    }
  });

  it("todo parâmetro tem valores finitos", () => {
    for (const [name, param] of params) {
      expect(Number.isFinite(param.value), `${name}.value`).toBe(true);
      expect(Number.isFinite(param.low), `${name}.low`).toBe(true);
      expect(Number.isFinite(param.high), `${name}.high`).toBe(true);
    }
  });

  it("todo parâmetro declara unidade não vazia", () => {
    for (const [name, param] of params) {
      expect(param.unit.length, `${name} sem unidade`).toBeGreaterThan(0);
    }
  });

  it("todo sourceId aponta para uma fonte existente", () => {
    for (const [name, param] of params) {
      expect(
        SOURCES[param.sourceId],
        `${name} cita a fonte inexistente "${param.sourceId}"`,
      ).toBeDefined();
    }
  });

  it("toda fonte declarada é efetivamente usada", () => {
    const used = new Set(params.map(([, param]) => param.sourceId));
    for (const id of Object.keys(SOURCES)) {
      expect(used.has(id), `fonte "${id}" declarada mas nunca citada`).toBe(
        true,
      );
    }
  });

  it("toda fonte tem título, publicador e ano plausível", () => {
    for (const [id, source] of Object.entries(SOURCES)) {
      expect(source.id, `${id} com id divergente da chave`).toBe(id);
      expect(source.title.length).toBeGreaterThan(0);
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.year).toBeGreaterThan(1990);
      expect(source.year).toBeLessThan(2100);
    }
  });
});

describe("cobertura por modal", () => {
  it("todo modal tem fator de emissão, velocidade, sinuosidade e overhead", () => {
    for (const modal of TRANSPORT_MODALS) {
      expect(EMISSION_FACTORS[modal], `emissão de ${modal}`).toBeDefined();
      expect(MODAL_SPEED_KMH[modal], `velocidade de ${modal}`).toBeDefined();
      expect(MODAL_DETOUR_FACTOR[modal], `sinuosidade de ${modal}`).toBeDefined();
      expect(MODAL_OVERHEAD_MIN[modal], `overhead de ${modal}`).toBeDefined();
    }
  });

  it("todo modal tem estresse e desconforto na escala 0-100", () => {
    for (const modal of TRANSPORT_MODALS) {
      expect(MODAL_STRESS[modal].value).toBeGreaterThanOrEqual(0);
      expect(MODAL_STRESS[modal].value).toBeLessThanOrEqual(100);
      expect(MODAL_DISCOMFORT[modal].value).toBeGreaterThanOrEqual(0);
      expect(MODAL_DISCOMFORT[modal].value).toBeLessThanOrEqual(100);
    }
  });

  it("todo modal que se dirige tem consumo e preço de combustível", () => {
    for (const modal of DRIVEN_MODALS) {
      expect(FUEL_CONSUMPTION_L_PER_KM[modal], `consumo de ${modal}`).toBeDefined();
      expect(FUEL_PRICE_BRL_PER_L[modal], `preço de ${modal}`).toBeDefined();
    }
  });

  it("todo nível de mobilidade tem pontuação social", () => {
    for (const level of MOBILITY_LEVELS) {
      expect(SOCIAL_MOBILITY_SCORE[level], `mobilidade ${level}`).toBeDefined();
    }
  });

  it("apenas os modais coletivos têm tarifa", () => {
    expect(TRANSIT_FARE_BRL.bus_urban).toBeDefined();
    expect(TRANSIT_FARE_BRL.metro_rail).toBeDefined();
    expect(TRANSIT_FARE_BRL.walking).toBeUndefined();
    expect(TRANSIT_FARE_BRL.car_gasoline).toBeUndefined();
  });
});

describe("pesos dos índices compostos", () => {
  it("os pesos da carga de deslocamento somam exatamente 1", () => {
    const total = Object.values(BURDEN_WEIGHTS).reduce(
      (sum, w) => sum + w.value,
      0,
    );
    expect(total).toBeCloseTo(1, 10);
  });

  it("os pesos do impacto social somam exatamente 1", () => {
    const total = Object.values(SOCIAL_WEIGHTS).reduce(
      (sum, w) => sum + w.value,
      0,
    );
    expect(total).toBeCloseTo(1, 10);
  });

  it("nenhum peso é negativo", () => {
    for (const w of [
      ...Object.values(BURDEN_WEIGHTS),
      ...Object.values(SOCIAL_WEIGHTS),
    ]) {
      expect(w.value).toBeGreaterThanOrEqual(0);
    }
  });

  it("todo peso normativo é declarado como tal, não como medição", () => {
    for (const w of [
      ...Object.values(BURDEN_WEIGHTS),
      ...Object.values(SOCIAL_WEIGHTS),
    ]) {
      expect(w.sourceId).toBe("via-normative-v1");
    }
  });
});

describe("coerência física dos fatores de emissão", () => {
  it("modais ativos não emitem", () => {
    expect(EMISSION_FACTORS.walking.value).toBe(0);
    expect(EMISSION_FACTORS.bicycle.value).toBe(0);
  });

  it("transporte coletivo emite menos por passageiro que o carro", () => {
    expect(EMISSION_FACTORS.bus_urban.value).toBeLessThan(
      EMISSION_FACTORS.car_gasoline.value,
    );
    expect(EMISSION_FACTORS.metro_rail.value).toBeLessThan(
      EMISSION_FACTORS.bus_urban.value,
    );
  });

  it("a teleconsulta emite algo, mas ordens de grandeza menos que dirigir 1 km", () => {
    expect(TELECONSULT_EMISSION.value).toBeGreaterThan(0);
    expect(TELECONSULT_EMISSION.value).toBeLessThan(
      EMISSION_FACTORS.car_gasoline.value,
    );
  });

  it("o deadhead de táxi só pode aumentar a emissão", () => {
    expect(TAXI_DEADHEAD_FACTOR.value).toBeGreaterThan(1);
  });
});

describe("versionamento", () => {
  it("INDEX_VERSION segue o formato via-idx-MAJOR.MINOR.PATCH", () => {
    expect(INDEX_VERSION).toMatch(/^via-idx-\d+\.\d+\.\d+$/);
  });
});
