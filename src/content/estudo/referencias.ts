/**
 * Bibliografia do estudo.
 *
 * **Toda entrada aqui foi verificada individualmente**: o documento foi
 * acessado, e autoria, periódico, volume, ano e DOI vieram da própria página do
 * artigo — não de memória, não de busca. Isso não é zelo excessivo; é a segunda
 * das cinco proibições do projeto, e a que mais barato sai violar: uma
 * referência plausível e falsa sobrevive à revisão justamente porque parece uma
 * referência, e contamina tudo que se apoia nela.
 *
 * Consequência prática: esta lista é mais curta do que um estudo do gênero
 * costuma exibir. É o tamanho que dá para sustentar.
 *
 * As entradas cujo `id` começa com `via-` remetem ao catálogo de constantes em
 * `src/domain/parameters.ts`, e existem para que o leitor do estudo chegue à
 * fonte de cada número sem sair para o código.
 */

import type { Referencia } from "./tipos";

export const REFERENCIAS: Referencia[] = [
  // --- Telemedicina e emissões evitadas ------------------------------------
  {
    id: "gadenz-2025",
    chamada: "Gadenz et al., 2025",
    autoria:
      "GADENZ, S. D.; SPERLING, S.; MORAES, L. B.; BEZERRA, V. R.; MOTTER, F. R.",
    titulo:
      "Impact of telemedicine on reducing travel-related CO2 emissions in chronic disease care: a cross-sectional study in Northeast Brazil",
    veiculo: "BMJ Open",
    detalhes: "v. 15, n. 10, e092424",
    ano: "2025",
    doi: "10.1136/bmjopen-2024-092424",
    url: "https://doi.org/10.1136/bmjopen-2024-092424",
    acesso: "26 jul. 2026",
    tipo: "artigo",
    papel:
      "Estudo brasileiro, em 67 municípios do Nordeste, com a medida per capita que o VIA reproduz.",
  },
  {
    id: "vanderzee-2024",
    chamada: "van der Zee et al., 2024",
    autoria:
      "VAN DER ZEE, C.; CHANG-WOLF, J.; KOOPMANSCHAP, M. A.; VAN LEEUWEN, R.; WISSE, R. P. L.",
    titulo: "Assessing the carbon footprint of telemedicine: a systematic review",
    veiculo: "Health Services Insights",
    detalhes: "v. 17",
    ano: "2024",
    doi: "10.1177/11786329241271562",
    url: "https://doi.org/10.1177/11786329241271562",
    acesso: "26 jul. 2026",
    tipo: "artigo",
    papel:
      "Revisão de 33 estudos; dá a faixa em que um resultado do VIA deve cair para ser plausível.",
  },

  // --- Barreira de transporte e acesso -------------------------------------
  {
    id: "syed-2013",
    chamada: "Syed, Gerber e Sharp, 2013",
    autoria: "SYED, S. T.; GERBER, B. S.; SHARP, L. K.",
    titulo: "Traveling towards disease: transportation barriers to health care access",
    veiculo: "Journal of Community Health",
    detalhes: "v. 38, n. 5, p. 976-993",
    ano: "2013",
    doi: "10.1007/s10900-013-9681-1",
    url: "https://doi.org/10.1007/s10900-013-9681-1",
    acesso: "26 jul. 2026",
    tipo: "artigo",
    papel:
      "Revisão de 61 estudos ligando barreira de transporte a consulta remarcada, perdida e adiada.",
  },
  {
    id: "shekelle-2022",
    chamada: "Shekelle et al., 2022",
    autoria:
      "SHEKELLE, P. G.; BEGASHAW, M. M.; MIAKE-LYE, I. M.; BOOTH, M.; MYERS, B.; RENDA, A.",
    titulo:
      "Effect of interventions for non-emergent medical transportation: a systematic review and meta-analysis",
    veiculo: "BMC Public Health",
    detalhes: "v. 22, art. 799",
    ano: "2022",
    doi: "10.1186/s12889-022-13149-1",
    url: "https://doi.org/10.1186/s12889-022-13149-1",
    acesso: "26 jul. 2026",
    tipo: "artigo",
    papel:
      "Metanálise: remover a barreira de transporte reduz a falta à consulta (OR 0,63).",
  },

  // --- Deslocamento e bem-estar --------------------------------------------
  {
    id: "martin-2014",
    chamada: "Martin, Goryakin e Suhrcke, 2014",
    autoria: "MARTIN, A.; GORYAKIN, Y.; SUHRCKE, M.",
    titulo:
      "Does active commuting improve psychological wellbeing? Longitudinal evidence from eighteen waves of the British Household Panel Survey",
    veiculo: "Preventive Medicine",
    detalhes: "v. 69, p. 296-303",
    ano: "2014",
    doi: "10.1016/j.ypmed.2014.08.023",
    url: "https://doi.org/10.1016/j.ypmed.2014.08.023",
    acesso: "26 jul. 2026",
    tipo: "artigo",
    papel:
      "Painel de 17.985 pessoas em 18 ondas: sustenta a direção do componente de esforço, não seus pesos.",
  },

  // --- Exclusão digital -----------------------------------------------------
  {
    id: "nic-conectividade-2024",
    chamada: "NIC.br, 2024a",
    autoria: "NÚCLEO DE INFORMAÇÃO E COORDENAÇÃO DO PONTO BR",
    titulo:
      "Conectividade significativa: propostas para medição e o retrato da população no Brasil",
    veiculo: "NIC.br",
    local: "São Paulo",
    ano: "2024",
    url: "https://cgi.br/noticia/releases/perto-da-universalizacao-do-acesso-a-internet-brasil-ainda-tem-maioria-da-populacao-com-baixa-conectividade-significativa-revela-novo-estudo/",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel:
      "Mede qualidade de conexão, não posse. É o dado que sustenta tratar internet como portão.",
  },
  {
    id: "cetic-tic-domicilios-2024",
    chamada: "CETIC.br, 2024b",
    autoria: "CENTRO REGIONAL DE ESTUDOS PARA O DESENVOLVIMENTO DA SOCIEDADE DA INFORMAÇÃO",
    titulo: "TIC Domicílios 2024: pesquisa sobre o uso das tecnologias de informação e comunicação nos domicílios brasileiros",
    veiculo: "NIC.br",
    local: "São Paulo",
    ano: "2024",
    url: "https://cetic.br/pt/noticia/em-duas-decadas-proporcao-de-lares-urbanos-brasileiros-com-internet-passou-de-13-para-85-aponta-tic-domicilios-2024/",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel: "Acesso domiciliar por classe social: 100% na classe A, 68% nas classes DE.",
  },

  // --- Fontes das constantes ------------------------------------------------
  {
    id: "who-equity-2022",
    chamada: "Organização Mundial da Saúde, 2022",
    autoria: "ORGANIZAÇÃO MUNDIAL DA SAÚDE",
    titulo: "Global report on health equity for persons with disabilities",
    veiculo: "OMS",
    local: "Genebra",
    ano: "2022",
    url: "https://www.who.int/publications/i/item/9789240063600",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel:
      "Sustenta a direção do índice social: a barreira pesa mais sobre quem já tem menos mobilidade.",
  },
  {
    id: "antp-simob-2023",
    chamada: "ANTP, 2023",
    autoria: "ASSOCIAÇÃO NACIONAL DE TRANSPORTES PÚBLICOS",
    titulo: "Sistema de informações da mobilidade urbana: relatório geral",
    veiculo: "ANTP",
    local: "São Paulo",
    ano: "2023",
    url: "https://www.antp.org.br/simob.html",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel: "Velocidades médias, tarifas e tempos de espera das capitais brasileiras.",
  },
  {
    id: "defra-2024",
    chamada: "DESNZ, 2024",
    autoria: "UNITED KINGDOM. Department for Energy Security and Net Zero",
    titulo: "Greenhouse gas reporting: conversion factors 2024",
    veiculo: "DESNZ",
    local: "Londres",
    ano: "2024",
    url: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel: "Fatores de emissão por modal, ajustados onde a frota brasileira diverge.",
  },
  {
    id: "ipcc-ar6-2022",
    chamada: "IPCC, 2022",
    autoria: "INTERGOVERNMENTAL PANEL ON CLIMATE CHANGE",
    titulo:
      "Climate change 2022: mitigation of climate change. Contribution of Working Group III to the Sixth Assessment Report",
    veiculo: "Cambridge University Press",
    local: "Cambridge",
    ano: "2022",
    doi: "10.1017/9781009157926",
    url: "https://www.ipcc.ch/report/ar6/wg3/",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel: "Ordens de grandeza por modal e contabilidade do CO₂ biogênico.",
  },
  {
    id: "ibge-pnad-2024",
    chamada: "IBGE, 2024",
    autoria: "INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA",
    titulo: "Pesquisa nacional por amostra de domicílios contínua",
    veiculo: "IBGE",
    local: "Rio de Janeiro",
    ano: "2024",
    url: "https://www.ibge.gov.br/estatisticas/sociais/trabalho/17270-pnad-continua.html",
    acesso: "26 jul. 2026",
    tipo: "relatorio",
    papel: "Rendimento domiciliar e jornada, usados na conversão de tempo em dinheiro.",
  },
];

/** Índice por `id`, para a citação encontrar sua entrada em tempo de render. */
export const REFERENCIAS_POR_ID: Record<string, Referencia> = Object.fromEntries(
  REFERENCIAS.map((r) => [r.id, r]),
);
