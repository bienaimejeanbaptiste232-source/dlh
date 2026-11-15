/**
 * ============================================================================
 * Delivery Lakay — Lojik Pri Machann: Inite, Pake (egz: pa 3), ak Gwosis (Bulk)
 * ============================================================================
 * 
 * Lojik sa pèmèt machann lan:
 * 1. Deside mòd vant pwodwi a:
 *    - 'UNIT'      : Vant pa inite sèlman (detay klasik)
 *    - 'PACK'      : Vant pa pake / lot sèlman (egz: pa 3, pa 6, pa douzèn)
 *    - 'WHOLESALE' : Vant gwosis sèlman (an gwo, ak kantite minimòm MOQ)
 *    - 'HYBRID'    : Toulede (pri inite an detay + rabè otomatik lè w achte pa pake oswa gwosis)
 * 
 * 2. Toujou kenbe kalkil pri inite a (Unit Price):
 *    - Menm lè yon atik vann an pake (egz: 150 HTG pou 3), sistèm nan toujou
 *      kalkile epi afiche pri 1 inite (50 HTG / inite).
 * 
 * 3. Chwazi ki jan pri a afiche bay kliyan an (Display Mode):
 *    - 'UNIT_FIRST'      : Pri inite an gwo, detay pake anba
 *    - 'PACK_FIRST'      : Pri pake a an gwo, pri inite anba
 *    - 'WHOLESALE_FIRST' : Pri an gwo an premye ak minimòm kòmann lan
 *    - 'TIERED_BADGE'    : Gril pri degresif (1-2 inite, 3-11 inite, 12+ gwosis)
 */

export type SellingMode = 'UNIT' | 'PACK' | 'WHOLESALE' | 'HYBRID'

export type PriceDisplayMode = 'UNIT_FIRST' | 'PACK_FIRST' | 'WHOLESALE_FIRST' | 'TIERED_BADGE'

export interface WholesaleTier {
  minQty: number           // Egz: 12
  pricePerUnit: number     // Egz: 40 HTG (olye de 50 HTG)
  label?: string           // Egz: "Katon 12+", "Demi-gwo"
}

export interface PricingConfig {
  sellingMode: SellingMode
  displayMode: PriceDisplayMode

  // Pri de baz inite (toujou prezan)
  unitPrice: number
  unitName?: string // egz: "grenn", "plat", "boutèy", "pyès", "sak"

  // Opsyon Pake / Lot (egz: pa 3)
  packQuantity?: number // egz: 3 (vann pa 3)
  packPrice?: number    // egz: 135 HTG (olye de 3 * 50 = 150 HTG)
  packName?: string     // egz: "Pake 3", "Trio", "Pake 6", "Douzèn"
  allowOnlyPacks?: boolean // si vre, kliyan ka sèlman kòmande miltip pake a (3, 6, 9...)

  // Opsyon Gwosis / Wholesale
  isWholesaleAvailable?: boolean
  minWholesaleQty?: number       // Egz: 12 oswa 24 inite
  wholesalePricePerUnit?: number // Egz: 38 HTG / inite
  wholesaleUnitName?: string     // Egz: "Katon", "Kès", "Gwo Sak"
  wholesaleTiers?: WholesaleTier[] // Palye pri degresif
}

/**
 * Rezilta fòma afichaj pri pou entèfas kliyan ak kat pwodwi
 */
export interface FormattedPriceDisplay {
  primaryText: string        // Egz: "135 HTG" oswa "50 HTG / inite"
  secondaryText?: string      // Egz: "45 HTG / inite (Ekonomi 15 HTG)"
  badgeText?: string          // Egz: "Vann pa 3", "Gwosis Dispo", "Pri Degresif"
  effectiveUnitPrice: number  // Pri inite kalkile
  minOrderQty: number         // Kantite minimòm pou mete nan panye
  stepQty: number             // Pa pou bouton + ak - (egz: 3 si se pa 3 sèlman)
}

/**
 * Kalkile pri total yon atik selon kantite kliyan an chwazi
 */
