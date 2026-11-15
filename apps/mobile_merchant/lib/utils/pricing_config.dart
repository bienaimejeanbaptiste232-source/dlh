/// ============================================================================
/// Delivery Lakay — Lojik Pri Pwodwi: Inite, Pake (egz: pa 3), ak Gwosis
/// ============================================================================

enum SellingMode {
  unit,      // Vant pa inite sèlman (detay klasik)
  pack,      // Vant pa pake / lot (egz: pa 3, pa 6, pa douzèn)
  wholesale, // Vant gwosis sèlman (an gwo ak kantite minimòm MOQ)
  hybrid,    // Toulede: inite an detay + rabè pa pake oswa gwosis
}

enum PriceDisplayMode {
  unitFirst,      // Afiche pri inite an premye
  packFirst,      // Afiche pri pake an premye
  wholesaleFirst, // Afiche pri gwosis an premye
  tieredBadge,    // Afiche badj rabè degresif
}

class ProductPricingConfig {
  final SellingMode sellingMode;
  final PriceDisplayMode displayMode;

  // Pri inite (toujou la)
  final double unitPrice;
  final String unitName;

  // Opsyon Pake / Lot (egz: pa 3)
  final int? packQuantity;
  final double? packPrice;
  final String? packName;
  final bool allowOnlyPacks;

  // Opsyon Gwosis (Wholesale)
  final bool isWholesaleAvailable;
  final int? minWholesaleQty;
  final double? wholesalePricePerUnit;
  final String wholesaleUnitName;

  const ProductPricingConfig({
    this.sellingMode = SellingMode.unit,
    this.displayMode = PriceDisplayMode.unitFirst,
    required this.unitPrice,
    this.unitName = 'inite',
    this.packQuantity,
    this.packPrice,
    this.packName,
    this.allowOnlyPacks = false,
    this.isWholesaleAvailable = false,
    this.minWholesaleQty,
    this.wholesalePricePerUnit,
    this.wholesaleUnitName = 'Katon',
  });

  /// Kalkile pri total pou yon kantite bay
  ({double totalPrice, double effectiveUnitPrice, double savings, String? tierLabel}) calculateTotal(int quantity) {
    final qty = quantity <= 0 ? 1 : quantity;
    final baseTotal = qty * unitPrice;

    // 1. Mòd PACK sèlman
    if (sellingMode == SellingMode.pack && packQuantity != null && packPrice != null && packQuantity! > 0) {
      final packsCount = qty ~/ packQuantity!;
      final remainder = qty % packQuantity!;
      final total = (packsCount * packPrice!) + (remainder * unitPrice);
      final effUnit = total / qty;
      final savings = baseTotal > total ? baseTotal - total : 0.0;
      return (
        totalPrice: total,
        effectiveUnitPrice: effUnit,
        savings: savings,
        tierLabel: 'Pake $packQuantity ($packsCount pake)',
      );
    }

    // 2. Mòd WHOLESALE sèlman
    if (sellingMode == SellingMode.wholesale && wholesalePricePerUnit != null) {
      final total = qty * wholesalePricePerUnit!;
      final savings = baseTotal > total ? baseTotal - total : 0.0;
      return (
        totalPrice: total,
        effectiveUnitPrice: wholesalePricePerUnit!,
        savings: savings,
        tierLabel: 'Pri Gwosis ($wholesaleUnitName)',
      );
    }

    // 3. Mòd HYBRID
    if (sellingMode == SellingMode.hybrid) {
      if (minWholesaleQty != null && qty >= minWholesaleQty! && wholesalePricePerUnit != null) {
        final total = qty * wholesalePricePerUnit!;
        return (
          totalPrice: total,
          effectiveUnitPrice: wholesalePricePerUnit!,
          savings: baseTotal > total ? baseTotal - total : 0.0,
          tierLabel: 'Pri Gwosis ($wholesaleUnitName)',
        );
      }
      if (packQuantity != null && packPrice != null && qty >= packQuantity! && packQuantity! > 0) {
        final packsCount = qty ~/ packQuantity!;
        final remainder = qty % packQuantity!;
        final total = (packsCount * packPrice!) + (remainder * unitPrice);
        return (
          totalPrice: total,
          effectiveUnitPrice: total / qty,
          savings: baseTotal > total ? baseTotal - total : 0.0,
          tierLabel: 'Pake $packQuantity',
        );
      }
    }

    // 4. Mòd UNIT senp
    return (
      totalPrice: baseTotal,
      effectiveUnitPrice: unitPrice,
      savings: 0.0,
      tierLabel: null,
    );
  }

