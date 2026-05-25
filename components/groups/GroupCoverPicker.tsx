"use client";

import { useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";

type GroupCoverPickerProps = {
  previewUrl: string | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: ReactNode;
  helperText?: string;
  actionSlot?: ReactNode;
  inputName?: string;
};

export function GroupCoverPicker({ previewUrl, onFileChange, placeholder, helperText, actionSlot, inputName }: GroupCoverPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="mx-auto flex w-fit items-start gap-3">
        <button
          className="group grid h-[86px] w-[86px] place-items-center overflow-hidden rounded-full border border-zinc-100 bg-rose-50 shadow-[0_8px_20px_rgba(198,40,58,0.1)]"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {previewUrl ? <img alt="" className="h-full w-full object-cover" src={previewUrl} /> : placeholder}
        </button>
        <input accept="image/*" className="hidden" name={inputName} onChange={onFileChange} ref={fileInputRef} type="file" />
        {actionSlot ? <div className="pt-1">{actionSlot}</div> : null}
      </div>
      {helperText ? <p className="text-center text-[11px] font-medium text-zinc-500">{helperText}</p> : null}
    </>
  );
}
