import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <Card className="rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-500">Unete a tus amigos y organiza planes juntos.</p>
          <form className="mt-6 space-y-4">
            <Input label="Nombre" placeholder="Tu nombre" />
            <Input label="Email" type="email" placeholder="tu@email.com" />
            <Input label="Contrasena" type="password" placeholder="********" />
            <Button fullWidth>Registrarme</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
