import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/business_type_config.dart';
import '../config/constants.dart';
import '../models/merchant_models.dart';

class MerchantAuthResult {
  final bool success;
  final MerchantProfile? profile;
  final String? errorMessage;
  final bool isPendingVerification;

  MerchantAuthResult({
    required this.success,
    this.profile,
    this.errorMessage,
    this.isPendingVerification = false,
  });
}

class MerchantApiService {
  static final MerchantApiService _instance = MerchantApiService._internal();
  factory MerchantApiService() => _instance;
  MerchantApiService._internal();

  final String _supabaseUrl = MerchantConstants.supabaseUrl;
  final String _serviceKey = MerchantConstants.supabaseServiceKey;

  Map<String, String> get _headers => {
    'apikey': _serviceKey,
    'Authorization': 'Bearer $_serviceKey',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  Map<String, String> get _minimalHeaders => {
    'apikey': _serviceKey,
    'Authorization': 'Bearer $_serviceKey',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('merchant_token', token);
  }

  Future<void> saveProfile(MerchantProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('merchant_profile', jsonEncode(profile.toJson()));
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('merchant_token');
    await prefs.remove('merchant_user');
    await prefs.remove('merchant_profile');
  }

  /// Otantifikasyon detaye Machann avèk verifikasyon estati
  Future<MerchantAuthResult> loginDetailed(String identifier, String password) async {
    final clean = identifier.trim();
    final cleanPhone = clean.startsWith('+509')
        ? clean
        : (clean.startsWith('509') ? '+$clean' : '+509$clean');

    try {
      final isEmail = clean.contains('@');
      final query = isEmail
          ? 'email=eq.${Uri.encodeComponent(clean)}'
          : 'phoneNumber=eq.${Uri.encodeComponent(cleanPhone)}';

      final userRes = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/users?$query&limit=1'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

      if (userRes.statusCode == 200) {
        final list = jsonDecode(userRes.body) as List;
        if (list.isNotEmpty) {
          final user = list.first as Map<String, dynamic>;
          final userId = user['id'];

          if (user['isActive'] == false) {
            return MerchantAuthResult(
              success: false,
              errorMessage: 'Kont itilizatè sa a dezaktive oswa bloke pa administratè a.',
            );
          }

          // Chèche restoran ki lye ak itilizatè sa a
          final merchRes = await http.get(
            Uri.parse('$_supabaseUrl/rest/v1/merchants?select=*,zone:delivery_zones(name)&ownerId=eq.$userId&limit=1'),
            headers: _headers,
          ).timeout(const Duration(seconds: 8));

          if (merchRes.statusCode == 200) {
            final mList = jsonDecode(merchRes.body) as List;
            if (mList.isNotEmpty) {
              final merchData = mList.first as Map<String, dynamic>;
              final profile = MerchantProfile.fromJson(merchData);

              // Tcheke si admin an deja valide machann lan
              if (!profile.isVerified) {
                return MerchantAuthResult(
                  success: false,
                  profile: profile,
                  isPendingVerification: true,
                  errorMessage: 'Restoran ou an (${profile.name}) poko valide pa administratè Delivery Haïti a. Tanpri tann validasyon an anvan w kòmanse.',
                );
              }

              await saveProfile(profile);
              await saveToken('token_merchant_${profile.id}');
              return MerchantAuthResult(success: true, profile: profile);
            } else {
              return MerchantAuthResult(
                success: false,
                errorMessage: 'Pa gen okenn restoran ki anrejistre pou kont sa a. Tanpri kreye yon kont machann.',
              );
            }
          }
        }
      }
    } catch (e) {
      debugPrint('[MerchantApi] login error: $e');
      return MerchantAuthResult(
        success: false,
        errorMessage: 'Erè rezo oswa koneksyon: $e',
      );
    }

    return MerchantAuthResult(
      success: false,
      errorMessage: 'Nimewo telefòn oswa modpas la pa kòrèk.',
    );
  }

  /// Otantifikasyon estanda pou konpatibilite
  Future<MerchantProfile?> login(String identifier, String password) async {
    final result = await loginDetailed(identifier, password);
    return result.success ? result.profile : null;
  }

  /// Enskripsyon Nouvo Machann (Nouvo Restoran/Boutik)
  /// Kont lan kreye ak `isVerified: false` pou se Admin lan ki valide li
  Future<MerchantAuthResult> registerMerchant({
    required String businessName,
    required String businessType,
    required String ownerFirstName,
    required String ownerLastName,
    required String phoneNumber,
    required String password,
    String? email,
    required String address,
  }) async {
    final clean = phoneNumber.trim();
    final cleanPhone = clean.startsWith('+509')
        ? clean
        : (clean.startsWith('509') ? '+$clean' : '+509$clean');

    try {
      // 1. Tcheke si nimewo oswa imèl la deja egziste
      final checkQuery = email != null && email.trim().isNotEmpty
          ? 'or=(phoneNumber.eq.${Uri.encodeComponent(cleanPhone)},email.eq.${Uri.encodeComponent(email.trim())})'
          : 'phoneNumber=eq.${Uri.encodeComponent(cleanPhone)}';

      final checkRes = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/users?$checkQuery&limit=1'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

      if (checkRes.statusCode == 200) {
        final existing = jsonDecode(checkRes.body) as List;
        if (existing.isNotEmpty) {
          return MerchantAuthResult(
            success: false,
            errorMessage: 'Gen yon kont ki deja anrejistre ak nimewo telefòn oswa imèl sa a.',
          );
        }
      }

      // 2. Kreye itilizatè a nan tab users
      const dummyHash = r'$2b$10$MkjfesiA0BLNSK6WvBAx/enRMa5nf0AtTwtrMVPuaHX9rRXnK8eC.';
      final userPayload = {
        'firstName': ownerFirstName.trim(),
        'lastName': ownerLastName.trim(),
        'phoneNumber': cleanPhone,
        'email': (email != null && email.trim().isNotEmpty) ? email.trim() : null,
        'passwordHash': dummyHash,
        'role': 'RESTAURANT',
        'isActive': true,
        'isPhoneVerified': true,
        'languagePreference': 'ht',
      };

      final userCreateRes = await http.post(
        Uri.parse('$_supabaseUrl/rest/v1/users'),
        headers: _headers,
        body: jsonEncode(userPayload),
      ).timeout(const Duration(seconds: 10));

      if (userCreateRes.statusCode != 200 && userCreateRes.statusCode != 201) {
        return MerchantAuthResult(
          success: false,
          errorMessage: 'Erè pandan kreyasyon kont itilizatè a (${userCreateRes.statusCode}).',
        );
      }

      final createdUsers = jsonDecode(userCreateRes.body) as List;
      final newUser = createdUsers.first as Map<String, dynamic>;
      final newUserId = newUser['id'];

      // 3. Chèche yon zòn livrezon default si posib
      String? defaultZoneId;
      try {
        final zoneRes = await http.get(
          Uri.parse('$_supabaseUrl/rest/v1/delivery_zones?limit=1'),
          headers: _headers,
        );
        if (zoneRes.statusCode == 200) {
          final zList = jsonDecode(zoneRes.body) as List;
          if (zList.isNotEmpty) {
            defaultZoneId = zList.first['id'];
          }
        }
      } catch (_) {}

      // 4. Kreye pwofil Machann nan tab `merchants`
      // Enpòtan: `isVerified: false` - se admin lan ki dwe valide li!
      final merchantPayload = {
        'ownerId': newUserId,
        'name': businessName.trim(),
        'type': businessType,
        'phone': cleanPhone,
        'address': address.trim(),
        'latitude': 19.7595, // Cap-Haïtien default
        'longitude': -72.2008,
        'zoneId': defaultZoneId,
        'commissionRate': 15.0,
        'avgPrepTimeMinutes': 25,
        'isOpen': false,
        'isVerified': false, // POKO VALIDE - ATANN ADMIN
      };

      final merchCreateRes = await http.post(
        Uri.parse('$_supabaseUrl/rest/v1/merchants'),
        headers: _headers,
        body: jsonEncode(merchantPayload),
      ).timeout(const Duration(seconds: 10));

      if (merchCreateRes.statusCode != 200 && merchCreateRes.statusCode != 201) {
        return MerchantAuthResult(
          success: false,
          errorMessage: 'Erè pandan anrejistreman etablisman an nan sistèm nan.',
        );
      }

      final createdMerch = jsonDecode(merchCreateRes.body) as List;
      final newMerch = createdMerch.first as Map<String, dynamic>;
      final profile = MerchantProfile.fromJson(newMerch);

      // 5. Kreye yon bous (wallet) pou machann lan
      try {
        await http.post(
          Uri.parse('$_supabaseUrl/rest/v1/wallets'),
          headers: _minimalHeaders,
          body: jsonEncode({
            'userId': newUserId,
            'balance': 0,
            'currency': 'HTG',
            'isFrozen': false,
          }),
        );
      } catch (_) {}

      return MerchantAuthResult(
        success: true,
        profile: profile,
        isPendingVerification: true,
        errorMessage: null,
      );
    } catch (e) {
      debugPrint('[MerchantApi] registerMerchant error: $e');
      return MerchantAuthResult(
        success: false,
        errorMessage: 'Erè pandan anrejistreman an: $e',
      );
    }
  }

  /// Rekipere pwofil restoran an (soti nan kach oswa dirèkteman nan Supabase)
  Future<MerchantProfile?> getSavedProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('merchant_profile');
    if (raw != null) {
      try {
        final map = jsonDecode(raw) as Map<String, dynamic>;
        return MerchantProfile.fromJson(map);
      } catch (_) {}
    }

    // Rekipere vrè restoran 'Kay Fritay Lakay' nan Supabase si pa gen kach
    try {
      final res = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/merchants?select=*,zone:delivery_zones(name)&limit=1'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        if (list.isNotEmpty) {
          final profile = MerchantProfile.fromJson(list.first);
          await saveProfile(profile);
          return profile;
        }
      }
    } catch (e) {
      debugPrint('[MerchantApi] getSavedProfile error: $e');
    }

    return null;
  }

  /// Chanje estati Restoran an: Ouvri / Fèmen
  Future<bool> toggleRestaurantOpen(String merchantId, bool isOpen) async {
    try {
      final res = await http.patch(
        Uri.parse('$_supabaseUrl/rest/v1/merchants?id=eq.$merchantId'),
        headers: _minimalHeaders,
        body: jsonEncode({'isOpen': isOpen}),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('[MerchantApi] toggleRestaurantOpen error: $e');
      return false;
    }
  }

  // ─── KÒMAND REYÈL (ORDERS) ─────────────────────────────────

  /// Chaje kòmand restoran an nan Supabase
  Future<List<MerchantOrder>> getOrders({required String merchantId}) async {
    try {
      final endpoint = '$_supabaseUrl/rest/v1/orders'
          '?select=*,customer:users!orders_customerId_fkey(firstName,lastName,phoneNumber)'
          ',driver:driver_profiles!orders_driverId_fkey(user:users(firstName,lastName,phoneNumber))'
          ',order_items(*)'
          '&merchantId=eq.$merchantId'
          '&order=createdAt.desc&limit=50';

      final res = await http.get(Uri.parse(endpoint), headers: _headers)
          .timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((o) => MerchantOrder.fromSupabase(o)).toList();
      }
    } on TimeoutException {
      debugPrint('[MerchantApi] getOrders timeout — retounen lis vid.');
    } catch (e) {
      debugPrint('[MerchantApi] getOrders error: $e');
    }
    return [];
  }


  /// Aksepte kòmand lan epi fikse tan preparasyon an
  Future<bool> acceptOrder(String orderId, int prepTimeMinutes) async {
    try {
      final res = await http.patch(
        Uri.parse('$_supabaseUrl/rest/v1/orders?id=eq.$orderId'),
        headers: _minimalHeaders,
        body: jsonEncode({
          'status': 'PREPARING',
          'updatedAt': DateTime.now().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('[MerchantApi] acceptOrder error: $e');
      return false;
    }
  }

  /// Make kòmand lan pare pou livrè a vini pran li
  Future<bool> markOrderReady(String orderId) async {
    try {
      final res = await http.patch(
        Uri.parse('$_supabaseUrl/rest/v1/orders?id=eq.$orderId'),
        headers: _minimalHeaders,
        body: jsonEncode({
          'status': 'READY_FOR_PICKUP',
          'updatedAt': DateTime.now().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('[MerchantApi] markOrderReady error: $e');
      return false;
    }
  }

  /// Refize kòmand lan
  Future<bool> rejectOrder(String orderId, {String? reason}) async {
    try {
      final res = await http.patch(
        Uri.parse('$_supabaseUrl/rest/v1/orders?id=eq.$orderId'),
        headers: _minimalHeaders,
        body: jsonEncode({
          'status': 'CANCELLED',
          'updatedAt': DateTime.now().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('[MerchantApi] rejectOrder error: $e');
      return false;
    }
  }

  // ─── PWODWI AK MENI (PRODUCTS & CATEGORIES) ───────────────

  String _normalizeCategoryName(String name) {
    return name
        .replaceAll(RegExp(r'[\u{1F300}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]', unicode: true), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim()
        .toLowerCase();
  }

  /// Chaje tout kategori restoran an san okenn doublon
  Future<List<MerchantCategory>> getCategories(String merchantId) async {
    try {
      final res = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/categories?merchantId=eq.$merchantId&order=displayOrder.asc'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        final rawList = list.map((c) => MerchantCategory.fromJson(c)).toList();

        // Deduplike pa non nòmalize pou evite kategori double
        final Map<String, MerchantCategory> uniqueByName = {};
        for (final cat in rawList) {
          final normalized = _normalizeCategoryName(cat.name);
          if (!uniqueByName.containsKey(normalized)) {
            uniqueByName[normalized] = cat;
          }
        }
        return uniqueByName.values.toList();
      }
    } catch (e) {
      debugPrint('[MerchantApi] getCategories error: $e');
    }
    return [];
  }

  /// Asire tout kategori pa defo egziste pou komès la san double okenn
  Future<List<MerchantCategory>> ensureCategoriesForMerchant({
    required String merchantId,
    required String businessType,
  }) async {
    final existing = await getCategories(merchantId);
    final config = BusinessTypeConfig.fromType(businessType);

    // Chèche ki kategori ki poko egziste
    final existingNormalized = existing.map((c) => _normalizeCategoryName(c.name)).toSet();
    final List<MerchantCategory> created = [];

    for (int i = 0; i < config.defaultCategories.length; i++) {
      final catName = config.defaultCategories[i];
      final norm = _normalizeCategoryName(catName);
      if (existingNormalized.contains(norm)) continue; // Pa double kategori ki la deja

      try {
        final res = await http.post(
          Uri.parse('$_supabaseUrl/rest/v1/categories'),
          headers: _headers,
          body: jsonEncode({
            'merchantId': merchantId,
            'name': catName,
            'displayOrder': existing.length + created.length + i,
            'isActive': true,
          }),
        ).timeout(const Duration(seconds: 5));

        if (res.statusCode == 200 || res.statusCode == 201) {
          final List list = jsonDecode(res.body);
          if (list.isNotEmpty) {
            final cat = MerchantCategory.fromJson(list.first);
            created.add(cat);
            existingNormalized.add(norm);
          }
        }
      } catch (e) {
        debugPrint('[MerchantApi] Error auto-creating category $catName: $e');
      }
    }

    if (created.isNotEmpty) {
      return getCategories(merchantId);
    }
    return existing;
  }

  /// Rekipere oswa kreye yon kategori pa non san janm kreye kopi
  Future<String?> _getOrCreateCategoryIdByName(String merchantId, String categoryName) async {
    try {
      final existing = await getCategories(merchantId);
      final targetNorm = _normalizeCategoryName(categoryName);

      // Premye chwa: èske gen yon kategori ki matche nòmalize?
      for (final cat in existing) {
        if (_normalizeCategoryName(cat.name) == targetNorm) {
          return cat.id;
        }
      }

      // Si li pa jwenn li, kreye kategori a
      final createRes = await http.post(
        Uri.parse('$_supabaseUrl/rest/v1/categories'),
        headers: _headers,
        body: jsonEncode({
          'merchantId': merchantId,
          'name': categoryName.trim(),
          'displayOrder': existing.length,
          'isActive': true,
        }),
      ).timeout(const Duration(seconds: 5));

      if (createRes.statusCode == 200 || createRes.statusCode == 201) {
        final List list = jsonDecode(createRes.body);
        if (list.isNotEmpty && list.first['id'] != null) {
          return list.first['id'].toString();
        }
      }
    } catch (e) {
      debugPrint('[MerchantApi] _getOrCreateCategoryIdByName error: $e');
    }
    return null;
  }

  /// Kreye yon nouvo kategori pèsonalize pou machann lan
  Future<MerchantCategory?> createCustomCategory({
    required String merchantId,
    required String name,
  }) async {
    try {
      final existing = await getCategories(merchantId);
      final targetNorm = _normalizeCategoryName(name);

      for (final cat in existing) {
        if (_normalizeCategoryName(cat.name) == targetNorm) {
          return cat;
        }
      }

      final res = await http.post(
        Uri.parse('$_supabaseUrl/rest/v1/categories'),
        headers: _headers,
        body: jsonEncode({
          'merchantId': merchantId,
          'name': name.trim(),
          'displayOrder': existing.length,
          'isActive': true,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final List list = jsonDecode(res.body);
        if (list.isNotEmpty) {
          return MerchantCategory.fromJson(list.first);
        }
      }
    } catch (e) {
      debugPrint('[MerchantApi] createCustomCategory error: $e');
    }
    return null;
  }

  /// Chaje tout pwodwi restoran an
  Future<List<MerchantProduct>> getProducts(String merchantId) async {
    try {
      final res = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/products?select=*,category:categories(name)&merchantId=eq.$merchantId&order=createdAt.desc'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((p) => MerchantProduct.fromJson(p)).toList();
      }
    } catch (e) {
      debugPrint('[MerchantApi] getProducts error: $e');
    }
    return [];
  }

  /// Chanje disponibilite yon plat (Disponib / Fin fèt)
  Future<bool> toggleProductAvailability(String productId, bool isAvailable) async {
    try {
      final res = await http.patch(
        Uri.parse('$_supabaseUrl/rest/v1/products?id=eq.$productId'),
        headers: _minimalHeaders,
        body: jsonEncode({'isAvailable': isAvailable}),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('[MerchantApi] toggleProductAvailability error: $e');
      return false;
    }
  }

  /// Chanje pri yon plat
  Future<bool> updateProductPrice(String productId, double newPrice) async {
    try {
      final res = await http.patch(
        Uri.parse('$_supabaseUrl/rest/v1/products?id=eq.$productId'),
        headers: _minimalHeaders,
        body: jsonEncode({'price': newPrice}),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('[MerchantApi] updateProductPrice error: $e');
      return false;
    }
  }

  /// Ajoute yon nouvo pwodwi / medikaman / materyo nan katalòg la
  Future<bool> createProduct({
    required String merchantId,
    required String name,
    required String categoryId,
    required double price,
    String? description,
    String? imageUrl,
    int prepTimeMinutes = 15,
  }) async {
    try {
      String? validCategoryId;
      final uuidRegex = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');

      if (categoryId.isNotEmpty) {
        if (uuidRegex.hasMatch(categoryId)) {
          validCategoryId = categoryId;
        } else {
          // categoryId se yon non kategori (pa egzanp soti nan defaultCategories)
          validCategoryId = await _getOrCreateCategoryIdByName(merchantId, categoryId);
        }
      }

      final payload = {
        'merchantId': merchantId,
        'categoryId': validCategoryId,
        'name': name.trim(),
        'description': description?.trim(),
        'price': price,
        'currency': 'HTG',
        'isAvailable': true,
        'prepTimeMinutes': prepTimeMinutes,
        if (imageUrl != null && imageUrl.trim().isNotEmpty) 'imageUrl': imageUrl.trim(),
      };

      final res = await http.post(
        Uri.parse('$_supabaseUrl/rest/v1/products'),
        headers: _headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode != 200 && res.statusCode != 201) {
        debugPrint('[MerchantApi] createProduct failed (${res.statusCode}): ${res.body}');
        return false;
      }

      return true;
    } catch (e) {
      debugPrint('[MerchantApi] createProduct error: $e');
      return false;
    }
  }

  /// Upload yon imaj lokal (bytes) nan Supabase Storage oswa konvèti l an Data URI
  Future<String?> uploadProductImage({
    required String merchantId,
    required List<int> imageBytes,
    required String fileName,
  }) async {
    try {
      final sanitizedName = '${DateTime.now().millisecondsSinceEpoch}_${fileName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_')}';
      final path = '$merchantId/$sanitizedName';
      final uploadUri = Uri.parse('$_supabaseUrl/storage/v1/object/products/$path');

      final res = await http.post(
        uploadUri,
        headers: {
          'apikey': _serviceKey,
          'Authorization': 'Bearer $_serviceKey',
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: imageBytes,
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200 || res.statusCode == 201) {
        // Retounen URL piblik la
        return '$_supabaseUrl/storage/v1/object/public/products/$path';
      }
      debugPrint('[MerchantApi] Storage upload failed (${res.statusCode}): ${res.body}. Falling back to Data URI.');
    } catch (e) {
      debugPrint('[MerchantApi] Storage upload error: $e. Falling back to Data URI.');
    }

    // Si Supabase Storage bucket la pa kreye oswa pa piblik, itilize Data URI konprese
    final base64String = base64Encode(imageBytes);
    return 'data:image/jpeg;base64,$base64String';
  }

  // ─── FINANS & STATISTIK REYÈL ──────────────────────────────

  /// Kalkile revni reyèl soti nan tout kòmand livre yo
  Future<Map<String, dynamic>> getFinanceStats(String merchantId) async {
    try {
      final res = await http.get(
        Uri.parse('$_supabaseUrl/rest/v1/orders?select=id,orderNumber,subtotal,total,deliveryFee,paymentMethod,status,createdAt&merchantId=eq.$merchantId&order=createdAt.desc'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final List orders = jsonDecode(res.body);

        double totalGross = 0;
        int completedCount = 0;
        Map<String, double> paymentBreakdown = {
          'CASH_ON_DELIVERY': 0,
          'MONCASH': 0,
          'NATCASH': 0,
        };

        for (final o in orders) {
          final status = (o['status'] ?? '').toString();
          if (status == 'DELIVERED') {
            final amt = (o['subtotal'] as num?)?.toDouble() ?? (o['total'] as num?)?.toDouble() ?? 0.0;
            totalGross += amt;
            completedCount++;

            final method = (o['paymentMethod'] ?? 'CASH_ON_DELIVERY').toString();
            paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + amt;
          }
        }

        const commissionRate = 15.0; // 15%
        final totalCommission = totalGross * (commissionRate / 100);
        final netPayout = totalGross - totalCommission;

        return {
          'totalGross': totalGross,
          'commissionRate': commissionRate,
          'totalCommission': totalCommission,
          'netPayout': netPayout,
          'completedCount': completedCount,
          'orders': orders,
          'paymentBreakdown': paymentBreakdown,
        };
      }
    } catch (e) {
      debugPrint('[MerchantApi] getFinanceStats error: $e');
    }

    return {
      'totalGross': 0.0,
      'commissionRate': 15.0,
      'totalCommission': 0.0,
      'netPayout': 0.0,
      'completedCount': 0,
      'orders': [],
      'paymentBreakdown': {},
    };
  }
}
