import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupDetailForUser } from "@/lib/groups";
import { notFound, redirect } from "next/navigation";

type GroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const { groupId } = await params;
  const group = await getGroupDetailForUser(user.id, groupId);

  if (!group) {
    notFound();
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone="visit" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{group.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{group.description || "Grupo sin descripcion"}</p>
          <p className="mt-2 text-xs text-slate-500">Codigo de invitacion: {group.joinCode}</p>
        </Card>

        <EmptyState
          title="Todavia no hay lugares"
          description="Empieza agregando el primer sitio recomendado para que tu grupo pueda verlo en lista y en mapa."
          action={<Button>Anadir lugar</Button>}
        />
      </section>
    </AppShell>
  );
}
