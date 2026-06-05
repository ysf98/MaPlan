import type { ProfilePlaceItem } from "@/lib/profilePlaces";

export type ProfileAchievementId = "cartographer" | "gourmet" | "naturalist" | "athlete";
export type ProfileAchievementLevel = 1 | 2 | 3 | 4;

export type ProfileAchievement = {
  id: ProfileAchievementId;
  title: string;
  description: string;
  iconLetter: string;
  count: number;
  level: ProfileAchievementLevel;
  currentRangeLabel: string;
  nextTarget: number | null;
  progressPercent: number;
};

type AchievementRangeConfig = {
  firstTarget: number;
  secondTarget: number;
  thirdTarget: number;
  firstRangeLabel: string;
  secondRangeLabel: string;
  thirdRangeLabel: string;
  maxRangeLabel: string;
};

const defaultRangeConfig: AchievementRangeConfig = {
  firstTarget: 10,
  secondTarget: 50,
  thirdTarget: 100,
  firstRangeLabel: "0-10",
  secondRangeLabel: "11-50",
  thirdRangeLabel: "51-100",
  maxRangeLabel: "+100"
};

const cartographerRangeConfig: AchievementRangeConfig = {
  firstTarget: 50,
  secondTarget: 150,
  thirdTarget: 300,
  firstRangeLabel: "1-50",
  secondRangeLabel: "51-150",
  thirdRangeLabel: "151-300",
  maxRangeLabel: "+300"
};

const gourmetKeywords = [
  "restaurante",
  "restaurant",
  "bar",
  "cafeteria",
  "cafe",
  "coffee",
  "comida",
  "brunch",
  "tapas",
  "pizza",
  "pizzeria",
  "burger",
  "hamburgueseria",
  "sushi",
  "bakery",
  "panaderia",
  "pasteleria",
  "heladeria",
  "pub",
  "asador",
  "braseria",
  "marisqueria",
  "kebab"
];

const naturalistKeywords = [
  "monte",
  "montana",
  "parque",
  "jardin",
  "mirador",
  "sendero",
  "ruta",
  "bosque",
  "playa",
  "lago",
  "rio",
  "naturaleza",
  "camping",
  "sierra",
  "reserva",
  "cascada"
];

const athleteKeywords = [
  "gimnasio",
  "gym",
  "fitness",
  "deporte",
  "pista",
  "campo",
  "estadio",
  "polideportivo",
  "piscina",
  "padel",
  "tenis",
  "futbol",
  "baloncesto",
  "running",
  "escalada",
  "yoga",
  "crossfit",
  "deportivo",
  "sport"
];

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchableText(place: Pick<ProfilePlaceItem, "name" | "category" | "address" | "city" | "groupName">): string {
  return [
    place.name,
    place.category,
    place.address,
    place.city,
    place.groupName
  ]
    .map(normalizeText)
    .join(" ");
}

function matchesKeywords(place: ProfilePlaceItem, keywords: string[]): boolean {
  const text = searchableText(place);
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

export function getAchievementLevel(count: number, rangeConfig: AchievementRangeConfig = defaultRangeConfig): ProfileAchievementLevel {
  if (count > rangeConfig.thirdTarget) return 4;
  if (count > rangeConfig.secondTarget) return 3;
  if (count > rangeConfig.firstTarget) return 2;
  return 1;
}

function getAchievementProgress(count: number, rangeConfig: AchievementRangeConfig): Pick<ProfileAchievement, "currentRangeLabel" | "nextTarget" | "progressPercent"> {
  const level = getAchievementLevel(count, rangeConfig);
  if (level === 4) {
    return {
      currentRangeLabel: rangeConfig.maxRangeLabel,
      nextTarget: null,
      progressPercent: 100
    };
  }

  const nextTarget = level === 1 ? rangeConfig.firstTarget : level === 2 ? rangeConfig.secondTarget : rangeConfig.thirdTarget;
  const currentRangeLabel = level === 1 ? rangeConfig.firstRangeLabel : level === 2 ? rangeConfig.secondRangeLabel : rangeConfig.thirdRangeLabel;
  return {
    currentRangeLabel,
    nextTarget,
    progressPercent: Math.max(0, Math.min(100, Math.round((count / nextTarget) * 100)))
  };
}

function buildAchievement(
  input: Omit<ProfileAchievement, "level" | "currentRangeLabel" | "nextTarget" | "progressPercent">,
  rangeConfig: AchievementRangeConfig = defaultRangeConfig
): ProfileAchievement {
  const level = getAchievementLevel(input.count, rangeConfig);
  return {
    ...input,
    level,
    ...getAchievementProgress(input.count, rangeConfig)
  };
}

export function getProfileAchievements(places: ProfilePlaceItem[]): ProfileAchievement[] {
  const gourmetCount = places.filter((place) => matchesKeywords(place, gourmetKeywords)).length;
  const naturalistCount = places.filter((place) => matchesKeywords(place, naturalistKeywords)).length;
  const athleteCount = places.filter((place) => matchesKeywords(place, athleteKeywords)).length;

  return [
    buildAchievement({
      id: "cartographer",
      title: "Cartografo",
      description: "Cualquier lugar guardado",
      iconLetter: "C",
      count: places.length
    }, cartographerRangeConfig),
    buildAchievement({
      id: "gourmet",
      title: "Gourmet",
      description: "Sitios para comer",
      iconLetter: "G",
      count: gourmetCount
    }),
    buildAchievement({
      id: "naturalist",
      title: "Naturalista",
      description: "Naturaleza y aire libre",
      iconLetter: "N",
      count: naturalistCount
    }),
    buildAchievement({
      id: "athlete",
      title: "Deportista",
      description: "Deporte y actividad",
      iconLetter: "D",
      count: athleteCount
    })
  ];
}
