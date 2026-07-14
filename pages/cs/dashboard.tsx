import { useState } from "react";
import { useRouter } from "next/router";
import { createPagesServerClient } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/client";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface CSDashboardProps {
  user: any;
  initialQueue: any[];
}

export default function CSDashboard({ user, initialQueue }: CSDashboardProps) {
  const supabase = createClient();
  const router = useRouter();

  const [queue, setQueue] = useState(initialQueue);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [namaCs, setNamaCs] = useState(user.user_metadata?.nama || "");
  const [tanggalTelepon, setTanggalTelepon] = useState(new Date().toISOString().split("T")[0]);
  const [jamTelepon, setJamTelepon] = useState("12:00");
  const [plafon, setPlafon] = useState("");
  const [verifHp, setVerifHp] = useState(true);

  const refreshData = async () => {
    const userCabang = user.user_metadata?.cabang;
    const { data, error: qError } = await supabase
      .from("collect_data")
      .select("*, verifikasi_kartu!left(verifikasi_id)")
      .is("verifikasi_kartu", null)
      .eq("cabang", userCabang);

    if (!qError && data) {
      setQueue(data);
    }
  };

  const handleOpenForm = (tx: any) => {
    setSelectedTx(tx);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("verifikasi_kartu").insert({
        transaksi_id: selectedTx.transaksi_id,
        nama_cs: namaCs,
        tanggal_telepon: tanggalTelepon,
        jam_telepon: jamTelepon + ":00", // postgres time format hh:mm:ss
        plafon,
        verif_hp: verifHp,
      });

      if (insertError) throw insertError;

      // Close modal and refresh list
      setSelectedTx(null);
      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header summary card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Antrean Verifikasi Kartu</h3>
            <p className="text-sm text-slate-500 mt-1">
              Daftar konsumen baru cabang <b>{user.user_metadata?.cabang?.toUpperCase()}</b> yang memerlukan verifikasi kartu.
            </p>
          </div>
          <span className="text-3xl font-extrabold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100">
            {queue.length}
          </span>
        </div>

        {/* Table Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">Nomor Kartu</th>
                  <th className="px-6 py-4">No. HP</th>
                  <th className="px-6 py-4">Unit BRI</th>
                  <th className="px-6 py-4">Promotor</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Tidak ada antrean verifikasi untuk cabang Anda.
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item.transaksi_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.nama}</td>
                      <td className="px-6 py-4 font-mono text-xs">{item.nomor_kartu}</td>
                      <td className="px-6 py-4">{item.no_hp}</td>
                      <td className="px-6 py-4">{item.unit_bri}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                          {item.promotor}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-violet-100 cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Verifikasi */}
        {selectedTx && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Form Verifikasi Kartu</h4>
                  <p className="text-xs text-slate-500 mt-1">Konsumen: {selectedTx.nama} | Kartu: {selectedTx.nomor_kartu}</p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Nama CS
                    </label>
                    <input
                      type="text"
                      required
                      value={namaCs}
                      onChange={(e) => setNamaCs(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Plafon
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 1.000.000"
                      value={plafon}
                      onChange={(e) => setPlafon(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Tanggal Telepon
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalTelepon}
                      onChange={(e) => setTanggalTelepon(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Jam Telepon
                    </label>
                    <input
                      type="time"
                      required
                      value={jamTelepon}
                      onChange={(e) => setJamTelepon(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Verifikasi HP</div>
                    <div className="text-xs text-slate-500">Kondisi nomor HP aktif dan sesuai data.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={verifHp}
                    onChange={(e) => setVerifHp(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-violet-100 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Kirim Verifikasi"}
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

  const userCabang = user.user_metadata?.cabang;

  // Postgrest outer join with null checking
  const { data: queue, error } = await supabase
    .from("collect_data")
    .select("*, verifikasi_kartu!left(verifikasi_id)")
    .is("verifikasi_kartu", null)
    .eq("cabang", userCabang);

  if (error) {
    console.error("Queue query error:", error);
  }

  return {
    props: {
      user,
      initialQueue: queue || [],
    },
  };
};
