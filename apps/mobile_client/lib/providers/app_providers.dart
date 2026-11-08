import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/delivery_theme_tokens.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/supabase_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─── Distance Helper ──────────────────────────────────────────
double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
  const double r = 6371.0;
  final double dLat = (lat2 - lat1) * (math.pi / 180.0);
  final double dLon = (lon2 - lon1) * (math.pi / 180.0);
  final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1 * (math.pi / 180.0)) *
          math.cos(lat2 * (math.pi / 180.0)) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);
  final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  final dist = r * c;
  return math.max(0.5, (dist * 10).round() / 10.0);
}

// ─── Services ─────────────────────────────────────────────────
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final supabaseServiceProvider = Provider<SupabaseService>((ref) => SupabaseService());

// ─── Multi-Merchant Cart (DoorDash Open Carts Architecture) ─────
class MerchantCart {
  final Merchant merchant;
  final List<CartItem> items;
  final double? customerLat;
  final double? customerLng;

  MerchantCart({
    required this.merchant,
    this.items = const [],
    this.customerLat,
    this.customerLng,
  });

  double get distanceKm {
    final cLat = customerLat ?? 19.7550;
    final cLng = customerLng ?? -72.2050;
    return calculateHaversineDistanceKm(merchant.latitude, merchant.longitude, cLat, cLng);
  }

  double get subtotal => items.fold(0, (sum, item) => sum + item.totalPrice);
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);
  int get totalQuantity => itemCount;

  /// Sipleman pou volim / gwo kantite kòmand (egz: 100 bwat katon)
  double get volumeSurcharge {
    final qty = itemCount;
    if (qty <= 4) return 0.0; // Ti kòmand estanda moto
    if (qty <= 10) return 50.0; // Sak plen
    if (qty <= 25) return 150.0; // Gwo sakado / kès
    if (qty <= 50) return 350.0; // Kòmand volimye espesyal
    if (qty <= 100) return 750.0; // 100 bwat katon / kago moto miltip
    return 750.0 + ((qty - 100) * 10.0);
  }

  /// Sipleman pwa selon kategori magazen an
  double get categorySurcharge {
    final cat = merchant.category.toUpperCase();
    if (cat == 'SUPERMARKET') return 30.0; // Sak diri, galon lwil, pake dlo
    if (cat == 'LOGISTICS' || cat == 'CARGO') return 100.0; // Materyo / pake lou
    return 0.0;
  }

  /// Frè livrezon distans de baz (jiska 2km = 150 HTG, +35 HTG/km apre sa)
  double get baseDistanceFee {
    final dist = distanceKm;
    final extraKm = math.max(0.0, dist - 2.0);
    final longDistKm = math.max(0.0, dist - 10.0);
    return 150.0 + (extraKm * 35.0) + (longDistKm * 15.0);
  }

  /// Total frè livrezon entèlijan
  double get deliveryFee {
    if (items.isEmpty) return 0.0;
    final total = baseDistanceFee + volumeSurcharge + categorySurcharge;
    return total.roundToDouble();
  }

  double get totalAmount => subtotal + deliveryFee;

  MerchantCart copyWith({
    Merchant? merchant,
    List<CartItem>? items,
    double? customerLat,
    double? customerLng,
  }) {
    return MerchantCart(
      merchant: merchant ?? this.merchant,
      items: items ?? this.items,
      customerLat: customerLat ?? this.customerLat,
      customerLng: customerLng ?? this.customerLng,
    );
  }
}

class CartState {
  final Map<String, MerchantCart> carts; // merchantId -> MerchantCart
  final String? activeMerchantId;
  final double? customerLat;
  final double? customerLng;

  CartState({
    this.carts = const {},
    this.activeMerchantId,
    this.customerLat,
    this.customerLng,
  });

  /// Tout panyen ki gen omwen yon atik ladan yo (Open Carts)
  List<MerchantCart> get openCarts =>
      carts.values.where((c) => c.items.isNotEmpty).toList();

  int get totalOpenCartsCount => openCarts.length;

  int get totalAllItemsCount =>
      openCarts.fold(0, (sum, c) => sum + c.itemCount);

  /// Panyen aktif la (sa ki seleksyone pou checkout kounye a)
  MerchantCart? get activeCart {
    if (activeMerchantId != null && carts.containsKey(activeMerchantId)) {
      return carts[activeMerchantId];
    }
    return openCarts.isNotEmpty ? openCarts.first : null;
  }

