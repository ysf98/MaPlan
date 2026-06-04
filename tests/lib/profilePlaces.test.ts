import { describe, expect, it } from "vitest";
import {
  buildProfilePlaceItems,
  filterProfilePlaces,
  getProfilePlaceStats,
  getProfilePlacesFilter
} from "@/lib/profilePlaces";

const personalPlaces = [
  {
    id: "personal-1",
    name: "Cafe personal",
    address: "Calle A",
    city: "Madrid",
    category: "Cafeteria",
    external_place_id: "personal-ext",
    google_maps_url: "https://www.google.com/maps/place/?q=place_id:personal-ext",
    image_url: null,
    status: "visited",
    is_favorite: true,
    created_at: "2026-01-03T00:00:00.000Z",
    latitude: 40.4,
    longitude: -3.7
  },
  {
    id: "personal-2",
    name: "Pendiente personal",
    address: "Calle B",
    city: null,
    category: null,
    external_place_id: null,
    google_maps_url: null,
    image_url: null,
    status: "pending",
    is_favorite: false,
    created_at: "2026-01-01T00:00:00.000Z",
    latitude: 40.5,
    longitude: -3.8
  }
];

const groupPlaces = [
  {
    id: "group-place-1",
    group_id: "group-1",
    name: "Restaurante grupo",
    address: "Calle C",
    city: "Valencia",
    category: "Restaurante",
    external_place_id: null,
    google_maps_url: null,
    image_url: null,
    created_at: "2026-01-02T00:00:00.000Z",
    latitude: 39.4,
    longitude: -0.3
  },
  {
    id: "foreign-place",
    group_id: "foreign-group",
    name: "Grupo ajeno",
    address: "Calle X",
    city: null,
    category: "Otros",
    external_place_id: null,
    google_maps_url: null,
    image_url: null,
    created_at: "2026-01-04T00:00:00.000Z",
    latitude: 41,
    longitude: -4
  }
];

const groups = [
  {
    id: "group-1",
    name: "Grupo visible"
  }
];

describe("profile places helper", () => {
  it("agrega lugares personales y de grupos visibles", () => {
    const places = buildProfilePlaceItems({
      personalPlaces,
      groupPlaces,
      groupPlaceStates: [{ place_id: "group-place-1", status: "pending", is_favorite: true }],
      groups
    });

    expect(places.map((place) => place.name)).toEqual(["Cafe personal", "Restaurante grupo", "Pendiente personal"]);
    expect(places.find((place) => place.id === "group-place-1")).toEqual(
      expect.objectContaining({
        source: "group",
        groupName: "Grupo visible",
        isFavorite: true,
        status: "pending"
      })
    );
  });

  it("no incluye lugares de grupos ajenos", () => {
    const places = buildProfilePlaceItems({
      personalPlaces: [],
      groupPlaces,
      groupPlaceStates: [],
      groups
    });

    expect(places).toHaveLength(1);
    expect(places[0].id).toBe("group-place-1");
  });

  it("filtra favoritos pendientes y visitados", () => {
    const places = buildProfilePlaceItems({
      personalPlaces,
      groupPlaces,
      groupPlaceStates: [{ place_id: "group-place-1", status: "pending", is_favorite: true }],
      groups
    });

    expect(filterProfilePlaces(places, "favorites").map((place) => place.id)).toEqual(["personal-1", "group-place-1"]);
    expect(filterProfilePlaces(places, "pending").map((place) => place.id)).toEqual(["group-place-1", "personal-2"]);
    expect(filterProfilePlaces(places, "visited").map((place) => place.id)).toEqual(["personal-1"]);
  });

  it("calcula estadisticas agregadas", () => {
    const places = buildProfilePlaceItems({
      personalPlaces,
      groupPlaces,
      groupPlaceStates: [{ place_id: "group-place-1", status: "pending", is_favorite: true }],
      groups
    });

    expect(getProfilePlaceStats(places)).toEqual({
      all: 3,
      favorites: 2,
      pending: 2,
      visited: 1
    });
  });

  it("normaliza filtros invalidos a all", () => {
    expect(getProfilePlacesFilter("favorites")).toBe("favorites");
    expect(getProfilePlacesFilter("otro")).toBe("all");
    expect(getProfilePlacesFilter(undefined)).toBe("all");
  });
});
