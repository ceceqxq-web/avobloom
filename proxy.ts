import { NextResponse, type NextRequest } from "next/server";
import {authCallbackRedirect} from "@/lib/health/authRedirect";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Public demo is isolated from auth, health APIs and user-specific cookies.
  if(request.nextUrl.pathname==="/demo")return NextResponse.next();
  const callback=authCallbackRedirect(request.nextUrl);
  if(callback)return NextResponse.redirect(callback);
  if (process.env.VERCEL!=="1" && process.env.WELLGROVE_STORAGE!=="supabase" && (request.nextUrl.pathname === "/api/health" || request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/meal-planner" || request.nextUrl.pathname === "/api/foods/woolworths" || request.nextUrl.pathname === "/api/foods/photo")) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