  // Getters konpatib ak ansyen kòd ekran yo:
  Merchant? get merchant => activeCart?.merchant;
  List<CartItem> get items => activeCart?.items ?? const [];
  double get distanceKm => activeCart?.distanceKm ?? 1.5;
  double get subtotal => activeCart?.subtotal ?? 0.0;
  double get deliveryFee => activeCart?.deliveryFee ?? 0.0;
  double get baseDistanceFee => activeCart?.baseDistanceFee ?? 150.0;
  double get volumeSurcharge => activeCart?.volumeSurcharge ?? 0.0;
  double get categorySurcharge => activeCart?.categorySurcharge ?? 0.0;
  double get totalAmount => activeCart?.totalAmount ?? 0.0;
  int get itemCount => activeCart?.itemCount ?? 0;
  int get totalQuantity => itemCount;

  MerchantCart? cartForMerchant(String merchantId) => carts[merchantId];

  CartState copyWith({
    Map<String, MerchantCart>? carts,
    String? activeMerchantId,
    double? customerLat,
    double? customerLng,
  }) {
    return CartState(
      carts: carts ?? this.carts,
      activeMerchantId: activeMerchantId ?? this.activeMerchantId,
      customerLat: customerLat ?? this.customerLat,
      customerLng: customerLng ?? this.customerLng,
    );
  }
}

class CartNotifier extends Notifier<CartState> {
  @override
  CartState build() => CartState();

  void updateCustomerLocation(double lat, double lng) {
    final updatedCarts = <String, MerchantCart>{};
    state.carts.forEach((k, v) {
      updatedCarts[k] = v.copyWith(customerLat: lat, customerLng: lng);
    });
    state = state.copyWith(
      customerLat: lat,
      customerLng: lng,
      carts: updatedCarts,
    );
  }

  void setActiveMerchant(String merchantId) {
    state = state.copyWith(activeMerchantId: merchantId);
  }

  void addItem(
    Merchant merchant,
    MenuItem item, {
    int quantity = 1,
    String? instructions,
    String? selectedSize,
    String? selectedColor,
    String? selectedPortionSize,
    List<String> selectedExtras = const [],
  }) {
    final currentCart = state.carts[merchant.id] ?? MerchantCart(
      merchant: merchant,
      customerLat: state.customerLat,
      customerLng: state.customerLng,
    );

    final idx = currentCart.items.indexWhere((e) =>
        e.item.id == item.id &&
        e.selectedSize == selectedSize &&
        e.selectedColor == selectedColor &&
        e.selectedPortionSize == selectedPortionSize);
    List<CartItem> newItems;
    if (idx >= 0) {
      newItems = List<CartItem>.from(currentCart.items);
      newItems[idx].quantity += quantity;
    } else {
      newItems = [
        ...currentCart.items,
        CartItem(
          item: item,
          quantity: quantity,
          instructions: instructions,
          selectedSize: selectedSize,
          selectedColor: selectedColor,
          selectedPortionSize: selectedPortionSize,
          selectedExtras: selectedExtras,
        ),
      ];
    }

    final newCart = currentCart.copyWith(merchant: merchant, items: newItems);
    final newMap = Map<String, MerchantCart>.from(state.carts);
    newMap[merchant.id] = newCart;

    state = state.copyWith(
      carts: newMap,
      activeMerchantId: merchant.id,
    );
  }

  void updateQuantity(String itemId, int delta, {String? merchantId}) {
    final mId = merchantId ?? state.activeMerchantId ?? (state.openCarts.isNotEmpty ? state.openCarts.first.merchant.id : null);
    if (mId == null || !state.carts.containsKey(mId)) return;

    final currentCart = state.carts[mId]!;
    final list = <CartItem>[];
    for (var ci in currentCart.items) {
      final newQty = ci.item.id == itemId ? ci.quantity + delta : ci.quantity;
      if (newQty > 0) {
        list.add(CartItem(
          item: ci.item,
          quantity: newQty,
          instructions: ci.instructions,
          selectedSize: ci.selectedSize,
          selectedColor: ci.selectedColor,
          selectedPortionSize: ci.selectedPortionSize,
          selectedExtras: ci.selectedExtras,
        ));
      } else if (ci.item.id != itemId) {
        list.add(ci);
      }
    }

    final newMap = Map<String, MerchantCart>.from(state.carts);
    if (list.isEmpty) {
      newMap.remove(mId);
    } else {
      newMap[mId] = currentCart.copyWith(items: list);
    }

    state = state.copyWith(
      carts: newMap,
      activeMerchantId: newMap.containsKey(mId)
          ? mId
          : (newMap.keys.isNotEmpty ? newMap.keys.first : null),
    );
  }

