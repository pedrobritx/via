# Fase 6 — Endurecimento e custo

**Agentes:** backend, QA
**Aprovação humana:** "isso não vai comer o orçamento vivo?"
**Estado:** pendente

## Objetivo

Preparar para exposição pública: limitar abuso, controlar custo, observar
comportamento em produção.

## Entregar

- Limitação de taxa nos endpoints. Hoje **não há nenhuma** — expor publicamente
  sem isso é convite a abuso e a conta de OpenRouteService.
- Cache de rotas e geocodificação. Consultas ao mesmo par origem–destino são
  repetitivas e a resposta é estável.
- Registro estruturado, **sem dado pessoal**. Coordenada de origem é endereço
  residencial; não vai para log.
- Teste de carga e medição de custo por cálculo, separando o caso offline do
  caso com roteamento pago.
- Revisão de segurança: OWASP Top 10, cabeçalhos, CORS.
- Cobertura de teste medida e com meta declarada.

## Critério de pronto

- Rajada de requisições é limitada e devolve 429 com `Retry-After`.
- Rota repetida é servida do cache; taxa de acerto medida.
- Nenhum registro contém coordenada, idade, renda ou condição de saúde.
- Custo por cálculo estimado, com e sem provedor pago.
- Nenhuma vulnerabilidade alta em dependência de produção.

## Arquivos permitidos

`src/app/api/`, `src/domain/providers/`, `.github/workflows/`, `docs/`

## A decidir nesta fase

- Cache em memória por processo ou serviço externo? Um serviço externo
  contradiz o [ADR 0001](../docs/adr/0001-app-next-unico.md) — se for
  necessário, o ADR precisa ser revisado, não contornado em silêncio.
- Limitação por IP, por chave, ou ambos?
- Persistir resultados para relatório em lote reabre LGPD como requisito
  concreto: base legal por campo, consentimento, criptografia em repouso,
  direito à exclusão, auditoria. Hoje a ausência de persistência é o que mantém
  isso simples — a troca precisa ser deliberada.
