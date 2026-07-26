/**
 * O estudo que embasa o VIA — edição em português do Brasil.
 *
 * Mora em `src/content/` e não no catálogo de `src/i18n/`, e a distinção é
 * deliberada. O catálogo guarda strings de interface: rótulo de botão, título
 * de seção, mensagem de erro — coisas curtas, avulsas, que uma tradutora troca
 * uma a uma. Um documento de seis mil palavras com citações e notas não é isso.
 * Traduzi-lo é reescrevê-lo, e a unidade de tradução é o arquivo inteiro.
 *
 * Por isso o arquivo carrega o nome do idioma: uma edição em inglês nasce como
 * `en-US.tsx` ao lado deste, e o carregador escolhe. A regra do projeto —
 * nenhum texto visível fora de um módulo por idioma — continua valendo; o que
 * muda é a granularidade, porque a do catálogo não serve para prosa longa.
 */

import type { ReactNode } from "react";

import {
  Cite,
  CiteInline,
  Destaque,
  Externo,
  Interno,
  NotaRef,
  Secao,
  Termo,
  Transcricao,
} from "@/components/estudo";
import type { Secao as SecaoMeta } from "./tipos";

export const META = {
  titulo: "O custo invisível de uma consulta presencial",
  subtitulo:
    "Fundamentação, método e limites do Visualizador de Impacto Assistencial",
  versao: "1.0",
  data: "julho de 2026",
};

/**
 * Resumo conforme a NBR 6028: parágrafo único, voz ativa, terceira pessoa.
 * Sem citação e sem enumeração — a norma é explícita quanto a isso.
 */
export const RESUMO =
  "Este estudo apresenta a fundamentação do Visualizador de Impacto Assistencial (VIA), " +
  "ferramenta que quantifica o custo total de uma consulta médica presencial e o compara " +
  "com o de uma teleconsulta. Descreve o problema que a ferramenta endereça — o custo do " +
  "deslocamento assistencial é real, recai sobre o paciente e não aparece em nenhum " +
  "registro clínico —, revisa a evidência disponível sobre emissões evitadas por " +
  "telemedicina e sobre barreira de transporte no acesso à saúde, e detalha os cinco " +
  "índices calculados: emissão de carbono, tempo, custo financeiro, carga de deslocamento " +
  "e impacto social. Distingue, parâmetro a parâmetro, o que provém de medição publicada " +
  "e o que constitui escolha normativa do projeto. Expõe as duas decisões éticas que a " +
  "implementação aplica: a ausência de conexão confiável opera como impedimento e não " +
  "como penalidade na pontuação, e os índices medem o peso que o deslocamento impõe à " +
  "pessoa, jamais a pessoa. Conclui delimitando o que a ferramenta não mede, com destaque " +
  "para a consulta que deixa de acontecer.";

export const PALAVRAS_CHAVE = [
  "telemedicina",
  "acesso à saúde",
  "mobilidade urbana",
  "pegada de carbono",
  "equidade em saúde",
];

/**
 * Seções na ordem do documento, com indicativo numérico progressivo
 * (NBR 6024). O sumário é gerado desta mesma lista — é o que garante que a
 * hierarquia exibida seja idêntica à do texto, como a NBR 6027 exige, sem
 * depender de alguém lembrar de atualizar os dois lugares.
 */
export const SECOES: SecaoMeta[] = [
  { indicativo: "1", id: "introducao", titulo: "Introdução", nivel: 1 },
  { indicativo: "1.1", id: "problema", titulo: "O problema", nivel: 2 },
  { indicativo: "1.2", id: "escopo", titulo: "O que este estudo sustenta", nivel: 2 },
  { indicativo: "2", id: "conta-invisivel", titulo: "A conta invisível", nivel: 1 },
  { indicativo: "2.1", id: "evidencia", titulo: "O que já foi medido", nivel: 2 },
  { indicativo: "2.2", id: "media-nao-basta", titulo: "Por que a média não basta", nivel: 2 },
  { indicativo: "3", id: "metodo", titulo: "Método", nivel: 1 },
  { indicativo: "3.1", id: "indices", titulo: "Os cinco índices", nivel: 2 },
  { indicativo: "3.2", id: "medida-e-escolha", titulo: "Medida e escolha", nivel: 2 },
  { indicativo: "3.3", id: "incerteza", titulo: "Incerteza", nivel: 2 },
  { indicativo: "4", id: "etica", titulo: "Duas decisões éticas", nivel: 1 },
  { indicativo: "4.1", id: "portao", titulo: "Internet é portão, não peso", nivel: 2 },
  { indicativo: "4.2", id: "viagem-nao-pessoa", titulo: "O índice mede a viagem", nivel: 2 },
  { indicativo: "5", id: "limitacoes", titulo: "Limitações", nivel: 1 },
  { indicativo: "6", id: "consideracoes", titulo: "Considerações finais", nivel: 1 },
];

