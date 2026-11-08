import 'package:flutter/material.dart';

class DriverConstants {
  static const String appName = 'Delivery Haïti Chofè';
  static const String appTagline = 'Livrez vite, vivez mieux';

  // ─── API Backend NestJS ──────────────────────────────────────
  static const String apiBaseUrl = 'http://127.0.0.1:4000/api/v1';
  static const String apiBaseUrlLocal = 'http://localhost:4000/api/v1';
  static const String socketUrl = 'http://127.0.0.1:4000';
  static const String socketUrlLocal = 'http://localhost:4000';

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

  static const String currency = 'HTG';
  static const String currencySymbol = 'Gdes';

  // ─── PALÈT KOULÈ MENM JAN AK KLIYAN AN (DoorDash Flame Crimson & Pure White) ──
  static const Color primaryCrimson = Color(0xFFEB1700); // Wouj DoorDash Dinamik
  static const Color primaryOrange = Color(0xFFFF5630);  // Koral Klere
  static const Color accentDark = Color(0xFF191919);     // Nwa Chabon
  static const Color neonGreen = Color(0xFF06C167);      // Vèt Siksè / Sou Liy
  static const Color alertOrange = Color(0xFFFF5630);
  static const Color urgentRed = Color(0xFFEB1700);
  static const Color goldAccent = Color(0xFFFFB800);

  // Canvas & Surfaces Lumineuses (Menm jan ak Mobile Client)
  static const Color backgroundLight = Color(0xFFF8F9FA); // Fon prensipal klè
  static const Color cardLight = Color(0xFFFFFFFF);       // Kat blanc pur
  static const Color borderLight = Color(0xFFE2E8F0);     // Fini bordi fen
  static const Color textDark = Color(0xFF191919);        // Tèks nwa
  static const Color textMuted = Color(0xFF64748B);       // Tèks segondè

  // Aliases pou konpatibilite
  static const Color darkBg = Color(0xFFF8F9FA);
  static const Color darkCard = Color(0xFFFFFFFF);
  static const Color darkBorder = Color(0xFFE2E8F0);

  // Mwayen Peman Ayiti (MonCash & Natcash)
  static const Color monCashRed = Color(0xFFFF1E46);
  static const Color natcashBlue = Color(0xFF0066FF);

  // Gradyan DoorDash Signature
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryCrimson, primaryOrange],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
