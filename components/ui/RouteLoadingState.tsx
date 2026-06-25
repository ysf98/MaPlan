type RouteLoadingStateProps = {
  description?: string;
  title?: string;
  variant?: "default" | "chat" | "map" | "plan";
};

function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-rose-100/80 ${className}`} />;
}

function HeaderPreview() {
  return (
    <div className="sticky top-0 z-10 border-b border-rose-100 bg-white/95 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto grid h-10 max-w-3xl grid-cols-3 items-center">
        <Pulse className="h-10 w-10" />
        <div className="justify-self-center">
          <Pulse className="h-6 w-28" />
        </div>
        <div className="justify-self-end">
          <Pulse className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

function BottomNavPreview() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rose-100 bg-white/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto grid h-14 max-w-3xl grid-cols-5 items-center gap-2">
        <Pulse className="mx-auto h-9 w-14 rounded-2xl" />
        <Pulse className="mx-auto h-9 w-14 rounded-2xl" />
        <Pulse className="mx-auto h-14 w-14 rounded-2xl bg-[#c6283a]/80" />
        <Pulse className="mx-auto h-9 w-14 rounded-2xl" />
        <Pulse className="mx-auto h-9 w-14 rounded-2xl" />
      </div>
    </div>
  );
}

function ListCardPreview() {
  return (
    <div className="rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_12px_30px_rgba(181,35,48,0.06)]">
      <div className="h-28 animate-pulse rounded-[22px] bg-gradient-to-br from-rose-100 via-rose-50 to-white" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Pulse className="h-6 w-3/4 rounded-xl" />
          <Pulse className="h-4 w-1/2 rounded-xl" />
          <Pulse className="h-7 w-24 rounded-full bg-amber-100/80" />
        </div>
        <Pulse className="h-10 w-16 rounded-full" />
      </div>
    </div>
  );
}

function DefaultPreview({ description, title }: { description: string; title: string }) {
  return (
    <div aria-label={title} className="min-h-screen bg-[#fff8f7] text-zinc-950">
      <HeaderPreview />
      <main className="mx-auto w-full max-w-3xl px-5 pb-32 pt-6">
        <p className="sr-only">{description}</p>
        <section className="space-y-6">
          <div className="space-y-3">
            <Pulse className="h-3 w-36 rounded-xl bg-[#c6283a]/20" />
            <Pulse className="h-9 w-56 rounded-2xl" />
            <Pulse className="h-4 w-72 max-w-full rounded-xl" />
          </div>
          <div className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-[0_12px_30px_rgba(181,35,48,0.06)]">
            <Pulse className="h-5 w-28 rounded-xl" />
            <Pulse className="mt-3 h-4 w-full rounded-xl" />
            <Pulse className="mt-2 h-4 w-4/5 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Pulse className="h-7 w-40 rounded-xl" />
            <ListCardPreview />
            <ListCardPreview />
          </div>
        </section>
      </main>
      <BottomNavPreview />
    </div>
  );
}

function ChatPreview({ description, title }: { description: string; title: string }) {
  return (
    <div aria-label={title} className="min-h-screen bg-white text-zinc-950">
      <HeaderPreview />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 pb-28 pt-4">
        <p className="sr-only">{description}</p>
        <div className="space-y-4">
          <div className="mr-10 rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_12px_30px_rgba(181,35,48,0.06)]">
            <Pulse className="h-3 w-24 rounded-xl bg-[#c6283a]/20" />
            <Pulse className="mt-4 h-5 w-48 rounded-xl" />
            <Pulse className="mt-5 h-3 w-full rounded-xl" />
            <Pulse className="mt-2 h-3 w-3/4 rounded-xl" />
          </div>
          <div className="ml-auto w-44 rounded-[24px] border border-rose-100 bg-[#fff0ef] p-4 shadow-sm">
            <Pulse className="h-3 w-24 rounded-xl bg-[#c6283a]/20" />
            <Pulse className="mt-3 h-4 w-full rounded-xl" />
            <Pulse className="mt-2 h-4 w-2/3 rounded-xl" />
          </div>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 border-t border-rose-100 bg-white/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Pulse className="h-12 w-12 rounded-2xl" />
          <Pulse className="h-12 flex-1 rounded-2xl" />
          <Pulse className="h-12 w-20 rounded-2xl bg-[#ff5a5f]/60" />
        </div>
      </div>
    </div>
  );
}

function MapPreview({ description, title }: { description: string; title: string }) {
  return (
    <div aria-label={title} className="min-h-screen bg-[#fff8f7] text-zinc-950">
      <HeaderPreview />
      <p className="sr-only">{description}</p>
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#edf0ea]">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute left-[-4rem] top-24 h-2 w-[32rem] rotate-12 rounded-full bg-white/80" />
          <div className="absolute right-[-8rem] top-56 h-2 w-[36rem] -rotate-12 rounded-full bg-white/80" />
          <div className="absolute bottom-40 left-[-6rem] h-2 w-[30rem] -rotate-6 rounded-full bg-white/80" />
          <div className="absolute left-12 top-12 h-24 w-40 rounded-full bg-emerald-100/70 blur-2xl" />
          <div className="absolute bottom-32 right-8 h-32 w-44 rounded-full bg-sky-100/80 blur-2xl" />
        </div>
        <Pulse className="absolute left-12 top-28 h-12 w-12 rounded-full bg-[#c6283a]/80 shadow-lg" />
        <Pulse className="absolute right-14 top-56 h-12 w-12 rounded-full bg-emerald-700/80 shadow-lg" />
        <Pulse className="absolute bottom-48 left-1/2 h-12 w-12 rounded-full bg-teal-500/80 shadow-lg" />
        <div className="absolute inset-x-5 bottom-24 rounded-[30px] border border-rose-100 bg-white p-5 shadow-[0_18px_45px_rgba(181,35,48,0.12)]">
          <Pulse className="h-3 w-24 rounded-xl bg-[#c6283a]/20" />
          <Pulse className="mt-3 h-7 w-44 rounded-2xl" />
          <Pulse className="mt-3 h-4 w-64 max-w-full rounded-xl" />
        </div>
      </main>
      <BottomNavPreview />
    </div>
  );
}

function PlanPreview({ description, title }: { description: string; title: string }) {
  return (
    <div aria-label={title} className="min-h-screen bg-[#fff8f7] text-zinc-950">
      <HeaderPreview />
      <p className="sr-only">{description}</p>
      <main className="pb-32">
        <div className="relative h-[360px] overflow-hidden bg-[#edf0ea]">
          <div className="absolute inset-0 opacity-80">
            <div className="absolute left-[-5rem] top-20 h-2 w-[32rem] rotate-12 rounded-full bg-white/80" />
            <div className="absolute right-[-8rem] top-52 h-2 w-[36rem] -rotate-12 rounded-full bg-white/80" />
          </div>
          <Pulse className="absolute left-12 top-12 h-14 w-14 rounded-full bg-[#c6283a]/80" />
          <Pulse className="absolute bottom-10 right-10 h-14 w-14 rounded-full bg-emerald-700/80" />
          <div className="absolute inset-x-5 bottom-5 rounded-[30px] border border-rose-100 bg-white p-5 shadow-[0_18px_45px_rgba(181,35,48,0.12)]">
            <Pulse className="h-3 w-24 rounded-xl bg-[#c6283a]/20" />
            <Pulse className="mt-3 h-7 w-36 rounded-2xl" />
            <Pulse className="mt-3 h-4 w-56 rounded-xl" />
          </div>
        </div>
        <section className="mx-auto mt-6 w-full max-w-3xl px-5">
          <Pulse className="h-8 w-32 rounded-2xl" />
          <div className="mt-5 space-y-4">
            <ListCardPreview />
            <ListCardPreview />
          </div>
        </section>
      </main>
      <BottomNavPreview />
    </div>
  );
}

export function RouteLoadingState({
  description = "Preparando la vista.",
  title = "Cargando MaPlan",
  variant = "default"
}: RouteLoadingStateProps) {
  if (variant === "chat") {
    return <ChatPreview description={description} title={title} />;
  }

  if (variant === "map") {
    return <MapPreview description={description} title={title} />;
  }

  if (variant === "plan") {
    return <PlanPreview description={description} title={title} />;
  }

  return <DefaultPreview description={description} title={title} />;
}
