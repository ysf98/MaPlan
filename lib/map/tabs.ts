export const PERSONAL_MAP_TABS = ["lugares", "mapa"] as const;

export type PersonalMapTab = (typeof PERSONAL_MAP_TABS)[number];

export function getPersonalMapTab(rawValue: string | string[] | undefined): PersonalMapTab {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (value === "mapa") {
    return "mapa";
  }
  return "lugares";
}
