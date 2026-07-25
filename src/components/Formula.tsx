import katex from "katex";

/**
 * Renderiza uma fórmula em LaTeX.
 *
 * `dangerouslySetInnerHTML` aqui é seguro por construção: o TeX vem sempre de
 * uma constante literal do nosso próprio domínio (`IndexBreakdown.formulaTex`),
 * nunca de entrada de usuário. Se um dia uma fórmula puder ser fornecida de
 * fora, este componente precisa mudar antes.
 */
export function Formula({ tex }: { tex: string }) {
  let html: string;
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: true,
      output: "html",
    });
  } catch {
    // Se o KaTeX falhar, mostrar o TeX cru é melhor que sumir com a fórmula.
    return (
      <pre className="overflow-x-auto rounded bg-sunken px-3 py-2 font-mono text-xs">
        {tex}
      </pre>
    );
  }

  return (
    <div
      className="overflow-x-auto py-1 text-[0.95rem]"
      // O conteúdo é gerado pelo KaTeX a partir de TeX literal nosso.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
