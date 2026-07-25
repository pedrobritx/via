/**
 * Fábrica de provedores.
 *
 * Este é o único ponto de `src/domain/` que lê variáveis de ambiente, e ele as
 * recebe como argumento para continuar testável.
 *
 * A regra que governa tudo aqui: **o cálculo nunca falha por causa de um
 * serviço externo**. Se o roteamento remoto não responde, estoura o tempo ou
 * devolve lixo, caímos no estimador offline e dizemos isso no resultado. Um
 * número aproximado, rotulado como aproximado, é útil; uma tela de erro porque
 * uma API de terceiro caiu, não.
 */

import type { GeocodeProvider, RouteProvider } from "../types";
import { OFFLINE_GEOCODE_PROVIDER_ID } from "./offlineGeocode";
import {
  OFFLINE_ROUTE_PROVIDER_ID,
  estimateOfflineRoute,
  offlineRouteProvider,
} from "./offlineRoute";
import { createOrsRouteProvider } from "./orsRoute";
import { createCompositeGeocodeProvider } from "./compositeGeocode";

export * from "./brasilApiCep";
export * from "./compositeGeocode";
export * from "./offlineGeocode";
export * from "./offlineRoute";
export * from "./nominatimGeocode";
export * from "./orsRoute";

/**
 * Só o subconjunto do ambiente que interessa aos provedores.
 *
 * A assinatura de índice existe para que `process.env` (cujas chaves o
 * TypeScript não conhece) seja atribuível a este tipo sem cast.
 */
export interface ProviderEnv {
  VIA_ORS_API_KEY?: string;
  VIA_ORS_BASE_URL?: string;
  VIA_GEOCODE_PROVIDER?: string;
  VIA_NOMINATIM_USER_AGENT?: string;
  VIA_NOMINATIM_BASE_URL?: string;
  [key: string]: string | undefined;
}

/**
 * Envolve um provedor remoto com queda para o estimador offline.
 *
 * A queda é silenciosa para o usuário no sentido de não quebrar a página, mas
 * nunca silenciosa no resultado: o `RouteLeg` devolvido explica que houve
 * fallback e por quê.
 */
function withOfflineFallback(primary: RouteProvider): RouteProvider {
  return {
    id: primary.id,
    async estimate(from, to, modal) {
      try {
        return await primary.estimate(from, to, modal);
      } catch (cause) {
        const reason =
          cause instanceof Error ? cause.message : "erro desconhecido";
        const fallback = estimateOfflineRoute(from, to, modal);
        return {
          ...fallback,
          note:
            `Roteamento por ${primary.id} indisponível (${reason}) — ` +
            `usando o estimador geométrico offline. ${fallback.note ?? ""}`.trim(),
        };
      }
    },
  };
}

export function createRouteProvider(env: ProviderEnv = process.env): RouteProvider {
  const apiKey = env.VIA_ORS_API_KEY?.trim();
  if (!apiKey) return offlineRouteProvider;

  try {
    return withOfflineFallback(
      createOrsRouteProvider({
        apiKey,
        baseUrl: env.VIA_ORS_BASE_URL?.trim() || undefined,
      }),
    );
  } catch {
    // Configuração inválida não deve derrubar a aplicação.
    return offlineRouteProvider;
  }
}

/**
 * Geocodificação: CEP e endereço reais por padrão.
 *
 * O padrão anterior eram as fixtures offline, e o resultado prático era que
 * qualquer endereço digitado por uma pessoa real devolvia "nenhum lugar
 * encontrado" — 27 lugares fixos não são um geocodificador. Agora o padrão é o
 * provedor composto, que resolve CEP e texto livre sem exigir chave nenhuma.
 *
 * `VIA_GEOCODE_PROVIDER=offline` força o modo sem rede, para testes e para
 * ambientes isolados.
 */
export function createGeocodeProvider(
  env: ProviderEnv = process.env,
): GeocodeProvider {
  const choice = env.VIA_GEOCODE_PROVIDER?.trim().toLowerCase();

  if (choice === "offline") {
    return createCompositeGeocodeProvider({ offlineOnly: true });
  }

  try {
    return createCompositeGeocodeProvider({
      nominatim: {
        userAgent: env.VIA_NOMINATIM_USER_AGENT?.trim() || undefined,
        baseUrl: env.VIA_NOMINATIM_BASE_URL?.trim() || undefined,
      },
    });
  } catch {
    return createCompositeGeocodeProvider({ offlineOnly: true });
  }
}

/**
 * Descreve a configuração ativa, para exibir na interface e em `/api/parameters`.
 * O usuário precisa saber se está lendo um número roteado de verdade ou uma
 * aproximação geométrica.
 */
export function describeProviders(env: ProviderEnv = process.env): {
  route: string;
  geocode: string;
  routeIsOffline: boolean;
  geocodeIsOffline: boolean;
} {
  const route = createRouteProvider(env);
  const geocode = createGeocodeProvider(env);
  return {
    route: route.id,
    geocode: geocode.id,
    routeIsOffline: route.id === OFFLINE_ROUTE_PROVIDER_ID,
    geocodeIsOffline:
      geocode.id === OFFLINE_GEOCODE_PROVIDER_ID ||
      env.VIA_GEOCODE_PROVIDER?.trim().toLowerCase() === "offline",
  };
}
