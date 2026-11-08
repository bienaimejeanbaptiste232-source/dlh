import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  eta: Date;
  coordinates: RouteCoordinate[];
  isRealRoute: boolean;
  provider: 'osrm' | 'mapbox' | 'google' | 'fallback_heuristic';
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  // Vitesse moyenne estimée d'une moto dans le trafic urbain haïtien (22 km/h)
  private readonly CITY_MOTO_SPEED_KMH = 22;

  /**
   * Calculer l'itinéraire routier réel et l'ETA entre 2 coordonnées
   */
  async calculateRoute(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
  ): Promise<RouteResult> {
    // 1. Essayer le service de routage OSRM routier public (ou Mapbox si clé configurée)
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (mapboxToken) {
      try {
        const mapboxResult = await this.fetchMapboxDirections(origin, destination, mapboxToken);
        if (mapboxResult) return mapboxResult;
      } catch (err: any) {
        this.logger.warn(`Échec Mapbox Directions: ${err.message}`);
      }
    }

    try {
      const osrmResult = await this.fetchOsrmRoute(origin, destination);
      if (osrmResult) return osrmResult;
    } catch (err: any) {
      this.logger.warn(`Échec OSRM public: ${err.message}`);
    }

    // 2. Fallback heuristique basé sur la topographie urbaine
    return this.calculateHeuristicRoute(origin, destination);
  }

  /**
   * Routage via OSRM (Open Source Routing Machine)
   */
  private async fetchOsrmRoute(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
  ): Promise<RouteResult | null> {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    const data = await this.httpGet(url, 3500);
    if (!data || !data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    // Durée en minutes (avec marge de 15% pour le trafic urbain)
    const durationMinutes = Math.max(1, Math.ceil((route.duration / 60) * 1.15));

    const coordinates: RouteCoordinate[] = (route.geometry?.coordinates || []).map(
      (c: [number, number]) => ({
        longitude: c[0],
        latitude: c[1],
      }),
    );

    const eta = new Date(Date.now() + durationMinutes * 60 * 1000);

    return {
      distanceKm,
      durationMinutes,
      eta,
      coordinates,
      isRealRoute: true,
      provider: 'osrm',
    };
  }

  /**
   * Routage via Mapbox Directions API
   */
  private async fetchMapboxDirections(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
    token: string,
  ): Promise<RouteResult | null> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&access_token=${token}`;

    const data = await this.httpGet(url, 4000);
    if (!data || !data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(1, Math.ceil(route.duration / 60));

    const coordinates: RouteCoordinate[] = (route.geometry?.coordinates || []).map(
      (c: [number, number]) => ({
        longitude: c[0],
        latitude: c[1],
      }),
    );

    const eta = new Date(Date.now() + durationMinutes * 60 * 1000);

    return {
      distanceKm,
      durationMinutes,
      eta,
      coordinates,
      isRealRoute: true,
      provider: 'mapbox',
    };
  }

  /**
   * Calcul heuristique réaliste avec courbure des rues et interpolation
   */
  private calculateHeuristicRoute(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
  ): RouteResult {
    // Calcul distance orthodromique
    const directKm = this.haversine(origin, destination);
    // Facteur d'enroulement des rues urbaines (généralement 1.3 à 1.4x)
    const roadWindingFactor = 1.35;
    const distanceKm = Math.round(directKm * roadWindingFactor * 10) / 10;

    // Durée basée sur la vitesse moyenne moto (22 km/h) + temps feux/carrefours
    const durationHours = distanceKm / this.CITY_MOTO_SPEED_KMH;
    const durationMinutes = Math.max(2, Math.ceil(durationHours * 60));
    const eta = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Générer une série de 6 points intermédiaires réalistes le long du trajet
    const coordinates: RouteCoordinate[] = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      // Légère oscillation naturelle pour simuler le tracé des rues
      const wobble = Math.sin(ratio * Math.PI) * 0.0006;
      coordinates.push({
        latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio + wobble,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio + wobble,
      });
    }

    return {
      distanceKm,
      durationMinutes,
      eta,
      coordinates,
      isRealRoute: false,
      provider: 'fallback_heuristic',
    };
  }

  private haversine(c1: RouteCoordinate, c2: RouteCoordinate): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(c2.latitude - c1.latitude);
    const dLon = this.deg2rad(c2.longitude - c1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(c1.latitude)) *
        Math.cos(this.deg2rad(c2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private httpGet(urlStr: string, timeoutMs: number): Promise<any> {
    return new Promise((resolve) => {
      const client = urlStr.startsWith('https') ? https : http;
      const req = client.get(urlStr, { timeout: timeoutMs }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          resolve(null);
          return;
        }
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (_) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }
}
