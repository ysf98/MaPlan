"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { updateProfileAction, type UpdateProfileActionState } from "@/app/profile/actions";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProfileAchievement, ProfileAchievementId, ProfileAchievementLevel } from "@/lib/profileAchievements";
import { ROUTES } from "@/utils/constants";

type ProfileViewProps = {
  achievements: ProfileAchievement[];
  initialAvatarUrl: string | null;
  initialFullName: string;
  handle: string;
  stats: {
    places: number;
    groups: number;
    favorites: number;
  };
  quickLists: {
    favorites: number;
    toVisit: number;
    history: number;
  };
};

const initialState: UpdateProfileActionState = { error: null, success: false };

type AchievementStyle = {
  card: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  track: string;
  bar: string;
  meta: string;
};

const achievementStyles: Record<ProfileAchievementId, Record<ProfileAchievementLevel, AchievementStyle>> = {
  cartographer: {
    1: {
      card: "border border-rose-100 bg-rose-50/45",
      icon: "text-rose-400",
      title: "text-zinc-800",
      description: "text-zinc-500",
      badge: "bg-white/80 text-zinc-500",
      track: "bg-white/80",
      bar: "bg-rose-300",
      meta: "text-zinc-500"
    },
    2: {
      card: "border border-rose-100 bg-rose-50",
      icon: "text-[#c6283a]",
      title: "text-zinc-950",
      description: "text-zinc-600",
      badge: "bg-white/85 text-zinc-700",
      track: "bg-white/85",
      bar: "bg-[#c6283a]",
      meta: "text-zinc-700"
    },
    3: {
      card: "border border-rose-200 bg-rose-100 shadow-[0_12px_28px_rgba(198,40,58,0.12)]",
      icon: "text-[#a91f31]",
      title: "text-zinc-950",
      description: "text-zinc-700",
      badge: "bg-white text-[#a91f31]",
      track: "bg-white/90",
      bar: "bg-[#a91f31]",
      meta: "text-zinc-800"
    },
    4: {
      card: "border border-rose-300 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.45),rgba(255,255,255,0)_36%),linear-gradient(135deg,#3b0a12,#b52330_55%,#ff5a5f)] text-white shadow-[0_16px_36px_rgba(198,40,58,0.28)]",
      icon: "text-white",
      title: "text-white",
      description: "text-white/80",
      badge: "bg-white/95 text-[#9f1239]",
      track: "bg-white/25",
      bar: "bg-white",
      meta: "text-white/90"
    }
  },
  gourmet: {
    1: {
      card: "border border-amber-100 bg-amber-50/45",
      icon: "text-amber-400",
      title: "text-zinc-800",
      description: "text-zinc-500",
      badge: "bg-white/80 text-zinc-500",
      track: "bg-white/80",
      bar: "bg-amber-300",
      meta: "text-zinc-500"
    },
    2: {
      card: "border border-amber-100 bg-amber-50",
      icon: "text-amber-700",
      title: "text-zinc-950",
      description: "text-zinc-600",
      badge: "bg-white/85 text-zinc-700",
      track: "bg-white/85",
      bar: "bg-amber-500",
      meta: "text-zinc-700"
    },
    3: {
      card: "border border-amber-200 bg-amber-100 shadow-[0_12px_28px_rgba(245,158,11,0.14)]",
      icon: "text-amber-700",
      title: "text-zinc-950",
      description: "text-zinc-700",
      badge: "bg-white text-amber-700",
      track: "bg-white/90",
      bar: "bg-amber-600",
      meta: "text-zinc-800"
    },
    4: {
      card: "border border-amber-300 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.48),rgba(255,255,255,0)_36%),linear-gradient(135deg,#78350f,#f59e0b_55%,#fde047)] text-white shadow-[0_16px_36px_rgba(245,158,11,0.3)]",
      icon: "text-white",
      title: "text-white",
      description: "text-white/80",
      badge: "bg-white/95 text-amber-700",
      track: "bg-white/25",
      bar: "bg-white",
      meta: "text-white/90"
    }
  },
  naturalist: {
    1: {
      card: "border border-emerald-100 bg-emerald-50/45",
      icon: "text-emerald-400",
      title: "text-zinc-800",
      description: "text-zinc-500",
      badge: "bg-white/80 text-zinc-500",
      track: "bg-white/80",
      bar: "bg-emerald-300",
      meta: "text-zinc-500"
    },
    2: {
      card: "border border-emerald-100 bg-emerald-50",
      icon: "text-emerald-700",
      title: "text-zinc-950",
      description: "text-zinc-600",
      badge: "bg-white/85 text-zinc-700",
      track: "bg-white/85",
      bar: "bg-emerald-500",
      meta: "text-zinc-700"
    },
    3: {
      card: "border border-emerald-200 bg-emerald-100 shadow-[0_12px_28px_rgba(16,185,129,0.14)]",
      icon: "text-emerald-700",
      title: "text-zinc-950",
      description: "text-zinc-700",
      badge: "bg-white text-emerald-700",
      track: "bg-white/90",
      bar: "bg-emerald-600",
      meta: "text-zinc-800"
    },
    4: {
      card: "border border-emerald-300 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.48),rgba(255,255,255,0)_36%),linear-gradient(135deg,#064e3b,#059669_55%,#34d399)] text-white shadow-[0_16px_36px_rgba(16,185,129,0.3)]",
      icon: "text-white",
      title: "text-white",
      description: "text-white/80",
      badge: "bg-white/95 text-emerald-700",
      track: "bg-white/25",
      bar: "bg-white",
      meta: "text-white/90"
    }
  },
  athlete: {
    1: {
      card: "border border-blue-100 bg-blue-50/45",
      icon: "text-blue-400",
      title: "text-zinc-800",
      description: "text-zinc-500",
      badge: "bg-white/80 text-zinc-500",
      track: "bg-white/80",
      bar: "bg-blue-300",
      meta: "text-zinc-500"
    },
    2: {
      card: "border border-blue-100 bg-blue-50",
      icon: "text-blue-700",
      title: "text-zinc-950",
      description: "text-zinc-600",
      badge: "bg-white/85 text-zinc-700",
      track: "bg-white/85",
      bar: "bg-blue-500",
      meta: "text-zinc-700"
    },
    3: {
      card: "border border-blue-200 bg-blue-100 shadow-[0_12px_28px_rgba(59,130,246,0.14)]",
      icon: "text-blue-700",
      title: "text-zinc-950",
      description: "text-zinc-700",
      badge: "bg-white text-blue-700",
      track: "bg-white/90",
      bar: "bg-blue-600",
      meta: "text-zinc-800"
    },
    4: {
      card: "border border-blue-300 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.48),rgba(255,255,255,0)_36%),linear-gradient(135deg,#172554,#2563eb_55%,#60a5fa)] text-white shadow-[0_16px_36px_rgba(59,130,246,0.3)]",
      icon: "text-white",
      title: "text-white",
      description: "text-white/80",
      badge: "bg-white/95 text-blue-700",
      track: "bg-white/25",
      bar: "bg-white",
      meta: "text-white/90"
    }
  }
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function StatCard({ href, label, value, valueClassName }: { href: string; label: string; value: number; valueClassName: string }) {
  return (
    <Link className="rounded-2xl border border-rose-100 bg-rose-50/55 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50" href={href}>
      <p className={`text-3xl font-bold leading-none ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-600">{label}</p>
    </Link>
  );
}

function AchievementCard({ achievement }: { achievement: ProfileAchievement }) {
  const style = achievementStyles[achievement.id][achievement.level];

  return (
    <article className={`rounded-2xl px-3 py-3 transition ${style.card}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xl font-bold leading-none ${style.icon}`}>{achievement.iconLetter}</p>
          <p className={`mt-1 truncate text-sm font-bold ${style.title}`}>{achievement.title}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${style.badge}`}>
          Nivel {achievement.level}
        </span>
      </div>
      <p className={`mt-2 truncate text-[11px] font-medium ${style.description}`}>{achievement.description}</p>
      <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${style.track}`}>
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${achievement.progressPercent}%` }} />
      </div>
      <div className={`mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold ${style.meta}`}>
        <span>{achievement.count} lugares</span>
        <span>{achievement.nextTarget ? `${achievement.count}/${achievement.nextTarget}` : "Máximo"}</span>
      </div>
    </article>
  );
}

