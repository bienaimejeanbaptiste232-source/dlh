-- ============================================================
-- Migration 001: Haiti Coverage System
-- Delivery Haïti / Delivery Lakay
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xwmxgpdkmrzoraibdzrf/sql/new
-- ============================================================

-- ============================================================
-- Table: haiti_service_areas
-- Hierarchical location structure for Haiti
-- Levels: DEPARTMENT > ARRONDISSEMENT > COMMUNE > COMMUNAL_SECTION > ZONE
-- ============================================================
CREATE TABLE IF NOT EXISTS haiti_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('DEPARTMENT', 'ARRONDISSEMENT', 'COMMUNE', 'COMMUNAL_SECTION', 'ZONE')),
  name TEXT NOT NULL,
  name_kr TEXT,
  code TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES haiti_service_areas(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  is_launched BOOLEAN DEFAULT FALSE,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  radius_km NUMERIC(8,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table: area_pricing
-- Per-area pricing configuration
-- NULL values = NOT CONFIGURED (do not invent values)
-- ============================================================
CREATE TABLE IF NOT EXISTS area_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES haiti_service_areas(id) ON DELETE CASCADE,
  base_fee NUMERIC(10,2),              -- NULL = not configured
  per_km_fee NUMERIC(10,2),           -- NULL = not configured
  night_surcharge NUMERIC(10,2),      -- NULL = not configured
  min_order_amount NUMERIC(10,2),     -- NULL = not configured
  estimated_delivery_minutes INTEGER, -- NULL = not configured
  service_fee_percent NUMERIC(5,2),   -- NULL = not configured
  special_conditions TEXT,            -- NULL = none
  is_configured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area_id)
);

-- Enable Row Level Security
ALTER TABLE haiti_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_pricing ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "Public can read areas" ON haiti_service_areas;
DROP POLICY IF EXISTS "Service role manage areas" ON haiti_service_areas;
DROP POLICY IF EXISTS "Public can read pricing" ON area_pricing;
DROP POLICY IF EXISTS "Service role manage pricing" ON area_pricing;

-- RLS Policies: allow public read, service role write
CREATE POLICY "Public can read areas" ON haiti_service_areas FOR SELECT USING (true);
CREATE POLICY "Service role manage areas" ON haiti_service_areas FOR ALL TO service_role USING (true);
CREATE POLICY "Public can read pricing" ON area_pricing FOR SELECT USING (true);
CREATE POLICY "Service role manage pricing" ON area_pricing FOR ALL TO service_role USING (true);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_haiti_areas_parent ON haiti_service_areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_haiti_areas_code ON haiti_service_areas(code);
CREATE INDEX IF NOT EXISTS idx_haiti_areas_type ON haiti_service_areas(type);
CREATE INDEX IF NOT EXISTS idx_haiti_areas_active ON haiti_service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_area_pricing_area ON area_pricing(area_id);

