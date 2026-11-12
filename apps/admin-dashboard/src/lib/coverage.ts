import { supabase } from './supabase';

export type AreaType = 'DEPARTMENT' | 'ARRONDISSEMENT' | 'COMMUNE' | 'COMMUNAL_SECTION' | 'ZONE';

export interface ServiceArea {
  id: string;
  type: AreaType;
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
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AreaPricing {
  id: string;
  areaId: string;
  baseFee: number | null;               // null = NOT CONFIGURED
  perKmFee: number | null;              // null = NOT CONFIGURED
  nightSurcharge: number | null;        // null = NOT CONFIGURED
  minOrderAmount: number | null;        // null = NOT CONFIGURED
  estimatedDeliveryMinutes: number | null; // null = NOT CONFIGURED
  serviceFeePercent: number | null;     // null = NOT CONFIGURED
  specialConditions: string | null;     // null = NOT CONFIGURED
  isConfigured: boolean;                // false = explicitly unconfigured
  updatedAt?: string;
}

const STORAGE_KEY_AREAS = 'haiti_coverage_areas';
const STORAGE_KEY_PRICING = 'haiti_area_pricing';

// ============================================================
// INITIAL SEED DATA (Nord first, all other 9 departments ready)
// ============================================================
export const INITIAL_HAITI_AREAS: ServiceArea[] = [
  // 10 Departments
  { id: 'dept-nord', type: 'DEPARTMENT', name: 'Nord', nameKr: 'Nò', code: 'HTI-N', parentId: null, isActive: true, isLaunched: true, latitude: 19.7576, longitude: -72.2048, sortOrder: 1 },
  { id: 'dept-ouest', type: 'DEPARTMENT', name: 'Ouest', nameKr: 'Lwès', code: 'HTI-O', parentId: null, isActive: false, isLaunched: false, latitude: 18.5944, longitude: -72.3074, sortOrder: 2 },
  { id: 'dept-sud', type: 'DEPARTMENT', name: 'Sud', nameKr: 'Sid', code: 'HTI-S', parentId: null, isActive: false, isLaunched: false, latitude: 18.2001, longitude: -73.7500, sortOrder: 3 },
  { id: 'dept-artibonite', type: 'DEPARTMENT', name: 'Artibonite', nameKr: 'Latibonit', code: 'HTI-A', parentId: null, isActive: false, isLaunched: false, latitude: 19.4432, longitude: -72.6880, sortOrder: 4 },
  { id: 'dept-centre', type: 'DEPARTMENT', name: 'Centre', nameKr: 'Sant', code: 'HTI-C', parentId: null, isActive: false, isLaunched: false, latitude: 19.1500, longitude: -72.0167, sortOrder: 5 },
  { id: 'dept-grandanse', type: 'DEPARTMENT', name: "Grand'Anse", nameKr: 'Grandans', code: 'HTI-GA', parentId: null, isActive: false, isLaunched: false, latitude: 18.6833, longitude: -74.1167, sortOrder: 6 },
  { id: 'dept-nippes', type: 'DEPARTMENT', name: 'Nippes', nameKr: 'Nip', code: 'HTI-NI', parentId: null, isActive: false, isLaunched: false, latitude: 18.3833, longitude: -73.4000, sortOrder: 7 },
  { id: 'dept-nord-est', type: 'DEPARTMENT', name: 'Nord-Est', nameKr: 'Nòdès', code: 'HTI-NE', parentId: null, isActive: false, isLaunched: false, latitude: 19.5667, longitude: -71.8500, sortOrder: 8 },
  { id: 'dept-nord-ouest', type: 'DEPARTMENT', name: 'Nord-Ouest', nameKr: 'Nòdwès', code: 'HTI-NO', parentId: null, isActive: false, isLaunched: false, latitude: 19.9333, longitude: -73.1333, sortOrder: 9 },
  { id: 'dept-sud-est', type: 'DEPARTMENT', name: 'Sud-Est', nameKr: 'Sidès', code: 'HTI-SE', parentId: null, isActive: false, isLaunched: false, latitude: 18.2333, longitude: -72.5333, sortOrder: 10 },

  // Arrondissements of Nord (Dept: dept-nord)
  { id: 'arr-cap-haitien', type: 'ARRONDISSEMENT', name: 'Cap-Haïtien', nameKr: 'Okap', code: 'HTI-N-CAP', parentId: 'dept-nord', isActive: true, isLaunched: true, latitude: 19.7576, longitude: -72.2048, sortOrder: 1 },
  { id: 'arr-acul-du-nord', type: 'ARRONDISSEMENT', name: 'Acul-du-Nord', nameKr: 'Akil Nò', code: 'HTI-N-ACU', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.6833, longitude: -72.2500, sortOrder: 2 },
  { id: 'arr-borgne', type: 'ARRONDISSEMENT', name: 'Borgne', nameKr: 'Bòn', code: 'HTI-N-BOR', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.8333, longitude: -72.5333, sortOrder: 3 },
  { id: 'arr-grande-riviere', type: 'ARRONDISSEMENT', name: 'Grande-Rivière-du-Nord', nameKr: 'Gran Rivyè Nò', code: 'HTI-N-GRN', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.5667, longitude: -72.1667, sortOrder: 4 },
  { id: 'arr-limbe', type: 'ARRONDISSEMENT', name: 'Limbé', nameKr: 'Lenbe', code: 'HTI-N-LIM', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.7000, longitude: -72.3833, sortOrder: 5 },
  { id: 'arr-plaisance', type: 'ARRONDISSEMENT', name: 'Plaisance', nameKr: 'Plezans', code: 'HTI-N-PLA', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.5917, longitude: -72.4583, sortOrder: 6 },
  { id: 'arr-ranquitte', type: 'ARRONDISSEMENT', name: 'Ranquitte', nameKr: 'Rankit', code: 'HTI-N-RAN', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.5000, longitude: -72.3000, sortOrder: 7 },
  { id: 'arr-saint-raphael', type: 'ARRONDISSEMENT', name: 'Saint-Raphaël', nameKr: 'Sen Rafayèl', code: 'HTI-N-SRA', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.5000, longitude: -72.1333, sortOrder: 8 },
  { id: 'arr-vallieres', type: 'ARRONDISSEMENT', name: 'Vallières', nameKr: 'Vayè', code: 'HTI-N-VAL', parentId: 'dept-nord', isActive: false, isLaunched: false, latitude: 19.5333, longitude: -71.9500, sortOrder: 9 },

  // Communes of Arrondissement Cap-Haïtien
  { id: 'com-cap-haitien', type: 'COMMUNE', name: 'Cap-Haïtien', nameKr: 'Okap', code: 'HTI-N-CAP-CA', parentId: 'arr-cap-haitien', isActive: true, isLaunched: true, latitude: 19.7576, longitude: -72.2048, sortOrder: 1 },
  { id: 'com-acul-du-nord', type: 'COMMUNE', name: 'Acul-du-Nord', nameKr: 'Akil Nò', code: 'HTI-N-CAP-AC', parentId: 'arr-cap-haitien', isActive: false, isLaunched: false, latitude: 19.6833, longitude: -72.2167, sortOrder: 2 },
  { id: 'com-limonade', type: 'COMMUNE', name: 'Limonade', nameKr: 'Limonad', code: 'HTI-N-CAP-LI', parentId: 'arr-cap-haitien', isActive: false, isLaunched: false, latitude: 19.6667, longitude: -72.1167, sortOrder: 3 },
  { id: 'com-grande-riviere', type: 'COMMUNE', name: 'Grande-Rivière-du-Nord', nameKr: 'Gran Rivyè Nò', code: 'HTI-N-CAP-GR', parentId: 'arr-cap-haitien', isActive: false, isLaunched: false, latitude: 19.5667, longitude: -72.1667, sortOrder: 4 },
  { id: 'com-quartier-morin', type: 'COMMUNE', name: 'Quartier-Morin', nameKr: 'Katye Moren', code: 'HTI-N-CAP-QM', parentId: 'arr-cap-haitien', isActive: false, isLaunched: false, latitude: 19.7000, longitude: -72.1500, sortOrder: 5 },

  // Communal Sections of Cap-Haïtien Commune
  { id: 'sec-bande-du-nord', type: 'COMMUNAL_SECTION', name: '1ère Section Bande du Nord', nameKr: '1è Seksyon Band di Nò', code: 'HTI-N-CAP-CA-S1', parentId: 'com-cap-haitien', isActive: true, isLaunched: true, latitude: 19.7650, longitude: -72.2000, sortOrder: 1 },
  { id: 'sec-haut-du-cap', type: 'COMMUNAL_SECTION', name: '2ème Section Haut du Cap', nameKr: '2è Seksyon O di Kap', code: 'HTI-N-CAP-CA-S2', parentId: 'com-cap-haitien', isActive: true, isLaunched: true, latitude: 19.7450, longitude: -72.2100, sortOrder: 2 },
  { id: 'sec-petit-anse', type: 'COMMUNAL_SECTION', name: '3ème Section Petite-Anse', nameKr: '3è Seksyon Ti Ans', code: 'HTI-N-CAP-CA-S3', parentId: 'com-cap-haitien', isActive: true, isLaunched: true, latitude: 19.7350, longitude: -72.1850, sortOrder: 3 },

  // Service Delivery Zones in Cap-Haïtien
  { id: 'zone-centre-ville', type: 'ZONE', name: 'Centre-Ville Okap', nameKr: 'Sant Vil Okap', code: 'HTI-N-CAP-CA-CV', parentId: 'sec-bande-du-nord', isActive: true, isLaunched: true, latitude: 19.7576, longitude: -72.2048, radiusKm: 3.0, sortOrder: 1 },
  { id: 'zone-haut-du-cap', type: 'ZONE', name: 'Haut du Cap', nameKr: 'Odika', code: 'HTI-N-CAP-CA-HC', parentId: 'sec-haut-du-cap', isActive: true, isLaunched: true, latitude: 19.7700, longitude: -72.1900, radiusKm: 2.5, sortOrder: 2 },
  { id: 'zone-vertieres', type: 'ZONE', name: 'Vertières', nameKr: 'Vètyè', code: 'HTI-N-CAP-CA-VE', parentId: 'sec-haut-du-cap', isActive: true, isLaunched: true, latitude: 19.7800, longitude: -72.2200, radiusKm: 2.5, sortOrder: 3 },
  { id: 'zone-petite-anse', type: 'ZONE', name: 'Petite-Anse / Cité Lescot', nameKr: 'Ti Ans / Sit Lesko', code: 'HTI-N-CAP-CA-PA', parentId: 'sec-petit-anse', isActive: true, isLaunched: true, latitude: 19.7350, longitude: -72.1850, radiusKm: 2.0, sortOrder: 4 },
  { id: 'zone-carenage', type: 'ZONE', name: 'Carénage / Moralès', nameKr: 'Karenaj / Moralès', code: 'HTI-N-CAP-CA-CR', parentId: 'sec-bande-du-nord', isActive: true, isLaunched: true, latitude: 19.7680, longitude: -72.2010, radiusKm: 2.0, sortOrder: 5 },
  { id: 'zone-plaine-du-nord', type: 'ZONE', name: 'Plaine-du-Nord', nameKr: 'Plèn Nò', code: 'HTI-N-CAP-CA-PN', parentId: 'com-acul-du-nord', isActive: false, isLaunched: false, latitude: 19.5833, longitude: -72.2000, radiusKm: 5.0, sortOrder: 6 },
  { id: 'zone-limonade', type: 'ZONE', name: 'Limonade (Campus)', nameKr: 'Limonad (Kanpis)', code: 'HTI-N-CAP-CA-LM', parentId: 'com-limonade', isActive: false, isLaunched: false, latitude: 19.6667, longitude: -72.1167, radiusKm: 3.5, sortOrder: 7 },
];

export const INITIAL_HAITI_PRICING: Record<string, AreaPricing> = {
  // Configured pricing for Cap-Haïtien Commune (inherited by its zones if not overridden)
  'com-cap-haitien': {
    id: 'prc-com-cap-haitien',
    areaId: 'com-cap-haitien',
    baseFee: 150,
    perKmFee: 35,
    nightSurcharge: 50,
    minOrderAmount: 250,
    estimatedDeliveryMinutes: 30,
    serviceFeePercent: 10,
    specialConditions: 'Livrezon moto estanda nan tout perimèt vil Okap',
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  },
  // Zone Centre-Ville (custom express delivery time)
  'zone-centre-ville': {
    id: 'prc-zone-centre-ville',
    areaId: 'zone-centre-ville',
    baseFee: 150,
    perKmFee: 35,
    nightSurcharge: 50,
    minOrderAmount: 200,
    estimatedDeliveryMinutes: 20,
    serviceFeePercent: 10,
    specialConditions: 'Zòn hyper-santral, disponiblite kourye pi rapid (15-25 min)',
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  },
  // Zone Haut du Cap
  'zone-haut-du-cap': {
    id: 'prc-zone-haut-du-cap',
    areaId: 'zone-haut-du-cap',
    baseFee: 160,
    perKmFee: 35,
    nightSurcharge: 50,
    minOrderAmount: 250,
    estimatedDeliveryMinutes: 35,
    serviceFeePercent: 10,
    specialConditions: 'Aksè pant e wout segondè',
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  },
  // Zone Vertières
  'zone-vertieres': {
    id: 'prc-zone-vertieres',
    areaId: 'zone-vertieres',
    baseFee: 160,
    perKmFee: 35,
    nightSurcharge: 50,
    minOrderAmount: 250,
    estimatedDeliveryMinutes: 35,
    serviceFeePercent: 10,
    specialConditions: 'Sektè istorik Vètyè / Wout Nasyonal',
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  },
  // NOTICE: All other zones and departments have NO PRICING configured (null / unconfigured)
  // This respects the requirement: "Do not invent missing prices or coverage info"
};

// ============================================================
// HIERARCHY LOGIC & AVAILABILITY ENFORCEMENT
// ============================================================

/**
 * Returns the path of ancestor areas from the top (Department) down to the given area.
 */
export function getAreaAncestors(area: ServiceArea, allAreas: ServiceArea[]): ServiceArea[] {
  const ancestors: ServiceArea[] = [];
  let currentParentId = area.parentId;
  while (currentParentId) {
    const parent = allAreas.find(a => a.id === currentParentId);
    if (!parent) break;
    ancestors.unshift(parent);
    currentParentId = parent.parentId;
  }
  return ancestors;
}

/**
 * Check if an area is effectively active.
 * RULE: An area is only active when itself IS active AND ALL parent/ancestor areas are active!
 * If any parent area in the chain is inactive, child is BLOCKED/UNAVAILABLE.
 */
export function isAreaEffectivelyActive(area: ServiceArea, allAreas: ServiceArea[]): {
  isAvailable: boolean;
  reason?: 'SELF_INACTIVE' | 'PARENT_INACTIVE';
  blockingParent?: ServiceArea;
} {
  if (!area.isActive) {
    return { isAvailable: false, reason: 'SELF_INACTIVE' };
  }

  const ancestors = getAreaAncestors(area, allAreas);
  for (const parent of ancestors) {
    if (!parent.isActive) {
      return {
        isAvailable: false,
        reason: 'PARENT_INACTIVE',
        blockingParent: parent,
      };
    }
  }

  return { isAvailable: true };
}

/**
 * Find effective pricing for an area.
 * Looks up direct configuration first. If not configured, walks up the ancestor tree
 * (e.g. Zone -> Communal Section -> Commune -> Arrondissement -> Department)
 * to inherit pricing. If no configured pricing exists anywhere in the tree, returns null (UNCONFIGURED).
 */
export function getEffectivePricing(
  areaId: string,
  allAreas: ServiceArea[],
  pricingMap: Record<string, AreaPricing>
): {
  pricing: AreaPricing | null;
  inheritedFrom: ServiceArea | null;
  isDirect: boolean;
} {
  const directPricing = pricingMap[areaId];
  if (directPricing && directPricing.isConfigured && directPricing.baseFee !== null) {
    return { pricing: directPricing, inheritedFrom: null, isDirect: true };
  }

  const area = allAreas.find(a => a.id === areaId);
  if (!area) return { pricing: null, inheritedFrom: null, isDirect: false };

  const ancestors = getAreaAncestors(area, allAreas);
  // Walk backwards from nearest parent
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const parent = ancestors[i];
    const parentPricing = pricingMap[parent.id];
    if (parentPricing && parentPricing.isConfigured && parentPricing.baseFee !== null) {
      return { pricing: parentPricing, inheritedFrom: parent, isDirect: false };
    }
  }

