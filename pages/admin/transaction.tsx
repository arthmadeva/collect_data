import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface AdminTransactionProps {
  profile: UserProfile;
  history: any[];
}

export default function AdminTransaction({ profile, history }: AdminTransactionProps) {
  return (
    <Layout profile={profile} title="Riwayat Konfirmasi Admin">
      <div className="space-y-6 font-sans">
        {/* Header summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Riwayat Transaksi Cabang {profile.cabang}</h3>
            <p className="text-slate-400 text-sm">
              Daftar seluruh konfirmasi pembelian (deal transaksi) yang telah diproses di wilayah Anda.
            </p>
          </div>
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-xl text-sm font-outfit">
            {history.length} Deal Transaksi
          </div>
        </div>

        {/* History Table */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Tanggal Deal</th>
                  <th className="p-4">Nama Konsumen</th>
                  <th className="p-4">Nomor Kartu</th>
                  <th className="p-4">No. SP / Resep</th>
                  <th className="p-4">Alamat Kirim</th>
                  <th className="p-4 text-center">Mutasi</th>
                  <th className="p-4">Tgl Kirim (Frame/Lensa)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Belum ada riwayat deal transaksi yang diproses.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
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
                        <td className="p-4 font-mono text-xs">{cd.nomor_kartu || "N/A"}</td>
                        <td className="p-4 text-xs">
                          <div className="font-semibold text-indigo-400">{row.nomor_sp}</div>
                          <div className="text-slate-400">Resep: {row.resep}</div>
                        </td>
                        <td className="p-4 text-xs max-w-[200px] truncate" title={row.alamat_kirim}>
                          {row.alamat_kirim}
                        </td>
                        <td className="p-4 text-center">
                          {row.cek_mutasi ? (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                              Mutasi
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                              Tidak Mutasi
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          <div>F: {row.tanggal_kirim_frame ? new Date(row.tanggal_kirim_frame).toLocaleDateString("id-ID") : "-"}</div>
                          <div>L: {row.tanggal_kirim_lensa ? new Date(row.tanggal_kirim_lensa).toLocaleDateString("id-ID") : "-"}</div>
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
  const authRes = await checkAuthAndRole(context, ["admin"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query konfirmasi_beli joined with verifikasi_kartu and collect_data
  // RLS will automatically apply and restrict based on user's cabang
  const { data: history, error } = await supabase
    .from("konfirmasi_beli")
    .select("*, verifikasi_kartu(*, collect_data(*))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Admin history:", error);
  }

  return {
    props: {
      profile,
      history: history || [],
    },
  };
};
