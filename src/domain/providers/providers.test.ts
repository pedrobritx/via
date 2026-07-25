import { describe, expect, it, vi } from "vitest";

import { haversineKm } from "../geo";
import { MODAL_DETOUR_FACTOR, MODAL_SPEED_KMH } from "../parameters";
import { TRANSPORT_MODALS } from "../types";
import {
  COMPOSITE_GEOCODE_PROVIDER_ID,
  createGeocodeProvider,
  createRouteProvider,
  describeProviders,
} from "./index";
import {
  DEFAULT_USER_AGENT,
  createNominatimGeocodeProvider,
} from "./nominatimGeocode";
import { parseLatLng, searchFixtures } from "./offlineGeocode";
import {
  OFFLINE_ROUTE_PROVIDER_ID,
  estimateOfflineRoute,
} from "./offlineRoute";
import { ORS_ROUTE_PROVIDER_ID, createOrsRouteProvider } from "./orsRoute";

const SP = { lat: -23.5505, lng: -46.6333 };
const CAMPINAS = { lat: -22.9099, lng: -47.0626 };

describe("estimador offline de rota", () => {
  it("é determinístico: mesma entrada, mesma saída", () => {
    const a = estimateOfflineRoute(SP, CAMPINAS, "car_gasoline");
    const b = estimateOfflineRoute(SP, CAMPINAS, "car_gasoline");
    expect(a).toEqual(b);
  });

  it("aplica o fator de sinuosidade sobre a linha reta", () => {
    const straight = haversineKm(SP, CAMPINAS);
    const leg = estimateOfflineRoute(SP, CAMPINAS, "car_gasoline");
    const expected = straight * MODAL_DETOUR_FACTOR.car_gasoline.value;
    expect(leg.distanceKm).toBeCloseTo(expected, 1);
    // A distância percorrida é sempre maior que a linha reta.
    expect(leg.distanceKm).toBeGreaterThan(straight);
  });

  it("deriva o tempo da velocidade do modal", () => {
    const leg = estimateOfflineRoute(SP, CAMPINAS, "bus_urban");
    const expected =
      (leg.distanceKm / MODAL_SPEED_KMH.bus_urban.value) * 60;
    expect(leg.durationMin).toBeCloseTo(expected, 0);
  });

  it("declara baixa confiança e explica o porquê", () => {
    const leg = estimateOfflineRoute(SP, CAMPINAS, "car_gasoline");
    expect(leg.confidence).toBe("low");
    expect(leg.providerId).toBe(OFFLINE_ROUTE_PROVIDER_ID);
    expect(leg.note).toMatch(/linha reta/i);
  });

  it("caminhar é mais lento que ir de carro na mesma rota", () => {
    const car = estimateOfflineRoute(SP, CAMPINAS, "car_gasoline");
    const walk = estimateOfflineRoute(SP, CAMPINAS, "walking");
    expect(walk.durationMin).toBeGreaterThan(car.durationMin);
  });

  it("devolve zero para origem igual ao destino, em todos os modais", () => {
    for (const modal of TRANSPORT_MODALS) {
      const leg = estimateOfflineRoute(SP, SP, modal);
      expect(leg.distanceKm, modal).toBe(0);
      expect(leg.durationMin, modal).toBe(0);
    }
  });

  it("produz números finitos e positivos para todos os modais", () => {
    for (const modal of TRANSPORT_MODALS) {
      const leg = estimateOfflineRoute(SP, CAMPINAS, modal);
      expect(Number.isFinite(leg.distanceKm), modal).toBe(true);
      expect(Number.isFinite(leg.durationMin), modal).toBe(true);
      expect(leg.distanceKm, modal).toBeGreaterThan(0);
      expect(leg.durationMin, modal).toBeGreaterThan(0);
    }
  });
});

describe("parseLatLng", () => {
  it("aceita coordenadas separadas por vírgula ou espaço", () => {
    expect(parseLatLng("-23.5505, -46.6333")).toMatchObject({
      lat: -23.5505,
      lng: -46.6333,
    });
    expect(parseLatLng("-23.5505 -46.6333")).toMatchObject({
      lat: -23.5505,
      lng: -46.6333,
    });
  });

  it("rejeita coordenadas fora do intervalo válido", () => {
    expect(parseLatLng("95, 0")).toBeNull();
    expect(parseLatLng("0, 200")).toBeNull();
  });

  it("rejeita texto que não é coordenada", () => {
    expect(parseLatLng("São Paulo")).toBeNull();
    expect(parseLatLng("")).toBeNull();
  });
});

