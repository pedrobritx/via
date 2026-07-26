"use client";

/**
 * Primitivas do sistema visual editorial.
 *
 * São de apresentação e de controle — nada aqui sabe o que é uma consulta, um
 * modal de transporte ou um índice. O domínio continua do outro lado da
 * fronteira, e estas peças poderiam vestir outro produto sem alteração.
 *
 * Duas regras que atravessam o arquivo:
 *
 * 1. Todo controle é um elemento nativo por dentro. Slider é
 *    `<input type="range">`, escolha exclusiva é `<input type="radio">`. O
 *    comportamento de teclado e o anúncio por leitor de tela vêm do navegador,
 *    que faz isso melhor do que qualquer reimplementação em `<div>`.
 * 2. Nenhum texto visível nasce aqui. Tudo chega por prop, vindo do catálogo.
 */

import { useEffect, useId, useRef, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Tipografia e ornamento
// ---------------------------------------------------------------------------

export function Eyebrow({
  children,
  plain = false,
}: {
  children: ReactNode;
  plain?: boolean;
}) {
  return <p className={plain ? "eyebrow-plain" : "eyebrow"}>{children}</p>;
}

/** Descanso entre blocos maiores. Uma ou duas vezes por página, não mais. */
export function Ornament() {
  return (
    <p className="ornament" aria-hidden="true">
      ❦ ❦ ❦
    </p>
  );
}

/**
 * Título com ênfase itálica.
 *
 * A ênfase cobre UMA ideia por título — a que carrega o peso conceitual da
 * frase. Por isso o texto chega partido em duas props em vez de vir com
 * marcação embutida: quem escreve a tradução escolhe onde a ênfase cai, e não
 * consegue esquecer de fechar uma tag.
 */
export function EmphasisTitle({
  before,
  emphasis,
  level = 2,
  className = "section-title",
  id,
}: {
  before: string;
  emphasis: string;
  level?: 1 | 2 | 3;
  className?: string;
  id?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return (
    <Tag id={id} className={className}>
      {before} <em>{emphasis}</em>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Revelação ao rolar
// ---------------------------------------------------------------------------

/**
 * Faz o bloco surgir quando entra na tela.
 *
 * O estado inicial invisível é aplicado por JavaScript, nunca pela folha de
 * estilo. Sem script, com script quebrado ou com o observador indisponível, o
 * conteúdo simplesmente aparece — o pior desfecho possível de um efeito
 * decorativo seria uma página em branco.
 *
 * O que já está visível no primeiro quadro não anima: piscar conteúdo que a
 * pessoa acabou de ver seria movimento sem função.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      node.dataset.reveal = "shown";
      return;
    }

    node.dataset.reveal = "pending";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "shown";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.04 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cabeçalho de seção numerada
// ---------------------------------------------------------------------------

/**
 * O numeral itálico serifado ao lado do título é o marcador do sistema.
 *
 * `status` é texto, não cor nem ícone: quem chega ao passo precisa saber se
 * ele está concluído mesmo sem enxergar a diferença entre dois tons de verde.
 */
export function SectionHeader({
  num,
  eyebrow,
  titleBefore,
  titleEmphasis,
  lede,
  status,
  titleId,
}: {
  num: string;
  eyebrow: string;
  titleBefore: string;
  titleEmphasis: string;
  lede?: string;
  status?: string;
  titleId?: string;
}) {
  return (
    <header className="mb-10">
      <div className="flex items-start gap-5 sm:gap-7">
        <span className="section-num shrink-0" aria-hidden="true">
          {num}
        </span>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Eyebrow>{eyebrow}</Eyebrow>
            {status ? (
              <span className="mono-label text-green">{status}</span>
            ) : null}
          </div>

          <EmphasisTitle
            id={titleId}
            before={titleBefore}
            emphasis={titleEmphasis}
            className="section-title mt-4"
          />
        </div>
      </div>

      {lede ? <p className="lede mt-6 sm:ml-[calc(3rem+1.75rem)]">{lede}</p> : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Controles
// ---------------------------------------------------------------------------

/**
 * Slider com o valor lido ao lado.
 *
 * O valor aparece como texto formatado, não só como posição do cursor: uma
 * bolinha a 62% de uma trilha não informa "68 anos" para ninguém.
 */
export function Slider({
  label,
  help,
  value,
  min,
  max,
  step = 1,
  display,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Valor já formatado para leitura, com unidade. */
  display: string;
  /** Rótulos acessíveis dos botões. Chegam prontos do catálogo. */
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="subsection-title">
          {label}
        </label>
        <output htmlFor={id} className="numeric text-lg text-green-deep">
          {display}
        </output>
      </div>

      {/*
        Os botões existem porque arrastar é a interação mais difícil de acertar
        que a web tem: exige mira, mão firme e uma tela grande. Quem quer somar
        um ano à idade não deveria precisar de nada disso. A trilha continua
        ali para quem prefere varrer a faixa inteira de uma vez.
      */}
      <div className="flex items-center gap-3">
        <StepButton
          label={decreaseLabel}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </StepButton>

        <input
          id={id}
          type="range"
          className="slider flex-1"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={help ? helpId : undefined}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        <StepButton
          label={increaseLabel}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </StepButton>
      </div>

      <div className="mono-label flex justify-between px-11" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {help ? (
        <p id={helpId} className="mt-1 text-sm text-mute">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="step-btn"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Escolha exclusiva entre opções visíveis.
 *
 * `name` precisa ser único na página inteira; recebe o `useId` embutido para
 * que dois grupos nunca disputem os mesmos rádios.
 */
export function RadioChips<T extends string>({
  legend,
  help,
  value,
  options,
  onChange,
}: {
  legend: string;
  help?: string;
  value: T;
  options: ReadonlyArray<ChipOption<T>>;
  onChange: (value: T) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;

  return (
    <fieldset>
      <legend className="subsection-title mb-3">{legend}</legend>

      <div
        className="flex flex-wrap gap-2"
        aria-describedby={help ? helpId : undefined}
      >
        {options.map((option) => (
          <label key={option.value} className="chip">
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>

      {help ? (
        <p id={helpId} className="mt-3 text-sm text-mute">
          {help}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Campo de texto com linha inferior, no lugar da caixa. */
export function TextField({
  label,
  help,
  placeholder,
  value,
  prefix,
  suffix,
  inputMode = "text",
  onChange,
}: {
  label: string;
  help?: string;
  placeholder?: string;
  value: string;
  prefix?: string;
  suffix?: string;
  inputMode?: "decimal" | "numeric" | "text";
  onChange: (value: string) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="mono-label">
        {label}
        {suffix ? <span className="normal-case"> ({suffix})</span> : null}
      </label>

      <div className="field-shell flex items-baseline gap-2">
        {prefix ? (
          <span aria-hidden="true" className="numeric text-sm text-mute">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          className="field"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          aria-describedby={help ? helpId : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {help ? (
        <p id={helpId} className="mt-1 text-sm text-mute">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function Toggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="checkbox mt-1"
          checked={checked}
          aria-describedby={help ? helpId : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={id} className="subsection-title cursor-pointer">
          {label}
        </label>
      </div>

      {help ? (
        <p id={helpId} className="ml-[1.85rem] text-sm text-mute">
          {help}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------

export function Note({
  title,
  children,
  tone = "quiet",
}: {
  title?: string;
  children: ReactNode;
  tone?: "quiet" | "warn";
}) {
  const warn = tone === "warn";
  return (
    <div
      role="note"
      className={
        warn
          ? "border-l-2 border-warn-line bg-warn-bg px-5 py-4 text-sm text-warn-ink"
          : "border-l-2 border-line bg-deep px-5 py-4 text-sm text-soft"
      }
    >
      {title ? (
        <strong className="mono-label mb-1.5 block text-current">{title}</strong>
      ) : null}
      {children}
    </div>
  );
}