  void clearCart({String? merchantId}) {
    final mId = merchantId ?? state.activeMerchantId;
    if (mId != null) {
      final newMap = Map<String, MerchantCart>.from(state.carts);
      newMap.remove(mId);
      state = state.copyWith(
        carts: newMap,
        activeMerchantId: newMap.keys.isNotEmpty ? newMap.keys.first : null,
      );
    } else {
      state = CartState(customerLat: state.customerLat, customerLng: state.customerLng);
    }
  }

  void clearAll() {
    state = CartState(customerLat: state.customerLat, customerLng: state.customerLng);
  }

  void setCart(Merchant merchant, List<CartItem> items) {
    final newCart = MerchantCart(
      merchant: merchant,
      items: items,
      customerLat: state.customerLat,
      customerLng: state.customerLng,
    );
    final newMap = Map<String, MerchantCart>.from(state.carts);
    if (items.isEmpty) {
      newMap.remove(merchant.id);
    } else {
      newMap[merchant.id] = newCart;
    }
    state = state.copyWith(
      carts: newMap,
      activeMerchantId: merchant.id,
    );
  }
}

final cartProvider = NotifierProvider<CartNotifier, CartState>(CartNotifier.new);

// ─── Merchants → Supabase ──────────────────────────────────────
final merchantsProvider = FutureProvider.family<List<Merchant>, String?>((ref, category) async {
  return ref.watch(supabaseServiceProvider).getMerchants(type: category);
});

// ─── Orders → Supabase ────────────────────────────────────────
final ordersProvider = FutureProvider<List<Order>>((ref) async {
  return ref.watch(supabaseServiceProvider).getMyOrders();
});

// ─── Featured Products → Supabase ─────────────────────────────
final featuredProductsProvider = FutureProvider<List<MenuItem>>((ref) async {
  return ref.watch(supabaseServiceProvider).getProducts();
});

// ─── Merchant Products (by merchantId) → Supabase ─────────────
final merchantProductsProvider = FutureProvider.family<List<MenuItem>, String>((ref, merchantId) async {
  return ref.watch(supabaseServiceProvider).getProducts(merchantId: merchantId);
});

// ─── FEATURE 1: Favorites ──────────────────────────────────────
class FavoritesNotifier extends Notifier<List<Favorite>> {
  @override
  List<Favorite> build() {
    _loadFromStorage();
    return [];
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getStringList('saved_favorites') ?? [];
      final list = saved.map((s) => Favorite.fromJson(jsonDecode(s))).toList();
      state = list;
    } catch (_) {}
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = state.map((f) => jsonEncode(f.toJson())).toList();
      await prefs.setStringList('saved_favorites', list);
    } catch (_) {}
  }

  bool isFavorite(String merchantId) =>
      state.any((f) => f.merchantId == merchantId);

  void toggle(Merchant merchant) {
    if (isFavorite(merchant.id)) {
      state = state.where((f) => f.merchantId != merchant.id).toList();
    } else {
      state = [...state, Favorite.fromMerchant(merchant)];
    }
    _persist();
  }
}

final favoritesProvider = NotifierProvider<FavoritesNotifier, List<Favorite>>(
  FavoritesNotifier.new,
);

// ─── FEATURE 2: Driver Tip ─────────────────────────────────────
class TipNotifier extends Notifier<double> {
  @override
  double build() => 0.0;

  void setTip(double amount) => state = amount;
  void clearTip() => state = 0.0;
}

final tipProvider = NotifierProvider<TipNotifier, double>(TipNotifier.new);

// ─── FEATURE 3: Notification Center (Mesaj Reyèl & Efase) ──────
class NotificationsNotifier extends Notifier<List<AppNotification>> {
  @override
  List<AppNotification> build() {
    _loadRealNotifications();
    return [];
  }

  Future<void> _loadRealNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final deletedIds = (prefs.getStringList('deleted_notification_ids') ?? []).toSet();
      final readIds = (prefs.getStringList('read_notification_ids') ?? []).toSet();

      final List<AppNotification> realNotifs = [];

