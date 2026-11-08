import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/merchant_models.dart';
import '../services/merchant_api_service.dart';

final merchantApiProvider = Provider<MerchantApiService>((ref) => MerchantApiService());

// ─── Pwofil Restoran ─────────────────────────────────────────
class MerchantProfileNotifier extends Notifier<MerchantProfile?> {
  @override
  MerchantProfile? build() {
    loadProfile();
    return null;
  }

  Future<void> loadProfile() async {
    final prof = await ref.read(merchantApiProvider).getSavedProfile();
    state = prof;
  }

  Future<bool> toggleOpenStatus() async {
    if (state == null) return false;
    final newStatus = !state!.isOpen;
    final ok = await ref.read(merchantApiProvider).toggleRestaurantOpen(state!.id, newStatus);
    if (ok) {
      state = MerchantProfile(
        id: state!.id,
        ownerId: state!.ownerId,
        name: state!.name,
        type: state!.type,
        address: state!.address,
        phone: state!.phone,
        latitude: state!.latitude,
        longitude: state!.longitude,
        logoUrl: state!.logoUrl,
        bannerUrl: state!.bannerUrl,
        commissionRate: state!.commissionRate,
        avgPrepTimeMinutes: state!.avgPrepTimeMinutes,
        isOpen: newStatus,
        isVerified: state!.isVerified,
        zoneName: state!.zoneName,
      );
    }
    return ok;
  }
}

final merchantProfileProvider =
    NotifierProvider<MerchantProfileNotifier, MerchantProfile?>(() {
  return MerchantProfileNotifier();
});

// ─── Kòmand Restoran ─────────────────────────────────────────
class MerchantOrdersNotifier extends Notifier<List<MerchantOrder>> {
  @override
  List<MerchantOrder> build() {
    refreshOrders();
    return [];
  }

  Future<void> refreshOrders() async {
    final profile = ref.read(merchantProfileProvider);
    final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';
    final orders = await ref.read(merchantApiProvider).getOrders(merchantId: merchantId);
    state = orders;
  }

  Future<bool> acceptOrder(String orderId, int prepMinutes) async {
    final ok = await ref.read(merchantApiProvider).acceptOrder(orderId, prepMinutes);
    if (ok) {
      state = state.map((o) {
        if (o.id == orderId) {
          o.status = 'PREPARING';
          o.prepTimeMinutes = prepMinutes;
        }
        return o;
      }).toList();
    }
    return ok;
  }

  Future<bool> markOrderReady(String orderId) async {
    final ok = await ref.read(merchantApiProvider).markOrderReady(orderId);
    if (ok) {
      state = state.map((o) {
        if (o.id == orderId) {
          o.status = 'READY_FOR_PICKUP';
        }
        return o;
      }).toList();
    }
    return ok;
  }

  Future<bool> rejectOrder(String orderId, {String? reason}) async {
    final ok = await ref.read(merchantApiProvider).rejectOrder(orderId, reason: reason);
    if (ok) {
      state = state.map((o) {
        if (o.id == orderId) {
          o.status = 'CANCELLED';
        }
        return o;
      }).toList();
    }
    return ok;
  }

  Future<bool> extendPrepTime(String orderId, int extraMinutes) async {
    final order = state.firstWhere((o) => o.id == orderId);
    final newMinutes = (order.prepTimeMinutes ?? 20) + extraMinutes;
    final ok = await ref.read(merchantApiProvider).acceptOrder(orderId, newMinutes);
    if (ok) {
      state = state.map((o) {
        if (o.id == orderId) {
          o.prepTimeMinutes = newMinutes;
        }
        return o;
      }).toList();
    }
    return ok;
  }
}

final merchantOrdersProvider =
    NotifierProvider<MerchantOrdersNotifier, List<MerchantOrder>>(() {
  return MerchantOrdersNotifier();
});

// ─── Meni ak Pwodwi ──────────────────────────────────────────
class MerchantProductsNotifier extends Notifier<List<MerchantProduct>> {
  @override
  List<MerchantProduct> build() {
    refreshProducts();
    return [];
  }

  Future<void> refreshProducts() async {
    final profile = ref.read(merchantProfileProvider);
    final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';
    final products = await ref.read(merchantApiProvider).getProducts(merchantId);
    state = products;
  }

  Future<bool> toggleAvailability(String productId) async {
    final prod = state.firstWhere((p) => p.id == productId);
    final newStatus = !prod.isAvailable;

    // Mete a jou nan Supabase
    final ok = await ref.read(merchantApiProvider).toggleProductAvailability(productId, newStatus);
    if (ok) {
      state = state.map((p) {
        if (p.id == productId) {
          p.isAvailable = newStatus;
        }
        return p;
      }).toList();
    }
    return ok;
  }

  Future<bool> updatePrice(String productId, double newPrice) async {
    final ok = await ref.read(merchantApiProvider).updateProductPrice(productId, newPrice);
    if (ok) {
      state = state.map((p) {
        if (p.id == productId) {
          p.price = newPrice;
        }
        return p;
      }).toList();
    }
    return ok;
  }

  Future<bool> addProduct({
    required String name,
    required String categoryId,
    required double price,
    String? description,
    String? imageUrl,
    int prepTimeMinutes = 15,
  }) async {
    final profile = ref.read(merchantProfileProvider);
    final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';

    final ok = await ref.read(merchantApiProvider).createProduct(
      merchantId: merchantId,
      name: name,
      categoryId: categoryId,
      price: price,
      description: description,
      imageUrl: imageUrl,
      prepTimeMinutes: prepTimeMinutes,
    );

    if (ok) {
      await refreshProducts();
    }
    return ok;
  }
}

final merchantProductsProvider =
    NotifierProvider<MerchantProductsNotifier, List<MerchantProduct>>(() {
  return MerchantProductsNotifier();
});

// ─── Kategori ────────────────────────────────────────────────
final merchantCategoriesProvider = FutureProvider<List<MerchantCategory>>((ref) async {
  final profile = ref.watch(merchantProfileProvider);
  final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';
  final businessType = profile?.type ?? 'RESTAURANT';
  return ref.read(merchantApiProvider).ensureCategoriesForMerchant(
    merchantId: merchantId,
    businessType: businessType,
  );
});

// ─── Finans & Vant ───────────────────────────────────────────
final merchantFinanceProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final profile = ref.watch(merchantProfileProvider);
  final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';
  return ref.read(merchantApiProvider).getFinanceStats(merchantId);
});
