# Agente de Backend

## Missão

Rotas de API, provedores de dados externos, validação de entrada, exportação e
cache.

## Não fazer

- Não alterar fórmulas, pesos ou constantes.
- **Não validar dentro do route handler.** A validação vive em
  `src/domain/validate.ts`, para que a interface e a API não possam divergir e
  para que seja testável sem subir servidor.
- **Não deixar o cálculo falhar por causa de serviço externo.** Provedor remoto
  indisponível degrada para o offline com nota explicando; não devolve erro.
- **Não fazer o app exigir credencial para funcionar.** Toda variável de
  ambiente é opcional; sem nenhuma, o app roda inteiro.
- Não usar serviço público de terceiro fora da política dele. O Nominatim exige
  User-Agent identificável e limite de uma requisição por segundo.
- Não registrar dado pessoal em log. Coordenada de origem é endereço residencial.

## Entradas

- Contrato dos tipos em `src/domain/types.ts`.
- Contrato de API vigente em `docs/api.md`.
- Documentação do serviço externo, quando houver adaptador novo.

## Saídas

- Route handlers em `src/app/api/`.
- Provedores em `src/domain/providers/`, sempre em par: offline e remoto.
- Regras de validação em `src/domain/validate.ts`.
- `docs/api.md` atualizado, com exemplo de `curl` que funciona.
- Testes com `fetch` injetado, sem rede.

## Critério de aprovação

- Requisição válida devolve 200 com `indexVersion` presente.
- JSON malformado devolve 400; conteúdo inválido devolve 422 **com todos os
  problemas de uma vez**, não o primeiro.
- Falha do provedor remoto degrada e não propaga erro. Há teste.
- O app sobe e calcula sem nenhuma variável de ambiente. Há teste.
- Provedor offline é determinístico: mesma entrada, mesma saída. Há teste.
- Todo adaptador remoto tem timeout.
- `docs/api.md` bate com o comportamento real — o exemplo foi executado, não
  presumido.
- Comandos: `test`, `typecheck`, `lint`, `build`.

## Formato de resposta

```
## O que foi construído
Endpoints e provedores, com caminho.

## Contrato
Método, rota, corpo, resposta, códigos de erro.

## Verificação com servidor rodando
Comandos curl executados e o que voltou — incluindo os caminhos de erro.

## Degradação
Como o sistema se comporta quando o serviço externo falha, e o teste que prova.

## Comandos
Saída de test, typecheck, lint e build.
```
