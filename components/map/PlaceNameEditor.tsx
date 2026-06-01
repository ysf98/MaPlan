"use client";

import { Button } from "@/components/ui/Button";

type PlaceNameEditorProps = {
  imageUrl?: string | null;
  imageAlt: string;
  title?: string;
  nameValue: string;
  isPending: boolean;
  error?: string | null;
  onNameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function PlaceNameEditor({
  imageUrl,
  imageAlt,
  title = "Editar nombre antes de guardar",
  nameValue,
  isPending,
  error,
  onNameChange,
  onSave,
  onCancel
}: PlaceNameEditorProps) {
  return (
    <div>
      {imageUrl ? (
        <div className="mb-2 h-28 w-full overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <img alt={imageAlt} className="h-full w-full object-cover" src={imageUrl} />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <div className="mt-2 space-y-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-700">Nombre</span>
          <input
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-950"
            maxLength={120}
            onChange={(event) => onNameChange(event.target.value)}
            value={nameValue}
          />
        </label>
        <div className="mt-2 flex items-center">
          <Button disabled={isPending} onClick={onSave} size="sm" type="button">
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
          <Button className="ml-auto" onClick={onCancel} size="sm" type="button" variant="secondary">
            Cancelar
          </Button>
        </div>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

