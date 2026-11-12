// apps/web_client/src/lib/locationResolver.ts
// Handles device GPS permission, coordinate resolving, and hierarchical coverage mapping

import { getClientCoverage, isAreaAvailable, getZoneEffectivePricing, type ServiceArea, type AreaPricing } from './coverage';

export interface LocationResolveResult {
  latitude?: number;
  longitude?: number;
  area: ServiceArea | null;
  department: ServiceArea | null;
  isCovered: boolean;
  isAvailable: boolean;
  isPricingConfigured: boolean;
  pricing: AreaPricing | null;
  statusMessage: string;
  source: 'gps' | 'manual';
}

/**
 * Calculates distance in kilometers between two GPS coordinates (Haversine formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Request device location with browser permission handling
 */
export async function requestDeviceLocation(): Promise<{
  ok: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return { ok: false, error: 'Aparèy ou pa sipòte lokalizasyon GPS otomatik.' };
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          ok: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      err => {
        let msg = 'Lokalizasyon echwe.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Pèmisyon GPS refize. Tanpri chwazi zòn ou manyèlman nan lis la.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Siyal GPS pa disponib kounye a. Tanpri chwazi zòn ou nan lis la.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tan pou pran lokalizasyon an fini. Tanpri chwazi zòn ou nan lis la.';
        }
        resolve({ ok: false, error: msg });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

/**
 * Resolves GPS coordinates to the best matching coverage area and department
 */
export async function resolveLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<LocationResolveResult> {
  const { areas, pricing: pricingMap } = await getClientCoverage();
  const zones = areas.filter(a => a.type === 'ZONE');

  let closestZone: ServiceArea | null = null;
  let minDistance = Infinity;

  for (const zone of zones) {
    if (zone.latitude && zone.longitude) {
      const dist = calculateDistanceKm(lat, lng, zone.latitude, zone.longitude);
      const radius = zone.radiusKm || 3.0;

      // Inside zone perimeter
      if (dist <= radius && dist < minDistance) {
        minDistance = dist;
        closestZone = zone;
      }
    }
  }

  // If outside all zone radii, find the nearest zone anyway to check proximity
  if (!closestZone && zones.length > 0) {
    for (const zone of zones) {
      if (zone.latitude && zone.longitude) {
        const dist = calculateDistanceKm(lat, lng, zone.latitude, zone.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestZone = zone;
        }
      }
    }
  }

  if (!closestZone) {
    return {
      latitude: lat,
      longitude: lng,
      area: null,
      department: null,
      isCovered: false,
      isAvailable: false,
      isPricingConfigured: false,
      pricing: null,
      statusMessage: 'Lokalizasyon ou an deyò tout zòn kouvèti Delivery Lakay kounye a.',
      source: 'gps',
    };
  }

  // Find department
  const department = findAncestorDepartment(closestZone, areas);

  // Check if within acceptable service perimeter (e.g. <= radius + 1km)
  const isWithinPerimeter = minDistance <= (closestZone.radiusKm || 3.0) + 1.0;
  const isAvail = isWithinPerimeter && isAreaAvailable(closestZone, areas);

  const { pricing } = getZoneEffectivePricing(closestZone.id, areas, pricingMap);
  const isPricingConfigured = pricing !== null && pricing.baseFee !== null;

  let msg = '';
  if (!isWithinPerimeter) {
    msg = `Pozisyon GPS ou twouve l a ${minDistance.toFixed(1)} km de pi pre zòn nou sèvi an (${closestZone.name}). Kouvèti a poko rive la.`;
  } else if (!isAvail) {
    msg = `Zòn ${closestZone.name} kouvri, men sèvis la an repo oswa dezaktive kounye a.`;
  } else if (isPricingConfigured) {
    msg = `🟢 Zòn idantifye: ${closestZone.name} (${department?.name || 'Nò'}) • Tarif baz: ${pricing?.baseFee} HTG • ~${pricing?.estimatedDeliveryMinutes || 30} min`;
  } else {
    msg = `ℹ️ Zòn idantifye: ${closestZone.name} (${department?.name || 'Nò'}) • Tarif espesifik poko konfigire pa administrasyon an.`;
  }

  return {
    latitude: lat,
    longitude: lng,
    area: closestZone,
    department,
    isCovered: isWithinPerimeter,
    isAvailable: isAvail,
    isPricingConfigured,
    pricing,
    statusMessage: msg,
    source: 'gps',
  };
}

/**
 * Resolves a manually selected zone ID to its coverage result
 */
export async function resolveLocationFromZoneId(
  zoneId: string
): Promise<LocationResolveResult> {
  const { areas, pricing: pricingMap } = await getClientCoverage();
  const area = areas.find(a => a.id === zoneId);

  if (!area) {
    return {
      area: null,
      department: null,
      isCovered: false,
      isAvailable: false,
      isPricingConfigured: false,
      pricing: null,
      statusMessage: 'Zòn sa a pa rekonèt nan sistèm nan.',
      source: 'manual',
    };
  }

  const department = findAncestorDepartment(area, areas);
  const isAvail = isAreaAvailable(area, areas);
  const { pricing } = getZoneEffectivePricing(area.id, areas, pricingMap);
  const isPricingConfigured = pricing !== null && pricing.baseFee !== null;

  let msg = '';
  if (!isAvail) {
    msg = `Zòn ${area.name} pa disponib pou sèvis kounye a (dezaktive oswa zòn paran inaktif).`;
  } else if (isPricingConfigured) {
    msg = `🟢 Zòn kouvri: ${area.name} (${department?.name || 'Nò'}) • Tarif baz: ${pricing?.baseFee} HTG`;
  } else {
    msg = `ℹ️ Zòn kouvri: ${area.name} (${department?.name || 'Nò'}) • Tarif espesifik poko konfigire.`;
  }

  return {
    latitude: area.latitude ?? undefined,
    longitude: area.longitude ?? undefined,
    area,
    department,
    isCovered: true,
    isAvailable: isAvail,
    isPricingConfigured,
    pricing,
    statusMessage: msg,
    source: 'manual',
  };
}

function findAncestorDepartment(area: ServiceArea, allAreas: ServiceArea[]): ServiceArea | null {
  if (area.type === 'DEPARTMENT') return area;
  let currentParentId = area.parentId;
  while (currentParentId) {
    const parent = allAreas.find(a => a.id === currentParentId);
    if (!parent) break;
    if (parent.type === 'DEPARTMENT') return parent;
    currentParentId = parent.parentId;
  }
  return null;
}

