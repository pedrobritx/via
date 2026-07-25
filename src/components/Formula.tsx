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
    // `throwOnError: true` de propósito. Com `false`, o KaTeX engole o erro e
    // devolve um `<span class="katex-error">` com o TeX cru em vermelho — o
    // `catch` abaixo nunca disparava, e uma fórmula quebrada passava como se
    // fosse decisão de estilo. Foi assim que a fórmula do custo ficou sem
    // renderizar sem ninguém notar. Falhar aqui é o que aciona a alternativa.
    html = katex.renderToString(tex, {
      throwOnError: true,
      displayMode: true,
      output: "html",
    });
  } catch {
    // Se o KaTeX falhar, mostrar o TeX cru é melhor que sumir com a fórmula.
    return (
      <pre className="numeric overflow-x-auto border border-line bg-shadow px-4 py-3 text-xs">
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
