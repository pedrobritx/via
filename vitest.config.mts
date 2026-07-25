import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // O núcleo de cálculo (src/domain) é TypeScript puro, sem React e sem DOM.
    // Rodar em ambiente node mantém a suíte rápida e prova que o domínio não
    // depende do navegador — requisito para portá-lo à API pública depois.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
