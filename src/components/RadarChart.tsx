"use client";

/**
 * Radar dos componentes da carga de deslocamento.
 *
 * SVG à mão, sem biblioteca. São cerca de setenta linhas contra os ~200 kB de
 * uma Chart.js, e o resultado é acessível por construção: o gráfico tem
 * `<title>`/`<desc>`, e a tabela de dados equivalente fica visível em Modo
 * Cientista, não escondida atrás de um `aria-label` que ninguém lê.
 */

import { useId } from "react";

interface RadarAxis {
  label: string;
  /** 0–100. */
  value: number;
}

interface RadarChartProps {
  axes: RadarAxis[];
  title: string;
  description: string;
  color?: string;
  size?: number;
}

export function RadarChart({
  axes,
  title,
  description,
  color = "var(--burden)",
  size = 260,
}: RadarChartProps) {
  // Dois radares convivem na mesma página (carga e social). Identificador fixo
  // duplicaria o `id` e faria `aria-labelledby` apontar para o gráfico errado.
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  if (axes.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46;
  const rings = [25, 50, 75, 100];

  const pointAt = (index: number, value: number) => {
    // Começa no topo e gira no sentido horário.
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const polygon = axes
    .map((axis, i) => pointAt(i, axis.value).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="mx-auto h-auto w-full max-w-[300px]"
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{description}</desc>

      {/* Anéis de referência */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes
            .map((_, i) => pointAt(i, ring).join(","))
            .join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}

      {/* Eixos */}
      {axes.map((axis, i) => {
        const [x, y] = pointAt(i, 100);
        return (
          <line
            key={axis.label}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth="1"
          />
        );
      })}

      {/* Área do valor */}
      <polygon
        points={polygon}
        fill={color}
        fillOpacity="0.22"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {axes.map((axis, i) => {
        const [x, y] = pointAt(i, axis.value);
        return <circle key={axis.label} cx={x} cy={y} r="3.5" fill={color} />;
      })}

      {/* Rótulos */}
      {axes.map((axis, i) => {
        const [x, y] = pointAt(i, 122);
        const anchor =
          Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end";
        return (
          <text
            key={axis.label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="var(--ink-mute)"
            fontSize="11"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
