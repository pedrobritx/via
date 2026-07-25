/**
 * Estimador de rota offline e determinístico.
 *
 * Não consulta serviço nenhum. Aproxima o trajeto real pela distância em linha
 * reta corrigida por um fator de sinuosidade do modal, e o tempo pela
 * velocidade média porta a porta do modal.
 *
 * Isso é grosseiro, e o provedor diz isso de si mesmo: devolve sempre
 * `confidence: "low"`, e a interface mostra essa qualificação junto do número.
 * A alternativa — exigir uma chave de API para que o projeto funcione — custaria
 * a propriedade que mais importa aqui: qualquer pessoa consegue clonar o
 * repositório e reproduzir o cálculo, sem pedir credencial a ninguém.
 */

import { haversineKm, roundTo } from "../geo";
import { MODAL_DETOUR_FACTOR, MODAL_SPEED_KMH } from "../parameters";
import type { LatLng, RouteLeg, RouteProvider, TransportModal } from "../types";

export const OFFLINE_ROUTE_PROVIDER_ID = "offline-haversine";

export function estimateOfflineRoute(
  from: LatLng,
  to: LatLng,
  modal: TransportModal,
): RouteLeg {
  const straightKm = haversineKm(from, to);
  const detour = MODAL_DETOUR_FACTOR[modal].value;
  const speed = MODAL_SPEED_KMH[modal].value;

  const distanceKm = straightKm * detour;
  const durationMin = speed > 0 ? (distanceKm / speed) * 60 : 0;

  return {
    distanceKm: roundTo(distanceKm, 2),
    durationMin: roundTo(durationMin, 1),
    providerId: OFFLINE_ROUTE_PROVIDER_ID,
    confidence: "low",
    note:
      "Estimativa geométrica: distância em linha reta corrigida por um fator " +
      "de sinuosidade, sem consultar a malha viária real. Configure " +
      "VIA_ORS_API_KEY para roteamento sobre ruas.",
  };
}

export const offlineRouteProvider: RouteProvider = {
  id: OFFLINE_ROUTE_PROVIDER_ID,
  async estimate(from, to, modal) {
    return estimateOfflineRoute(from, to, modal);
  },
};
