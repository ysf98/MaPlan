import { redirect } from "next/navigation";
import { ROUTES } from "@/utils/constants";

export default async function InvitationsPage() {
  redirect(ROUTES.notifications);
}
