"use client";

/**
 * A calculadora enxuta.
 *
 * O percurso guiado da página inicial ensina; esta calcula. São públicos
 * diferentes: quem já entendeu o método e volta uma segunda vez não deveria
 * precisar rolar quatro seções didáticas para trocar um CEP.
 *
 * O que ela não faz é esconder o método — apenas o move para onde não atrapalha.
 * As explicações vivem em `<details>` nativos abaixo do formulário: fechados por
 * padrão, abertos por quem quiser, funcionando sem JavaScript e navegáveis por
 * teclado sem uma linha de código nossa.
 */

import { useMemo, useState } from "react";

import type { ImpactResult, Place, TransportModal } from "@/domain/types";
import { TRANSPORT_MODALS } from "@/domain/types";
import {
  createTranslator,
  formatCurrency,
  formatDuration,
  formatMass,
  type Locale,
  type MessageKey,
} from "@/i18n";

import { Note, RadioChips, Slider } from "./editorial";
import { ClockIcon, CoinIcon, LeafIcon } from "./icons";
import { PlaceSearch } from "./PlaceSearch";

const MODAL_KEYS: Record<TransportModal, MessageKey> = {
  car_gasoline: "form.modal.car_gasoline",
  car_ethanol: "form.modal.car_ethanol",
  motorcycle: "form.modal.motorcycle",
  bus_urban: "form.modal.bus_urban",
  metro_rail: "form.modal.metro_rail",
  taxi_rideshare: "form.modal.taxi_rideshare",
  bicycle: "form.modal.bicycle",
  walking: "form.modal.walking",
};

const EXPLICACOES: Array<{ q: MessageKey; a: MessageKey }> = [
  { q: "calc.how.q1", a: "calc.how.a1" },
  { q: "calc.how.q2", a: "calc.how.a2" },
  { q: "calc.how.q3", a: "calc.how.a3" },
  { q: "calc.how.q4", a: "calc.how.a4" },
  { q: "calc.how.q5", a: "calc.how.a5" },
];