/** Notas explicativas, numeradas em sequência única (NBR 10520:2023, 8.2). */
export const NOTAS: Array<{ n: number; texto: ReactNode }> = [
  {
    n: 1,
    texto: (
      <>
        A conversão de tempo em dinheiro só ocorre quando quem usa informa a
        renda e declara que faltar ao trabalho a reduz. Sem esses dois dados, a
        parcela não entra e o custo se apresenta como parcial. Imputar salário
        mínimo a quem não respondeu produziria um número com aparência de fato.
      </>
    ),
  },
  {
    n: 2,
    texto: (
      <>
        Os pesos são <strong>0,40</strong> para tempo, <strong>0,20</strong> para
        esforço, <strong>0,15</strong> para conforto, <strong>0,10</strong> para
        estacionamento e <strong>0,15</strong> para imprevisibilidade. Há teste
        automatizado verificando que somam 1,0 e que todo parâmetro normativo
        carrega o identificador <code>via-normative-v1</code>.
      </>
    ),
  },
  {
    n: 3,
    texto: (
      <>
        Trinta e três estudos revisados, dos quais vinte e três tratam
        especificamente do deslocamento do paciente. A dispersão do intervalo
        interquartílico reflete geografia, não discordância metodológica.
      </>
    ),
  },
  {
    n: 4,
    texto: (
      <>
        A distinção entre <em>acesso</em> e <em>conectividade significativa</em>{" "}
        é o ponto central do relatório: a segunda combina velocidade, custo,
        equipamento adequado e ambiente de uso numa escala de nove indicadores.
        Ter um celular com dados pré-pagos conta como acesso e não como
        conectividade significativa.
      </>
    ),
  },
  {
    n: 5,
    texto: (
      <>
        O estimador geométrico erra de 20% a 40% em malhas irregulares,
        travessias de rio e relevo acidentado. O erro é mitigado pelo rótulo de
        confiança exibido em cada resultado, não resolvido.
      </>
    ),
  },
];

