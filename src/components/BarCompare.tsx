/**
 * Barras comparativas: presencial contra teleconsulta, um índice por linha.
 *
 * Cada linha é normalizada pelo maior dos dois valores, porque as unidades não
 * são comparáveis entre si — comparar 9,6 kg com 112 minutos numa mesma escala
 * não significaria nada. O que a barra mostra é a proporção entre os dois
 * cenários daquele índice, e o número exato aparece ao lado, sempre.
 */

interface BarRow {
  key: string;
  label: string;
  inPerson: number;
  remote: number;
  /** Já formatados para leitura. */
  inPersonText: string;
  remoteText: string;
  color: string;
}

interface BarCompareProps {
  rows: BarRow[];
  inPersonLabel: string;
  remoteLabel: string;
}

export function BarCompare({
  rows,
  inPersonLabel,
  remoteLabel,
}: BarCompareProps) {
  return (
    <div className="flex flex-col gap-8">
      <Legend inPersonLabel={inPersonLabel} remoteLabel={remoteLabel} />

      {rows.map((row) => {
        const max = Math.max(row.inPerson, row.remote, Number.EPSILON);
        const inPersonPct = (row.inPerson / max) * 100;
        const remotePct = (row.remote / max) * 100;

        return (
          <div key={row.key} className="flex flex-col gap-2">
            <h4 className="subsection-title">{row.label}</h4>

            <Bar
              scenario={inPersonLabel}
              percent={inPersonPct}
              text={row.inPersonText}
              color={row.color}
              solid
            />
            <Bar
              scenario={remoteLabel}
              percent={remotePct}
              text={row.remoteText}
              color={row.color}
            />
          </div>
        );
      })}
    </div>
  );
}

function Bar({
  scenario,
  percent,
  text,
  color,
  solid = false,
}: {
  scenario: string;
  percent: number;
  text: string;
  color: string;
  solid?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="mono-label w-24 shrink-0">{scenario}</span>
      <div className="h-5 flex-1 overflow-hidden bg-shadow">
        <div
          className="h-full"
          style={{
            width: `${Math.max(percent, 0.8)}%`,
            backgroundColor: color,
            // A barra do cenário remoto é listrada além de mais clara: quem não
            // distingue as cores ainda diferencia as duas pela textura.
            opacity: solid ? 1 : 0.45,
            backgroundImage: solid
              ? undefined
              : "repeating-linear-gradient(45deg, rgba(255,255,255,.55) 0 4px, transparent 4px 8px)",
          }}
        />
      </div>
      <span className="numeric w-28 shrink-0 text-right text-sm text-ink">
        {text}
      </span>
    </div>
  );
}

function Legend({
  inPersonLabel,
  remoteLabel,
}: {
  inPersonLabel: string;
  remoteLabel: string;
}) {
  return (
    <div className="mono-label flex flex-wrap items-center gap-5">
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-3 w-6 bg-ink" />
        {inPersonLabel}
      </span>
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-6 bg-ink opacity-45"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,.55) 0 4px, transparent 4px 8px)",
          }}
        />
        {remoteLabel}
      </span>
    </div>
  );
}
