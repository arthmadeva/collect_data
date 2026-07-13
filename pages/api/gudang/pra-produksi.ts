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
    konfirmasi_id,
    tanggal_terima_frame,
    sudah_terima_frame,
    stock,
    gosok,
    tanggal_terima_lensa,
  } = req.body;

  if (!konfirmasi_id) {
    return res.status(400).json({ error: "konfirmasi_id is required" });
  }

  const { data, error } = await supabase
    .from("pra_produksi")
    .insert([
      {
        konfirmasi_id,
        tanggal_terima_frame: tanggal_terima_frame || null,
        sudah_terima_frame: !!sudah_terima_frame,
        stock: !!stock,
        gosok: !!gosok,
        tanggal_terima_lensa: tanggal_terima_lensa || null,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