      // 1. Notifikasyon Byenvini pou itilizatè a
      final user = await SupabaseService().getCurrentUser();
      if (user != null) {
        final welcomeId = 'welcome_${user['id']}';
        if (!deletedIds.contains(welcomeId)) {
          final createdAt = DateTime.tryParse(user['createdAt'] ?? '') ??
              DateTime.now().subtract(const Duration(hours: 12));
          realNotifs.add(AppNotification(
            id: welcomeId,
            title: 'Byenvini sou Delivery Haïti! 🇭🇹',
            body: 'Bonswa ${user['firstName'] ?? "Kliyan"}, kont ou an pare pou kòmande nan pi bon magazen ak restoran yo!',
            type: 'SYSTEM',
            createdAt: createdAt,
            isRead: readIds.contains(welcomeId),
          ));
        }
      }

      // 2. Notifikasyon reyèl ki soti nan vrè kòmand itilizatè a
      final orders = await SupabaseService().getMyOrders();
      for (final o in orders) {
        final orderNotifId = 'notif_order_${o.id}_${o.status}';
        if (deletedIds.contains(orderNotifId)) continue;

        String title;
        String body;
        String type = 'ORDER_UPDATE';

        switch (o.status) {
          case 'CONFIRMED':
            title = 'Kòmand #${o.orderNumber} konfime!';
            body = 'Boutik ${o.merchantName ?? "la"} konfime kòmand ou an. Li pral kòmanse prepare.';
            break;
          case 'PREPARING':
            title = 'Preparasyon kòmand #${o.orderNumber}';
            body = '${o.merchantName ?? "Boutik la"} ap prepare kòmand ou an kounye a.';
            break;
          case 'IN_DELIVERY':
          case 'OUT_FOR_DELIVERY':
            title = 'Livrè a sou wout pou livre!';
            body = '${o.driverName != null ? "${o.driverName} ap" : "Livrè a ap"} livre kòmand #${o.orderNumber} ou an nan ${o.deliveryAddress ?? "adrès ou"}.';
            break;
          case 'DELIVERED':
            title = 'Kòmand #${o.orderNumber} livre! 🎉';
            body = 'Kòmand ou soti ${o.merchantName ?? "nan magazen an"} (${o.totalAmount.toStringAsFixed(0)} Gdes) livre avèk siksè.';
            break;
          case 'CANCELLED':
            title = 'Kòmand #${o.orderNumber} anile';
            body = 'Kòmand sa a te anile.';
            break;
          default:
            title = 'Kòmand #${o.orderNumber}';
            body = 'Kòmand ou an anrejistre pou ${o.merchantName ?? "boutik la"}.';
            break;
        }

        realNotifs.add(AppNotification(
          id: orderNotifId,
          title: title,
          body: body,
          type: type,
          orderId: o.id,
          createdAt: o.createdAt,
          isRead: readIds.contains(orderNotifId),
        ));
      }

      // Triye pa dat ki pi resan an premye
      realNotifs.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      state = realNotifs;
    } catch (e) {
      print('Error loading real notifications: $e');
    }
  }

  int get unreadCount => state.where((n) => !n.isRead).length;

  Future<void> markAllRead() async {
    final prefs = await SharedPreferences.getInstance();
    final readIds = (prefs.getStringList('read_notification_ids') ?? []).toSet();
    for (final n in state) {
      readIds.add(n.id);
    }
    await prefs.setStringList('read_notification_ids', readIds.toList());

    state = state.map((n) => AppNotification(
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      createdAt: n.createdAt,
      orderId: n.orderId,
      isRead: true,
    )).toList();
  }

  Future<void> markRead(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final readIds = (prefs.getStringList('read_notification_ids') ?? []).toSet();
    readIds.add(id);
    await prefs.setStringList('read_notification_ids', readIds.toList());

    state = state.map((n) => n.id == id
        ? AppNotification(
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type,
            createdAt: n.createdAt,
            orderId: n.orderId,
            isRead: true,
          )
        : n).toList();
  }

  void addNotification(AppNotification notif) {
    state = [notif, ...state];
  }

  Future<void> dismiss(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final deletedIds = (prefs.getStringList('deleted_notification_ids') ?? []).toSet();
    deletedIds.add(id);
    await prefs.setStringList('deleted_notification_ids', deletedIds.toList());

    state = state.where((n) => n.id != id).toList();
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    final deletedIds = (prefs.getStringList('deleted_notification_ids') ?? []).toSet();
    for (final n in state) {
      deletedIds.add(n.id);
    }
    await prefs.setStringList('deleted_notification_ids', deletedIds.toList());

    state = [];
  }

  Future<void> refresh() async {
    await _loadRealNotifications();
  }
}

