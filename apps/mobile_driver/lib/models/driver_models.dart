import 'package:latlong2/latlong.dart';

class MissionItem {
  final String id;
  final String name;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? instructions;

  MissionItem({
    required this.id,
    required this.name,
    this.quantity = 1,
    this.unitPrice = 0.0,
    this.totalPrice = 0.0,
    this.instructions,
  });

  factory MissionItem.fromJson(Map<String, dynamic> json) {
    final qty = (json['quantity'] as num?)?.toInt() ?? 1;
    final uPrice = (json['unitPrice'] as num?)?.toDouble() ?? 0.0;
    final tPrice = (json['totalPrice'] as num?)?.toDouble() ?? (uPrice * qty);

    return MissionItem(
      id: json['id']?.toString() ?? '',
      name: json['productName'] ?? json['name'] ?? json['product']?['name'] ?? 'Atik',
      quantity: qty,
      unitPrice: uPrice,
      totalPrice: tPrice,
      instructions: json['notes']?.toString() ?? json['instructions']?.toString(),
    );
  }
}

class Mission {
  final String orderId;
  final String orderNumber;
  final String merchantName;
  final String merchantAddress;
  final String merchantType;
  final double pickupLatitude;
  final double pickupLongitude;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final double dropoffLatitude;
  final double dropoffLongitude;
  final String? customerNote;
  final String? customerLandmark;
  final double deliveryFee; // Ce que gagne le livreur en HTG
  final double totalOrderAmount;
  final String paymentMethod;
  final String status; // DRIVER_ASSIGNED, PICKED_UP, DELIVERED
  final double distanceKm;
  final int dispatchTimeout; // Segonn pou chofè a reponn avant redistribisyon
  final String itemsDescription;
  final List<MissionItem> items;
  final double tipAmount;
  final String category; // FOOD, LOGISTICS, GROCERY

  Mission({
    required this.orderId,
    required this.orderNumber,
    required this.merchantName,
    required this.merchantAddress,
    this.merchantType = 'RESTAURANT',
    this.pickupLatitude = 19.7625,
    this.pickupLongitude = -72.1985,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    this.dropoffLatitude = 19.7594,
    this.dropoffLongitude = -72.2008,
    this.customerNote,
    this.customerLandmark,
    required this.deliveryFee,
    required this.totalOrderAmount,
    required this.paymentMethod,
    required this.status,
    this.distanceKm = 3.5,
    this.dispatchTimeout = 25,
    this.itemsDescription = 'Kòmand Atik',
    this.items = const [],
    this.tipAmount = 50.0,
    this.category = 'FOOD',
  });

  LatLng get pickupLocation => LatLng(pickupLatitude, pickupLongitude);
  LatLng get dropoffLocation => LatLng(dropoffLatitude, dropoffLongitude);

  double get totalDriverEarnings => deliveryFee + tipAmount;
  bool get isCashOnDelivery => paymentMethod == 'CASH_ON_DELIVERY';
  bool get isPickedUp => status == 'PICKED_UP';
  bool get isAssigned => status == 'DRIVER_ASSIGNED';

  static List<MissionItem> _parseItems(dynamic rawItems) {
    final List<MissionItem> result = [];
    if (rawItems is List) {
      for (final it in rawItems) {
        if (it is Map) {
          result.add(MissionItem.fromJson(Map<String, dynamic>.from(it)));
        }
      }
    }
    return result;
  }

