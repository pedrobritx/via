# Metodologia

Como o VIA chega em cada número.

Os **valores** das constantes não estão aqui — estão em
[`src/domain/parameters.ts`](../src/domain/parameters.ts), publicados em
`GET /api/parameters` e renderizados em `/metodologia`. Este documento explica
as **fórmulas e as decisões de modelagem**; a tabela de constantes é gerada do
código para que não possa divergir dele.

Versão dos índices descrita aqui: `via-idx-0.1.0`.

---

## Princípio

Todo índice devolve um `IndexBreakdown` contendo, além do valor:

- a fórmula em LaTeX;
- os **componentes** — parcelas cujas contribuições somam exatamente o valor;
- as **entradas** — fatores multiplicativos que participam sem ser parcelas;
- os identificadores de fonte de cada constante;
- as ressalvas aplicáveis àquele cálculo.

A separação entre componentes e entradas não é estética: ela torna a invariante
"a composição exibida soma o número exibido" verificável por teste, em vez de
uma promessa. O Modo Cientista renderiza esse objeto diretamente.

---

## 1. Pegada de carbono

```
CO₂ (kg) = distância_ida × 2 × fator_modal × k_ocioso ÷ ocupação
```

Três decisões que uma multiplicação ingênua erra:

**A divisão por ocupação só vale para quem dirige.** Fatores de transporte
coletivo já são expressos por passageiro-quilômetro. Dividi-los de novo pelo
número de ocupantes contaria a carona duas vezes.

**Táxi e aplicativo carregam o trecho rodado sem passageiro** (`k_ocioso ≈ 1,4`).
Entre uma corrida e outra o veículo anda vazio, e essa emissão existe em função
da viagem. Ignorá-la subestima o modal em cerca de 30%.

**A teleconsulta não emite zero.** São ~0,01 kg por consulta (dispositivos, rede,
datacenter). Duas a três ordens de grandeza abaixo de qualquer deslocamento
motorizado, mas apresentá-la como neutra seria o mesmo tipo de omissão que esta
ferramenta existe para corrigir.

Quando alguém divide o carro, o resultado avisa que o total lançado na atmosfera
não caiu — apenas a parcela atribuída àquela pessoa.

---

## 2. Tempo total

```
Presencial: T = (t_ida + t_volta) × c + t_modal + t_espera + t_consulta
Remoto:     T = t_preparo + t_consulta
```

**A consulta entra nos dois cenários, com a mesma duração.** Não é aí que está a
diferença, e mantê-la nos dois lados impede que a comparação exagere a economia.

**O fator de congestionamento `c` tem padrão 1,0**, não 1,3. As velocidades
médias por modal já são portas a porta em cidade brasileira — já embutem o
trânsito de um dia comum. Adotar 1,3 como padrão contaria o congestionamento
duas vezes. Valores acima de 1 significam "pior que o dia típico".

**`t_modal` é o componente mais esquecido.** São 24 minutos para ônibus: doze de
espera média por embarque, duas vezes. Não aparece em nenhum aplicativo de rota,
e é tempo de vida igual. Para carro são 10 minutos de procura de vaga e caminhada
do estacionamento.

Quando há acompanhante, o resultado avisa que o total é o tempo do paciente — o
acompanhante gasta praticamente o mesmo, e isso não está somado.

---

## 3. Custo

```
C = C_transporte + C_pedágio + C_estacionamento + (renda_mensal ÷ 220) × horas
```

`C_transporte` varia por modal: combustível para quem dirige, tarifa por embarque
para coletivo (multiplicada pelo número de baldeações e pelo acompanhante, se
houver), bandeirada mais quilometragem para táxi.

**Duas decisões evitam inventar prejuízo:**

Sem renda declarada, a parcela de produtividade **não entra** e o custo se declara
parcial. Imputar salário mínimo a quem não informou renda produziria um número
com aparência de fato.

`countProductivityLoss: false` existe para quem é aposentado, desempregado ou tem
jornada flexível. Para essas pessoas a viagem custa tempo de vida, mas não
salário, e converter uma coisa na outra seria uma conta falsa.

**O tempo da consulta remota também é monetizado**, quando cabe. Descontar apenas
o lado presencial exageraria a economia.

Custo zero é resultado legítimo — caminhar sem converter tempo em salário custa
mesmo nada — e aparece explicitamente, não como tabela vazia.

---

## 4. Carga de deslocamento (0–100)

