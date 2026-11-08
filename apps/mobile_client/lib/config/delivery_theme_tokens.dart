import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ─────────────────────────────────────────────────────────────────────────────
/// TIP SÈVIS LIVREZON (Service Modes)
/// ─────────────────────────────────────────────────────────────────────────────
enum DeliveryServiceCategory {
  /// 1. Livrezon Manje (Dinamik & Apetisan)
  food,

  /// 2. Pake & Lojistik (Konfyans & Pwofesyonèl)
  logistics,

  /// 3. Makèt & Pwodwi Fre (Ekolojik & Sante)
  grocery,

  /// 4. Livrezon Modèn (Teknoloji & Jèn)
  modern,
}

/// ─────────────────────────────────────────────────────────────────────────────
/// DESIGN TOKENS - PWOPRIYETE KOULÈ CHAK TÈM
/// ─────────────────────────────────────────────────────────────────────────────
@immutable
class DeliveryColorTokens extends ThemeExtension<DeliveryColorTokens> {
  final DeliveryServiceCategory category;
  final String title;
  final Color primary;
  final Color accentButton;
  final Color background;
  final Color cardSurface;
  final Color textPrimary;
  final Color textSecondary;
  final Color borderSubtle;
  final LinearGradient primaryGradient;
  final LinearGradient heroGradient;
  final List<BoxShadow> softShadow;

  const DeliveryColorTokens({
    required this.category,
    required this.title,
    required this.primary,
    required this.accentButton,
    required this.background,
    required this.cardSurface,
    required this.textPrimary,
    required this.textSecondary,
    required this.borderSubtle,
    required this.primaryGradient,
    required this.heroGradient,
    required this.softShadow,
  });

