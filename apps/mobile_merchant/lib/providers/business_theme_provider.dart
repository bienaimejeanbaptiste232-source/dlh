import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/business_type_config.dart';
import 'merchant_providers.dart';

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS THEME PROVIDER
// Retounen BusinessTheme aktyèl la ann aksò ak tip biznis machann lan.
// Tout ekran nan app la ka sèvi ak sa a pou adapte koulè, icon, ak UI yo.
//
// Usage:
//   final bTheme = ref.watch(businessThemeProvider);
//   Container(color: bTheme.primary, ...)
// ─────────────────────────────────────────────────────────────────────────────

/// Provider ki retounen BusinessTypeConfig konplè a
final businessTypeConfigProvider = Provider<BusinessTypeConfig>((ref) {
  final profile = ref.watch(merchantProfileProvider);
  return BusinessTypeConfig.fromType(profile?.type ?? 'RESTAURANT');
});

/// Provider ki retounen sèlman BusinessTheme la (koulè + icon)
final businessThemeProvider = Provider<BusinessTheme>((ref) {
  return ref.watch(businessTypeConfigProvider).theme;
});
