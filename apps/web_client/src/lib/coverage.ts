// apps/web_client/src/lib/coverage.ts
// Client-side coverage & pricing validation for Delivery Lakay (Web Client)

export interface ServiceArea {
  id: string;
  type: 'DEPARTMENT' | 'ARRONDISSEMENT' | 'COMMUNE' | 'COMMUNAL_SECTION' | 'ZONE';
  name: string;
  nameKr: string;
  code: string;
  parentId: string | null;
  isActive: boolean;
  isLaunched: boolean;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number | null;
  sortOrder: number;
}

export interface AreaPricing {
  id: string;
  areaId: string;
  baseFee: number | null;
  perKmFee: number | null;
  nightSurcharge: number | null;
  minOrderAmount: number | null;
  estimatedDeliveryMinutes: number | null;
  serviceFeePercent: number | null;
  specialConditions: string | null;
  isConfigured: boolean;
}

// Fallback active zones in Cap-Haïtien when offline or initial load
const FALLBACK_ZONES: ServiceArea[] = [
  { id: 'zone-centre-ville', type: 'ZONE', name: 'Centre-Ville Okap', nameKr: 'Sant Vil Okap', code: 'HTI-N-CAP-CA-CV', parentId: 'sec-bande-du-nord', isActive: true, isLaunched: true, radiusKm: 3.0, sortOrder: 1 },
  { id: 'zone-haut-du-cap', type: 'ZONE', name: 'Haut du Cap', nameKr: 'Odika', code: 'HTI-N-CAP-CA-HC', parentId: 'sec-haut-du-cap', isActive: true, isLaunched: true, radiusKm: 2.5, sortOrder: 2 },
  { id: 'zone-vertieres', type: 'ZONE', name: 'Vertières', nameKr: 'Vètyè', code: 'HTI-N-CAP-CA-VE', parentId: 'sec-haut-du-cap', isActive: true, isLaunched: true, radiusKm: 2.5, sortOrder: 3 },
  { id: 'zone-petite-anse', type: 'ZONE', name: 'Petite-Anse / Cité Lescot', nameKr: 'Ti Ans / Sit Lesko', code: 'HTI-N-CAP-CA-PA', parentId: 'sec-petit-anse', isActive: true, isLaunched: true, radiusKm: 2.0, sortOrder: 4 },
  { id: 'zone-carenage', type: 'ZONE', name: 'Carénage / Moralès', nameKr: 'Karenaj / Moralès', code: 'HTI-N-CAP-CA-CR', parentId: 'sec-bande-du-nord', isActive: true, isLaunched: true, radiusKm: 2.0, sortOrder: 5 },
];

const SUPABASE_URL = 'https://xwmxgpdkmrzoraibdzrf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU';

let cachedAreas: ServiceArea[] | null = null;
let cachedPricing: Record<string, AreaPricing> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Fetch coverage data from Supabase platform_settings
 */
