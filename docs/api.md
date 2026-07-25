# API do VIA

Três endpoints REST. Todos devolvem JSON, não exigem autenticação e funcionam
sem nenhuma variável de ambiente configurada.

Toda resposta de cálculo carrega `indexVersion`. Guarde esse campo junto com o
resultado: é o que permite reinterpretar um número meses depois, conferindo
contra a versão de fórmulas e constantes que o produziu.

---

## `GET /api/parameters`

Publica todas as constantes do sistema — valor, faixa de incerteza, unidade e
fonte —, a versão dos índices e quais provedores estão ativos.

Existe para que alguém possa auditar ou citar o método sem ler o código.

```bash
curl -s http://localhost:3000/api/parameters
```

Resposta (recortada):

```json
{
  "indexVersion": "via-idx-0.1.0",
  "compositeRoundingStep": 5,
  "groups": [
    {
      "id": "emissions",
      "title": "Fatores de emissão",
      "entries": [
        {
          "key": "car_gasoline",
          "value": 0.192,
          "low": 0.14,
          "high": 0.26,
          "unit": "kgCO2e/km",
          "sourceId": "defra-2024",
          "note": "Carro de porte médio. No Brasil a gasolina C leva ~27% de etanol anidro..."
        }
      ]
    }
  ],
  "sources": [
    {
      "id": "defra-2024",
      "title": "Greenhouse gas reporting: conversion factors",
      "publisher": "UK Department for Energy Security and Net Zero (DESNZ/DEFRA)",
      "year": 2024
    }
  ],
  "providers": {
    "route": "offline-haversine",
    "geocode": "offline-fixtures",
    "routeIsOffline": true,
    "geocodeIsOffline": true
  },
  "notice": "Os pesos dos índices compostos ... são escolhas normativas do projeto ..."
}
```

`providers.routeIsOffline: true` significa que as distâncias vêm do estimador
geométrico, não de roteamento sobre ruas. Leve isso em conta antes de citar um
número.

---

## `GET /api/route-estimate`

Distância e tempo de um trajeto de ida.

| Parâmetro | Obrigatório | Descrição |
| --- | --- | --- |
| `fromLat`, `fromLng` | sim | Coordenadas da origem |
| `toLat`, `toLng` | sim | Coordenadas do destino |
| `modal` | não | Padrão `car_gasoline` |

```bash
curl -s "http://localhost:3000/api/route-estimate\
?fromLat=-23.5505&fromLng=-46.6333\
&toLat=-22.9099&toLng=-47.0626\
&modal=bus_urban"
```

```json
{
  "distanceKm": 121.3,
  "durationMin": 485.2,
  "providerId": "offline-haversine",
  "confidence": "low",
  "note": "Estimativa geométrica: distância em linha reta corrigida por um fator de sinuosidade, sem consultar a malha viária real. Configure VIA_ORS_API_KEY para roteamento sobre ruas."
}
```

`confidence` vale `low`, `medium` ou `high`. Nunca ignore esse campo: `low`
significa que nenhuma rua foi consultada.

---

## `POST /api/impact`

O cálculo completo: cinco índices para o cenário presencial e para o remoto,
mais a comparação.

### Corpo

```jsonc
{
  "origin":      { "lat": -23.5505, "lng": -46.6333, "label": "Casa" },
  "destination": { "lat": -23.5558, "lng": -46.6697, "label": "Hospital" },
  "modal": "bus_urban",

  // Opcionais
  "occupancy": 1,             // 1–8, pessoas no veículo
  "transfers": 1,             // 0–10, baldeações na ida
  "tollBRL": 0,               // pedágio por trajeto
  "parkingBRL": 0,            // estacionamento pela visita
  "congestionFactor": 1.0,    // 1,0 = dia típico; acima disso, pior
  "consultationMinutes": 15,

  "profile": {
    "age": 68,
    "mobility": "moderate",        // none | mild | moderate | severe
    "requiresCompanion": true,
    "monthlyIncomeBRL": 2500,      // opcional — ver nota abaixo
    "hasReliableInternet": true,
    "countProductivityLoss": false
  }
}
```

Dois campos do perfil mudam o resultado de forma que não é óbvia:

- **`monthlyIncomeBRL` é legitimamente opcional.** Omitido, a parcela de
  produtividade perdida não entra e o custo se declara parcial. O sistema não
  imputa salário mínimo a quem não informou renda — isso produziria um número
  com aparência de fato.
- **`countProductivityLoss: false`** para quem é aposentado, desempregado ou tem
  jornada flexível. O tempo continua sendo gasto; ele só não vira desconto no
  salário.

E um que muda a leitura do resultado inteiro:

