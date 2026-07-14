import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Skip static assets and internal APIs
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path.includes(".")
  ) {
    return response;
  }

  // Not logged in
  if (!user) {
    if (path !== "/login") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Logged in
  const role = user.user_metadata?.role as string;
  const isLoginPage = path === "/login";

  const roleDashboards: Record<string, string> = {
    cs: "/cs/dashboard",
    admin: "/admin/dashboard",
    keuangan: "/keuangan/dashboard",
    gudang: "/gudang/dashboard",
  };

  const userDashboard = roleDashboards[role];

  if (isLoginPage || path === "/") {
    if (userDashboard) {
      url.pathname = userDashboard;
      return NextResponse.redirect(url);
    }
  }

  // Path protection based on roles
  if (path.startsWith("/cs/") && role !== "cs") {
    if (userDashboard) {
      url.pathname = userDashboard;
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/admin/") && role !== "admin") {
    if (userDashboard) {
      url.pathname = userDashboard;
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/keuangan/") && role !== "keuangan") {
    if (userDashboard) {
      url.pathname = userDashboard;
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/gudang/") && role !== "gudang") {
    if (userDashboard) {
      url.pathname = userDashboard;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
