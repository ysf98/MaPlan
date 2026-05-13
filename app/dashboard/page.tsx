import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Resumen social de tus grupos, pendientes y favoritos.</p>
        </Card>
        <EmptyState
          title="Tu actividad aparecera aqui"
          description="En el siguiente paso conectaremos datos reales para mostrar ultimos lugares, favoritos y visitas."
        />
      </section>
    </AppShell>
  );
}
