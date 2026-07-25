import { describe, expect, it, vi } from "vitest";

import {
  cepAddressToLabel,
  cepAddressToQuery,
  looksLikeCep,
  lookupCep,
  normalizeCep,
} from "./brasilApiCep";
import { createCompositeGeocodeProvider } from "./compositeGeocode";

/** Resposta real da BrasilAPI — note `coordinates` vazio, que é o caso comum. */
const CEP_PAULISTA = {
  cep: "01310100",
  state: "SP",
  city: "São Paulo",
  neighborhood: "Bela Vista",
  street: "Avenida Paulista",
  service: "open-cep",
  location: { type: "Point", coordinates: {} },
};

const NOMINATIM_HIT = [
  { lat: "-23.5618170", lon: "-46.6559323", display_name: "Avenida Paulista, São Paulo" },
];

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("reconhecimento de CEP", () => {
  it("aceita com e sem hífen", () => {
    expect(looksLikeCep("01310-100")).toBe(true);
    expect(looksLikeCep("01310100")).toBe(true);
    expect(looksLikeCep(" 01310-100 ")).toBe(true);
  });

  it("não confunde endereço que contém números com CEP", () => {
    expect(looksLikeCep("Rua Augusta, 1310100")).toBe(false);
    expect(looksLikeCep("Avenida Paulista")).toBe(false);
    expect(looksLikeCep("123")).toBe(false);
  });

  it("normaliza para oito dígitos ou devolve nulo", () => {
    expect(normalizeCep("01310-100")).toBe("01310100");
    expect(normalizeCep("013101")).toBeNull();
  });

  it("monta a busca e o rótulo a partir do endereço", () => {
    const address = {
      cep: "01310100",
      street: "Avenida Paulista",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    };
    expect(cepAddressToQuery(address)).toBe(
      "Avenida Paulista, Bela Vista, São Paulo, SP",
    );
    expect(cepAddressToLabel(address)).toContain("CEP 01310-100");
    expect(cepAddressToLabel(address)).toContain("Avenida Paulista");
  });
});

describe("lookupCep", () => {
  it("devolve o endereço quando o CEP existe", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(CEP_PAULISTA));
    const address = await lookupCep("01310-100", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(address).toMatchObject({
      cep: "01310100",
      street: "Avenida Paulista",
      city: "São Paulo",
      state: "SP",
    });
  });

  it("devolve nulo para CEP inexistente, sem tratar 404 como falha", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 404));
    const address = await lookupCep("00000-000", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(address).toBeNull();
  });

  it("devolve nulo sem chamar a rede quando o CEP é malformado", async () => {
    const fetchImpl = vi.fn();
    expect(
      await lookupCep("123", { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("geocodificador composto", () => {
  it("resolve coordenadas coladas sem tocar na rede", async () => {
    const fetchImpl = vi.fn();
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
      brasilApi: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("-23.5505, -46.6333");
    expect(places).toHaveLength(1);
    expect(places[0].lat).toBeCloseTo(-23.5505, 4);
    expect(places[0].source).toBe("coordenadas");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("CEP vira endereço na BrasilAPI e coordenada no Nominatim", async () => {
    const fetchImpl = vi.fn(async (url: unknown) => {
      const href = String(url);
      if (href.includes("brasilapi")) return jsonResponse(CEP_PAULISTA);
      if (href.includes("nominatim")) return jsonResponse(NOMINATIM_HIT);
      throw new Error(`URL inesperada: ${href}`);
    });

    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
      brasilApi: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("01310-100");
    expect(places).toHaveLength(1);
    // Coordenada do Nominatim — a BrasilAPI não fornece nenhuma.
    expect(places[0].lat).toBeCloseTo(-23.561817, 5);
    // Rótulo da BrasilAPI, que é mais legível que o do Nominatim.
    expect(places[0].label).toContain("Avenida Paulista");
    expect(places[0].label).toContain("CEP 01310-100");
    expect(places[0].source).toBe("brasilapi-cep");
  });

  it("texto livre chega ao Nominatim e devolve coordenadas", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(NOMINATIM_HIT));
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("Avenida Paulista 900");
    expect(places.length).toBeGreaterThan(0);
    expect(places[0].source).toBe("nominatim");
  });

  it("hospitais curados vêm antes do resultado genérico do OSM", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([
        { lat: "-30.0", lon: "-51.2", display_name: "Algum lugar em Porto Alegre" },
      ]),
    );
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("HCPA");
    // Quem digita a sigla quer aquele hospital, não o que o OSM adivinhar.
    expect(places[0].label).toMatch(/Porto Alegre/);
    expect(places[0].source).toBe("offline-fixtures");
  });

  it("rede fora não quebra a busca: cai para as fixtures", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("Campinas");
    expect(places.length).toBeGreaterThan(0);
    expect(places[0].source).toBe("offline-fixtures");
  });

  it("CEP fora do ar não impede a busca livre de tentar", async () => {
    const fetchImpl = vi.fn(async (url: unknown) => {
      if (String(url).includes("brasilapi")) throw new Error("indisponível");
      return jsonResponse(NOMINATIM_HIT);
    });
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
      brasilApi: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("01310-100");
    expect(places.length).toBeGreaterThan(0);
  });

  it("modo offline nunca toca na rede", async () => {
    const fetchImpl = vi.fn();
    const provider = createCompositeGeocodeProvider({ offlineOnly: true });

    const places = await provider.search("Campinas");
    expect(places.length).toBeGreaterThan(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("busca vazia devolve lista vazia sem consultar nada", async () => {
    const fetchImpl = vi.fn();
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });
    expect(await provider.search("   ")).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("não repete a mesma coordenada vinda de fontes diferentes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([
        // Mesmas coordenadas da fixture do HCPA.
        { lat: "-30.0388", lon: "-51.2065", display_name: "Duplicata" },
      ]),
    );
    const provider = createCompositeGeocodeProvider({
      nominatim: { fetchImpl: fetchImpl as unknown as typeof fetch },
    });

    const places = await provider.search("HCPA");
    const coords = places.map((p) => `${p.lat},${p.lng}`);
    expect(new Set(coords).size).toBe(coords.length);
  });
});
