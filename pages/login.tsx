import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cs");
  const [cabang, setCabang] = useState("Jakarta");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Register user with metadata
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              cabang: role === "admin" || role === "cs" ? cabang : null,
            },
          },
        });

        if (error) throw error;
        setSuccessMsg(
          "Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi atau langsung coba Login (jika auto-confirm aktif)."
        );
        setIsSignUp(false);
      } else {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Redirect to index page which will determine role routing
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isSignUp ? "Daftar Akun | AKUR" : "Masuk | AKUR"}</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
        {/* Decorative Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-slate-800/80">
          <div className="text-center">
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 tracking-wider">
              AKUR OPTIC 55
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-outfit">
              {isSignUp ? "Buat Akun Baru" : "Centralized Login"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Aplikasi Manajemen Transaksi Terpusat (AKUR)
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                {successMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-200 placeholder-slate-500 text-sm transition-all duration-200"
                  placeholder="admin@akur.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-200 placeholder-slate-500 text-sm transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Peran (Role)
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-200 text-sm transition-all duration-200"
                      >
                        <option value="admin">Admin Cabang</option>
                        <option value="cs">Customer Service</option>
                        <option value="keuangan">Staf Keuangan</option>
                        <option value="gudang">Staf Gudang</option>
                      </select>
                    </div>

                    {(role === "admin" || role === "cs") && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Wilayah Cabang
                        </label>
                        <input
                          type="text"
                          required
                          value={cabang}
                          onChange={(e) => setCabang(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-200 placeholder-slate-500 text-sm transition-all duration-200"
                          placeholder="Jakarta"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all duration-200 font-outfit shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-[1px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : isSignUp ? (
                  "Daftar Akun Baru"
                ) : (
                  "Masuk Sistem"
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar Akun Uji Coba"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
