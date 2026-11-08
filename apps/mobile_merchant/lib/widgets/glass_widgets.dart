import 'dart:ui';
import 'package:flutter/material.dart';
import '../config/constants.dart';

// ════════════════════════════════════════════════════════════════
//  GLASS WIDGETS — Bibliyotèk Glassmorphism Merchant App
//
//  Kijan pou sèvi yo:
//
//  1. GlassCard        — kat solid ak efè vè standad
//  2. GlassContainer   — kontenè transparan ak BackdropFilter
//  3. GlassButton      — bouton ak efè vè
//  4. GlassChip        — badge/chip tèks
//  5. GlassBadge       — ti badge chifrè (ex: '3 kòmand')
//  6. GlassNavBar      — bar navigasyon an ba paj
//  7. GlassAppBar      — app bar an tèt paj
//  8. GlassModal       — fon modal / bottom sheet
//  9. GlassKpiCard     — kat KPI/statistik
// 10. AppBackground    — fon paj avèk gradye
//
//  Egzanp rapid:
//    GlassCard(child: Text('Bonjou'))
//    GlassContainer(blur: MerchantConstants.blurMedium, child: ...)
// ════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// 1. GlassCard — kat solid ki sipòte blur (simpl epi solid)
// ────────────────────────────────────────────────────────────────

/// Kat glassmorphism solid pou itilize sou fon klè.
/// Pa bezwen BackdropFilter — pi vit, pi senp.
/// Sèvi li pou KPI, kòmand kat, finans seksyon, elatriye.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
    this.borderRadius,
    this.color = MerchantConstants.glassWhite,
    this.border,
    this.boxShadow = MerchantConstants.shadowMd,
    this.gradient,
    this.width,
    this.height,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final double? borderRadius;
  final Color color;
  final BoxBorder? border;
  final List<BoxShadow> boxShadow;
  final Gradient? gradient;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? MerchantConstants.radiusMd;
    return Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? color : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(radius),
        border: border ??
            Border.all(color: MerchantConstants.glassBorderLight, width: 1),
        boxShadow: boxShadow,
      ),
      child: child,
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 2. GlassContainer — efè vè reyèl ak BackdropFilter
// ────────────────────────────────────────────────────────────────

/// Kontenè glassmorphism vrè ak BackdropFilter (blur background).
/// Sèvi li pou overlays, modals, header, nav bar.
/// ⚠️ Pi koute CPU — pa ajoute twòp nan yon sèl paj.
class GlassContainer extends StatelessWidget {
  const GlassContainer({
    super.key,
    required this.child,
    this.blur = MerchantConstants.blurMedium,
    this.color = MerchantConstants.glassWhiteSoft,
    this.borderRadius,
    this.border,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
    this.boxShadow = MerchantConstants.shadowGlass,
    this.gradient,
    this.width,
    this.height,
    this.clipBehavior = Clip.antiAlias,
  });

