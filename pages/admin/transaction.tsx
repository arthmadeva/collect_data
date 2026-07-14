import { createPagesServerClient } from "@/utils/supabase/server";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface AdminTransactionProps {
  user: any;
  history: any[];
}

export default function AdminTransaction({ user, history }: AdminTransactionProps) {
  const getFormattedDate = (dStr: string) => {
    return dStr ? new Date(dStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) : "-";
  };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Riwayat Konfirmasi Pembelian</h3>
            <p className="text-sm text-slate-500 mt-1">
              Catatan historis pesanan yang telah dikonfirmasi oleh Admin Cabang Anda.
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
                  <th className="px-6 py-4">Nomor SP / ID Form</th>
                  <th className="px-6 py-4">Resep</th>
                  <th className="px-6 py-4">Tgl Kirim (Frame/Lensa)</th>
                  <th className="px-6 py-4">Alamat Kirim</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Belum ada riwayat konfirmasi pembelian untuk cabang Anda.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const client = item.verifikasi_kartu?.collect_data;
                    return (
                      <tr key={item.konfirmasi_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{client?.nama || "-"}</div>
                          <div className="text-xs text-slate-400 font-mono">{client?.nomor_kartu || "-"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{item.nomor_sp || "-"}</div>
                          <div className="text-xs text-slate-500">{item.id_form || "-"}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs max-w-[150px] truncate" title={item.resep}>
                          {item.resep}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          <div>F: {getFormattedDate(item.tanggal_kirim_frame)}</div>
                          <div>L: {getFormattedDate(item.tanggal_kirim_lensa)}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate" title={item.alamat_kirim}>
                          {item.alamat_kirim}
                        </td>
                        <td className="px-6 py-4 text-center space-y-1">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {item.beli ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase">
                                Beli
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">
                                Tidak Beli
                              </span>
                            )}
                            {item.cek_mutasi ? (
                              <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase">
                                Cek Mutasi
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-100 uppercase">
                                No Mutasi
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

  const userCabang = user.user_metadata?.cabang;

  // Multi-level relation query
  const { data: history, error } = await supabase
    .from("konfirmasi_beli")
    .select(`
      *,
      verifikasi_kartu!inner (
        collect_data!inner (
          nama,
          nomor_kartu,
          cabang
        )
      )
    `)
    .eq("verifikasi_kartu.collect_data.cabang", userCabang)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin History query error:", error);
  }

  return {
    props: {
      user,
      history: history || [],
    },
  };
};
