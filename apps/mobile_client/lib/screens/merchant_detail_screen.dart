import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/constants.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';
import '../utils/product_meta.dart';
import '../widgets/doordash_cart_bar.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT DETAIL SCREEN — ALIBABA / TAOBAO STYLE
// 2-Column Product Grid | Sticky Category Tab Bar | Pro Add-to-Cart UX
// ─────────────────────────────────────────────────────────────────────────────
class MerchantDetailScreen extends ConsumerStatefulWidget {
  final Merchant merchant;
  const MerchantDetailScreen({super.key, required this.merchant});

  @override
  ConsumerState<MerchantDetailScreen> createState() =>
      _MerchantDetailScreenState();
}

class _MerchantDetailScreenState extends ConsumerState<MerchantDetailScreen>
    with TickerProviderStateMixin {
  String _selectedCategory = 'Tout';
  TabController? _tabController;

  List<String> _buildCategories(List<MenuItem> items) {
    final seen = <String>{};
    for (final item in items) {
      if (item.category.trim().isNotEmpty) seen.add(item.category.trim());
    }
    return ['Tout', ...seen];
  }

  List<MenuItem> _filterItems(List<MenuItem> items) {
    if (_selectedCategory == 'Tout') return items;
    return items.where((e) => e.category.trim() == _selectedCategory).toList();
  }

  void _syncTabController(List<String> cats) {
    if (_tabController == null || _tabController!.length != cats.length) {
      _tabController?.dispose();
      _tabController = TabController(length: cats.length, vsync: this);
      _tabController!.addListener(() {
        if (_tabController!.indexIsChanging) return;
        setState(() => _selectedCategory = cats[_tabController!.index]);
      });
    }
  }
  // ── Image helper (supports base64 & network URL) ───────────────────────────
  Widget _buildItemPhoto(
    String? imageUrl, {
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
    Widget? fallback,
  }) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return fallback ?? const SizedBox.shrink();
    }
    final trimmed = imageUrl.trim();
    if (trimmed.startsWith('data:image')) {
      try {
        final bytes = base64Decode(trimmed.split(',').last);
        return Image.memory(bytes, width: width, height: height, fit: fit);
      } catch (_) {
        return fallback ?? const SizedBox.shrink();
      }
    }
    return Image.network(
      trimmed,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (_, _, _) => fallback ?? const SizedBox.shrink(),
    );
  }

  @override
  void initState() {
    super.initState();
    // TabController will be initialized lazily when products load
  }

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  // ─── ADD-TO-CART BOTTOM SHEET (Domain-Aware) ──────────────────────────────
  void _showAddToCartSheet(MenuItem item) {
    int quantity = 1;
    final noteController = TextEditingController();
    String? selectedSize;
    String? selectedColor;
    String? selectedPortionSize;
    final selectedExtrasSet = <String>{};

    final meta = ProductMeta.parse(item.description);
    final cleanDesc = ProductMeta.plainDescription(item.description)
        .replaceAll(RegExp(r'\[Opsyon:[^\]]+\]'), '')
        .replaceAll(RegExp(r'\[Ekstra:[^\]]+\]'), '')
        .replaceAll(RegExp(r'\[Inite:[^\]]+\]'), '')
        .replaceAll('•', '')
        .trim();

    // Legacy option/extra parsing (backward compat)
    String? selectedOptionChoice;
    final optMatch = RegExp(r'\[Opsyon:([^\]]+)\]').firstMatch(item.description);
    final extMatch = RegExp(r'\[Ekstra:([^\]]+)\]').firstMatch(item.description);
    final legacyOptions = optMatch != null
        ? optMatch.group(1)!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList()
        : <String>[];
    final legacyExtras = extMatch != null
        ? extMatch.group(1)!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList()
        : <String>[];

    final merchantType = widget.merchant.category.toUpperCase();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) {
          // Compute effective extras list
          final effectiveExtras = meta.extras.isNotEmpty ? meta.extras : legacyExtras;

          // Compute live price
          double effectivePrice = item.price;
          if (meta.variants.isNotEmpty && selectedSize != null && selectedColor != null) {
            final variant = meta.variants.where((v) =>
                v.size == selectedSize && v.color == selectedColor).firstOrNull;
            if (variant?.price != null) effectivePrice = variant!.price!;
          }
          final total = effectivePrice * quantity;

          // Check if we can add (required fields satisfied)
          bool canAdd = true;
          if (merchantType == 'CLOTHING') {
            if (meta.sizes.isNotEmpty && selectedSize == null) canAdd = false;
            if (meta.colors.isNotEmpty && selectedColor == null) canAdd = false;
          }
          if (merchantType == 'ELECTRONICS' || merchantType == 'TECH' || merchantType == 'TELEPHONIE') {
            if (meta.colors.isNotEmpty && selectedColor == null) canAdd = false;
          }

          // Stock for selected size+color
          int? variantStock;
          if (meta.variants.isNotEmpty && selectedSize != null && selectedColor != null) {
            final v = meta.variants.where((v) =>
                v.size == selectedSize && v.color == selectedColor).firstOrNull;
            if (v != null) variantStock = v.stock;
          }

          // Build note from selections
          void syncNote() {
            final parts = <String>[];
            if (selectedSize != null) parts.add('Gwosè: $selectedSize');
            if (selectedColor != null) parts.add('Koulè: $selectedColor');
            if (selectedPortionSize != null) parts.add('Pòsyon: $selectedPortionSize');
            if (selectedOptionChoice != null) parts.add('Chwa: $selectedOptionChoice');
            if (selectedExtrasSet.isNotEmpty) parts.add('Ekstra: ${selectedExtrasSet.join(", ")}');
            noteController.text = parts.join(' • ');
          }

          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 16,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Product image
                  if (item.image != null && item.image!.trim().isNotEmpty) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: _buildItemPhoto(item.image!.trim(),
                          height: 200, width: double.infinity, fit: BoxFit.cover),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Name & status
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(item.name,
                          style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A), letterSpacing: -0.3,
                          ),
                        ),
                      ),
                      if (meta.requiresPrescription)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFEF4444)),
                          ),
                          child: const Text('⚠️ Rx',
                            style: TextStyle(color: Color(0xFFDC2626), fontSize: 11, fontWeight: FontWeight.w800)),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('Disponib',
                            style: TextStyle(color: Color(0xFF15803D), fontSize: 11, fontWeight: FontWeight.w800)),
                        ),
                    ],
                  ),

                  if (cleanDesc.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(cleanDesc, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.4)),
                  ] else if (meta.brand != null || meta.ram != null || meta.storage != null || meta.condition != null || meta.warranty != null || meta.dimensions != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      [
                        if (meta.brand != null) meta.brand!,
                        if (meta.ram != null) '${meta.ram} RAM',
                        if (meta.storage != null) meta.storage!,
                        if (meta.warranty != null) 'Garanti: ${meta.warranty}',
                        if (meta.condition != null) meta.condition!,
                        if (meta.dimensions != null) meta.dimensions!,
                      ].join(' · '),
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.4),
                    ),
                  ],

                  const SizedBox(height: 14),

                  // ── DOMAIN-SPECIFIC SECTIONS ────────────────────────────────

                  // ── CLOTHING ──────────────────────────────────────────────
                  if (merchantType == 'CLOTHING') ...[
                    if (meta.sizes.isNotEmpty) ...[
                      Row(children: [
                        const Text('Chwazi Gwosè:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                        const SizedBox(width: 6),
                        const Text('*', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w900)),
                      ]),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: meta.sizes.map((size) {
                          final sel = selectedSize == size;
                          return GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setModal(() {
                                selectedSize = sel ? null : size;
                                syncNote();
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: sel ? const Color(0xFFFF6600) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: sel ? const Color(0xFFFF6600) : const Color(0xFFCBD5E1),
                                ),
                              ),
                              child: Text(size,
                                style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w700,
                                  color: sel ? Colors.white : const Color(0xFF334155),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 14),
                    ],
                    if (meta.colors.isNotEmpty) ...[
                      Row(children: [
                        const Text('Chwazi Koulè:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                        const SizedBox(width: 6),
                        const Text('*', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w900)),
                      ]),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 10, runSpacing: 10,
                        children: meta.colors.map((colorName) {
                          final sel = selectedColor == colorName;
                          final c = _colorFromName(colorName);
                          return GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setModal(() {
                                selectedColor = sel ? null : colorName;
                                syncNote();
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: sel ? const Color(0xFFFF6600) : Colors.transparent,
                                  width: 2.5,
                                ),
                              ),
                              child: Tooltip(
                                message: colorName,
                                child: CircleAvatar(
                                  radius: 16,
                                  backgroundColor: c,
                                  child: c == Colors.white
                                      ? Icon(Icons.check, size: 14,
                                          color: sel ? const Color(0xFFFF6600) : Colors.transparent)
                                      : sel ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (variantStock != null) ...[
                      Row(children: [
                        const Icon(Icons.inventory_2_outlined, size: 14, color: Color(0xFF64748B)),
                        const SizedBox(width: 4),
                        Text('$variantStock an estòk',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ]),
                      const SizedBox(height: 10),
                    ],
                  ],

                  // ── PHARMACY ──────────────────────────────────────────────
                  if (merchantType == 'PHARMACY') ...[
                    if (meta.requiresPrescription) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFFB923C), width: 1.5),
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('⚠️ Preskripsyon Medikal Nesesè',
                                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFFC2410C))),
                            SizedBox(height: 4),
                            Text(
                              'Fòk ou gen preskripsyon doktè pou achte medikaman sa a. Livrè a ap verifye l.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF7C3AED), height: 1.4),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (meta.dosage != null) ...[
                      Row(children: [
                        const Icon(Icons.medication_rounded, size: 16, color: Color(0xFF0284C7)),
                        const SizedBox(width: 6),
                        Text('Dòz: ${meta.dosage}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                      ]),
                      const SizedBox(height: 8),
                    ],
                    if (meta.usageInstructions != null) ...[
                      Row(children: [
                        const Icon(Icons.info_outline_rounded, size: 15, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Expanded(child: Text(meta.usageInstructions!,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4))),
                      ]),
                      const SizedBox(height: 8),
                    ],
                    if (meta.expiryDate != null) ...[
                      Row(children: [
                        const Icon(Icons.event_outlined, size: 15, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text('Ekspire: ${meta.expiryDate}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ]),
                      const SizedBox(height: 8),
                    ],
                  ],

                  // ── RESTAURANT / FAST_FOOD ────────────────────────────────
                  if (merchantType == 'RESTAURANT' || merchantType == 'FAST_FOOD') ...[
                    if (meta.portions.isNotEmpty) ...[
                      const Text('Chwazi Pòsyon:',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: meta.portions.map((portion) {
                          final sel = selectedPortionSize == portion;
                          return GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setModal(() {
                                selectedPortionSize = sel ? null : portion;
                                syncNote();
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: sel ? const Color(0xFFFF6600) : const Color(0xFFFFF7ED),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: sel ? const Color(0xFFFF6600) : const Color(0xFFFDBA74),
                                ),
                              ),
                              child: Text(portion,
                                style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w700,
                                  color: sel ? Colors.white : const Color(0xFFC2410C),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 14),
                    ],
                    if (meta.accompaniments.isNotEmpty) ...[
                      const Text('Akonpayman Enkli:',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: meta.accompaniments.map((acc) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFF86EFAC)),
                            ),
                            child: Text(acc,
                              style: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF15803D),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 14),
                    ],
                    if (legacyOptions.isNotEmpty) ...[
                      const Text('Chwazi akonpayman (enkli):',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: legacyOptions.map((opt) {
                          final sel = selectedOptionChoice == opt;
                          return GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setModal(() { selectedOptionChoice = sel ? null : opt; syncNote(); });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: sel ? const Color(0xFFFF6600) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: sel ? const Color(0xFFFF6600) : const Color(0xFFCBD5E1),
                                ),
                              ),
                              child: Text(opt,
                                style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w700,
                                  color: sel ? Colors.white : const Color(0xFF334155),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 14),
                    ],
                  ],

                  // ── SUPERMARKET / BEVERAGE_DEPOT ──────────────────────────
                  if (merchantType == 'SUPERMARKET' || merchantType == 'BEVERAGE_DEPOT') ...[
                    if (meta.unit != null) ...[
                      Row(children: [
                        const Icon(Icons.inventory_outlined, size: 15, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text('Inite: ${meta.unit}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                      ]),
                      const SizedBox(height: 10),
                    ],
                  ],

                  // ── CONSTRUCTION ──────────────────────────────────────────
                  if (merchantType == 'CONSTRUCTION') ...[
                    if (meta.unit != null) ...[
                      Row(children: [
                        const Icon(Icons.straighten_rounded, size: 15, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text('Inite: ${meta.unit}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                      ]),
                      const SizedBox(height: 8),
                    ],
                    if (meta.dimensions != null) ...[
                      Row(children: [
                        const Icon(Icons.aspect_ratio_rounded, size: 15, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text('Dimansyon: ${meta.dimensions}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                      ]),
                      const SizedBox(height: 8),
                    ],
                    if (meta.transportCondition == 'Kamyon lou obligatwa') ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFB923C)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.local_shipping_outlined, color: Color(0xFFC2410C), size: 18),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '⚠️ Livrezon sa a bezwen yon gwo kamyon. Pri transpò ka varye.',
                                style: TextStyle(fontSize: 12, color: Color(0xFFC2410C), height: 1.3),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],

                  // ── TECH ──────────────────────────────────────────────────
                  if (merchantType == 'TECH' || merchantType == 'ELECTRONICS' || merchantType == 'TELEPHONIE') ...[
                    if (meta.ram != null || meta.storage != null || meta.condition != null || meta.warranty != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            if (meta.ram != null) _specRow('RAM', meta.ram!),
                            if (meta.storage != null) _specRow('Estokaj', meta.storage!),
                            if (meta.condition != null) _specRow('Kondisyon', meta.condition!),
                            if (meta.warranty != null) _specRow('Garanti', meta.warranty!),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (meta.colors.isNotEmpty) ...[
                      const Text('Chwazi Koulè:',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 10, runSpacing: 10,
                        children: meta.colors.map((colorName) {
                          final sel = selectedColor == colorName;
                          final c = _colorFromName(colorName);
                          return GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setModal(() { selectedColor = sel ? null : colorName; syncNote(); });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: sel ? const Color(0xFFFF6600) : Colors.transparent,
                                  width: 2.5,
                                ),
                              ),
                              child: Tooltip(
                                message: colorName,
                                child: CircleAvatar(
                                  radius: 16,
                                  backgroundColor: c,
                                  child: sel ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ],

                  // ── EXTRAS (all types) ────────────────────────────────────
                  if (effectiveExtras.isNotEmpty) ...[
                    const Text('Ekstra (opsyonèl):',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: effectiveExtras.map((ext) {
                        final sel = selectedExtrasSet.contains(ext);
                        return GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setModal(() {
                              if (sel) { selectedExtrasSet.remove(ext); } else { selectedExtrasSet.add(ext); }
                              syncNote();
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: sel ? const Color(0xFFEA580C) : const Color(0xFFFFF7ED),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: sel ? const Color(0xFFEA580C) : const Color(0xFFFDBA74),
                              ),
                            ),
                            child: Text(ext,
                              style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w700,
                                color: sel ? Colors.white : const Color(0xFFC2410C),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),
                  ],

                  const SizedBox(height: 6),

                  // Live total price
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          merchantType == 'SUPERMARKET' && meta.unit != null
                              ? '${total.toInt()} HTG ($quantity ${meta.unit})'
                              : '${total.toInt()} HTG',
                          style: const TextStyle(
                            fontSize: 26, fontWeight: FontWeight.w900,
                            color: Color(0xFFFF6600), letterSpacing: -0.5,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Special instructions / note
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      controller: noteController,
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Enstriksyon espesyal (ex: san pikliz, plis sòs...)',
                        hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                        prefixIcon: Icon(Icons.edit_note_rounded, color: Color(0xFFFF6600)),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Qty + Add button
                  Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            _QtyBtn(
                              icon: Icons.remove_rounded,
                              onTap: () { if (quantity > 1) { setModal(() => quantity--); } },
                            ),
                            SizedBox(
                              width: 36,
                              child: Center(
                                child: Text('$quantity',
                                  style: const TextStyle(
                                    fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A),
                                  ),
                                ),
                              ),
                            ),
                            _QtyBtn(
                              icon: Icons.add_rounded,
                              onTap: () => setModal(() => quantity++),
                              isAdd: true,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: !canAdd ? null : () async {
                            HapticFeedback.mediumImpact();
                            final cartState = ref.read(cartProvider);
                            final activeCart = cartState.activeCart;
                            if (activeCart != null &&
                                activeCart.items.isNotEmpty &&
                                activeCart.merchant.id != widget.merchant.id) {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (dCtx) => AlertDialog(
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  title: const Text('Kòmanse yon nouvo panye?',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
                                  content: Text(
                                    'Panye w la gen atik ki soti nan "${activeCart.merchant.name}". Yon sèl kòmand ka fèt nan yon sèl boutik alafwa.\n\nÈske w vle vide l pou w kòmande nan "${widget.merchant.name}"?',
                                    style: const TextStyle(fontSize: 13.5, color: Color(0xFF475569)),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(dCtx, false),
                                      child: const Text('Kenbe ansyen an',
                                          style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
                                    ),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFFF6600),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      onPressed: () => Navigator.pop(dCtx, true),
                                      child: const Text('Kòmanse Nouvo Panye',
                                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm != true) return;
                              ref.read(cartProvider.notifier).clearAll();
                            }

                            final noteText = noteController.text.trim();
                            ref.read(cartProvider.notifier).addItem(
                              widget.merchant, item,
                              quantity: quantity,
                              instructions: noteText.isEmpty ? null : noteText,
                              selectedSize: selectedSize,
                              selectedColor: selectedColor,
                              selectedPortionSize: selectedPortionSize,
                              selectedExtras: selectedExtrasSet.toList(),
                            );
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Row(
                                children: [
                                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 19),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text('${item.name} ajoute nan panye a.',
                                    style: const TextStyle(fontWeight: FontWeight.w700))),
                                ],
                              ),
                              action: SnackBarAction(
                                label: 'Wè Panye', textColor: Colors.white,
                                onPressed: () => context.push('/cart'),
                              ),
                              backgroundColor: const Color(0xFF10B981),
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ));
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 17),
                            decoration: BoxDecoration(
                              gradient: canAdd ? AppConstants.primaryGradient : null,
                              color: canAdd ? null : const Color(0xFFCBD5E1),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: canAdd ? [
                                BoxShadow(
                                  color: const Color(0xFFFF6600).withValues(alpha: 0.38),
                                  blurRadius: 14, offset: const Offset(0, 4),
                                ),
                              ] : null,
                            ),
                            child: Center(
                              child: Text(
                                canAdd ? 'Ajoute nan Panyen' : 'Chwazi opsyon obligatwa yo',
                                style: const TextStyle(
                                  color: Colors.white, fontSize: 15,
                                  fontWeight: FontWeight.w900, letterSpacing: -0.2,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Helper: color name → Flutter Color
  static Color _colorFromName(String name) {
    switch (name.toLowerCase()) {
      case 'nwa': return Colors.black;
      case 'blan': return Colors.white;
      case 'wouj': return Colors.red;
      case 'ble': return Colors.blue;
      case 'vèt': case 'vet': return Colors.green;
      case 'kaki': return const Color(0xFF8B7355);
      case 'gri': return Colors.grey;
      case 'jòn': case 'jon': return Colors.yellow;
      case 'woz': return Colors.pink;
      case 'mawon': return Colors.brown;
      default: return Colors.grey;
    }
  }

  // Helper: spec row for TECH
  static Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 90,
            child: Text(label,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
          ),
          Expanded(child: Text(value,
              style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A), fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final deliveryLoc = ref.watch(deliveryLocationProvider);
    final cLat = deliveryLoc.latitude ?? 19.7550;
    final cLng = deliveryLoc.longitude ?? -72.2050;
    final distKm = _haversine(
        widget.merchant.latitude, widget.merchant.longitude, cLat, cLng);
    final extraKm = math.max(0.0, distKm - 2.0);
    final deliveryFee = (150.0 + (extraKm * 35.0)).round();

    // ── LOAD PRODUCTS FROM SUPABASE ──────────────────────────────────────────
    final productsAsync = ref.watch(merchantProductsProvider(widget.merchant.id));

    final bannerUrl =
        (widget.merchant.bannerUrl != null && widget.merchant.bannerUrl!.isNotEmpty)
            ? widget.merchant.bannerUrl!
            : _fallbackImg(widget.merchant.category);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: productsAsync.when(
        skipLoadingOnReload: true,
        skipLoadingOnRefresh: true,
        loading: () => _buildLoadingScaffold(bannerUrl, deliveryFee, cart),
        error: (e, _) => _buildErrorScaffold(bannerUrl, deliveryFee, cart, e),
        data: (allProducts) {
          final cats = _buildCategories(allProducts);
          _syncTabController(cats);
          final items = _filterItems(allProducts);

          return NestedScrollView(
            headerSliverBuilder: (context, _) => [
              // ── HERO SLIVER APP BAR ──────────────────────────────────────────
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                backgroundColor: Colors.white,
                elevation: 0,
                leading: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    margin: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.45),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: Colors.white, size: 18),
                  ),
                ),
                actions: [
                  GestureDetector(
                    onTap: () => context.push('/cart'),
                    child: Container(
                      margin: const EdgeInsets.all(8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 17),
                          if (cart.totalAllItemsCount > 0) ...[
                            const SizedBox(width: 5),
                            Text('${cart.totalAllItemsCount}',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900)),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        bannerUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          color: const Color(0xFFE2E8F0),
                          child: const Icon(Icons.storefront_rounded,
                              size: 64, color: Color(0xFF94A3B8)),
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.15),
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.70),
                            ],
                            stops: const [0.0, 0.4, 1.0],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 16, right: 16, bottom: 16,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    widget.merchant.name,
                                    style: const TextStyle(
                                      color: Colors.white, fontSize: 22,
                                      fontWeight: FontWeight.w900, letterSpacing: -0.4,
                                      shadows: [Shadow(color: Colors.black54, blurRadius: 8)],
                                    ),
                                    maxLines: 1, overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (widget.merchant.isVerified)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0284C7),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text('Verifye',
                                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                _HeroBadge(
                                  child: Row(
                                    children: [
                                      const Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 13),
                                      const SizedBox(width: 3),
                                      Text(widget.merchant.rating.toStringAsFixed(1),
                                        style: const TextStyle(color: Color(0xFFB45309), fontSize: 11, fontWeight: FontWeight.w900)),
                                    ],
                                  ),
                                  bg: const Color(0xFFFEF3C7),
                                ),
                                const SizedBox(width: 6),
                                _HeroBadge(
                                  child: Text('Frè $deliveryFee Gdes',
                                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                                  bg: Colors.white.withValues(alpha: 0.2),
                                ),
                                const SizedBox(width: 6),
                                _HeroBadge(
                                  child: Row(
                                    children: [
                                      const Icon(Icons.access_time_rounded, color: Colors.white, size: 12),
                                      const SizedBox(width: 3),
                                      Text(
                                        '${widget.merchant.avgPrepTimeMinutes}-${widget.merchant.avgPrepTimeMinutes + 10} min',
                                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  ),
                                  bg: Colors.white.withValues(alpha: 0.2),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── STICKY CATEGORY TAB BAR ──────────────────────────────────────
              if (_tabController != null)
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _TabBarDelegate(
                    TabBar(
                      controller: _tabController,
                      isScrollable: true,
                      tabAlignment: TabAlignment.start,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
                      indicatorColor: const Color(0xFFFF6600),
                      indicatorWeight: 2.5,
                      indicatorSize: TabBarIndicatorSize.label,
                      dividerColor: const Color(0xFFE2E8F0),
                      labelColor: const Color(0xFFFF6600),
                      unselectedLabelColor: const Color(0xFF64748B),
                      labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                      unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      onTap: (i) => setState(() => _selectedCategory = cats[i]),
                      tabs: cats.map((cat) => Tab(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                          child: Text(cat),
                        ),
                      )).toList(),
                    ),
                  ),
                ),
            ],
            body: allProducts.isEmpty
                ? _buildEmptyState()
                : items.isEmpty
                    ? _buildEmptyState()
                    : _buildProductGrid(items),
          );
        },
      ),
      bottomNavigationBar: DoorDashCartBar(currentMerchant: widget.merchant),
    );
  }

  Widget _buildLoadingScaffold(String bannerUrl, int deliveryFee, CartState cart) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Color(0xFFFF6600)),
            const SizedBox(height: 16),
            Text('Chaje pwodwi ${widget.merchant.name}...',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorScaffold(String bannerUrl, int deliveryFee, CartState cart, Object error) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
        ),
        title: Text(widget.merchant.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: Color(0xFF94A3B8)),
            const SizedBox(height: 12),
            const Text('Pa ka chaje pwodwi yo',
              style: TextStyle(color: Color(0xFF475569), fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF6600)),
              onPressed: () => ref.invalidate(merchantProductsProvider(widget.merchant.id)),
              child: const Text('Eseye Ankò', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
            child: const Icon(Icons.inventory_2_outlined, size: 44, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 14),
          Text('Pa gen pwodwi nan "$_selectedCategory"',
            style: const TextStyle(color: Color(0xFF475569), fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildProductGrid(List<MenuItem> items) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      physics: const BouncingScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.72,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return _ProductCard(
          item: item,
          merchantCategory: widget.merchant.category,
          onAddTap: () => _showAddToCartSheet(item),
          onCardTap: () => _showAddToCartSheet(item),
          buildPhoto: _buildItemPhoto,
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QTY STEPPER BUTTON
// ─────────────────────────────────────────────────────────────────────────────
class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isAdd;
  const _QtyBtn({required this.icon, required this.onTap, this.isAdd = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: isAdd ? const Color(0xFFFF6600) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Icon(icon, size: 18, color: isAdd ? Colors.white : const Color(0xFF64748B)),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BADGE WIDGET
// ─────────────────────────────────────────────────────────────────────────────
class _HeroBadge extends StatelessWidget {
  final Widget child;
  final Color bg;
  const _HeroBadge({required this.child, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: child,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD — ALIBABA 2-COLUMN STYLE
// Price in red, name bold, "+" button bottom-right
// ─────────────────────────────────────────────────────────────────────────────
class _ProductCard extends StatelessWidget {
  final MenuItem item;
  final String merchantCategory;
  final VoidCallback onAddTap;
  final VoidCallback onCardTap;
  final Widget Function(String?,
      {double? width, double? height, BoxFit fit, Widget? fallback}) buildPhoto;

  const _ProductCard({
    required this.item,
    required this.merchantCategory,
    required this.onAddTap,
    required this.onCardTap,
    required this.buildPhoto,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = item.image != null && item.image!.trim().isNotEmpty;
    final rawDesc = item.description;
    final meta = ProductMeta.parse(rawDesc);
    final cleanDesc = ProductMeta.plainDescription(rawDesc)
        .replaceAll(RegExp(r'\[Opsyon:[^\]]+\]'), '')
        .replaceAll(RegExp(r'\[Ekstra:[^\]]+\]'), '')
        .replaceAll(RegExp(r'\[Inite:[^\]]+\]'), '')
        .replaceAll('•', '')
        .trim();
    final hasOpts = meta.extras.isNotEmpty ||
        meta.portions.isNotEmpty ||
        RegExp(r'\[(Opsyon|Ekstra):').hasMatch(rawDesc);

    // Build a smart auto-description from meta if cleanDesc is empty
    String displayDesc = cleanDesc;
    if (displayDesc.isEmpty) {
      final parts = <String>[];
      if (meta.brand != null) parts.add(meta.brand!);
      if (meta.ram != null) parts.add('${meta.ram} RAM');
      if (meta.storage != null) parts.add(meta.storage!);
      if (meta.warranty != null) parts.add('Garanti: ${meta.warranty}');
      if (meta.dosage != null) parts.add('Dòz: ${meta.dosage}');
      if (meta.unit != null) parts.add('/ ${meta.unit}');
      if (meta.dimensions != null) parts.add(meta.dimensions!);
      if (meta.condition != null) parts.add(meta.condition!);
      if (parts.isNotEmpty) displayDesc = parts.join(' · ');
    }

    final fallbackIcon = merchantCategory == 'PHARMACY'
        ? Icons.medication_rounded
        : merchantCategory == 'SUPERMARKET'
            ? Icons.shopping_basket_rounded
            : Icons.fastfood_rounded;

    // Build price display string
    String priceDisplay = '${item.price.toInt()} HTG';
    if (meta.unit != null) priceDisplay += ' / ${meta.unit}';

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onCardTap();
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.05),
              blurRadius: 12, offset: const Offset(0, 4), spreadRadius: -2,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image area (top 55%) ────────────────────────────────────────
            Expanded(
              flex: 55,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    hasImage
                        ? buildPhoto(
                            item.image!.trim(),
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            fallback: _PlaceholderBox(fallbackIcon),
                          )
                        : _PlaceholderBox(fallbackIcon),
                    if (hasOpts)
                      Positioned(
                        top: 8, left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEA580C),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('Chwa',
                            style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w800)),
                        ),
                      ),
                    if (meta.requiresPrescription)
                      Positioned(
                        top: 8, right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC2626),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('⚠️ Rx',
                            style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
                        ),
                      ),
                    if (meta.condition != null)
                      Positioned(
                        bottom: 6, left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(meta.condition!,
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // ── Info area (bottom 45%) ──────────────────────────────────────
            Expanded(
              flex: 45,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product name
                    Text(
                      item.name,
                      style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A), letterSpacing: -0.1, height: 1.2,
                      ),
                      maxLines: 2, overflow: TextOverflow.ellipsis,
                    ),

                    if (meta.dosage != null) ...[
                      const SizedBox(height: 2),
                      Text('Dòz: ${meta.dosage}',
                        style: const TextStyle(fontSize: 10, color: Color(0xFF0284C7), fontWeight: FontWeight.w700)),
                    ] else if (displayDesc.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(displayDesc,
                        style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8), height: 1.3),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                      ),
                    ],

                    // Size chips (tiny scrollable row)
                    if (meta.sizes.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: meta.sizes.take(4).map((s) => Container(
                            margin: const EdgeInsets.only(right: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(s,
                              style: const TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
                          )).toList(),
                        ),
                      ),
                    ],

                    const Spacer(),

                    // Price + Add button (Alibaba bottom row)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Text(
                            priceDisplay,
                            style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w900,
                              color: Color(0xFFFF6600), letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        // Alibaba-style "+" button
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.mediumImpact();
                            onAddTap();
                          },
                          child: Container(
                            width: 32, height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF6600),
                              borderRadius: BorderRadius.circular(9),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF6600).withValues(alpha: 0.35),
                                  blurRadius: 8, offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER (no image)
// ─────────────────────────────────────────────────────────────────────────────
class _PlaceholderBox extends StatelessWidget {
  final IconData icon;
  const _PlaceholderBox(this.icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF1F5F9),
      child: Center(child: Icon(icon, size: 38, color: const Color(0xFFCBD5E1))),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY TAB BAR DELEGATE
// ─────────────────────────────────────────────────────────────────────────────
class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height + 1;
  @override
  double get maxExtent => tabBar.preferredSize.height + 1;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          tabBar,
          Container(height: 1, color: const Color(0xFFE2E8F0)),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _TabBarDelegate old) => old.tabBar != tabBar;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
String _fallbackImg(String category) {
  switch (category) {
    case 'SUPERMARKET':
      return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
    case 'PHARMACY':
      return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80';
    default:
      return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80';
  }
}

double _haversine(double? lat1, double? lon1, double lat2, double lon2) {
  if (lat1 == null || lon1 == null) return 0;
  const r = 6371.0;
  final dLat = _deg2rad(lat2 - lat1);
  final dLon = _deg2rad(lon2 - lon1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_deg2rad(lat1)) * math.cos(_deg2rad(lat2)) *
      math.sin(dLon / 2) * math.sin(dLon / 2);
  return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

double _deg2rad(double deg) => deg * (3.141592653589793 / 180.0);