export function ProfileView({ achievements, initialAvatarUrl, initialFullName, handle, quickLists, stats }: ProfileViewProps) {
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [avatarValue, setAvatarValue] = useState(initialAvatarUrl || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.success) {
      setIsEditOpen(false);
    }
  }, [state.success]);

  const coverStats = useMemo(
    () => [
      { href: `${ROUTES.profilePlaces}?filter=all`, label: "Lugares", value: stats.places, valueClassName: "text-[#c6283a]" },
      { href: ROUTES.groups, label: "Grupos", value: stats.groups, valueClassName: "text-[#1d4ed8]" },
      { href: `${ROUTES.profilePlaces}?filter=favorites`, label: "Favoritos", value: stats.favorites, valueClassName: "text-[#15803d]" }
    ],
    [stats.favorites, stats.groups, stats.places]
  );

  function onAvatarChange(file?: File) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setAvatarError("La imagen es demasiado pesada. Maximo 2MB.");
      return;
    }
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarValue(result);
      setAvatarPreview(result || null);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="space-y-5">
      <Card className="rounded-[2rem] border-rose-100 p-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full border-[3px] border-[#d84d5d] bg-rose-50 shadow-[0_10px_26px_rgba(198,40,58,0.2)]">
              {avatarPreview ? (
                <img alt={`Avatar de ${initialFullName}`} className="h-full w-full object-cover" src={avatarPreview} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#c6283a]">{getInitial(initialFullName)}</div>
              )}
            </div>
            <button
              aria-label="Editar perfil"
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-[#c6283a] text-white shadow-lg transition hover:bg-[#a91f31]"
              onClick={() => setIsEditOpen(true)}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="m4 20 3.5-.7L18.6 8.2a1.8 1.8 0 0 0 0-2.6l-.2-.2a1.8 1.8 0 0 0-2.6 0L4.7 16.5 4 20Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
                <path d="m13.9 7.3 2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
            </button>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">{initialFullName}</h1>
          <p className="text-sm text-zinc-500">@{handle}</p>
          <Button className="mt-4 w-full max-w-sm rounded-xl" onClick={() => setIsEditOpen(true)} size="lg" type="button">
            Editar Perfil
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {coverStats.map((item) => (
          <StatCard href={item.href} key={item.label} label={item.label} value={item.value} valueClassName={item.valueClassName} />
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Mis Listas Rapidas</h2>
          <Link className="text-sm font-medium text-[#c6283a] transition hover:text-[#a91f31]" href={`${ROUTES.profilePlaces}?filter=all`}>
            Ver todas
          </Link>
        </div>

        <Link className="relative block overflow-hidden rounded-3xl border border-zinc-100 p-5 text-white shadow-sm transition hover:-translate-y-0.5" href={`${ROUTES.profilePlaces}?filter=favorites`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),rgba(0,0,0,0)_42%),linear-gradient(130deg,#2f0b0d,#871827_55%,#ce3b43)]" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative">
            <p className="text-2xl font-bold">Favoritos</p>
            <p className="text-sm text-white/90">{quickLists.favorites} lugares seleccionados</p>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link className="relative overflow-hidden rounded-3xl border border-zinc-100 p-4 text-white shadow-sm transition hover:-translate-y-0.5" href={`${ROUTES.profilePlaces}?filter=pending`}>
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#222b61,#3b82f6_45%,#e2e8f0)]" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative">
              <p className="text-lg font-bold">Por visitar</p>
              <p className="text-xs text-white/90">{quickLists.toVisit} pendientes</p>
            </div>
          </Link>
          <Link className="relative overflow-hidden rounded-3xl border border-zinc-100 p-4 text-white shadow-sm transition hover:-translate-y-0.5" href={`${ROUTES.profilePlaces}?filter=visited`}>
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#485563,#29323c_55%,#7f8c8d)]" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative">
              <p className="text-lg font-bold">Historial</p>
              <p className="text-xs text-white/90">{quickLists.history} visitados</p>
            </div>
          </Link>
        </div>
      </section>

      <Card className="rounded-3xl border-rose-100 bg-rose-50/45">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Logros de Explorador</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {achievements.map((achievement) => (
            <AchievementCard achievement={achievement} key={achievement.id} />
          ))}
        </div>
      </Card>

      <Card className="rounded-3xl">
        <p className="text-sm text-zinc-500">Sesion</p>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </Card>

      {isEditOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/45 p-4">
          <form
            action={formAction}
            className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_18px_45px_rgba(24,24,27,0.14)]"
          >
            <div className="relative flex items-center justify-center">
              <button
                aria-label="Cerrar"
                className="absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                onClick={() => setIsEditOpen(false)}
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-bold text-zinc-950">Editar perfil</h3>
            </div>

            <input name="avatarUrl" type="hidden" value={avatarValue} />
            <label className="mx-auto block w-fit cursor-pointer">
              <input accept="image/*" className="sr-only" onChange={(event) => onAvatarChange(event.target.files?.[0])} type="file" />
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border border-rose-100 bg-rose-50">
                {avatarPreview ? (
                  <img alt={`Avatar de ${initialFullName}`} className="h-full w-full object-cover" src={avatarPreview} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#c6283a]">{getInitial(initialFullName)}</div>
                )}
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-zinc-700">Nombre</span>
              <input
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                defaultValue={initialFullName}
                maxLength={80}
                name="fullName"
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-zinc-700">@usuario</span>
              <input
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                defaultValue={handle}
                maxLength={30}
                name="username"
                pattern="[A-Za-z0-9_.-]+"
                required
              />
            </label>

            {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
            {avatarError ? <p className="text-sm text-rose-600">{avatarError}</p> : null}
            {state.success ? <p className="text-sm text-emerald-600">Perfil actualizado.</p> : null}

            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditOpen(false)} size="sm" type="button" variant="ghost">
                Cancelar
              </Button>
              <Button disabled={isPending} size="sm" type="submit">
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
