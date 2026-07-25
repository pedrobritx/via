"use client";

import { useId } from "react";

import { TRANSPORT_MODALS, type MobilityLevel, type Place, type TransportModal } from "@/domain/types";
import type { MessageKey, Translator } from "@/i18n";

import { PlaceSearch } from "./PlaceSearch";

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

const MOBILITY_OPTIONS: Array<{ value: MobilityLevel; key: MessageKey }> = [
  { value: "none", key: "form.mobility.none" },
  { value: "mild", key: "form.mobility.mild" },
  { value: "moderate", key: "form.mobility.moderate" },
  { value: "severe", key: "form.mobility.severe" },
];

const CONGESTION_OPTIONS: Array<{ value: number; key: MessageKey }> = [
  { value: 1, key: "form.congestion.typical" },
  { value: 1.3, key: "form.congestion.busy" },
  { value: 1.6, key: "form.congestion.heavy" },
];

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

const DRIVEN: TransportModal[] = ["car_gasoline", "car_ethanol", "motorcycle"];
const TRANSIT: TransportModal[] = ["bus_urban", "metro_rail"];

interface ImpactFormProps {
  state: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  t: Translator;
}

export function ImpactForm({
  state,
  onChange,
  onSubmit,
  loading,
  error,
  t,
}: ImpactFormProps) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    onChange({ ...state, [key]: value });

  const isDriven = DRIVEN.includes(state.modal);
  const isTransit = TRANSIT.includes(state.modal);
  const isMotorised = isDriven || isTransit || state.modal === "taxi_rideshare";

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Fieldset legend={t("form.title")}>
        <PlaceSearch
          labelKey="form.origin.label"
          placeholderKey="form.origin.placeholder"
          helpKey="form.origin.help"
          value={state.origin}
          onChange={(p) => set("origin", p)}
          t={t}
          required
        />
        <PlaceSearch
          labelKey="form.destination.label"
          placeholderKey="form.destination.placeholder"
          value={state.destination}
          onChange={(p) => set("destination", p)}
          t={t}
          required
        />

        <Select
          label={t("form.modal.label")}
          value={state.modal}
          onChange={(v) => set("modal", v as TransportModal)}
          options={TRANSPORT_MODALS.map((m) => ({
            value: m,
            label: t(MODAL_KEYS[m]),
          }))}
        />
      </Fieldset>

      <Fieldset legend={t("form.trip.title")}>
        {isDriven ? (
          <NumberField
            label={t("form.occupancy.label")}
            help={t("form.occupancy.help")}
            value={state.occupancy}
            min={1}
            max={8}
            onChange={(v) => set("occupancy", v)}
          />
        ) : null}

        {isTransit ? (
          <NumberField
            label={t("form.transfers.label")}
            help={t("form.transfers.help")}
            value={state.transfers}
            min={0}
            max={10}
            onChange={(v) => set("transfers", v)}
          />
        ) : null}

        {isDriven ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t("form.toll.label")}
              value={state.tollBRL}
              inputMode="decimal"
              prefix="R$"
              onChange={(v) => set("tollBRL", v)}
            />
            <TextField
              label={t("form.parking.label")}
              value={state.parkingBRL}
              inputMode="decimal"
              prefix="R$"
              onChange={(v) => set("parkingBRL", v)}
            />
          </div>
        ) : null}

        {isMotorised ? (
          <Select
            label={t("form.congestion.label")}
            help={t("form.congestion.help")}
            value={String(state.congestionFactor)}
            onChange={(v) => set("congestionFactor", Number(v))}
            options={CONGESTION_OPTIONS.map((o) => ({
              value: String(o.value),
              label: t(o.key),
            }))}
          />
        ) : null}
      </Fieldset>

      <Fieldset legend={t("form.profile.title")}>
        <NumberField
          label={t("form.age.label")}
          value={state.age}
          min={0}
          max={120}
          onChange={(v) => set("age", v)}
        />

        <Select
          label={t("form.mobility.label")}
          value={state.mobility}
          onChange={(v) => set("mobility", v as MobilityLevel)}
          options={MOBILITY_OPTIONS.map((o) => ({
            value: o.value,
            label: t(o.key),
          }))}
        />

        <Checkbox
          label={t("form.companion.label")}
          checked={state.requiresCompanion}
          onChange={(v) => set("requiresCompanion", v)}
        />

        <TextField
          label={t("form.income.label")}
          help={t("form.income.help")}
          placeholder={t("form.income.placeholder")}
          value={state.monthlyIncomeBRL}
          inputMode="decimal"
          prefix="R$"
          onChange={(v) => set("monthlyIncomeBRL", v)}
        />

        <Checkbox
          label={t("form.productivity.label")}
          help={t("form.productivity.help")}
          checked={state.countProductivityLoss}
          onChange={(v) => set("countProductivityLoss", v)}
        />

        <Checkbox
          label={t("form.internet.label")}
          help={t("form.internet.help")}
          checked={state.hasReliableInternet}
          onChange={(v) => set("hasReliableInternet", v)}
        />
      </Fieldset>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-warn-line bg-warn-bg px-3 py-2 text-sm text-warn-ink"
        >
          <strong>{t("form.error.title")}: </strong>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-ink disabled:opacity-60"
      >
        {loading ? t("form.calculating") : t("form.submit")}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Controles
// ---------------------------------------------------------------------------

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
      <legend className="px-1 text-sm font-semibold tracking-wide uppercase text-muted">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function Select({
  label,
  help,
  value,
  onChange,
  options,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-describedby={help ? helpId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help ? (
        <p id={helpId} className="text-xs text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function NumberField({
  label,
  help,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-describedby={help ? helpId : undefined}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          onChange(Number.isFinite(parsed) ? parsed : min);
        }}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
      />
      {help ? (
        <p id={helpId} className="text-xs text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  help,
  placeholder,
  value,
  prefix,
  inputMode,
  onChange,
}: {
  label: string;
  help?: string;
  placeholder?: string;
  value: string;
  prefix?: string;
  inputMode?: "decimal" | "numeric" | "text";
  onChange: (value: string) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3">
        {prefix ? (
          <span aria-hidden="true" className="text-sm text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          aria-describedby={help ? helpId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>
      {help ? (
        <p id={helpId} className="text-xs text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function Checkbox({
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
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          aria-describedby={help ? helpId : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        />
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      </div>
      {help ? (
        <p id={helpId} className="ml-[1.625rem] text-xs text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}
