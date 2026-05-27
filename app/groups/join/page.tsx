import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { JoinGroupForm } from "@/components/groups/JoinGroupForm";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ROUTES } from "@/utils/constants";
import { redirect } from "next/navigation";

export default async function JoinGroupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups/join");
  }

  return (
    <AppShell backHref={ROUTES.groups} currentUser={user}>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Unirse a un grupo</h1>
          <p className="mt-1 text-sm text-zinc-500">Introduce el codigo para unirte o enviar solicitud.</p>
        </Card>
        <Card className="rounded-3xl">
          <JoinGroupForm />
        </Card>
      </section>
    </AppShell>
  );
}
