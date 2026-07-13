-- SETUP PROFILE AND RLS SECURITY SCHEME (AKUR)

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('admin', 'cs', 'keuangan', 'gudang')) NOT NULL,
  cabang TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy to allow updating own profile (e.g. updating profile details)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Create the handle_new_user function and trigger on auth.users signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, cabang)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cs'),
    NEW.raw_user_meta_data->>'cabang'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Row Level Security policies for transaction tables
-- Enabling RLS on existing tables:
ALTER TABLE public.collect_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikasi_kartu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.konfirmasi_beli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bayar_silang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pra_produksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_produksi ENABLE ROW LEVEL SECURITY;


-- POLICIES FOR collect_data
CREATE POLICY "collect_data_select" ON public.collect_data
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "collect_data_insert" ON public.collect_data
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "collect_data_update" ON public.collect_data
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
  );


-- POLICIES FOR verifikasi_kartu
CREATE POLICY "verifikasi_kartu_select" ON public.verifikasi_kartu
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.collect_data cd
      WHERE cd.transaksi_id = verifikasi_kartu.transaksi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "verifikasi_kartu_insert" ON public.verifikasi_kartu
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.collect_data cd
      WHERE cd.transaksi_id = transaksi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "verifikasi_kartu_update" ON public.verifikasi_kartu
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.collect_data cd
      WHERE cd.transaksi_id = verifikasi_kartu.transaksi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );


-- POLICIES FOR konfirmasi_beli
CREATE POLICY "konfirmasi_beli_select" ON public.konfirmasi_beli
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.verifikasi_kartu vk
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE vk.verifikasi_id = konfirmasi_beli.verifikasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "konfirmasi_beli_insert" ON public.konfirmasi_beli
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.verifikasi_kartu vk
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE vk.verifikasi_id = verifikasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "konfirmasi_beli_update" ON public.konfirmasi_beli
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.verifikasi_kartu vk
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE vk.verifikasi_id = konfirmasi_beli.verifikasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );


-- POLICIES FOR aktual
CREATE POLICY "aktual_select" ON public.aktual
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = aktual.konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "aktual_insert" ON public.aktual
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "aktual_update" ON public.aktual
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = aktual.konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );


-- POLICIES FOR bayar_silang
CREATE POLICY "bayar_silang_select" ON public.bayar_silang
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = bayar_silang.konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "bayar_silang_insert" ON public.bayar_silang
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "bayar_silang_update" ON public.bayar_silang
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = bayar_silang.konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );


-- POLICIES FOR pra_produksi
CREATE POLICY "pra_produksi_select" ON public.pra_produksi
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = pra_produksi.konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "pra_produksi_insert" ON public.pra_produksi
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "pra_produksi_update" ON public.pra_produksi
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.konfirmasi_beli kb
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE kb.konfirmasi_id = pra_produksi.konfirmasi_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );


-- POLICIES FOR post_produksi
CREATE POLICY "post_produksi_select" ON public.post_produksi
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.pra_produksi pp
      JOIN public.konfirmasi_beli kb ON kb.konfirmasi_id = pp.konfirmasi_id
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE pp.pra_id = post_produksi.pra_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "post_produksi_insert" ON public.post_produksi
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.pra_produksi pp
      JOIN public.konfirmasi_beli kb ON kb.konfirmasi_id = pp.konfirmasi_id
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE pp.pra_id = pra_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "post_produksi_update" ON public.post_produksi
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('keuangan', 'gudang')
    OR
    EXISTS (
      SELECT 1 FROM public.pra_produksi pp
      JOIN public.konfirmasi_beli kb ON kb.konfirmasi_id = pp.konfirmasi_id
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE pp.pra_id = post_produksi.pra_id
      AND cd.cabang = (SELECT cabang FROM public.profiles WHERE id = auth.uid())
    )
  );
