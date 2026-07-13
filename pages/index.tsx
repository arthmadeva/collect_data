import { GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";

export default function Index() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createPagesServerClient(context);

  // Check auth session
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

  // Get user role from metadata
  const role = user.user_metadata?.role;

  if (!role) {
    // If user exists but no metadata role, redirect to login
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Redirect based on role
  let destination = "/login";
  if (role === "admin") {
    destination = "/admin/dashboard";
  } else if (role === "cs") {
    destination = "/cs/dashboard";
  } else if (role === "keuangan") {
    destination = "/keuangan/dashboard";
  } else if (role === "gudang") {
    destination = "/gudang/dashboard";
  }

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};
