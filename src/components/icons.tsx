/**
 * Ícones do sistema.
 *
 * Traço, não preenchimento; `currentColor`, não cor fixa; 1,5 px numa grade de
 * 24. Isso faz cada ícone herdar a cor do texto ao lado e envelhecer junto com
 * a paleta em vez de virar uma exceção a manter.
 *
 * São SVG inline e não emoji — a distinção importa e está no
 * [ADR 0004](../../docs/adr/0004-interface-editorial-em-percurso-guiado.md).
 * Emoji muda de desenho entre plataformas, depende da fonte do sistema e é
 * anunciado em voz alta com um nome que ninguém escolheu. Um `<svg>` com
 * `aria-hidden` é decoração silenciosa e idêntica em todo lugar.
 *
 * Todos são decorativos por padrão: o rótulo vem do texto que acompanha. Se um
 * dia um ícone aparecer sozinho carregando significado, ele precisa de
 * `role="img"` e `<title>` — e aí deixa de ser caso para este arquivo.
 */

type IconProps = {
  className?: string;
  /** Tamanho em pixels. Padrão 20. */
  size?: number;
};

function Svg({
  children,
  className,
  size = 20,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Folha — pegada de carbono. */
export function LeafIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20c0-8 5-13 16-14 0 10-5 15-13 15H4z" />
      <path d="M4 20c3-5 7-8 12-9.5" />
    </Svg>
  );
}

/** Relógio — tempo total. */
export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

/** Moeda — custo. */
export function CoinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.5 9.8c0-1-1.1-1.6-2.5-1.6s-2.5.6-2.5 1.6 1 1.4 2.5 1.7 2.7.7 2.7 1.8-1.2 1.7-2.7 1.7-2.7-.6-2.7-1.7" />
    </Svg>
  );
}

/** Trajeto sinuoso entre dois pontos — carga de deslocamento. */
export function RouteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="18.5" r="2.5" />
      <circle cx="18" cy="5.5" r="2.5" />
      <path d="M8.5 18.5h5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h5" />
    </Svg>
  );
}

/** Duas pessoas — impacto social. */
export function PeopleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.9c2 .6 3.5 2.4 3.5 4.6" />
    </Svg>
  );
}

/** Broto em duas folhas — a proposta ecológica, usada com parcimônia. */
export function SproutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21v-8" />
      <path d="M12 13C12 9.5 9.5 7 6 7c0 3.5 2.5 6 6 6z" />
      <path d="M12 13c0-3 2-5.5 5.5-5.5C17.5 10.5 15 13 12 13z" />
    </Svg>
  );
}

/** Sinal de conexão — o portão da teleconsulta. */
export function SignalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 18.5h.01" />
      <path d="M8.8 15.3a4.5 4.5 0 0 1 6.4 0" />
      <path d="M5.6 12.1a9 9 0 0 1 12.8 0" />
      <path d="M2.5 9a13.5 13.5 0 0 1 19 0" />
    </Svg>
  );
}

/** Livro aberto — o estudo. */
export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6.5C10.5 5.2 8.5 4.5 6 4.5H3v14h3c2.5 0 4.5.7 6 2 1.5-1.3 3.5-2 6-2h3v-14h-3c-2.5 0-4.5.7-6 2z" />
      <path d="M12 6.5v14" />
    </Svg>
  );
}

/** Régua e lápis — a calculadora simplificada. */
export function GaugeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 17a9 9 0 1 1 17 0" />
      <path d="M12 17l4-5.5" />
      <path d="M3.5 17h17" />
    </Svg>
  );
}

/** Seta para a direita — chamadas de ação. */
export function ArrowIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="M13.5 6.5 19.5 12l-6 5.5" />
    </Svg>
  );
}
