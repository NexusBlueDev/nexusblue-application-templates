-- ── org_brand* Tables (Brand Basics Module) ──
-- Template migration for Platform Products.
-- Customize: replace REFERENCES, org INSERT, and seed data per project.
--
-- Tables: org_brand, org_brand_colors, org_brand_fonts, org_brand_asset_slots, org_brand_assets
-- Depends on: organizations table (or equivalent tenant table) with id UUID PK

-- ============================================================
-- 1. Brand tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_brand (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tagline           TEXT,
  industry          TEXT,
  founded_year      INT,
  setup_status      TEXT NOT NULL DEFAULT 'not_started'
                      CHECK (setup_status IN ('not_started', 'partial', 'complete')),
  populated_from    TEXT CHECK (populated_from IN ('scan', 'intake', 'manual', 'marketing_hub')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE TABLE IF NOT EXISTS public.org_brand_colors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hex_value         TEXT NOT NULL,
  label             TEXT,
  role              TEXT NOT NULL DEFAULT 'other'
                      CHECK (role IN ('primary', 'secondary', 'tertiary', 'accent', 'neutral', 'background', 'text', 'other')),
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_brand_colors_org ON public.org_brand_colors(organization_id, role);

CREATE TABLE IF NOT EXISTS public.org_brand_fonts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  font_name         TEXT NOT NULL,
  font_source       TEXT NOT NULL DEFAULT 'google'
                      CHECK (font_source IN ('google', 'adobe', 'custom', 'system')),
  font_url          TEXT,
  role              TEXT NOT NULL DEFAULT 'body'
                      CHECK (role IN ('heading', 'body', 'accent', 'mono', 'other')),
  weights           TEXT[] DEFAULT ARRAY['400'],
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_brand_fonts_org ON public.org_brand_fonts(organization_id, role);

CREATE TABLE IF NOT EXISTS public.org_brand_asset_slots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key          TEXT UNIQUE NOT NULL,
  label             TEXT NOT NULL,
  description       TEXT,
  required          BOOLEAN NOT NULL DEFAULT false,
  accepted_types    TEXT[],
  min_dimensions    TEXT,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_brand_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slot_key          TEXT,
  label             TEXT NOT NULL,
  storage_path      TEXT,
  external_url      TEXT,
  file_name         TEXT NOT NULL,
  file_size_bytes   INT,
  mime_type         TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'placeholder', 'missing')),
  placeholder_note  TEXT,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE public.org_brand ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_brand_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_brand_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_brand_asset_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_brand_assets ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "svc_org_brand" ON public.org_brand FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_org_brand_colors" ON public.org_brand_colors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_org_brand_fonts" ON public.org_brand_fonts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_org_brand_asset_slots" ON public.org_brand_asset_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_org_brand_assets" ON public.org_brand_assets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read (brand data needed by public pages)
CREATE POLICY "read_org_brand" ON public.org_brand FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_org_brand_colors" ON public.org_brand_colors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_org_brand_fonts" ON public.org_brand_fonts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_org_brand_asset_slots" ON public.org_brand_asset_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_org_brand_assets" ON public.org_brand_assets FOR SELECT TO anon, authenticated USING (true);

-- Org admin: manage own org brand
CREATE POLICY "org_admin_brand" ON public.org_brand FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')));
CREATE POLICY "org_admin_brand_colors" ON public.org_brand_colors FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')));
CREATE POLICY "org_admin_brand_fonts" ON public.org_brand_fonts FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')));
CREATE POLICY "org_admin_brand_assets" ON public.org_brand_assets FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'org_admin', 'owner')));

-- ============================================================
-- 3. Updated_at triggers (requires update_updated_at function)
-- ============================================================
CREATE OR REPLACE TRIGGER t_org_brand_upd BEFORE UPDATE ON public.org_brand FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE OR REPLACE TRIGGER t_org_brand_colors_upd BEFORE UPDATE ON public.org_brand_colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE OR REPLACE TRIGGER t_org_brand_fonts_upd BEFORE UPDATE ON public.org_brand_fonts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE OR REPLACE TRIGGER t_org_brand_assets_upd BEFORE UPDATE ON public.org_brand_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 4. Seed asset slots (platform standard)
-- ============================================================
INSERT INTO public.org_brand_asset_slots (slot_key, label, description, required, accepted_types, min_dimensions, sort_order) VALUES
('primary_logo', 'Primary Logo', 'Main logo used across the site', true, ARRAY['image/svg+xml', 'image/png'], '500x100', 1),
('logo_dark_bg', 'Logo (Dark Background)', 'Logo variant for dark backgrounds', false, ARRAY['image/svg+xml', 'image/png'], NULL, 2),
('logo_light_bg', 'Logo (Light Background)', 'Logo variant for light backgrounds', false, ARRAY['image/svg+xml', 'image/png'], NULL, 3),
('favicon', 'Favicon', 'Browser tab icon', true, ARRAY['image/png', 'image/svg+xml'], '32x32', 4),
('og_image', 'Social Share Image', 'Image shown when shared on social media', true, ARRAY['image/png', 'image/jpeg'], '1200x630', 5),
('hero_default', 'Default Hero Image', 'Default hero/banner image', false, ARRAY['image/png', 'image/jpeg', 'image/webp'], '1920x600', 6),
('brand_icon', 'Brand Icon / Mark', 'Square icon or mark', false, ARRAY['image/svg+xml', 'image/png'], '256x256', 7),
('email_header', 'Email Header Image', 'Header image for emails', false, ARRAY['image/png', 'image/jpeg'], '600x150', 8)
ON CONFLICT (slot_key) DO NOTHING;

-- ============================================================
-- 5. Seed brand data (CUSTOMIZE per project)
-- ============================================================
-- INSERT INTO public.org_brand (organization_id, tagline, industry, setup_status, populated_from) VALUES
-- ('YOUR-ORG-UUID', 'Your Tagline', 'Your Industry', 'not_started', 'manual');
