export const GROUP_DETAIL_TABS = ["lugares", "actividad", "mapa"] as const;

export type GroupDetailTab = (typeof GROUP_DETAIL_TABS)[number];

export function getGroupDetailTab(rawValue: string | string[] | undefined): GroupDetailTab {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (value === "actividad" || value === "mapa") {
    return value;
  }
  return "lugares";
}
