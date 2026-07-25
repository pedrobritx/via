import { describe, expect, it } from "vitest";

import { calculateImpactWithRoute, summarize } from "../compare";
import {
  BURDEN_TIME_REFERENCE_MIN,
  CONSULTATION_MIN,
  EMISSION_FACTORS,
  FACILITY_WAIT_MIN,
  MODAL_OVERHEAD_MIN,
  REMOTE_SETUP_MIN,
  TAXI_DEADHEAD_FACTOR,
  TELECONSULT_EMISSION,
  WORK_HOURS_PER_MONTH,
} from "../parameters";
import type {
  ConsultationInput,
  MobilityLevel,
  PatientProfile,
  RouteLeg,
  ScenarioResult,
  TransportModal,
} from "../types";
import { TRANSPORT_MODALS } from "../types";

const ORIGIN = { lat: -23.5505, lng: -46.6333, label: "Origem" };
const DESTINATION = { lat: -22.9099, lng: -47.0626, label: "Hospital" };

/** Rota fixa de 25 km / 60 min por trecho, para tornar as contas verificáveis à mão. */
const ROUTE: RouteLeg = {
  distanceKm: 25,
  durationMin: 60,
  providerId: "test-fixture",
  confidence: "high",
};

function profile(overrides: Partial<PatientProfile> = {}): PatientProfile {
  return {
    age: 40,
    mobility: "none",
    requiresCompanion: false,
    hasReliableInternet: true,
    countProductivityLoss: true,
    ...overrides,
  };
}

function input(overrides: Partial<ConsultationInput> = {}): ConsultationInput {
  return {
    origin: ORIGIN,
    destination: DESTINATION,
    modal: "car_gasoline",
    profile: profile(),
    ...overrides,
  };
}

function calc(overrides: Partial<ConsultationInput> = {}, route = ROUTE) {
  return calculateImpactWithRoute(input(overrides), route);
}

// ---------------------------------------------------------------------------

