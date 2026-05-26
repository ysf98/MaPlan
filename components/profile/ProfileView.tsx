"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updateProfileAction, type UpdateProfileActionState } from "@/app/profile/actions";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ProfileViewProps = {
  initialAvatarUrl: string | null;
  initialUsername: string;
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

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function StatCard({ label, value, valueClassName }: { label: string; value: number; valueClassName: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/55 px-3 py-4 text-center">
      <p className={`text-3xl font-bold leading-none ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-600">{label}</p>
    </div>
  );
}

export function ProfileView({ initialAvatarUrl, initialUsername, handle, quickLists, stats }: ProfileViewProps) {
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
      { label: "Lugares", value: stats.places, valueClassName: "text-[#c6283a]" },
      { label: "Grupos", value: stats.groups, valueClassName: "text-[#1d4ed8]" },
      { label: "Favoritos", value: stats.favorites, valueClassName: "text-[#15803d]" }
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
                <img alt={`Avatar de ${initialUsername}`} className="h-full w-full object-cover" src={avatarPreview} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#c6283a]">{getInitial(initialUsername)}</div>
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

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">{initialUsername}</h1>
          <p className="text-sm text-zinc-500">@{handle}</p>
          <Button className="mt-4 w-full max-w-sm rounded-xl" onClick={() => setIsEditOpen(true)} size="lg" type="button">
            Editar Perfil
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {coverStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} valueClassName={item.valueClassName} />
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Mis Listas Rapidas</h2>
          <span className="text-sm font-medium text-[#c6283a]">Ver todas</span>
        </div>

        <article className="relative overflow-hidden rounded-3xl border border-zinc-100 p-5 text-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),rgba(0,0,0,0)_42%),linear-gradient(130deg,#2f0b0d,#871827_55%,#ce3b43)]" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative">
            <p className="text-2xl font-bold">Favoritos</p>
            <p className="text-sm text-white/90">{quickLists.favorites} lugares seleccionados</p>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-3">
          <article className="relative overflow-hidden rounded-3xl border border-zinc-100 p-4 text-white shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#222b61,#3b82f6_45%,#e2e8f0)]" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative">
              <p className="text-lg font-bold">Por visitar</p>
              <p className="text-xs text-white/90">{quickLists.toVisit} pendientes</p>
            </div>
          </article>
          <article className="relative overflow-hidden rounded-3xl border border-zinc-100 p-4 text-white shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#485563,#29323c_55%,#7f8c8d)]" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative">
              <p className="text-lg font-bold">Historial</p>
              <p className="text-xs text-white/90">{quickLists.history} visitados</p>
            </div>
          </article>
        </div>
      </section>

      <Card className="rounded-3xl border-rose-100 bg-rose-50/45">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Logros de Explorador</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/80 px-2 py-3 text-center">
            <p className="text-xl font-bold text-[#c6283a]">C</p>
            <p className="mt-1 text-xs font-semibold text-zinc-700">Cartografo</p>
          </div>
          <div className="rounded-2xl bg-zinc-100/80 px-2 py-3 text-center opacity-55">
            <p className="text-xl font-bold text-zinc-500">G</p>
            <p className="mt-1 text-xs font-semibold text-zinc-700">Gourmet</p>
          </div>
          <div className="rounded-2xl bg-emerald-100/80 px-2 py-3 text-center">
            <p className="text-xl font-bold text-emerald-700">N</p>
            <p className="mt-1 text-xs font-semibold text-zinc-700">Naturalista</p>
          </div>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-950">Editar perfil</h3>
              <Button onClick={() => setIsEditOpen(false)} size="sm" type="button" variant="ghost">
                Cerrar
              </Button>
            </div>

            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-rose-100 bg-rose-50">
              {avatarPreview ? (
                <img alt={`Avatar de ${initialUsername}`} className="h-full w-full object-cover" src={avatarPreview} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#c6283a]">{getInitial(initialUsername)}</div>
              )}
            </div>

            <input name="avatarUrl" type="hidden" value={avatarValue} />
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-zinc-700">Foto de perfil</span>
              <input
                accept="image/*"
                className="block w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#c6283a]"
                onChange={(event) => onAvatarChange(event.target.files?.[0])}
                type="file"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-zinc-700">Nombre</span>
              <input
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                defaultValue={initialUsername}
                maxLength={80}
                name="username"
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
