import { GetServerSidePropsContext } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "cs" | "keuangan" | "gudang";
  cabang: string | null;
}

export type AuthCheckResult =
  | { redirect: { destination: string; permanent: boolean }; profile?: undefined; supabase?: undefined }
  | { profile: UserProfile; supabase: any; redirect?: undefined };

export async function checkAuthAndRole(
  context: GetServerSidePropsContext,
  allowedRoles: ("admin" | "cs" | "keuangan" | "gudang")[]
): Promise<AuthCheckResult> {
  const supabase = createPagesServerClient(context);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const role = user.user_metadata?.role;
  const cabang = user.user_metadata?.cabang || null;

  if (!role) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  if (!allowedRoles.includes(role as any)) {
    return {
      redirect: {
        destination: "/403",
        permanent: false,
      },
    };
  }

  const profile: UserProfile = {
    id: user.id,
    email: user.email || "",
    role: role as any,
    cabang,
  };

  return {
    profile,
    supabase,
  };
}
