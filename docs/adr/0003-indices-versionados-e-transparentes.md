# ADR 0003 — Índices versionados e transparentes por construção

- **Status:** aceito
- **Data:** 2026-07-25

## Contexto

A especificação pede um "Modo Cientista": um botão "como calculamos?" que revela
fórmulas, pesos e fontes de cada índice.

A implementação ingênua é escrever essas explicações à mão, numa página ou num
componente, ao lado do código que calcula. Isso funciona no primeiro dia e falha
no segundo: alguém ajusta um peso, esquece de atualizar o texto, e a ferramenta
passa a exibir uma explicação que não corresponde ao número exibido. Numa
ferramenta cujo argumento de venda é a auditabilidade, esse é o pior defeito
possível — pior que errar a conta, porque errar a conta é visível.

Há um segundo problema: se um peso mudar em março, um resultado calculado em
janeiro deixa de ser interpretável. Não há como saber qual fórmula o produziu.

## Decisão

**Todo índice devolve um `IndexBreakdown`** contendo, além do valor: a fórmula em
LaTeX, os componentes com seus pesos e contribuições, as entradas
multiplicativas, os identificadores de fonte e as ressalvas.

O Modo Cientista **renderiza esse objeto**. A página `/metodologia` é gerada do
catálogo de parâmetros. Nenhuma explicação é escrita à mão em lugar nenhum.

Três disciplinas sustentam isso:

1. **Componentes são somáveis; entradas não.** As contribuições dos componentes
   somam exatamente o valor do índice, e há teste garantindo. Fatores
   multiplicativos vão para `inputs`. Sem essa separação, a invariante seria
   aproximada e a composição exibida, decorativa.
2. **Toda constante mora em `parameters.ts` com valor, faixa, unidade e
   `sourceId`.** Nenhum número mágico em fórmula. Testes garantem que toda
   constante cite uma fonte existente e que toda fonte declarada seja usada.
3. **`INDEX_VERSION` acompanha todo resultado**, resposta de API e exportação.
   Major para mudança de fórmula, minor para mudança de peso, patch para
   mudança de valor de constante.

Complemento: `GET /api/parameters` publica o catálogo inteiro, para que o método
possa ser citado e conferido sem ler código.

## Consequências

**A favor**

- A explicação não pode divergir do número: é o mesmo objeto.
- Mudar um peso atualiza automaticamente a interface, a página de metodologia e
  a API.
- Um resultado guardado continua interpretável — basta conferir a versão contra
  o catálogo.
- O que é normativo fica visível: os pesos carregam `via-normative-v1` e
  aparecem rotulados.

**Contra**

- Cada índice devolve um objeto bem maior que um número. As respostas da API são
  verbosas.
- Escrever um índice novo dá mais trabalho: além da conta, é preciso montar
  componentes, entradas e ressalvas.
- A fórmula em LaTeX é a única parte que ainda pode divergir do código — ela é
  uma string, não é executada. Um teste consegue checar que ela existe e não que
  ela está correta. É o ponto fraco remanescente desta decisão.

## Nota sobre arredondamento

Índices compostos são arredondados para múltiplos de 5, e faixas de incerteza
não são exibidas para eles.

Não é economia de dígitos. Pesos normativos não sustentam a resolução que "47"
sugere, e exibir esse número convidaria comparações espúrias entre 47 e 48. Uma
faixa de confiança ali seria pior ainda: sugeriria rigor estatístico onde há
julgamento documentado. A ausência é mais honesta que um intervalo inventado.

O arredondamento é uma declaração de honestidade embutida no próprio número.
