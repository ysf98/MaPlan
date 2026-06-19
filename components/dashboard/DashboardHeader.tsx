import Link from "next/link";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { BackButton } from "@/components/navigation/BackButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { APP_NAME, ROUTES } from "@/utils/constants";

type DashboardHeaderProps = {
  avatarUrl: string | null;
  backHref?: string;
  currentUserId: string;
  displayName: string;
  notificationsCount: number;
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "M";
}

export function DashboardHeader({
  avatarUrl,
  backHref,
  currentUserId,
  displayName,
  notificationsCount
}: DashboardHeaderProps) {
  return (
    <header className="vc-glass sticky top-0 z-20 border-b border-[rgb(var(--border)/0.55)]">
      <div className="mx-auto grid h-16 w-full max-w-3xl grid-cols-3 items-center px-[20px]">
        <div className="flex min-w-24 justify-start">
          {backHref ? (
            <BackButton fallbackHref={backHref} />
          ) : (
            <ProfileLink avatarUrl={avatarUrl} displayName={displayName} />
          )}
        </div>
        <Link
          className="justify-self-center inline-flex items-center gap-2 text-lg font-bold tracking-tight text-[rgb(var(--primary-strong))]"
          href={ROUTES.dashboard}
          prefetch={false}
        >
          <MaplanMinimalIcon size="sm" />
          <span>{APP_NAME}</span>
        </Link>
        <div className="flex min-w-24 justify-end gap-2">
          {backHref ? <ProfileLink avatarUrl={avatarUrl} displayName={displayName} /> : null}
          <NotificationBell currentUserId={currentUserId} initialCount={notificationsCount} />
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
