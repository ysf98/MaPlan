import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CreateGroupForm } from "@/components/groups/CreateGroupForm";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";

export default async function NewGroupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups/new");
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Crear nuevo grupo</h1>
          <p className="mt-1 text-sm text-zinc-500">Configura el grupo y empieza a compartir lugares.</p>
        </Card>
        <Card className="rounded-3xl">
          <CreateGroupForm />
        </Card>
      </section>
    </AppShell>
  );
}
