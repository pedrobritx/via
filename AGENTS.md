<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VIA — regras do projeto

Antes de escrever código, leia [`agents/README.md`](agents/README.md) e o
arquivo do papel que você está exercendo.

## A regra que sustenta o resto

**`src/domain/` não importa nada de React nem de Next.** É TypeScript puro, sem
DOM. A única leitura de variável de ambiente acontece em
`src/domain/providers/index.ts`, e ela as recebe como argumento.

Isso é o que torna a metodologia testável isoladamente, portável para a API e
auditável por quem não quer ler front-end. Quebrar essa fronteira desfaz o
projeto inteiro.

## Cinco proibições

1. **Nenhum número mágico em fórmula.** Toda constante mora em
   `src/domain/parameters.ts` com valor, faixa, unidade e `sourceId`.
2. **Nenhuma fonte inventada.** Referência plausível e falsa é pior que
   referência ausente: sobrevive à revisão e contamina o que depende dela.
3. **Nenhuma escolha do projeto apresentada como medição.** Peso normativo
   carrega `via-normative-v1`, e há teste garantindo. Contornar esse teste é o
   pior defeito possível neste repositório.
4. **Nenhum texto visível fora do catálogo de i18n**, e nenhuma formatação de
   número, moeda ou data fora de `Intl`.
5. **Nenhuma explicação de cálculo escrita à mão.** O Modo Cientista renderiza o
   `IndexBreakdown`; a página de metodologia é gerada do catálogo. Texto
   paralelo ao código diverge dele na primeira mudança de peso.

## Ao mexer em `src/domain/`

- Incremente `INDEX_VERSION`: major para fórmula, minor para peso, patch para
  valor de constante.
- Declare o impacto metodológico no PR — o template pede.
- Atualize `docs/metodologia.md` se a modelagem mudou, e
  `docs/limitacoes-e-etica.md` se surgiu limitação nova.

## Verificação

Os quatro comandos, sempre. Nenhum é opcional.

```bash
npm run test && npm run typecheck && npm run lint && npm run build
```

Cuidado com `comando | tail`: o código de saída passa a ser o do `tail`, e uma
falha some. Use `set -o pipefail`.

O app precisa subir e calcular **sem nenhuma variável de ambiente**. Se um dia
não subir, o fallback offline quebrou — o passo de build no CI existe para pegar
exatamente isso.

## Acessibilidade

Requisito, não acabamento. WCAG 2.2 AA: percurso por teclado com foco visível,
contraste medido nos dois temas, cor nunca como único portador de informação,
resultado assíncrono anunciado por `aria-live`.

## Ética

Duas decisões que o código aplica e que não devem ser revertidas sem discussão
explícita — ambas fundamentadas em
[`docs/limitacoes-e-etica.md`](docs/limitacoes-e-etica.md):

- O índice social mede **o peso que a viagem impõe à pessoa**, não a pessoa. O
  enquadramento viaja em `caveats`, em toda resposta.
- Falta de internet confiável é **portão**, não peso. O VIA não recomenda
  teleconsulta a quem não consegue usá-la.
