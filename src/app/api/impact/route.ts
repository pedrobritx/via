import { calculateImpact } from "@/domain/compare";
import { createRouteProvider } from "@/domain/providers";
import { parseConsultationInput } from "@/domain/validate";

/**
 * POST /api/impact
 *
 * Calcula os cinco índices para os cenários presencial e remoto e devolve a
 * comparação completa, com a memória de cálculo de cada índice.
 *
 * Ver docs/api.md para o formato do corpo e um exemplo executável.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Corpo da requisição não é JSON válido." },
      { status: 400 },
    );
  }

  const parsed = parseConsultationInput(body);
  if (!parsed.ok) {
    return Response.json(
      {
        error: "Entrada inválida.",
        issues: parsed.issues,
      },
      { status: 422 },
    );
  }

  try {
    const provider = createRouteProvider();
    const result = await calculateImpact(parsed.value, provider);
    return Response.json(result);
  } catch (cause) {
    // O provedor já cai para o estimador offline sozinho, então chegar aqui
    // significa defeito nosso, não indisponibilidade de terceiro.
    const detail = cause instanceof Error ? cause.message : "erro desconhecido";
    return Response.json(
      { error: `Falha ao calcular o impacto: ${detail}` },
      { status: 500 },
    );
  }
}