- **`hasReliableInternet: false`** faz `remoteViable` vir `false` e preenche
  `remoteBlockedReason`. Os índices continuam sendo calculados, mas a economia é
  hipotética. Quem consome a API deve exibir esse aviso: recomendar teleconsulta
  a quem não tem internet transfere o problema em vez de resolvê-lo.

Ausência de `hasReliableInternet` é tratada como `false`. O padrão seguro é não
recomendar.

```bash
curl -s -X POST http://localhost:3000/api/impact \
  -H 'Content-Type: application/json' \
  -d '{
    "origin":      { "lat": -23.5505, "lng": -46.6333, "label": "Casa" },
    "destination": { "lat": -23.5558, "lng": -46.6697, "label": "Hospital" },
    "modal": "bus_urban",
    "transfers": 1,
    "profile": {
      "age": 68, "mobility": "moderate", "requiresCompanion": true,
      "monthlyIncomeBRL": 2500, "hasReliableInternet": true,
      "countProductivityLoss": false
    }
  }'
```

### Resposta

```jsonc
{
  "indexVersion": "via-idx-0.1.0",
  "computedAt": "2026-07-25T05:18:00.000Z",
  "input": { /* entrada normalizada, com padrões aplicados */ },

  "inPerson": {
    "scenario": "in_person",
    "carbon": { /* IndexBreakdown */ },
    "time":   { /* ... */ },
    "cost":   { /* ... */ },
    "burden": { /* ... */ },
    "social": { /* ... */ },
    "route":  { "distanceKm": 5.4, "confidence": "low", "...": "..." }
  },
  "remote": { "...": "..." },

  "savings": {
    "carbonKg": 0.666,
    "timeMin": 92.6,
    "costBRL": 40,
    "burdenPoints": 35,
    "socialPoints": 50
  },

  "remoteViable": true,
  "remoteBlockedReason": null,
  "caveats": ["..."]
}
```

### O `IndexBreakdown`

É a parte que interessa a quem quer auditar. Todo índice devolve:

```jsonc
{
  "key": "carbon",
  "label": "Pegada de carbono",
  "value": 0.676,
  "unit": "kg CO₂e",
  "uncertainty": { "value": 0.676, "low": 0.436, "high": 1.199 },
  "formulaTex": "\\mathrm{CO_2} = \\frac{d_{ida} \\times 2 \\times f_{modal}}{n}",

  // Parcelas somáveis: as contribuições somam exatamente "value".
  "components": [
    { "key": "outbound", "label": "Trajeto de ida", "input": 5.45,
      "inputUnit": "km", "contribution": 0.338, "sourceId": "antp-mobilidade" }
  ],

  // Fatores que participam do cálculo sem serem parcelas.
  "inputs": [
    { "key": "emission_factor", "label": "Fator de emissão (bus_urban)",
      "value": 0.062, "unit": "kgCO2e/passageiro-km", "sourceId": "antp-mobilidade" }
  ],

  "sourceIds": ["antp-mobilidade"],
  "indexVersion": "via-idx-0.1.0",
  "caveats": ["A distância veio de uma estimativa geométrica..."]
}
```

A separação entre `components` e `inputs` não é estética. As contribuições dos
componentes somam o valor do índice — há teste garantindo isso —, o que torna a
composição verificável em vez de decorativa.

`uncertainty` só aparece onde a propagação é honesta: fórmulas lineares sobre
constantes com faixa conhecida. Os índices compostos não a trazem, porque seus
pesos são normativos e uma faixa ali sugeriria um rigor que não existe.

---

## Erros

| Código | Quando |
| --- | --- |
| `400` | Corpo não é JSON válido |
| `422` | JSON válido, conteúdo inválido |
| `500` | Defeito nosso |

O `422` devolve **todos** os problemas de uma vez, não o primeiro:

```json
{
  "error": "Entrada inválida.",
  "issues": [
    { "field": "origin.lat", "message": "Latitude deve ser um número entre -90 e 90." },
    { "field": "modal", "message": "Modal deve ser um de: car_gasoline, car_ethanol, ..." },
    { "field": "profile.age", "message": "Idade deve ser um número entre 0 e 120." }
  ]
}
```

Indisponibilidade do serviço de roteamento **não** gera erro. O cálculo cai para
o estimador offline e o `RouteLeg` explica o que aconteceu, em `note`. Um número
aproximado, rotulado como aproximado, é mais útil que uma tela de erro.

---

## Limites e uso responsável

Não há autenticação nem limitação de taxa nesta versão — o endurecimento é a
fase 6 do roadmap. Se for expor publicamente, ponha um limitador na frente.

Antes de usar qualquer número em decisão real, leia
[`limitacoes-e-etica.md`](limitacoes-e-etica.md). O resumo: carga de
deslocamento e impacto social têm pesos normativos, não medidos, e servem para
comparar cenários entre si — não são grandezas físicas.
