import { createPagesServerClient } from "@/utils/supabase/server";
import Layout from "@/components/Layout";
import { type GetServerSideProps } from "next";

interface CSTransactionProps {
  user: any;
  history: any[];
}

export default function CSTransaction({ user, history }: CSTransactionProps) {
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
            <h3 className="text-xl font-bold text-slate-800">Riwayat Verifikasi Kartu</h3>
            <p className="text-sm text-slate-500 mt-1">
              Catatan historis kartu yang telah selesai diverifikasi oleh Customer Service di cabang Anda.
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
                  <th className="px-6 py-4">Nomor Kartu</th>
                  <th className="px-6 py-4">Nama CS</th>
                  <th className="px-6 py-4">Plafon</th>
                  <th className="px-6 py-4">Tanggal Verifikasi</th>
                  <th className="px-6 py-4 text-center">Status HP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Belum ada riwayat verifikasi kartu untuk cabang Anda.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.verifikasi_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.collect_data?.nama || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {item.collect_data?.nomor_kartu || "-"}
                      </td>
                      <td className="px-6 py-4">{item.nama_cs}</td>
                      <td className="px-6 py-4 font-semibold text-violet-600">Rp {item.plafon}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {getFormattedDate(item.tanggal_telepon)} at {item.jam_telepon.substring(0, 5)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.verif_hp ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wide">
                            Gagal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
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

  // Query using relation join and filter
  const { data: history, error } = await supabase
    .from("verifikasi_kartu")
    .select(`
      *,
      collect_data!inner (
        nama,
        nomor_kartu,
        cabang
      )
    `)
    .eq("collect_data.cabang", userCabang)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("History query error:", error);
  }

  return {
    props: {
      user,
      history: history || [],
    },
  };
};
