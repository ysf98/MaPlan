import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ className, label, hint, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-semibold text-[rgb(var(--muted))]">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-14 w-full rounded-2xl border border-transparent bg-[#f3f4f6] px-4 text-base text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] sm:text-sm",
          className
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-[rgb(var(--muted))]">{hint}</span> : null}
    </label>
  );
}
