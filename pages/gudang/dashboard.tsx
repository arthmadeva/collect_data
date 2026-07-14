import { useState } from "react";
import { useRouter } from "next/router";
import { createPagesServerClient } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/client";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface GudangDashboardProps {
  user: any;
  initialPraQueue: any[];
  initialPostQueue: any[];
}

export default function GudangDashboard({ user, initialPraQueue, initialPostQueue }: GudangDashboardProps) {
  const supabase = createClient();
  const router = useRouter();

  const [praQueue, setPraQueue] = useState(initialPraQueue);
  const [postQueue, setPostQueue] = useState(initialPostQueue);

  const [selectedPraTx, setSelectedPraTx] = useState<any | null>(null);
  const [selectedPostTx, setSelectedPostTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. pra_produksi Form States
  const [tanggalTerimaFrame, setTanggalTerimaFrame] = useState("");
  const [sudahTerimaFrame, setSudahTerimaFrame] = useState(true);
  const [stock, setStock] = useState(false);
  const [gosok, setGosok] = useState(false);
  const [tanggalTerimaLensa, setTanggalTerimaLensa] = useState("");

  // 2. post_produksi Form States
  const [noFaktur, setNoFaktur] = useState("");
  const [sudahProduksi, setSudahProduksi] = useState(true);
  const [petugasProduksi, setPetugasProduksi] = useState(user.user_metadata?.nama || "");
  const [tanggalSelesaiProduksi, setTanggalSelesaiProduksi] = useState("");
  const [prosesPengiriman, setProsesPengiriman] = useState(true);
  const [qualityControl, setQualityControl] = useState(true);
  const [resiPengiriman, setResiPengiriman] = useState("");

  const refreshData = async () => {
    // Refresh Pra-Produksi Queue
    const { data: q1, error: err1 } = await supabase
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
        pra_produksi!left(pra_id)
      `)
      .is("pra_produksi.pra_id", null);

    if (!err1 && q1) {
      setPraQueue(q1);
    }

    // Refresh Post-Produksi Queue
    const { data: q2, error: err2 } = await supabase
      .from("pra_produksi")
      .select(`
        *,
        konfirmasi_beli!inner (
          verifikasi_kartu!inner (
            collect_data!inner (
              nama,
              nomor_kartu,
              cabang
            )
          )
        ),
        post_produksi!left(post_id)
      `)
      .is("post_produksi.post_id", null);

    if (!err2 && q2) {
      setPostQueue(q2);
    }
  };

  const handlePraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPraTx) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("pra_produksi").insert({
        konfirmasi_id: selectedPraTx.konfirmasi_id,
        tanggal_terima_frame: tanggalTerimaFrame || null,
        sudah_terima_frame: sudahTerimaFrame,
        stock,
        gosok,
        tanggal_terima_lensa: tanggalTerimaLensa || null,
      });

      if (insertError) throw insertError;

      // Reset
      setSelectedPraTx(null);
      setTanggalTerimaFrame("");
      setSudahTerimaFrame(true);
      setStock(false);
      setGosok(false);
      setTanggalTerimaLensa("");

      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data pra-produksi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostTx) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("post_produksi").insert({
        pra_id: selectedPostTx.pra_id,
        no_faktur: noFaktur,
        sudah_produksi: sudahProduksi,
        petugas_produksi: petugasProduksi,
        tanggal_selesai_produksi: tanggalSelesaiProduksi || null,
        proses_pengiriman: prosesPengiriman,
        quality_control: qualityControl,
        resi_pengiriman: resiPengiriman,
      });

      if (insertError) throw insertError;

      // Reset
      setSelectedPostTx(null);
      setNoFaktur("");
      setSudahProduksi(true);
      setTanggalSelesaiProduksi("");
      setProsesPengiriman(true);
      setQualityControl(true);
      setResiPengiriman("");

      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data post-produksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-8">

        {/* SECTION 1: ANTREAN PRA-PRODUKSI */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Antrean Pra-Produksi (Gudang)</h3>
              <p className="text-sm text-slate-500 mt-1">
                Daftar transaksi pembelian terkonfirmasi yang menunggu penyelesaian penyiapan material optik.
              </p>
            </div>
            <span className="text-2xl font-extrabold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100">
              {praQueue.length}
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
                    <th className="px-6 py-4">Resep</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {praQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                        Tidak ada antrean pra-produksi.
                      </td>
                    </tr>
                  ) : (
                    praQueue.map((item) => {
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
                          <td className="px-6 py-4 font-mono text-xs max-w-[150px] truncate" title={item.resep}>
                            {item.resep}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPraTx(item);
                                setError(null);
                              }}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-violet-100 cursor-pointer"
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

        {/* SECTION 2: ANTREAN POST-PRODUKSI */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Antrean Post-Produksi (Gudang)</h3>
              <p className="text-sm text-slate-500 mt-1">
                Daftar material frame & lensa yang telah siap dan sedang menunggu proses manufaktur fisik/pengiriman.
              </p>
            </div>
            <span className="text-2xl font-extrabold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100">
              {postQueue.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Nama Konsumen</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Status Frame</th>
                    <th className="px-6 py-4">Stok/Gosok</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {postQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                        Tidak ada antrean post-produksi.
                      </td>
                    </tr>
                  ) : (
                    postQueue.map((item) => {
                      const client = item.konfirmasi_beli?.verifikasi_kartu?.collect_data;
                      return (
                        <tr key={item.pra_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{client?.nama}</div>
                            <div className="text-xs text-slate-400 font-mono">{client?.nomor_kartu}</div>
                          </td>
                          <td className="px-6 py-4 uppercase font-bold text-xs text-slate-500">
                            {client?.cabang || "-"}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {item.sudah_terima_frame ? (
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">
                                Diterima ({item.tanggal_terima_frame || "-"})
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200">
                                Belum Diterima
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            <span className={item.stock ? "text-emerald-600" : "text-slate-400"}>Stock</span>
                            {" / "}
                            <span className={item.gosok ? "text-violet-600" : "text-slate-400"}>Gosok</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPostTx(item);
                                setError(null);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-indigo-100 cursor-pointer"
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

        {/* MODAL: INPUT PRA-PRODUKSI */}
        {selectedPraTx && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Form Input Pra-Produksi</h4>
                  <p className="text-xs text-slate-500 mt-1">Konsumen: {selectedPraTx.verifikasi_kartu?.collect_data?.nama}</p>
                </div>
                <button
                  onClick={() => setSelectedPraTx(null)}
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

              <form onSubmit={handlePraSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tgl Terima Frame</label>
                    <input
                      type="date"
                      value={tanggalTerimaFrame}
                      onChange={(e) => setTanggalTerimaFrame(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tgl Terima Lensa</label>
                    <input
                      type="date"
                      value={tanggalTerimaLensa}
                      onChange={(e) => setTanggalTerimaLensa(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Sudah Terima Frame</div>
                    <div className="text-xs text-slate-500 font-medium">Kondisi fisik frame sudah di gudang.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sudahTerimaFrame}
                    onChange={(e) => setSudahTerimaFrame(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Tipe Stock</div>
                      <div className="text-[10px] text-slate-500">Lensa stock pabrik.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={stock}
                      onChange={(e) => setStock(e.target.checked)}
                      className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-l border-slate-200 pl-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Tipe Gosok</div>
                      <div className="text-[10px] text-slate-500">Lensa gosok lab.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={gosok}
                      onChange={(e) => setGosok(e.target.checked)}
                      className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-violet-100 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Pra-Produksi"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: INPUT POST-PRODUKSI */}
        {selectedPostTx && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Form Input Post-Produksi</h4>
                  <p className="text-xs text-slate-500 mt-1">Konsumen: {selectedPostTx.konfirmasi_beli?.verifikasi_kartu?.collect_data?.nama}</p>
                </div>
                <button
                  onClick={() => setSelectedPostTx(null)}
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

              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">No. Faktur</label>
                    <input
                      type="text"
                      required
                      value={noFaktur}
                      onChange={(e) => setNoFaktur(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Petugas Produksi</label>
                    <input
                      type="text"
                      required
                      value={petugasProduksi}
                      onChange={(e) => setPetugasProduksi(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tgl Selesai Produksi</label>
                    <input
                      type="date"
                      required
                      value={tanggalSelesaiProduksi}
                      onChange={(e) => setTanggalSelesaiProduksi(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resi Pengiriman</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: JNE-9823412"
                      value={resiPengiriman}
                      onChange={(e) => setResiPengiriman(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">Selesai Produksi</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={sudahProduksi}
                      onChange={(e) => setSudahProduksi(e.target.checked)}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-l border-slate-200 pl-3">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">Proses Kirim</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prosesPengiriman}
                      onChange={(e) => setProsesPengiriman(e.target.checked)}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-l border-slate-200 pl-3">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">Quality Control (QC)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={qualityControl}
                      onChange={(e) => setQualityControl(e.target.checked)}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-violet-100 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Post-Produksi"}
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

  // Pra-Produksi Queue (konfirmasi_beli left join pra_produksi filter for null)
  const { data: praQueue, error: err1 } = await supabase
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
      pra_produksi!left(pra_id)
    `)
    .is("pra_produksi.pra_id", null);

  // Post-Produksi Queue (pra_produksi left join post_produksi filter for null)
  const { data: postQueue, error: err2 } = await supabase
    .from("pra_produksi")
    .select(`
      *,
      konfirmasi_beli!inner (
        verifikasi_kartu!inner (
          collect_data!inner (
            nama,
            nomor_kartu,
            cabang
          )
        )
      ),
      post_produksi!left(post_id)
    `)
    .is("post_produksi.post_id", null);

  if (err1) console.error("Error fetching pra queue:", err1);
  if (err2) console.error("Error fetching post queue:", err2);

  return {
    props: {
      user,
      initialPraQueue: praQueue || [],
      initialPostQueue: postQueue || [],
    },
  };
};
