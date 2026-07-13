import { NextApiRequest, NextApiResponse } from "next";
import { createPagesApiClient } from "@/utils/supabase/pages-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createPagesApiClient(req, res);

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const role = user.user_metadata?.role;
  const cabang = user.user_metadata?.cabang;

  if (role !== "cs") {
    return res.status(403).json({ error: "Forbidden: CS role required" });
  }

  const profile = { role, cabang };

  const { transaksi_id, nama_cs, tanggal_telepon, jam_telepon, plafon, verif_hp } = req.body;

  if (!transaksi_id) {
    return res.status(400).json({ error: "transaksi_id is required" });
  }

  // Verify that the collect_data belongs to user's branch
  const { data: collectData, error: fetchError } = await supabase
    .from("collect_data")
    .select("cabang")
    .eq("transaksi_id", transaksi_id)
    .single();

  if (fetchError || !collectData) {
    return res.status(404).json({ error: "Transaction parent not found" });
  }

  if (collectData.cabang !== profile.cabang) {
    return res.status(403).json({ error: "Forbidden: Branch mismatch" });
  }

  // Insert verifikasi_kartu
  const { data, error } = await supabase
    .from("verifikasi_kartu")
    .insert([
      {
        transaksi_id,
        nama_cs,
        tanggal_telepon,
        jam_telepon,
        plafon,
        verif_hp: !!verif_hp,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
