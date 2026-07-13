import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface GudangTransactionProps {
  profile: UserProfile;
  history: any[];
}

export default function GudangTransaction({ profile, history }: GudangTransactionProps) {
  return (
    <Layout profile={profile} title="Riwayat Gudang & Logistik">
      <div className="space-y-6 font-sans">
        {/* Header summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Riwayat Penyelesaian Logistik Nasional</h3>
            <p className="text-slate-400 text-sm">
              Status pengerjaan fisik lensa, perakitan frame, dan data resi pengiriman logistik secara nasional.
            </p>
          </div>
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-xl text-sm font-outfit">
            {history.length} Terkirim
          </div>
        </div>

        {/* History Table */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Tanggal Selesai</th>
                  <th className="p-4">Nama Konsumen</th>
                  <th className="p-4">Cabang</th>
                  <th className="p-4">No. Faktur</th>
                  <th className="p-4">Petugas / Teknisi</th>
                  <th className="p-4 text-center">Status Produksi</th>
                  <th className="p-4 text-center">Lolos QC</th>
                  <th className="p-4">No. Resi Pengiriman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Belum ada riwayat pengiriman logistik.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const pp = row.pra_produksi || {};
                    const kb = pp.konfirmasi_beli || {};
                    const vk = kb.verifikasi_kartu || {};
                    const cd = vk.collect_data || {};
                    return (
                      <tr key={row.post_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-4">
                          {row.tanggal_selesai_produksi
                            ? new Date(row.tanggal_selesai_produksi).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                            : "-"}
                        </td>
                        <td className="p-4 font-semibold text-white">{cd.nama || "N/A"}</td>
                        <td className="p-4 text-xs text-slate-400">{cd.cabang || "N/A"}</td>
                        <td className="p-4 font-mono text-xs text-indigo-400 font-bold">{row.no_faktur}</td>
                        <td className="p-4 text-slate-400">{row.petugas_produksi}</td>
                        <td className="p-4 text-center">
                          {row.sudah_produksi ? (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 border border-slate-700 text-slate-400 uppercase">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.quality_control ? (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                              Lolos
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/10 border border-red-500/20 text-red-400 uppercase">
                              Gagal
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-amber-400 font-bold">
                          {row.resi_pengiriman || "Belum dikirim"}
                          {row.proses_pengiriman && (
                            <span className="block text-[8px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                              Sudah Dikirim
                            </span>
                          )}
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
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authRes = await checkAuthAndRole(context, ["gudang"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query post_produksi joined with pra_produksi -> konfirmasi_beli -> verifikasi_kartu -> collect_data
  const { data: history, error } = await supabase
    .from("post_produksi")
    .select("*, pra_produksi(*, konfirmasi_beli(*, verifikasi_kartu(*, collect_data(*)))))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Gudang history:", error);
  }

  return {
    props: {
      profile,
      history: history || [],
    },
  };
};
