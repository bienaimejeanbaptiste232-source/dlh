import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'Delivery Lakay Haiti';
  static const String appTagline = 'Pi rapid * Pi fyab * Tout kote';

  // ─── API Backend NestJS ──────────────────────────────────────
  // Lè w sou menm rezo Wi-Fi ak òdinatè a, li konekte dirèkteman sou IP lokal sa a:
  static const String serverHost = String.fromEnvironment('SERVER_HOST', defaultValue: 'delivery-haiti-api.onrender.com');
  static const String apiBaseUrl = 'https://$serverHost/api/v1';
  static const String apiBaseUrlLocal = 'https://delivery-haiti-api.onrender.com/api/v1';

  // ─── Supabase ────────────────────────────────────────────────
  static const String supabaseUrl = 'https://xwmxgpdkmrzoraibdzrf.supabase.co';

  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjA2MTMsImV4cCI6MjEwNjk5NjYxM30'
      '.RdYRJkWOuTKcCKjLEXOCB88mzm8fzULPwEu_L0kAwgc';

  static const String supabaseServiceKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ'
      '.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU';

  // ─── Devise & Localisation ───────────────────────────────────
  static const String currency = 'HTG';
  static const String currencySymbol = 'Gdes';
  static const String defaultCity = 'Cap-Haïtien';

  // ─── Opérateurs Télécoms Haïti ───────────────────────────────
  static const List<String> digicelPrefixes = ['34', '36', '37', '38', '39', '44', '46', '47', '48', '49'];
  static const List<String> natcomPrefixes = ['31', '32', '33', '40', '41', '42', '43'];

  // ─── Palette Couleurs Pro (DoorDash & Uber Eats Light Mode Tier) ─
  // Canvas & Surfaces Lumineuses (Pure White & Subtle Off-White)
  static const Color backgroundDark = Color(0xFFF8F9FA); // Canvas principal clair
  static const Color backgroundDeep = Color(0xFFF1F3F5); // Fond secondaire
  static const Color cardDark = Color(0xFFFFFFFF);       // Cartes blanc pur
  static const Color cardElevated = Color(0xFFFFFFFF);
  static const Color surfaceGlass = Color(0xFFFFFFFF);
  static const Color borderSubtle = Color(0xFFE2E8F0);   // Bordures subtiles
  static const Color textPrimaryDark = Color(0xFF191919); // Texte principal foncé
  static const Color textSecondaryMuted = Color(0xFF64748B); // Texte secondaire

  // Couleurs de marque dynamiques (Signature DoorDash Flame Crimson & Coral Glow)
  static const Color primaryCrimson = Color(0xFFFF6600); // Alibaba Deep Crimson
  static const Color primaryOrange = Color(0xFFFF6600);  // Alibaba Flame Orange
  static const Color primaryBlue = Color(0xFF1E3A8A);

  // Accents Néo & Tracking (Standard US)
  static const Color accentCyan = Color(0xFF00B4D8);
  static const Color accentEmerald = Color(0xFF06C167); // Uber Eats Iconic Emerald
  static const Color accentAmber = Color(0xFFFFB800);  // Gold Star Rating
  static const Color accentViolet = Color(0xFF6366F1);
  static const Color goldAccent = Color(0xFFFFB800);
  static const Color successGreen = Color(0xFF06C167);

  // Paiement Haïti
  static const Color monCashRed = Color(0xFFFF1E46);
  static const Color natcashBlue = Color(0xFF0066FF);

  // Dégradés Glass & Tactile
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryCrimson, primaryOrange],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassOverlayGradient = LinearGradient(
    colors: [
      Color(0x22FFFFFF),
      Color(0x06FFFFFF),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient bannerHaitiGradient = LinearGradient(
    colors: [
      Color(0xFFE52504),
      Color(0xFF8B1200),
      Color(0xFF161922),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ─── Kontak & Sipò Delivery Haïti ────────────────────────────
  static const String supportPhone = '+50940553636';
  static const String supportPhoneDisplay = '+509 40 55 36 36';
  static const String supportWhatsApp = '50940553636';
}

