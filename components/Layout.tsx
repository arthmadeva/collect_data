import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const supabase = createClient();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [cabang, setCabang] = useState("");

  useEffect(() => {
    if (user) {
      setRole(user.user_metadata?.role || "user");
      setCabang(user.user_metadata?.cabang || "");
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "admin":
        return "Admin Cabang";
      case "cs":
        return "Customer Service";
      case "keuangan":
        return "Staf Keuangan";
      case "gudang":
        return "Staf Gudang";
      default:
        return r.toUpperCase();
    }
  };

  const currentPath = router.pathname;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-1">
          <span className="text-violet-400 font-bold text-xs uppercase tracking-widest">Akur Optic 55</span>
          <h1 className="font-extrabold text-xl tracking-tight text-white">Project AKUR</h1>
        </div>

        {/* User profile brief */}
        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col">
          <div className="text-sm font-semibold text-slate-200">{user?.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {getRoleLabel(role)}
            </span>
            {cabang && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {cabang.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            href={`/${role}/dashboard`}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              currentPath.endsWith("/dashboard")
                ? "bg-violet-600 text-white shadow-lg shadow-violet-950/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Antrean Kerja (To-Do)
          </Link>

          <Link
            href={`/${role}/transaction`}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              currentPath.endsWith("/transaction")
                ? "bg-violet-600 text-white shadow-lg shadow-violet-950/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Riwayat Kerja (History)
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900/50 border border-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              {currentPath.endsWith("/dashboard") ? "Antrean Kerja (To-Do List)" : "Riwayat Kerja (Transaction History)"}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Aplikasi Terintegrasi
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
