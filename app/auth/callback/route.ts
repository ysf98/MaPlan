import { NextRequest, NextResponse } from "next/server";
import { getSafeInternalPath } from "@/lib/navigation/safeRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/utils/constants";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeInternalPath(requestUrl.searchParams.get("next"), ROUTES.dashboard);
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
