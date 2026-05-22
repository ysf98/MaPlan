export function resolveDisplayName(input: {
  email?: string | null;
  metadataUsername: unknown;
  profileUsername?: string | null;
}): string {
  const metadataUsername = typeof input.metadataUsername === "string" ? input.metadataUsername.trim() : "";
  const fallbackEmailName = input.email?.split("@")[0]?.trim() || "";
  return input.profileUsername?.trim() || metadataUsername || fallbackEmailName || "Usuario";
}
