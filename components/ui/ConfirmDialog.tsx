"use client";

import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Si",
  cancelLabel = "Cancelar",
  isPending = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 px-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_18px_45px_rgba(24,24,27,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-base font-bold text-zinc-900">{title}</h3>
        {description ? <p className="mt-2 text-sm text-zinc-600">{description}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button disabled={isPending} onClick={onCancel} size="sm" type="button" variant="ghost">
            {cancelLabel}
          </Button>
          <Button disabled={isPending} onClick={onConfirm} size="sm" type="button" variant="danger">
            {isPending ? "Procesando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

