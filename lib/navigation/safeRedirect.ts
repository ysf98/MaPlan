import { ROUTES } from "@/utils/constants";

export function getSafeInternalPath(value: string | null | undefined, fallback: string = ROUTES.dashboard) {
  if (!value) {
    return fallback;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue.startsWith("/") || trimmedValue.startsWith("//") || trimmedValue.startsWith("/\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmedValue, "https://maplan.local");
    if (parsed.origin !== "https://maplan.local") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
