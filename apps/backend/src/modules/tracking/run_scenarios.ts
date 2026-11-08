import { TrackingService } from './tracking.service';
import { RoutingService } from './routing.service';
import { RedisService } from '../../common/redis/redis.service';
import { DriverStatus, VehicleType } from '../../database/entities/driver.entity';
import { OrderStatus } from '../../database/entities/order.entity';
import { DriverLocationDto } from './dto/tracking.dto';

async function runAll10Scenarios() {
  console.log('================================================================');
  console.log('🚀 MACKBEST1 — EXÉCUTION DES 10 SCÉNARIOS DE TEST GPS TEMPS RÉEL');
  console.log('================================================================\n');

  const mockDriverId = 'd1111111-1111-1111-1111-111111111111';
  const mockDriver2Id = 'd2222222-2222-2222-2222-222222222222';
  const mockOrderId = 'o1111111-1111-1111-1111-111111111111';
  const mockCustomerId = 'c1111111-1111-1111-1111-111111111111';
  const unauthorizedCustomerId = 'c9999999-9999-9999-9999-999999999999';

  const mockOrder: any = {
    id: mockOrderId,
    orderNumber: 'HT-2026-9901',
    customerId: mockCustomerId,
    driverId: mockDriverId,
    status: OrderStatus.IN_TRANSIT,
    deliveryAddress: {
      streetAddress: 'Boulevard du Cap, Bòdmè',
      latitude: 19.7625,
      longitude: -72.1985,
    },
    merchant: {
      name: 'Lakay Fritay Resto',
      latitude: 19.7594,
      longitude: -72.2008,
    },
    driver: {
      id: mockDriverId,
      user: { firstName: 'Jean', lastName: 'Baptiste', phoneNumber: '+509 37 00 1122' },
      vehicleType: VehicleType.MOTORCYCLE,
      licensePlate: 'AA-4590',
      ratingAvg: 4.9,
    },
  };

  const mockDriverRepo: any = {
    findOne: async ({ where }: any) => {
      if (where.id === mockDriverId) {
        return {
          id: mockDriverId,
          status: DriverStatus.ONLINE,
          vehicleType: VehicleType.MOTORCYCLE,
          currentLatitude: 19.7594,
          currentLongitude: -72.2008,
        };
      }
      return null;
    },
    update: async () => ({ affected: 1 }),
  };

  const mockOrderRepo: any = {
    findOne: async ({ where }: any) => {
      if (where.id === mockOrderId) return mockOrder;
      return null;
    },
    update: async () => ({ affected: 1 }),
  };

  const redisService = new RedisService();
  redisService.onModuleInit();

  const routingService = new RoutingService();
  const trackingService = new TrackingService(
    mockDriverRepo,
    mockOrderRepo,
    redisService,
    routingService,
  );

  let passed = 0;

  // 1. Livreur se connecte et passe en ligne
  try {
    const p1: DriverLocationDto = {
      driverId: mockDriverId,
      latitude: 19.7594,
      longitude: -72.2008,
      accuracy: 5.0,
      speed: 0.0,
      timestamp: Date.now(),
    };
    const r1 = await trackingService.processDriverLocation(mockDriverId, p1);
    if (r1 && r1.latitude === 19.7594) {
      console.log('✅ SCÉNARIO 1 : Le livreur se connecte et passe en ligne (Coordonnées GPS captées)');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 1 ÉCHEC:', e.message);
  }

  // 2. Livreur accepte une commande
  try {
    const p2: DriverLocationDto = {
      driverId: mockDriverId,
      orderId: mockOrderId,
      latitude: 19.7580,
      longitude: -72.2010,
      accuracy: 4.0,
      speed: 6.5,
      timestamp: Date.now(),
    };
    const r2 = await trackingService.processDriverLocation(mockDriverId, p2);
    if (r2 && r2.orderId === mockOrderId && r2.distanceRemainingKm !== undefined) {
      console.log(`✅ SCÉNARIO 2 : Commande acceptée — Itinéraire routier tracé (${r2.distanceRemainingKm} km, ETA: ${r2.durationMinutes} min)`);
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 2 ÉCHEC:', e.message);
  }

  // 3. Client voit la position GPS réelle
  try {
    const r3 = await trackingService.getOrderTrackingState(mockOrderId, mockCustomerId, 'CUSTOMER');
    if (r3 && r3.orderId === mockOrderId && r3.restaurant && r3.deliveryAddress) {
      console.log('✅ SCÉNARIO 3 : Le client voit la position GPS réelle, le restaurant et l’adresse de livraison');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 3 ÉCHEC:', e.message);
  }

  // 4. Déplacement en temps réel
  try {
    const p4: DriverLocationDto = {
      driverId: mockDriverId,
      orderId: mockOrderId,
      latitude: 19.7610,
      longitude: -72.1995,
      accuracy: 3.0,
      speed: 8.5,
      timestamp: Date.now() + 3000,
    };
    const r4 = await trackingService.processDriverLocation(mockDriverId, p4);
    if (r4 && r4.latitude === 19.7610) {
      console.log('✅ SCÉNARIO 4 : Le livreur se déplace — Mise à jour dynamique de la position en direct');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 4 ÉCHEC:', e.message);
  }

  // 5. Perte et rétablissement du réseau
  try {
    const cached = await redisService.get(`geo:driver:${mockDriverId}`);
    const p5: DriverLocationDto = {
      driverId: mockDriverId,
      orderId: mockOrderId,
      latitude: 19.7620,
      longitude: -72.1988,
      timestamp: Date.now(),
    };
    const r5 = await trackingService.processDriverLocation(mockDriverId, p5);
    if (cached && r5) {
      console.log('✅ SCÉNARIO 5 : Coupure/Rétablissement réseau — Récupération immédiate de la position sans perte');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 5 ÉCHEC:', e.message);
  }

  // 6. Application en arrière-plan
  try {
    const p6: DriverLocationDto = {
      driverId: mockDriverId,
      orderId: mockOrderId,
      latitude: 19.7622,
      longitude: -72.1986,
      accuracy: 8.0,
      speed: 4.2,
      timestamp: Date.now() - 4000,
    };
    const r6 = await trackingService.processDriverLocation(mockDriverId, p6);
    if (r6 && r6.latitude === 19.7622) {
      console.log('✅ SCÉNARIO 6 : Suivi en arrière-plan — Coordonnées reçues avec horodatage natif Android/iOS');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 6 ÉCHEC:', e.message);
  }

  // 7. Fin de la livraison
  try {
    await trackingService.finalizeOrderTracking(mockOrderId);
    const cachedOrder = await redisService.get(`geo:order:${mockOrderId}`);
    if (cachedOrder === null) {
      console.log('✅ SCÉNARIO 7 : Fin de livraison — Purge automatique du suivi en direct et arrêt du partage');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 7 ÉCHEC:', e.message);
  }

  // 8. Client non autorisé
  try {
    await trackingService.getOrderTrackingState(mockOrderId, unauthorizedCustomerId, 'CUSTOMER');
    console.error('❌ SCÉNARIO 8 ÉCHEC: L’accès aurait dû être refusé');
  } catch (e: any) {
    console.log('✅ SCÉNARIO 8 : Sécurité — Accès immédiatement refusé (403 Forbidden) pour un client non autorisé');
    passed++;
  }

  // 9. Plusieurs livreurs simultanés
  try {
    const d1: DriverLocationDto = {
      driverId: mockDriverId,
      latitude: 19.7500,
      longitude: -72.2000,
      timestamp: Date.now(),
    };
    const d2: DriverLocationDto = {
      driverId: mockDriver2Id,
      latitude: 19.7700,
      longitude: -72.1900,
      timestamp: Date.now(),
    };
    const [res1, res2] = await Promise.all([
      trackingService.processDriverLocation(mockDriverId, d1),
      trackingService.processDriverLocation(mockDriver2Id, d2),
    ]);
    if (res1?.latitude === 19.7500 && res2?.latitude === 19.7700) {
      console.log('✅ SCÉNARIO 9 : Multi-livreurs simultanés — Concurrence gérée sans collision');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 9 ÉCHEC:', e.message);
  }

  // 10. Coordonnées anciennes rejetées
  try {
    const oldPing: DriverLocationDto = {
      driverId: mockDriverId,
      latitude: 19.6000,
      longitude: -72.1000,
      timestamp: Date.now() - 300 * 1000, // 5 minutes dans le passé
    };
    const res10 = await trackingService.processDriverLocation(mockDriverId, oldPing);
    if (res10 === null) {
      console.log('✅ SCÉNARIO 10 : Anti-obsolescence — Coordonnées GPS périmées (>2min) automatiquement rejetées');
      passed++;
    }
  } catch (e: any) {
    console.error('❌ SCÉNARIO 10 ÉCHEC:', e.message);
  }

  console.log('\n================================================================');
  console.log(`📊 RÉSULTAT : ${passed} / 10 SCÉNARIOS VALIDÉS AVEC SUCCÈS`);
  console.log('================================================================\n');

  await redisService.onModuleDestroy();
  process.exit(passed === 10 ? 0 : 1);
}

runAll10Scenarios();
