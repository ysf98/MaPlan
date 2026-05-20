import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { searchUsers } from "@/lib/friends";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchUsers(query, user.id);
  return NextResponse.json({ results });
}
