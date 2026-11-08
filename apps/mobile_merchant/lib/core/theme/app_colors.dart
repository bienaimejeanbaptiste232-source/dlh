import 'package:flutter/material.dart';

/// DLH — Delivery Lakay Haïti — Palèt koulè ofisyèl
class DLHColors {
  DLHColors._();

  // ── Fon ak Primiè ─────────────────────────────────────────────
  static const Color dlhNavy          = Color(0xFF0A1628); // AppBar, Banner fond
  static const Color dlhRed           = Color(0xFFE63946); // Rouge DLH bouton/accent
  static const Color dlhGreen         = Color(0xFF2ECC71); // Vert = Livre
  static const Color dlhOrange        = Color(0xFFF39C12); // Orange = En cours
  static const Color dlhBlue          = Color(0xFF3498DB); // Bleu = Sou wout
  static const Color dlhPurple        = Color(0xFF9B59B6); // Violet = Konfime

  // ── Fond ak Kart ─────────────────────────────────────────────
  static const Color dlhBg            = Color(0xFFF5F7FA); // Fond général
  static const Color dlhCard          = Color(0xFFFFFFFF); // Fond carte

  // ── Tèks ─────────────────────────────────────────────────────
  static const Color dlhTextPrimary   = Color(0xFF1A1A2E); // Tèks prensipal
  static const Color dlhTextSecondary = Color(0xFF64748B); // Tèks segondè

  // ── Bòd ──────────────────────────────────────────────────────
  static const Color dlhBorder        = Color(0xFFE2E8F0);

  // ── Omb (Shadows) ────────────────────────────────────────────
  static const List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0x0F000000),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> navShadow = [
    BoxShadow(
      color: Color(0x14000000),
      blurRadius: 20,
      offset: Offset(0, -4),
    ),
  ];
}
