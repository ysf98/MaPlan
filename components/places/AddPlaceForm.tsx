"use client";

import { useActionState, useEffect } from "react";
import { addPlaceAction } from "@/app/groups/[groupId]/actions";
import type { AddPlaceActionState } from "@/app/groups/[groupId]/actions";
import { INITIAL_PLACE_CATEGORIES } from "@/lib/places/shared";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type AddPlaceFormProps = {
  groupId: string;
};

const addPlaceInitialState: AddPlaceActionState = {
  error: null,
  success: false
};

export function AddPlaceForm({ groupId }: AddPlaceFormProps) {
  const [state, formAction, isPending] = useActionState(addPlaceAction, addPlaceInitialState);

  useEffect(() => {
    if (state.success) {
      const form = document.getElementById("add-place-form") as HTMLFormElement | null;
      form?.reset();
    }
  }, [state.success]);

  return (
    <Card className="rounded-3xl">
      <h2 className="text-lg font-semibold text-slate-900">Anadir lugar</h2>
      <form action={formAction} className="mt-4 space-y-4" id="add-place-form">
        <fieldset className="space-y-4" disabled={isPending}>
          <input name="groupId" type="hidden" value={groupId} />
          <Input label="Nombre" name="name" placeholder="Ej. La Bicicleta Cafe" required />
          <Input label="Direccion" name="address" placeholder="Ej. Calle del Pez, 12" required />
          <Input label="Ciudad / poblacion (opcional)" name="city" placeholder="Ej. Madrid" />
          <Input
            label="Enlace original (opcional)"
            name="originalUrl"
            placeholder="https://..."
            type="url"
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Fuente (opcional)</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              defaultValue=""
              name="source"
            >
              <option value="">Sin especificar</option>
              <option value="manual">Manual</option>
              <option value="google_maps">Google Maps</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="website">Website</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              defaultValue="Otros"
              name="category"
            >
              {INITIAL_PLACE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Notas (opcional)</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              name="notes"
              placeholder="Por que lo recomiendas, que pedir, mejor horario, etc."
            />
          </label>

          {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-600">Lugar guardado correctamente.</p> : null}

          <Button disabled={isPending} type="submit">
            {isPending ? "Guardando..." : "Guardar lugar"}
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}
