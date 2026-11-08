class MerchantProfile {
  final String id;
  final String ownerId;
  final String name;
  final String type;
  final String address;
  final String phone;
  final double latitude;
  final double longitude;
  final String? logoUrl;
  final String? bannerUrl;
  final double commissionRate;
  final int avgPrepTimeMinutes;
  bool isOpen;
  final bool isVerified;
  final String? zoneName;

  MerchantProfile({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.type,
    required this.address,
    required this.phone,
    required this.latitude,
    required this.longitude,
    this.logoUrl,
    this.bannerUrl,
    this.commissionRate = 15.0,
    this.avgPrepTimeMinutes = 20,
    this.isOpen = true,
    this.isVerified = true,
    this.zoneName,
  });

  factory MerchantProfile.fromJson(Map<String, dynamic> json) {
    return MerchantProfile(
      id: json['id'] ?? '',
      ownerId: json['ownerId'] ?? '',
      name: json['name'] ?? 'Restoran Mwen',
      type: json['type'] ?? 'RESTAURANT',
      address: json['address'] ?? 'Pétion-Ville, Haïti',
      phone: json['phone'] ?? '+50937000003',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 18.512,
      longitude: (json['longitude'] as num?)?.toDouble() ?? -72.286,
      logoUrl: json['logoUrl'],
      bannerUrl: json['bannerUrl'],
      commissionRate: (json['commissionRate'] as num?)?.toDouble() ?? 15.0,
      avgPrepTimeMinutes: (json['avgPrepTimeMinutes'] as num?)?.toInt() ?? 20,
      isOpen: json['isOpen'] == true,
      isVerified: json['isVerified'] == true,
      zoneName: json['zone']?['name'] ?? 'Pétion-Ville',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'ownerId': ownerId,
    'name': name,
    'type': type,
    'address': address,
    'phone': phone,
    'latitude': latitude,
    'longitude': longitude,
    'logoUrl': logoUrl,
    'bannerUrl': bannerUrl,
    'commissionRate': commissionRate,
    'avgPrepTimeMinutes': avgPrepTimeMinutes,
    'isOpen': isOpen,
    'isVerified': isVerified,
    'zone': {'name': zoneName},
  };
}

class MerchantOrder {
  final String id;
  final String orderNumber;
  final String customerName;
  final String customerPhone;
  final List<MerchantOrderItem> items;
  final double totalAmount;
  final double subtotal;
  final double deliveryFee;
  final String paymentMethod;
  String status;
  final DateTime createdAt;
  int? prepTimeMinutes;
  final String? deliveryAddress;
  final String? driverId;
  final String? driverName;
  final String? driverPhone;

  MerchantOrder({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.customerPhone,
    required this.items,
    required this.totalAmount,
    this.subtotal = 0.0,
    this.deliveryFee = 0.0,
    required this.paymentMethod,
    required this.status,
    required this.createdAt,
    this.prepTimeMinutes,
    this.deliveryAddress,
    this.driverId,
    this.driverName,
    this.driverPhone,
  });

  // Parse depuis Supabase REST (avec jointures)
  factory MerchantOrder.fromSupabase(Map<String, dynamic> json) {
    final customer = json['customer'];
    final driver = json['driver'];
    final driverUser = driver?['user'];

    final orderItems = (json['order_items'] as List? ?? [])
        .map((i) => MerchantOrderItem(
              name: i['productName'] ?? i['name'] ?? 'Manje',
              quantity: (i['quantity'] as num?)?.toInt() ?? 1,
              price: (i['unitPrice'] ?? i['price'] as num?)?.toDouble() ?? 0,
              instructions: i['instructions'],
            ))
        .toList();

    String dName = '';
    String dPhone = '';
    if (driverUser != null) {
      dName = '${driverUser['firstName'] ?? ''} ${driverUser['lastName'] ?? ''}'.trim();
      dPhone = driverUser['phoneNumber'] ?? '';
    }

    return MerchantOrder(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      customerName: customer != null
          ? '${customer['firstName'] ?? ''} ${customer['lastName'] ?? ''}'.trim()
          : 'Kliyan',
      customerPhone: customer?['phoneNumber'] ?? '',
      items: orderItems,
      totalAmount: (json['total'] as num?)?.toDouble() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? ((json['total'] as num?)?.toDouble() ?? 0),
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      prepTimeMinutes: (json['prepTimeMinutes'] as num?)?.toInt(),
      deliveryAddress: json['deliveryAddress']?.toString(),
      driverId: json['driverId']?.toString(),
      driverName: dName.isNotEmpty ? dName : null,
      driverPhone: dPhone.isNotEmpty ? dPhone : null,
    );
  }

  String get statusLabel {
    const labels = {
      'PENDING': 'Nouvo Kòmand ⚡',
      'PAYMENT_PENDING': 'Peman ap trete...',
      'CONFIRMED': 'Konfime ✓',
      'RESTAURANT_ACCEPTED': 'Aksepte ✓',
      'PREPARING': 'K ap Prepare ⏱️',
      'READY_FOR_PICKUP': 'Pare pou Chofè 📦',
      'DRIVER_ASSIGNED': 'Chofè Asiyen 🛵',
      'DRIVER_ARRIVING': 'Chofè ap Vini 🛵',
      'PICKED_UP': 'Chofè Pran Li 📦',
      'IN_TRANSIT': 'Sou Wout Kliyan 🚀',
      'DELIVERED': 'Livre avèk Siksè ✓',
      'CANCELLED': 'Anile ❌',
    };
    return labels[status] ?? status;
  }
}

class MerchantOrderItem {
  final String name;
  final int quantity;
  final double price;
  final String? instructions;

  MerchantOrderItem({
    required this.name,
    required this.quantity,
    required this.price,
    this.instructions,
  });
}

class MerchantCategory {
  final String id;
  final String merchantId;
  final String name;
  final int displayOrder;
  final bool isActive;

  MerchantCategory({
    required this.id,
    required this.merchantId,
    required this.name,
    this.displayOrder = 0,
    this.isActive = true,
  });

  factory MerchantCategory.fromJson(Map<String, dynamic> json) => MerchantCategory(
    id: json['id'] ?? '',
    merchantId: json['merchantId'] ?? '',
    name: json['name'] ?? '',
    displayOrder: json['displayOrder'] ?? 0,
    isActive: json['isActive'] ?? true,
  );
}

class MerchantProduct {
  final String id;
  final String merchantId;
  final String? categoryId;
  final String category;
  final String name;
  final String? description;
  double price;
  final String currency;
  bool isAvailable;
  final int prepTimeMinutes;
  final String? imageUrl;

  MerchantProduct({
    required this.id,
    this.merchantId = '',
    this.categoryId,
    required this.name,
    required this.category,
    this.description,
    required this.price,
    this.currency = 'HTG',
    required this.isAvailable,
    this.prepTimeMinutes = 15,
    this.imageUrl,
  });

  factory MerchantProduct.fromJson(Map<String, dynamic> json) {
    return MerchantProduct(
      id: json['id'] ?? '',
      merchantId: json['merchantId'] ?? '',
      categoryId: json['categoryId'],
      name: json['name'] ?? '',
      category: json['category']?['name'] ?? 'Spécialités',
      description: json['description'],
      price: (json['price'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] ?? 'HTG',
      isAvailable: json['isAvailable'] == true,
      prepTimeMinutes: (json['prepTimeMinutes'] as num?)?.toInt() ?? 15,
      imageUrl: json['imageUrl'],
    );
  }
}