  // Not configured anywhere in the tree!
  return { pricing: null, inheritedFrom: null, isDirect: false };
}

// ============================================================
// DATA PERSISTENCE (Supabase platform_settings sync)
// ============================================================

export async function fetchCoverageAreas(): Promise<ServiceArea[]> {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', STORAGE_KEY_AREAS)
      .maybeSingle();

    if (error || !data?.value) {
      // First run: save initial seed
      await saveCoverageAreas(INITIAL_HAITI_AREAS);
      return INITIAL_HAITI_AREAS;
    }

    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_HAITI_AREAS;
  } catch (e) {
    console.error('Error fetching coverage areas:', e);
    return INITIAL_HAITI_AREAS;
  }
}

export async function saveCoverageAreas(areas: ServiceArea[]): Promise<boolean> {
  try {
    const payload = {
      key: STORAGE_KEY_AREAS,
      value: JSON.stringify(areas),
      category: 'coverage',
      description: 'Estrikti yerachik kouvèti jeyografik tout depatman Ayiti',
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('platform_settings')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      console.error('Error saving coverage areas:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error saving coverage areas:', e);
    return false;
  }
}

export async function fetchAreaPricingMap(): Promise<Record<string, AreaPricing>> {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', STORAGE_KEY_PRICING)
      .maybeSingle();

    if (error || !data?.value) {
      await saveAreaPricingMap(INITIAL_HAITI_PRICING);
      return INITIAL_HAITI_PRICING;
    }

    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return INITIAL_HAITI_PRICING;
  } catch (e) {
    console.error('Error fetching area pricing map:', e);
    return INITIAL_HAITI_PRICING;
  }
}

