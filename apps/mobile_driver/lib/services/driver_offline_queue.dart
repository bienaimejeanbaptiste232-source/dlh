import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'driver_api_service.dart';

/// Kèk aksyon chofè pandan pa gen entènèt.
/// Yo kenbe nan SharedPreferences epi senkronize otomatik lè koneksyon revi.
class DriverOfflineQueue {
  DriverOfflineQueue._();
  static final DriverOfflineQueue _i = DriverOfflineQueue._();
  factory DriverOfflineQueue() => _i;

  static const _key = 'dlh_driver_offline_queue';
  StreamSubscription? _sub;
  bool _isSyncing = false;

  /// Kòmanse ekute chanjman koneksyon.
  void init() {
    _sub?.cancel();
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      final hasNet = results.any((r) => r != ConnectivityResult.none);
      if (hasNet) _flushQueue();
    });
  }

  void dispose() { _sub?.cancel(); }

  /// Ajoute yon aksyon nan kèk — sove anvan yo poste.
  Future<void> enqueue({
    required String type,   // 'PICKUP' | 'DELIVERY' | 'ACCEPT' | 'LOCATION'
    required String orderId,
    Map<String, dynamic>? extra,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    raw.add(jsonEncode({
      'type': type,
      'orderId': orderId,
      'extra': extra ?? {},
      'ts': DateTime.now().toIso8601String(),
    }));
    await prefs.setStringList(_key, raw);
    debugPrint('[OfflineQueue] Aksyon anrejistre: $type #$orderId');
  }

  /// Konbyen aksyon ki an atant.
  Future<int> pendingCount() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? []).length;
  }

  /// Voye tout aksyon an atant bay backend a.
  Future<void> _flushQueue() async {
    if (_isSyncing) return;
    _isSyncing = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getStringList(_key) ?? [];
      if (raw.isEmpty) { _isSyncing = false; return; }

      debugPrint('[OfflineQueue] Senkronizasyon ${raw.length} aksyon...');
      final api = DriverApiService();
      final failed = <String>[];

      for (final item in raw) {
        try {
          final data = jsonDecode(item) as Map<String, dynamic>;
          final type    = data['type'] as String;
          final orderId = data['orderId'] as String;
          bool ok = false;

          if (type == 'PICKUP')    ok = await api.confirmPickup(orderId);
          if (type == 'DELIVERY')  ok = await api.confirmDelivery(orderId);
          if (type == 'ACCEPT')    ok = await api.acceptMission(orderId);
          if (type == 'LOCATION') {
            final lat = (data['extra']['lat'] as num?)?.toDouble() ?? 0;
            final lng = (data['extra']['lng'] as num?)?.toDouble() ?? 0;
            ok = await api.updateDriverLocation(
              driverId: data['extra']['driverId'] as String,
              latitude: lat, longitude: lng, status: 'ONLINE',
            );
          }
          if (!ok) failed.add(item);
        } catch (e) {
          failed.add(item);
        }
      }

      await prefs.setStringList(_key, failed);
      debugPrint('[OfflineQueue] Fini: ${raw.length - failed.length} reyisi, ${failed.length} echwe');
    } finally {
      _isSyncing = false;
    }
  }

  /// Deklancha manyèlman (pa egzanp, bouton "Senkronize" nan UI).
  Future<void> forceFlush() => _flushQueue();
}
