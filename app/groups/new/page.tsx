import { AppShell } from "@/components/layout/AppShell";
import { CreateGroupForm } from "@/components/groups/CreateGroupForm";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFriends } from "@/lib/friends";
import { ROUTES } from "@/utils/constants";
import { redirect } from "next/navigation";

export default async function NewGroupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups/new");
  }

  const friends = await getFriends(user.id);

  return (
    <AppShell backHref={ROUTES.groups} currentUser={user}>
      <section className="mx-auto w-full max-w-md px-1 pb-4 pt-3">
        <div className="overflow-hidden rounded-[26px] border border-rose-100/70 bg-white shadow-[0_18px_45px_rgba(24,24,27,0.12)]">
          <CreateGroupForm friends={friends} />
        </div>
      </section>
    </AppShell>
  );
}