export function calculateItemTotal(
  config: PricingConfig,
  quantity: number
): {
  totalPrice: number
  effectiveUnitPrice: number
  appliedTier?: string
  savingsAmount: number
} {
  const qty = Math.max(1, quantity)
  const baseTotal = qty * config.unitPrice

  // 1. Mòd PACK sèlman
  if (config.sellingMode === 'PACK' && config.packQuantity && config.packPrice) {
    const packsCount = Math.floor(qty / config.packQuantity)
    const remainder = qty % config.packQuantity
    const remainderPrice = remainder * config.unitPrice
    const totalPrice = (packsCount * config.packPrice) + remainderPrice
    const effectiveUnitPrice = Math.round((totalPrice / qty) * 100) / 100
    const savingsAmount = Math.max(0, baseTotal - totalPrice)

    return {
      totalPrice,
      effectiveUnitPrice,
      appliedTier: `Pake ${config.packQuantity} (${packsCount} pake)`,
      savingsAmount,
    }
  }

  // 2. Mòd WHOLESALE sèlman
  if (config.sellingMode === 'WHOLESALE' && config.wholesalePricePerUnit) {
    const pricePerUnit = config.wholesalePricePerUnit
    const totalPrice = qty * pricePerUnit
    const savingsAmount = Math.max(0, baseTotal - totalPrice)

    return {
      totalPrice,
      effectiveUnitPrice: pricePerUnit,
      appliedTier: 'Pri Gwosis',
      savingsAmount,
    }
  }

  // 3. Mòd HYBRID (pri degresif selon kantite)
  if (config.sellingMode === 'HYBRID') {
    // Tcheke palye gwosis an premye (si kantite a depase minimòm gwosis)
    if (config.minWholesaleQty && qty >= config.minWholesaleQty && config.wholesalePricePerUnit) {
      const totalPrice = qty * config.wholesalePricePerUnit
      return {
        totalPrice,
        effectiveUnitPrice: config.wholesalePricePerUnit,
        appliedTier: `Gwosis (${config.wholesaleUnitName || 'Gwo Kantite'})`,
        savingsAmount: Math.max(0, baseTotal - totalPrice),
      }
    }

    // Tcheke pake (egz: si li pran 3 oswa plis)
    if (config.packQuantity && config.packPrice && qty >= config.packQuantity) {
      const packsCount = Math.floor(qty / config.packQuantity)
      const remainder = qty % config.packQuantity
      const remainderPrice = remainder * config.unitPrice
      const totalPrice = (packsCount * config.packPrice) + remainderPrice
      return {
        totalPrice,
        effectiveUnitPrice: Math.round((totalPrice / qty) * 100) / 100,
        appliedTier: `Pake ${config.packQuantity}`,
        savingsAmount: Math.max(0, baseTotal - totalPrice),
      }
    }
  }

  // 4. Mòd UNIT (pa inite nòmal)
  return {
    totalPrice: baseTotal,
    effectiveUnitPrice: config.unitPrice,
    savingsAmount: 0,
  }
}

/**
 * Jenere tèks ak badj afichaj pri pou kat pwodwi (Product Card)
 */
