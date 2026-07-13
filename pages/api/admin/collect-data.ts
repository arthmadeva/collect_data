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

  const { nama, email, tanggal_lahir, no_hp, nomor_kartu, unit_bri, promotor } = req.body;

  if (!nama || !nomor_kartu) {
    return res.status(400).json({ error: "nama and nomor_kartu are required" });
  }

  // Admin Cabang must insert records using their own branch

  const { data, error } = await supabase
    .from("collect_data")
    .insert([
      {
        nama,
        email,
        tanggal_lahir: tanggal_lahir || null,
        no_hp,
        nomor_kartu,
        unit_bri,
        promotor,
        cabang, // Hardcoded to admin's branch for security
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
