import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupPlanDetailView } from "@/components/groups/GroupPlanDetailView";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPublicGroupPlanByToken } from "@/lib/groupPlans";

type PublicPlanPageProps = {
  params: Promise<{ token: string }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getSharePath(token: string): string {
  return `/plans/share/${token}`;
}

export async function generateMetadata({ params }: PublicPlanPageProps): Promise<Metadata> {
  const { token } = await params;
  if (!isUuid(token)) {
    return {
      title: "Plan no encontrado | MaPlan"
    };
  }

  const publicPlan = await getPublicGroupPlanByToken(token);
  if (!publicPlan) {
    return {
      title: "Plan no encontrado | MaPlan"
    };
  }

  return {
    title: `${publicPlan.plan.title} | MaPlan`,
    description: "Plan compartido en MaPlan"
  };
}

export default async function PublicPlanPage({ params }: PublicPlanPageProps) {
  const { token } = await params;
  if (!isUuid(token)) {
    notFound();
  }

  const [user, publicPlan] = await Promise.all([getCurrentUser(), getPublicGroupPlanByToken(token)]);

  if (!publicPlan) {
    notFound();
  }

  const sharePath = getSharePath(token);

  return (
    <GroupPlanDetailView
      groupId={publicPlan.plan.groupId}
      groupName={publicPlan.groupName}
      loginHref={`/login?next=${encodeURIComponent(sharePath)}`}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      plan={publicPlan.plan}
      publicReadOnly
      publicShareUrl={sharePath}
      showPublicAuthCta={!user}
    />
  );
}