-- ============================================================
-- Seed: All 10 Haiti Departments
-- ============================================================
INSERT INTO haiti_service_areas (type, name, name_kr, code, is_active, is_launched, latitude, longitude, sort_order)
VALUES
  ('DEPARTMENT', 'Nord',         'Nò',         'HTI-N',  TRUE,  TRUE,  19.757600, -72.204800, 1),
  ('DEPARTMENT', 'Ouest',        'Lwès',        'HTI-O',  FALSE, FALSE, 18.594400, -72.307400, 2),
  ('DEPARTMENT', 'Sud',          'Sid',         'HTI-S',  FALSE, FALSE, 18.200100, -73.750000, 3),
  ('DEPARTMENT', 'Artibonite',   'Latibonit',   'HTI-A',  FALSE, FALSE, 19.443200, -72.688000, 4),
  ('DEPARTMENT', 'Centre',       'Sant',        'HTI-C',  FALSE, FALSE, 19.150000, -72.016700, 5),
  ('DEPARTMENT', 'Grand''Anse',  'Grandans',    'HTI-GA', FALSE, FALSE, 18.683300, -74.116700, 6),
  ('DEPARTMENT', 'Nippes',       'Nip',         'HTI-NI', FALSE, FALSE, 18.383300, -73.400000, 7),
  ('DEPARTMENT', 'Nord-Est',     'Nòdès',       'HTI-NE', FALSE, FALSE, 19.566700, -71.850000, 8),
  ('DEPARTMENT', 'Nord-Ouest',   'Nòdwès',      'HTI-NO', FALSE, FALSE, 19.933300, -73.133300, 9),
  ('DEPARTMENT', 'Sud-Est',      'Sidès',       'HTI-SE', FALSE, FALSE, 18.233300, -72.533300, 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Seed: Nord Arrondissements (9 arrondissements)
-- ============================================================
INSERT INTO haiti_service_areas (type, name, name_kr, code, parent_id, is_active, is_launched, latitude, longitude, sort_order)
SELECT
  'ARRONDISSEMENT'::TEXT,
  arr.name, arr.name_kr, arr.code, d.id,
  arr.is_active::BOOLEAN, arr.is_launched::BOOLEAN,
  arr.latitude::NUMERIC, arr.longitude::NUMERIC, arr.sort_order::INTEGER
FROM haiti_service_areas d
CROSS JOIN (VALUES
  ('Cap-Haïtien',           'Okap',          'HTI-N-CAP', 'TRUE',  'TRUE',  '19.7576', '-72.2048', '1'),
  ('Acul-du-Nord',          'Akil Nò',       'HTI-N-ACU', 'FALSE', 'FALSE', '19.6833', '-72.2500', '2'),
  ('Borgne',                'Bòn',           'HTI-N-BOR', 'FALSE', 'FALSE', '19.8333', '-72.5333', '3'),
  ('Grande-Rivière-du-Nord','Gran Rivyè Nò', 'HTI-N-GRN', 'FALSE', 'FALSE', '19.5667', '-72.1667', '4'),
  ('Limbé',                 'Lenbe',         'HTI-N-LIM', 'FALSE', 'FALSE', '19.7000', '-72.3833', '5'),
  ('Plaisance',             'Plezans',       'HTI-N-PLA', 'FALSE', 'FALSE', '19.5917', '-72.4583', '6'),
  ('Ranquitte',             'Rankit',        'HTI-N-RAN', 'FALSE', 'FALSE', '19.5000', '-72.3000', '7'),
  ('Saint-Raphaël',         'Sen Rafayèl',   'HTI-N-SRA', 'FALSE', 'FALSE', '19.5000', '-72.1333', '8'),
  ('Vallières',             'Vayè',          'HTI-N-VAL', 'FALSE', 'FALSE', '19.5333', '-71.9500', '9')
) AS arr(name, name_kr, code, is_active, is_launched, latitude, longitude, sort_order)
WHERE d.code = 'HTI-N'
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Seed: Cap-Haïtien Communes (5 communes)
-- ============================================================
INSERT INTO haiti_service_areas (type, name, name_kr, code, parent_id, is_active, is_launched, latitude, longitude, sort_order)
SELECT
  'COMMUNE'::TEXT,
  c.name, c.name_kr, c.code, arr.id,
  c.is_active::BOOLEAN, c.is_launched::BOOLEAN,
  c.latitude::NUMERIC, c.longitude::NUMERIC, c.sort_order::INTEGER
FROM haiti_service_areas arr
CROSS JOIN (VALUES
  ('Cap-Haïtien',           'Okap',         'HTI-N-CAP-CA', 'TRUE',  'TRUE',  '19.7576', '-72.2048', '1'),
  ('Acul-du-Nord',          'Akil Nò',      'HTI-N-CAP-AC', 'FALSE', 'FALSE', '19.6833', '-72.2167', '2'),
  ('Limonade',              'Limonad',      'HTI-N-CAP-LI', 'FALSE', 'FALSE', '19.6667', '-72.1167', '3'),
  ('Grande-Rivière-du-Nord','Gran Rivyè Nò','HTI-N-CAP-GR', 'FALSE', 'FALSE', '19.5667', '-72.1667', '4'),
  ('Quartier-Morin',        'Katye Moren',  'HTI-N-CAP-QM', 'FALSE', 'FALSE', '19.7000', '-72.1500', '5')
) AS c(name, name_kr, code, is_active, is_launched, latitude, longitude, sort_order)
WHERE arr.code = 'HTI-N-CAP'
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Seed: Cap-Haïtien City Delivery Zones (5 zones)
-- ============================================================
INSERT INTO haiti_service_areas (type, name, name_kr, code, parent_id, is_active, is_launched, latitude, longitude, radius_km, sort_order)
SELECT
  'ZONE'::TEXT,
  z.name, z.name_kr, z.code, comm.id,
  z.is_active::BOOLEAN, z.is_launched::BOOLEAN,
  z.latitude::NUMERIC, z.longitude::NUMERIC,
  z.radius_km::NUMERIC, z.sort_order::INTEGER
FROM haiti_service_areas comm
CROSS JOIN (VALUES
  ('Centre-Ville Okap', 'Sant Vil Okap', 'HTI-N-CAP-CA-CV', 'TRUE',  'TRUE',  '19.7576', '-72.2048', '3.0', '1'),
  ('Haut du Cap',       'Odika',         'HTI-N-CAP-CA-HC', 'TRUE',  'TRUE',  '19.7700', '-72.1900', '2.0', '2'),
  ('Vertières',         'Vètyè',         'HTI-N-CAP-CA-VE', 'TRUE',  'TRUE',  '19.7800', '-72.2200', '2.0', '3'),
  ('Plaine-du-Nord',    'Plèn Nò',       'HTI-N-CAP-CA-PN', 'FALSE', 'FALSE', '19.5833', '-72.2000', '5.0', '4'),
  ('Limonade Zone',     'Zòn Limonad',   'HTI-N-CAP-CA-LZ', 'FALSE', 'FALSE', '19.6667', '-72.1167', '3.0', '5')
) AS z(name, name_kr, code, is_active, is_launched, latitude, longitude, radius_km, sort_order)
WHERE comm.code = 'HTI-N-CAP-CA'
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Verification query (run after migration)
-- ============================================================
-- SELECT type, name, code, is_active, is_launched
-- FROM haiti_service_areas
-- ORDER BY sort_order, type, name;

