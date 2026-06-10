export function extractPlanDatePart(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
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

  const today = now.toISOString().slice(0, 10);
  return datePart >= today;
}
