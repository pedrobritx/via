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

> **Revisado em 2026-07-25.** A decisão original está preservada abaixo, seguida
> do que a mudou. Um ADR que se reescreve para parecer sempre certo perde a
> função.

**Decisão original.** O adaptador exigia `VIA_NOMINATIM_USER_AGENT`
explicitamente, em vez de inventar um cabeçalho. A política de uso da instância
pública pede identificação e limita a uma requisição por segundo; usá-la
anonimamente e em volume é abusar de infraestrutura mantida por doação. Sem o
User-Agent configurado, a fábrica caía para o provedor offline.

**O que aconteceu.** Ninguém configurou a variável — nem no deploy. O provedor
offline tem 27 lugares fixos, então qualquer endereço digitado por uma pessoa
real devolvia "nenhum lugar encontrado". A cautela protegeu o Nominatim de um
tráfego que nunca existiu, e quebrou o produto para todo mundo. O campo de
origem e destino simplesmente não funcionava, e isso não apareceu nos testes
porque os testes usavam as próprias fixtures.

**Decisão revisada.** A geocodificação real passa a ser o padrão, sem exigir
configuração:

- **User-Agent identificável fixo** (`via-visualizador-impacto-assistencial/0.1
  (+repositório)`). A política pede que a aplicação se identifique — e um
  cabeçalho honesto e constante faz exatamente isso. O que ela proíbe é uso
  anônimo, não uso sem variável de ambiente. A variável continua existindo para
  sobrescrever.
- **Uma requisição por segundo**, serializada em código, com cache em memória de
  24 h para que digitar não gere uma consulta por tecla. O debounce da interface
  subiu de 250 ms para 600 ms pelo mesmo motivo.
- **CEP entra pela BrasilAPI**, que não tem limite de taxa nem exige cadastro, e
  reduz a carga sobre o Nominatim para os casos brasileiros mais comuns.

**Ressalva honesta sobre o limitador.** Em ambiente serverless cada instância
tem sua própria fila, então 1 req/s não é uma garantia global — é uma redução
substancial de rajadas. A garantia real exige `VIA_NOMINATIM_BASE_URL` apontando
para instância própria, e o `.env.example` diz isso.

**A lição.** A decisão original tratava um risco hipotético (abusar do
Nominatim) como mais grave que uma falha certa (o produto não funcionar). Uma
salvaguarda que desliga a funcionalidade principal por padrão não é cautela — é
um defeito com boa justificativa.
