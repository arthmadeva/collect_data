import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface KeuanganDashboardProps {
  profile: UserProfile;
  initialQueueAktual: any[];
  initialQueueBayarSilang: any[];
}

export default function KeuanganDashboard({
  profile,
  initialQueueAktual,
  initialQueueBayarSilang,
}: KeuanganDashboardProps) {
  const router = useRouter();

  // Modals status
  const [isAktualModalOpen, setIsAktualModalOpen] = useState(false);
  const [isSilangModalOpen, setIsSilangModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Form: Aktual
  const [actual, setActual] = useState("");
  const [accPusatActual, setAccPusatActual] = useState(false);
  const [noAccPusatActual, setNoAccPusatActual] = useState("");

  // Form: Bayar Silang
  const [nomorBayarSilang, setNomorBayarSilang] = useState("");
  const [lebihPlafon, setLebihPlafon] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenAktual = (tx: any) => {
    setSelectedTx(tx);
    setActual("");
    setAccPusatActual(false);
    setNoAccPusatActual("");
    setErrorMsg("");
    setIsAktualModalOpen(true);
  };

  const handleOpenSilang = (tx: any) => {
    setSelectedTx(tx);
    setNomorBayarSilang("");
    setLebihPlafon("");
    setErrorMsg("");
    setIsSilangModalOpen(true);
  };

  const handleAktualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/keuangan/aktual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konfirmasi_id: selectedTx.konfirmasi_id,
          actual,
          acc_pusat_actual: accPusatActual,
          no_acc_pusat_actual: noAccPusatActual,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan aktual.");

      setIsAktualModalOpen(false);
      setSelectedTx(null);
      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSilangSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/keuangan/bayar-silang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konfirmasi_id: selectedTx.konfirmasi_id,
          nomor_bayar_silang: nomorBayarSilang,
          lebih_plafon: lebihPlafon,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan bayar silang.");

      setIsSilangModalOpen(false);
      setSelectedTx(null);
      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout profile={profile} title="Keuangan Dashboard - Pemrosesan Dana">
      <div className="space-y-8 font-sans">
        {/* Queue 1: To-Do Bayar Silang */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-bold text-white font-outfit uppercase tracking-wider text-slate-400">
              1. Antrean To-Do Bayar Silang (Cross-Payment)
            </h4>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-lg font-outfit">
              {initialQueueBayarSilang.length} Antrean
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Tanggal Deal</th>
                    <th className="p-4">Nama Konsumen</th>
                    <th className="p-4">Cabang</th>
                    <th className="p-4">Nomor SP</th>
                    <th className="p-4">Nomor Kartu</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {initialQueueBayarSilang.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Tidak ada antrean bayar silang.
                      </td>
                    </tr>
                  ) : (
                    initialQueueBayarSilang.map((row) => {
                      const vk = row.verifikasi_kartu || {};
                      const cd = vk.collect_data || {};
                      return (
                        <tr key={row.konfirmasi_id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4">
                            {new Date(row.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-4 font-semibold text-white">{cd.nama || "N/A"}</td>
                          <td className="p-4 text-slate-400">{cd.cabang || "N/A"}</td>
                          <td className="p-4 text-indigo-400 font-semibold">{row.nomor_sp}</td>
                          <td className="p-4 font-mono text-xs">{cd.nomor_kartu || "N/A"}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenSilang(row)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200"
                            >
                              Bayar Silang
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Queue 2: To-Do Aktual */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-bold text-white font-outfit uppercase tracking-wider text-slate-400">
              2. Antrean To-Do Aktual (Pencatatan Keuangan)
            </h4>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg font-outfit">
              {initialQueueAktual.length} Antrean
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Tanggal Deal</th>
                    <th className="p-4">Nama Konsumen</th>
                    <th className="p-4">Cabang</th>
                    <th className="p-4">Nomor SP</th>
                    <th className="p-4">Cek Mutasi</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {initialQueueAktual.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Tidak ada antrean aktual.
                      </td>
                    </tr>
                  ) : (
                    initialQueueAktual.map((row) => {
                      const vk = row.verifikasi_kartu || {};
                      const cd = vk.collect_data || {};
                      return (
                        <tr key={row.konfirmasi_id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4">
                            {new Date(row.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-4 font-semibold text-white">{cd.nama || "N/A"}</td>
                          <td className="p-4 text-slate-400">{cd.cabang || "N/A"}</td>
                          <td className="p-4 text-indigo-400 font-semibold">{row.nomor_sp}</td>
                          <td className="p-4">
                            {row.cek_mutasi ? (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                                Mutasi (Silang OK)
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 border border-slate-700 text-slate-400 uppercase">
                                Tanpa Mutasi
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenAktual(row)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200"
                            >
                              Aktualisasi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Bayar Silang */}
        {isSilangModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={() => setIsSilangModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Pencatatan Bayar Silang</h3>
              <p className="text-slate-400 text-xs mb-4">
                Konsumen: <span className="text-white font-semibold">{selectedTx.verifikasi_kartu?.collect_data?.nama}</span>
              </p>

              <form onSubmit={handleSilangSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nomor Bayar Silang</label>
                  <input
                    type="text"
                    required
                    value={nomorBayarSilang}
                    onChange={(e) => setNomorBayarSilang(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    placeholder="e.g. BS-991283"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kelebihan Plafon (Limit)</label>
                  <input
                    type="text"
                    required
                    value={lebihPlafon}
                    onChange={(e) => setLebihPlafon(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    placeholder="e.g. 500.000"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSilangModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                  >
                    {loading ? "Menyimpan..." : "Simpan Bayar Silang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Aktual */}
        {isAktualModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={() => setIsAktualModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Pencatatan Aktualisasi</h3>
              <p className="text-slate-400 text-xs mb-4">
                Konsumen: <span className="text-white font-semibold">{selectedTx.verifikasi_kartu?.collect_data?.nama}</span>
              </p>

              <form onSubmit={handleAktualSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nilai Actual (Rp)</label>
                  <input
                    type="text"
                    required
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    placeholder="Nilai pembayaran riil"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="accPusatActual"
                    checked={accPusatActual}
                    onChange={(e) => setAccPusatActual(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                  />
                  <label htmlFor="accPusatActual" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    ACC Pusat Actual
                  </label>
                </div>

                {accPusatActual && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nomor ACC Pusat</label>
                    <input
                      type="text"
                      required
                      value={noAccPusatActual}
                      onChange={(e) => setNoAccPusatActual(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="e.g. ACC-109283"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAktualModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                  >
                    {loading ? "Menyimpan..." : "Simpan Aktual"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authRes = await checkAuthAndRole(context, ["keuangan"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query konfirmasi_beli joined with verifikasi_kartu, collect_data, aktual, and bayar_silang
  // Staf Keuangan can monitor national data, so no branch filters needed
  const { data, error } = await supabase
    .from("konfirmasi_beli")
    .select("*, verifikasi_kartu(*, collect_data(*)), aktual(aktual_id), bayar_silang(silang_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Keuangan dashboard data:", error);
  }

  const rows = data || [];

  // Filter Queue 1: To-Do Aktual
  const initialQueueAktual = rows.filter((row: any) => {
    const hasAktual = row.aktual && row.aktual.length > 0;
    if (hasAktual) return false;

    const hasBayarSilang = row.bayar_silang && row.bayar_silang.length > 0;
    if (!row.cek_mutasi) {
      return true;
    } else {
      return hasBayarSilang;
    }
  });

  // Filter Queue 2: To-Do Bayar Silang
  const initialQueueBayarSilang = rows.filter((row: any) => {
    const hasBayarSilang = row.bayar_silang && row.bayar_silang.length > 0;
    return !hasBayarSilang && row.cek_mutasi === true;
  });

  return {
    props: {
      profile,
      initialQueueAktual,
      initialQueueBayarSilang,
    },
  };
};
