import { getUserGroups } from "@/lib/groups";

export type SaveDestination =
  | {
      type: "personal";
      id: "personal";
      label: "Mapa personal";
      description: "Solo visible para ti";
    }
  | {
      type: "group";
      id: string;
      label: string;
      description: string;
    };

export async function getPlaceSaveDestinationsForUser(userId: string): Promise<SaveDestination[]> {
  const groups = await getUserGroups(userId);
  const editableGroups = groups.filter((group) => group.role === "owner" || group.privacy === "abierto");

  return [
    {
      type: "personal",
      id: "personal",
      label: "Mapa personal",
      description: "Solo visible para ti"
    },
    ...editableGroups.map((group) => ({
      type: "group" as const,
      id: group.id,
      label: group.name,
      description: group.role === "owner" ? "Grupo administrado por ti" : "Grupo abierto"
    }))
  ];
}