export function SimpleCalculator({ locale = "pt-BR" }: { locale?: Locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);

  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [modal, setModal] = useState<TransportModal>("car_gasoline");
  const [age, setAge] = useState(40);
  const [hasInternet, setHasInternet] = useState(false);

  const [result, setResult] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pronto = origin !== null && destination !== null;

  async function calcular() {
    if (!pronto) return;
    setLoading(true);
    setError(null);

    try {
      const resposta = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          modal,
          profile: {
            age,
            mobility: "none",
            requiresCompanion: false,
            hasReliableInternet: hasInternet,
            // Sem renda declarada não há parcela de produtividade, e o custo
            // se apresenta como parcial. É o padrão honesto para um formulário
            // que não pergunta renda.
            countProductivityLoss: false,
          },
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        setError((dados.error as string) ?? t("form.error.network"));
        setResult(null);
        return;
      }
      setResult(dados as ImpactResult);
    } catch {
      setError(t("form.error.network"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <form
        className="flex flex-col gap-10"
        onSubmit={(e) => {
          e.preventDefault();
          void calcular();
        }}
      >
        <div className="grid gap-8 sm:grid-cols-2">
          <PlaceSearch
            labelKey="form.origin.label"
            placeholderKey="form.origin.placeholder"
            helpKey="form.origin.help"
            value={origin}
            onChange={setOrigin}
            t={t}
            required
          />
          <PlaceSearch
            labelKey="form.destination.label"
            placeholderKey="form.destination.placeholder"
            value={destination}
            onChange={setDestination}
            t={t}
            required
          />
        </div>

        <RadioChips
          legend={t("step.modal.pickLabel")}
          value={modal}
          options={TRANSPORT_MODALS.map((m) => ({
            value: m,
            label: t(MODAL_KEYS[m]),
          }))}
          onChange={setModal}
        />

        <Slider
          label={t("form.age.label")}
          value={age}
          min={0}
          max={110}
          display={`${age} ${t("control.years")}`}
          decreaseLabel={`${t("control.decrease")} — ${t("form.age.label")}`}
          increaseLabel={`${t("control.increase")} — ${t("form.age.label")}`}
          onChange={setAge}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <input
              id="calc-internet"
              type="checkbox"
              className="checkbox mt-1"
              checked={hasInternet}
              aria-describedby="calc-internet-help"
              onChange={(e) => setHasInternet(e.target.checked)}
            />
            <label htmlFor="calc-internet" className="subsection-title cursor-pointer">
              {t("form.internet.label")}
            </label>
          </div>
          <p id="calc-internet-help" className="ml-[1.85rem] text-sm text-mute">
            {t("form.internet.help")}
          </p>
        </div>

        {error ? (
          <div role="alert">
            <Note tone="warn" title={t("form.error.title")}>
              {error}
            </Note>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-5">
          <button type="submit" className="btn" disabled={!pronto || loading}>
            {loading ? t("form.calculating") : t("calc.submit")}
          </button>
          {!pronto ? (
            <p className="text-sm text-mute">{t("calc.empty")}</p>
          ) : null}
        </div>
      </form>

      {/* aria-live: o resultado chega sem recarregar a página, e quem usa
          leitor de tela precisa saber disso. */}
      <div aria-live="polite" aria-busy={loading}>
        {result ? <Resultado result={result} locale={locale} t={t} /> : null}
      </div>

      <section aria-labelledby="como-funciona" className="border-t border-line pt-10">
        <h2 id="como-funciona" className="section-title mb-8">
          {t("calc.how.title.before")} <em>{t("calc.how.title.emphasis")}</em>
        </h2>

        <div className="flex flex-col">
          {EXPLICACOES.map((item) => (
            <details key={item.q} className="border-b border-line py-4">
              <summary className="subsection-title cursor-pointer list-none">
                {t(item.q)}
              </summary>
              <p className="mt-3 max-w-2xl text-soft">{t(item.a)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Resultado({
  result,
  locale,
  t,
}: {
  result: ImpactResult;
  locale: Locale;
  t: ReturnType<typeof createTranslator>;
}) {
  const itens = [
    {
      key: "time",
      Icone: ClockIcon,
      cor: "var(--time)",
      valor: formatDuration(result.savings.timeMin, locale),
      rotulo: t("index.time"),
    },
    {
      key: "cost",
      Icone: CoinIcon,
      cor: "var(--cost)",
      valor: formatCurrency(result.savings.costBRL, locale),
      rotulo: t("index.cost"),
    },
    {
      key: "carbon",
      Icone: LeafIcon,
      cor: "var(--carbon)",
      valor: formatMass(result.savings.carbonKg, locale),
      rotulo: t("index.carbon"),
    },
  ];

  return (
    <section aria-labelledby="calc-resultado" className="flex flex-col gap-6">
      <h2 id="calc-resultado" className="eyebrow">
        {t("calc.result.eyebrow")}
      </h2>

      <dl className="grid gap-6 sm:grid-cols-3">
        {itens.map((item) => (
          <div
            key={item.key}
            className="border-l-2 bg-deep px-5 py-4"
            style={{ borderColor: item.cor }}
          >
            <dt className="mono-label flex items-center gap-2">
              <span style={{ color: item.cor }}>
                <item.Icone size={16} />
              </span>
              {item.rotulo}
            </dt>
            <dd className="value-hero mt-2" style={{ color: item.cor }}>
              {item.valor}
            </dd>
          </div>
        ))}
      </dl>

      {!result.remoteViable ? (
        <Note tone="warn" title={t("warning.remoteBlocked.title")}>
          {result.remoteBlockedReason}
        </Note>
      ) : null}

      <Note title={t("warning.normative.title")}>{t("warning.normative.body")}</Note>
    </section>
  );
}
