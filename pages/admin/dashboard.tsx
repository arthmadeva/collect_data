import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface AdminDashboardProps {
  profile: UserProfile;
  initialQueue: any[];
}

export default function AdminDashboard({ profile, initialQueue }: AdminDashboardProps) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialQueue);

  // Modals status
  const [isNewDataModalOpen, setIsNewDataModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedVerify, setSelectedVerify] = useState<any | null>(null);

  // Form: Create New Data
  const [newNama, setNewNama] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTanggalLahir, setNewTanggalLahir] = useState("");
  const [newNoHp, setNewNoHp] = useState("");
  const [newNomorKartu, setNewNomorKartu] = useState("");
  const [newUnitBri, setNewUnitBri] = useState("");
  const [newPromotor, setNewPromotor] = useState("");

  // Form: Konfirmasi Beli
  const [beli, setBeli] = useState(true);
  const [resep, setResep] = useState("");
  const [nomorSp, setNomorSp] = useState("");
  const [alamatKirim, setAlamatKirim] = useState("");
  const [tanggalKirimFrame, setTanggalKirimFrame] = useState("");
  const [tanggalKirimLensa, setTanggalKirimLensa] = useState("");
  const [cekMutasi, setCekMutasi] = useState(false);
  const [idForm, setIdForm] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenConfirm = (verify: any) => {
    setSelectedVerify(verify);
    setBeli(true);
    setResep("");
    setNomorSp("");
    setAlamatKirim("");
    setTanggalKirimFrame("");
    setTanggalKirimLensa("");
    setCekMutasi(false);
    setIdForm("");
    setErrorMsg("");
    setIsConfirmModalOpen(true);
  };

  const handleCreateNewData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/collect-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newNama,
          email: newEmail,
          tanggal_lahir: newTanggalLahir,
          no_hp: newNoHp,
          nomor_kartu: newNomorKartu,
          unit_bri: newUnitBri,
          promotor: newPromotor,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data baru.");

      setIsNewDataModalOpen(false);
      // Reset form
      setNewNama("");
      setNewEmail("");
      setNewTanggalLahir("");
      setNewNoHp("");
      setNewNomorKartu("");
      setNewUnitBri("");
      setNewPromotor("");

      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerify) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/konfirmasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifikasi_id: selectedVerify.verifikasi_id,
          beli,
          resep,
          nomor_sp: nomorSp,
          alamat_kirim: alamatKirim,
          tanggal_kirim_frame: tanggalKirimFrame,
          tanggal_kirim_lensa: tanggalKirimLensa,
          cek_mutasi: cekMutasi,
          id_form: idForm,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan konfirmasi.");

      setIsConfirmModalOpen(false);
      setSelectedVerify(null);
      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout profile={profile} title="Admin Dashboard - Antrean Konfirmasi">
      <div className="space-y-6 font-sans">
        {/* Dashboard control header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Operasional Cabang: {profile.cabang}</h3>
            <p className="text-slate-400 text-sm">
              Input data konsumen baru atau proses konfirmasi pembelian dari antrean CS.
            </p>
          </div>
          <button
            onClick={() => {
              setErrorMsg("");
              setIsNewDataModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Data</span>
          </button>
        </div>

        {/* Queues Section */}
        <div className="space-y-4">
          <h4 className="text-md font-bold text-white font-outfit uppercase tracking-wider text-slate-400">
            Antrean Konfirmasi Pembelian (Dari CS)
          </h4>
          <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Tanggal Verif</th>
                    <th className="p-4">Nama Konsumen</th>
                    <th className="p-4">Nama CS</th>
                    <th className="p-4">Plafon Limit</th>
                    <th className="p-4">Nomor Kartu</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Tidak ada antrean konfirmasi pembelian dari CS.
                      </td>
                    </tr>
                  ) : (
                    queue.map((row) => {
                      const cd = row.collect_data || {};
                      return (
                        <tr key={row.verifikasi_id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4">
                            {new Date(row.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-4 font-semibold text-white">{cd.nama || "N/A"}</td>
                          <td className="p-4 text-slate-400">{row.nama_cs}</td>
                          <td className="p-4 font-bold text-emerald-400">Rp {row.plafon}</td>
                          <td className="p-4 font-mono text-xs">{cd.nomor_kartu || "N/A"}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenConfirm(row)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200 hover:-translate-y-[1px]"
                            >
                              Konfirmasi Beli
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

        {/* Modal: Create New Data */}
        {isNewDataModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={() => setIsNewDataModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Tambah Konsumen Baru</h3>
              <p className="text-slate-400 text-xs mb-4">
                Membuat data transaksi utama (`collect_data`) untuk wilayah cabang: <span className="text-white font-bold">{profile.cabang}</span>
              </p>

              <form onSubmit={handleCreateNewData} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Konsumen</label>
                    <input
                      type="text"
                      required
                      value={newNama}
                      onChange={(e) => setNewNama(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nomor Kartu</label>
                    <input
                      type="text"
                      required
                      value={newNomorKartu}
                      onChange={(e) => setNewNomorKartu(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm font-mono"
                      placeholder="e.g. 4321••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="konsumen@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={newTanggalLahir}
                      onChange={(e) => setNewTanggalLahir(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">No. HP</label>
                    <input
                      type="text"
                      required
                      value={newNoHp}
                      onChange={(e) => setNewNoHp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="0812•••"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Unit BRI</label>
                    <input
                      type="text"
                      required
                      value={newUnitBri}
                      onChange={(e) => setNewUnitBri(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="e.g. KC Cikini"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Promotor</label>
                    <input
                      type="text"
                      required
                      value={newPromotor}
                      onChange={(e) => setNewPromotor(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="Nama sales"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewDataModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                  >
                    {loading ? "Menyimpan..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Konfirmasi Beli */}
        {isConfirmModalOpen && selectedVerify && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Form Konfirmasi Beli</h3>
              <p className="text-slate-400 text-xs mb-4">
                Konfirmasi transaksi konsumen: <span className="text-white font-semibold">{selectedVerify.collect_data?.nama}</span>
              </p>

              <form onSubmit={handleConfirmSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <input
                      type="checkbox"
                      id="beli"
                      checked={beli}
                      onChange={(e) => setBeli(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="beli" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      Konfirmasi Beli (Deal)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <input
                      type="checkbox"
                      id="cekMutasi"
                      checked={cekMutasi}
                      onChange={(e) => setCekMutasi(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="cekMutasi" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      Perlu Cek Mutasi Keuangan
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">No. Resep</label>
                    <input
                      type="text"
                      required
                      value={resep}
                      onChange={(e) => setResep(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="Resep kacamata"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nomor SP</label>
                    <input
                      type="text"
                      required
                      value={nomorSp}
                      onChange={(e) => setNomorSp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="e.g. SP-55123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tgl Kirim Frame</label>
                    <input
                      type="date"
                      value={tanggalKirimFrame}
                      onChange={(e) => setTanggalKirimFrame(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tgl Kirim Lensa</label>
                    <input
                      type="date"
                      value={tanggalKirimLensa}
                      onChange={(e) => setTanggalKirimLensa(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alamat Kirim</label>
                    <input
                      type="text"
                      required
                      value={alamatKirim}
                      onChange={(e) => setAlamatKirim(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="Alamat pengiriman fisik"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">ID Form</label>
                    <input
                      type="text"
                      required
                      value={idForm}
                      onChange={(e) => setIdForm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="ID form spreadsheet"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                  >
                    {loading ? "Menyimpan..." : "Deal Transaksi"}
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
  const authRes = await checkAuthAndRole(context, ["admin"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query verifikasi_kartu joined with collect_data and konfirmasi_beli
  // RLS will automatically apply and restrict based on user's cabang
  const { data, error } = await supabase
    .from("verifikasi_kartu")
    .select("*, collect_data(*), konfirmasi_beli(konfirmasi_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Admin queue:", error);
  }

  // Filter queue logic: verifikasi_id NOT present in konfirmasi_beli
  const initialQueue = (data || []).filter(
    (row: any) => !row.konfirmasi_beli || row.konfirmasi_beli.length === 0
  );

  return {
    props: {
      profile,
      initialQueue,
    },
  };
};
