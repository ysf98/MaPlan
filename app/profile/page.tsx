import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();

  const displayName = profile?.username?.trim() || user.user_metadata?.username || user.email || "Usuario";

  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <p className="text-sm text-slate-500">Nombre</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{displayName}</p>
        </Card>
      </section>
    </AppShell>
  );
}
