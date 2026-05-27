import { LoginForm } from "@/components/auth/LoginForm";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME, ROUTES } from "@/utils/constants";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const nextParam = resolvedSearchParams.next;
  const nextPath = typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : ROUTES.dashboard;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#fff8f7] text-zinc-900">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(62%_52%_at_88%_12%,rgba(255,90,95,0.18),transparent_72%),radial-gradient(66%_56%_at_12%_86%,rgba(56,189,248,0.15),transparent_70%)] sm:bg-[radial-gradient(62%_52%_at_88%_12%,rgba(255,90,95,0.28),transparent_72%),radial-gradient(66%_56%_at_12%_86%,rgba(56,189,248,0.24),transparent_70%)]" />
        <div className="absolute -right-40 -top-36 h-[34rem] w-[34rem] rounded-full bg-[rgb(var(--vc-coral))]/20 blur-3xl sm:bg-[rgb(var(--vc-coral))]/30" />
        <div className="absolute -left-44 top-[56%] h-[34rem] w-[34rem] rounded-full bg-sky-400/18 blur-3xl sm:bg-sky-400/28" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-10">
        <header className="mb-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <MaplanMinimalIcon size="md" />
            <h1 className="text-4xl font-extrabold tracking-tight text-[rgb(var(--vc-coral))]">{APP_NAME}</h1>
          </div>
        </header>

        <section className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">Bienvenido de nuevo</h2>
          <p className="mt-1 text-sm text-zinc-600">Explora y comparte tus lugares favoritos.</p>
        </section>

        <LoginForm nextPath={nextPath} />

        <div className="mt-auto pb-2 pt-8">
          <div className="relative h-28 w-full overflow-hidden rounded-3xl border border-white/50 shadow-[0_14px_34px_rgba(181,35,48,0.14)]">
            <img alt="Mapa urbano" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7C5cXaaNvZeU5QSDrUf4tNpfeWCQBIFFgDWot6QADL74k1aVpOp5QNaisY18JED8EZ1733vvIY37m9VWE1lIJrwc4YNCyBuXQ1MvWBzl1RJpOS5EJgrl_9JfvgdeW6s6xIgqg2znE22MKhsPAF80Rc6JhJyAngIN1T5EgmhccTQSQAYvZyhBMaxQey2KUTfJBnpItmQDWTXyE9YWK8gi23406VXCy7TReLyCJeO6ySqujrVhBoBOftoJkYBl_az12shi4EURXf3E" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--vc-coral))]/45 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <span className="text-xs font-semibold">Descubre rutas en tu ciudad</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 7h18" />
                <path d="M6 3v4" />
                <path d="M18 3v4" />
                <rect height="14" rx="2" width="18" x="3" y="7" />
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