  final Widget child;
  final double blur;
  final Color color;
  final double? borderRadius;
  final BoxBorder? border;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final List<BoxShadow> boxShadow;
  final Gradient? gradient;
  final double? width;
  final double? height;
  final Clip clipBehavior;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? MerchantConstants.radiusMd;
    return Container(
      width: width,
      height: height,
      margin: margin,
      clipBehavior: clipBehavior,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        boxShadow: boxShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: gradient == null ? color : null,
              gradient: gradient,
              borderRadius: BorderRadius.circular(radius),
              border: border ??
                  Border.all(color: MerchantConstants.glassBorderLight),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 3. GlassButton — bouton ak efè vè
// ────────────────────────────────────────────────────────────────

/// Bouton glassmorphism avèk tap animation.
class GlassButton extends StatelessWidget {
  const GlassButton({
    super.key,
    required this.onTap,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
    this.color = MerchantConstants.glassWhiteSoft,
    this.borderColor = MerchantConstants.glassBorderLight,
    this.borderRadius,
    this.blur = MerchantConstants.blurLight,
    this.boxShadow = MerchantConstants.shadowSm,
  });

  final VoidCallback onTap;
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Color borderColor;
  final double? borderRadius;
  final double blur;
  final List<BoxShadow> boxShadow;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? MerchantConstants.radiusMd;
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(radius),
              border: Border.all(color: borderColor),
              boxShadow: boxShadow,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 4. GlassChip — chip / badge seleksyon
// ────────────────────────────────────────────────────────────────

/// Chip pou filtre, tab, oswa kategori. Sipòte eta seleksyone/dezaktive.
class GlassChip extends StatelessWidget {
  const GlassChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.icon,
    this.selectedColor = MerchantConstants.brandOrange,
    this.selectedTextColor = Colors.white,
    this.unselectedColor = MerchantConstants.glassWhiteSoft,
    this.unselectedTextColor = MerchantConstants.textSecondary,
    this.blur = MerchantConstants.blurLight,
    this.borderRadius,
    this.padding = const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    this.fontSize = 12,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final IconData? icon;
  final Color selectedColor;
  final Color selectedTextColor;
  final Color unselectedColor;
  final Color unselectedTextColor;
  final double blur;
  final double? borderRadius;
  final EdgeInsetsGeometry padding;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? MerchantConstants.radiusMd;
    final textColor = isSelected ? selectedTextColor : unselectedTextColor;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: padding,
        decoration: BoxDecoration(
          color: isSelected ? selectedColor : unselectedColor,
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(
            color: isSelected
                ? selectedColor
                : MerchantConstants.glassBorderLight,
          ),
          boxShadow: isSelected ? MerchantConstants.shadowOrange : MerchantConstants.shadowSm,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: fontSize + 2, color: textColor),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: fontSize,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 5. GlassBadge — ti badge chifrè (notifikasyon)
// ────────────────────────────────────────────────────────────────

/// Yon ti badge pou montre yon chifrè (kòmand, notif, elatriye).
class GlassBadge extends StatelessWidget {
  const GlassBadge({
    super.key,
    required this.count,
    this.color = MerchantConstants.brandOrange,
    this.textColor = Colors.white,
    this.size = 20,
    this.fontSize = 10,
  });

  final int count;
  final Color color;
  final Color textColor;
  final double size;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox.shrink();
    return AnimatedScale(
      duration: const Duration(milliseconds: 200),
      scale: 1.0,
      child: Container(
        constraints: BoxConstraints(minWidth: size, minHeight: size),
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(size / 2),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.35),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: Text(
            count > 99 ? '99+' : '$count',
            style: TextStyle(
              color: textColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 6. GlassNavBar — NavigationBar glassmorphism
// ────────────────────────────────────────────────────────────────

/// Wrapper pou bottomNavigationBar ak efè vè.
/// Mete l kòm `bottomNavigationBar:` nan Scaffold.
class GlassNavBar extends StatelessWidget {
  const GlassNavBar({
    super.key,
    required this.child,
    this.blur = MerchantConstants.blurStrong,
    this.color = MerchantConstants.glassWhite,
    this.borderColor = MerchantConstants.glassBorderLight,
  });

  final Widget child;
  final double blur;
  final Color color;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: color,
            border: Border(top: BorderSide(color: borderColor)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 16,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 7. GlassAppBar — PreferredSizeWidget ak efè vè
// ────────────────────────────────────────────────────────────────

/// AppBar glassmorphism pou sèvi kòm `appBar:` nan Scaffold.
class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  const GlassAppBar({
    super.key,
    required this.child,
    this.height = kToolbarHeight,
    this.blur = MerchantConstants.blurStrong,
    this.color = MerchantConstants.glassWhite,
    this.borderColor = MerchantConstants.glassBorderLight,
    this.padding = const EdgeInsets.symmetric(horizontal: 16),
  });

  final Widget child;
  final double height;
  final double blur;
  final Color color;
  final Color borderColor;
  final EdgeInsetsGeometry padding;

  @override
  Size get preferredSize => Size.fromHeight(height);

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          height: height + topPadding,
          padding: padding.add(EdgeInsets.only(top: topPadding)),
          decoration: BoxDecoration(
            color: color,
            border: Border(bottom: BorderSide(color: borderColor)),
          ),
          child: child,
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 8. GlassModal — fon pou BottomSheet / Dialog
// ────────────────────────────────────────────────────────────────

/// Wrapper pou modal / bottom sheet ak efè vè.
/// Mete l kòm child dirèk nan showModalBottomSheet builder.
class GlassModal extends StatelessWidget {
  const GlassModal({
    super.key,
    required this.child,
    this.blur = MerchantConstants.blurStrong,
    this.color = MerchantConstants.glassWhite,
    this.topRadius = MerchantConstants.radiusXxl,
    this.padding = const EdgeInsets.fromLTRB(20, 8, 20, 24),
  });

  final Widget child;
  final double blur;
  final Color color;
  final double topRadius;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.vertical(top: Radius.circular(topRadius)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.vertical(top: Radius.circular(topRadius)),
            border: const Border(
              top: BorderSide(color: MerchantConstants.glassBorderLight),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 9. GlassKpiCard — kat statistik / KPI
// ────────────────────────────────────────────────────────────────

/// Kat KPI pou dashboard — sipòte tit, valè, ikonn, koulè.
class GlassKpiCard extends StatelessWidget {
  const GlassKpiCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.blur = 0,           // 0 = san BackdropFilter (plus rapide)
    this.useBlur = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final double blur;
  final bool useBlur;

  @override
  Widget build(BuildContext context) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(MerchantConstants.radiusSm),
              ),
              child: Icon(icon, color: color, size: 13),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: MerchantConstants.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: color,
            letterSpacing: -0.5,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );

    if (useBlur) {
      return Expanded(
        child: GlassContainer(
          blur: blur,
          color: MerchantConstants.glassWhite,
          borderRadius: MerchantConstants.radiusMd,
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: MerchantConstants.shadowSm,
          child: content,
        ),
      );
    }

    return Expanded(
      child: GlassCard(
        color: Colors.white,
        border: Border.all(color: color.withValues(alpha: 0.2)),
        borderRadius: MerchantConstants.radiusMd,
        boxShadow: MerchantConstants.shadowSm,
        child: content,
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// 10. AppBackground — fon paj avèk gradye
// ────────────────────────────────────────────────────────────────

/// Fon paj ki gen yon ti gradye soutèl — ba profondè san biti.
/// Mete l kòm `body:` dirèk nan Scaffold, oswa anba tout widget yo.
class AppBackground extends StatelessWidget {
  const AppBackground({
    super.key,
    required this.child,
    this.gradient = MerchantConstants.appBgGradient,
  });

  final Widget child;
  final LinearGradient gradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(gradient: gradient),
      child: child,
    );
  }
}
