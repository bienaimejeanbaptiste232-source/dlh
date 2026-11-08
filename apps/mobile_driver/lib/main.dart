import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'config/theme.dart';
import 'providers/driver_providers.dart';
import 'screens/driver_home_screen.dart';
import 'screens/driver_login_screen.dart';
import 'services/driver_offline_queue.dart';
import 'services/driver_push_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Firebase & FCM Push Service ──────────────────────────────────────────
  try {
    await Firebase.initializeApp();
    await DriverPushService().init();
  } catch (e) {
    debugPrint('[Main] Firebase init note: $e');
  }

  // ── Ofline Queue — ekute koneksyon chanjman ───────────────────────────
  DriverOfflineQueue().init();

  final prefs = await SharedPreferences.getInstance();
  final hasToken = prefs.getString('driver_token') != null;

  runApp(
    ProviderScope(
      child: DeliveryHaitiDriverApp(hasLoggedInUser: hasToken),
    ),
  );
}

class DeliveryHaitiDriverApp extends ConsumerWidget {
  final bool hasLoggedInUser;
  const DeliveryHaitiDriverApp({super.key, this.hasLoggedInUser = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (hasLoggedInUser) {
      ref.read(currentDriverProfileProvider.notifier).refreshFromStorage();
    }

    return MaterialApp(
      title: 'Delivery Haïti Chofè',
      debugShowCheckedModeBanner: false,
      theme: DriverTheme.darkTheme,
      home: hasLoggedInUser ? const DriverHomeScreen() : const DriverLoginScreen(),
    );
  }
}
