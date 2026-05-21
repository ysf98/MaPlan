import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { APP_NAME, ROUTES } from "@/utils/constants";

export default function LandingPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl border-rose-100 bg-white p-8 shadow-[0_14px_35px_rgba(198,40,58,0.12)] sm:p-10">
          <CategoryBadge label="Social map app" tone="plan" />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">{APP_NAME}</h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-600 sm:text-base">
            Comparte recomendaciones con tu grupo y descubre planes en un mapa colaborativo disenado para salir mas y decidir
            rapido.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={ROUTES.register}>
              <Button size="lg">Crear cuenta</Button>
            </Link>
            <Link href={ROUTES.login}>
              <Button size="lg" variant="secondary">
                Iniciar sesion
              </Button>
            </Link>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl">
            <p className="text-sm text-zinc-500">Crea grupos</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">Tu circulo, tus lugares</h2>
          </Card>
          <Card className="rounded-3xl">
            <p className="text-sm text-zinc-500">Guarda planes</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">Mapa y lista en una sola vista</h2>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
