import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

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
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
