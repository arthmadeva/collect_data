import { NextApiRequest, NextApiResponse } from "next";
import { createPagesApiClient } from "@/utils/supabase/pages-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createPagesApiClient(req, res);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const role = user.user_metadata?.role;
  const cabang = user.user_metadata?.cabang;

  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin role required" });
  }

  const profile = { role, cabang };

  const {
    verifikasi_id,
    beli,
    resep,
    nomor_sp,
    alamat_kirim,
    tanggal_kirim_frame,
    tanggal_kirim_lensa,
    cek_mutasi,
    id_form,
  } = req.body;

  if (!verifikasi_id) {
    return res.status(400).json({ error: "verifikasi_id is required" });
  }

  // Verify that the verifikasi_id belongs to a transaction in the user's branch
  const { data: verifikasi, error: fetchError } = await supabase
    .from("verifikasi_kartu")
    .select("*, collect_data(cabang)")
    .eq("verifikasi_id", verifikasi_id)
    .single();

  if (fetchError || !verifikasi) {
    return res.status(404).json({ error: "Verification record not found" });
  }

  const cd = verifikasi.collect_data as any;
  if (!cd || cd.cabang !== profile.cabang) {
    return res.status(403).json({ error: "Forbidden: Branch mismatch" });
  }

  // Insert konfirmasi_beli
  const { data, error } = await supabase
    .from("konfirmasi_beli")
    .insert([
      {
        verifikasi_id,
        beli: !!beli,
        resep,
        nomor_sp,
        alamat_kirim,
        tanggal_kirim_frame: tanggal_kirim_frame || null,
        tanggal_kirim_lensa: tanggal_kirim_lensa || null,
        cek_mutasi: !!cek_mutasi,
        id_form,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
