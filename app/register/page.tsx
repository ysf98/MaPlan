import { RegisterForm } from "@/components/auth/RegisterForm";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME } from "@/utils/constants";

export default function RegisterPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#fff8f7] text-zinc-900">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(62%_52%_at_88%_12%,rgba(255,90,95,0.18),transparent_72%),radial-gradient(66%_56%_at_12%_86%,rgba(56,189,248,0.15),transparent_70%)] sm:bg-[radial-gradient(62%_52%_at_88%_12%,rgba(255,90,95,0.28),transparent_72%),radial-gradient(66%_56%_at_12%_86%,rgba(56,189,248,0.24),transparent_70%)]" />
        <div className="absolute -right-40 -top-36 h-[34rem] w-[34rem] rounded-full bg-[rgb(var(--vc-coral))]/20 blur-3xl sm:bg-[rgb(var(--vc-coral))]/30" />
        <div className="absolute -left-44 top-[56%] h-[34rem] w-[34rem] rounded-full bg-sky-400/18 blur-3xl sm:bg-sky-400/28" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-10">
        <header className="mb-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <MaplanMinimalIcon size="md" />
            <h1 className="text-4xl font-extrabold tracking-tight text-[rgb(var(--vc-coral))]">{APP_NAME}</h1>
          </div>
        </header>

        <section className="relative z-10 p-1">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Crea tu cuenta</h1>
            <p className="mt-2 text-sm text-zinc-600">Unete a la red social de exploracion mas vibrante.</p>
          </div>

          <RegisterForm />
        </section>
      </main>
    </div>
  );
}
