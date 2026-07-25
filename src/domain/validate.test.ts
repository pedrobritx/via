import { describe, expect, it } from "vitest";

import { buildParameterCatalog } from "./catalog";
import { parseConsultationInput } from "./validate";

const validBody = {
  origin: { lat: -23.5505, lng: -46.6333, label: "Casa" },
  destination: { lat: -22.9099, lng: -47.0626, label: "Hospital" },
  modal: "bus_urban",
  profile: {
    age: 68,
    mobility: "moderate",
    requiresCompanion: true,
    monthlyIncomeBRL: 2000,
    hasReliableInternet: true,
    countProductivityLoss: false,
  },
};

describe("parseConsultationInput", () => {
  it("aceita um corpo válido", () => {
    const result = parseConsultationInput(validBody);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.modal).toBe("bus_urban");
      expect(result.value.profile.age).toBe(68);
      expect(result.value.profile.requiresCompanion).toBe(true);
    }
  });

  it("recusa entrada que não é objeto", () => {
    for (const bad of [null, "texto", 42, []]) {
      expect(parseConsultationInput(bad).ok).toBe(false);
    }
  });

  it("acumula todos os erros em vez de parar no primeiro", () => {
    const result = parseConsultationInput({
      origin: { lat: 999, lng: 999 },
      destination: "não é lugar",
      modal: "foguete",
      profile: { age: 500, mobility: "voando" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const fields = result.issues.map((i) => i.field);
      expect(fields).toContain("origin.lat");
      expect(fields).toContain("modal");
      expect(fields).toContain("profile.age");
      expect(result.issues.length).toBeGreaterThan(3);
    }
  });

  it("rejeita coordenadas fora dos limites geográficos", () => {
    const result = parseConsultationInput({
      ...validBody,
      origin: { lat: 95, lng: -46 },
    });
    expect(result.ok).toBe(false);
  });

  it("rejeita modal desconhecido listando os válidos", () => {
    const result = parseConsultationInput({ ...validBody, modal: "teletransporte" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const msg = result.issues.find((i) => i.field === "modal")?.message ?? "";
      expect(msg).toMatch(/bus_urban/);
    }
  });

  it("aceita renda omitida — é um campo legitimamente opcional", () => {
    const { profile, ...rest } = validBody;
    const semRenda = {
      ...rest,
      profile: { ...profile, monthlyIncomeBRL: undefined },
    };
    const result = parseConsultationInput(semRenda);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profile.monthlyIncomeBRL).toBeUndefined();
    }
  });

  it("rejeita renda negativa", () => {
    const result = parseConsultationInput({
      ...validBody,
      profile: { ...validBody.profile, monthlyIncomeBRL: -100 },
    });
    expect(result.ok).toBe(false);
  });

  it("assume ausência de internet confiável quando não é afirmada", () => {
    const { profile, ...rest } = validBody;
    const semDeclaracao = {
      ...rest,
      profile: { ...profile, hasReliableInternet: undefined },
    };
    const result = parseConsultationInput(semDeclaracao);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Errar para o lado de não recomendar teleconsulta é o padrão seguro.
      expect(result.value.profile.hasReliableInternet).toBe(false);
    }
  });

  it("assume perda de produtividade quando não é negada", () => {
    const { profile, ...rest } = validBody;
    const result = parseConsultationInput({
      ...rest,
      profile: { ...profile, countProductivityLoss: undefined },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profile.countProductivityLoss).toBe(true);
    }
  });

  it("gera rótulo a partir das coordenadas quando ele falta", () => {
    const result = parseConsultationInput({
      ...validBody,
      origin: { lat: -23.5505, lng: -46.6333 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.origin.label).toBe("-23.5505, -46.6333");
    }
  });

  it("rejeita campos numéricos opcionais fora da faixa", () => {
    for (const [field, value] of [
      ["occupancy", 99],
      ["transfers", -1],
      ["congestionFactor", 10],
      ["consultationMinutes", 5000],
    ] as const) {
      const result = parseConsultationInput({ ...validBody, [field]: value });
      expect(result.ok, field).toBe(false);
    }
  });

  it("trata string vazia em campo opcional como ausência", () => {
    const result = parseConsultationInput({ ...validBody, tollBRL: "" });
    expect(result.ok).toBe(true);
  });
});

describe("catálogo de parâmetros", () => {
  const catalog = buildParameterCatalog();

  it("publica a versão dos índices e o passo de arredondamento", () => {
    expect(catalog.indexVersion).toMatch(/^via-idx-/);
    expect(catalog.compositeRoundingStep).toBe(5);
  });

  it("tem os seis grupos temáticos, todos com entradas", () => {
    const ids = catalog.groups.map((g) => g.id);
    expect(ids).toEqual([
      "emissions",
      "routing",
      "time",
      "cost",
      "burden",
      "social",
    ]);
    for (const group of catalog.groups) {
      expect(group.entries.length, group.id).toBeGreaterThan(0);
    }
  });

  it("toda entrada publicada cita uma fonte existente no catálogo", () => {
    const sourceIds = new Set(catalog.sources.map((s) => s.id));
    for (const group of catalog.groups) {
      for (const entry of group.entries) {
        expect(
          sourceIds.has(entry.sourceId),
          `${group.id}/${entry.key} cita "${entry.sourceId}"`,
        ).toBe(true);
      }
    }
  });

  it("as chaves são únicas dentro de cada grupo", () => {
    for (const group of catalog.groups) {
      const keys = group.entries.map((e) => e.key);
      expect(new Set(keys).size, group.id).toBe(keys.length);
    }
  });

  it("os pesos normativos aparecem identificados como tais", () => {
    const burden = catalog.groups.find((g) => g.id === "burden")!;
    const weights = burden.entries.filter((e) => e.key.startsWith("weight."));
    expect(weights.length).toBe(5);
    for (const w of weights) {
      expect(w.sourceId).toBe("via-normative-v1");
    }
  });

  it("é serializável em JSON sem perda", () => {
    const round = JSON.parse(JSON.stringify(catalog));
    expect(round.indexVersion).toBe(catalog.indexVersion);
    expect(round.groups.length).toBe(catalog.groups.length);
  });
});
