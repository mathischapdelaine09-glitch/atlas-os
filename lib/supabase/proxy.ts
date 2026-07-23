import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          }
        },
      },
    }
  );

const { data, error } = await supabase.auth.getClaims();

const claims = error ? null : data?.claims;

  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    "/dashboard",
    "/finance",
    "/documents",
    "/projects",
    "/notes",
    "/agenda",
    "/studies",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthenticationRoute =
    pathname === "/login" || pathname === "/register";

  // L'utilisateur n'est pas connecté et tente d'ouvrir VeyraOS
  if (!claims && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // L'utilisateur est connecté et tente d'ouvrir login/register
  if (claims && isAuthenticationRoute) {
    const dashboardUrl = request.nextUrl.clone();

    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}