```
Carga = 0,40·T + 0,20·E + 0,15·C + 0,10·P + 0,15·U
```

| Componente | O que é | Como vira 0–100 |
| --- | --- | --- |
| `T` tempo | Deslocamento + overhead do modal | Linear até 180 min, satura em 100 |
| `E` estresse | Base do modal × congestionamento | Ônibus 75, carro 60, metrô 50, a pé 25 |
| `C` desconforto | Penalidade do modal | Ônibus 70, metrô 55, carro 25, táxi 20 |
| `P` estacionamento | Dificuldade de estacionar | 70 para quem dirige, 0 para os demais |
| `U` imprevisibilidade | Baldeações e trânsito | 20 por baldeação + excedente de congestionamento |

O componente de tempo olha o **deslocamento**, não o total: a espera na unidade e
a consulta existem igualmente no cenário remoto e não são carga *de deslocamento*.

**Por que linear e não saturante.** Uma curva com retorno decrescente seria
teoricamente melhor — o 150º minuto pesa menos que o 10º. A regra de aprovação
da metodologia é que ela possa ser explicada em dois minutos a uma pessoa leiga,
e "cada minuto conta igual até três horas" passa nesse teste enquanto uma
exponencial não passa. Troca consciente de precisão por auditabilidade,
registrada em [limitações](limitacoes-e-etica.md).

O cenário remoto usa a mesma fórmula com constantes próprias: estresse 15
(ansiedade com a tecnologia), desconforto 5, estacionamento 0,
imprevisibilidade 20 (a chamada pode cair). Resulta em carga baixa, **não nula**.

> Os pesos são normativos. Leia [limitações](limitacoes-e-etica.md) antes de
> citar este índice.

---

## 5. Impacto social (0–100)

```
Social = 0,30·I + 0,30·M + 0,20·A + 0,20·R
```

| Componente | Regra |
| --- | --- |
| `I` idade | 0 até os 60; rampa linear até 100 aos 85. Menor de 18 → 60 |
| `M` mobilidade | Nenhuma 0 · leve 40 · moderada 70 · severa 100 |
| `A` acompanhante | 0 ou 100 |
| `R` renda | 100 na renda zero, decrescendo até 0 em 3 salários mínimos |

**O que este índice mede:** o peso que *este deslocamento* impõe a *esta pessoa*.
Não classifica pessoas. Valor alto é argumento para remover a viagem, nunca para
restringir o acesso de alguém. Esse enquadramento acompanha o número em
`caveats`, em toda resposta.

Menores de 18 pontuam porque o deslocamento sempre mobiliza um adulto junto.

Sem renda declarada, o componente de renda fica em zero e o resultado avisa que
o índice está subestimado — melhor que inventar uma renda.

**No cenário remoto permanecem 15%** do ônus do perfil. Operar um aplicativo de
vídeo é, em si, uma barreira para parte das pessoas idosas e com deficiência —
exatamente quem mais ganharia em não viajar. Zerar esconderia esse grupo.

---

## 6. Incerteza

Cada constante carrega `low` e `high` além do valor central. Para as fórmulas
lineares — emissão, custo, tempo — a faixa é propagada e exibida.

Os índices compostos **não têm faixa**. Não porque sejam precisos, mas porque uma
faixa sugeriria um rigor estatístico que pesos normativos não têm. A ausência é
mais honesta que um intervalo inventado. Em vez disso, eles são arredondados
para múltiplos de 5.

---

## 7. Estimador offline de rota

Sem chave de roteamento:

```
distância = haversine(origem, destino) × fator_sinuosidade(modal)
tempo     = distância ÷ velocidade_média(modal)
```

Determinístico: mesma entrada, mesma saída, para sempre. Devolve sempre
`confidence: "low"` e diz de si mesmo que não consultou rua nenhuma.

A alternativa — exigir uma chave de API para o projeto funcionar — custaria a
propriedade que mais importa: qualquer pessoa consegue clonar o repositório e
reproduzir o cálculo sem pedir credencial a ninguém. Um método que só pode ser
reproduzido por quem tem a chave certa não é auditável.

---

## 8. Versionamento

`INDEX_VERSION` acompanha todo resultado e toda resposta de API.

| Mudou | Incrementa |
| --- | --- |
| Uma fórmula ou a definição de um índice | major |
| Um peso | minor |
| O valor de uma constante (preço, fator) | patch |

É isso que permite reinterpretar um resultado guardado meses depois, conferindo
contra a versão que o produziu.
