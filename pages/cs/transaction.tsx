import { GetServerSideProps } from "next";
import { checkAuthAndRole } from "@/utils/auth-helper";
import Layout, { UserProfile } from "@/components/Layout";

interface CSTransactionProps {
  profile: UserProfile;
  history: any[];
}

export default function CSTransaction({ profile, history }: CSTransactionProps) {
  return (
    <Layout profile={profile} title="Riwayat Verifikasi CS">
      <div className="space-y-6 font-sans">
        {/* Header summary */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">Riwayat Kerja Cabang {profile.cabang}</h3>
            <p className="text-slate-400 text-sm">
              Daftar seluruh verifikasi kartu yang telah diproses oleh tim Customer Service di wilayah Anda.
            </p>
          </div>
          <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold rounded-xl text-sm font-outfit">
            {history.length} Terverifikasi
          </div>
        </div>

        {/* History Table */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Tanggal Verifikasi</th>
                  <th className="p-4">Nama Konsumen</th>
                  <th className="p-4">Nomor Kartu</th>
                  <th className="p-4">Nama CS</th>
                  <th className="p-4">Tanggal & Jam Telepon</th>
                  <th className="p-4">Plafon</th>
                  <th className="p-4 text-center">Status HP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Belum ada riwayat verifikasi yang diproses.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
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
                        <td className="p-4 font-mono text-xs">{cd.nomor_kartu || "N/A"}</td>
                        <td className="p-4 text-slate-400">{row.nama_cs}</td>
                        <td className="p-4 text-xs">
                          {new Date(row.tanggal_telepon).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                          })}{" "}
                          - {row.jam_telepon.substring(0, 5)}
                        </td>
                        <td className="p-4 font-semibold text-white">Rp {row.plafon}</td>
                        <td className="p-4 text-center">
                          {row.verif_hp ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-md bg-red-500/10 border border-red-500/20 text-red-400">
                              Invalid
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
  const authRes = await checkAuthAndRole(context, ["cs"]);
  if (authRes.redirect) {
    return { redirect: authRes.redirect };
  }

  const { profile, supabase } = authRes;

  // Query verifikasi_kartu joined with collect_data
  // RLS will automatically apply and restrict based on user's cabang
  const { data: history, error } = await supabase
    .from("verifikasi_kartu")
    .select("*, collect_data(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching CS history:", error);
  }

  return {
    props: {
      profile,
      history: history || [],
    },
  };
};
