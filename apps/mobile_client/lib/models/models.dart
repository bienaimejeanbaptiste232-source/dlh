class User {
  final String id;
  final String firstName;
  final String lastName;
  final String phone;
  final String role;
  final String? email;
  final String? avatarUrl;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.role,
    this.email,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phone: json['phoneNumber'] ?? json['phone'] ?? '',
      role: json['role'] ?? 'CUSTOMER',
      email: json['email'],
      avatarUrl: json['avatarUrl'],
    );
  }
}

class Merchant {
  final String id;
  final String name;
  final String category;
  final String phone;
  final String address;
  final double rating;
  final bool isActive;
  final bool isVerified;
  final String? logoUrl;
  final String? bannerUrl;
  final String? image; // alias for logoUrl
  final double commissionRate;
  final int avgPrepTimeMinutes;
  final String? zoneName;
  final double latitude;
  final double longitude;
  final List<MenuItem> menuItems;
  final double deliveryFee;

  Merchant({
    required this.id,
    required this.name,
    required this.category,
    required this.phone,
    required this.address,
    required this.rating,
    required this.isActive,
    this.isVerified = true,
    this.logoUrl,
    this.bannerUrl,
    this.image,
    this.commissionRate = 15.0,
    this.avgPrepTimeMinutes = 25,
    this.zoneName,
    this.latitude = 19.7594,
    this.longitude = -72.2008,
    this.menuItems = const [],
    this.deliveryFee = 0.0,
  });

  factory Merchant.fromJson(Map<String, dynamic> json) {
    var itemsList = json['menuItems'] as List? ??
        json['products'] as List? ?? [];
    return Merchant(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['type'] ?? json['category'] ?? 'RESTAURANT',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      isActive: json['isOpen'] ?? json['isActive'] ?? true,
      isVerified: json['isVerified'] ?? true,
      logoUrl: json['logoUrl'],
      bannerUrl: json['bannerUrl'],
      image: json['logoUrl'] ?? json['image'],
      commissionRate: (json['commissionRate'] as num?)?.toDouble() ?? 15.0,
      avgPrepTimeMinutes: json['avgPrepTimeMinutes'] ?? 25,
      zoneName: json['zone']?['name'],
      latitude: (json['latitude'] as num?)?.toDouble() ?? 19.7594,
      longitude: (json['longitude'] as num?)?.toDouble() ?? -72.2008,
      menuItems: itemsList.map((e) => MenuItem.fromJson(e)).toList(),
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class MenuItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final bool isAvailable;
  final String? image;
  final String? merchantId;

  MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.isAvailable,
    this.image,
    this.merchantId,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      category: json['category']?['name'] ?? json['category'] ?? 'Plats',
      isAvailable: json['isAvailable'] ?? true,
      image: json['imageUrl'] ?? json['image'],
      merchantId: json['merchantId'],
    );
  }
}

class CartItem {
  final MenuItem item;
  int quantity;
  String? instructions;
  final String? selectedSize;
  final String? selectedColor;
  final String? selectedPortionSize;
  final List<String> selectedExtras;

  CartItem({
    required this.item,
    this.quantity = 1,
    this.instructions,
    this.selectedSize,
    this.selectedColor,
    this.selectedPortionSize,
    this.selectedExtras = const [],
  });

  double get totalPrice => item.price * quantity;

  CartItem copyWith({
    MenuItem? item,
    int? quantity,
    String? instructions,
    String? selectedSize,
    String? selectedColor,
    String? selectedPortionSize,
    List<String>? selectedExtras,
  }) {
    return CartItem(
      item: item ?? this.item,
      quantity: quantity ?? this.quantity,
      instructions: instructions ?? this.instructions,
      selectedSize: selectedSize ?? this.selectedSize,
      selectedColor: selectedColor ?? this.selectedColor,
      selectedPortionSize: selectedPortionSize ?? this.selectedPortionSize,
      selectedExtras: selectedExtras ?? this.selectedExtras,
    );
  }
}

class OrderItemModel {
  final String id;
  final String name;
  final double unitPrice;
  final int quantity;
  final double totalPrice;
  final String? notes;

