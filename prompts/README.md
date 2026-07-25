# Prompts de fase

Seis fases, cada uma com aprovação humana antes da seguinte.

A regra que sustenta tudo: **um prompt, uma entrega**. Escopo fechado, arquivos
permitidos, definição de pronto, revisão obrigatória.

| Fase | Entrega | Estado |
| --- | --- | --- |
| [01](phase-01-scope.md) | Visão e escopo | concluída |
| [02](phase-02-methodology.md) | Metodologia e fórmulas | concluída — `via-idx-0.1.0` |
| [03](phase-03-ux.md) | UX e fluxo | concluída |
| [04](phase-04-mvp.md) | MVP técnico | concluída |
| [05](phase-05-transparency.md) | Transparência e ciência aberta | concluída |
| [06](phase-06-hardening.md) | Endurecimento e custo | pendente |

As cinco primeiras foram entregues na construção inicial do repositório. Os
arquivos permanecem porque descrevem o que cada fase precisa satisfazer — e
qualquer trabalho futuro que toque aquela camada responde ao mesmo critério.

## Onde gastar modelo caro

Esforço alto onde há incerteza real:

- decisões de arquitetura;
- revisão de metodologia;
- refatoração crítica;
- checagem final antes de merge.

Execução barata onde não há:

- componente repetitivo;
- teste simples;
- ajuste de texto;
- documentação derivada;
- diff pequeno.

A fase 2 é a que mais merece esforço: um erro de fórmula não quebra o build,
apenas produz números errados com aparência de certos.
