import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicPaths = ["/login", "/register", "/verify-email", "/"];
  const isPublicPath = publicPaths.some((p) => pathname === p);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath && pathname !== "/") {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_status")
        .eq("id", user.id)
        .single();

      if (profile) {
        const url = request.nextUrl.clone();
        switch (profile.role) {
          case "super_admin":
            url.pathname = "/admin";
            break;
          case "lecturer":
            if (profile.account_status === "pending") {
              url.pathname = "/pending";
            } else {
              url.pathname = "/lecturer";
            }
            break;
          case "student":
            url.pathname = "/student";
            break;
          default:
            url.pathname = "/login";
        }
        return NextResponse.redirect(url);
      }
    } catch {
      // Profile lookup failed, let user through
    }
  }

  return supabaseResponse;
}
