import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/utils/constants";

const demoGroups = [
  { id: "madrid-friends", name: "Madrid Friends", category: "Foodies" },
  { id: "foodie-team", name: "Foodie Team", category: "Weekend" }
];

export default function GroupsPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tus grupos</h1>
              <p className="mt-1 text-sm text-slate-500">Espacios compartidos para guardar y descubrir planes.</p>
            </div>
            <Button variant="secondary">Nuevo grupo</Button>
          </div>
        </Card>

        <ul className="grid gap-3 sm:grid-cols-2">
          {demoGroups.map((group, index) => (
            <li key={group.id}>
              <Link href={`${ROUTES.groups}/${group.id}`}>
                <Card className="rounded-3xl transition hover:-translate-y-0.5 hover:shadow-md">
                  <CategoryBadge label={group.category} tone={index === 0 ? "food" : "plan"} />
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{group.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">Ver recomendaciones y mapa colaborativo</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        <EmptyState
          title="Aun no hay invitaciones"
          description="Cuando alguien te invite a un grupo, lo veras aqui para unirte con un toque."
          action={<Button variant="ghost">Explorar demo</Button>}
        />
      </section>
    </AppShell>
  );
}
