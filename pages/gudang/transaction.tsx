import { createPagesServerClient } from "@/utils/supabase/server";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface GudangTransactionProps {
  user: any;
  history: any[];
}

export default function GudangTransaction({ user, history }: GudangTransactionProps) {
  const getFormattedDate = (dStr: string) => {
    return new Date(dStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Riwayat Post-Produksi & Logistik</h3>
            <p className="text-sm text-slate-500 mt-1">
              Catatan historis penyelesaian manufaktur kacamata dan pengiriman kurir logistik nasional.
            </p>
          </div>
          <span className="text-3xl font-extrabold text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100">
            {history.length}
          </span>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">Cabang</th>
                  <th className="px-6 py-4">Nomor Faktur</th>
                  <th className="px-6 py-4">Petugas / Tgl Produksi</th>
                  <th className="px-6 py-4">Resi Pengiriman</th>
                  <th className="px-6 py-4 text-center">Status Produksi / QC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Belum ada riwayat manufaktur logistik post-produksi.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const client = item.pra_produksi?.konfirmasi_beli?.verifikasi_kartu?.collect_data;
                    return (
                      <tr key={item.post_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{client?.nama || "-"}</div>
                          <div className="text-xs text-slate-400 font-mono">{client?.nomor_kartu || "-"}</div>
                        </td>
                        <td className="px-6 py-4 uppercase font-bold text-xs text-slate-500">
                          {client?.cabang || "-"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                          {item.no_faktur || "-"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          <div className="font-semibold text-slate-800">{item.petugas_produksi || "-"}</div>
                          <div className="text-slate-400">{item.tanggal_selesai_produksi ? getFormattedDate(item.tanggal_selesai_produksi) : "-"}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          <div className="font-bold text-slate-700">{item.resi_pengiriman || "-"}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.proses_pengiriman ? (
                              <span className="text-violet-600 font-semibold uppercase">PROSES KIRIM</span>
                            ) : (
                              <span className="text-slate-400 font-semibold uppercase">TIDAK KIRIM</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center space-y-1">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {item.sudah_produksi ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                                PRODUKSI SUDAH
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                                PRODUKSI BELUM
                              </span>
                            )}
                            {item.quality_control ? (
                              <span className="bg-cyan-50 text-cyan-700 text-[9px] font-bold px-2 py-0.5 rounded border border-cyan-100 uppercase tracking-wide">
                                QC PASSED
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wide">
                                QC PENDING
                              </span>
                            )}
                          </div>
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

  // Fetch logistik history
  const { data: history, error } = await supabase
    .from("post_produksi")
    .select(`
      *,
      pra_produksi!inner (
        konfirmasi_beli!inner (
          verifikasi_kartu!inner (
            collect_data!inner (
              nama,
              nomor_kartu,
              cabang
            )
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gudang History query error:", error);
  }

  return {
    props: {
      user,
      history: history || [],
    },
  };
};
