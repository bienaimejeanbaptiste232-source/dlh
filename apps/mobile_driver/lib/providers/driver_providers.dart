import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/driver_models.dart';
import '../services/driver_api_service.dart';
import '../services/driver_socket_service.dart';

final driverApiProvider = Provider<DriverApiService>((ref) => DriverApiService());

// Profil du chauffeur connecté
class CurrentDriverProfileNotifier extends Notifier<DriverUserProfile?> {
  @override
  DriverUserProfile? build() {
    Future.microtask(() => refreshFromStorage());
    return null;
  }

  void setProfile(DriverUserProfile? profile) {
    state = profile;
  }

  Future<void> refreshFromStorage() async {
    final prof = await ref.read(driverApiProvider).getSavedDriverProfile();
    if (prof != null) {
      state = prof;
    }
  }
}

final currentDriverProfileProvider =
    NotifierProvider<CurrentDriverProfileNotifier, DriverUserProfile?>(() {
  return CurrentDriverProfileNotifier();
});

// État de disponibilité (En ligne / Hors ligne)
class DriverStatusNotifier extends Notifier<bool> {
  @override
  bool build() => false; // Hòs lig pa defò — chofè dwe aksyon pou pasé an lig

  void toggle() {
    state = !state;
    final driver = ref.read(currentDriverProfileProvider);
    if (driver != null) {
      ref.read(driverApiProvider).updateDriverOnlineStatus(driver.id, state);
    }
  }
}

final driverStatusProvider = NotifierProvider<DriverStatusNotifier, bool>(() {
  return DriverStatusNotifier();
});

// État de la mission active
class ActiveMissionNotifier extends Notifier<Mission?> {
  @override
  Mission? build() => null;

  void setMission(Mission? mission) {
    state = mission;
  }

  Future<bool> progressMission() async {
    if (state == null) return false;
    final api = ref.read(driverApiProvider);
    final orderId = state!.orderId;

    if (state!.status == 'ASSIGNED' ||
        state!.status == 'DRIVER_ASSIGNED' ||
        state!.status == 'DRIVER_ARRIVING') {
      // 1. Notifier WebSocket backend an tan reyèl
      DriverSocketService().confirmPickup(orderId);
      // 2. Mete a jou nan Supabase & backend
      final ok = await api.confirmPickup(orderId);
      // 3. Mete a jou eta lokal imedyatman
      state = Mission(
        orderId: state!.orderId,
        orderNumber: state!.orderNumber,
        merchantName: state!.merchantName,
        merchantAddress: state!.merchantAddress,
        customerName: state!.customerName,
        customerPhone: state!.customerPhone,
        customerAddress: state!.customerAddress,
        customerNote: state!.customerNote,
        deliveryFee: state!.deliveryFee,
        totalOrderAmount: state!.totalOrderAmount,
        paymentMethod: state!.paymentMethod,
        status: 'PICKED_UP',
        distanceKm: state!.distanceKm,
      );
      return ok;
    } else if (state!.status == 'PICKED_UP' || state!.status == 'IN_TRANSIT') {
      // 1. Notifier WebSocket backend an tan reyèl
      DriverSocketService().confirmDelivery(orderId);
      // 2. Mete a jou nan Supabase & backend
      final ok = await api.confirmDelivery(orderId);
      // 3. Fèmen misyon an imedyatman -> retounen nan rada pwòp
      state = null;
      return ok;
    }
    return false;
  }

  void clearMission() {
    state = null;
  }
}

final activeMissionProvider = NotifierProvider<ActiveMissionNotifier, Mission?>(() {
  return ActiveMissionNotifier();
});
