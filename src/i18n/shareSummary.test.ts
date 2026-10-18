import { describe, expect, it } from "vitest";

import { calculateImpactWithRoute } from "@/domain/compare";
import type { ConsultationInput, RouteLeg } from "@/domain/types";

import { buildShareSummary } from "./shareSummary";

const ROUTE: RouteLeg = {
  distanceKm: 25,
  durationMin: 60,
  providerId: "offline-fixture",
  confidence: "high",
};

function makeResult(hasReliableInternet = true, confidence: RouteLeg["confidence"] = "high") {
  const input: ConsultationInput = {
    origin: { lat: -23.55, lng: -46.63, label: "PRIVATE-ORIGIN-DO-NOT-COPY" },
    destination: { lat: -22.91, lng: -47.06, label: "PRIVATE-HOSPITAL-DO-NOT-COPY" },
    modal: "car_gasoline",
    profile: {
      age: 49,
      mobility: "moderate",
      requiresCompanion: false,
      monthlyIncomeBRL: 987654,
      hasReliableInternet,
      countProductivityLoss: true,
    },
  };
  return calculateImpactWithRoute(input, { ...ROUTE, confidence });
}

describe("privacy-safe clipboard summary", () => {
  it("includes only the aggregate human-readable summary and index version", () => {
    const result = makeResult();
    const text = buildShareSummary(result, "pt-BR");
    expect(text).toContain("Versão dos índices:");
    expect(text).toContain(result.indexVersion);
    expect(text).toContain("pesos normativos");
    expect(text).toMatch(/economiza/);
    for (const sensitive of [
      "PRIVATE-ORIGIN-DO-NOT-COPY",
      "PRIVATE-HOSPITAL-DO-NOT-COPY",
      "987654",
      "moderate",
      "-23.55",
      "-46.63",
    ]) {
      expect(text).not.toContain(sensitive);
    }
  });

  it("identifies nonviable remote consultation as hypothetical in both languages", () => {
    const result = makeResult(false);
    for (const [locale, label] of [
      ["pt-BR", "não é viável"],
      ["en-US", "not viable"],
    ] as const) {
      const text = buildShareSummary(result, locale);
      expect(text).toContain(label);
      expect(text).toContain(result.indexVersion);
      expect(text).not.toContain("PRIVATE-HOSPITAL-DO-NOT-COPY");
      expect(text).not.toContain(result.remoteBlockedReason ?? "unused");
    }
  });

  it("carries low route precision caveat without raw route coordinates", () => {
    const text = buildShareSummary(makeResult(true, "low"), "en-US");
    expect(text).toContain("low precision");
    expect(text).not.toContain("-23.55");
    expect(text).not.toContain("987654");
  });

  it("does not claim unavailable route precision warning for high confidence", () => {
    const text = buildShareSummary(makeResult(), "en-US");
    expect(text).not.toContain("low precision");
    expect(text).toContain("not field measurements");
  });
});