describe("busca offline de lugares", () => {
  it("encontra ignorando acento e caixa", () => {
    const comAcento = searchFixtures("Brasília");
    const semAcento = searchFixtures("brasilia");
    expect(comAcento.length).toBeGreaterThan(0);
    expect(semAcento[0].label).toBe(comAcento[0].label);
  });

  it("encontra equipamento de saúde por sigla", () => {
    const results = searchFixtures("HCPA");
    expect(results[0].label).toMatch(/Porto Alegre/);
  });

  it("resolve coordenadas digitadas direto, sem consultar a lista", () => {
    const results = searchFixtures("-15.7939, -47.8828");
    expect(results).toHaveLength(1);
    expect(results[0].lat).toBeCloseTo(-15.7939, 4);
  });

  it("devolve lista vazia para busca sem correspondência", () => {
    expect(searchFixtures("zzzzzzzz")).toEqual([]);
    expect(searchFixtures("   ")).toEqual([]);
  });

  it("é determinística na ordem dos resultados", () => {
    expect(searchFixtures("São")).toEqual(searchFixtures("São"));
  });

  it("respeita o limite pedido", () => {
    expect(searchFixtures("a", 3).length).toBeLessThanOrEqual(3);
  });
});

describe("adaptador do OpenRouteService", () => {
  const okResponse = (distanceM: number, durationS: number) =>
    ({
      ok: true,
      status: 200,
      json: async () => ({
        routes: [{ summary: { distance: distanceM, duration: durationS } }],
      }),
    }) as Response;

  it("converte metros e segundos para km e minutos", async () => {
    const fetchImpl = vi.fn(async () => okResponse(96_000, 5400));
    const provider = createOrsRouteProvider({
      apiKey: "chave-de-teste",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const leg = await provider.estimate(SP, CAMPINAS, "car_gasoline");
    expect(leg.distanceKm).toBe(96);
    expect(leg.durationMin).toBe(90);
    expect(leg.confidence).toBe("high");
    expect(leg.providerId).toBe(ORS_ROUTE_PROVIDER_ID);
  });

  it("envia as coordenadas na ordem [lng, lat] que o ORS espera", async () => {
    const fetchImpl = vi.fn(async () => okResponse(1000, 60));
    const provider = createOrsRouteProvider({
      apiKey: "chave-de-teste",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await provider.estimate(SP, CAMPINAS, "car_gasoline");

    const [, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body)) as { coordinates: number[][] };
    expect(body.coordinates[0]).toEqual([SP.lng, SP.lat]);
    expect(body.coordinates[1]).toEqual([CAMPINAS.lng, CAMPINAS.lat]);
  });

  it("marca confiança média e explica o ajuste para modais sem perfil próprio", async () => {
    const fetchImpl = vi.fn(async () => okResponse(96_000, 5400));
    const provider = createOrsRouteProvider({
      apiKey: "chave-de-teste",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const leg = await provider.estimate(SP, CAMPINAS, "bus_urban");
    expect(leg.confidence).toBe("medium");
    expect(leg.note).toMatch(/não roteia/i);
    // Ônibus faz percurso mais sinuoso que carro: distância maior que a rodoviária.
    expect(leg.distanceKm).toBeGreaterThan(96);
  });

  it("rejeita chave vazia na construção", () => {
    expect(() => createOrsRouteProvider({ apiKey: "" })).toThrow();
  });

  it("lança quando a resposta não traz sumário utilizável", async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: true, status: 200, json: async () => ({}) }) as Response,
    );
    const provider = createOrsRouteProvider({
      apiKey: "chave-de-teste",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      provider.estimate(SP, CAMPINAS, "car_gasoline"),
    ).rejects.toThrow(/sem distância ou duração/i);
  });

  it("lança quando o serviço devolve erro HTTP", async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 429, json: async () => ({}) }) as Response,
    );
    const provider = createOrsRouteProvider({
      apiKey: "chave-de-teste",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      provider.estimate(SP, CAMPINAS, "car_gasoline"),
    ).rejects.toThrow(/429/);
  });
});

describe("fábrica de provedores", () => {
  it("sem chave configurada, usa o estimador offline", () => {
    const provider = createRouteProvider({});
    expect(provider.id).toBe(OFFLINE_ROUTE_PROVIDER_ID);
  });

  it("com chave configurada, usa o OpenRouteService", () => {
    const provider = createRouteProvider({ VIA_ORS_API_KEY: "chave" });
    expect(provider.id).toBe(ORS_ROUTE_PROVIDER_ID);
  });

  it("ignora chave em branco", () => {
    const provider = createRouteProvider({ VIA_ORS_API_KEY: "   " });
    expect(provider.id).toBe(OFFLINE_ROUTE_PROVIDER_ID);
  });

  // A geocodificação padrão deixou de ser offline. O motivo está documentado
  // em nominatimGeocode.ts: exigir configuração para buscar endereço fazia o
  // app responder "nenhum lugar encontrado" para qualquer entrada real.
  it("geocodificação padrão resolve endereços de verdade, sem exigir chave", () => {
    expect(createGeocodeProvider({}).id).toBe(COMPOSITE_GEOCODE_PROVIDER_ID);
  });

  it("VIA_GEOCODE_PROVIDER=offline força o modo sem rede", () => {
    const provider = createGeocodeProvider({ VIA_GEOCODE_PROVIDER: "offline" });
    expect(provider.id).toBe(COMPOSITE_GEOCODE_PROVIDER_ID);
    expect(describeProviders({ VIA_GEOCODE_PROVIDER: "offline" }).geocodeIsOffline).toBe(
      true,
    );
  });

  it("aceita User-Agent próprio sem deixar de funcionar quando ele falta", () => {
    const semUA = createGeocodeProvider({});
    const comUA = createGeocodeProvider({
      VIA_NOMINATIM_USER_AGENT: "via-test/1.0 (contato@exemplo.org)",
    });
    // Os dois funcionam: o User-Agent é uma cortesia configurável, não um
    // portão que derruba a busca.
    expect(semUA.id).toBe(COMPOSITE_GEOCODE_PROVIDER_ID);
    expect(comUA.id).toBe(COMPOSITE_GEOCODE_PROVIDER_ID);
  });

  it("descreve a configuração ativa", () => {
    expect(describeProviders({})).toEqual({
      route: OFFLINE_ROUTE_PROVIDER_ID,
      geocode: COMPOSITE_GEOCODE_PROVIDER_ID,
      routeIsOffline: true,
      geocodeIsOffline: false,
    });
  });
});

