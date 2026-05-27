import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[rgb(var(--primary))] text-white shadow-[0_8px_20px_rgba(var(--primary-strong)/0.25)] hover:bg-[rgb(var(--primary-strong))]",
  secondary:
    "border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] text-[rgb(var(--text))] hover:bg-[rgb(var(--ring))]",
  ghost: "bg-transparent text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-soft))] hover:text-[rgb(var(--primary-strong))]",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-200"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-5 text-base"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
}
