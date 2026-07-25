export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        VIA — Visualizador de Impacto Assistencial
      </h1>
      <p className="text-muted">
        Compara o custo total de uma consulta presencial com o de uma
        teleconsulta: emissões, tempo, dinheiro, carga de deslocamento e impacto
        social.
      </p>
      <p className="text-sm text-muted">
        A interface de cálculo entra nos próximos commits. O núcleo de
        metodologia vive em <code className="font-mono">src/domain/</code>.
      </p>
    </main>
  );
}
