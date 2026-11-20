import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {safeAuthNext} from "@/lib/health/authRedirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore=await cookies();
  let storedNext='/';
  try{storedNext=decodeURIComponent(cookieStore.get('avobloom-auth-next')?.value||'/')}catch{}
  const next=safeAuthNext(searchParams.get('next')||storedNext);
  cookieStore.delete('avobloom-auth-next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
