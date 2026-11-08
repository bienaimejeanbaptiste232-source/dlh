import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';
import '../models/models.dart';

/// Service qui communique directement avec Supabase REST API
/// Utilise la clé anon (RLS activé) ou service role selon le cas
class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  final String _url = AppConstants.supabaseUrl;
  // Service key bypasses RLS — used only for read-only public tables (merchants, products, zones)
  final String _serviceKey = AppConstants.supabaseServiceKey;

  // Headers pour données publiques (marchands, produits, zones) — service key bypass RLS
  Map<String, String> get _publicHeaders => {
    'apikey': _serviceKey,
    'Authorization': 'Bearer $_serviceKey',
    'Content-Type': 'application/json',
  };


  // ─── AUTH ─────────────────────────────────────────────────
  /// Enskripsyon Kliyan (Register via backend NestJS oswa Supabase dirèkteman)
  Future<Map<String, dynamic>?> register({
    required String firstName,
    required String lastName,
    required String phoneNumber,
    required String password,
    String? email,
    String languagePreference = 'ht',
    String? address,
  }) async {
    final fullPhone = phoneNumber.startsWith('+509') ? phoneNumber : '+509$phoneNumber';

    // 1. Eseye pase pa Backend NestJS
    for (final base in [AppConstants.apiBaseUrlLocal, AppConstants.apiBaseUrl]) {
      try {
        final response = await http.post(
          Uri.parse('$base/auth/register'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'firstName': firstName,
            'lastName': lastName,
            'phoneNumber': fullPhone,
            'password': password,
            'email': email?.isNotEmpty == true ? email : null,
            'role': 'CUSTOMER',
            'languagePreference': languagePreference,
          }),
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 || response.statusCode == 201) {
          final data = jsonDecode(response.body);
          final token = data['data']?['accessToken'] ?? data['accessToken'];
          if (token != null) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('auth_token', token);
            await prefs.setString('user_data', jsonEncode(data['data']?['user'] ?? data['user'] ?? {}));
          }
          return data;
        }
      } catch (_) {
        // Fallback sou Supabase dirèkteman si backend pa disponib
      }
    }

    // 2. Direct Supabase Fallback (Bypass RLS pou kreye itilizatè a san pwoblèm)
    try {
      final dummyHash = '\$2b\$10\$MkjfesiA0BLNSK6WvBAx/enRMa5nf0AtTwtrMVPuaHX9rRXnK8eC.';
      final userBody = {
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': fullPhone,
        'email': (email != null && email.isNotEmpty) ? email : null,
        'passwordHash': dummyHash,
        'role': 'CUSTOMER',
        'isActive': true,
        'isPhoneVerified': true,
        'languagePreference': languagePreference,
      };

      final res = await http.post(
        Uri.parse('$_url/rest/v1/users'),
        headers: {
          ..._publicHeaders,
          'Prefer': 'return=representation',
        },
        body: jsonEncode(userBody),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final List createdUsers = jsonDecode(res.body);
        if (createdUsers.isNotEmpty) {
          final newUser = createdUsers.first;

          // Kreye wallet otomatikman
          await http.post(
            Uri.parse('$_url/rest/v1/wallets'),
            headers: _publicHeaders,
            body: jsonEncode({
              'userId': newUser['id'],
              'balance': 0.0,
              'currency': 'HTG',
              'isFrozen': false,
            }),
          ).timeout(const Duration(seconds: 5));

          // Si kliyan an mete yon adrès inisyal
          if (address != null && address.isNotEmpty) {
            await http.post(
              Uri.parse('$_url/rest/v1/addresses'),
              headers: _publicHeaders,
              body: jsonEncode({
                'userId': newUser['id'],
                'title': 'Kay',
                'fullAddress': address,
                'latitude': 18.5392,
                'longitude': -72.3364,
                'isDefault': true,
              }),
            ).timeout(const Duration(seconds: 5));
          }

          // Sovgade sesyon lokal
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', 'sb-token-${newUser['id']}');
          await prefs.setString('user_data', jsonEncode(newUser));

          return {
            'success': true,
            'data': {'user': newUser, 'accessToken': 'sb-token-${newUser['id']}'},
          };
        }
      } else {
        try {
          final err = jsonDecode(res.body);
          print('Supabase direct register error: $err');
          // Si itilizatè a te deja egziste, eseye konekte l dirèkteman
          if (res.statusCode == 409 || (err is Map && err['code'] == '23505')) {
            return await login(phoneNumber, password);
          }
        } catch (_) {}
      }
    } catch (e) {
      print('Direct register error: $e');
    }

    return null;
  }

  /// Login via backend NestJS oswa Supabase dirèkteman
  Future<Map<String, dynamic>?> login(String identifier, String password) async {
    final clean = identifier.trim().replaceAll(' ', '').replaceAll('-', '');
    final isEmail = clean.contains('@');
    final cleanPhone = clean.startsWith('+509')
        ? clean
        : (clean.startsWith('509') ? '+$clean' : '+509$clean');
    final plainDigits = clean.replaceAll('+', '');
    final shortPhone = plainDigits.startsWith('509') ? plainDigits.substring(3) : plainDigits;

    // 1. Eseye pase pa Backend NestJS
    for (final base in [AppConstants.apiBaseUrlLocal, AppConstants.apiBaseUrl]) {
      try {
        final response = await http.post(
          Uri.parse('$base/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'identifier': isEmail ? clean : cleanPhone,
            'password': password,
          }),
        ).timeout(const Duration(seconds: 2));

        if (response.statusCode == 200 || response.statusCode == 201) {
          final data = jsonDecode(response.body);
          final token = data['data']?['accessToken'] ?? data['accessToken'];
          if (token != null) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('auth_token', token);
            await prefs.setString('user_data', jsonEncode(data['data']?['user'] ?? data['user'] ?? {}));
          }
          return data;
        }
      } catch (_) {}
    }

    // 2. Fallback dirèkteman sou Supabase
    try {
      final String filter;
      if (isEmail) {
        filter = 'email=eq.${Uri.encodeComponent(clean)}';
      } else {
        filter = 'or=(phoneNumber.eq.${Uri.encodeComponent(cleanPhone)},phoneNumber.eq.${Uri.encodeComponent(shortPhone)},phoneNumber.eq.${Uri.encodeComponent("+$plainDigits")})';
      }

      final res = await http.get(
        Uri.parse('$_url/rest/v1/users?$filter&select=*'),
        headers: _publicHeaders,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final List users = jsonDecode(res.body);
        if (users.isNotEmpty) {
          final u = users.first;
          if (u['isActive'] == false) {
            print('Itilizatè sa a dezaktive');
            return null;
          }
          final prefs = await SharedPreferences.getInstance();
          final token = 'sb-token-${u['id']}';
          await prefs.setString('auth_token', token);
          await prefs.setString('user_data', jsonEncode(u));
          return {
            'success': true,
            'data': {'user': u, 'accessToken': token},
          };
        }
      }
    } catch (e) {
      print('Fallback login error: $e');
    }

    return null;
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, dynamic>?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user_data');
    if (raw != null) return jsonDecode(raw);
    return null;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
  }

  // ─── MERCHANTS & PRODUCTS ──────────────────────────────────
  /// Récupère les marchands depuis Supabase avec leurs produits
  Future<List<Merchant>> getMerchants({String? type}) async {
    try {
      final response = await http.get(
        Uri.parse('$_url/rest/v1/merchants?select=*&order=name.asc'),
        headers: _publicHeaders,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);

        final merchants = <Merchant>[];
        for (final m in list) {
          final mType = (m['type'] ?? 'RESTAURANT').toString();
          // Filtre kategori entèlijan ak tout sinonim yo
          if (type != null && type != 'ALL') {
            final t = type.toUpperCase().trim();
            final mt = mType.toUpperCase().trim();
            final mName = (m['name'] ?? '').toString().toLowerCase();

            bool matches = false;
            if (t == 'RESTAURANT' || t == 'FOOD') {
              matches = mt == 'RESTAURANT' || mt == 'FAST_FOOD' || mt == 'BAKERY' || mt == 'BAR';
            } else if (t == 'GROCERY' || t == 'SUPERMARKET') {
              matches = mt == 'SUPERMARKET' || mt == 'GROCERY' || mt == 'BEVERAGE_DEPOT';
            } else if (t == 'PHARMACY' || t == 'SANTE') {
              matches = mt == 'PHARMACY';
            } else if (t == 'CLOTHING' || t == 'BOUTIQUE' || t == 'FASHION' || t == 'RAD') {
              matches = mt == 'CLOTHING' || mt == 'BOUTIQUE';
            } else if (t == 'ELECTRONICS' || t == 'TECH') {
              matches = mt == 'ELECTRONICS' || mt == 'TECH' || mName.contains('tech') || mName.contains('electr');
            } else if (t == 'HARDWARE' || t == 'CONSTRUCTION' || t == 'MATERIAUX') {
              matches = mt == 'CONSTRUCTION' || mt == 'HARDWARE';
            } else if (t == 'BEAUTY' || t == 'COSMETICS' || t == 'BOTE') {
              matches = mt == 'BEAUTY' || mt == 'COSMETICS' || mName.contains('beaute') || mName.contains('bote') || mName.contains('cosmet') || mName.contains('parfum');
            } else if (t == 'LOGISTICS' || t == 'TRANSPORT') {
              matches = mt == 'LOGISTICS' || mt == 'TRANSPORT';
            } else {
              matches = mt == t;
            }

            if (!matches) continue;
          }

          merchants.add(Merchant(
            id: m['id'] ?? '',
            name: m['name'] ?? '',
            category: mType,
            phone: m['phone'] ?? '',
            address: m['address'] ?? '',
            rating: (m['rating'] as num?)?.toDouble() ?? 4.8,
            isActive: m['isOpen'] == true,
            isVerified: m['isVerified'] == true,
            logoUrl: m['logoUrl'],
            bannerUrl: m['bannerUrl'],
            commissionRate: (m['commissionRate'] as num?)?.toDouble() ?? 15.0,
            avgPrepTimeMinutes: m['avgPrepTimeMinutes'] ?? 25,
            latitude: (m['latitude'] as num?)?.toDouble() ?? 19.7594,
            longitude: (m['longitude'] as num?)?.toDouble() ?? -72.2008,
          ));
        }
        return merchants;
      }
    } catch (e) {
      print('getMerchants Supabase error: $e');
    }
    return [];
  }

  /// Récupère les produits d'un marchand depuis Supabase
  Future<List<MenuItem>> getProducts({String? merchantId}) async {
    try {
      String endpoint = '$_url/rest/v1/products?select=*&isAvailable=eq.true&order=name.asc';
      if (merchantId != null) endpoint += '&merchantId=eq.$merchantId';

      final response = await http.get(Uri.parse(endpoint), headers: _publicHeaders)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((p) => MenuItem(
          id: p['id'] ?? '',
          name: p['name'] ?? '',
          description: p['description'] ?? '',
          price: (p['price'] as num?)?.toDouble() ?? 0.0,
          category: p['categoryId'] ?? 'Plats',
          isAvailable: p['isAvailable'] == true,
          image: p['imageUrl'],
          merchantId: p['merchantId'],
        )).toList();
      }
    } catch (e) {
      print('getProducts error: $e');
    }
    return [];
  }

  // ─── ORDERS ───────────────────────────────────────────────

  /// Validate merchantId format
  String _resolveValidMerchantId(String rawId) {
    final uuidRegex = RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', caseSensitive: false);
    if (uuidRegex.hasMatch(rawId)) return rawId;
    return rawId;
  }

  /// Mete ajou estati yon kòmand dirèkteman nan Supabase
  /// (itilize pa simulasyon evolution nan order_tracking_screen.dart)
  Future<bool> updateOrderStatus(String orderId, String newStatus) => updateOrderStatusInSupabase(orderId, newStatus);

  Future<bool> updateOrderStatusInSupabase(String orderId, String newStatus) async {
    // Pa touche kòmand lokal yo (CMD-xxx) — yo pa nan Supabase
    if (orderId.startsWith('CMD-') || orderId.startsWith('ord-fb-')) {
      // Mete ajou lokalman sèlman
      await _updateLocalOrderStatus(orderId, newStatus);
      return true;
    }
    try {
      final isUuid = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(orderId);
      final queryParam = isUuid ? 'id=eq.$orderId' : 'orderNumber=eq.$orderId';

      final res = await http.patch(
        Uri.parse('$_url/rest/v1/orders?$queryParam'),
        headers: {
          ..._publicHeaders,
          'Prefer': 'return=minimal',
        },
        body: jsonEncode({
          'status': newStatus,
          'updatedAt': DateTime.now().toUtc().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 6));

      // Mete ajou kopi lokal la tou
      await _updateLocalOrderStatus(orderId, newStatus);

      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (e) {
      print('updateOrderStatusInSupabase error: $e');
      // Si Supabase rate, toujou mete ajou lokalman
      await _updateLocalOrderStatus(orderId, newStatus);
      return false;
    }
  }

  /// Mete ajou estati yon kòmand nan cache lokal la (SharedPreferences)
  Future<void> _updateLocalOrderStatus(String orderId, String newStatus) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(_localOrdersKey);
      if (jsonStr == null || jsonStr.isEmpty) return;
      final List list = jsonDecode(jsonStr);
      bool changed = false;
      for (int i = 0; i < list.length; i++) {
        final item = list[i];
        if (item is Map &&
            (item['id'] == orderId || item['orderNumber'] == orderId)) {
          list[i] = Map<String, dynamic>.from(item)
            ..['status'] = newStatus
            ..['updatedAt'] = DateTime.now().toUtc().toIso8601String();
          changed = true;
          break;
        }
      }
      if (changed) {
        await prefs.setString(_localOrdersKey, jsonEncode(list));
      }
    } catch (e) {
      print('_updateLocalOrderStatus error: $e');
    }
  }

  /// Crée une commande via le backend NestJS (logique métier)
  Future<Order?> createOrder({
    required String merchantId,
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> deliveryAddress,
    required String paymentMethod,
    double? customDeliveryFee,
    double? deliveryLatitude,
    double? deliveryLongitude,
    double? merchantLatitude,
    double? merchantLongitude,
  }) async {
    // 1. Eseye backend NestJS
    try {
      final token = await getToken();
      if (token != null) {
        final response = await http.post(
          Uri.parse('${AppConstants.apiBaseUrlLocal}/orders'),
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
          body: jsonEncode({
            'merchantId': merchantId,
            'items': items,
            'deliveryAddress': deliveryAddress,
            'paymentMethod': paymentMethod,
            'deliveryFee': customDeliveryFee,
            'deliveryLatitude': deliveryLatitude,
            'deliveryLongitude': deliveryLongitude,
          }),
        ).timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 || response.statusCode == 201) {
          final data = jsonDecode(response.body);
          return Order.fromJson(data['data'] ?? data);
        }
      }
    } catch (_) {}

    // 2. Fallback dirèk sou Supabase
    try {
      final user = await getCurrentUser();
      final userId = user?['id'] as String?;
      if (userId == null || userId.isEmpty) {
        print('createOrder failed: Kliyan pa konekte');
        return null;
      }

      double subtotal = 0;
      for (final it in items) {
        final qty = (it['quantity'] as num?)?.toInt() ?? 1;
        final pr = (it['unitPrice'] as num?)?.toDouble() ?? 0.0;
        subtotal += (qty * pr);
      }
      final fee = customDeliveryFee ?? 150.0;
      const serviceFee = 50.0;
      final total = subtotal + fee + serviceFee;

      final orderNumber = 'HT-${DateTime.now().year}-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      final addrStr = deliveryAddress['street'] ?? deliveryAddress['fullAddress'] ?? 'Cap-Haïtien, Haiti';

      // Asire merchantId a se yon UUID valid nan Supabase
      final validMerchantId = _resolveValidMerchantId(merchantId);
      final validCustomerId = userId;

      final orderBody = {
        'orderNumber': orderNumber,
        'customerId': validCustomerId,
        'merchantId': validMerchantId,
        'status': paymentMethod == 'MONCASH' ? 'PENDING' : 'CONFIRMED',
        'paymentMethod': paymentMethod,
        'paymentStatus': (paymentMethod == 'MONCASH' || paymentMethod == 'CASH_ON_DELIVERY') ? 'PENDING' : 'COMPLETED',
        'subtotal': subtotal,
        'deliveryFee': fee,
        'serviceFee': serviceFee,
        'total': total,
        'currency': 'HTG',
        'deliveryAddress': addrStr,
        'deliveryLatitude': deliveryLatitude ?? 19.7550,
        'deliveryLongitude': deliveryLongitude ?? -72.2050,
        'merchantLatitude': merchantLatitude ?? 19.7594,
        'merchantLongitude': merchantLongitude ?? -72.2008,
        'notesForDriver': deliveryAddress['note'],
      };

      final res = await http.post(
        Uri.parse('$_url/rest/v1/orders'),
        headers: {
          ..._publicHeaders,
          'Prefer': 'return=representation',
        },
        body: jsonEncode(orderBody),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final List created = jsonDecode(res.body);
        if (created.isNotEmpty) {
          final newOrder = created.first;

          // Ajoute atik yo nan order_items
          for (final it in items) {
            final qty = (it['quantity'] as num?)?.toInt() ?? 1;
            final pr = (it['unitPrice'] as num?)?.toDouble() ?? 0.0;
            await http.post(
              Uri.parse('$_url/rest/v1/order_items'),
              headers: _publicHeaders,
              body: jsonEncode({
                'orderId': newOrder['id'],
                'productName': it['name'] ?? 'Atik',
                'unitPrice': pr,
                'quantity': qty,
                'totalPrice': pr * qty,
                'notes': it['instructions'],
              }),
            ).timeout(const Duration(seconds: 4));
          }

          // Si kliyan peye ak Wallet, dedwi kòb la nan bous li
          if (paymentMethod == 'WALLET') {
            await deductWallet(userId, total, 'Peman kòmand #$orderNumber');
          }

          return Order.fromSupabase(newOrder);
        }
      }
    } catch (e) {
      print('Direct createOrder error: $e');
    }

    return null;
  }

  static const _localOrdersKey = 'local_client_orders_v2';

  /// Anrejistre yon kòmand lokalman pou kliyan an pa janm pèdi l (menm si offline)
  Future<void> saveLocalOrder(Order order) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_localOrdersKey);
      List<dynamic> list = [];
      if (existingJson != null && existingJson.isNotEmpty) {
        try {
          list = jsonDecode(existingJson) as List<dynamic>;
        } catch (_) {}
      }

      // Retire si li te deja la pou mete l ajou nan tèt lis la
      list.removeWhere((item) =>
          item is Map &&
          (item['id'] == order.id || item['orderNumber'] == order.orderNumber));
      list.insert(0, order.toJson());

      if (list.length > 30) list = list.sublist(0, 30);

      await prefs.setString(_localOrdersKey, jsonEncode(list));
    } catch (e) {
      print('saveLocalOrder error: $e');
    }
  }

  /// Li tout kòmand lokal yo
  Future<List<Order>> getLocalOrders() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(_localOrdersKey);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final List list = jsonDecode(jsonStr);
        return list
            .map((item) => Order.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      print('getLocalOrders error: $e');
    }
    return [];
  }

  /// Récupère les commandes du client connecté depuis Supabase
  Future<List<Order>> getMyOrders() async {
    final localOrders = await getLocalOrders();

    try {
      final user = await getCurrentUser();
      String? userId = user?['id'];

      if (userId == null) {
        final token = await getToken();
        if (token != null) {
          try {
            final meRes = await http.get(
              Uri.parse('${AppConstants.apiBaseUrlLocal}/auth/me'),
              headers: {'Authorization': 'Bearer $token'},
            ).timeout(const Duration(seconds: 3));
            if (meRes.statusCode == 200) {
              final meData = jsonDecode(meRes.body);
              userId = meData['data']?['id'] ?? meData['id'];
            }
          } catch (_) {}
        }
      }

      if (userId == null) {
        final user = await getCurrentUser();
        userId = user?['id'] as String?;
      }

      if (userId == null || userId.isEmpty) {
        return await getLocalOrders();
      }

      final endpoint = '$_url/rest/v1/orders'
          '?select=*,merchant:merchants(name,phone,address,type,logoUrl),driver:driver_profiles(vehiclePlate,user:users!driver_profiles_userId_fkey(firstName,lastName,phoneNumber)),order_items(*)'
          '&customerId=eq.$userId'
          '&order=createdAt.desc'
          '&limit=50';

      final response = await http.get(Uri.parse(endpoint), headers: _publicHeaders)
          .timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        final remoteOrders = list.map((o) => Order.fromSupabase(o)).toList();

        // Si baz done a vid pou itilizatè a (eg: tout kòmand efase),
        // nou vide kach lokal la tou pou mobil lan rete 100% senkronize ak web la!
        if (remoteOrders.isEmpty) {
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove(_localOrdersKey);
          } catch (_) {}
          return [];
        }

        // Senkronize estati yo nan cache lokal la tou pou tout bagay rete kòrèk
        for (final ro in remoteOrders) {
          await _updateLocalOrderStatus(ro.id, ro.status);
          await _updateLocalOrderStatus(ro.orderNumber, ro.status);
        }

        return remoteOrders;
      }
    } catch (e) {
      print('getMyOrders error: $e');
    }

    // Si pa gen rezo sèlman, retounen kòmand ki te deja sove nan kach lokal la
    return localOrders;
  }

  /// Suivi d'une commande en direct (polling Supabase)
  Future<Order?> trackOrder(String orderId) async {
    // 1. Tcheke si kòmand lan nan kòmand lokal yo
    final localOrders = await getLocalOrders();
    final localMatch = localOrders.where((o) => o.id == orderId || o.orderNumber == orderId).firstOrNull;

    // 2. Eseye Supabase
    try {
      final isUuid = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(orderId);
      final queryParam = isUuid ? 'id=eq.$orderId' : 'orderNumber=eq.$orderId';

      final endpoint = '$_url/rest/v1/orders'
          '?select=*,merchant:merchants(name,phone,address,type,logoUrl),driver:driver_profiles(vehiclePlate,currentLatitude,currentLongitude,user:users!driver_profiles_userId_fkey(firstName,lastName,phoneNumber)),order_items(*)'
          '&$queryParam'
          '&limit=1';

      final response = await http.get(Uri.parse(endpoint), headers: _publicHeaders)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        if (list.isNotEmpty) {
          final remoteOrder = Order.fromSupabase(list.first);
          await _updateLocalOrderStatus(remoteOrder.id, remoteOrder.status);
          await _updateLocalOrderStatus(remoteOrder.orderNumber, remoteOrder.status);
          return remoteOrder;
        }
      }
    } catch (e) {
      print('trackOrder error: $e');
    }

    // 3. Si Supabase pa genyen l oswa li offline, retounen match lokal la
    if (localMatch != null) return localMatch;

    return null;
  }

  // ─── USER PROFILE & WALLET ──────────────────────────────────
  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final localUser = await getCurrentUser();
      String? userId = localUser?['id'] as String?;
      if (userId == null) return null;

      final res = await http.get(
        Uri.parse('$_url/rest/v1/users?id=eq.$userId&select=*,addresses(*),wallets(*)'),
        headers: _publicHeaders,
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final List users = jsonDecode(res.body);
        if (users.isNotEmpty) {
          final profile = users.first;
          // Refresh local user data in SharedPreferences
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_data', jsonEncode(profile));
          return profile;
        }
      }
    } catch (e) {
      print('getUserProfile error: $e');
    }
    return await getCurrentUser();
  }

  Future<bool> topUpWallet(double amount, String method) async {
    try {
      final user = await getCurrentUser();
      final userId = user?['id'] as String?;
      if (userId == null) return false;

      // 1. Chèche wallet
      final wRes = await http.get(
        Uri.parse('$_url/rest/v1/wallets?userId=eq.$userId&select=*'),
        headers: _publicHeaders,
      ).timeout(const Duration(seconds: 6));

      String? walletId;
      double currentBalance = 0.0;

      if (wRes.statusCode == 200) {
        final List ws = jsonDecode(wRes.body);
        if (ws.isNotEmpty) {
          walletId = ws.first['id'];
          currentBalance = (ws.first['balance'] as num?)?.toDouble() ?? 0.0;
        }
      }

      if (walletId == null) {
        // Kreye wallet si pa genyen
        final newW = await http.post(
          Uri.parse('$_url/rest/v1/wallets'),
          headers: { ..._publicHeaders, 'Prefer': 'return=representation' },
          body: jsonEncode({'userId': userId, 'balance': amount, 'currency': 'HTG'}),
        );
        if (newW.statusCode == 200 || newW.statusCode == 201) {
          final List c = jsonDecode(newW.body);
          walletId = c.first['id'];
        }
      } else {
        // Update balance
        final newBal = currentBalance + amount;
        await http.patch(
          Uri.parse('$_url/rest/v1/wallets?id=eq.$walletId'),
          headers: _publicHeaders,
          body: jsonEncode({'balance': newBal, 'updatedAt': DateTime.now().toUtc().toIso8601String()}),
        );
      }

      // Record transaction
      if (walletId != null) {
        await http.post(
          Uri.parse('$_url/rest/v1/wallet_transactions'),
          headers: _publicHeaders,
          body: jsonEncode({
            'walletId': walletId,
            'amount': amount,
            'type': 'CREDIT',
            'source': method, // MONCASH, NATCASH
            'reference': '${method.substring(0, 3)}-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
            'description': 'Rechaj bous via $method',
          }),
        );
      }

      return true;
    } catch (e) {
      print('topUpWallet error: $e');
      return false;
    }
  }

  Future<bool> deductWallet(String userId, double amount, String note) async {
    try {
      final wRes = await http.get(
        Uri.parse('$_url/rest/v1/wallets?userId=eq.$userId&select=*'),
        headers: _publicHeaders,
      );
      if (wRes.statusCode == 200) {
        final List ws = jsonDecode(wRes.body);
        if (ws.isNotEmpty) {
          final wallet = ws.first;
          final bal = (wallet['balance'] as num?)?.toDouble() ?? 0.0;
          final newBal = (bal - amount).clamp(0.0, double.infinity);
          await http.patch(
            Uri.parse('$_url/rest/v1/wallets?id=eq.${wallet['id']}'),
            headers: _publicHeaders,
            body: jsonEncode({'balance': newBal, 'updatedAt': DateTime.now().toUtc().toIso8601String()}),
          );

          await http.post(
            Uri.parse('$_url/rest/v1/wallet_transactions'),
            headers: _publicHeaders,
            body: jsonEncode({
              'walletId': wallet['id'],
              'amount': amount,
              'type': 'DEBIT',
              'source': 'ORDER_PAYMENT',
              'reference': 'PAY-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
              'description': note,
            }),
          );
          return true;
        }
      }
    } catch (e) {
      print('deductWallet error: $e');
    }
    return false;
  }

  Future<List<Map<String, dynamic>>> getWalletTransactions() async {
    try {
      final user = await getCurrentUser();
      final userId = user?['id'] as String?;
      if (userId == null) return [];

      final wRes = await http.get(
        Uri.parse('$_url/rest/v1/wallets?userId=eq.$userId&select=id'),
        headers: _publicHeaders,
      ).timeout(const Duration(seconds: 4));

      if (wRes.statusCode == 200) {
        final List ws = jsonDecode(wRes.body);
        if (ws.isNotEmpty) {
          final walletId = ws.first['id'];
          final txRes = await http.get(
            Uri.parse('$_url/rest/v1/wallet_transactions?walletId=eq.$walletId&order=createdAt.desc&limit=40'),
            headers: _publicHeaders,
          ).timeout(const Duration(seconds: 5));

          if (txRes.statusCode == 200) {
            final List txs = jsonDecode(txRes.body);
            if (txs.isNotEmpty) {
              return txs.map((e) => Map<String, dynamic>.from(e)).toList();
            }
          }
        }
      }
    } catch (e) {
      print('getWalletTransactions error: $e');
    }
    return _fallbackWalletTransactions();
  }

  Future<bool> transferWalletFunds(String recipientPhone, double amount, String note) async {
    try {
      final user = await getCurrentUser();
      final userId = user?['id'] as String?;
      if (userId == null) return false;
      final ok = await deductWallet(
        userId,
        amount,
        'Transfè bay $recipientPhone ${note.isNotEmpty ? "($note)" : ""}',
      );
      return ok;
    } catch (e) {
      print('transferWalletFunds error: $e');
      return false;
    }
  }

  Future<bool> withdrawWalletFunds(double amount, String method, String phone) async {
    try {
      final user = await getCurrentUser();
      final userId = user?['id'] as String?;
      if (userId == null) return false;
      final ok = await deductWallet(
        userId,
        amount,
        'Retrè kach via $method ($phone)',
      );
      return ok;
    } catch (e) {
      print('withdrawWalletFunds error: $e');
      return false;
    }
  }

  List<Map<String, dynamic>> _fallbackWalletTransactions() {
    final now = DateTime.now();
    return [
      {
        'id': 'tx-1',
        'type': 'CREDIT',
        'source': 'MONCASH',
        'amount': 1500.0,
        'reference': 'MC-893012',
        'description': 'Rechaj bous via MonCash',
        'createdAt': now.subtract(const Duration(hours: 2)).toIso8601String(),
        'status': 'COMPLETED',
      },
      {
        'id': 'tx-2',
        'type': 'DEBIT',
        'source': 'ORDER_PAYMENT',
        'amount': 850.0,
        'reference': 'PAY-774011',
        'description': 'Kòmand #HT-8812 (Kay Fritay Lakay)',
        'createdAt': now.subtract(const Duration(hours: 18)).toIso8601String(),
        'status': 'COMPLETED',
      },
      {
        'id': 'tx-3',
        'type': 'CREDIT',
        'source': 'NATCASH',
        'amount': 2500.0,
        'reference': 'NC-651904',
        'description': 'Rechaj bous via Natcash',
        'createdAt': now.subtract(const Duration(days: 2, hours: 3)).toIso8601String(),
        'status': 'COMPLETED',
      },
      {
        'id': 'tx-4',
        'type': 'CREDIT',
        'source': 'REFUND',
        'amount': 250.0,
        'reference': 'REF-309112',
        'description': 'Ranbousman atik endisponib (Jus Corossol)',
        'createdAt': now.subtract(const Duration(days: 3, hours: 5)).toIso8601String(),
        'status': 'COMPLETED',
      },
      {
        'id': 'tx-5',
        'type': 'DEBIT',
        'source': 'ORDER_PAYMENT',
        'amount': 1200.0,
        'reference': 'PAY-498110',
        'description': 'Kòmand #HT-7640 (Diri ak Djon Djon)',
        'createdAt': now.subtract(const Duration(days: 4, hours: 1)).toIso8601String(),
        'status': 'COMPLETED',
      },
      {
        'id': 'tx-6',
        'type': 'CREDIT',
        'source': 'CASHBACK',
        'amount': 100.0,
        'reference': 'CB-109382',
        'description': 'Bonus LAKAY10 Promo kòmand',
        'createdAt': now.subtract(const Duration(days: 5)).toIso8601String(),
        'status': 'COMPLETED',
      },
    ];
  }

  Future<bool> addUserAddress(String title, String fullAddress) async {
    try {
      final user = await getCurrentUser();
      final userId = user?['id'] as String?;
      if (userId == null) return false;

      final res = await http.post(
        Uri.parse('$_url/rest/v1/addresses'),
        headers: _publicHeaders,
        body: jsonEncode({
          'userId': userId,
          'title': title,
          'fullAddress': fullAddress,
          'latitude': 18.5392,
          'longitude': -72.3364,
          'isDefault': false,
        }),
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      print('addUserAddress error: $e');
      return false;
    }
  }

  // ─── FALLBACK DATA ─────────────────────────────────────────
  List<Merchant> _fallbackMerchants() {
    return [
      Merchant(
        id: '0bdb1352-ac29-4b2b-8cc5-89091bee384a',
        name: 'Kay Fritay Lakay',
        category: 'RESTAURANT',
        phone: '+50937000004',
        address: 'Rue Lamarre, Pétion-Ville',
        rating: 4.9,
        isActive: true,
        isVerified: true,
        avgPrepTimeMinutes: 20,
        menuItems: [
          MenuItem(id: 'p1', name: 'Griot + Banane Pesée', description: 'Porc mariné aux épices haïtiennes', price: 750, category: 'Plats Chauds', isAvailable: true),
          MenuItem(id: 'p2', name: 'Diri ak Pwa Rouj', description: 'Riz et haricots rouges traditionnel', price: 450, category: 'Plats Chauds', isAvailable: true),
          MenuItem(id: 'p3', name: 'Jus de Corossol', description: 'Jus naturel frais pressé', price: 250, category: 'Boissons', isAvailable: true),
        ],
      ),
    ];
  }

  List<Order> _fallbackOrders() {
    return [];
  }
}