  factory Mission.fromJson(Map<String, dynamic> json) {
    final merchant = json['merchant'];
    final customer = json['customer'];
    final delivAddr = json['deliveryAddress'];

    final pLat = (json['pickupLatitude'] ?? merchant?['latitude'] as num?)?.toDouble() ?? 19.7625;
    final pLng = (json['pickupLongitude'] ?? merchant?['longitude'] as num?)?.toDouble() ?? -72.1985;
    final dLat = (json['dropoffLatitude'] ?? json['customerLatitude'] ?? (delivAddr is Map ? delivAddr['latitude'] : null) as num?)?.toDouble() ?? 19.7594;
    final dLng = (json['dropoffLongitude'] ?? json['customerLongitude'] ?? (delivAddr is Map ? delivAddr['longitude'] : null) as num?)?.toDouble() ?? -72.2008;

    final parsedItems = _parseItems(json['items'] ?? json['order_items']);
    String desc = json['itemsDescription']?.toString() ?? '';
    if (desc.isEmpty && parsedItems.isNotEmpty) {
      desc = parsedItems.map((i) => '${i.quantity}x ${i.name}').join(', ');
    }
    if (desc.isEmpty) desc = 'Kòmand Atik';

    return Mission(
      orderId: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? 'HT-2026-000000',
      merchantName: merchant?['name'] ?? 'Marchand Partenaire',
      merchantAddress: merchant?['address'] ?? 'Cap-Haïtien',
      merchantType: (merchant?['type'] ?? json['merchantType'] ?? 'RESTAURANT').toString().toUpperCase(),
      pickupLatitude: pLat,
      pickupLongitude: pLng,
      customerName: '${customer?['firstName'] ?? ''} ${customer?['lastName'] ?? ''}'.trim(),
      customerPhone: customer?['phoneNumber'] ?? customer?['phone'] ?? '+509 3700 0000',
      customerAddress: delivAddr is Map ? (delivAddr['streetAddress'] ?? delivAddr['fullAddress'] ?? 'Adresse indiquée') : (delivAddr?.toString() ?? 'Adresse indiquée'),
      dropoffLatitude: dLat,
      dropoffLongitude: dLng,
      customerNote: json['customerNote']?.toString(),
      customerLandmark: delivAddr is Map ? delivAddr['landmarkDirections']?.toString() : null,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 250.0,
      totalOrderAmount: (json['total'] ?? json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      status: json['status'] ?? 'DRIVER_ASSIGNED',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 3.5,
      itemsDescription: desc,
      items: parsedItems,
      tipAmount: (json['tipAmount'] as num?)?.toDouble() ?? 50.0,
      category: json['category'] ?? 'FOOD',
    );
  }

  factory Mission.fromSupabase(Map<String, dynamic> json) {
    final customer = json['customer'];
    final merchant = json['merchant'];
    final delivAddr = json['deliveryAddress'];

    final pLat = (merchant?['latitude'] as num?)?.toDouble() ?? (json['merchantLatitude'] as num?)?.toDouble() ?? 19.7625;
    final pLng = (merchant?['longitude'] as num?)?.toDouble() ?? (json['merchantLongitude'] as num?)?.toDouble() ?? -72.1985;
    final dLat = (delivAddr is Map ? delivAddr['latitude'] : null as num?)?.toDouble() ??
        (json['deliveryLatitude'] as num?)?.toDouble() ??
        (json['latitude'] as num?)?.toDouble() ??
        19.7594;
    final dLng = (delivAddr is Map ? delivAddr['longitude'] : null as num?)?.toDouble() ??
        (json['deliveryLongitude'] as num?)?.toDouble() ??
        (json['longitude'] as num?)?.toDouble() ??
        -72.2008;

    final parsedItems = _parseItems(json['items'] ?? json['order_items']);
    String desc = json['itemsDescription']?.toString() ?? '';
    if (desc.isEmpty && parsedItems.isNotEmpty) {
      desc = parsedItems.map((i) => '${i.quantity}x ${i.name}').join(', ');
    }
    if (desc.isEmpty) desc = 'Kòmand Atik';

    return Mission(
      orderId: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? 'HT-2026-000000',
      merchantName: merchant?['name'] ?? 'Marchand',
      merchantAddress: merchant?['address'] ?? 'Cap-Haïtien',
      merchantType: (merchant?['type'] ?? json['merchantType'] ?? 'RESTAURANT').toString().toUpperCase(),
      pickupLatitude: pLat,
      pickupLongitude: pLng,
      customerName: customer != null
          ? '${customer['firstName'] ?? ''} ${customer['lastName'] ?? ''}'.trim()
          : 'Kliyan',
      customerPhone: customer?['phoneNumber'] ?? '+509 3700 0000',
      customerAddress: delivAddr is Map
          ? (delivAddr['streetAddress'] ?? delivAddr['fullAddress'] ?? 'Adresse à confirmer')
          : (json['deliveryAddress']?.toString() ?? 'Adresse à confirmer'),
      dropoffLatitude: dLat,
      dropoffLongitude: dLng,
      customerNote: json['customerNote']?.toString() ?? json['notes']?.toString(),
      customerLandmark: delivAddr is Map
          ? delivAddr['landmarkDirections']?.toString()
          : (json['notesForDriver']?.toString() ?? json['customerLandmark']?.toString()),
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 250.0,
      totalOrderAmount: (json['total'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      status: json['status'] ?? 'DRIVER_ASSIGNED',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 3.5,
      itemsDescription: desc,
      items: parsedItems,
      tipAmount: (json['tipAmount'] as num?)?.toDouble() ?? 50.0,
      category: json['category'] ?? 'FOOD',
    );
  }

  /// Parsé payload reyèl ki vini de backend via WebSocket 'driver:mission:incoming'
  /// Champ yo soti nan: OrdersService.notifyDriverNewMission()
  factory Mission.fromWebSocket(Map<String, dynamic> json) {
    final parsedItems = _parseItems(json['items'] ?? json['order_items']);
    String desc = json['itemsDescription']?.toString() ?? '';
    if (desc.isEmpty && parsedItems.isNotEmpty) {
      desc = parsedItems.map((i) => '${i.quantity}x ${i.name}').join(', ');
    }
    if (desc.isEmpty) desc = 'Kòmand Atik';

    return Mission(
      orderId: json['orderId'] ?? json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? 'HT-2026-000000',
      merchantName: json['merchantName'] ?? 'Marchand Partenaire',
      merchantAddress: json['merchantAddress'] ?? 'Cap-Haïtien',
      merchantType: (json['merchantType'] ?? 'RESTAURANT').toString().toUpperCase(),
      pickupLatitude: (json['merchantLatitude'] as num?)?.toDouble() ?? 19.7625,
      pickupLongitude: (json['merchantLongitude'] as num?)?.toDouble() ?? -72.1985,
      customerName: json['customerName'] ?? 'Kliyan',
      customerPhone: json['customerPhone'] ?? json['phone'] ?? '+509 3700 0000',
      customerAddress: json['customerAddress'] ?? 'Adres Kliyan an',
      dropoffLatitude: (json['customerLatitude'] as num?)?.toDouble() ?? 19.7594,
      dropoffLongitude: (json['customerLongitude'] as num?)?.toDouble() ?? -72.2008,
      customerNote: json['customerNote']?.toString(),
      customerLandmark: json['customerLandmark']?.toString(),
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 250.0,
      totalOrderAmount: (json['totalOrderAmount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      status: 'DRIVER_ASSIGNED',
      distanceKm: (json['pickupDistanceKm'] as num?)?.toDouble() ?? 3.5,
      dispatchTimeout: (json['timeoutSeconds'] as num?)?.toInt() ?? 25,
      itemsDescription: desc,
      items: parsedItems,
      tipAmount: (json['tipAmount'] as num?)?.toDouble() ?? 50.0,
      category: json['category'] ?? 'FOOD',
    );
  }
}

class DriverEarnings {
  final double todayTotal;
  final int todayDeliveries;
  final double availableBalance;
  final double cashCollectedToRemit;

  DriverEarnings({
    required this.todayTotal,
    required this.todayDeliveries,
    required this.availableBalance,
    required this.cashCollectedToRemit,
  });
}

class DriverUserProfile {
  final String id;
  final String userId;
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String email;
  final String vehicleType;
  final String vehiclePlate;
  final String? vehicleModel;
  final String? licenseNumber;
  final String status;
  final double rating;
  final int totalDeliveries;
  final double currentCashInHand;
  final double walletBalance;

  DriverUserProfile({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    required this.email,
    required this.vehicleType,
    required this.vehiclePlate,
    this.vehicleModel,
    this.licenseNumber,
    required this.status,
    required this.rating,
    required this.totalDeliveries,
    required this.currentCashInHand,
    required this.walletBalance,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory DriverUserProfile.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    final wallet = json['wallet'] as Map<String, dynamic>? ?? {};

    final fName = user['firstName'] ?? json['firstName'] ?? '';
    final lName = user['lastName'] ?? json['lastName'] ?? '';
    final phone = user['phoneNumber'] ?? json['phoneNumber'] ?? '';
    final mail = user['email'] ?? json['email'] ?? '';
    final plate = json['vehiclePlate'] ?? '';
    final model = json['vehicleModel'] ?? 'Haojue Express 125';
    final lic = json['licenseNumber'] ?? '';

    final wBal = (wallet['balance'] as num?)?.toDouble() ??
                 (json['walletBalance'] as num?)?.toDouble() ??
                 (json['balance'] as num?)?.toDouble() ??
                 6635.0;

    return DriverUserProfile(
      id: json['id'] ?? json['userId'] ?? user['id'] ?? '217712d7-1f9a-49cc-b1b4-50b163fa22a6',
      userId: json['userId'] ?? user['id'] ?? '217712d7-1f9a-49cc-b1b4-50b163fa22a6',
      firstName: fName.isNotEmpty ? fName : 'Mackby',
      lastName: lName.isNotEmpty ? lName : 'Wise',
      phoneNumber: phone.isNotEmpty ? phone : '+50940553636',
      email: mail.isNotEmpty ? mail : 'bienailejeanbaptiste232@gmail.com',
      vehicleType: json['vehicleType'] ?? 'MOTORCYCLE',
      vehiclePlate: plate.isNotEmpty ? plate : 'E20988',
      vehicleModel: model,
      licenseNumber: lic.isNotEmpty ? lic : '0887uu77',
      status: json['status'] ?? 'ONLINE',
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      totalDeliveries: (json['totalDeliveries'] as num?)?.toInt() ?? 43,
      currentCashInHand: (json['currentCashInHand'] as num?)?.toDouble() ?? 0.0,
      walletBalance: wBal,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'firstName': firstName,
    'lastName': lastName,
    'phoneNumber': phoneNumber,
    'email': email,
    'vehicleType': vehicleType,
    'vehiclePlate': vehiclePlate,
    'vehicleModel': vehicleModel,
    'licenseNumber': licenseNumber,
    'status': status,
    'rating': rating,
    'totalDeliveries': totalDeliveries,
    'currentCashInHand': currentCashInHand,
    'walletBalance': walletBalance,
  };
}
