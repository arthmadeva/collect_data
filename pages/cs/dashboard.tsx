import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface CSDashboardProps {
  profile: UserProfile;
  initialQueue: any[];
}

export default function CSDashboard({ profile, initialQueue }: CSDashboardProps) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialQueue);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [namaCs, setNamaCs] = useState("");
  const [tanggalTelepon, setTanggalTelepon] = useState("");
  const [jamTelepon, setJamTelepon] = useState("");
  const [plafon, setPlafon] = useState("");
  const [verifHp, setVerifHp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenModal = (tx: any) => {
    setSelectedTx(tx);
    // Preset some sensible defaults
    setNamaCs(profile.email.split("@")[0]);
    setTanggalTelepon(new Date().toISOString().split("T")[0]);
    setJamTelepon(new Date().toTimeString().split(" ")[0].substring(0, 5));
    setPlafon("");
    setVerifHp(false);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/cs/verifikasi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaksi_id: selectedTx.transaksi_id,
          nama_cs: namaCs,
          tanggal_telepon: tanggalTelepon,
          jam_telepon: jamTelepon,
          plafon,
          verif_hp: verifHp,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan verifikasi.");
      }

      // Close modal and refresh data
      handleCloseModal();
      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout profile={profile} title="CS Dashboard - Antrean Verifikasi">
      <div className="space-y-6 font-sans">
        {/* Statistics or Intro */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Status Antrean Cabang {profile.cabang}</h3>
            <p className="text-slate-400 text-sm">
              Menampilkan data konsumen baru yang belum diverifikasi kartu kredit/debitnya.
            </p>
          </div>
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-xl text-sm font-outfit">
            {queue.length} Antrean Tertunda
          </div>
        </div>

        {/* Queue Table */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Tanggal Input</th>
                  <th className="p-4">Nama Konsumen</th>
                  <th className="p-4">No. HP</th>
                  <th className="p-4">Nomor Kartu</th>
                  <th className="p-4">Unit BRI / Promotor</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Tidak ada antrean verifikasi untuk wilayah cabang Anda.
                    </td>
                  </tr>
                ) : (
                  queue.map((row) => (
                    <tr key={row.transaksi_id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4">
                        {new Date(row.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 font-semibold text-white">{row.nama}</td>
                      <td className="p-4">{row.no_hp}</td>
                      <td className="p-4 font-mono text-xs">{row.nomor_kartu}</td>
                      <td className="p-4 text-xs">
                        <span className="text-slate-400">{row.unit_bri}</span> /{" "}
                        <span className="text-slate-400">{row.promotor}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenModal(row)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200 hover:-translate-y-[1px]"
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

        {/* Glassmorphic Form Modal */}
        {isModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Form Verifikasi Kartu</h3>
              <p className="text-slate-400 text-xs mb-4">
                Mengisi verifikasi untuk konsumen: <span className="text-white font-semibold">{selectedTx.nama}</span> ({selectedTx.nomor_kartu})
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama CS</label>
                    <input
                      type="text"
                      required
                      value={namaCs}
                      onChange={(e) => setNamaCs(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Plafon (Limit)</label>
                    <input
                      type="text"
                      required
                      value={plafon}
                      onChange={(e) => setPlafon(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="e.g. 10.000.000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Telepon</label>
                    <input
                      type="date"
                      required
                      value={tanggalTelepon}
                      onChange={(e) => setTanggalTelepon(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jam Telepon</label>
                    <input
                      type="time"
                      required
                      value={jamTelepon}
                      onChange={(e) => setJamTelepon(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="verifHp"
                    checked={verifHp}
                    onChange={(e) => setVerifHp(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                  />
                  <label htmlFor="verifHp" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Verifikasi Nomor HP Berhasil / Valid
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                  >
                    {loading ? "Menyimpan..." : "Simpan Verifikasi"}
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
  const authRes = await checkAuthAndRole(context, ["cs"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query collect_data joined with verifikasi_kartu
  // RLS will automatically apply and restrict collect_data based on user's cabang
  const { data, error } = await supabase
    .from("collect_data")
    .select("*, verifikasi_kartu(verifikasi_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching CS queue:", error);
  }

  // Filter queue logic: transaksi_id NOT present in verifikasi_kartu
  const initialQueue = (data || []).filter(
    (row: any) => !row.verifikasi_kartu || row.verifikasi_kartu.length === 0
  );

  return {
    props: {
      profile,
      initialQueue,
    },
  };
};
