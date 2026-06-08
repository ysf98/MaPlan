import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/utils/constants";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return ROUTES.dashboard;
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=oauth`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=oauth`);
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
