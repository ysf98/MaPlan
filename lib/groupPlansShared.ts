const PLAN_DATE_TIME_ZONE = "Europe/Madrid";

function toValidDatePart(year: string, month: string, day: string): string | null {
  const normalizedYear = year.padStart(4, "0");
  const normalizedMonth = month.padStart(2, "0");
  const normalizedDay = day.padStart(2, "0");
  const parsed = new Date(`${normalizedYear}-${normalizedMonth}-${normalizedDay}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(normalizedYear) ||
    parsed.getUTCMonth() + 1 !== Number(normalizedMonth) ||
    parsed.getUTCDate() !== Number(normalizedDay)
  ) {
    return null;
  }

  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`;
}

export function extractPlanDatePart(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  const spanishMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (spanishMatch) {
    return toValidDatePart(spanishMatch[3], spanishMatch[2], spanishMatch[1]);
  }

  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    const [year, month, day] = match[1].split("-");
    return toValidDatePart(year, month, day);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayPlanDatePart(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    timeZone: PLAN_DATE_TIME_ZONE,
    year: "numeric"
  }).formatToParts(now);

  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";

  return `${year}-${month}-${day}`;
}

export function formatPlanDateSpanish(value: string | null | undefined): string | null {
  const datePart = extractPlanDatePart(value);
  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) {
    return null;
  }

  return `${day}/${month}/${year}`;
}

export function getPlanTimeMinutes(value: string | null | undefined, timeZone = PLAN_DATE_TIME_ZONE): number | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    timeZone
  }).formatToParts(parsed);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return (hour % 24) * 60 + minute;
}

export function isPlanDateTodayOrFuture(value: string | null | undefined, now = new Date()): boolean {
  return isPlanDateOnOrAfter(value, getTodayPlanDatePart(now));
}

export function isPlanDateOnOrAfter(value: string | null | undefined, minDatePart: string): boolean {
  const datePart = extractPlanDatePart(value);
  if (!datePart) {
    return false;
  }

  return datePart >= minDatePart;
}

export function normalizePlanDateInput(value: string | null | undefined): string | null {
  const datePart = extractPlanDatePart(value);
  if (!datePart) {
    return null;
  }

  return `${datePart}T00:00:00.000Z`;
}

export function canPlanAcceptNewPlaces(plannedDate: string | null | undefined, now = new Date()): boolean {
  const trimmed = plannedDate?.trim() ?? "";
  if (!trimmed) {
    return true;
  }

  const datePart = extractPlanDatePart(plannedDate);
  if (!datePart) {
    return false;
  }

  return isPlanDateTodayOrFuture(datePart, now);
}
