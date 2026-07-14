import { useState } from "react";
import { useRouter } from "next/router";
import { createPagesServerClient } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/client";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface AdminDashboardProps {
  user: any;
  initialQueue: any[];
}

export default function AdminDashboard({ user, initialQueue }: AdminDashboardProps) {
  const supabase = createClient();
  const router = useRouter();

  const [queue, setQueue] = useState(initialQueue);
  const [showCollectForm, setShowCollectForm] = useState(false);
  const [selectedVerify, setSelectedVerify] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. collect_data Form States
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [noHp, setNoHp] = useState("");
  const [nomorKartu, setNomorKartu] = useState("");
  const [unitBri, setUnitBri] = useState("");
  const [promotor, setPromotor] = useState("");

  // 2. konfirmasi_beli Form States
  const [beli, setBeli] = useState(true);
  const [resep, setResep] = useState("");
  const [nomorSp, setNomorSp] = useState("");
  const [alamatKirim, setAlamatKirim] = useState("");
  const [tanggalKirimFrame, setTanggalKirimFrame] = useState("");
  const [tanggalKirimLensa, setTanggalKirimLensa] = useState("");
  const [cekMutasi, setCekMutasi] = useState(false);
  const [idForm, setIdForm] = useState("");

  const refreshData = async () => {
    const userCabang = user.user_metadata?.cabang;
    const { data, error: qError } = await supabase
      .from("verifikasi_kartu")
      .select(`
        *,
        collect_data!inner (
          nama,
          nomor_kartu,
          cabang
        ),
        konfirmasi_beli!left(konfirmasi_id)
      `)
      .is("konfirmasi_beli.konfirmasi_id", null)
      .eq("collect_data.cabang", userCabang);

    if (!qError && data) {
      setQueue(data);
    }
  };

  const handleCreateCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const userCabang = user.user_metadata?.cabang;

    try {
      const { error: insertError } = await supabase.from("collect_data").insert({
        nama,
        email,
        tanggal_lahir: tanggalLahir || null,
        no_hp: noHp,
        nomor_kartu: nomorKartu,
        unit_bri: unitBri,
        promotor,
        cabang: userCabang,
      });

      if (insertError) throw insertError;

      // Reset form
      setNama("");
      setEmail("");
      setTanggalLahir("");
      setNoHp("");
      setNomorKartu("");
      setUnitBri("");
      setPromotor("");
      setShowCollectForm(false);

      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal membuat data transaksi baru.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerify) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("konfirmasi_beli").insert({
        verifikasi_id: selectedVerify.verifikasi_id,
        beli,
        resep,
        nomor_sp: nomorSp,
        alamat_kirim: alamatKirim,
        tanggal_kirim_frame: tanggalKirimFrame || null,
        tanggal_kirim_lensa: tanggalKirimLensa || null,
        cek_mutasi: cekMutasi,
        id_form: idForm,
      });

      if (insertError) throw insertError;

      // Reset states
      setSelectedVerify(null);
      setResep("");
      setNomorSp("");
      setAlamatKirim("");
      setTanggalKirimFrame("");
      setTanggalKirimLensa("");
      setCekMutasi(false);
      setIdForm("");

      await refreshData();
      router.replace(router.asPath);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan konfirmasi pembelian.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Top bar with create trigger */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Antrean Konfirmasi Pembelian</h3>
            <p className="text-sm text-slate-500 mt-1">
              Konsumen cabang <b>{user.user_metadata?.cabang?.toUpperCase()}</b> yang telah terverifikasi dan menunggu konfirmasi pemesanan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Antrean: {queue.length}
            </span>
            <button
              onClick={() => {
                setShowCollectForm(true);
                setError(null);
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-violet-100 cursor-pointer"
            >
              + Create New Data
            </button>
          </div>
        </div>

        {/* Table Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">Nomor Kartu</th>
                  <th className="px-6 py-4">Nama CS</th>
                  <th className="px-6 py-4">Plafon</th>
                  <th className="px-6 py-4">Tanggal Verifikasi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Tidak ada antrean konfirmasi pembelian untuk cabang Anda.
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item.verifikasi_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.collect_data?.nama || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {item.collect_data?.nomor_kartu || "-"}
                      </td>
                      <td className="px-6 py-4">{item.nama_cs}</td>
                      <td className="px-6 py-4 font-semibold text-violet-600">Rp {item.plafon}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.tanggal_telepon}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedVerify(item);
                            setError(null);
                          }}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-violet-100 cursor-pointer"
                        >
                          Konfirmasi Beli
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create New Data (collect_data) */}
        {showCollectForm && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Input Data Transaksi Baru</h4>
                  <p className="text-xs text-slate-500 mt-1">Cabang Penempatan: {user.user_metadata?.cabang?.toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setShowCollectForm(false)}
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

              <form onSubmit={handleCreateCollect} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Konsumen</label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">No. HP</label>
                  <input
                    type="text"
                    required
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor Kartu</label>
                  <input
                    type="text"
                    required
                    value={nomorKartu}
                    onChange={(e) => setNomorKartu(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Unit BRI</label>
                  <input
                    type="text"
                    required
                    value={unitBri}
                    onChange={(e) => setUnitBri(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Promotor</label>
                  <input
                    type="text"
                    required
                    value={promotor}
                    onChange={(e) => setPromotor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCollectForm(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm transition-all font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg text-sm transition-all font-semibold cursor-pointer"
                  >
                    {loading ? "Menyimpan..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Konfirmasi Beli */}
        {selectedVerify && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Form Konfirmasi Pembelian</h4>
                  <p className="text-xs text-slate-500 mt-1">Konsumen: {selectedVerify.collect_data?.nama}</p>
                </div>
                <button
                  onClick={() => setSelectedVerify(null)}
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

              <form onSubmit={handleConfirmPurchase} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor SP</label>
                    <input
                      type="text"
                      required
                      value={nomorSp}
                      onChange={(e) => setNomorSp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">ID Form</label>
                    <input
                      type="text"
                      required
                      value={idForm}
                      onChange={(e) => setIdForm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resep Lensa</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: R: -1.00 L: -1.50"
                    value={resep}
                    onChange={(e) => setResep(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Alamat Pengiriman</label>
                  <textarea
                    required
                    rows={2}
                    value={alamatKirim}
                    onChange={(e) => setAlamatKirim(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanggal Kirim Frame</label>
                    <input
                      type="date"
                      value={tanggalKirimFrame}
                      onChange={(e) => setTanggalKirimFrame(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanggal Kirim Lensa</label>
                    <input
                      type="date"
                      value={tanggalKirimLensa}
                      onChange={(e) => setTanggalKirimLensa(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Status Beli</div>
                      <div className="text-[10px] text-slate-500">Konfirmasi status beli.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={beli}
                      onChange={(e) => setBeli(e.target.checked)}
                      className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-l border-slate-200 pl-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Cek Mutasi</div>
                      <div className="text-[10px] text-slate-500">Memerlukan cek mutasi bank.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cekMutasi}
                      onChange={(e) => setCekMutasi(e.target.checked)}
                      className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-lg py-3 text-sm transition-all shadow-lg shadow-violet-100 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Kirim Konfirmasi"}
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

  const { data: queue, error } = await supabase
    .from("verifikasi_kartu")
    .select(`
      *,
      collect_data!inner (
        nama,
        nomor_kartu,
        cabang
      ),
      konfirmasi_beli!left(konfirmasi_id)
    `)
    .is("konfirmasi_beli.konfirmasi_id", null)
    .eq("collect_data.cabang", userCabang);

  if (error) {
    console.error("Admin Queue query error:", error);
  }

  return {
    props: {
      user,
      initialQueue: queue || [],
    },
  };
};
