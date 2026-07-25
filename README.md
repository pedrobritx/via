# VIA — Visualizador de Impacto Assistencial

Quanto custa, de verdade, ir a uma consulta médica?

O paciente vê "consulta às 14h". Não vê as três horas de trânsito, os R$ 60, os
4,9 kg de CO₂, nem o desgaste físico — que para uma pessoa idosa ou com
mobilidade reduzida é ordens de grandeza maior do que para um adulto de carro
próprio. Sem esse número, a escolha entre presencial e teleconsulta é feita no
escuro, tanto pelo paciente quanto por quem administra o serviço de saúde.

O VIA calcula esse número e mostra como chegou nele.

## O que ele faz

Dado uma origem, um destino, um modal de transporte e um perfil de paciente, o
VIA estima cinco índices para o cenário presencial e para o remoto:

| Índice | Unidade | O que mede |
| --- | --- | --- |
| Pegada de carbono | kg CO₂e | Emissões do deslocamento de ida e volta |
| Tempo total | minutos | Viagem + esperas + consulta |
| Custo | R$ | Combustível, tarifas, estacionamento e produtividade perdida |
| Carga de deslocamento | 0–100 | Esforço composto: tempo, estresse, conforto, baldeações |
| Impacto social | 0–100 | O peso que esse deslocamento impõe àquele perfil |

Depois compara os dois cenários e resume em uma frase: *"Você economizou 78
minutos, R$ 43 e 4,9 kg de CO₂."*

## O que o torna diferente de uma calculadora de CO₂

**Nenhum número aparece sem a conta.** Cada índice devolve, junto com o valor, a
fórmula em LaTeX, os valores de entrada, os pesos aplicados e o identificador da
fonte de cada constante. O "Modo Cientista" da interface não é uma página
escrita à mão — é a renderização direta do que a função de cálculo retornou. Não
existe caminho pelo qual o texto explicativo divirja do número exibido.

**Roda sem credencial nenhuma.** `npm install && npm run dev` e pronto. Os
provedores de rota e geocodificação têm implementações offline determinísticas.
Chaves de API são opcionais e só melhoram a precisão. Isso é deliberado: um
método que só pode ser reproduzido por quem tem a chave certa não é auditável.

**Os índices são versionados.** Toda resposta carrega um `indexVersion`. Se um
peso ou constante mudar, a versão muda junto, e resultados antigos continuam
interpretáveis.

## Começando

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`. Nenhuma variável de ambiente é necessária.

Para usar roteamento real em vez do estimador offline, copie `.env.example` para
`.env.local` e preencha `VIA_ORS_API_KEY`.

## Comandos

```bash
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção
npm run test       # testes do núcleo de cálculo
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Arquitetura

```
src/domain/     Núcleo de cálculo. TypeScript puro, zero React, zero Next.
src/app/        Páginas e rotas de API do Next.
src/components/ Interface.
src/i18n/       Catálogo de mensagens e formatação via Intl.
docs/           Metodologia, referências, limitações, ADRs.
agents/         Escopo e regras de cada agente do projeto.
prompts/        Prompts de fase, um por entrega.
```

A regra que sustenta o resto: **`src/domain/` não importa nada de React nem de
Next**. A camada de interface chama funções e desenha o resultado. É o que torna
o método testável isoladamente, portável para a API pública e auditável por
alguém que não queira ler uma linha de front-end.

## API

Três endpoints REST, documentados em [`docs/api.md`](docs/api.md):

- `POST /api/impact` — cálculo completo dos dois cenários
- `GET /api/route-estimate` — distância e tempo de um trajeto
- `GET /api/parameters` — todas as constantes, fontes e a versão dos índices

O terceiro existe para que qualquer pessoa possa citar e conferir os parâmetros
sem precisar ler o código.

## Limitações

Leia [`docs/limitacoes-e-etica.md`](docs/limitacoes-e-etica.md) antes de usar os
resultados em qualquer decisão real. Em resumo: os pesos da carga de
deslocamento e do impacto social são **normativos, não medidos**. Representam um
juízo defensável e documentado sobre o que pesa numa viagem — não uma constante
da natureza. Números com aparência de precisão merecem desconfiança, e a
documentação diz exatamente onde ela cabe.

Uma ressalva que o código também aplica: o VIA **não** recomenda teleconsulta a
quem declara não ter conexão confiável. Recomendar telemedicina a quem não tem
internet reproduz exclusão digital em nome de sustentabilidade.

## Licença

Código sob licença MIT. Metodologia e documentação sob CC BY 4.0.