export async function saveAreaPricingMap(pricingMap: Record<string, AreaPricing>): Promise<boolean> {
  try {
    const payload = {
      key: STORAGE_KEY_PRICING,
      value: JSON.stringify(pricingMap),
      category: 'coverage',
      description: 'Tarif ak frè livrezon pa zòn ak depatman nan Ayiti',
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('platform_settings')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      console.error('Error saving area pricing:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error saving area pricing:', e);
    return false;
  }
}

/**
 * Toggles an area's active state.
 * Returns the updated area array and whether saving succeeded.
 */
export async function toggleAreaActive(
  areaId: string,
  newActiveState: boolean,
  currentAreas: ServiceArea[]
): Promise<{ success: boolean; updatedAreas: ServiceArea[] }> {
  const updated = currentAreas.map(a =>
    a.id === areaId
      ? { ...a, isActive: newActiveState, updatedAt: new Date().toISOString() }
      : a
  );
  const ok = await saveCoverageAreas(updated);
  return { success: ok, updatedAreas: updated };
}

/**
 * Updates or sets area pricing.
 */
export async function updateAreaPricing(
  areaId: string,
  pricingData: Partial<AreaPricing>,
  currentMap: Record<string, AreaPricing>
): Promise<{ success: boolean; updatedMap: Record<string, AreaPricing> }> {
  const existing = currentMap[areaId] || {
    id: `prc-${areaId}`,
    areaId,
    baseFee: null,
    perKmFee: null,
    nightSurcharge: null,
    minOrderAmount: null,
    estimatedDeliveryMinutes: null,
    serviceFeePercent: null,
    specialConditions: null,
    isConfigured: false,
  };

  const updatedItem: AreaPricing = {
    ...existing,
    ...pricingData,
    areaId,
    updatedAt: new Date().toISOString(),
  };

  const updatedMap = {
    ...currentMap,
    [areaId]: updatedItem,
  };

  const ok = await saveAreaPricingMap(updatedMap);
  return { success: ok, updatedMap };
}

/**
 * Adds a new area to the hierarchy.
 */
export async function addArea(
  newArea: Omit<ServiceArea, 'id' | 'createdAt' | 'updatedAt'>,
  currentAreas: ServiceArea[]
): Promise<{ success: boolean; updatedAreas: ServiceArea[]; created: ServiceArea }> {
  const id = `area-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const created: ServiceArea = {
    ...newArea,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updatedAreas = [...currentAreas, created];
  const ok = await saveCoverageAreas(updatedAreas);
  return { success: ok, updatedAreas, created };
}

