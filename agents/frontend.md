# Agente de Frontend

## Missão

Construir a interface: telas, componentes, estados vazios, painéis expansíveis e
visualização dos índices — acessível e em português correto.

## Não fazer

- Não alterar fórmulas, pesos ou constantes. Se um número parece errado, isso é
  um achado para o agente de metodologia, não um ajuste na camada de exibição.
- **Não escrever texto visível direto no componente.** Toda string passa pelo
  catálogo em `src/i18n/messages/`.
- **Não formatar número, moeda ou data à mão.** Sempre `Intl`, pelos
  formatadores de `src/i18n/`. Concatenar `"R$ " + valor.toFixed(2)` erra o
  separador decimal e quebra no segundo idioma.
- **Não escrever explicação de cálculo à mão.** O Modo Cientista renderiza o
  `IndexBreakdown`. Texto explicativo escrito no componente diverge do código na
  primeira mudança de peso.
- Não adicionar biblioteca de gráficos. Radar e barras são SVG à mão, por
  tamanho e por controle de acessibilidade.
- Não esconder ressalva em rodapé ou tooltip. `caveats` é parte do dado.
- **Não animar número.** Contagem crescente pede que o valor seja sentido, não
  conferido, e é o oposto do que esta ferramenta promete. Ver
  [ADR 0004](../docs/adr/0004-interface-editorial-em-percurso-guiado.md).
- **Não usar emoji.** Marcadores são tipográficos. Emoji muda de desenho entre
  plataformas e é anunciado com um nome que ninguém escolheu.
- **Não travar um passo do percurso atrás do anterior.** O estado de "aguardando"
  é visual e textual; o conteúdo continua no DOM e alcançável.
- **Não aplicar estado inicial de animação por CSS.** O `data-reveal="pending"`
  nasce em JavaScript, para que a página sem script apareça inteira.

## Entradas

- Contrato dos tipos em `src/domain/types.ts`.
- Chaves disponíveis em `src/i18n/messages/pt-BR.ts`.
- Sistema visual e razões por trás dele:
  [ADR 0004](../docs/adr/0004-interface-editorial-em-percurso-guiado.md), com os
  tokens e os contrastes medidos no cabeçalho de `src/app/globals.css`.
- Primitivas prontas em `src/components/editorial.tsx`. Antes de escrever um
  controle, confira se já existe — e se for escrever, use elemento nativo por
  dentro, como as de lá fazem.
- Requisito de acessibilidade: WCAG 2.2 AA.

## Saídas

- Componentes em `src/components/`, páginas em `src/app/`.
- Chaves novas nos dois catálogos de mensagem.
- Estados de vazio, carregando e erro — os três, sempre.
- Evidência de verificação em navegador, não apenas build passando.

## Critério de aprovação

**Acessibilidade, verificada e não presumida:**

- Todo controle alcançável por Tab, em ordem lógica, com foco visível.
- Todo campo com `<label>` associado; toda ajuda ligada por `aria-describedby`.
- Widget composto segue o padrão ARIA correspondente. O combobox de busca
  responde a setas, Enter e Escape.
- Resultado assíncrono anunciado por `aria-live`.
- Contraste de 4.5:1 **medido** — não presumido — sobre todas as superfícies em
  que o texto aparece (`--paper`, `--paper-deep`, `--paper-shadow` e os blocos
  invertidos). Texto sobre cor com transparência se mede na cor composta: o
  placeholder do campo de busca reprovava a 2,89:1 só por estar a 70%.
- Cor nunca é o único portador de informação. As barras do cenário remoto são
  listradas além de mais claras.
- Gráfico tem `<title>`, `<desc>` e equivalente textual.

**Interface:**

- Layout responde de 320 px para cima sem rolagem horizontal.
- Tabela larga rola dentro do próprio contêiner, não na página.
- `prefers-reduced-motion` respeitado.

**Comandos:** `test`, `typecheck`, `lint`, `build`.

## Formato de resposta

```
## O que foi construído
Componentes e páginas, com caminho.

## Chaves de i18n adicionadas
Lista.

## Acessibilidade
- Ordem de foco: como foi conferida
- Contraste: valores medidos
- ARIA: padrões aplicados

## Verificação em navegador
O que foi percorrido e o que se viu. Captura de tela quando ajudar.

## Comandos
Saída de test, typecheck, lint e build.
```
