import { buildParameterCatalog } from "@/domain/catalog";
import { describeProviders } from "@/domain/providers";

/**
 * GET /api/parameters
 *
 * Publica todas as constantes do sistema, com faixa de incerteza, unidade e
 * fonte, mais a versão dos índices e quais provedores estão ativos.
 *
 * Este endpoint existe para que alguém possa auditar ou citar o método sem ler
 * o código — e para que um resultado guardado possa ser reinterpretado depois,
 * conferindo contra a versão que o produziu.
 */
export async function GET() {
  const catalog = buildParameterCatalog();
  const providers = describeProviders();

  return Response.json(
    {
      ...catalog,
      providers,
      notice:
        "Os pesos dos índices compostos (carga de deslocamento e impacto social) " +
        "são escolhas normativas do projeto, identificadas pela fonte " +
        "'via-normative-v1'. Não são medições e não devem ser citados como tal.",
    },
    {
      headers: {
        // O catálogo só muda quando o código muda.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
