import Link from "next/link";
import { ROUTES } from "@/utils/constants";

function MapCard({
  description,
  href,
  label,
  tone
}: {
  description: string;
  href: string;
  label: string;
  tone: "group" | "personal";
}) {
  const gradient =
    tone === "group"
      ? "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.45),rgba(255,255,255,0)_36%),linear-gradient(135deg,#2f0b0d,#871827_55%,#ce3b43)]"
      : "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.42),rgba(255,255,255,0)_36%),linear-gradient(135deg,#18223a,#2563eb_52%,#68abff)]";

  return (
    <Link
      className="group relative block min-h-40 overflow-hidden rounded-[28px] border border-rose-100 shadow-[0_16px_36px_rgba(181,35,48,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(181,35,48,0.18)]"
      href={href}
    >
      <div className={`absolute inset-0 ${gradient}`} />
      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />
      <div className="relative flex min-h-40 flex-col justify-between p-5 text-white">
        <div className="inline-flex w-fit rounded-full bg-white/18 px-3 py-1 text-xs font-bold backdrop-blur">
          Mapa
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{label}</h2>
          <p className="mt-1 max-w-xs text-sm font-medium text-white/85">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function MapsHubView() {
  return (
    <section>
      <div className="grid gap-3">
        <MapCard
          description="Abre tus grupos y entra en el mapa colaborativo de cada uno."
          href={ROUTES.groups}
          label="Mapas Grupales"
          tone="group"
        />
        <MapCard
          description="Consulta y organiza los sitios que has guardado solo para ti."
          href={ROUTES.map}
          label="Mapa Personal"
          tone="personal"
        />
      </div>
    </section>
  );
}
