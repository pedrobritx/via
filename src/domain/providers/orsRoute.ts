/**
 * Adaptador de roteamento para o OpenRouteService.
 *
 * Ativado quando `VIA_ORS_API_KEY` está presente. Consulta a malha viária real,
 * o que melhora bastante a distância e o tempo frente ao estimador geométrico.
 *
 * Sobre transporte coletivo: o ORS não roteia ônibus nem metrô. Em vez de
 * fingir que roteia, pedimos o traçado rodoviário e o ajustamos pela razão
 * entre a sinuosidade do coletivo e a do carro, aplicando depois a velocidade
 * do modal. É um híbrido — melhor que a linha reta, pior que um GTFS de
 * verdade — e o resultado se declara como `medium`, não `high`.
 */

import { roundTo } from "../geo";
import { MODAL_DETOUR_FACTOR, MODAL_SPEED_KMH } from "../parameters";
import type { LatLng, RouteLeg, RouteProvider, TransportModal } from "../types";

export const ORS_ROUTE_PROVIDER_ID = "openrouteservice";

const DEFAULT_BASE_URL = "https://api.openrouteservice.org";
const REQUEST_TIMEOUT_MS = 8000;

/** Perfis de roteamento do ORS. */
type OrsProfile = "driving-car" | "cycling-regular" | "foot-walking";

/**
 * Modal do VIA para perfil do ORS.
 *
 * `exact` indica se o perfil representa fielmente o modal. Quando é `false`, o
 * número passa por ajuste e a confiança cai.
 */
const PROFILE_MAP: Record<
  TransportModal,
  { profile: OrsProfile; exact: boolean }
> = {
  car_gasoline: { profile: "driving-car", exact: true },
  car_ethanol: { profile: "driving-car", exact: true },
  taxi_rideshare: { profile: "driving-car", exact: true },
  // O ORS não tem perfil de motocicleta. O traçado de carro é uma boa
  // aproximação da distância, mas a velocidade real difere.
  motorcycle: { profile: "driving-car", exact: false },
  bicycle: { profile: "cycling-regular", exact: true },
  walking: { profile: "foot-walking", exact: true },
  // Sem roteamento de transporte público: híbrido documentado acima.
  bus_urban: { profile: "driving-car", exact: false },
  metro_rail: { profile: "driving-car", exact: false },
};

export class OrsRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrsRouteError";
  }
}

interface OrsSummary {
  distance?: number;
  duration?: number;
}

interface OrsResponse {
  routes?: Array<{ summary?: OrsSummary }>;
  error?: { message?: string } | string;
}

export interface OrsRouteOptions {
  apiKey: string;
  baseUrl?: string;
  /** Injetável para teste. Usa o `fetch` global por padrão. */
  fetchImpl?: typeof fetch;
}

export function createOrsRouteProvider(
  options: OrsRouteOptions,
): RouteProvider {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = options.fetchImpl ?? globalThis.fetch;

  if (!options.apiKey) {
    throw new OrsRouteError("Chave do OpenRouteService ausente.");
  }

  return {
    id: ORS_ROUTE_PROVIDER_ID,

    async estimate(
      from: LatLng,
      to: LatLng,
      modal: TransportModal,
    ): Promise<RouteLeg> {
      const { profile, exact } = PROFILE_MAP[modal];
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let payload: OrsResponse;
      try {
        const response = await doFetch(
          `${baseUrl}/v2/directions/${profile}`,
          {
            method: "POST",
            headers: {
              Authorization: options.apiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            // Atenção: o ORS espera [longitude, latitude], nesta ordem.
            body: JSON.stringify({
              coordinates: [
                [from.lng, from.lat],
                [to.lng, to.lat],
              ],
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new OrsRouteError(
            `OpenRouteService respondeu ${response.status}.`,
          );
        }

        payload = (await response.json()) as OrsResponse;
      } catch (cause) {
        if (cause instanceof OrsRouteError) throw cause;
        const reason =
          cause instanceof Error && cause.name === "AbortError"
            ? `sem resposta em ${REQUEST_TIMEOUT_MS} ms`
            : cause instanceof Error
              ? cause.message
              : "erro desconhecido";
        throw new OrsRouteError(`Falha ao consultar o OpenRouteService: ${reason}.`);
      } finally {
        clearTimeout(timeout);
      }

      const summary = payload.routes?.[0]?.summary;
      if (
        !summary ||
        typeof summary.distance !== "number" ||
        typeof summary.duration !== "number"
      ) {
        throw new OrsRouteError(
          "Resposta do OpenRouteService sem distância ou duração utilizáveis.",
        );
      }

      const roadKm = summary.distance / 1000;

      if (exact) {
        return {
          distanceKm: roundTo(roadKm, 2),
          durationMin: roundTo(summary.duration / 60, 1),
          providerId: ORS_ROUTE_PROVIDER_ID,
          confidence: "high",
        };
      }

      // Ajuste para os modais sem perfil próprio.
      const detourRatio =
        MODAL_DETOUR_FACTOR[modal].value /
        MODAL_DETOUR_FACTOR.car_gasoline.value;
      const distanceKm = roadKm * detourRatio;
      const speed = MODAL_SPEED_KMH[modal].value;
      const durationMin = speed > 0 ? (distanceKm / speed) * 60 : 0;

      return {
        distanceKm: roundTo(distanceKm, 2),
        durationMin: roundTo(durationMin, 1),
        providerId: ORS_ROUTE_PROVIDER_ID,
        confidence: "medium",
        note:
          `O OpenRouteService não roteia ${modal}. A distância vem do traçado ` +
          "rodoviário ajustado pela sinuosidade típica do modal, e o tempo, da " +
          "velocidade média do modal.",
      };
    },
  };
}
