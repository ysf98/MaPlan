import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <Card className="rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesion</h1>
          <p className="mt-2 text-sm text-slate-500">Accede a tus grupos y mapas compartidos.</p>
          <LoginForm />
        </Card>
      </div>
    </AppShell>
  );
}
