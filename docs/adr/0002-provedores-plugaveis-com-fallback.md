# ADR 0002 — Provedores plugáveis, com implementação offline como padrão

- **Status:** aceito
- **Data:** 2026-07-25

## Contexto

O cálculo precisa de distância e tempo entre dois pontos. As opções óbvias —
Google Maps, OpenRouteService, uma instância própria de OSRM — todas exigem
chave de API, rede, ou ambos.

Se o VIA depender de uma delas para funcionar, então reproduzir um resultado do
VIA exige ter a chave certa. Um método que só pode ser conferido por quem tem
credencial não é auditável, e auditabilidade é a razão de existir do projeto.

Há ainda um problema operacional: serviços de terceiros ficam fora do ar,
estouram cota e respondem devagar. Uma tela de erro porque o OpenRouteService
atingiu o limite gratuito seria um jeito ruim de falhar.

## Decisão

Duas interfaces — `RouteProvider` e `GeocodeProvider` — com **implementação
offline determinística como padrão**, não como último recurso.

- `offlineRoute`: haversine corrigido por fator de sinuosidade do modal, tempo
  derivado da velocidade média. Sem rede, sem chave, mesma saída sempre.
- `offlineGeocode`: coordenadas digitadas direto, mais uma lista curta de
  cidades e equipamentos de saúde brasileiros.
- `orsRoute` e `nominatimGeocode`: ativados por variável de ambiente.

Duas regras acompanham:

1. **O cálculo nunca falha por causa de serviço externo.** Provedores remotos são
   embrulhados com queda para o offline. Timeout, 429 ou corpo malformado
   degradam para a estimativa geométrica com uma nota explicando o que houve.
2. **Toda estimativa se declara.** O campo `confidence` vale `low`, `medium` ou
   `high`, e a interface exibe. Um número aproximado, rotulado como aproximado, é
   útil; um número aproximado disfarçado de preciso é pior que nenhum.

## Consequências

**A favor**

- `npm install && npm run dev` produz um app funcional. Zero credenciais.
- A suíte de testes roda sem rede e é determinística.
- Uma queda do OpenRouteService degrada a precisão, não a disponibilidade.
- Trocar por OSRM próprio, GTFS ou Google Maps é implementar uma interface.

**Contra**

- O estimador geométrico erra. De 20% a 40% em malhas irregulares, travessias de
  rio e relevo acidentado. Mitigado pelo rótulo de confiança, não resolvido.
- Nem o ORS roteia transporte público. Ônibus e metrô usam o traçado rodoviário
  ajustado pela sinuosidade do modal — melhor que linha reta, pior que GTFS — e
  saem marcados como `medium`.
- Duas implementações por interface é mais código para manter.

## Alternativas consideradas

**Exigir ORS sempre** — mais preciso, e teria evitado o estimador. Rejeitada
porque tornaria o projeto irreprodutível sem credencial e sujeitaria a
disponibilidade a uma cota gratuita de terceiro.

**Cachear respostas do ORS num banco** — resolveria cota e latência, não
reprodutibilidade: o primeiro cálculo de cada rota ainda exigiria a chave. Além
disso, exigiria o banco que o [ADR 0001](0001-app-next-unico.md) decidiu não ter.

## Nota sobre o Nominatim

O adaptador exige `VIA_NOMINATIM_USER_AGENT` explicitamente, em vez de inventar
um cabeçalho. A política de uso da instância pública pede identificação e limita
a uma requisição por segundo; usá-la anonimamente e em volume é abusar de
infraestrutura mantida por doação. Sem o User-Agent configurado, a fábrica cai
para o provedor offline em vez de fazer a requisição.
