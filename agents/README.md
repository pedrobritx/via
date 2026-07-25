# Agentes do VIA

Sete papéis de escopo estreito, não um superagente.

A razão é simples: um agente com permissão para mexer em tudo comete erros em
tudo. Um agente que só pode escrever documentação não consegue quebrar uma
fórmula. Menos poder, menos estrago — e revisão mais fácil, porque quem revisa
sabe de antemão o que aquele agente podia ter tocado.

## Os papéis

| Arquivo | Papel | Escreve em |
| --- | --- | --- |
| [`orchestrator.md`](orchestrator.md) | Quebra o problema, decide a próxima etapa | issues, roadmap |
| [`research.md`](research.md) | Levanta fontes e fundamenta | `docs/referencias.md` |
| [`methodology.md`](methodology.md) | Define fórmulas, pesos e normalizações | `src/domain/` |
| [`frontend.md`](frontend.md) | Constrói telas e componentes | `src/components/`, `src/app/`, `src/i18n/` |
| [`backend.md`](backend.md) | Rotas, provedores, exportação | `src/app/api/`, `src/domain/providers/` |
| [`qa.md`](qa.md) | Confere implementação contra especificação | testes |
| [`docs.md`](docs.md) | Transforma tudo em documentação auditável | `docs/`, `README.md` |

## Formato

Todo arquivo de agente tem as mesmas seções:

- **Missão** — uma frase.
- **Não fazer** — os limites, explicitamente.
- **Entradas** — o que precisa receber para trabalhar.
- **Saídas** — o que deve entregar.
- **Critério de aprovação** — como saber que terminou.
- **Formato de resposta** — como entregar.

## Regras que valem para todos

1. **Um prompt, uma entrega.** Nada de "faz tudo do projeto". Escopo fechado,
   arquivos permitidos, definição de pronto.
2. **Nenhuma fonte inventada.** Se um número precisa de fonte e não há fonte,
   isso é um achado a reportar, não um espaço a preencher com algo plausível.
3. **Toda mudança em `src/domain/` exige declaração de impacto metodológico** no
   PR: o que mudou, de quanto para quanto, com que fonte, e se `INDEX_VERSION`
   foi incrementado.
4. **Revisão humana é obrigatória** antes de avançar de fase.
5. **A verificação é o comando, não a impressão.** `npm run test`,
   `npm run typecheck`, `npm run lint`, `npm run build`. Um agente que diz
   "deve funcionar" não terminou.
