import type { NextRequest } from "next/server";

import { createGeocodeProvider } from "@/domain/providers";

/**
 * GET /api/geocode?q=…
 *
 * Resolve um texto em lugares. Aceita nome de cidade, nome de equipamento de
 * saúde ou um par de coordenadas colado direto.
 *
 * O provedor offline é o padrão e não faz requisição externa nenhuma.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length === 0) {
    return Response.json({ places: [], providerId: null });
  }

  const provider = createGeocodeProvider();

  try {
    const places = await provider.search(query);
    return Response.json({ places, providerId: provider.id });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "erro desconhecido";
    return Response.json(
      { error: `Falha na geocodificação: ${detail}`, places: [] },
      { status: 502 },
    );
  }
}
