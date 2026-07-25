# ADR 0001 — App Next.js único, com núcleo de domínio puro

- **Status:** aceito
- **Data:** 2026-07-25
- **Versão dos índices na decisão:** `via-idx-0.1.0`

## Contexto

A especificação original propunha frontend Next.js com backend separado em
Python (FastAPI ou Django REST), microsserviços, PostgreSQL com PostGIS, Redis
para cache e Kubernetes.

Essa arquitetura responde a um problema de escala que o projeto ainda não tem. O
que ele tem é um problema de credibilidade: uma metodologia que ninguém revisou
e um conjunto de fórmulas que precisam ser auditáveis antes de serem escaláveis.

## Decisão

Um único aplicativo Next.js em TypeScript, com App Router e Route Handlers para
a API. Sem backend separado, sem banco de dados, sem cache distribuído nesta
versão.

A restrição que sustenta a decisão: **`src/domain/` não importa nada de React
nem de Next**. É TypeScript puro, sem DOM, e a única leitura de variável de
ambiente acontece na fábrica de provedores, que as recebe como argumento.

## Consequências

**A favor**

- O núcleo de cálculo é testável sem subir servidor e sem navegador. A suíte do
  domínio roda em ambiente `node` e leva menos de um segundo.
- A metodologia pode ser revisada por alguém que não queira ler uma linha de
  front-end.
- Deploy em qualquer plataforma que rode Next, sem infraestrutura adicional.
- Um colaborador consegue rodar o projeto inteiro com `npm install && npm run dev`.

**Contra**

- Cálculo pesado em lote — o caso de uso "hospital envia mil consultas
  agendadas" — não cabe bem em route handler. Vai exigir fila ou worker.
- Sem persistência, não há histórico, comparação temporal nem relatório
  agregado. São casos de uso reais da especificação, adiados de propósito.
- Cientistas de dados trabalhando em Python precisarão consumir a API em vez de
  importar o módulo de cálculo.

**Migração, se necessária**

A pureza de `src/domain/` é justamente o que torna a saída barata. Extraí-lo
como pacote consumido por um serviço separado, ou reimplementá-lo contra a mesma
suíte de testes, não exige tocar na interface. A decisão é reversível; foi
escolhida para ser.

## Alternativas consideradas

**Next.js + FastAPI separado** — mais fiel à especificação e melhor para
integração com o ecossistema científico de Python. Rejeitada por dois deploys,
dois ambientes e duas linguagens antes de existir uma metodologia validada.

**Next.js + Supabase desde o MVP** — traria persistência e autenticação de
imediato. Rejeitada por exigir credenciais para rodar o projeto, o que contradiz
a propriedade central: qualquer pessoa clona e reproduz o cálculo sem pedir
acesso a ninguém.
