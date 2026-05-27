import Link from "next/link";
import { APP_NAME, ROUTES } from "@/utils/constants";

type DashboardHeaderProps = {
  avatarUrl: string | null;
  backHref?: string;
  displayName: string;
  hasNotifications: boolean;
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "M";
}

export function DashboardHeader({ avatarUrl, backHref, displayName, hasNotifications }: DashboardHeaderProps) {
  return (
    <header className="vc-glass sticky top-0 z-20 border-b border-[rgb(var(--border)/0.55)]">
      <div className="mx-auto grid h-16 w-full max-w-3xl grid-cols-3 items-center px-[20px]">
        <div className="flex min-w-24 justify-start">
          {backHref ? (
            <Link
              aria-label="Volver"
              className="grid h-10 w-10 place-items-center rounded-full text-[rgb(var(--primary-strong))] transition hover:bg-[rgb(var(--surface-soft))]"
              href={backHref}
              prefetch={false}
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M15 6 9 12l6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </Link>
          ) : (
            <ProfileLink avatarUrl={avatarUrl} displayName={displayName} />
          )}
        </div>
        <Link className="justify-self-center text-lg font-bold tracking-tight text-[rgb(var(--primary-strong))]" href={ROUTES.dashboard} prefetch={false}>
          {APP_NAME}
        </Link>
        <div className="flex min-w-24 justify-end gap-2">
          {backHref ? <ProfileLink avatarUrl={avatarUrl} displayName={displayName} /> : null}
          <Link
            aria-label="Notificaciones"
            className="relative grid h-10 w-10 place-items-center rounded-full text-[rgb(var(--primary-strong))] transition hover:bg-[rgb(var(--ring))]"
            href={ROUTES.notifications}
            prefetch={false}
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 5a5 5 0 0 0-5 5v2.8c0 .6-.2 1.2-.5 1.7L5.6 16c-.4.8.1 1.7 1 1.7h10.8c.9 0 1.4-.9 1-1.7l-.9-1.5c-.3-.5-.5-1.1-.5-1.7V10a5 5 0 0 0-5-5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path d="M10 19a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
            {hasNotifications ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[rgb(var(--primary-strong))] ring-2 ring-white" /> : null}
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProfileLink({ avatarUrl, displayName }: { avatarUrl: string | null; displayName: string }) {
  return (
    <Link
      aria-label="Ir al perfil"
      className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface-soft))] text-sm font-semibold text-[rgb(var(--primary-strong))] shadow-sm"
      href={ROUTES.profile}
      prefetch={false}
    >
      {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : getInitial(displayName)}
    </Link>
  );
}