describe("queda para offline quando o serviço remoto falha", () => {
  it("não propaga o erro: devolve estimativa offline explicando o motivo", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    // A fábrica usa o fetch global, então o interceptamos aqui.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchImpl as unknown as typeof fetch;

    try {
      const provider = createRouteProvider({ VIA_ORS_API_KEY: "chave" });
      const leg = await provider.estimate(SP, CAMPINAS, "car_gasoline");

      expect(leg.confidence).toBe("low");
      expect(leg.distanceKm).toBeGreaterThan(0);
      expect(leg.note).toMatch(/indispon/i);
      expect(leg.note).toMatch(/ECONNREFUSED/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("o resultado da queda é igual ao do estimador offline direto", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("timeout");
    }) as unknown as typeof fetch;

    try {
      const provider = createRouteProvider({ VIA_ORS_API_KEY: "chave" });
      const viaFallback = await provider.estimate(SP, CAMPINAS, "bus_urban");
      const direct = estimateOfflineRoute(SP, CAMPINAS, "bus_urban");

      expect(viaFallback.distanceKm).toBe(direct.distanceKm);
      expect(viaFallback.durationMin).toBe(direct.durationMin);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("adaptador do Nominatim", () => {
  it("mapeia a resposta para Place, convertendo lat/lon textuais", async () => {
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => [
            { lat: "-23.5505", lon: "-46.6333", display_name: "São Paulo, SP" },
          ],
        }) as Response,
    );

    const provider = createNominatimGeocodeProvider({
      userAgent: "via-test/1.0",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const places = await provider.search("São Paulo");
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      lat: -23.5505,
      lng: -46.6333,
      label: "São Paulo, SP",
    });
  });

  it("descarta entradas com coordenada inválida em vez de propagar NaN", async () => {
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => [
            { lat: "não é número", lon: "-46.6", display_name: "Lixo" },
            { lat: "-23.5", lon: "-46.6", display_name: "Válido" },
          ],
        }) as Response,
    );

    const provider = createNominatimGeocodeProvider({
      userAgent: "via-test/1.0",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const places = await provider.search("teste");
    expect(places).toHaveLength(1);
    expect(places[0].label).toBe("Válido");
  });

  it("usa um User-Agent identificável mesmo sem configuração", async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: true, status: 200, json: async () => [] }) as Response,
    );
    const provider = createNominatimGeocodeProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await provider.search("qualquer coisa");

    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const ua = (init.headers as Record<string, string>)["User-Agent"];
    // A política do Nominatim pede identificação da aplicação — e é isso que o
    // padrão entrega. O que ela proíbe é uso anônimo, não uso sem env var.
    expect(ua).toBe(DEFAULT_USER_AGENT);
    expect(ua).toMatch(/via/i);
    expect(ua).toMatch(/https?:\/\//);
  });

  it("não repete a requisição para a mesma busca (cache)", async () => {
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => [
            { lat: "-23.5", lon: "-46.6", display_name: "Um lugar" },
          ],
        }) as Response,
    );
    const provider = createNominatimGeocodeProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await provider.search("Avenida Paulista");
    await provider.search("avenida paulista");

    // Digitar não pode virar uma consulta por tecla contra infraestrutura
    // mantida por doação.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("marca a origem do resultado", async () => {
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => [
            { lat: "-23.5", lon: "-46.6", display_name: "Um lugar" },
          ],
        }) as Response,
    );
    const provider = createNominatimGeocodeProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const [place] = await provider.search("Um lugar qualquer");
    expect(place.source).toBe("nominatim");
  });

  it("não chama o serviço para busca vazia", async () => {
    const fetchImpl = vi.fn();
    const provider = createNominatimGeocodeProvider({
      userAgent: "via-test/1.0",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(await provider.search("   ")).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