  /// Jenere tèks ak badj pou afichaj
  ({String primaryText, String? secondaryText, String? badgeText}) getDisplayFormat() {
    String formatHTG(double n) => '${n.round()} HTG';

    if (sellingMode == SellingMode.pack && packQuantity != null && packPrice != null) {
      final unitEquiv = packPrice! / packQuantity!;
      if (displayMode == PriceDisplayMode.packFirst) {
        return (
          primaryText: formatHTG(packPrice!),
          secondaryText: '${formatHTG(unitEquiv)} / inite (${packName ?? "Pake $packQuantity"})',
          badgeText: 'Vann pa $packQuantity',
        );
      } else {
        return (
          primaryText: '${formatHTG(unitEquiv)} / inite',
          secondaryText: '${formatHTG(packPrice!)} pou ${packName ?? "Pake $packQuantity"}',
          badgeText: 'Lot $packQuantity',
        );
      }
    }

    if (sellingMode == SellingMode.wholesale && wholesalePricePerUnit != null) {
      final minQty = minWholesaleQty ?? 12;
      return (
        primaryText: '${formatHTG(wholesalePricePerUnit!)} / inite',
        secondaryText: 'Min. $minQty inite (${formatHTG(minQty * wholesalePricePerUnit!)})',
        badgeText: 'Gwosis • Min $minQty',
      );
    }

    if (sellingMode == SellingMode.hybrid) {
      String? sec;
      if (packQuantity != null && packPrice != null) {
        final eq = packPrice! / packQuantity!;
        sec = '${formatHTG(packPrice!)} pa $packQuantity (${formatHTG(eq)}/in)';
      }
      return (
        primaryText: formatHTG(unitPrice),
        secondaryText: sec,
        badgeText: 'Pri Degresif',
      );
    }

    return (
      primaryText: formatHTG(unitPrice),
      secondaryText: unitName != 'inite' ? 'pa $unitName' : null,
      badgeText: null,
    );
  }

  Map<String, dynamic> toJson() => {
        'sellingMode': sellingMode.name.toUpperCase(),
        'displayMode': displayMode == PriceDisplayMode.packFirst
            ? 'PACK_FIRST'
            : displayMode == PriceDisplayMode.wholesaleFirst
                ? 'WHOLESALE_FIRST'
                : displayMode == PriceDisplayMode.tieredBadge
                    ? 'TIERED_BADGE'
                    : 'UNIT_FIRST',
        'unitPrice': unitPrice,
        'unitName': unitName,
        if (packQuantity != null) 'packQuantity': packQuantity,
        if (packPrice != null) 'packPrice': packPrice,
        if (packName != null) 'packName': packName,
        'allowOnlyPacks': allowOnlyPacks,
        'isWholesale': isWholesaleAvailable,
        if (minWholesaleQty != null) 'minWholesaleQty': minWholesaleQty,
        if (wholesalePricePerUnit != null) 'wholesalePricePerUnit': wholesalePricePerUnit,
        'wholesaleUnitName': wholesaleUnitName,
      };

  factory ProductPricingConfig.fromJson(Map<String, dynamic> json, double fallbackPrice) {
    SellingMode parseMode(String? m) {
      switch ((m ?? '').toUpperCase()) {
        case 'PACK':
          return SellingMode.pack;
        case 'WHOLESALE':
          return SellingMode.wholesale;
        case 'HYBRID':
          return SellingMode.hybrid;
        default:
          return json['packQuantity'] != null ? SellingMode.pack : SellingMode.unit;
      }
    }

    PriceDisplayMode parseDisp(String? d) {
      switch ((d ?? '').toUpperCase()) {
        case 'PACK_FIRST':
          return PriceDisplayMode.packFirst;
        case 'WHOLESALE_FIRST':
          return PriceDisplayMode.wholesaleFirst;
        case 'TIERED_BADGE':
          return PriceDisplayMode.tieredBadge;
        default:
          return PriceDisplayMode.unitFirst;
      }
    }

    final unitP = (json['unitPrice'] as num?)?.toDouble() ?? fallbackPrice;

    return ProductPricingConfig(
      sellingMode: parseMode(json['sellingMode']),
      displayMode: parseDisp(json['displayMode']),
      unitPrice: unitP,
      unitName: json['unitName'] ?? 'inite',
      packQuantity: (json['packQuantity'] as num?)?.toInt(),
      packPrice: (json['packPrice'] as num?)?.toDouble(),
      packName: json['packName'],
      allowOnlyPacks: json['allowOnlyPacks'] == true,
      isWholesaleAvailable: json['isWholesale'] == true,
      minWholesaleQty: (json['minWholesaleQty'] as num?)?.toInt(),
      wholesalePricePerUnit: (json['wholesalePricePerUnit'] as num?)?.toDouble(),
      wholesaleUnitName: json['wholesaleUnitName'] ?? 'Katon',
    );
  }
}

