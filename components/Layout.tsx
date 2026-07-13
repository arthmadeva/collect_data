import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "cs" | "keuangan" | "gudang";
  cabang: string | null;
}

interface LayoutProps {
  children: React.ReactNode;
  profile: UserProfile;
  title: string;
}

export default function Layout({ children, profile, title }: LayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin Cabang";
      case "cs":
        return "Customer Service";
      case "keuangan":
        return "Staf Keuangan";
      case "gudang":
        return "Staf Gudang";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "cs":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "keuangan":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "gudang":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const menuItems = [
    {
      name: "Dashboard (Queue)",
      path: `/${profile.role}/dashboard`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: "Riwayat Transaksi",
      path: `/${profile.role}/transaction`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>{title} | AKUR</title>
      </Head>
      <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Sidebar wrapper - Desktop */}
        <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800/80 p-5 shrink-0 z-20 relative">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
              AKUR SYSTEM
            </span>
            <h1 className="text-xl font-extrabold mt-3 text-white tracking-tight font-outfit">
              Optic 55
            </h1>
          </div>

          {/* User info */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-xs text-slate-400 truncate mb-1" title={profile.email}>
              {profile.email}
            </p>
            <div className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase ${getRoleBadgeColor(profile.role)}`}>
              {getRoleLabel(profile.role)}
            </div>
            {profile.cabang && (
              <div className="mt-2 text-xs text-slate-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Cabang: {profile.cabang}</span>
              </div>
            )}
          </div>

          {/* Nav menu */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="mt-auto pt-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-white tracking-tight font-outfit">
              AKUR OPTIC 55
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-slate-800 p-4 absolute top-[61px] left-0 right-0 z-30 space-y-4">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-xs text-slate-400 truncate mb-1">{profile.email}</p>
              <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-bold rounded border uppercase ${getRoleBadgeColor(profile.role)}`}>
                {getRoleLabel(profile.role)}
              </span>
              {profile.cabang && <p className="text-xs text-slate-300 mt-1">Cabang: {profile.cabang}</p>}
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = router.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-61px)] md:max-h-screen relative z-10">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header inside main container */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/80 pb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-outfit">
                  {title}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Akur Optic 55 Transaction Management
                </p>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </>
  );
}
