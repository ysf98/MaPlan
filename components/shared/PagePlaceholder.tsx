import { Card } from "@/components/ui/Card";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">{description}</p>
      <p className="mt-6 text-sm text-zinc-500">Placeholder listo para implementar funcionalidad.</p>
    </Card>
  );
}
