"use client";

/**
 * O percurso guiado: quatro passos numerados numa página só.
 *
 * A ordem não é arbitrária. Cada seção explica o conceito antes de pedir o
 * dado — o que o VIA vai fazer com "ônibus urbano" aparece acima do controle
 * que escolhe "ônibus urbano". Uma ferramenta que pede idade e renda sem dizer
 * para quê tem obrigação de explicar, e explicar depois do preenchimento é
 * explicar tarde.
 *
 * Nenhum passo bloqueia o seguinte. O estado de "aguardando" é visual e
 * textual, nunca uma trava: quem quiser ler o passo 03 antes de preencher o 01
 * pode, e o leitor de tela percorre a página inteira em qualquer momento.
 */

import { useMemo, useRef, useState } from "react";

import {
  TRANSPORT_MODALS,
  type MobilityLevel,
  type Place,
  type TransportModal,
} from "@/domain/types";
import type { ImpactResult } from "@/domain/types";
import { createTranslator, type Locale, type MessageKey } from "@/i18n";

import {
  Note,
  RadioChips,
  Reveal,
  SectionHeader,
  Slider,
  TextField,
  Toggle,
} from "./editorial";
import { PlaceSearch } from "./PlaceSearch";
import { Results } from "./Results";

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

export interface FormState {
  origin: Place | null;
  destination: Place | null;
  modal: TransportModal;
  occupancy: number;
  transfers: number;
  tollBRL: string;
  parkingBRL: string;
  congestionFactor: number;
  age: number;
  mobility: MobilityLevel;
  requiresCompanion: boolean;
  monthlyIncomeBRL: string;
  countProductivityLoss: boolean;
  hasReliableInternet: boolean;
}

export const INITIAL_FORM: FormState = {
  origin: null,
  destination: null,
  modal: "car_gasoline",
  occupancy: 1,
  transfers: 0,
  tollBRL: "",
  parkingBRL: "",
  congestionFactor: 1,
  age: 40,
  mobility: "none",
  requiresCompanion: false,
  monthlyIncomeBRL: "",
  countProductivityLoss: true,
  // Padrão false: a ferramenta só afirma que a teleconsulta é viável quando
  // alguém confirma ter conexão. Ver docs/limitacoes-e-etica.md.
  hasReliableInternet: false,
};

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

const MOBILITY_KEYS: Array<{ value: MobilityLevel; key: MessageKey }> = [
  { value: "none", key: "form.mobility.none" },
  { value: "mild", key: "form.mobility.mild" },
  { value: "moderate", key: "form.mobility.moderate" },
  { value: "severe", key: "form.mobility.severe" },
];

const CONGESTION_KEYS: Array<{ value: string; key: MessageKey }> = [
  { value: "1", key: "form.congestion.typical" },
  { value: "1.3", key: "form.congestion.busy" },
  { value: "1.6", key: "form.congestion.heavy" },
];

const DRIVEN: TransportModal[] = ["car_gasoline", "car_ethanol", "motorcycle"];
const TRANSIT: TransportModal[] = ["bus_urban", "metro_rail"];

/** Converte o estado do formulário no corpo que a API espera. */
function toRequestBody(form: FormState) {
  const optionalNumber = (raw: string): number | undefined => {
    const trimmed = raw.trim().replace(",", ".");
    if (trimmed.length === 0) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    origin: form.origin,
    destination: form.destination,
    modal: form.modal,
    occupancy: form.occupancy,
    transfers: form.transfers,
    tollBRL: optionalNumber(form.tollBRL),
    parkingBRL: optionalNumber(form.parkingBRL),
    congestionFactor: form.congestionFactor,
    profile: {
      age: form.age,
      mobility: form.mobility,
      requiresCompanion: form.requiresCompanion,
      monthlyIncomeBRL: optionalNumber(form.monthlyIncomeBRL),
      countProductivityLoss: form.countProductivityLoss,
      hasReliableInternet: form.hasReliableInternet,
    },
  };
}

// ---------------------------------------------------------------------------

