import { useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const user = data.user;
      const role = user?.user_metadata?.role;

      // Redirect depending on the role
      if (role === "cs") {
        router.push("/cs/dashboard");
      } else if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "keuangan") {
        router.push("/keuangan/dashboard");
      } else if (role === "gudang") {
        router.push("/gudang/dashboard");
      } else {
        setError("User role not configured correctly.");
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 selection:bg-violet-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-950/50 px-3 py-1 rounded-full border border-violet-800/30">
            PROYEK AKUR
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Akur Optic 55
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Integrasi Spreadsheet & Manajemen Transaksi Terpusat
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel-dark rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Masuk ke Sistem</h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-slate-900/80 border border-slate-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-medium rounded-lg py-3 text-sm transition-all shadow-lg shadow-violet-950/50 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              {loading ? "Menghubungkan..." : "Masuk"}
            </button>
          </form>
        </div>

        {/* Quick Test Accounts */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Akun Demo Pengujian (Proyek AKUR)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => fillCredentials("cs_bandung@akur.com", "password123")}
              className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="font-bold text-violet-400">CS Bandung</div>
              <div className="text-[10px] text-slate-500">cs_bandung@akur.com</div>
            </button>
            <button
              onClick={() => fillCredentials("cs_jakarta@akur.com", "password123")}
              className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="font-bold text-violet-400">CS Jakarta</div>
              <div className="text-[10px] text-slate-500">cs_jakarta@akur.com</div>
            </button>
            <button
              onClick={() => fillCredentials("admin_bandung@akur.com", "password123")}
              className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="font-bold text-emerald-400">Admin Bandung</div>
              <div className="text-[10px] text-slate-500">admin_bandung@akur.com</div>
            </button>
            <button
              onClick={() => fillCredentials("admin_jakarta@akur.com", "password123")}
              className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="font-bold text-emerald-400">Admin Jakarta</div>
              <div className="text-[10px] text-slate-500">admin_jakarta@akur.com</div>
            </button>
            <button
              onClick={() => fillCredentials("keuangan@akur.com", "password123")}
              className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="font-bold text-cyan-400">Staf Keuangan</div>
              <div className="text-[10px] text-slate-500">keuangan@akur.com</div>
            </button>
            <button
              onClick={() => fillCredentials("gudang@akur.com", "password123")}
              className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="font-bold text-amber-400">Staf Gudang</div>
              <div className="text-[10px] text-slate-500">gudang@akur.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
