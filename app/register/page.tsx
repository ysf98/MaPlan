import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <Card className="rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Crear cuenta</h1>
          <p className="mt-2 text-sm text-zinc-500">Unete a tus amigos y organiza planes juntos.</p>
          <RegisterForm />
        </Card>
      </div>
    </AppShell>
  );
}
