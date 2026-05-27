import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="vc-surface-card border-dashed px-5 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--surface-soft))] text-[rgb(var(--primary-strong))]">+</div>
      <h2 className="text-lg font-semibold text-[rgb(var(--text))]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[rgb(var(--muted))]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
