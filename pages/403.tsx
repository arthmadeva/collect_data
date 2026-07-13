import Link from "next/link";
import Head from "next/head";

export default function Forbidden() {
  return (
    <>
      <Head>
        <title>Akses Ditolak (403) | AKUR</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center font-sans">
        <div className="glass-panel p-8 max-w-md rounded-2xl border border-red-500/20 shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl shadow-lg">
            !
          </div>

          <h1 className="text-5xl font-extrabold text-red-500 font-outfit mt-6">403</h1>
          <h2 className="text-2xl font-bold text-white mt-4 font-outfit">Akses Ditolak</h2>
          <p className="text-slate-400 mt-2 text-sm">
            Anda tidak memiliki izin untuk mengakses halaman ini. Peran atau cabang akun Anda tidak sesuai dengan otorisasi rute ini.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-all duration-200 shadow-md shadow-indigo-600/20"
            >
              Kembali ke Beranda Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
