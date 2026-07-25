/**
 * Índice de Impacto Social (0–100).
 *
 *   Social = 0,30·idade + 0,30·mobilidade + 0,20·acompanhante + 0,20·renda
 *
 * LEIA ISTO ANTES DE USAR O NÚMERO.
 *
 * Este índice mede **o peso que este deslocamento impõe a esta pessoa**. Ele
 * não classifica pessoas, não mede vulnerabilidade individual, e não serve para
 * decidir quem merece atendimento. Um valor alto significa "esta viagem é
 * especialmente onerosa para este perfil" — e a leitura correta é remover a
 * viagem, nunca a pessoa.
 *
 * A especificação original somava pontos avulsos (idoso +50, cadeirante +40,
 * baixa renda +20). Isso estoura os 100 pontos, torna a escala ininterpretável
 * e sugere que características se acumulam linearmente em "quantidade de
 * vulnerabilidade". Aqui é média ponderada normalizada: cada dimensão contribui
 * no máximo com seu peso, o total nunca ultrapassa 100, e a composição é
 * legível.
 *
 * O cenário remoto não zera o índice. Operar um aplicativo de vídeo é, em si,
 * uma barreira para parte das pessoas idosas e com deficiência — exatamente
 * quem mais ganharia em não viajar. Zerar esconderia esse grupo.
 */

import { clamp, inverseRampScore, rampScore, roundToStep } from "../geo";
import {
  COMPOSITE_ROUNDING_STEP,
  INDEX_VERSION,
  MINIMUM_WAGE_BRL,
  REMOTE_SOCIAL_RESIDUAL,
  SOCIAL_AGE_ONSET,
  SOCIAL_AGE_SATURATION,
  SOCIAL_INCOME_THRESHOLD_MW,
  SOCIAL_MINOR_SCORE,
  SOCIAL_MOBILITY_SCORE,
  SOCIAL_WEIGHTS,
} from "../parameters";
import type { IndexBreakdown, IndexComponent, IndexInput } from "../types";
import type { ScenarioContext } from "./context";

const LABEL = "Impacto social";
const UNIT = "pontos (0–100)";

const FORMULA = String.raw`\text{Social} = 0{,}30\,I + 0{,}30\,M + 0{,}20\,A + 0{,}20\,R`;

const FRAMING_CAVEAT =
  "Este índice mede o peso que o deslocamento impõe a este perfil — não classifica a pessoa. " +
  "Valor alto é argumento para remover a viagem, nunca para restringir o acesso de alguém.";

const NORMATIVE_CAVEAT =
  "Os pesos são uma escolha normativa do projeto, não uma medição. " +
  "O valor é arredondado para múltiplos de 5 por isso.";

export function computeSocial(ctx: ScenarioContext): IndexBreakdown {
  const { profile } = ctx.input;
  const isRemote = ctx.scenario === "remote";

  // Idade: até 18 anos o deslocamento sempre mobiliza um adulto junto; a partir
  // dos 60 o peso cresce progressivamente até saturar aos 85.
  const ageScore =
    profile.age < 18
      ? SOCIAL_MINOR_SCORE.value
      : rampScore(
          profile.age,
          SOCIAL_AGE_ONSET.value,
          SOCIAL_AGE_SATURATION.value,
        );

  const mobilityScore = SOCIAL_MOBILITY_SCORE[profile.mobility].value;
  const companionScore = profile.requiresCompanion ? 100 : 0;

  // Sem renda declarada o componente fica em zero, e a ressalva avisa que o
  // índice está subestimado — melhor que inventar uma renda.
  const incomeDeclared = profile.monthlyIncomeBRL !== undefined;
  const incomeInMinWages = incomeDeclared
    ? (profile.monthlyIncomeBRL as number) / MINIMUM_WAGE_BRL.value
    : Number.POSITIVE_INFINITY;
  const incomeScore = incomeDeclared
    ? inverseRampScore(incomeInMinWages, SOCIAL_INCOME_THRESHOLD_MW.value)
    : 0;

  // No cenário remoto resta apenas a fração referente à barreira digital.
  const residual = isRemote ? REMOTE_SOCIAL_RESIDUAL.value : 1;

  const components: IndexComponent[] = [
    {
      key: "age",
      label: "Idade",
      input: profile.age,
      inputUnit: "anos",
      weight: SOCIAL_WEIGHTS.age.value,
      contribution: ageScore * SOCIAL_WEIGHTS.age.value * residual,
      sourceId: "via-normative-v1",
    },
    {
      key: "mobility",
      label: "Mobilidade",
      input: mobilityScore,
      inputUnit: "pontos",
      weight: SOCIAL_WEIGHTS.mobility.value,
      contribution: mobilityScore * SOCIAL_WEIGHTS.mobility.value * residual,
      sourceId: "who-equity",
    },
    {
      key: "companion",
      label: "Necessidade de acompanhante",
      input: companionScore,
      inputUnit: "pontos",
      weight: SOCIAL_WEIGHTS.companion.value,
      contribution: companionScore * SOCIAL_WEIGHTS.companion.value * residual,
      sourceId: "via-normative-v1",
    },
    {
      key: "income",
      label: "Renda",
      input: incomeDeclared ? Math.round(incomeInMinWages * 10) / 10 : 0,
      inputUnit: "salários mínimos",
      weight: SOCIAL_WEIGHTS.income.value,
      contribution: incomeScore * SOCIAL_WEIGHTS.income.value * residual,
      sourceId: "ibge-pnad",
    },
  ];

  const raw = components.reduce((sum, c) => sum + c.contribution, 0);
  const value = clamp(roundToStep(raw, COMPOSITE_ROUNDING_STEP), 0, 100);

  const inputs: IndexInput[] = [
    {
      key: "minimum_wage",
      label: "Salário mínimo de referência",
      value: MINIMUM_WAGE_BRL.value,
      unit: MINIMUM_WAGE_BRL.unit,
      sourceId: MINIMUM_WAGE_BRL.sourceId,
    },
  ];

  if (isRemote) {
    inputs.push({
      key: "remote_residual",
      label: "Fração residual na teleconsulta",
      value: REMOTE_SOCIAL_RESIDUAL.value,
      unit: REMOTE_SOCIAL_RESIDUAL.unit,
      sourceId: REMOTE_SOCIAL_RESIDUAL.sourceId,
    });
  }

  const caveats = [FRAMING_CAVEAT, NORMATIVE_CAVEAT];

  if (!incomeDeclared) {
    caveats.push(
      "Renda não declarada: o componente de renda ficou em zero, então este índice está subestimado para quem tem renda baixa.",
    );
  }
  if (isRemote) {
    caveats.push(
      "No cenário remoto permanece a fração referente à barreira de usar o meio digital — a teleconsulta reduz o ônus social, não o elimina.",
    );
  }

  return {
    key: "social",
    label: LABEL,
    value,
    unit: UNIT,
    formulaTex: FORMULA,
    components,
    inputs,
    sourceIds: ["via-normative-v1", "who-equity", "ibge-pnad"],
    indexVersion: INDEX_VERSION,
    caveats,
  };
}
