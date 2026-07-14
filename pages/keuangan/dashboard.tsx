import { useState } from "react";
import { useRouter } from "next/router";
import { createPagesServerClient } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/client";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface KeuanganDashboardProps {
  user: any;
  initialAktualQueue: any[];
  initialSilangQueue: any[];
}

export default function KeuanganDashboard({ user, initialAktualQueue, initialSilangQueue }: KeuanganDashboardProps) {
  const supabase = createClient();
  const router = useRouter();

  const [aktualQueue, setAktualQueue] = useState(initialAktualQueue);
  const [silangQueue, setSilangQueue] = useState(initialSilangQueue);

  const [selectedAktualTx, setSelectedAktualTx] = useState<any | null>(null);
  const [selectedSilangTx, setSelectedSilangTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. aktual Form States
  const [actual, setActual] = useState("");
  const [accPusatActual, setAccPusatActual] = useState(true);
  const [noAccPusatActual, setNoAccPusatActual] = useState("");

  // 2. bayar_silang Form States
  const [nomorBayarSilang, setNomorBayarSilang] = useState("");
  const [lebihPlafon, setLebihPlafon] = useState("");

  const refreshData = async () => {
    // Refresh Aktual Queue
    const { data: rawAktual, error: err1 } = await supabase
      .from("konfirmasi_beli")
      .select(`
        *,
        verifikasi_kartu!inner (
          collect_data!inner (
            nama,
            nomor_kartu,
            cabang
          )
        ),
        aktual!left(aktual_id),
        bayar_silang!left(silang_id)
      `)
      .is("aktual.aktual_id", null);

    if (!err1 && rawAktual) {
      const filtered = rawAktual.filter((item: any) => {
        if (!item.cek_mutasi) return true;
        const hasSilang = Array.isArray(item.bayar_silang)
          ? item.bayar_silang.length > 0
          : !!item.bayar_silang;
        return hasSilang;
      });
      setAktualQueue(filtered);
    }

    // Refresh Silang Queue
    const { data: rawSilang, error: err2 } = await supabase
      .from("konfirmasi_beli")
      .select(`
        *,
        verifikasi_kartu!inner (
          collect_data!inner (
            nama,
            nomor_kartu,
            cabang
          )
        ),
        bayar_silang!left(silang_id)
      `)
      .eq("cek_mutasi", true)
      .is("bayar_silang.silang_id", null);

    if (!err2 && rawSilang) {
      setSilangQueue(rawSilang);
    }
  };

  const handleAktualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAktualTx) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("aktual").insert({
        konfirmasi_id: selectedAktualTx.konfirmasi_id,
        actual,
        acc_pusat_actual: accPusatActual,
        no_acc_pusat_actual: noAccPusatActual,
      });

      if (insertError) throw insertError;

      // Reset
      setSelectedAktualTx(null);
      setActual("");
      setAccPusatActual(true);
      setNoAccPusatActual("");

      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data aktual.");
    } finally {
      setLoading(false);
    }
  };

  const handleSilangSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSilangTx) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("bayar_silang").insert({
        konfirmasi_id: selectedSilangTx.konfirmasi_id,
        nomor_bayar_silang: nomorBayarSilang,
        lebih_plafon: lebihPlafon,
      });

      if (insertError) throw insertError;

      // Reset
      setSelectedSilangTx(null);
      setNomorBayarSilang("");
      setLebihPlafon("");

      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data bayar silang.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-8">

        {/* SECTION 1: ANTRIAN AKTUAL */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Antrean Pencatatan Aktual</h3>
              <p className="text-sm text-slate-500 mt-1">
                Daftar transaksi konfirmasi beli yang memerlukan pengisian data aktual pembayaran.
              </p>
            </div>
            <span className="text-2xl font-extrabold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100">
              {aktualQueue.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Nama Konsumen</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Nomor SP</th>
                    <th className="px-6 py-4">Alamat Kirim</th>
                    <th className="px-6 py-4">Cek Mutasi</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {aktualQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                        Tidak ada antrean pencatatan aktual.
                      </td>
                    </tr>
                  ) : (
                    aktualQueue.map((item) => {
                      const client = item.verifikasi_kartu?.collect_data;
                      return (
                        <tr key={item.konfirmasi_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{client?.nama}</div>
                            <div className="text-xs text-slate-400 font-mono">{client?.nomor_kartu}</div>
                          </td>
                          <td className="px-6 py-4 uppercase font-bold text-xs text-slate-500">
                            {client?.cabang || "-"}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">{item.nomor_sp || "-"}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate" title={item.alamat_kirim}>
                            {item.alamat_kirim}
                          </td>
                          <td className="px-6 py-4">
                            {item.cek_mutasi ? (
                              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wide">
                                Ya
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wide">
                                Tidak
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedAktualTx(item);
                                setError(null);
                              }}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-violet-100 cursor-pointer"
                            >
                              Catat Aktual
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

        {/* SECTION 2: ANTRIAN BAYAR SILANG */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Antrean Bayar Silang</h3>
              <p className="text-sm text-slate-500 mt-1">
                Daftar transaksi dengan opsi `Cek Mutasi` aktif yang membutuhkan pengisian data bayar silang terlebih dahulu.
              </p>
            </div>
            <span className="text-2xl font-extrabold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100">
              {silangQueue.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Nama Konsumen</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Nomor SP</th>
                    <th className="px-6 py-4">ID Form</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {silangQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                        Tidak ada antrean bayar silang.
                      </td>
                    </tr>
                  ) : (
                    silangQueue.map((item) => {
                      const client = item.verifikasi_kartu?.collect_data;
                      return (
                        <tr key={item.konfirmasi_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{client?.nama}</div>
                            <div className="text-xs text-slate-400 font-mono">{client?.nomor_kartu}</div>
                          </td>
                          <td className="px-6 py-4 uppercase font-bold text-xs text-slate-500">
                            {client?.cabang || "-"}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">{item.nomor_sp || "-"}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{item.id_form || "-"}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSilangTx(item);
                                setError(null);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-indigo-100 cursor-pointer"
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

        {/* MODAL: INPUT AKTUAL */}
        {selectedAktualTx && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Form Pencatatan Aktual</h4>
                  <p className="text-xs text-slate-500 mt-1">Konsumen: {selectedAktualTx.verifikasi_kartu?.collect_data?.nama}</p>
                </div>
                <button
                  onClick={() => setSelectedAktualTx(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleAktualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nilai Aktual (Actual)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1.000.000"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor ACC Pusat Actual</label>
                  <input
                    type="text"
                    required
                    value={noAccPusatActual}
                    onChange={(e) => setNoAccPusatActual(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">ACC Pusat Actual</div>
                    <div className="text-xs text-slate-500">Kondisi data telah disetujui pusat.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accPusatActual}
                    onChange={(e) => setAccPusatActual(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-violet-100 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Aktual"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: INPUT BAYAR SILANG */}
        {selectedSilangTx && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Form Bayar Silang</h4>
                  <p className="text-xs text-slate-500 mt-1">Konsumen: {selectedSilangTx.verifikasi_kartu?.collect_data?.nama}</p>
                </div>
                <button
                  onClick={() => setSelectedSilangTx(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSilangSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor Bayar Silang</label>
                  <input
                    type="text"
                    required
                    value={nomorBayarSilang}
                    onChange={(e) => setNomorBayarSilang(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lebih Plafon</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 200.000"
                    value={lebihPlafon}
                    onChange={(e) => setLebihPlafon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-indigo-100 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Bayar Silang"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createPagesServerClient(context.req, context.res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Fetch to-do Aktual
  const { data: rawAktual, error: err1 } = await supabase
    .from("konfirmasi_beli")
    .select(`
      *,
      verifikasi_kartu!inner (
        collect_data!inner (
          nama,
          nomor_kartu,
          cabang
        )
      ),
      aktual!left(aktual_id),
      bayar_silang!left(silang_id)
    `)
    .is("aktual.aktual_id", null);

  const filteredAktual = rawAktual
    ? rawAktual.filter((item: any) => {
      if (!item.cek_mutasi) return true;
      const hasSilang = Array.isArray(item.bayar_silang)
        ? item.bayar_silang.length > 0
        : !!item.bayar_silang;
      return hasSilang;
    })
    : [];

  // Fetch to-do Silang
  const { data: silangQueue, error: err2 } = await supabase
    .from("konfirmasi_beli")
    .select(`
      *,
      verifikasi_kartu!inner (
        collect_data!inner (
          nama,
          nomor_kartu,
          cabang
        )
      ),
      bayar_silang!left(silang_id)
    `)
    .eq("cek_mutasi", true)
    .is("bayar_silang.silang_id", null);

  if (err1) console.error("Error fetching aktual queue:", err1);
  if (err2) console.error("Error fetching silang queue:", err2);

  return {
    props: {
      user,
      initialAktualQueue: filteredAktual,
      initialSilangQueue: silangQueue || [],
    },
  };
};
