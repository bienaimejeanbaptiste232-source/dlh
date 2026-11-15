-- ============================================================
-- Migration 002: Lojik Pri Pwodwi — Inite, Pake (pa 3), & Gwosis
-- Delivery Haïti / Delivery Lakay
-- ============================================================

-- Pwodwi yo itilize kolòn `options` (JSON) pou estoke konfigirasyon
-- pri avanse san kraze estrikti ki deja egziste a.
--
-- Men egzanp estrikti JSON ki estoke nan `products.options`:
-- {
--   "sellingMode": "PACK",               -- 'UNIT' | 'PACK' | 'WHOLESALE' | 'HYBRID'
--   "displayMode": "PACK_FIRST",          -- 'UNIT_FIRST' | 'PACK_FIRST' | 'WHOLESALE_FIRST' | 'TIERED_BADGE'
--   "unitPrice": 50,                     -- Pri inite baz (toujou la)
--   "unitName": "boutèy",                -- inite, grenn, boutèy, plat, pyès...
--   "packQuantity": 3,                   -- Vann pa 3
--   "packPrice": 135,                    -- Pri pou tout pake 3 a (olye de 150)
--   "packName": "Pake 3",                -- Trio, Pake 3, Douzèn...
--   "allowOnlyPacks": true,              -- Si se vre, kliyan dwe kòmande pa miltip de 3
--   "isWholesale": false,                -- Èske se gwosis
--   "minWholesaleQty": 24,               -- Kantite minimòm pou pri gwosis
--   "wholesalePricePerUnit": 38,         -- Pri pa inite lè w achte an gwo
--   "wholesaleUnitName": "Katon 24"      -- Katon, Kès, Sak...
-- }

-- 1. Ajoute yon kòmantè eksplikatif sou kolòn `options` tab `products`
COMMENT ON COLUMN products.options IS 'Konfigirasyon JSON: variantes, sipleman, ak mòd pri (sellingMode: UNIT|PACK|WHOLESALE|HYBRID, packQuantity, packPrice, displayMode, wholesalePricePerUnit)';

-- 2. Kreye yon View fasil pou administrasyon ak analiz machann
CREATE OR REPLACE VIEW v_products_pricing_modes AS
SELECT 
  p.id,
  p."merchantId",
  m.name AS merchant_name,
  p.name AS product_name,
  p.price AS base_price,
  COALESCE((p.options::jsonb)->>'sellingMode', 'UNIT') AS selling_mode,
  COALESCE((p.options::jsonb)->>'displayMode', 'UNIT_FIRST') AS display_mode,
  ((p.options::jsonb)->>'unitPrice')::numeric AS unit_price,
  ((p.options::jsonb)->>'packQuantity')::int AS pack_quantity,
  ((p.options::jsonb)->>'packPrice')::numeric AS pack_price,
  ((p.options::jsonb)->>'allowOnlyPacks')::boolean AS allow_only_packs,
  ((p.options::jsonb)->>'minWholesaleQty')::int AS min_wholesale_qty,
  ((p.options::jsonb)->>'wholesalePricePerUnit')::numeric AS wholesale_price_per_unit,
  (p.options::jsonb)->>'wholesaleUnitName' AS wholesale_unit_name,
  p."isAvailable"
FROM products p
LEFT JOIN merchants m ON m.id = p."merchantId";

-- 3. Endèks pou rechèch rapid sou mòd pri (egz: jwenn tout gwosis nan Gran Nò)
CREATE INDEX IF NOT EXISTS idx_products_options_selling_mode 
ON products (((options::jsonb)->>'sellingMode'))
WHERE options IS NOT NULL;
