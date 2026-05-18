export function splitAddressParts(rawValue: string | undefined): { street: string; city: string } {
  const raw = (rawValue || "").trim();
  if (!raw) return { street: "", city: "" };
  const parts = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return { street: "", city: "" };
  if (parts.length === 1) return { street: parts[0], city: "" };
  return { street: parts[0], city: parts[1] };
}

export function stripPostalCodes(value: string): string {
  return value.replace(/\b\d{4,6}\b/g, "").replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").trim();
}

export function extractCityFromFormattedAddress(formattedAddress: string): string {
  const parts = formattedAddress
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) return "";

  const postalLocalityPart = parts.find((part) => /\b\d{4,6}\b/.test(part));
  if (postalLocalityPart) {
    const locality = stripPostalCodes(postalLocalityPart);
    if (locality) return locality;
  }

  const countryCandidates = ["espana", "españa", "spain"];
  const normalizedParts = parts.map((part) =>
    part
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  );
  const countryIndex = normalizedParts.findIndex((part) => countryCandidates.some((country) => part === country));

  const cityCandidateIndex = countryIndex > 0 ? countryIndex - 1 : parts.length - 1;
  const cityCandidate = stripPostalCodes(parts[cityCandidateIndex] || "");
  if (cityCandidate) return cityCandidate;

  return stripPostalCodes(parts[1] || "");
}

export function extractProvinceFromFormattedAddress(formattedAddress: string): string {
  const parts = formattedAddress
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length < 2) return "";

  const countryCandidates = ["espana", "españa", "spain"];
  const normalizedParts = parts.map((part) =>
    part
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  );
  const countryIndex = normalizedParts.findIndex((part) => countryCandidates.some((country) => part === country));
  if (countryIndex >= 2) {
    const province = stripPostalCodes(parts[countryIndex - 1] || "");
    if (province) return province;
  }

  return stripPostalCodes(parts[parts.length - 1] || "");
}

type AddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

export function pickCityFromComponents(components: AddressComponent[] | undefined): string {
  if (!components || components.length === 0) return "";
  const preferredTypes = ["locality", "postal_town", "administrative_area_level_2", "administrative_area_level_1"];
  for (const type of preferredTypes) {
    const match = components.find((component) => (component.types || []).includes(type));
    const value = (match?.long_name || "").trim();
    if (value) return value;
  }
  return "";
}

export function pickStreetFromComponents(components: AddressComponent[] | undefined, fallbackStreet: string): string {
  if (!components || components.length === 0) return fallbackStreet;
  const route = (components.find((component) => (component.types || []).includes("route"))?.long_name || "").trim();
  const streetNumber = (components.find((component) => (component.types || []).includes("street_number"))?.long_name || "").trim();
  const constructed = `${route} ${streetNumber}`.trim();
  return constructed || fallbackStreet;
}