export function GuidedFlow({ locale = "pt-BR" }: { locale?: Locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [computedFrom, setComputedFrom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scientistMode, setScientistMode] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Rótulos dos botões de passo. Compostos aqui, onde o tradutor existe: a
  // primitiva de slider não conhece idioma nenhum, de propósito.
  const passo = (rotulo: string) => ({
    decreaseLabel: `${t("control.decrease")} — ${rotulo}`,
    increaseLabel: `${t("control.increase")} — ${rotulo}`,
  });

  const hasPlaces = form.origin !== null && form.destination !== null;
  const isDriven = DRIVEN.includes(form.modal);
  const isTransit = TRANSIT.includes(form.modal);
  const isMotorised = isDriven || isTransit || form.modal === "taxi_rideshare";

  // Comparação por conteúdo, e não uma flag "sujo" ligada em cada `onChange`:
  // voltar um slider ao valor original devolve o resultado à validade, o que
  // é o que a pessoa espera ao desfazer uma tentativa.
  const currentSignature = JSON.stringify(toRequestBody(form));
  const stale = result !== null && computedFrom !== currentSignature;

  async function submit() {
    if (!hasPlaces) {
      setError(t("form.error.missingPlaces"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toRequestBody(form)),
      });

      const data = await response.json();

      if (!response.ok) {
        const issues = (data.issues ?? []) as Array<{ message: string }>;
        setError(
          issues.length > 0
            ? issues.map((i) => i.message).join(" ")
            : ((data.error as string) ?? t("form.error.network")),
        );
        setResult(null);
        return;
      }

      setResult(data as ImpactResult);
      setComputedFrom(currentSignature);
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError(t("form.error.network"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {/* ---------------------------------------------------------------- 01 */}
      <Step id="trajeto" labelledBy="passo-01">
        <SectionHeader
          num={t("step.trip.num")}
          eyebrow={t("step.trip.eyebrow")}
          titleBefore={t("step.trip.title.before")}
          titleEmphasis={t("step.trip.title.emphasis")}
          lede={t("step.trip.lede")}
          status={hasPlaces ? t("control.done") : undefined}
          titleId="passo-01"
        />

        <Reveal className="grid gap-10 md:grid-cols-2">
          <PlaceSearch
            labelKey="form.origin.label"
            placeholderKey="form.origin.placeholder"
            helpKey="form.origin.help"
            value={form.origin}
            onChange={(p) => set("origin", p)}
            t={t}
            required
          />
          <PlaceSearch
            labelKey="form.destination.label"
            placeholderKey="form.destination.placeholder"
            value={form.destination}
            onChange={(p) => set("destination", p)}
            t={t}
            required
          />
        </Reveal>
      </Step>

      {/* ---------------------------------------------------------------- 02 */}
      <Step id="deslocamento" labelledBy="passo-02">
        <SectionHeader
          num={t("step.modal.num")}
          eyebrow={t("step.modal.eyebrow")}
          titleBefore={t("step.modal.title.before")}
          titleEmphasis={t("step.modal.title.emphasis")}
          lede={t("step.modal.lede")}
          titleId="passo-02"
        />

        <Reveal className="flex flex-col gap-12">
          <RadioChips
            legend={t("step.modal.pickLabel")}
            value={form.modal}
            options={TRANSPORT_MODALS.map((m) => ({
              value: m,
              label: t(MODAL_KEYS[m]),
            }))}
            onChange={(v) => set("modal", v)}
          />

          {/*
            Os controles seguintes dependem do modal escolhido. Baldeação não
            existe de bicicleta, e perguntar assim mesmo ensinaria que o
            formulário não presta atenção no que já foi respondido.
          */}
          {isDriven || isTransit || isMotorised ? (
            <div className="flex flex-col gap-10">
              <h3 className="subsection-title">
                {t("step.modal.detailsTitle")}
              </h3>

              {isDriven ? (
                <Slider
                  label={t("form.occupancy.label")}
                  help={t("form.occupancy.help")}
                  value={form.occupancy}
                  min={1}
                  max={8}
                  display={`${form.occupancy} ${t("control.people")}`}
                  {...passo(t("form.occupancy.label"))}
                  onChange={(v) => set("occupancy", v)}
                />
              ) : null}

              {isTransit ? (
                <Slider
                  label={t("form.transfers.label")}
                  help={t("form.transfers.help")}
                  value={form.transfers}
                  min={0}
                  max={10}
                  display={`${form.transfers} ${t("control.transfersUnit")}`}
                  {...passo(t("form.transfers.label"))}
                  onChange={(v) => set("transfers", v)}
                />
              ) : null}

              {isDriven ? (
                <div className="grid gap-8 sm:grid-cols-2">
                  <TextField
                    label={t("form.toll.label")}
                    value={form.tollBRL}
                    inputMode="decimal"
                    prefix="R$"
                    placeholder="0,00"
                    onChange={(v) => set("tollBRL", v)}
                  />
                  <TextField
                    label={t("form.parking.label")}
                    value={form.parkingBRL}
                    inputMode="decimal"
                    prefix="R$"
                    placeholder="0,00"
                    onChange={(v) => set("parkingBRL", v)}
                  />
                </div>
              ) : null}

              {isMotorised ? (
                <RadioChips
                  legend={t("form.congestion.label")}
                  help={t("form.congestion.help")}
                  value={String(form.congestionFactor)}
                  options={CONGESTION_KEYS.map((o) => ({
                    value: o.value,
                    label: t(o.key),
                  }))}
                  onChange={(v) => set("congestionFactor", Number(v))}
                />
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </Step>

      {/* ---------------------------------------------------------------- 03 */}
      <Step id="perfil" labelledBy="passo-03">
        <SectionHeader
          num={t("step.profile.num")}
          eyebrow={t("step.profile.eyebrow")}
          titleBefore={t("step.profile.title.before")}
          titleEmphasis={t("step.profile.title.emphasis")}
          lede={t("step.profile.lede")}
          titleId="passo-03"
        />

        <Reveal className="flex flex-col gap-12">
          <Note>{t("step.profile.ethics")}</Note>

          <Slider
            label={t("form.age.label")}
            value={form.age}
            min={0}
            max={110}
            display={`${form.age} ${t("control.years")}`}
            {...passo(t("form.age.label"))}
            onChange={(v) => set("age", v)}
          />

          <RadioChips
            legend={t("form.mobility.label")}
            value={form.mobility}
            options={MOBILITY_KEYS.map((o) => ({
              value: o.value,
              label: t(o.key),
            }))}
            onChange={(v) => set("mobility", v)}
          />

          <div className="flex flex-col gap-8">
            <Toggle
              label={t("form.companion.label")}
              checked={form.requiresCompanion}
              onChange={(v) => set("requiresCompanion", v)}
            />

            <Toggle
              label={t("form.internet.label")}
              help={t("form.internet.help")}
              checked={form.hasReliableInternet}
              onChange={(v) => set("hasReliableInternet", v)}
            />

            <Toggle
              label={t("form.productivity.label")}
              help={t("form.productivity.help")}
              checked={form.countProductivityLoss}
              onChange={(v) => set("countProductivityLoss", v)}
            />
          </div>

          <TextField
            label={t("form.income.label")}
            suffix={t("control.optional")}
            help={t("form.income.help")}
            placeholder={t("form.income.placeholder")}
            value={form.monthlyIncomeBRL}
            inputMode="decimal"
            prefix="R$"
            onChange={(v) => set("monthlyIncomeBRL", v)}
          />
        </Reveal>
      </Step>

      {/* ---------------------------------------------------------------- 04 */}
      <Step id="resultado" labelledBy="passo-04" ref={resultRef}>
        <SectionHeader
          num={t("step.result.num")}
          eyebrow={t("step.result.eyebrow")}
          titleBefore={t("step.result.title.before")}
          titleEmphasis={t("step.result.title.emphasis")}
          lede={t("step.result.lede")}
          titleId="passo-04"
        />

        <div className="flex flex-col gap-8">
          {error ? (
            <div role="alert">
              <Note tone="warn" title={t("form.error.title")}>
                {error}
              </Note>
            </div>
          ) : null}

          {!hasPlaces ? (
            <p className="lede text-mute">{t("step.result.waiting")}</p>
          ) : null}

          {stale ? <Note tone="warn">{t("step.result.stale")}</Note> : null}

          <div>
            <button type="submit" className="btn" disabled={loading || !hasPlaces}>
              {loading
                ? t("form.calculating")
                : result
                  ? t("form.recalculate")
                  : t("form.submit")}
            </button>
          </div>

          {/*
            aria-live garante que quem usa leitor de tela saiba que o resultado
            chegou. Sem isso, o cálculo termina em silêncio e a pessoa fica sem
            saber que a página mudou.
          */}
          <div aria-live="polite" aria-busy={loading}>
            {result ? (
              <Results
                result={result}
                scientistMode={scientistMode}
                onToggleScientist={setScientistMode}
                locale={locale}
                t={t}
              />
            ) : null}
          </div>
        </div>
      </Step>
    </form>
  );
}

// ---------------------------------------------------------------------------

function Step({
  id,
  labelledBy,
  children,
  ref,
}: {
  id: string;
  labelledBy: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className="border-t border-line py-20 sm:py-28"
    >
      <div ref={ref} className="scroll-mt-20">
        {children}
      </div>
    </section>
  );
}
