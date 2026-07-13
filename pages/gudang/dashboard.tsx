import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface GudangDashboardProps {
  profile: UserProfile;
  initialQueuePra: any[];
  initialQueuePost: any[];
}

export default function GudangDashboard({
  profile,
  initialQueuePra,
  initialQueuePost,
}: GudangDashboardProps) {
  const router = useRouter();

  // Modals status
  const [isPraModalOpen, setIsPraModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Form: Pra-Produksi
  const [tanggalTerimaFramei, setTanggalTerimaFramei] = useState("");
  const [sudahTerimaFrame, setSudahTerimaFrame] = useState(false);
  const [stock, setStock] = useState(false);
  const [gosok, setGosok] = useState(false);
  const [tanggalTerimaLensa, setTanggalTerimaLensa] = useState("");

  // Form: Post-Produksi
  const [noFaktur, setNoFaktur] = useState("");
  const [sudahProduksi, setSudahProduksi] = useState(false);
  const [petugasProduksi, setPetugasProduksi] = useState("");
  const [tanggalSelesaiProduksi, setTanggalSelesaiProduksi] = useState("");
  const [prosesPengiriman, setProsesPengiriman] = useState(false);
  const [qualityControl, setQualityControl] = useState(false);
  const [resiPengiriman, setResiPengiriman] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenPra = (tx: any) => {
    setSelectedTx(tx);
    setTanggalTerimaFramei(new Date().toISOString().split("T")[0]);
    setSudahTerimaFrame(false);
    setStock(false);
    setGosok(false);
    setTanggalTerimaLensa("");
    setErrorMsg("");
    setIsPraModalOpen(true);
  };

  const handleOpenPost = (tx: any) => {
    setSelectedTx(tx);
    setNoFaktur("");
    setSudahProduksi(false);
    setPetugasProduksi("");
    setTanggalSelesaiProduksi(new Date().toISOString().split("T")[0]);
    setProsesPengiriman(false);
    setQualityControl(false);
    setResiPengiriman("");
    setErrorMsg("");
    setIsPostModalOpen(true);
  };

  const handlePraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/gudang/pra-produksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konfirmasi_id: selectedTx.konfirmasi_id,
          tanggal_terima_framei: tanggalTerimaFramei,
          sudah_terima_frame: sudahTerimaFrame,
          stock,
          gosok,
          tanggal_terima_lensa: tanggalTerimaLensa,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan pra-produksi.");

      setIsPraModalOpen(false);
      setSelectedTx(null);
      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/gudang/post-produksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pra_id: selectedTx.pra_id,
          no_faktur: noFaktur,
          sudah_produksi: sudahProduksi,
          petugas_produksi: petugasProduksi,
          tanggal_selesai_produksi: tanggalSelesaiProduksi,
          proses_pengiriman: prosesPengiriman,
          quality_control: qualityControl,
          resi_pengiriman: resiPengiriman,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan post-produksi.");

      setIsPostModalOpen(false);
      setSelectedTx(null);
      router.replace(router.asPath);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout profile={profile} title="Gudang Dashboard - Kontrol Produksi & Logistik">
      <div className="space-y-8 font-sans">
        {/* Table 1: Antrean Pra-Produksi */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-bold text-white font-outfit uppercase tracking-wider text-slate-400">
              1. Antrean Pra-Produksi (Penerimaan Bahan)
            </h4>
            <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg font-outfit">
              {initialQueuePra.length} Antrean
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
                    <th className="p-4">Resep</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {initialQueuePra.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Tidak ada antrean pra-produksi.
                      </td>
                    </tr>
                  ) : (
                    initialQueuePra.map((row) => {
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
                          <td className="p-4 text-xs max-w-[150px] truncate" title={row.resep}>
                            {row.resep}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenPra(row)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200"
                            >
                              Pra-Produksi
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

        {/* Table 2: Antrean Post-Produksi */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-bold text-white font-outfit uppercase tracking-wider text-slate-400">
              2. Antrean Post-Produksi (Penyelesaian & Pengiriman)
            </h4>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-lg font-outfit">
              {initialQueuePost.length} Antrean
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Tanggal Pra-Prod</th>
                    <th className="p-4">Nama Konsumen</th>
                    <th className="p-4">Cabang</th>
                    <th className="p-4">Nomor SP</th>
                    <th className="p-4">Spesifikasi Lensa</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {initialQueuePost.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Tidak ada antrean post-produksi.
                      </td>
                    </tr>
                  ) : (
                    initialQueuePost.map((row) => {
                      const kb = row.konfirmasi_beli || {};
                      const vk = kb.verifikasi_kartu || {};
                      const cd = vk.collect_data || {};
                      return (
                        <tr key={row.pra_id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4">
                            {new Date(row.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-4 font-semibold text-white">{cd.nama || "N/A"}</td>
                          <td className="p-4 text-slate-400">{cd.cabang || "N/A"}</td>
                          <td className="p-4 text-indigo-400 font-semibold">{kb.nomor_sp}</td>
                          <td className="p-4 text-xs text-slate-400">
                            {row.stock ? "Stock" : ""} {row.gosok ? "Gosok" : ""}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenPost(row)}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200"
                            >
                              Post-Produksi
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

        {/* Modal: Pra-Produksi */}
        {isPraModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={() => setIsPraModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Penerimaan Bahan (Pra-Produksi)</h3>
              <p className="text-slate-400 text-xs mb-4">
                Konsumen: <span className="text-white font-semibold">{selectedTx.verifikasi_kartu?.collect_data?.nama}</span>
              </p>

              <form onSubmit={handlePraSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tgl Terima Frame</label>
                    <input
                      type="date"
                      required
                      value={tanggalTerimaFramei}
                      onChange={(e) => setTanggalTerimaFramei(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tgl Terima Lensa</label>
                    <input
                      type="date"
                      required
                      value={tanggalTerimaLensa}
                      onChange={(e) => setTanggalTerimaLensa(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="sudahTerimaFrame"
                    checked={sudahTerimaFrame}
                    onChange={(e) => setSudahTerimaFrame(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                  />
                  <label htmlFor="sudahTerimaFrame" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Sudah Terima Frame Fisik
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="stock"
                      checked={stock}
                      onChange={(e) => setStock(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="stock" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      Tipe Lensa Stock
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="gosok"
                      checked={gosok}
                      onChange={(e) => setGosok(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="gosok" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      Tipe Lensa Gosok
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPraModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                  >
                    {loading ? "Menyimpan..." : "Simpan Pra-Produksi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Post-Produksi */}
        {isPostModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-white font-outfit mb-2">Penyelesaian & Pengiriman (Post-Produksi)</h3>
              <p className="text-slate-400 text-xs mb-4">
                Konsumen: <span className="text-white font-semibold">{selectedTx.konfirmasi_beli?.verifikasi_kartu?.collect_data?.nama}</span>
              </p>

              <form onSubmit={handlePostSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">No. Faktur</label>
                    <input
                      type="text"
                      required
                      value={noFaktur}
                      onChange={(e) => setNoFaktur(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="Faktur produksi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Petugas Produksi</label>
                    <input
                      type="text"
                      required
                      value={petugasProduksi}
                      onChange={(e) => setPetugasProduksi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="Nama teknisi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={tanggalSelesaiProduksi}
                      onChange={(e) => setTanggalSelesaiProduksi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">No. Resi Pengiriman</label>
                    <input
                      type="text"
                      required
                      value={resiPengiriman}
                      onChange={(e) => setResiPengiriman(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm"
                      placeholder="e.g. JNE-102983"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <input
                      type="checkbox"
                      id="sudahProduksi"
                      checked={sudahProduksi}
                      onChange={(e) => setSudahProduksi(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="sudahProduksi" className="text-[10px] font-semibold text-slate-300 cursor-pointer select-none">
                      Produksi Selesai
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <input
                      type="checkbox"
                      id="qualityControl"
                      checked={qualityControl}
                      onChange={(e) => setQualityControl(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="qualityControl" className="text-[10px] font-semibold text-slate-300 cursor-pointer select-none">
                      Lolos QC
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <input
                      type="checkbox"
                      id="prosesPengiriman"
                      checked={prosesPengiriman}
                      onChange={(e) => setProsesPengiriman(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
                    />
                    <label htmlFor="prosesPengiriman" className="text-[10px] font-semibold text-slate-300 cursor-pointer select-none">
                      Siap Kirim
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold"
                  >
                    {loading ? "Menyimpan..." : "Kirim Fisik & Selesai"}
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
  const authRes = await checkAuthAndRole(context, ["gudang"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Fetch Queue 1: konfirmasi_beli rows without pra_produksi
  const { data: confirmData, error: confirmError } = await supabase
    .from("konfirmasi_beli")
    .select("*, verifikasi_kartu(*, collect_data(*)), pra_produksi(pra_id)")
    .order("created_at", { ascending: false });

  if (confirmError) console.error("Error fetching Gudang queue 1:", confirmError);

  const initialQueuePra = (confirmData || []).filter(
    (row: any) => !row.pra_produksi || row.pra_produksi.length === 0
  );

  // Fetch Queue 2: pra_produksi rows without post_produksi
  const { data: praData, error: praError } = await supabase
    .from("pra_produksi")
    .select("*, konfirmasi_beli(*, verifikasi_kartu(*, collect_data(*))), post_produksi(post_id)")
    .order("created_at", { ascending: false });

  if (praError) console.error("Error fetching Gudang queue 2:", praError);

  const initialQueuePost = (praData || []).filter(
    (row: any) => !row.post_produksi || row.post_produksi.length === 0
  );

  return {
    props: {
      profile,
      initialQueuePra,
      initialQueuePost,
    },
  };
};
