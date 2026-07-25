import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Newsreader } from "next/font/google";

import "katex/dist/katex.min.css";
import "./globals.css";

/*
  As três famílias do sistema editorial, cada uma com um trabalho:
  Fraunces exibe, Newsreader é lida, JetBrains Mono rotula.

  Carregadas por `next/font`, que baixa no build e auto-hospeda. Isso troca uma
  requisição de rede no build por zero requisição a terceiros no navegador de
  quem usa — e num app que lida com endereço residencial e condição de saúde,
  não avisar o Google a cada visita é a escolha certa.
*/
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VIA — Visualizador de Impacto Assistencial",
  description:
    "Compara o custo total de uma consulta presencial com o de uma teleconsulta: " +
    "emissões, tempo, dinheiro, carga de deslocamento e impacto social. " +
    "Todas as fórmulas e fontes são abertas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${newsreader.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