/** O corpo do documento, seção a seção, indexado pelo `id` da seção. */
export const CORPO: Record<string, ReactNode> = {
  introducao: (
    <p>
      O Visualizador de Impacto Assistencial é uma ferramenta de cálculo aberta
      que responde a uma pergunta simples e mal respondida:{" "}
      <Destaque>quanto custa, de verdade, ir a uma consulta médica</Destaque>.
      Este documento reúne a fundamentação do método, a evidência que o sustenta
      e — com igual espaço — aquilo que ele não é capaz de afirmar.
    </p>
  ),

  problema: (
    <>
      <p>
        Um encaminhamento médico diz “retorno em trinta dias”. O que ele não diz
        é que o retorno custa três horas de trânsito, duas conduções, um dia de
        trabalho e a presença de um acompanhante. Esse custo é real, recai
        inteiramente sobre o paciente e{" "}
        <Destaque>não aparece em nenhum registro clínico</Destaque>. O sistema de
        saúde registra a consulta; não registra a viagem que a tornou possível.
      </p>
      <p>
        A consequência não é apenas econômica. Quando a viagem é cara demais, ela
        deixa de acontecer — e a consulta junto.{" "}
        <CiteInline id="syed-2013" />, revisando sessenta e um estudos,
        identifica a barreira de transporte como causa recorrente de consulta
        remarcada, perdida ou adiada, com efeito concentrado sobre pessoas de
        menor renda. Não se trata de correlação frouxa: quando a barreira é
        removida por intervenção deliberada, a falta cai. A metanálise de{" "}
        <CiteInline id="shekelle-2022" /> encontra razão de chances de{" "}
        <strong>0,63</strong> (IC 95%: 0,48–0,83) para consultas perdidas em
        favor de quem recebeu transporte.
      </p>
      <p>
        O deslocamento também tem custo próprio, independentemente de a consulta
        acontecer.{" "}
        <CiteInline id="martin-2014" />, acompanhando 17.985 adultos ao longo de
        dezoito ondas de um painel domiciliar britânico, observam melhora de
        bem-estar psicológico quando pessoas trocam o carro por deslocamento
        ativo — evidência longitudinal, com efeitos fixos, de que{" "}
        <Termo definicao="Aqui: o desgaste físico e mental que o deslocamento impõe, distinto do tempo gasto.">
          o modo de se deslocar
        </Termo>{" "}
        afeta a pessoa para além do tempo consumido.
      </p>
    </>
  ),

  escopo: (
    <>
      <p>
        Este estudo sustenta três afirmações e recusa uma quarta.
      </p>
      <p>
        Sustenta que <strong>o custo do deslocamento assistencial é mensurável</strong>{" "}
        com dados públicos; que <strong>sua distribuição é desigual</strong>, e
        previsivelmente desigual, conforme idade, mobilidade, renda e território;
        e que <strong>tornar esse custo visível é condição para discuti-lo</strong>.
      </p>
      <p>
        Recusa a afirmação de que a teleconsulta seja preferível à consulta
        presencial. O VIA não a faz e não pretende embasá-la. Há consulta que
        exige exame físico, há vínculo que se constrói presencialmente e há
        pessoa para quem a ida à unidade é o próprio contato social da semana. O
        que a ferramenta calcula é o custo de uma alternativa quando ela é
        clinicamente cabível — <Destaque>e quem decide isso é a clínica, não o
        cálculo</Destaque>.
      </p>
    </>
  ),

  "conta-invisivel": (
    <p>
      A afirmação de que a telemedicina evita emissões é hoje bem estabelecida. O
      que varia — e varia por mais de uma ordem de grandeza — é{" "}
      <em>quanto</em>. Essa variação não é ruído: é a informação principal.
    </p>
  ),

  evidencia: (
    <>
      <p>
        A revisão sistemática de <CiteInline id="vanderzee-2024" /> reúne a
        literatura disponível e reporta mediana de{" "}
        <strong>25,6 kg de CO₂</strong> por consulta considerando o trajeto de
        ida e volta, com intervalo interquartílico de 10,6 a 105,6
        kg<NotaRef n={3} />. A amplitude reflete distância percorrida e modal
        predominante, não divergência de método.
      </p>
      <p>
        No Brasil, <CiteInline id="gadenz-2025" /> analisaram 4.642
        teleconsultas em sessenta e sete municípios do Nordeste e encontraram
        média de <strong>5,37 kg de CO₂</strong> por encaminhamento presencial
        evitado. O valor está bem abaixo da mediana internacional, e a razão é
        instrutiva: trata-se de atenção primária em municípios próximos, não de
        referência terciária a centenas de quilômetros.
      </p>
      <Transcricao fonte="vanderzee-2024">
        A economia de emissões atribuída à telemedicina decorre quase
        integralmente do deslocamento evitado pelo paciente; a pegada do próprio
        atendimento remoto — dispositivo, rede e infraestrutura — é pequena
        diante dela, mas não é nula e deve ser contabilizada.
      </Transcricao>
      <p>
        O VIA adota essa contabilidade: subtrai do cenário remoto uma parcela
        fixa referente a dispositivo e rede, em vez de tratar a teleconsulta como
        emissão zero. Num país cuja matriz elétrica é atipicamente limpa, essa
        parcela é pequena — o que é motivo para declará-la, não para omiti-la.
      </p>
    </>
  ),

  "media-nao-basta": (
    <>
      <p>
        Um número médio de quilogramas por consulta é útil para uma política
        nacional e inútil para uma pessoa. A mesma viagem de vinte quilômetros
        de ônibus significa uma coisa para um adulto de trinta anos com carro
        disponível e outra, incomparável, para alguém de oitenta anos que anda
        com apoio e depende de acompanhante.
      </p>
      <p>
        Daí a escolha central de arquitetura: o VIA não publica médias. Ele
        calcula <Destaque>um caso concreto por vez</Destaque>, a partir de origem,
        destino, modal e perfil informados, e exibe a memória completa do
        cálculo. A média existe na literatura e está citada acima; a ferramenta
        serve ao caso particular, que é onde a decisão acontece.
      </p>
    </>
  ),

  metodo: (
    <p>
      O cálculo vive num núcleo de TypeScript puro, sem dependência de interface,
      justamente para poder ser auditado por quem não queira ler front-end. Toda
      constante declara valor, faixa de incerteza, unidade e fonte. A página de{" "}
      <Interno href="/metodologia">metodologia</Interno> é gerada desse mesmo
      catálogo: não há como o texto divergir do que o sistema calcula.
    </p>
  ),

  indices: (
    <>
      <p>
        São cinco, e cada um responde a uma pergunta diferente sobre o mesmo dia.
      </p>
      <p>
        <strong>Emissão de carbono.</strong> Distância de ida e volta
        multiplicada pelo fator do modal, dividida pela ocupação quando o veículo
        é individual. Fatores de <Cite id="defra-2024" />, ajustados onde a frota
        e a matriz brasileiras divergem da britânica, com ordens de grandeza
        conferidas contra o <Cite id="ipcc-ar6-2022" />.
      </p>
      <p>
        <strong>Tempo.</strong> Deslocamento, mais a espera que nenhum aplicativo
        de rota informa: o tempo no ponto, a procura de vaga, a espera na
        unidade. Velocidades médias e tempos de espera de{" "}
        <Cite id="antp-simob-2023" />. Na maioria dos cenários urbanos,{" "}
        <Destaque>o tempo parado supera o tempo em movimento</Destaque>.
      </p>
      <p>
        <strong>Custo financeiro.</strong> Combustível, tarifas, pedágio,
        estacionamento e, opcionalmente, a renda perdida<NotaRef n={1} />.
        Rendimento domiciliar e jornada de <Cite id="ibge-pnad-2024" />.
      </p>
      <p>
        <strong>Carga de deslocamento</strong> e <strong>impacto social</strong>,
        ambos numa escala de 0 a 100. O primeiro combina tempo, esforço,
        conforto, estacionamento e imprevisibilidade<NotaRef n={2} />; o segundo,
        idade, mobilidade, necessidade de acompanhante e renda. A direção do
        segundo apoia-se em <Cite id="who-equity-2022" />; seus pesos, não —
        e é disso que trata a seção seguinte.
      </p>
    </>
  ),

  "medida-e-escolha": (
    <>
      <p>
        Nem tudo que o VIA calcula tem o mesmo estatuto epistêmico, e tratar
        tudo como se tivesse seria o defeito mais grave que a ferramenta poderia
        ter. Um fator de emissão é uma medição publicada. Um peso de índice
        composto é <Destaque>um juízo do projeto</Destaque> sobre o que pesa numa
        viagem.
      </p>
      <p>
        A distinção não vive apenas nesta prosa: ela é aplicada no código. Todo
        parâmetro normativo carrega o identificador de fonte{" "}
        <code>via-normative-v1</code>, aparece rotulado como normativo na página
        de metodologia e acompanha cada resultado exportado. Há teste automatizado
        garantindo isso, e contornar esse teste é, na documentação interna do
        projeto, descrito como o pior defeito possível no repositório.
      </p>
      <p>
        Uma consequência visível: os índices compostos são arredondados para
        múltiplos de cinco, e não exibem faixa de incerteza. Pesos normativos não
        sustentam a resolução que “47” sugere, e um intervalo de confiança ali
        insinuaria rigor estatístico onde há julgamento documentado.{" "}
        <Destaque>A ausência é mais honesta que um intervalo inventado.</Destaque>
      </p>
    </>
  ),

  incerteza: (
    <p>
      A propagação de incerteza ocorre onde é honesta: fórmulas lineares sobre
      constantes com faixa conhecida — carbono, tempo e custo. Cada uma exibe
      faixa estimada. Onde a composição é normativa, não há propagação, pelo
      motivo exposto acima. Há ainda a incerteza da própria distância: sem chave
      de roteamento configurada, o trajeto vem de um estimador geométrico, e todo
      resultado carrega o rótulo de confiança correspondente<NotaRef n={5} />.
    </p>
  ),

  etica: (
    <p>
      Duas decisões que o código aplica e que não devem ser revertidas sem
      discussão explícita. Ambas nasceram da mesma pergunta: o que acontece se
      esta ferramenta for usada por quem tem poder de decidir pelos outros?
    </p>
  ),

  portao: (
    <>
      <p>
        Sem conexão confiável, a teleconsulta não é uma opção — é uma
        recomendação vazia. O VIA trata a ausência de internet como{" "}
        <Destaque>impedimento, não como penalidade na pontuação</Destaque>: os
        índices continuam sendo calculados, mas a economia é declarada
        hipotética e a recomendação, bloqueada.
      </p>
      <p>
        O dado brasileiro justifica o rigor. Segundo{" "}
        <CiteInline id="cetic-tic-domicilios-2024" />, a proporção de lares
        urbanos conectados passou de 13% em 2005 para 85% em 2024 — avanço
        notável, e o tipo de número que convida a declarar o problema resolvido.
        Ele não está. Entre as classes D e E o acesso domiciliar alcança 68%, e a
        distância para os 100% da classe A é apenas a parte visível.
      </p>
      <p>
        A parte que importa aparece quando se mede qualidade em vez de posse.{" "}
        <CiteInline id="nic-conectividade-2024" /> aplicam uma escala de{" "}
        <Termo definicao="Escala de nove indicadores combinando velocidade, custo, equipamento adequado e ambiente de uso.">
          conectividade significativa
        </Termo>
        <NotaRef n={4} /> e encontram, na classe A, 83% das pessoas na melhor
        faixa. Nas classes D e E,{" "}
        <Destaque>a proporção na melhor faixa é de 1%</Destaque>, com 64% na pior.
      </p>
      <p>
        Uma ferramenta que recomendasse teleconsulta com base apenas em posse de
        acesso transferiria o problema para quem menos pode absorvê-lo,{" "}
        <em>em nome da sustentabilidade</em>. É por isso que a pergunta sobre
        internet, na interface, vem desmarcada por padrão: o comportamento seguro
        é não recomendar.
      </p>
    </>
  ),

  "viagem-nao-pessoa": (
    <>
      <p>
        O índice social mede o peso que o deslocamento impõe a uma pessoa. Ele{" "}
        <Destaque>não classifica a pessoa</Destaque>, e a diferença não é retórica.
      </p>
      <p>
        Um valor alto é argumento para <em>remover a viagem</em> — teleconsulta,
        transporte assistido, atendimento domiciliar, unidade mais próxima.
        Jamais para restringir acesso, priorizar quem “dá menos trabalho” ou
        ordenar fila. O enquadramento acompanha cada resposta da interface e da
        API, em campo próprio, porque uma ressalva que só existe na documentação
        é uma ressalva que ninguém lê.
      </p>
      <p>
        A formulação também governa os nomes das variáveis no código-fonte.
        Parece detalhe; não é. O vocabulário de um sistema é o que sobrevive à
        rotatividade de quem o mantém.
      </p>
    </>
  ),

  limitacoes: (
    <>
      <p>
        A limitação mais importante é a que a ferramenta não consegue enxergar:{" "}
        <Destaque>o VIA calcula a viagem que acontece, não a consulta que deixou
        de acontecer</Destaque>. A literatura reunida em{" "}
        <Secao para="problema">1.1</Secao> sugere que esse efeito — a falta
        provocada pela barreira de transporte — é provavelmente o de maior
        impacto sanitário. Ele está fora do escopo do cálculo, e nenhuma soma dos
        cinco índices o alcança.
      </p>
      <p>
        As demais, em ordem de gravidade. Os pesos dos índices compostos são
        normativos e não foram validados em campo. O estimador de rota é
        geométrico quando não há chave de roteamento, com erro relevante em
        geografias acidentadas<NotaRef n={5} />. Nenhum provedor de rota
        disponível modela transporte público com dados de linha, de modo que
        ônibus e metrô herdam o traçado rodoviário ajustado. As tarifas
        consideradas são cheias, ignorando gratuidade para pessoas idosas e
        integração tarifária. E o preço de combustível varia por estado muito
        além da faixa nacional adotada.
      </p>
      <p>
        Uma limitação de segunda ordem, mas que convém declarar: esta
        bibliografia é curta para um documento deste tipo. É curta por escolha —
        cada entrada foi verificada no documento original, e nenhuma foi incluída
        por parecer plausível.
      </p>
    </>
  ),

  consideracoes: (
    <>
      <p>
        O custo do deslocamento assistencial é mensurável, desigual e invisível.
        As três propriedades juntas explicam por que ele raramente entra na
        decisão: não se discute o que não se vê, e o que não se discute continua
        recaindo sobre quem já carrega mais.
      </p>
      <p>
        O VIA não resolve isso. Ele torna a conta visível para um caso concreto,
        mostra de onde veio cada número e declara o que é escolha sua. É pouco, e
        é a condição para o resto. A{" "}
        <Interno href="/calculadora">calculadora simplificada</Interno> existe
        para que essa conta caiba em trinta segundos; o{" "}
        <Interno href="/">percurso completo</Interno>, para quem quiser entender
        cada etapa antes de informá-la.
      </p>
      <p>
        O caminho para substituir <code>via-normative-v1</code> por parâmetros
        medidos passa por pesquisa de campo que este projeto não tem condições de
        conduzir sozinho. Referências, críticas e correções são bem-vindas no{" "}
        <Externo href="https://github.com/pedrobritx/via">repositório</Externo>.
      </p>
    </>
  ),
};
