import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';
import '../models/models.dart';
import 'supabase_service.dart';

/// Service principal — délègue vers SupabaseService pour les données
/// et vers le backend NestJS pour les actions (auth, commandes)
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final _supabase = SupabaseService();

  String get baseUrl => AppConstants.apiBaseUrl;


  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
  }

  // ─── AUTH ──────────────────────────────────────────────────
  /// Login via NestJS backend (bcrypt + JWT)
  Future<Map<String, dynamic>?> login(String phone, String password) async {
    return _supabase.login(phone, password);
  }

  /// OTP Send (si implémenté dans le backend)
  Future<bool> sendOtp(String phone) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/otp/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      ).timeout(const Duration(seconds: 8));
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> verifyOtp(String phone, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/otp/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'code': code}),
      ).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final token = data['accessToken'] ?? data['data']?['accessToken'];
        if (token != null) await saveToken(token);
        return data;
      }
    } catch (e) {
      print('OTP verify error: $e');
    }
    return null;
  }

  // ─── MERCHANTS (→ Supabase) ────────────────────────────────
  Future<List<Merchant>> getMerchants({String? category}) async {
    return _supabase.getMerchants(type: category);
  }

  // ─── ORDERS ───────────────────────────────────────────────
  Future<Order?> createOrder({
    required String merchantId,
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> deliveryAddress,
    required String paymentMethod,
    double? deliveryFee,
    double? deliveryLatitude,
    double? deliveryLongitude,
    double? merchantLatitude,
    double? merchantLongitude,
  }) async {
    return _supabase.createOrder(
      merchantId: merchantId,
      items: items,
      deliveryAddress: deliveryAddress,
      paymentMethod: paymentMethod,
      customDeliveryFee: deliveryFee,
      deliveryLatitude: deliveryLatitude,
      deliveryLongitude: deliveryLongitude,
      merchantLatitude: merchantLatitude,
      merchantLongitude: merchantLongitude,
    );
  }

  /// Liste des commandes depuis Supabase
  Future<List<Order>> getMyOrders() async {
    return _supabase.getMyOrders();
  }

  /// Suivi en temps réel depuis Supabase
  Future<Order?> trackOrder(String orderId) async {
    return _supabase.trackOrder(orderId);
  }

  // ─── MONCASH PAYMENTS ──────────────────────────────────────
  static const List<String> _backendCandidates = [
    'http://localhost:4000/api/v1',
    'http://127.0.0.1:4000/api/v1',
    'http://10.233.230.178:4000/api/v1',
    'http://10.49.42.178:4000/api/v1',
    'http://10.0.2.2:4000/api/v1',
  ];

  /// Initie une session de paiement MonCash pour une commande
  Future<Map<String, dynamic>?> initiateMonCashPayment(
    String orderId, {
    double? amount,
    String? orderNumber,
  }) async {
    final token = await _supabase.getToken();
    for (final base in _backendCandidates) {
      try {
        final response = await http.post(
          Uri.parse('$base/payments/moncash/initiate'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'orderId': orderId,
            if (amount != null && amount > 0) 'amount': amount,
            if (orderNumber != null) 'orderNumber': orderNumber,
          }),
        ).timeout(const Duration(seconds: 8));

        if (response.statusCode == 200 || response.statusCode == 201) {
          final res = jsonDecode(response.body);
          return res['data'] ?? res;
        }
      } catch (_) {
        // eseye pwochen url
      }
    }
    return null;
  }

  /// Vérifie et confirme un paiement MonCash après retour utilisateur
  Future<Map<String, dynamic>?> verifyMonCashPayment(String orderId, {String? transactionId}) async {
    final token = await _supabase.getToken();
    for (final base in _backendCandidates) {
      try {
        final response = await http.post(
          Uri.parse('$base/payments/moncash/verify'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'orderId': orderId,
            if (transactionId != null && transactionId.isNotEmpty) 'transactionId': transactionId,
          }),
        ).timeout(const Duration(seconds: 10));

        if (response.statusCode == 200 || response.statusCode == 201) {
          final res = jsonDecode(response.body);
          return res['data'] ?? res;
        }
      } catch (_) {
        // eseye pwochen url
      }
    }
    return null;
  }

  /// Récupère le statut actuel du paiement MonCash
  Future<Map<String, dynamic>?> getPaymentStatus(String orderId) async {
    final token = await _supabase.getToken();
    for (final base in _backendCandidates) {
      try {
        final response = await http.get(
          Uri.parse('$base/payments/status/$orderId'),
          headers: {
            if (token != null) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));

        if (response.statusCode == 200) {
          final res = jsonDecode(response.body);
          return res['data'] ?? res;
        }
      } catch (_) {}
    }
    return null;
  }
}

