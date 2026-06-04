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

export function getAchievementLevel(count: number): ProfileAchievementLevel {
  if (count > 100) return 4;
  if (count >= 51) return 3;
  if (count >= 11) return 2;
  return 1;
}

function getAchievementProgress(count: number): Pick<ProfileAchievement, "currentRangeLabel" | "nextTarget" | "progressPercent"> {
  const level = getAchievementLevel(count);
  if (level === 4) {
    return {
      currentRangeLabel: "+100",
      nextTarget: null,
      progressPercent: 100
    };
  }

  const nextTarget = level === 1 ? 10 : level === 2 ? 50 : 100;
  const currentRangeLabel = level === 1 ? "0-10" : level === 2 ? "11-50" : "51-100";
  return {
    currentRangeLabel,
    nextTarget,
    progressPercent: Math.max(0, Math.min(100, Math.round((count / nextTarget) * 100)))
  };
}

function buildAchievement(input: Omit<ProfileAchievement, "level" | "currentRangeLabel" | "nextTarget" | "progressPercent">): ProfileAchievement {
  const level = getAchievementLevel(input.count);
  return {
    ...input,
    level,
    ...getAchievementProgress(input.count)
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
    }),
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
