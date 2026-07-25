import type { NextRequest } from "next/server";

import { createRouteProvider } from "@/domain/providers";
import { TRANSPORT_MODALS, type TransportModal } from "@/domain/types";

/**
 * GET /api/route-estimate
 *
 * Distância e tempo de um trajeto, com o provedor que produziu a estimativa e
 * o quanto confiar nela.
 *
 * Exemplo:
 *   /api/route-estimate?fromLat=-23.55&fromLng=-46.63&toLat=-22.91&toLng=-47.06&modal=bus_urban
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;

  const coords = {
    fromLat: Number(q.get("fromLat")),
    fromLng: Number(q.get("fromLng")),
    toLat: Number(q.get("toLat")),
    toLng: Number(q.get("toLng")),
  };

  const invalid = Object.entries(coords)
    .filter(([, value]) => !Number.isFinite(value))
    .map(([key]) => key);

  if (invalid.length > 0) {
    return Response.json(
      {
        error: `Coordenadas ausentes ou inválidas: ${invalid.join(", ")}.`,
      },
      { status: 422 },
    );
  }

  if (
    Math.abs(coords.fromLat) > 90 ||
    Math.abs(coords.toLat) > 90 ||
    Math.abs(coords.fromLng) > 180 ||
    Math.abs(coords.toLng) > 180
  ) {
    return Response.json(
      { error: "Coordenadas fora dos limites geográficos válidos." },
      { status: 422 },
    );
  }

  const modalParam = q.get("modal") ?? "car_gasoline";
  if (!TRANSPORT_MODALS.includes(modalParam as TransportModal)) {
    return Response.json(
      {
        error: `Modal inválido. Use um de: ${TRANSPORT_MODALS.join(", ")}.`,
      },
      { status: 422 },
    );
  }

  const provider = createRouteProvider();
  const leg = await provider.estimate(
    { lat: coords.fromLat, lng: coords.fromLng },
    { lat: coords.toLat, lng: coords.toLng },
    modalParam as TransportModal,
  );

  return Response.json(leg);
}
