import { describe, expect, it } from "vitest";
import {
  getAchievementLevel,
  getProfileAchievements
} from "@/lib/profileAchievements";
import type { ProfilePlaceItem } from "@/lib/profilePlaces";

function place(input: Partial<ProfilePlaceItem> & { id: string; name: string }): ProfilePlaceItem {
  return {
    address: input.address ?? null,
    category: input.category ?? null,
    city: input.city ?? null,
    createdAt: input.createdAt ?? "2026-01-01T00:00:00.000Z",
    googleMapsUrl: null,
    groupId: null,
    groupName: input.groupName ?? null,
    id: input.id,
    imageUrl: null,
    isFavorite: false,
    name: input.name,
    source: input.source ?? "personal",
    status: "pending"
  };
}

describe("profile achievements", () => {
  it("calcula niveles por rangos base", () => {
    expect(getAchievementLevel(0)).toBe(1);
    expect(getAchievementLevel(10)).toBe(1);
    expect(getAchievementLevel(11)).toBe(2);
    expect(getAchievementLevel(50)).toBe(2);
    expect(getAchievementLevel(51)).toBe(3);
    expect(getAchievementLevel(100)).toBe(3);
    expect(getAchievementLevel(101)).toBe(4);
  });

  it("cartografo cuenta todos los lugares", () => {
    const achievements = getProfileAchievements([
      place({ id: "1", name: "Lugar uno" }),
      place({ id: "2", name: "Lugar dos" })
    ]);

    expect(achievements.find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        count: 2,
        level: 1,
        nextTarget: 50,
        progressPercent: 4
      })
    );
  });

  it("cartografo usa objetivos mas dificiles", () => {
    const buildPlaces = (count: number) => Array.from({ length: count }, (_, index) => place({ id: String(index), name: `Lugar ${index}` }));

    expect(getProfileAchievements(buildPlaces(0)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 1,
        nextTarget: 50,
        progressPercent: 0
      })
    );
    expect(getProfileAchievements(buildPlaces(50)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 1,
        nextTarget: 50,
        progressPercent: 100
      })
    );
    expect(getProfileAchievements(buildPlaces(51)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 2,
        nextTarget: 150,
        progressPercent: 34
      })
    );
    expect(getProfileAchievements(buildPlaces(150)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 2,
        nextTarget: 150,
        progressPercent: 100
      })
    );
    expect(getProfileAchievements(buildPlaces(151)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 3,
        nextTarget: 300,
        progressPercent: 50
      })
    );
    expect(getProfileAchievements(buildPlaces(300)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 3,
        nextTarget: 300,
        progressPercent: 100
      })
    );
    expect(getProfileAchievements(buildPlaces(301)).find((achievement) => achievement.id === "cartographer")).toEqual(
      expect.objectContaining({
        level: 4,
        nextTarget: null,
        progressPercent: 100
      })
    );
  });

  it("gourmet detecta comida con acentos y mayusculas", () => {
    const achievements = getProfileAchievements([
      place({ id: "1", name: "CAFÉ Central", category: "Cafetería" }),
      place({ id: "2", name: "Burger King", category: "Comer" })
    ]);

    expect(achievements.find((achievement) => achievement.id === "gourmet")?.count).toBe(2);
  });

  it("los logros tematicos mantienen los rangos base", () => {
    const gourmetPlaces = Array.from({ length: 101 }, (_, index) => place({ id: String(index), name: `Restaurante ${index}` }));
    const gourmet = getProfileAchievements(gourmetPlaces).find((achievement) => achievement.id === "gourmet");
    const naturalist = getProfileAchievements([
      ...Array.from({ length: 10 }, (_, index) => place({ id: `n-${index}`, name: `Parque ${index}` })),
      place({ id: "n-11", name: "Mirador nuevo" })
    ]).find((achievement) => achievement.id === "naturalist");
    const athlete = getProfileAchievements([
      ...Array.from({ length: 50 }, (_, index) => place({ id: `d-${index}`, name: `Gimnasio ${index}` })),
      place({ id: "d-51", name: "Pista de tenis" })
    ]).find((achievement) => achievement.id === "athlete");

    expect(gourmet).toEqual(
      expect.objectContaining({
        level: 4,
        nextTarget: null,
        progressPercent: 100
      })
    );
    expect(naturalist).toEqual(
      expect.objectContaining({
        level: 2,
        nextTarget: 50,
        progressPercent: 22
      })
    );
    expect(athlete).toEqual(
      expect.objectContaining({
        level: 3,
        nextTarget: 100,
        progressPercent: 51
      })
    );
  });

  it("naturalista detecta naturaleza", () => {
    const achievements = getProfileAchievements([
      place({ id: "1", name: "Mirador de la montaña" }),
      place({ id: "2", name: "Parque del Rio" })
    ]);

    expect(achievements.find((achievement) => achievement.id === "naturalist")?.count).toBe(2);
  });

  it("deportista detecta deporte", () => {
    const achievements = getProfileAchievements([
      place({ id: "1", name: "Gimnasio Norte" }),
      place({ id: "2", name: "Pista de Pádel" })
    ]);

    expect(achievements.find((achievement) => achievement.id === "athlete")?.count).toBe(2);
  });

  it("no clasifica todo como logro tematico", () => {
    const achievements = getProfileAchievements([
      place({ id: "1", name: "Biblioteca Municipal", category: "Cultura" }),
      place({ id: "2", name: "Tienda de muebles", category: "Comercio" })
    ]);

    expect(achievements.find((achievement) => achievement.id === "cartographer")?.count).toBe(2);
    expect(achievements.find((achievement) => achievement.id === "gourmet")?.count).toBe(0);
    expect(achievements.find((achievement) => achievement.id === "naturalist")?.count).toBe(0);
    expect(achievements.find((achievement) => achievement.id === "athlete")?.count).toBe(0);
  });

  it("calcula progreso del ultimo nivel al cien por cien", () => {
    const places = Array.from({ length: 301 }, (_, index) => place({ id: String(index), name: `Lugar ${index}` }));
    const cartographer = getProfileAchievements(places).find((achievement) => achievement.id === "cartographer");

    expect(cartographer).toEqual(
      expect.objectContaining({
        level: 4,
        nextTarget: null,
        progressPercent: 100
      })
    );
  });
});
