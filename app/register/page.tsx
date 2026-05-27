import { RegisterForm } from "@/components/auth/RegisterForm";
import { APP_NAME } from "@/utils/constants";

function CompassGlyph({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 4.4 19.6 12 12 19.6 4.4 12Z" fill="currentColor" />
      <path d="M12 8.1 15.9 12 12 15.9 10.4 12Z" fill="white" />
    </svg>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#fff8f7] text-zinc-900">
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-center border-b border-zinc-200/60 bg-[#fff8f7]/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[rgb(var(--vc-coral))]">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
              <CompassGlyph className="h-2.5 w-2.5 text-[rgb(var(--vc-coral))]" />
            </span>
          </span>
          <p className="text-[26px] font-extrabold leading-none tracking-tight text-[rgb(var(--vc-coral))]">{APP_NAME}</p>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(62%_52%_at_88%_12%,rgba(255,90,95,0.18),transparent_72%),radial-gradient(66%_56%_at_12%_86%,rgba(56,189,248,0.15),transparent_70%)] sm:bg-[radial-gradient(62%_52%_at_88%_12%,rgba(255,90,95,0.28),transparent_72%),radial-gradient(66%_56%_at_12%_86%,rgba(56,189,248,0.24),transparent_70%)]" />
        <div className="absolute -right-40 -top-36 h-[34rem] w-[34rem] rounded-full bg-[rgb(var(--vc-coral))]/20 blur-3xl sm:bg-[rgb(var(--vc-coral))]/30" />
        <div className="absolute -left-44 top-[56%] h-[34rem] w-[34rem] rounded-full bg-sky-400/18 blur-3xl sm:bg-sky-400/28" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-24">

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
