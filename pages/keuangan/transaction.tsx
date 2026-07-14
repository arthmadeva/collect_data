import { createPagesServerClient } from "@/utils/supabase/server";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface KeuanganTransactionProps {
  user: any;
  history: any[];
}

export default function KeuanganTransaction({ user, history }: KeuanganTransactionProps) {
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
            <h3 className="text-xl font-bold text-slate-800">Riwayat Pencatatan Aktual</h3>
            <p className="text-sm text-slate-500 mt-1">
              Catatan historis penerimaan dana aktual secara nasional untuk seluruh cabang.
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
                  <th className="px-6 py-4">Nomor SP</th>
                  <th className="px-6 py-4">Nilai Aktual</th>
                  <th className="px-6 py-4">No. ACC Pusat</th>
                  <th className="px-6 py-4 text-center">ACC Pusat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Belum ada riwayat pencatatan aktual pembayaran.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const client = item.konfirmasi_beli?.verifikasi_kartu?.collect_data;
                    return (
                      <tr key={item.aktual_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{client?.nama || "-"}</div>
                          <div className="text-xs text-slate-400 font-mono">{client?.nomor_kartu || "-"}</div>
                        </td>
                        <td className="px-6 py-4 uppercase font-bold text-xs text-slate-500">
                          {client?.cabang || "-"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {item.konfirmasi_beli?.nomor_sp || "-"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-violet-600">
                          Rp {item.actual}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{item.no_acc_pusat_actual || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          {item.acc_pusat_actual ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
                              APPROVED
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wide">
                              PENDING
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

  // Fetch history joined back to collect_data
  const { data: history, error } = await supabase
    .from("aktual")
    .select(`
      *,
      konfirmasi_beli!inner (
        nomor_sp,
        verifikasi_kartu!inner (
          collect_data!inner (
            nama,
            nomor_kartu,
            cabang
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Keuangan History query error:", error);
  }

  return {
    props: {
      user,
      history: history || [],
    },
  };
};