export function getProductDisplayPrice(config: PricingConfig): FormattedPriceDisplay {
  const formatHTG = (n: number) => `${Math.round(n).toLocaleString('en-US')} HTG`

  // 1. Mòd PACK (egz: vann pa 3)
  if (config.sellingMode === 'PACK' && config.packQuantity && config.packPrice) {
    const unitEquiv = Math.round((config.packPrice / config.packQuantity) * 100) / 100

    if (config.displayMode === 'PACK_FIRST') {
      return {
        primaryText: formatHTG(config.packPrice),
        secondaryText: `${formatHTG(unitEquiv)} / inite (${config.packName || `Pake ${config.packQuantity}`})`,
        badgeText: `Vann pa ${config.packQuantity}`,
        effectiveUnitPrice: unitEquiv,
        minOrderQty: config.packQuantity,
        stepQty: config.allowOnlyPacks ? config.packQuantity : 1,
      }
    } else {
      // UNIT_FIRST
      return {
        primaryText: `${formatHTG(unitEquiv)} / inite`,
        secondaryText: `${formatHTG(config.packPrice)} pou ${config.packName || `Pake ${config.packQuantity}`}`,
        badgeText: `Lot ${config.packQuantity}`,
        effectiveUnitPrice: unitEquiv,
        minOrderQty: config.packQuantity,
        stepQty: config.allowOnlyPacks ? config.packQuantity : 1,
      }
    }
  }

  // 2. Mòd WHOLESALE (Gwosis sèlman)
  if (config.sellingMode === 'WHOLESALE' && config.wholesalePricePerUnit) {
    const minQty = config.minWholesaleQty || 12
    const minTotal = minQty * config.wholesalePricePerUnit

    return {
      primaryText: `${formatHTG(config.wholesalePricePerUnit)} / inite`,
      secondaryText: `Min. ${minQty} ${config.unitName || 'inite'} (${formatHTG(minTotal)})`,
      badgeText: `Gwosis • Min ${minQty}`,
      effectiveUnitPrice: config.wholesalePricePerUnit,
      minOrderQty: minQty,
      stepQty: 1,
    }
  }

  // 3. Mòd HYBRID (Inite + Pake oswa Gwosis)
  if (config.sellingMode === 'HYBRID') {
    let secondary = ''
    let badge = 'Pri Degresif'

    if (config.packQuantity && config.packPrice) {
      const packUnitEquiv = Math.round((config.packPrice / config.packQuantity) * 100) / 100
      secondary = `${formatHTG(config.packPrice)} pa ${config.packQuantity} (${formatHTG(packUnitEquiv)}/in)`
      badge = `Rabè pa ${config.packQuantity}`
    }

    if (config.minWholesaleQty && config.wholesalePricePerUnit) {
      badge = `Gwosis Dispo (${formatHTG(config.wholesalePricePerUnit)}/in dès ${config.minWholesaleQty})`
    }

    return {
      primaryText: `${formatHTG(config.unitPrice)}`,
      secondaryText: secondary || undefined,
      badgeText: badge,
      effectiveUnitPrice: config.unitPrice,
      minOrderQty: 1,
      stepQty: 1,
    }
  }

  // 4. Mòd UNIT (Normal pa inite)
  return {
    primaryText: `${formatHTG(config.unitPrice)}`,
    secondaryText: config.unitName ? `pa ${config.unitName}` : undefined,
    badgeText: undefined,
    effectiveUnitPrice: config.unitPrice,
    minOrderQty: 1,
    stepQty: 1,
  }
}

/**
 * Ede konvèti opsyon JSON ki nan baz done a oswa ProductMeta
 * an yon konfigirasyon PricingConfig solid.
 */
export function extractPricingConfig(product: {
  price: number
  options?: any
  description?: string
}): PricingConfig {
  let meta: any = {}

  if (typeof product.options === 'string') {
    try {
      meta = JSON.parse(product.options)
    } catch {
      meta = {}
    }
  } else if (typeof product.options === 'object' && product.options !== null) {
    meta = product.options
  }

  // Default config si pa gen detay
  const baseUnitPrice = product.price || 0

  const sellingMode: SellingMode = meta.sellingMode || (
    meta.packQuantity ? 'PACK' : meta.isWholesale ? 'WHOLESALE' : 'UNIT'
  )

  const displayMode: PriceDisplayMode = meta.displayMode || (
    sellingMode === 'PACK' ? 'PACK_FIRST' :
    sellingMode === 'WHOLESALE' ? 'WHOLESALE_FIRST' : 'UNIT_FIRST'
  )

  return {
    sellingMode,
    displayMode,
    unitPrice: meta.unitPrice !== undefined ? Number(meta.unitPrice) : baseUnitPrice,
    unitName: meta.unitName || meta.unit || 'inite',
    packQuantity: meta.packQuantity ? Number(meta.packQuantity) : undefined,
    packPrice: meta.packPrice ? Number(meta.packPrice) : (
      meta.packQuantity ? baseUnitPrice : undefined
    ),
    packName: meta.packName || (meta.packQuantity ? `Pake ${meta.packQuantity}` : undefined),
    allowOnlyPacks: meta.allowOnlyPacks === true,
    isWholesaleAvailable: meta.isWholesale === true || meta.isWholesaleAvailable === true,
    minWholesaleQty: meta.minWholesaleQty ? Number(meta.minWholesaleQty) : undefined,
    wholesalePricePerUnit: meta.wholesalePricePerUnit ? Number(meta.wholesalePricePerUnit) : undefined,
    wholesaleUnitName: meta.wholesaleUnitName || 'Katon',
    wholesaleTiers: Array.isArray(meta.wholesaleTiers) ? meta.wholesaleTiers : [],
  }
}
