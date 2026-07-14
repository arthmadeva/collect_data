import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import { type GetServerSidePropsContext, type NextApiRequest, type NextApiResponse } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createPagesServerClient(
  req: NextApiRequest | GetServerSidePropsContext["req"],
  res: NextApiResponse | GetServerSidePropsContext["res"]
) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies || {}).map(([name, value]) => ({
            name,
            value: value || "",
          }));
        },
        setAll(cookiesToSet) {
          const response = res as any;
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieStr = serializeCookieHeader(name, value, options);
            if (typeof response.appendHeader === "function") {
              response.appendHeader("Set-Cookie", cookieStr);
            } else if (typeof response.setHeader === "function") {
              const existingHeaders = response.getHeader ? response.getHeader("Set-Cookie") : undefined;
              if (!existingHeaders) {
                response.setHeader("Set-Cookie", [cookieStr]);
              } else if (Array.isArray(existingHeaders)) {
                response.setHeader("Set-Cookie", [...existingHeaders, cookieStr]);
              } else {
                response.setHeader("Set-Cookie", [existingHeaders as string, cookieStr]);
              }
            }
          });
        },
      },
    }
  );
}
