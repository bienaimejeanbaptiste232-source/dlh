import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/theme.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisyalize done lokalize pou intl (evite LocaleDataException)
  await initializeDateFormatting('fr', null);
  await initializeDateFormatting('fr_HT', null);

  final prefs = await SharedPreferences.getInstance();
  final hasSession = prefs.getString('merchant_token') != null ||
      prefs.getString('merchant_profile') != null;

  runApp(
    ProviderScope(
      child: DeliveryHaitiMerchantApp(startWithDashboard: hasSession),
    ),
  );
}

class DeliveryHaitiMerchantApp extends StatelessWidget {
  final bool startWithDashboard;
  const DeliveryHaitiMerchantApp({super.key, this.startWithDashboard = false});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Delivery Haïti Machann',
      debugShowCheckedModeBanner: false,
      theme: MerchantTheme.lightTheme,

      // Sipò lokalizasyon pou dat, MoneyFormat, elatriye
      locale: const Locale('fr', 'HT'),
      supportedLocales: const [
        Locale('fr', 'HT'),
        Locale('fr'),
        Locale('en'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      home: SplashScreen(hasSession: startWithDashboard),
    );
  }
}
