import 'package:flutter/material.dart';

class MerchantConstants {
  static const String appName = 'Delivery Lakay Machann';
  static const String serverHost = String.fromEnvironment('SERVER_HOST', defaultValue: '192.168.43.156');
  static const String apiBaseUrl = 'http://$serverHost:4000/api/v1';
  static const String apiBaseUrlLocal = 'http://localhost:4000/api/v1';

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

  // ══════════════════════════════════════════════════════════════
  //  PALÈT KOULÈ — Web Client Design System Matched
  // ══════════════════════════════════════════════════════════════

  static const Color brandOrange       = Color(0xFFFF6000); // --primary #FF6000
  static const Color brandOrangeDark   = Color(0xFFE55200); // --primary-dark #E55200
  static const Color brandAmber        = Color(0xFFFFB800); // --amber #FFB800
  static const Color lightBg           = Color(0xFFF5F5F5); // --bg #F5F5F5
  static const Color lightCard         = Color(0xFFFFFFFF); // --card #FFFFFF
  static const Color lightCardElevated = Color(0xFFFFFFFF);
  static const Color textPrimary       = Color(0xFF0F172A); // --text-primary #0F172A
  static const Color textSecondary     = Color(0xFF334155); // --text-secondary #334155
  static const Color textMuted         = Color(0xFF64748B); // --text-muted #64748B
  static const Color successGreen      = Color(0xFF06C167); // --emerald #06C167
  static const Color electricCyan      = Color(0xFF6366F1); // --violet #6366F1
  static const Color borderLight       = Color(0xFFE5E7EB); // --border #E5E7EB
  static const Color borderMedium      = Color(0xFFCBD5E1);

  // Alyas retrokonpatibilite
  static const Color darkBg            = lightBg;
  static const Color darkCard          = lightCard;
  static const Color darkCardElevated  = lightCardElevated;
  static const Color darkCardGlass     = Color(0xF2FFFFFF);

  // Mwayen Peman
  static const Color monCashRed  = Color(0xFFEE2724);
  static const Color natCashBlue = Color(0xFF0066FF);

  // ══════════════════════════════════════════════════════════════
  //  GLASSMORPHISM TOKENS
  // ══════════════════════════════════════════════════════════════

  static const double blurLight  = 6.0;
  static const double blurMedium = 12.0;
  static const double blurStrong = 24.0;

  static const Color glassWhite      = Color(0xCCFFFFFF);
  static const Color glassWhiteSoft  = Color(0xB3FFFFFF);
  static const Color glassWhiteFrost = Color(0x80FFFFFF);
  static const Color glassOrange     = Color(0x1AFF6000);
  static const Color glassAmber      = Color(0x1AFFB800);
  static const Color glassGreen      = Color(0x1A06C167);
  static const Color glassDark       = Color(0x0A0F172A);

  static const Color glassBorder       = Color(0x33FFFFFF);
  static const Color glassBorderLight  = Color(0x4DE5E7EB);
  static const Color glassBorderOrange = Color(0x33FF6000);

  // RADIUS STANDADIZE
  static const double radiusSm  = 8.0;   // --r-sm
  static const double radiusMd  = 12.0;  // --r-md
  static const double radiusLg  = 16.0;  // --r-lg
  static const double radiusXl  = 20.0;  // --r-xl
  static const double radiusXxl = 24.0;  // --r-2xl

  // OMB STANDADIZE (Box Shadows)
  static const List<BoxShadow> shadowSm = [
    BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2)),
  ];
  static const List<BoxShadow> shadowMd = [
    BoxShadow(color: Color(0x10000000), blurRadius: 16, offset: Offset(0, 4)),
  ];
  static const List<BoxShadow> shadowLg = [
    BoxShadow(color: Color(0x12000000), blurRadius: 32, offset: Offset(0, 8)),
  ];
  static const List<BoxShadow> shadowOrange = [
    BoxShadow(color: Color(0x30FF6000), blurRadius: 20, offset: Offset(0, 4)),
  ];
  static const List<BoxShadow> shadowGlass = [
    BoxShadow(color: Color(0x0A000000), blurRadius: 20, offset: Offset(0, 8)),
    BoxShadow(color: Color(0x05000000), blurRadius: 40, offset: Offset(0, 16)),
  ];

  // GRADYE (Gradients)
  static const LinearGradient brandGradient = LinearGradient(
    colors: [Color(0xFFFF6000), Color(0xFFFF7A29)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient netPayoutGradient = LinearGradient(
    colors: [Color(0xFFFF6000), Color(0xFFE55200), Color(0xFF991B1B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient appBgGradient = LinearGradient(
    colors: [Color(0xFFF5F5F5), Color(0xFFF1F3F5), Color(0xFFF5F5F5)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient headerGlassGradient = LinearGradient(
    colors: [Color(0xFFFFF8F6), Color(0xFFFFFBEB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFAFBFC)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassCardGradient = LinearGradient(
    colors: [Color(0xE6FFFFFF), Color(0xB3FFFFFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient kitchenGlowGradient = LinearGradient(
    colors: [Color(0xFFFFF3EB), Color(0xFFFFE2D1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient readyGlowGradient = LinearGradient(
    colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Kontak & Sipò Delivery Haïti
  static const String supportPhone = '+50940553636';
  static const String supportPhoneDisplay = '+509 40 55 36 36';
  static const String supportWhatsApp = '50940553636';
}
