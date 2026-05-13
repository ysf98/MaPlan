import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type GroupDetailPageProps = {
  params: {
    groupId: string;
  };
};

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <CategoryBadge label="Group" tone="visit" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{params.groupId}</h1>
          <p className="mt-2 text-sm text-slate-500">Panel del grupo para lista de lugares, filtros y acciones sociales.</p>
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
