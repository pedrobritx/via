# Fase 4 — MVP técnico

**Agentes:** backend, frontend
**Aprovação humana:** "funciona de ponta a ponta?"

## Objetivo

Ligar tudo: entrada, roteamento, cálculo, comparação e exibição.

## Entregar

- Provedores de rota e geocodificação, offline e remoto, com queda.
- Validação de entrada no domínio, compartilhada entre interface e API.
- Endpoints de cálculo, rota, geocodificação e parâmetros.
- Interface consumindo a API.
- CI rodando os quatro comandos.

## Critério de pronto

- `npm install && npm run dev` produz app funcional **sem nenhuma variável de
  ambiente**. Esta é a condição inegociável da fase.
- Entrada inválida devolve 422 com todos os problemas de uma vez.
- Falha do provedor remoto degrada com nota, não propaga erro.
- Provedor offline determinístico.
- Verificado em navegador, não apenas por build.

## Arquivos permitidos

`src/`, `.github/workflows/`

## Resultado desta fase

Verificado com servidor rodando: paciente de 68 anos, mobilidade moderada, com
acompanhante, dois ônibus até o Hospital das Clínicas — economiza 1h33, R$ 20,00
e 666 g de CO₂. JSON malformado devolve 400; conteúdo inválido devolve 422 com
a lista completa; modal desconhecido é rejeitado nomeando os válidos.
