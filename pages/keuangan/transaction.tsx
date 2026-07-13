import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface KeuanganTransactionProps {
  profile: UserProfile;
  history: any[];
}

export default function KeuanganTransaction({ profile, history }: KeuanganTransactionProps) {
  return (
    <Layout profile={profile} title="Riwayat Keuangan">
      <div className="space-y-6 font-sans">
        {/* Header summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Riwayat Realisasi Aktual Keuangan</h3>
            <p className="text-slate-400 text-sm">
              Seluruh transaksi konsumen nasional yang telah diselesaikan dan diaktualisasi nilai pembayarannya.
            </p>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-sm font-outfit">
            {history.length} Transaksi Aktual
          </div>
        </div>

        {/* History Table */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Tanggal Aktual</th>
                  <th className="p-4">Nama Konsumen</th>
                  <th className="p-4">Cabang</th>
                  <th className="p-4">Nomor Kartu</th>
                  <th className="p-4">Nilai Actual (Rp)</th>
                  <th className="p-4 text-center">Status ACC Pusat</th>
                  <th className="p-4">Nomor ACC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Belum ada riwayat aktual yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const kb = row.konfirmasi_beli || {};
                    const vk = kb.verifikasi_kartu || {};
                    const cd = vk.collect_data || {};
                    return (
                      <tr key={row.aktual_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-4">
                          {new Date(row.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-4 font-semibold text-white">{cd.nama || "N/A"}</td>
                        <td className="p-4 text-xs text-slate-400">{cd.cabang || "N/A"}</td>
                        <td className="p-4 font-mono text-xs">{cd.nomor_kartu || "N/A"}</td>
                        <td className="p-4 font-bold text-white">Rp {row.actual}</td>
                        <td className="p-4 text-center">
                          {row.acc_pusat_actual ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-md bg-slate-800 border border-slate-700 text-slate-500">
                              -
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-400">{row.no_acc_pusat_actual || "-"}</td>
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
  const authRes = await checkAuthAndRole(context, ["keuangan"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query aktual joined with konfirmasi_beli -> verifikasi_kartu -> collect_data
  const { data: history, error } = await supabase
    .from("aktual")
    .select("*, konfirmasi_beli(*, verifikasi_kartu(*, collect_data(*)))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Keuangan history:", error);
  }

  return {
    props: {
      profile,
      history: history || [],
    },
  };
};
