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
  if (role !== "keuangan") {
    return res.status(403).json({ error: "Forbidden: Keuangan role required" });
  }

  const { konfirmasi_id, nomor_bayar_silang, lebih_plafon } = req.body;

  if (!konfirmasi_id) {
    return res.status(400).json({ error: "konfirmasi_id is required" });
  }

  const { data, error } = await supabase
    .from("bayar_silang")
    .insert([
      {
        konfirmasi_id,
        nomor_bayar_silang,
        lebih_plafon,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
