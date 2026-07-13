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
  if (role !== "gudang") {
    return res.status(403).json({ error: "Forbidden: Gudang role required" });
  }

  const {
    pra_id,
    no_faktur,
    sudah_produksi,
    petugas_produksi,
    tanggal_selesai_produksi,
    proses_pengiriman,
    quality_control,
    resi_pengiriman,
  } = req.body;

  if (!pra_id) {
    return res.status(400).json({ error: "pra_id is required" });
  }

  const { data, error } = await supabase
    .from("post_produksi")
    .insert([
      {
        pra_id,
        no_faktur,
        sudah_produksi: !!sudah_produksi,
        petugas_produksi,
        tanggal_selesai_produksi: tanggal_selesai_produksi || null,
        proses_pengiriman: !!proses_pengiriman,
        quality_control: !!quality_control,
        resi_pengiriman,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
