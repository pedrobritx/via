import { describe, expect, it } from "vitest";

import { calculateImpactWithRoute } from "@/domain/compare";
import type { ConsultationInput, RouteLeg } from "@/domain/types";

import {
  createTranslator,
  formatCurrency,
  formatDuration,
  formatMass,
  formatNumber,
  translate,
} from "./index";
import { enUS } from "./messages/en-US";
import { ptBR } from "./messages/pt-BR";
import { buildSummary } from "./summary";

describe("catálogos", () => {
  it("toda chave do inglês existe no catálogo de referência", () => {
    for (const key of Object.keys(enUS)) {
      expect(
        Object.hasOwn(ptBR, key),
        `"${key}" existe em en-US mas não em pt-BR`,
      ).toBe(true);
    }
  });

  it("nenhuma mensagem do catálogo de referência é vazia", () => {
    for (const [key, value] of Object.entries(ptBR)) {
      expect(value.trim().length, `"${key}" está vazia`).toBeGreaterThan(0);
    }
  });

  it("nenhuma tradução em inglês é vazia", () => {
    for (const [key, value] of Object.entries(enUS)) {
      expect(value?.trim().length, `"${key}" está vazia`).toBeGreaterThan(0);
    }
  });
});

describe("translate", () => {
  it("devolve o texto no idioma pedido", () => {
    expect(translate("results.inPerson", "pt-BR")).toBe("Presencial");
    expect(translate("results.inPerson", "en-US")).toBe("In person");
  });

  it("cai para o português quando falta tradução", () => {
    // Chave deliberadamente ausente do catálogo em inglês.
    expect(translate("form.income.help", "en-US")).toBe(
      ptBR["form.income.help"],
    );
  });

  it("o tradutor amarrado a um idioma se comporta igual", () => {
    const t = createTranslator("en-US");
    expect(t("index.carbon")).toBe("Carbon footprint");
  });
});

describe("formatação", () => {
  it("formata moeda com separador brasileiro", () => {
    const formatted = formatCurrency(1234.5, "pt-BR");
    expect(formatted).toMatch(/R\$/);
    expect(formatted).toMatch(/1\.234,50/);
  });

  it("formata número com vírgula decimal em pt-BR", () => {
    expect(formatNumber(9.6, "pt-BR")).toBe("9,6");
    expect(formatNumber(9.6, "en-US")).toBe("9.6");
  });

  it("converte massa pequena para gramas", () => {
    expect(formatMass(0.01, "pt-BR")).toBe("10 g");
    expect(formatMass(9.6, "pt-BR")).toBe("9,6 kg");
    expect(formatMass(0, "pt-BR")).toBe("0 kg");
  });

  it("formata duração em horas e minutos", () => {
    expect(formatDuration(45, "pt-BR")).toBe("45 min");
    expect(formatDuration(95, "pt-BR")).toBe("1h35");
    expect(formatDuration(60, "pt-BR")).toBe("1 hora");
    expect(formatDuration(120, "pt-BR")).toBe("2 horas");
  });

  it("formata duração em inglês sem pluralizar em português", () => {
    expect(formatDuration(60, "en-US")).toBe("1h");
    expect(formatDuration(95, "en-US")).toBe("1h35");
  });

  it("preserva o sinal de durações negativas", () => {
    expect(formatDuration(-95, "pt-BR")).toBe("-1h35");
  });
});

describe("frase-resumo", () => {
  const ROUTE: RouteLeg = {
    distanceKm: 25,
    durationMin: 60,
    providerId: "test",
    confidence: "high",
  };

  function build(overrides: Partial<ConsultationInput["profile"]> = {}) {
    const input: ConsultationInput = {
      origin: { lat: -23.55, lng: -46.63, label: "Casa" },
      destination: { lat: -22.91, lng: -47.06, label: "Hospital" },
      modal: "car_gasoline",
      profile: {
        age: 40,
        mobility: "none",
        requiresCompanion: false,
        monthlyIncomeBRL: 4400,
        hasReliableInternet: true,
        countProductivityLoss: true,
        ...overrides,
      },
    };
    return calculateImpactWithRoute(input, ROUTE);
  }

  it("usa vírgula decimal e moeda formatada em pt-BR", () => {
    const texto = buildSummary(build(), "pt-BR");
    expect(texto).toMatch(/economiza/);
    expect(texto).toMatch(/R\$/);
    expect(texto).toMatch(/CO₂/);
    // O ponto decimal do JavaScript cru não pode vazar para a interface.
    expect(texto).not.toMatch(/\d+\.\d/);
  });

  it("usa ponto decimal e vocabulário em inglês em en-US", () => {
    const texto = buildSummary(build(), "en-US");
    expect(texto).toMatch(/you save/);
    expect(texto).toMatch(/ and /);
  });

  it("usa o condicional quando a teleconsulta é inviável", () => {
    const texto = buildSummary(build({ hasReliableInternet: false }), "pt-BR");
    expect(texto).toMatch(/economizaria/);
    expect(texto).not.toMatch(/você economiza /);
  });

  it("não deixa o marcador de substituição na frase final", () => {
    for (const locale of ["pt-BR", "en-US"] as const) {
      expect(buildSummary(build(), locale)).not.toMatch(/\{list\}/);
    }
  });

  it("separa os itens com vírgula e conjunção, sem vírgula final", () => {
    const texto = buildSummary(build(), "pt-BR");
    expect(texto).toMatch(/, .+ e /);
    expect(texto).not.toMatch(/, e /);
  });
});
