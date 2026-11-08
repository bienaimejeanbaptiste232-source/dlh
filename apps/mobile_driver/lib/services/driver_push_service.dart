import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'driver_api_service.dart';
import 'driver_alert_service.dart';

/// Handler pou mesaj FCM yo ki resevwa nan background (top-level function obligatwa).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM] Background message: ${message.notification?.title}');
  // Jou son pa janm jwe nan background -- sistèm notifikasyon Android jere l
}

/// Sèvis notifikasyon push pou chofè.
/// Travay nan:
///  - Fon (background) via Firebase Cloud Messaging
///  - Premye plan (foreground) via overlay + son alèt
class DriverPushService {
  DriverPushService._();
  static final DriverPushService _i = DriverPushService._();
  factory DriverPushService() => _i;

  FirebaseMessaging get _fcm => FirebaseMessaging.instance;
  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Enisyalize FCM ak demann pèmisyon.
  Future<void> init({String? driverId}) async {
    // 1. Anrejistre background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 2. Demann pèmisyon (Android 13+)
    await _fcm.requestPermission(
      alert: true, badge: true, sound: true,
      provisional: false,
    );
    debugPrint('[FCM] Pèmisyon: aksepte.');

    // 3. Jwenn token FCM
    _fcmToken = await _fcm.getToken();
    debugPrint('[FCM] Token: $_fcmToken');

    // 4. Voye token bay backend pou enrejistre aparèy la
    if (_fcmToken != null && driverId != null) {
      await DriverApiService().registerFcmToken(
        driverId: driverId,
        token: _fcmToken!,
      );
    }

    // 5. Notifikasyon lè app nan premye plan (foreground)
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 6. Lè yo klike sou yon notifikasyon (app te fèmen / background)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // 7. Tcheke si app te louvri depi yon notifikasyon
    final initial = await _fcm.getInitialMessage();
    if (initial != null) _handleNotificationTap(initial);

    // 8. Token refresh
    _fcm.onTokenRefresh.listen((token) {
      _fcmToken = token;
      if (driverId != null) {
        DriverApiService().registerFcmToken(driverId: driverId, token: token);
      }
    });
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[FCM] Foreground: ${message.notification?.title}');
    final data = message.data;
    final type = data['type'] ?? '';

    if (type == 'NEW_ORDER' || type == 'MISSION_ASSIGNED') {
      // Jou son alèt chofè a menm jan pou dispatch WebSocket
      DriverAlertService().startOrderAlarm();
      // NB: UI a pral resevwa order via WebSocket tou -- FCM sèvi kòm backup
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('[FCM] Notifikasyon tap: ${message.notification?.title}');
    // Deep link routing handled by GoRouter if needed
  }

  Future<void> unregister(String driverId) async {
    await _fcm.deleteToken();
    _fcmToken = null;
  }
}
