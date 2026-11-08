import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZone } from '../../database/entities/zone.entity';
import { Merchant } from '../../database/entities/merchant.entity';

export interface PriceQuoteInput {
  merchantId: string;
  items: Array<{ productId: string; price: number; quantity: number }>;
  customerLat: number;
  customerLng: number;
  promoCode?: string;
}

export interface PriceQuoteResult {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discountAmount: number;
  total: number;
  merchantEarnings: number;
  driverEarnings: number;
  platformCommission: number;
  distanceKm: number;
  estimatedDurationMin: number;
  currency: string;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(DeliveryZone)
    private readonly zoneRepo: Repository<DeliveryZone>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  // Formule de Haversine pour le calcul précis de la distance en kilomètres
  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10; // Arrondi à 1 décimale
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async calculateQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
    const merchant = await this.merchantRepo.findOne({ where: { id: input.merchantId } });
    if (!merchant) {
      throw new Error('Restaurant/boutique introuvable');
    }

    // Récupération de la zone du marchand ou zone par défaut
    let zone = merchant.zoneId ? await this.zoneRepo.findOne({ where: { id: merchant.zoneId } }) : null;
    if (!zone) {
      zone = await this.zoneRepo.findOne({ where: { isActive: true } });
    }

    const baseDeliveryFee = zone ? zone.baseDeliveryFee : parseFloat(process.env.BASE_DELIVERY_FEE || '150.0');
    const perKmFee = zone ? zone.perKmFee : parseFloat(process.env.PER_KM_FEE || '35.0');
    const surgeMultiplier = zone ? zone.surgeMultiplier : 1.0;
    const serviceFeePct = parseFloat(process.env.SERVICE_FEE_PERCENTAGE || '8.0') / 100;
    const merchantCommissionRate = (merchant.commissionRate || 15.0) / 100;

    // Calcul de la distance
    const distanceKm = Math.max(
      1.0,
      this.calculateHaversineDistance(merchant.latitude, merchant.longitude, input.customerLat, input.customerLng),
    );

    // Calcul du sous-total des articles et quantité totale
    const subtotal = input.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalQuantity = input.items.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // ─── ALGORITHME DYNAMIQUE DE LIVRAISON DELIVERY LAKAY HAÏTI ─────────────
    // 1. Frais de base par distance
    const extraKm = Math.max(0, distanceKm - 2.0); // 2 premiers km inclus
    const longDistKm = Math.max(0, distanceKm - 10.0); // Au-delà de 10 km (carburant et retour à vide)
    const distanceFee = baseDeliveryFee + (extraKm * perKmFee) + (longDistKm * 15.0);

    // 2. Surcharge de volume & quantité (ex: 100 boîtes / cartons de livraison)
    let volumeSurcharge = 0;
    if (totalQuantity <= 4) {
      volumeSurcharge = 0; // Commande standard (repas / 1 sachet)
    } else if (totalQuantity <= 10) {
      volumeSurcharge = 50; // Sac à dos plein
    } else if (totalQuantity <= 25) {
      volumeSurcharge = 150; // Grand colis / caisse moyenne
    } else if (totalQuantity <= 50) {
      volumeSurcharge = 350; // Très volumineux (coursier dédié)
    } else if (totalQuantity <= 100) {
      volumeSurcharge = 750; // 100 boîtes / cargaison moto multiple ou triporteur
    } else {
      volumeSurcharge = 750 + (totalQuantity - 100) * 10;
    }

    // 3. Surcharge selon la catégorie de commerce (poids moyen)
    let categorySurcharge = 0;
    const cat = (merchant.type || '').toUpperCase();
    if (cat === 'SUPERMARKET' || cat === 'GROCERY') {
      categorySurcharge = 30; // Packs d'eau, sacs de riz, huiles
    } else if (cat === 'LOGISTICS' || cat === 'CARGO' || cat === 'HARDWARE') {
      categorySurcharge = 100; // Colis encombrants / cartons
    }

    // Frais de livraison totaux avec multiplicateur de zone/surge
    const rawDeliveryFee = (distanceFee + volumeSurcharge + categorySurcharge) * surgeMultiplier;
    const deliveryFee = Math.round(rawDeliveryFee);

    // Frais de service (8%)
    const serviceFee = Math.round(subtotal * serviceFeePct);

    // Réduction (mock promo)
    let discountAmount = 0;
    if (input.promoCode === 'BIENVENUE') {
      discountAmount = Math.min(100, subtotal * 0.1);
    }

    // Total payé par le client
    const total = subtotal + deliveryFee + serviceFee - discountAmount;

    // Ventilation interne :
    // 1. Commission prélevée sur le restaurant
    const commissionFromMerchant = Math.round(subtotal * merchantCommissionRate);
    const merchantEarnings = subtotal - commissionFromMerchant;

    // 2. Part du livreur (80% des frais de livraison minimum garanti)
    const driverEarnings = Math.round(deliveryFee * 0.85);

    // 3. Marge brute de la plateforme
    const platformCommission = total - merchantEarnings - driverEarnings;

    // Estimation de la durée en minutes (temps de prep + 3.5 min par km en circulation à Port-au-Prince)
    const travelTime = Math.round(distanceKm * 3.5);
    const estimatedDurationMin = (merchant.avgPrepTimeMinutes || 20) + travelTime;

    return {
      subtotal,
      deliveryFee,
      serviceFee,
      discountAmount,
      total,
      merchantEarnings,
      driverEarnings,
      platformCommission,
      distanceKm,
      estimatedDurationMin,
      currency: 'HTG',
    };
  }
}
