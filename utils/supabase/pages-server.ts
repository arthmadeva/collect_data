import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";

function serializeCookie(name: string, value: string, options: CookieOptions) {
  let cookieStr = `${name}=${encodeURIComponent(value)}`;
  if (options.domain) cookieStr += `; Domain=${options.domain}`;
  if (options.maxAge !== undefined) cookieStr += `; Max-Age=${options.maxAge}`;
  if (options.path) cookieStr += `; Path=${options.path}`;
  if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
  if (options.secure) cookieStr += `; Secure`;
  if (options.httpOnly) cookieStr += `; HttpOnly`;
  return cookieStr;
}

export function createPagesServerClient(context: GetServerSidePropsContext) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(context.req.cookies).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const serialized = serializeCookie(name, value, options);
            context.res.appendHeader("Set-Cookie", serialized);
          });
        },
      },
    }
  );
}

export function createPagesApiClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const serialized = serializeCookie(name, value, options);
            res.appendHeader("Set-Cookie", serialized);
          });
        },
      },
    }
  );
}