  OrderItemModel({
    required this.id,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    required this.totalPrice,
    this.notes,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final qty = (json['quantity'] as num?)?.toInt() ?? 1;
    final up = (json['unitPrice'] as num?)?.toDouble() ??
        (json['price'] as num?)?.toDouble() ??
        0.0;
    final tot = (json['totalPrice'] as num?)?.toDouble() ??
        (json['totalItemPrice'] as num?)?.toDouble() ??
        (qty * up);
    return OrderItemModel(
      id: json['id']?.toString() ?? '',
      name: json['productName']?.toString() ?? json['name']?.toString() ?? 'Atik',
      unitPrice: up,
      quantity: qty,
      totalPrice: tot,
      notes: json['notes']?.toString(),
    );
  }
}

class Order {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentMethod;
  final String paymentStatus;
  final double totalAmount;
  final double deliveryFee;
  final double subtotal;
  final DateTime createdAt;
  final String? driverName;
  final String? driverPhone;
  final String? driverPlate;
  final double? driverLat;
  final double? driverLng;
  final String? merchantName;
  final String? merchantPhone;
  final String? merchantAddress;
  final String? deliveryAddress;
  final String? merchantCategory;
  final String? merchantLogoUrl;
  final List<OrderItemModel> items;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.totalAmount,
    required this.deliveryFee,
    this.subtotal = 0,
    required this.createdAt,
    this.driverName,
    this.driverPhone,
    this.driverPlate,
    this.driverLat,
    this.driverLng,
    this.merchantName,
    this.merchantPhone,
    this.merchantAddress,
    this.deliveryAddress,
    this.merchantCategory,
    this.merchantLogoUrl,
    this.items = const [],
  });

  // Parse from NestJS backend response
  factory Order.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] ?? json['orderItems'] ?? json['order_items'];
    final parsedItems = rawItems is List
        ? rawItems.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>)).toList()
        : <OrderItemModel>[];

    return Order(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      status: json['status'] ?? 'PENDING',
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ??
          (json['total'] as num?)?.toDouble() ??
          double.tryParse(json['totalAmount']?.toString() ?? '') ??
          double.tryParse(json['total']?.toString() ?? '') ??
          0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ??
          double.tryParse(json['deliveryFee']?.toString() ?? '') ??
          0.0,
      subtotal: (json['subtotalAmount'] as num?)?.toDouble() ??
          (json['subtotal'] as num?)?.toDouble() ??
          double.tryParse(json['subtotalAmount']?.toString() ?? '') ??
          double.tryParse(json['subtotal']?.toString() ?? '') ??
          0.0,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      driverName: json['driver'] != null
          ? '${json['driver']['firstName'] ?? ''} ${json['driver']['lastName'] ?? ''}'.trim()
          : null,
      driverPhone: json['driver']?['phoneNumber'] ?? json['driver']?['phone'],
      merchantName: json['merchant']?['name'],
      merchantPhone: json['merchant']?['phone'],
      merchantAddress: json['merchant']?['address'],
      deliveryAddress: json['deliveryAddress']?.toString(),
      merchantCategory: json['merchant']?['category'] ?? json['merchant']?['type'],
      merchantLogoUrl: json['merchant']?['logoUrl'],
      items: parsedItems,
    );
  }

  // Parse from Supabase REST response (with joins)
  factory Order.fromSupabase(Map<String, dynamic> json) {
    final driver = json['driver'];
    final driverUser = driver?['user'];
    final rawItems = json['order_items'] ?? json['items'];
    final parsedItems = rawItems is List
        ? rawItems.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>)).toList()
        : <OrderItemModel>[];

    return Order(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      status: json['status'] ?? 'PENDING',
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      totalAmount: (json['total'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      driverName: driverUser != null
          ? '${driverUser['firstName'] ?? ''} ${driverUser['lastName'] ?? ''}'.trim()
          : null,
      driverPhone: driverUser?['phoneNumber'],
      driverPlate: driver?['vehiclePlate'],
      driverLat: (driver?['currentLatitude'] as num?)?.toDouble(),
      driverLng: (driver?['currentLongitude'] as num?)?.toDouble(),
      merchantName: json['merchant']?['name'],
      merchantPhone: json['merchant']?['phone'],
      merchantAddress: json['merchant']?['address'],
      deliveryAddress: json['deliveryAddress']?.toString(),
      merchantCategory: json['merchant']?['category'] ?? json['merchant']?['type'],
      merchantLogoUrl: json['merchant']?['logoUrl'],
      items: parsedItems,
    );
  }

  Order copyWith({
    String? id,
    String? orderNumber,
    String? status,
    String? paymentMethod,
    String? paymentStatus,
    double? totalAmount,
    double? deliveryFee,
    double? subtotal,
    DateTime? createdAt,
    String? driverName,
    String? driverPhone,
    String? driverPlate,
    double? driverLat,
    double? driverLng,
    String? merchantName,
    String? merchantPhone,
    String? merchantAddress,
    String? deliveryAddress,
    String? merchantCategory,
    String? merchantLogoUrl,
    List<OrderItemModel>? items,
  }) {
    return Order(
      id: id ?? this.id,
      orderNumber: orderNumber ?? this.orderNumber,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      totalAmount: totalAmount ?? this.totalAmount,
      deliveryFee: deliveryFee ?? this.deliveryFee,
      subtotal: subtotal ?? this.subtotal,
      createdAt: createdAt ?? this.createdAt,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      driverPlate: driverPlate ?? this.driverPlate,
      driverLat: driverLat ?? this.driverLat,
      driverLng: driverLng ?? this.driverLng,
      merchantName: merchantName ?? this.merchantName,
      merchantPhone: merchantPhone ?? this.merchantPhone,
      merchantAddress: merchantAddress ?? this.merchantAddress,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      merchantCategory: merchantCategory ?? this.merchantCategory,
      merchantLogoUrl: merchantLogoUrl ?? this.merchantLogoUrl,
      items: items ?? this.items,
    );
  }

  bool get isActive => !['DELIVERED', 'CANCELLED', 'REFUNDED'].contains(status);

  String get statusLabel {
    const labels = {
      'PENDING': 'En attente',
      'PAYMENT_PENDING': 'Paiement en cours',
      'CONFIRMED': 'Confirmée',
      'RESTAURANT_ACCEPTED': 'Acceptée par le restaurant',
      'PREPARING': 'En préparation',
      'READY_FOR_PICKUP': 'Prête pour collecte',
      'DRIVER_ASSIGNED': 'Livreur assigné',
      'DRIVER_ARRIVING': 'Livreur en route',
      'PICKED_UP': 'Colis récupéré',
      'IN_TRANSIT': 'En cours de livraison',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'REFUNDED': 'Remboursée',
    };
    return labels[status] ?? status;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderNumber': orderNumber,
      'status': status,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'total': totalAmount,
      'deliveryFee': deliveryFee,
      'subtotal': subtotal,
      'createdAt': createdAt.toIso8601String(),
      'driver': driverName != null
          ? {
              'user': {
                'firstName': driverName,
                'phoneNumber': driverPhone,
              },
              'vehiclePlate': driverPlate,
              'currentLatitude': driverLat,
              'currentLongitude': driverLng,
            }
          : null,
      'merchant': {
        'name': merchantName,
        'phone': merchantPhone,
        'address': merchantAddress,
        'category': merchantCategory,
        'logoUrl': merchantLogoUrl,
      },
      'deliveryAddress': deliveryAddress,
    };
  }
}