export async function getClientCoverage(): Promise<{
  areas: ServiceArea[];
  pricing: Record<string, AreaPricing>;
}> {
  const now = Date.now();
  if (cachedAreas && cachedPricing && now - lastFetchTime < CACHE_TTL_MS) {
    return { areas: cachedAreas, pricing: cachedPricing };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/platform_settings?key=in.(haiti_coverage_areas,haiti_area_pricing)&select=key,value`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (res.ok) {
      const rows = await res.json();
      let areas: ServiceArea[] = [];
      let pricing: Record<string, AreaPricing> = {};

      for (const row of rows) {
        const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (row.key === 'haiti_coverage_areas' && Array.isArray(val)) {
          areas = val;
        } else if (row.key === 'haiti_area_pricing' && val && typeof val === 'object') {
          pricing = val;
        }
      }

      if (areas.length > 0) {
        cachedAreas = areas;
        cachedPricing = pricing;
        lastFetchTime = now;
        return { areas, pricing };
      }
    }
  } catch (e) {
    console.warn('Could not fetch remote coverage, using local fallback:', e);
  }

  // Fallback
  return {
    areas: cachedAreas || FALLBACK_ZONES,
    pricing: cachedPricing || {},
  };
}

/**
 * Check if an area is effectively available.
 * ENFORCES PARENT RULE: Child is only available when itself is active AND every parent up the tree is active!
 */
export function isAreaAvailable(area: ServiceArea, allAreas: ServiceArea[]): boolean {
  if (!area.isActive) return false;

  let parentId = area.parentId;
  while (parentId) {
    const parent = allAreas.find(a => a.id === parentId);
    if (!parent) break;
    if (!parent.isActive) return false; // Parent is inactive -> child is BLOCKED!
    parentId = parent.parentId;
  }

  return true;
}

/**
 * Get all delivery zones that are currently active AND whose parents are all active.
 */
export async function getActiveDeliveryZones(): Promise<ServiceArea[]> {
  const { areas } = await getClientCoverage();
  return areas.filter(a => a.type === 'ZONE' && isAreaAvailable(a, areas));
}

/**
 * Find effective pricing for a zone or area, walking up to parent if unconfigured.
 */
export function getZoneEffectivePricing(
  areaId: string,
  allAreas: ServiceArea[],
  pricingMap: Record<string, AreaPricing>
): {
  pricing: AreaPricing | null;
  inheritedFrom: string | null;
  isDirect: boolean;
} {
  const direct = pricingMap[areaId];
  if (direct && direct.isConfigured && direct.baseFee !== null) {
    return { pricing: direct, inheritedFrom: null, isDirect: true };
  }

  const area = allAreas.find(a => a.id === areaId);
  if (!area) return { pricing: null, inheritedFrom: null, isDirect: false };

  let parentId = area.parentId;
  while (parentId) {
    const parent = allAreas.find(a => a.id === parentId);
    if (!parent) break;
    const parentPricing = pricingMap[parent.id];
    if (parentPricing && parentPricing.isConfigured && parentPricing.baseFee !== null) {
      return { pricing: parentPricing, inheritedFrom: parent.name, isDirect: false };
    }
    parentId = parent.parentId;
  }

  // Not configured anywhere in the chain!
  return { pricing: null, inheritedFrom: null, isDirect: false };
}

/**
 * Validate customer location (zone or address text).
 * Returns availability, matching area, and applicable pricing.
 */
export async function validateCustomerLocation(locationText: string): Promise<{
  isCovered: boolean;
  isAvailable: boolean;
  area: ServiceArea | null;
  pricing: AreaPricing | null;
  isPricingConfigured: boolean;
  message: string;
}> {
  if (!locationText || !locationText.trim()) {
    return {
      isCovered: false,
      isAvailable: false,
      area: null,
      pricing: null,
      isPricingConfigured: false,
      message: 'Tanpri chwazi oswa antre yon zòn livrezon.',
    };
  }

  const { areas, pricing: pricingMap } = await getClientCoverage();
  const lower = locationText.toLowerCase().trim();

  // Look for matching zone
  let matchedArea = areas.find(a => {
    const nameMatch = a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase());
    const krMatch = a.nameKr ? a.nameKr.toLowerCase().includes(lower) || lower.includes(a.nameKr.toLowerCase()) : false;
    const codeMatch = lower.includes(a.code.toLowerCase());
    return nameMatch || krMatch || codeMatch;
  });

  // Default to Centre-Ville Okap if generic "Cap-Haïtien" or "Okap"
  if (!matchedArea && (lower.includes('cap') || lower.includes('okap') || lower.includes('tout zòn') || lower.includes('sant vil'))) {
    matchedArea = areas.find(a => a.code === 'HTI-N-CAP-CA-CV') || FALLBACK_ZONES[0];
  }

  if (!matchedArea) {
    return {
      isCovered: false,
      isAvailable: false,
      area: null,
      pricing: null,
      isPricingConfigured: false,
      message: `Zòn "${locationText}" pa nan lis kouvèti sèvis Delivery Lakay kounye a. Nou sèvi Okap ak depatman Nò an premye.`,
    };
  }

  // Check hierarchical availability
  const available = isAreaAvailable(matchedArea, areas);
  if (!available) {
    return {
      isCovered: true,
      isAvailable: false,
      area: matchedArea,
      pricing: null,
      isPricingConfigured: false,
      message: `Zòn "${matchedArea.name}" pa disponib pou livrezon kounye a (dezaktive oswa zòn paran li an repo).`,
    };
  }

  // Check pricing
  const { pricing } = getZoneEffectivePricing(matchedArea.id, areas, pricingMap);
  const isConfigured = pricing !== null && pricing.baseFee !== null;

  return {
    isCovered: true,
    isAvailable: true,
    area: matchedArea,
    pricing,
    isPricingConfigured: isConfigured,
    message: isConfigured
      ? `Zòn "${matchedArea.name}" disponib! Tarif baz: ${pricing.baseFee} HTG.`
      : `Zòn "${matchedArea.name}" kouvri, men tarif ofisyèl li poko fin konfigire pa administrasyon an.`,
  };
}

