/**
 * Validação da entrada vinda de fora (formulário ou API).
 *
 * Vive no domínio, e não na rota HTTP, por dois motivos: é testável sem subir
 * servidor, e a API pública e a interface passam pelas mesmas regras — não há
 * caminho em que o formulário aceite algo que o endpoint recusa, ou o
 * contrário.
 *
 * A estratégia é acumular erros em vez de parar no primeiro. Quem está
 * integrando com a API merece a lista inteira do que está errado, não uma
 * descoberta por requisição.
 */

import {
  MOBILITY_LEVELS,
  TRANSPORT_MODALS,
  type ConsultationInput,
  type MobilityLevel,
  type PatientProfile,
  type Place,
  type TransportModal,
} from "./types";

export interface ValidationIssue {
  /** Caminho do campo, no formato "profile.age". */
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePlace(
  raw: unknown,
  field: string,
  issues: ValidationIssue[],
): Place | null {
  if (!isRecord(raw)) {
    issues.push({ field, message: "Esperado um objeto com lat, lng e label." });
    return null;
  }

  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  let valid = true;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    issues.push({
      field: `${field}.lat`,
      message: "Latitude deve ser um número entre -90 e 90.",
    });
    valid = false;
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    issues.push({
      field: `${field}.lng`,
      message: "Longitude deve ser um número entre -180 e 180.",
    });
    valid = false;
  }

  if (!valid) return null;

  const label =
    typeof raw.label === "string" && raw.label.trim().length > 0
      ? raw.label.trim()
      : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  return { lat, lng, label };
}

function parseProfile(
  raw: unknown,
  issues: ValidationIssue[],
): PatientProfile | null {
  if (!isRecord(raw)) {
    issues.push({ field: "profile", message: "Esperado um objeto de perfil." });
    return null;
  }

  const age = Number(raw.age);
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    issues.push({
      field: "profile.age",
      message: "Idade deve ser um número entre 0 e 120.",
    });
  }

  const mobility = raw.mobility;
  if (!MOBILITY_LEVELS.includes(mobility as MobilityLevel)) {
    issues.push({
      field: "profile.mobility",
      message: `Mobilidade deve ser um de: ${MOBILITY_LEVELS.join(", ")}.`,
    });
  }

  let income: number | undefined;
  if (raw.monthlyIncomeBRL !== undefined && raw.monthlyIncomeBRL !== null) {
    const parsed = Number(raw.monthlyIncomeBRL);
    if (!Number.isFinite(parsed) || parsed < 0) {
      issues.push({
        field: "profile.monthlyIncomeBRL",
        message: "Renda mensal deve ser um número não negativo, ou ser omitida.",
      });
    } else {
      income = parsed;
    }
  }

  if (issues.length > 0) return null;

  return {
    age,
    mobility: mobility as MobilityLevel,
    requiresCompanion: raw.requiresCompanion === true,
    monthlyIncomeBRL: income,
    // Padrão conservador: sem afirmação explícita de que há internet
    // confiável, a teleconsulta não é dada como viável. Errar para o lado de
    // não recomendar é preferível a recomendar para quem não consegue usar.
    hasReliableInternet: raw.hasReliableInternet === true,
    // Padrão true: a maioria das pessoas em idade ativa perde renda ao faltar.
    countProductivityLoss: raw.countProductivityLoss !== false,
  };
}

function parseOptionalNumber(
  raw: unknown,
  field: string,
  min: number,
  max: number,
  issues: ValidationIssue[],
): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    issues.push({
      field,
      message: `Deve ser um número entre ${min} e ${max}.`,
    });
    return undefined;
  }
  return parsed;
}

export function parseConsultationInput(
  raw: unknown,
): ValidationResult<ConsultationInput> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(raw)) {
    return {
      ok: false,
      issues: [{ field: "", message: "Esperado um objeto JSON." }],
    };
  }

  const origin = parsePlace(raw.origin, "origin", issues);
  const destination = parsePlace(raw.destination, "destination", issues);

  const modal = raw.modal;
  if (!TRANSPORT_MODALS.includes(modal as TransportModal)) {
    issues.push({
      field: "modal",
      message: `Modal deve ser um de: ${TRANSPORT_MODALS.join(", ")}.`,
    });
  }

  const profileIssues: ValidationIssue[] = [];
  const profile = parseProfile(raw.profile, profileIssues);
  issues.push(...profileIssues);

  const occupancy = parseOptionalNumber(raw.occupancy, "occupancy", 1, 8, issues);
  const transfers = parseOptionalNumber(raw.transfers, "transfers", 0, 10, issues);
  const tollBRL = parseOptionalNumber(raw.tollBRL, "tollBRL", 0, 100_000, issues);
  const parkingBRL = parseOptionalNumber(
    raw.parkingBRL,
    "parkingBRL",
    0,
    100_000,
    issues,
  );
  const congestionFactor = parseOptionalNumber(
    raw.congestionFactor,
    "congestionFactor",
    1,
    4,
    issues,
  );
  const consultationMinutes = parseOptionalNumber(
    raw.consultationMinutes,
    "consultationMinutes",
    0,
    480,
    issues,
  );

  if (issues.length > 0 || !origin || !destination || !profile) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      origin,
      destination,
      modal: modal as TransportModal,
      profile,
      occupancy,
      transfers,
      tollBRL,
      parkingBRL,
      congestionFactor,
      consultationMinutes,
    },
  };
}