final notificationsProvider = NotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

final unreadCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).where((n) => !n.isRead).length;
});

// ─── FEATURE 4: Loyalty / Points ──────────────────────────────
class LoyaltyNotifier extends Notifier<LoyaltyInfo> {
  @override
  LoyaltyInfo build() {
    _loadFromStorage();
    return LoyaltyInfo(
      totalPoints: 120,
      rewardThreshold: 500,
      transactions: [],
    );
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('user_loyalty_info');
      if (saved != null) {
        state = LoyaltyInfo.fromJson(jsonDecode(saved));
      }
    } catch (_) {}
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_loyalty_info', jsonEncode(state.toJson()));
    } catch (_) {}
  }

  /// Called after a successful order: 1 point per 10 HTG
  void addPointsForOrder(String orderId, double amount) {
    final earned = (amount / 10).floor();
    if (earned <= 0) return;

    final newTx = LoyaltyTransaction(
      orderId: orderId,
      pointsEarned: earned,
      orderAmount: amount,
      date: DateTime.now(),
    );
    final newTotal = state.totalPoints + earned;
    state = LoyaltyInfo(
      totalPoints: newTotal,
      rewardThreshold: state.rewardThreshold,
      transactions: [newTx, ...state.transactions],
    );
    _persist();
  }
}

final loyaltyProvider = NotifierProvider<LoyaltyNotifier, LoyaltyInfo>(LoyaltyNotifier.new);

// ─── FEATURE 5: Delivery Location ─────────────────────────────
class LocationNotifier extends Notifier<DeliveryLocation> {
  @override
  DeliveryLocation build() => DeliveryLocation(
    address: 'Boulevard du Cap (Bòdmè), Cap-Haïtien',
  );

  void updateLocation(DeliveryLocation loc) => state = loc;
}

final deliveryLocationProvider = NotifierProvider<LocationNotifier, DeliveryLocation>(
  LocationNotifier.new,
);

// ─── FEATURE 6: Sort & Filter ─────────────────────────────────
class FilterNotifier extends Notifier<FilterState> {
  @override
  FilterState build() => const FilterState();

  void updateSort(SortOption option) => state = state.copyWith(sortBy: option);
  void toggleOpenOnly() => state = state.copyWith(openOnly: !state.openOnly);
  void toggleFreeDelivery() => state = state.copyWith(freeDelivery: !state.freeDelivery);
  void setMaxFee(double fee) => state = state.copyWith(maxDeliveryFee: fee);
  void reset() => state = const FilterState();
}

final filterProvider = NotifierProvider<FilterNotifier, FilterState>(FilterNotifier.new);

/// Applies sort & filter to a merchant list
List<Merchant> applyFilter(List<Merchant> merchants, FilterState filter) {
  var list = List<Merchant>.from(merchants);

  if (filter.openOnly) {
    list = list.where((m) => m.isActive).toList();
  }

  if (filter.freeDelivery) {
    list = list.where((m) => m.deliveryFee <= 0).toList();
  }

  if (filter.maxDeliveryFee > 0 && filter.maxDeliveryFee < 500) {
    list = list.where((m) => m.deliveryFee <= filter.maxDeliveryFee).toList();
  }

  switch (filter.sortBy) {
    case SortOption.fastest:
      list.sort((a, b) => a.avgPrepTimeMinutes.compareTo(b.avgPrepTimeMinutes));
      break;
    case SortOption.highestRated:
      list.sort((a, b) => b.rating.compareTo(a.rating));
      break;
    case SortOption.priceAsc:
      list.sort((a, b) => a.deliveryFee.compareTo(b.deliveryFee));
      break;
    case SortOption.priceDesc:
      list.sort((a, b) => b.deliveryFee.compareTo(a.deliveryFee));
      break;
    case SortOption.recommended:
    default:
      // Keep original order (server-side ranking)
      break;
  }

  return list;
}

// ─── FEATURE 7: Dynamic Service Theme ─────────────────────────
class ServiceCategoryNotifier extends Notifier<DeliveryServiceCategory> {
  @override
  DeliveryServiceCategory build() => DeliveryServiceCategory.food;

  void selectCategory(DeliveryServiceCategory cat) => state = cat;
}

final serviceThemeCategoryProvider =
    NotifierProvider<ServiceCategoryNotifier, DeliveryServiceCategory>(
  ServiceCategoryNotifier.new,
);
