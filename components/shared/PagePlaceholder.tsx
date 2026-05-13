import { Card } from "@/components/ui/Card";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
      <p className="mt-6 text-sm text-slate-500">Placeholder listo para implementar funcionalidad.</p>
    </Card>
  );
}