  // ─── 1. LIVREZON MANJE (Dinamik & Manje - DoorDash Style) ───────
  // --- 1. LIVREZON ALIBABA STYLE (Dinamik & Koulè Cho) ---
  // Koulè Prensipal: #FF5000 (Alibaba Flame Orange)
  // Bouton ak Aksan: #E11D48 (Crimson Klere)
  // Fon (Background): #F3F4F6
  static const foodTokens = DeliveryColorTokens(
    category: DeliveryServiceCategory.food,
    title: 'Livrezon Manje',
    primary: Color(0xFFFF6600),
    accentButton: Color(0xFFFF6600),
    background: Color(0xFFF3F4F6),
    cardSurface: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF64748B),
    borderSubtle: Color(0xFFE2E8F0),
    primaryGradient: LinearGradient(
      colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    heroGradient: LinearGradient(
      colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    softShadow: [
      BoxShadow(
        color: Color(0x22FF5000),
        blurRadius: 16,
        offset: Offset(0, 6),
      ),
    ],
  );

  // ─── 2. PAKE AK LOJISTIK (Konfyans & Pwofesyonèl) ───────────────
  // Koulè Prensipal: #0B3C95 (Ble Rwayal)
  // Bouton ak Aksan: #FFD200 (Jòn Klere)
  // Fon (Background): #F4F6F9 (Gri Klè)
  static const logisticsTokens = DeliveryColorTokens(
    category: DeliveryServiceCategory.logistics,
    title: 'Pake ak Lojistik',
    primary: Color(0xFF0B3C95),
    accentButton: Color(0xFFFFD200),
    background: Color(0xFFF4F6F9),
    cardSurface: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF475569),
    borderSubtle: Color(0xFFE2E8F0),
    primaryGradient: LinearGradient(
      colors: [Color(0xFF0B3C95), Color(0xFF1E5BBF)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    heroGradient: LinearGradient(
      colors: [Color(0xFF0B3C95), Color(0xFF062561)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    softShadow: [
      BoxShadow(
        color: Color(0x1A0B3C95),
        blurRadius: 18,
        offset: Offset(0, 8),
      ),
    ],
  );

  // ─── 3. MAKÈT AK PWODWI FRE (Ekolojik & Sante) ───────────────────
  // Koulè Prensipal: #10B981 (Vèt Sante)
  // Bouton ak Aksan: #111827 (Nwa Pwofon)
  // Fon (Background): #FFFFFF (Blan Pi)
  static const groceryTokens = DeliveryColorTokens(
    category: DeliveryServiceCategory.grocery,
    title: 'Makèt ak Pwodwi Fre',
    primary: Color(0xFF10B981),
    accentButton: Color(0xFF111827),
    background: Color(0xFFFFFFFF),
    cardSurface: Color(0xFFF9FAFB),
    textPrimary: Color(0xFF111827),
    textSecondary: Color(0xFF4B5563),
    borderSubtle: Color(0xFFE5E7EB),
    primaryGradient: LinearGradient(
      colors: [Color(0xFF10B981), Color(0xFF34D399)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    heroGradient: LinearGradient(
      colors: [Color(0xFF10B981), Color(0xFF059669)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    softShadow: [
      BoxShadow(
        color: Color(0x1810B981),
        blurRadius: 16,
        offset: Offset(0, 6),
      ),
    ],
  );

  // ─── 4. LIVREZON MODÈN (Teknoloji & Jèn) ─────────────────────────
  // Koulè Prensipal: #7C3AED (Mov Flash)
  // Bouton ak Aksan: #1E1B4B (Indigo Fonse)
  // Fon (Background): #FAF5FF (Blan Mov Klè)
  static const modernTokens = DeliveryColorTokens(
    category: DeliveryServiceCategory.modern,
    title: 'Livrezon Modèn',
    primary: Color(0xFF7C3AED),
    accentButton: Color(0xFF1E1B4B),
    background: Color(0xFFFAF5FF),
    cardSurface: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF1E1B4B),
    textSecondary: Color(0xFF6B7280),
    borderSubtle: Color(0xFFE9D5FF),
    primaryGradient: LinearGradient(
      colors: [Color(0xFF7C3AED), Color(0xFFA78BFA)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    heroGradient: LinearGradient(
      colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    softShadow: [
      BoxShadow(
        color: Color(0x187C3AED),
        blurRadius: 18,
        offset: Offset(0, 6),
      ),
    ],
  );

  @override
  DeliveryColorTokens copyWith({
    DeliveryServiceCategory? category,
    String? title,
    Color? primary,
    Color? accentButton,
    Color? background,
    Color? cardSurface,
    Color? textPrimary,
    Color? textSecondary,
    Color? borderSubtle,
    LinearGradient? primaryGradient,
    LinearGradient? heroGradient,
    List<BoxShadow>? softShadow,
  }) {
    return DeliveryColorTokens(
      category: category ?? this.category,
      title: title ?? this.title,
      primary: primary ?? this.primary,
      accentButton: accentButton ?? this.accentButton,
      background: background ?? this.background,
      cardSurface: cardSurface ?? this.cardSurface,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      primaryGradient: primaryGradient ?? this.primaryGradient,
      heroGradient: heroGradient ?? this.heroGradient,
      softShadow: softShadow ?? this.softShadow,
    );
  }

  @override
  DeliveryColorTokens lerp(ThemeExtension<DeliveryColorTokens>? other, double t) {
    if (other is! DeliveryColorTokens) return this;
    return DeliveryColorTokens(
      category: t < 0.5 ? category : other.category,
      title: t < 0.5 ? title : other.title,
      primary: Color.lerp(primary, other.primary, t)!,
      accentButton: Color.lerp(accentButton, other.accentButton, t)!,
      background: Color.lerp(background, other.background, t)!,
      cardSurface: Color.lerp(cardSurface, other.cardSurface, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      primaryGradient: LinearGradient.lerp(primaryGradient, other.primaryGradient, t)!,
      heroGradient: LinearGradient.lerp(heroGradient, other.heroGradient, t)!,
      softShadow: softShadow,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────────
/// FABRIKASYON TÈM COMPLETE (ThemeData Generator pou chak mòd)
/// ─────────────────────────────────────────────────────────────────────────────
class DeliveryThemeTokens {
  static ThemeData buildTheme(DeliveryColorTokens tokens) {
    final isDark = tokens.background.computeLuminance() < 0.2;
    final brightness = isDark ? Brightness.dark : Brightness.light;

    // Detèmine koulè tèks bouton an selon luminozite bouton an
    final isAccentLight = tokens.accentButton.computeLuminance() > 0.5;
    final buttonTextColor = isAccentLight ? const Color(0xFF0F172A) : Colors.white;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: tokens.background,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: tokens.primary,
        onPrimary: tokens.primary.computeLuminance() > 0.5 ? Colors.black : Colors.white,
        secondary: tokens.accentButton,
        onSecondary: buttonTextColor,
        surface: tokens.cardSurface,
        onSurface: tokens.textPrimary,
        error: Colors.redAccent,
        onError: Colors.white,
      ),
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        brightness == Brightness.dark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
      ).apply(
        bodyColor: tokens.textPrimary,
        displayColor: tokens.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: tokens.textPrimary),
        titleTextStyle: TextStyle(
          color: tokens.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: tokens.cardSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: tokens.borderSubtle, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: tokens.accentButton,
          foregroundColor: buttonTextColor,
          elevation: isDark ? 4 : 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: tokens.primary,
          side: BorderSide(color: tokens.primary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: tokens.cardSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: tokens.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: tokens.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: tokens.primary, width: 2.0),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        hintStyle: TextStyle(color: tokens.textSecondary, fontSize: 14),
      ),
      extensions: [tokens],
    );
  }

  /// Tèm pare pou itilize:
  static ThemeData get foodTheme => buildTheme(DeliveryColorTokens.foodTokens);
  static ThemeData get logisticsTheme => buildTheme(DeliveryColorTokens.logisticsTokens);
  static ThemeData get groceryTheme => buildTheme(DeliveryColorTokens.groceryTokens);
  static ThemeData get modernTheme => buildTheme(DeliveryColorTokens.modernTokens);

  /// Seleksyone tèm selon kategori a
  static ThemeData themeFor(DeliveryServiceCategory category) {
    switch (category) {
      case DeliveryServiceCategory.food:
        return foodTheme;
      case DeliveryServiceCategory.logistics:
        return logisticsTheme;
      case DeliveryServiceCategory.grocery:
        return groceryTheme;
      case DeliveryServiceCategory.modern:
        return modernTheme;
    }
  }

  /// Pratik helper pou jwenn tokens nan context
  static DeliveryColorTokens of(BuildContext context) {
    final tokens = Theme.of(context).extension<DeliveryColorTokens>();
    return tokens ?? DeliveryColorTokens.foodTokens;
  }
}
