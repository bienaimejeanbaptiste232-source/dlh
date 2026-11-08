import 'dart:convert';

class ProductVariant {
  final String size;
  final String color;
  final int stock;
  final double? price;

  const ProductVariant({
    required this.size,
    required this.color,
    required this.stock,
    this.price,
  });

  Map<String, dynamic> toJson() => {
    'size': size,
    'color': color,
    'stock': stock,
    if (price != null) 'price': price,
  };

  factory ProductVariant.fromJson(Map<String, dynamic> j) => ProductVariant(
    size: j['size'] ?? '',
    color: j['color'] ?? '',
    stock: (j['stock'] ?? 0) as int,
    price: j['price'] != null ? (j['price'] as num).toDouble() : null,
  );
}

class ProductMeta {
  final String? type;
  final String? brand;
  final String? model;
  final List<String> sizes;
  final List<String> colors;
  final List<ProductVariant> variants;
  final String? unit;
  final String? volume;
  final String? dosage;
  final String? expiryDate;
  final bool requiresPrescription;
  final String? condition;
  final String? warranty;
  final String? ram;
  final String? storage;
  final String? transportCondition;
  final String? dimensions;
  final int? stock;
  final String? usageInstructions;
  final List<String> portions;
  final List<String> accompaniments;
  final List<String> extras;
  final Map<String, dynamic> extra;

  const ProductMeta({
    this.type,
    this.brand,
    this.model,
    this.sizes = const [],
    this.colors = const [],
    this.variants = const [],
    this.unit,
    this.volume,
    this.dosage,
    this.expiryDate,
    this.requiresPrescription = false,
    this.condition,
    this.warranty,
    this.ram,
    this.storage,
    this.transportCondition,
    this.dimensions,
    this.stock,
    this.usageInstructions,
    this.portions = const [],
    this.accompaniments = const [],
    this.extras = const [],
    this.extra = const {},
  });

  static final _metaRegex = RegExp(r'^\[Meta:(\{.*?\})\]\s*', dotAll: true);

  static ProductMeta parse(String description) {
    final match = _metaRegex.firstMatch(description);
    if (match != null) {
      try {
        final j = jsonDecode(match.group(1)!) as Map<String, dynamic>;
        return ProductMeta(
          type: j['type'],
          brand: j['brand'],
          model: j['model'],
          sizes: (j['sizes'] as List?)?.map((e) => e.toString()).toList() ?? [],
          colors: (j['colors'] as List?)?.map((e) => e.toString()).toList() ?? [],
          variants: (j['variants'] as List?)
              ?.map((e) => ProductVariant.fromJson(e as Map<String, dynamic>))
              .toList() ?? [],
          unit: j['unit'],
          volume: j['volume'],
          dosage: j['dosage'],
          expiryDate: j['expiryDate'],
          requiresPrescription: j['rx'] == true,
          condition: j['condition'],
          warranty: j['warranty'],
          ram: j['ram'],
          storage: j['storage'],
          transportCondition: j['transport'],
          dimensions: j['dimensions'],
          stock: j['stock'],
          usageInstructions: j['usage'],
          portions: (j['portions'] as List?)?.map((e) => e.toString()).toList() ?? [],
          accompaniments: (j['accompaniments'] as List?)?.map((e) => e.toString()).toList() ?? [],
          extras: (j['extras'] as List?)?.map((e) => e.toString()).toList() ?? [],
        );
      } catch (_) {}
    }
    // Legacy parsing fallback
    final bool rx = description.contains('⚠️ Preskripsyon');
    String? unit;
    final unitMatch = RegExp(r'\[Inite:(.*?)\]').firstMatch(description);
    if (unitMatch != null) unit = unitMatch.group(1);
    return ProductMeta(requiresPrescription: rx, unit: unit);
  }

  static String plainDescription(String description) {
    return description.replaceFirst(_metaRegex, '').trim();
  }
}
