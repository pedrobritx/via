# ADR 0004 — Interface editorial em percurso guiado

- **Status:** aceito
- **Data:** 2026-07-25

## Contexto

A primeira interface era um formulário à esquerda e um painel de resultado à
direita. Tecnicamente correta: calculava, exibia os cinco índices, abria o Modo
Cientista, passava no teclado e no contraste.

E não ensinava nada. Quem chegava via um formulário pedindo idade, mobilidade,
renda e acesso à internet **antes** de saber para que serviam. Preenchia no
escuro ou desistia. Num produto cuja tese é que o custo de uma consulta é
invisível, entregar uma tela que não explica o que está medindo desperdiça o
argumento inteiro.

Há um agravante ético. Perguntar renda e limitação de mobilidade sem dizer o que
o sistema fará com esses dados é um pedido que a pessoa não tem como avaliar. A
explicação precisa vir antes, não numa página de metodologia que quase ninguém
abre.

## Decisão

**Uma página só, lida de cima para baixo, com quatro passos numerados. Cada
seção explica o conceito antes de pedir o dado.**

O que o VIA faz com "ônibus urbano" aparece acima do controle que escolhe
"ônibus urbano". O enquadramento do índice social — mede o peso que a viagem
impõe à pessoa, nunca a pessoa — aparece acima dos campos de idade e mobilidade,
não depois deles.

A linguagem visual é o sistema editorial-acadêmico: papel creme quente,
Fraunces para display, Newsreader para leitura, JetBrains Mono para rótulos,
ênfase em itálico, numerais de seção em itálico serifado. O primário é o verde
profundo do VIA no lugar do bordô canônico do sistema — verde comunica saúde e
ambiente, que é o assunto; vinho, num contexto clínico, remeteria a alerta.

Seis regras que acompanham:

1. **Nenhum passo trava o seguinte.** O estado de "aguardando" é visual e
   textual. Quem quiser ler o passo 03 antes de preencher o 01 pode, e o leitor
   de tela percorre a página inteira em qualquer momento. Formulário que esconde
   as próximas perguntas até responder a atual é hostil e inacessível.
2. **Números não animam.** Nada de contagem crescente na entrada. A animação
   daria um instante de espetáculo e custaria a premissa: um número que se move
   enquanto é lido pede para ser sentido, não conferido. O movimento fica na
   entrada dos blocos de texto, e some inteiro sob `prefers-reduced-motion`.
3. **O estado inicial da revelação é aplicado por JavaScript, nunca por CSS.**
   Sem script, com script quebrado ou sem `IntersectionObserver`, o conteúdo
   aparece normalmente. O pior desfecho de um efeito decorativo seria uma página
   em branco.
4. **Todo controle é nativo por dentro.** Slider é `<input type="range">`;
   escolha exclusiva é `<input type="radio">` visualmente oculto dentro do
   rótulo. O comportamento de teclado e o anúncio por leitor de tela vêm do
   navegador, que faz isso melhor que qualquer reimplementação em `<div>`.
5. **Sem emoji.** Os marcadores da jornada são ordinais e discos. Um emoji de
   cadeira para "espera na unidade" depende da fonte do sistema, muda de desenho
   entre plataformas e é lido em voz alta com um nome que ninguém escolheu.
6. **Tema único, claro.** Não há variante escura. O sistema foi desenhado para
   papel, e inverter o creme quebraria a relação entre ouro, verde e tinta.

## Onde a narrativa para e a estrutura começa

O sistema editorial é explícito ao dizer que não serve para interfaces densas de
dados. A tensão é real e foi resolvida por divisão, não por concessão:

- **Narrativa** — herói, as cinco medidas, os quatro passos, a frase-resumo.
  Assimétrica, generosa, com ênfase itálica e ornamentos.
- **Dados** — cartões de índice, barras comparativas, tabelas do Modo Cientista,
  página de metodologia. Alinhados, tabulares, numeração monoespaçada.

A tipografia e o ritmo atravessam os dois. O que não atravessa é a assimetria:
comparar cinco índices em duas condições exige grade.

## Consequências

**A favor**

- Quem rola a página aprende o que são os cinco índices sem clicar em nada.
- O enquadramento ético chega antes das perguntas sensíveis, não depois.
- Herói e bloco explicativo são estáticos e renderizados no servidor: são
  legíveis antes de qualquer JavaScript carregar.
- Contraste medido nos pares que este layout produz, não presumido.

**Contra**

- A página é longa. Quem já conhece a ferramenta rola muito para chegar ao
  cálculo. Mitigado pelos passos numerados e pelas âncoras, não resolvido.
- Três famílias tipográficas custam banda, mesmo auto-hospedadas.
- Um tema só. Quem prefere interface escura não tem opção.
- O bloco explicativo repete, em prosa, o que os `caveats` de cada índice já
  dizem. É duplicação deliberada — o texto do passo é lido antes do cálculo, o
  `caveat` é lido depois —, mas é duplicação, e precisa ser mantida em dia.

## Alternativas consideradas

**Assistente de várias telas, um passo por vez.** Guiaria melhor quem nunca viu
a ferramenta e destruiria a leitura corrida de quem quer entender o método antes
de usar. Também dificultaria voltar e mexer num dado para ver o efeito, que é
metade do valor de um visualizador.

**Manter o painel e acrescentar textos de ajuda.** Mais barato. Mas ajuda dentro
de formulário é lida por quem já decidiu preencher; o problema era exatamente
quem ainda não tinha decidido.

**Recalcular a cada mudança, sem botão.** Tentador num visualizador. Rejeitado
porque cada cálculo pode disparar uma consulta de rota, e porque o resultado
mudando sozinho embaixo da mão de quem mexe num slider é mais confuso que
fluido. O meio-termo adotado: o botão permanece, e o resultado anterior fica
visível marcado como desatualizado.
