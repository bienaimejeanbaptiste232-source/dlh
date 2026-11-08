import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'constants.dart';

class MerchantTheme {
  static ThemeData get lightTheme {
    final baseText = GoogleFonts.outfitTextTheme(ThemeData.light().textTheme);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: MerchantConstants.lightBg,
      colorScheme: const ColorScheme.light(
        primary: MerchantConstants.brandOrange,
        secondary: MerchantConstants.brandAmber,
        surface: MerchantConstants.lightCard,
        error: Color(0xFFDC2626),
      ),
      textTheme: baseText.copyWith(
        displayLarge: baseText.displayLarge?.copyWith(fontWeight: FontWeight.w800, color: MerchantConstants.textPrimary, letterSpacing: -1),
        displayMedium: baseText.displayMedium?.copyWith(fontWeight: FontWeight.w800, color: MerchantConstants.textPrimary, letterSpacing: -0.5),
        headlineLarge: baseText.headlineLarge?.copyWith(fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary, letterSpacing: -0.5),
        headlineMedium: baseText.headlineMedium?.copyWith(fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary),
        titleLarge: baseText.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary, letterSpacing: -0.2),
        titleMedium: baseText.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: MerchantConstants.textPrimary),
        bodyLarge: baseText.bodyLarge?.copyWith(fontSize: 15, color: const Color(0xFF1E293B)),
        bodyMedium: baseText.bodyMedium?.copyWith(fontSize: 13, color: MerchantConstants.textSecondary),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: MerchantConstants.textPrimary),
        titleTextStyle: TextStyle(
          color: MerchantConstants.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: MerchantConstants.borderLight),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: MerchantConstants.brandOrange,
          foregroundColor: Colors.white,
          elevation: 1,
          shadowColor: MerchantConstants.brandOrange.withValues(alpha: 0.3),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.3,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: MerchantConstants.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: MerchantConstants.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: MerchantConstants.brandOrange, width: 1.5),
        ),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
      ),
      dividerTheme: const DividerThemeData(
        color: MerchantConstants.borderLight,
        thickness: 1,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        modalBackgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),
    );
  }

  static ThemeData get darkTheme => lightTheme;
}