// --- Favorite Model ---------------------------------------------
class Favorite {
  final String merchantId;
  final String merchantName;
  final String merchantCategory;
  final String? merchantLogoUrl;
  final double merchantRating;

  Favorite({
    required this.merchantId,
    required this.merchantName,
    required this.merchantCategory,
    this.merchantLogoUrl,
    this.merchantRating = 5.0,
  });

  factory Favorite.fromMerchant(Merchant m) => Favorite(
        merchantId: m.id,
        merchantName: m.name,
        merchantCategory: m.category,
        merchantLogoUrl: m.logoUrl ?? m.image,
        merchantRating: m.rating,
      );

  Map<String, dynamic> toJson() => {
        'merchantId': merchantId,
        'merchantName': merchantName,
        'merchantCategory': merchantCategory,
        'merchantLogoUrl': merchantLogoUrl,
        'merchantRating': merchantRating,
      };

  factory Favorite.fromJson(Map<String, dynamic> json) => Favorite(
        merchantId: json['merchantId'] ?? '',
        merchantName: json['merchantName'] ?? '',
        merchantCategory: json['merchantCategory'] ?? '',
        merchantLogoUrl: json['merchantLogoUrl'],
        merchantRating: (json['merchantRating'] as num?)?.toDouble() ?? 5.0,
      );
}