describe("invariante estrutural dos índices", () => {
  const result = calc();
  const scenarios: ScenarioResult[] = [result.inPerson, result.remote];

  it("as contribuições dos componentes somam o valor do índice", () => {
    for (const scenario of scenarios) {
      for (const index of [
        scenario.carbon,
        scenario.time,
        scenario.cost,
      ]) {
        const sum = index.components.reduce((s, c) => s + c.contribution, 0);
        expect(
          sum,
          `${scenario.scenario}/${index.key}: componentes não somam o valor`,
        ).toBeCloseTo(index.value, 2);
      }
    }
  });

  it("índices compostos somam antes do arredondamento para múltiplos de 5", () => {
    for (const scenario of scenarios) {
      for (const index of [scenario.burden, scenario.social]) {
        const sum = index.components.reduce((s, c) => s + c.contribution, 0);
        // O valor exibido é arredondado; a diferença nunca passa de meio passo.
        expect(
          Math.abs(sum - index.value),
          `${scenario.scenario}/${index.key}`,
        ).toBeLessThanOrEqual(2.5);
      }
    }
  });

  it("todo índice carrega a versão, fórmula e ao menos uma fonte", () => {
    for (const scenario of scenarios) {
      for (const index of [
        scenario.carbon,
        scenario.time,
        scenario.cost,
        scenario.burden,
        scenario.social,
      ]) {
        expect(index.indexVersion).toMatch(/^via-idx-/);
        expect(index.formulaTex.length).toBeGreaterThan(0);
        expect(index.sourceIds.length).toBeGreaterThan(0);
        expect(index.unit.length).toBeGreaterThan(0);
      }
    }
  });

  it("nenhum índice devolve NaN ou infinito", () => {
    for (const scenario of scenarios) {
      for (const index of [
        scenario.carbon,
        scenario.time,
        scenario.cost,
        scenario.burden,
        scenario.social,
      ]) {
        expect(Number.isFinite(index.value), `${index.key}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------

describe("pegada de carbono", () => {
  it("carro a gasolina: 25 km de ida = 50 km × 0,192 = 9,6 kg", () => {
    const { inPerson } = calc({ modal: "car_gasoline" });
    expect(inPerson.carbon.value).toBeCloseTo(9.6, 2);
  });

  it("ônibus emite bem menos que carro na mesma distância", () => {
    const car = calc({ modal: "car_gasoline" }).inPerson.carbon.value;
    const bus = calc({ modal: "bus_urban" }).inPerson.carbon.value;
    expect(bus).toBeLessThan(car);
    expect(bus).toBeCloseTo(50 * EMISSION_FACTORS.bus_urban.value, 2);
  });

  it("caminhar e pedalar emitem zero", () => {
    expect(calc({ modal: "walking" }).inPerson.carbon.value).toBe(0);
    expect(calc({ modal: "bicycle" }).inPerson.carbon.value).toBe(0);
  });

  it("dividir o carro entre ocupantes divide a emissão por pessoa", () => {
    const sozinho = calc({ modal: "car_gasoline", occupancy: 1 });
    const acompanhado = calc({ modal: "car_gasoline", occupancy: 2 });
    expect(acompanhado.inPerson.carbon.value).toBeCloseTo(
      sozinho.inPerson.carbon.value / 2,
      3,
    );
  });

  it("avisa que o total lançado na atmosfera não caiu ao dividir a carona", () => {
    const { inPerson } = calc({ modal: "car_gasoline", occupancy: 3 });
    expect(inPerson.carbon.caveats.join(" ")).toMatch(/total lançado/i);
  });

  it("NÃO divide a emissão do ônibus por ocupantes: o fator já é por passageiro", () => {
    const um = calc({ modal: "bus_urban", occupancy: 1 });
    const quatro = calc({ modal: "bus_urban", occupancy: 4 });
    expect(quatro.inPerson.carbon.value).toBe(um.inPerson.carbon.value);
  });

  it("táxi contabiliza o trecho rodado sem passageiro", () => {
    const { inPerson } = calc({ modal: "taxi_rideshare" });
    const semDeadhead = 50 * EMISSION_FACTORS.taxi_rideshare.value;
    expect(inPerson.carbon.value).toBeCloseTo(
      semDeadhead * TAXI_DEADHEAD_FACTOR.value,
      2,
    );
    expect(inPerson.carbon.value).toBeGreaterThan(semDeadhead);
  });

  it("a teleconsulta emite pouco, mas não zero", () => {
    const { remote } = calc();
    expect(remote.carbon.value).toBe(TELECONSULT_EMISSION.value);
    expect(remote.carbon.value).toBeGreaterThan(0);
    expect(remote.carbon.caveats.join(" ")).toMatch(/não emite zero/i);
  });

  it("a faixa de incerteza contém o valor central", () => {
    const { inPerson } = calc();
    const u = inPerson.carbon.uncertainty;
    expect(u).toBeDefined();
    expect(u!.low).toBeLessThanOrEqual(inPerson.carbon.value);
    expect(u!.high).toBeGreaterThanOrEqual(inPerson.carbon.value);
  });
});

// ---------------------------------------------------------------------------

describe("tempo total", () => {
  it("soma ida, volta, overhead do modal, espera e consulta", () => {
    const { inPerson } = calc({ modal: "car_gasoline" });
    const esperado =
      120 +
      MODAL_OVERHEAD_MIN.car_gasoline.value +
      FACILITY_WAIT_MIN.value +
      CONSULTATION_MIN.value;
    expect(inPerson.time.value).toBeCloseTo(esperado, 1);
  });

  it("a consulta entra nos dois cenários, com a mesma duração", () => {
    const result = calc();
    const presencial = result.inPerson.time.components.find(
      (c) => c.key === "consultation",
    );
    const remoto = result.remote.time.components.find(
      (c) => c.key === "consultation",
    );
    expect(presencial?.contribution).toBe(remoto?.contribution);
  });

  it("remoto é preparo mais consulta", () => {
    const { remote } = calc();
    expect(remote.time.value).toBeCloseTo(
      REMOTE_SETUP_MIN.value + CONSULTATION_MIN.value,
      1,
    );
  });

  it("o congestionamento padrão é 1,0 e não infla o tempo de viagem", () => {
    const { inPerson } = calc();
    const ida = inPerson.time.components.find((c) => c.key === "outbound");
    expect(ida?.contribution).toBeCloseTo(60, 1);
  });

  it("congestionamento acima de 1 aumenta apenas o deslocamento", () => {
    const normal = calc({ congestionFactor: 1 }).inPerson.time;
    const pesado = calc({ congestionFactor: 1.5 }).inPerson.time;
    expect(pesado.value - normal.value).toBeCloseTo(60, 1);
  });

  it("ônibus tem overhead de espera maior que carro", () => {
    const carro = calc({ modal: "car_gasoline" }).inPerson.time;
    const onibus = calc({ modal: "bus_urban" }).inPerson.time;
    const oCarro = carro.components.find((c) => c.key === "modal_overhead");
    const oOnibus = onibus.components.find((c) => c.key === "modal_overhead");
    expect(oOnibus!.contribution).toBeGreaterThan(oCarro!.contribution);
  });

  it("avisa que o tempo do acompanhante não está somado", () => {
    const { inPerson } = calc({ profile: profile({ requiresCompanion: true }) });
    expect(inPerson.time.caveats.join(" ")).toMatch(/acompanhante/i);
  });
});

// ---------------------------------------------------------------------------

describe("custo", () => {
  it("carro: combustível = 50 km ÷ 12 km/L × preço", () => {
    const { inPerson } = calc({
      modal: "car_gasoline",
      profile: profile({ countProductivityLoss: false }),
    });
    const combustivel = inPerson.cost.components.find((c) => c.key === "fuel");
    expect(combustivel).toBeDefined();
    expect(combustivel!.input).toBeCloseTo(50 / 12, 2);
  });

  it("ônibus: uma passagem por embarque, ida e volta", () => {
    const { inPerson } = calc({
      modal: "bus_urban",
      transfers: 1,
      profile: profile({ countProductivityLoss: false }),
    });
    const tarifa = inPerson.cost.components.find((c) => c.key === "fare");
    // (1 baldeação + 1) × 2 sentidos × 1 pessoa = 4 embarques
    expect(tarifa!.input).toBe(4);
  });

  it("o acompanhante paga passagem", () => {
    const sozinho = calc({
      modal: "bus_urban",
      profile: profile({ countProductivityLoss: false }),
    });
    const comAcompanhante = calc({
      modal: "bus_urban",
      profile: profile({
        countProductivityLoss: false,
        requiresCompanion: true,
      }),
    });
    expect(comAcompanhante.inPerson.cost.value).toBeCloseTo(
      sozinho.inPerson.cost.value * 2,
      2,
    );
  });

  it("pedágio conta ida e volta; estacionamento conta uma vez", () => {
    const { inPerson } = calc({
      modal: "car_gasoline",
      tollBRL: 10,
      parkingBRL: 25,
      profile: profile({ countProductivityLoss: false }),
    });
    const pedagio = inPerson.cost.components.find((c) => c.key === "toll");
    const estacionamento = inPerson.cost.components.find(
      (c) => c.key === "parking",
    );
    expect(pedagio!.contribution).toBe(20);
    expect(estacionamento!.contribution).toBe(25);
  });

  it("sem renda declarada, não inventa produtividade e declara custo parcial", () => {
    const { inPerson } = calc();
    expect(
      inPerson.cost.components.find((c) => c.key === "productivity"),
    ).toBeUndefined();
    expect(inPerson.cost.caveats.join(" ")).toMatch(/parcial/i);
  });

  it("com renda declarada, converte tempo em dinheiro pela jornada de 220h", () => {
    const { inPerson } = calc({
      profile: profile({ monthlyIncomeBRL: 4400 }),
    });
    const prod = inPerson.cost.components.find((c) => c.key === "productivity");
    const horas = inPerson.time.value / 60;
    const esperado = (4400 / WORK_HOURS_PER_MONTH.value) * horas;
    expect(prod!.contribution).toBeCloseTo(esperado, 2);
  });

  it("countProductivityLoss=false não converte tempo em salário", () => {
    const { inPerson } = calc({
      profile: profile({
        monthlyIncomeBRL: 4400,
        countProductivityLoss: false,
      }),
    });
    expect(
      inPerson.cost.components.find((c) => c.key === "productivity"),
    ).toBeUndefined();
    expect(inPerson.cost.caveats.join(" ")).toMatch(/não foi somada/i);
  });

  it("o cenário remoto também custa tempo, quando há renda", () => {
    const { remote } = calc({ profile: profile({ monthlyIncomeBRL: 4400 }) });
    expect(remote.cost.value).toBeGreaterThan(0);
  });

  it("caminhar não tem custo de transporte", () => {
    const { inPerson } = calc({
      modal: "walking",
      profile: profile({ countProductivityLoss: false }),
    });
    expect(inPerson.cost.value).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe("carga de deslocamento", () => {
  it("fica sempre entre 0 e 100, em todos os modais", () => {
    for (const modal of TRANSPORT_MODALS) {
      const { inPerson, remote } = calc({ modal });
      expect(inPerson.burden.value, modal).toBeGreaterThanOrEqual(0);
      expect(inPerson.burden.value, modal).toBeLessThanOrEqual(100);
      expect(remote.burden.value, modal).toBeGreaterThanOrEqual(0);
      expect(remote.burden.value, modal).toBeLessThanOrEqual(100);
    }
  });

  it("resiste a distâncias absurdas sem estourar a escala", () => {
    const longa: RouteLeg = { ...ROUTE, distanceKm: 10_000, durationMin: 20_000 };
    const { inPerson } = calc({}, longa);
    expect(inPerson.burden.value).toBeLessThanOrEqual(100);
  });

  it("é arredondada para múltiplos de 5", () => {
    for (const modal of TRANSPORT_MODALS) {
      const { inPerson } = calc({ modal });
      expect(inPerson.burden.value % 5, modal).toBe(0);
    }
  });

  it("declara explicitamente que os pesos são normativos", () => {
    const { inPerson } = calc();
    expect(inPerson.burden.caveats.join(" ")).toMatch(/normativa/i);
    expect(inPerson.burden.sourceIds).toContain("via-normative-v1");
  });

  it("só quem dirige recebe penalidade de estacionamento", () => {
    const carro = calc({ modal: "car_gasoline" }).inPerson.burden;
    const onibus = calc({ modal: "bus_urban" }).inPerson.burden;
    expect(
      carro.components.find((c) => c.key === "parking")!.contribution,
    ).toBeGreaterThan(0);
    expect(
      onibus.components.find((c) => c.key === "parking")!.contribution,
    ).toBe(0);
  });

  it("baldeações aumentam a imprevisibilidade", () => {
    const direto = calc({ modal: "bus_urban", transfers: 0 }).inPerson.burden;
    const comBaldeacao = calc({ modal: "bus_urban", transfers: 2 }).inPerson
      .burden;
    const u1 = direto.components.find((c) => c.key === "unpredictability")!;
    const u2 = comBaldeacao.components.find(
      (c) => c.key === "unpredictability",
    )!;
    expect(u2.contribution).toBeGreaterThan(u1.contribution);
  });

  it("o cenário remoto tem carga muito menor, mas não nula", () => {
    const { inPerson, remote } = calc();
    expect(remote.burden.value).toBeLessThan(inPerson.burden.value);
    expect(remote.burden.value).toBeGreaterThan(0);
  });

  it("o componente de tempo satura no referencial de três horas", () => {
    const longa: RouteLeg = {
      ...ROUTE,
      durationMin: BURDEN_TIME_REFERENCE_MIN.value * 5,
    };
    const { inPerson } = calc({}, longa);
    const t = inPerson.burden.components.find((c) => c.key === "time")!;
    // Saturado: contribuição igual ao peso × 100.
    expect(t.contribution).toBeCloseTo(t.weight! * 100, 6);
  });
});

// ---------------------------------------------------------------------------

describe("impacto social", () => {
  it("fica entre 0 e 100 para entradas extremas", () => {
    const extremos: Array<Partial<PatientProfile>> = [
      { age: 0 },
      { age: 120 },
      { age: 17 },
      { monthlyIncomeBRL: 0 },
      { monthlyIncomeBRL: 1e9 },
      { mobility: "severe", requiresCompanion: true, age: 95, monthlyIncomeBRL: 0 },
    ];

    for (const overrides of extremos) {
      const { inPerson, remote } = calc({ profile: profile(overrides) });
      expect(inPerson.social.value).toBeGreaterThanOrEqual(0);
      expect(inPerson.social.value).toBeLessThanOrEqual(100);
      expect(remote.social.value).toBeGreaterThanOrEqual(0);
      expect(remote.social.value).toBeLessThanOrEqual(100);
    }
  });

  it("adulto sem limitações e com renda alta pontua zero", () => {
    const { inPerson } = calc({
      profile: profile({ age: 35, mobility: "none", monthlyIncomeBRL: 20_000 }),
    });
    expect(inPerson.social.value).toBe(0);
  });

  it("o perfil mais oneroso possível não ultrapassa 100", () => {
    const { inPerson } = calc({
      profile: profile({
        age: 95,
        mobility: "severe",
        requiresCompanion: true,
        monthlyIncomeBRL: 0,
      }),
    });
    expect(inPerson.social.value).toBe(100);
  });

  it("cresce com a idade a partir dos 60", () => {
    const jovem = calc({ profile: profile({ age: 45 }) }).inPerson.social;
    const idoso = calc({ profile: profile({ age: 80 }) }).inPerson.social;
    expect(idoso.value).toBeGreaterThan(jovem.value);
  });

  it("menores de 18 pontuam, pois mobilizam um adulto", () => {
    const crianca = calc({ profile: profile({ age: 8 }) }).inPerson.social;
    const adulto = calc({ profile: profile({ age: 35 }) }).inPerson.social;
    expect(crianca.value).toBeGreaterThan(adulto.value);
  });

  it("mobilidade reduzida aumenta o índice monotonicamente", () => {
    const niveis: MobilityLevel[] = ["none", "mild", "moderate", "severe"];
    const valores = niveis.map(
      (mobility) => calc({ profile: profile({ mobility }) }).inPerson.social.value,
    );
    for (let i = 1; i < valores.length; i += 1) {
      expect(valores[i]).toBeGreaterThanOrEqual(valores[i - 1]);
    }
  });

  it("renda menor aumenta o índice", () => {
    const rica = calc({ profile: profile({ monthlyIncomeBRL: 15_000 }) })
      .inPerson.social.value;
    const pobre = calc({ profile: profile({ monthlyIncomeBRL: 600 }) })
      .inPerson.social.value;
    expect(pobre).toBeGreaterThan(rica);
  });

  it("sem renda declarada, avisa que o índice está subestimado", () => {
    const { inPerson } = calc();
    expect(inPerson.social.caveats.join(" ")).toMatch(/subestimado/i);
  });

  it("carrega sempre o enquadramento de que não classifica pessoas", () => {
    const { inPerson } = calc();
    expect(inPerson.social.caveats.join(" ")).toMatch(
      /não classifica a pessoa/i,
    );
  });

  it("o cenário remoto reduz mas não elimina o ônus social", () => {
    const perfilOneroso = profile({
      age: 82,
      mobility: "severe",
      requiresCompanion: true,
      monthlyIncomeBRL: 1000,
    });
    const { inPerson, remote } = calc({ profile: perfilOneroso });
    expect(remote.social.value).toBeLessThan(inPerson.social.value);
    expect(remote.social.value).toBeGreaterThan(0);
    expect(remote.social.caveats.join(" ")).toMatch(/barreira/i);
  });
});

// ---------------------------------------------------------------------------

describe("comparação e portão de viabilidade", () => {
  it("a economia é a diferença entre os cenários", () => {
    const r = calc();
    expect(r.savings.carbonKg).toBeCloseTo(
      r.inPerson.carbon.value - r.remote.carbon.value,
      3,
    );
    expect(r.savings.timeMin).toBeCloseTo(
      r.inPerson.time.value - r.remote.time.value,
      1,
    );
  });

  it("sem internet confiável, a teleconsulta é marcada como inviável", () => {
    const r = calc({ profile: profile({ hasReliableInternet: false }) });
    expect(r.remoteViable).toBe(false);
    expect(r.remoteBlockedReason).toBeDefined();
    expect(r.remoteBlockedReason).toMatch(/hipotética/i);
  });

  it("o bloqueio aponta alternativas em vez de só negar", () => {
    const r = calc({ profile: profile({ hasReliableInternet: false }) });
    expect(r.remoteBlockedReason).toMatch(
      /transporte assistido|domiciliar|telessaúde/i,
    );
  });

  it("com internet confiável, a teleconsulta é viável", () => {
    expect(calc().remoteViable).toBe(true);
  });

  it("o cálculo continua sendo feito mesmo quando o remoto é inviável", () => {
    const r = calc({ profile: profile({ hasReliableInternet: false }) });
    expect(r.savings.timeMin).toBeGreaterThan(0);
  });

  it("agrega as ressalvas dos dois cenários sem repetir", () => {
    const r = calc();
    expect(r.caveats.length).toBeGreaterThan(0);
    expect(new Set(r.caveats).size).toBe(r.caveats.length);
  });

  it("carrega versão e carimbo de tempo", () => {
    const r = calc();
    expect(r.indexVersion).toMatch(/^via-idx-/);
    expect(() => new Date(r.computedAt).toISOString()).not.toThrow();
  });
});

describe("resumo em linguagem simples", () => {
  it("usa horas e minutos legíveis e moeda em reais", () => {
    const texto = summarize(calc({ profile: profile({ monthlyIncomeBRL: 4400 }) }));
    expect(texto).toMatch(/economiza/i);
    expect(texto).toMatch(/R\$/);
    expect(texto).toMatch(/CO₂/);
  });

  it("usa o condicional quando a teleconsulta é inviável", () => {
    const texto = summarize(
      calc({ profile: profile({ hasReliableInternet: false }) }),
    );
    expect(texto).toMatch(/economizaria/i);
  });

  it("não promete economia quando os cenários são equivalentes", () => {
    const semRota: RouteLeg = { ...ROUTE, distanceKm: 0, durationMin: 0 };
    const texto = summarize(
      calc(
        {
          modal: "walking",
          profile: profile({ countProductivityLoss: false }),
          consultationMinutes: 15,
        },
        semRota,
      ),
    );
    expect(texto).toMatch(/equivalente|economiza/i);
  });
});

describe("robustez da entrada", () => {
  it("satura ocupação, baldeações e congestionamento fora de faixa", () => {
    const r = calc({
      occupancy: 999,
      transfers: -5,
      congestionFactor: 100,
    });
    expect(r.input.occupancy).toBeLessThanOrEqual(8);
    expect(r.input.transfers).toBe(0);
    expect(r.input.congestionFactor).toBeLessThanOrEqual(4);
  });

  it("satura idade e renda negativas", () => {
    const r = calc({ profile: profile({ age: -10, monthlyIncomeBRL: -500 }) });
    expect(r.input.profile.age).toBe(0);
    expect(r.input.profile.monthlyIncomeBRL).toBe(0);
  });

  it("produz resultado finito para todos os modais", () => {
    for (const modal of TRANSPORT_MODALS as readonly TransportModal[]) {
      const r = calc({ modal });
      expect(Number.isFinite(r.savings.carbonKg), modal).toBe(true);
      expect(Number.isFinite(r.savings.costBRL), modal).toBe(true);
    }
  });
});