// --- AppNotification Model ---------------------------------------
class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type; // ORDER_UPDATE | PROMO | LOYALTY | SYSTEM
  final DateTime createdAt;
  final String? orderId;
  bool isRead;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.orderId,
    this.isRead = false,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'title': title,
    'body': body,
    'type': type,
    'createdAt': createdAt.toIso8601String(),
    'orderId': orderId,
    'isRead': isRead,
  };

  factory AppNotification.fromMap(Map<String, dynamic> map) => AppNotification(
    id: map['id'] ?? '',
    title: map['title'] ?? '',
    body: map['body'] ?? '',
    type: map['type'] ?? 'SYSTEM',
    createdAt: map['createdAt'] != null
        ? DateTime.tryParse(map['createdAt']) ?? DateTime.now()
        : DateTime.now(),
    orderId: map['orderId'],
    isRead: map['isRead'] == true,
  );
}

// --- LoyaltyInfo Model ------------------------------------------
class LoyaltyInfo {
  final int totalPoints;
  final int rewardThreshold;
  final List<LoyaltyTransaction> transactions;

  LoyaltyInfo({
    this.totalPoints = 0,
    this.rewardThreshold = 500,
    this.transactions = const [],
  });

  double get progress => (totalPoints % rewardThreshold) / rewardThreshold;
  int get rewardsEarned => totalPoints ~/ rewardThreshold;
  int get pointsToNextReward => rewardThreshold - (totalPoints % rewardThreshold);

  Map<String, dynamic> toJson() => {
    'totalPoints': totalPoints,
    'rewardThreshold': rewardThreshold,
    'transactions': transactions.map((t) => t.toJson()).toList(),
  };

  factory LoyaltyInfo.fromJson(Map<String, dynamic> json) => LoyaltyInfo(
    totalPoints: json['totalPoints'] ?? 0,
    rewardThreshold: json['rewardThreshold'] ?? 500,
    transactions: (json['transactions'] as List?)
        ?.map((t) => LoyaltyTransaction.fromJson(Map<String, dynamic>.from(t)))
        .toList() ?? [],
  );
}

class LoyaltyTransaction {
  final String orderId;
  final int pointsEarned;
  final double orderAmount;
  final DateTime date;

  LoyaltyTransaction({
    required this.orderId,
    required this.pointsEarned,
    required this.orderAmount,
    required this.date,
  });

  Map<String, dynamic> toJson() => {
    'orderId': orderId,
    'pointsEarned': pointsEarned,
    'orderAmount': orderAmount,
    'date': date.toIso8601String(),
  };

  factory LoyaltyTransaction.fromJson(Map<String, dynamic> json) => LoyaltyTransaction(
    orderId: json['orderId'] ?? '',
    pointsEarned: json['pointsEarned'] ?? 0,
    orderAmount: (json['orderAmount'] as num?)?.toDouble() ?? 0.0,
    date: json['date'] != null ? DateTime.tryParse(json['date']) ?? DateTime.now() : DateTime.now(),
  );
}

// --- DeliveryLocation Model -------------------------------------
class DeliveryLocation {
  final String address;
  final String? landmark;
  final String? instructions;
  final double? latitude;
  final double? longitude;

  DeliveryLocation({
    required this.address,
    this.landmark,
    this.instructions,
    this.latitude,
    this.longitude,
  });

  String get displayAddress =>
      landmark != null && landmark!.isNotEmpty ? '$address (pres de $landmark)' : address;
}

// --- FilterState Model -------------------------------------------
enum SortOption { recommended, fastest, highestRated, priceAsc, priceDesc }

class FilterState {
  final SortOption sortBy;
  final bool openOnly;
  final bool freeDelivery;
  final double maxDeliveryFee;

  const FilterState({
    this.sortBy = SortOption.recommended,
    this.openOnly = false,
    this.freeDelivery = false,
    this.maxDeliveryFee = 500,
  });

  FilterState copyWith({
    SortOption? sortBy,
    bool? openOnly,
    bool? freeDelivery,
    double? maxDeliveryFee,
  }) {
    return FilterState(
      sortBy: sortBy ?? this.sortBy,
      openOnly: openOnly ?? this.openOnly,
      freeDelivery: freeDelivery ?? this.freeDelivery,
      maxDeliveryFee: maxDeliveryFee ?? this.maxDeliveryFee,
    );
  }
}
