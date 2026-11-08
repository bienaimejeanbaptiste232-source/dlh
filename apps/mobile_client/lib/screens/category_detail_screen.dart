import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/app_providers.dart';

const Color _kOrange = Color(0xFFFF6600);
const Color _kHeaderBlack = Color(0xFF111111);
const Color _kBackground = Color(0xFFF8FAFC);
const Color _kTextDark = Color(0xFF0F172A);
const Color _kTextMuted = Color(0xFF64748B);

class CategoryDetailScreen extends ConsumerStatefulWidget {
  final String categoryKey;

  const CategoryDetailScreen({
    super.key,
    required this.categoryKey,
  });

  @override
  ConsumerState<CategoryDetailScreen> createState() => _CategoryDetailScreenState();
}

class _CategoryDetailScreenState extends ConsumerState<CategoryDetailScreen> {
  String _selectedSubCat = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  // Category Configuration Data
  static final Map<String, Map<String, dynamic>> _catMeta = {
    'RESTAURANT': {
      'title': 'Restoran ak Manje',
      'slogan': 'Plat cho, Bwason fre ak Desè gou',
      'banner': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      'icon': Icons.restaurant_rounded,
      'color': const Color(0xFFEA580C),
      'subcategories': [
        'ALL',
        'Plat lokal',
        'Fast food',
        'Manje espesyal',
        'Bwason',
        'Desè',
      ],
    },
    'GROCERY': {
      'title': 'Supermarché & Makèt',
      'slogan': 'Pwodui alimantè fre, Netwayaj ak Pwodui Kay',
      'banner': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      'icon': Icons.local_grocery_store_rounded,
      'color': const Color(0xFF16A34A),
      'subcategories': [
        'ALL',
        'Pwodui alimantè',
        'Bwason',
        'Pwodui netwayaj',
        'Pwodui pou bebe',
        'Pwodui ijyèn',
      ],
    },
    'PHARMACY': {
      'title': 'Famasi & Sante',
      'slogan': 'Medikaman, Lèt bebe, Vitamin ak Premye Swen',
      'banner': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
      'icon': Icons.medical_services_rounded,
      'color': const Color(0xFF0284C7),
      'subcategories': [
        'ALL',
        'Medikaman granmoun',
        'Medikaman bebe',
        'Lèt pou bebe',
        'Vitamin',
        'Premye swen',
        'Pwodui ijyèn',
      ],
    },
    'CLOTHING': {
      'title': 'Boutik Rad & Mòd',
      'slogan': 'Mayo, Pantalon, Wòb, Soulye ak Akseswa',
      'banner': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      'icon': Icons.checkroom_rounded,
      'color': const Color(0xFF9333EA),
      'subcategories': [
        'ALL',
        'Mayo',
        'Pantalon',
        'Wòb',
        'Soulye',
        'Rad pou bebe',
        'Rad pou gason',
        'Rad pou fi',
        'Akseswa',
      ],
    },
    'ELECTRONICS': {
      'title': 'Teknoloji & Aparèy',
      'slogan': 'Telefòn, Òdinatè, Ekoutè ak Gaming',
      'banner': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
      'icon': Icons.devices_rounded,
      'color': const Color(0xFF2563EB),
      'subcategories': [
        'ALL',
        'Telefòn',
        'Òdinatè',
        'Akseswa telefòn',
        'Ekoutè',
        'Aparèy elektwonik',
        'Gaming',
      ],
    },
    'HARDWARE': {
      'title': 'Materyo Konstriksyon',
      'slogan': 'Siman, Fè, Blòk, Plonbri ak Zouti',
      'banner': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
      'icon': Icons.construction_rounded,
      'color': const Color(0xFFB45309),
      'subcategories': [
        'ALL',
        'Siman',
        'Fè',
        'Blòk',
        'Plonbri',
        'Elektrik',
        'Zouti',
      ],
    },
    'BEAUTY': {
      'title': 'Bote & Kosmetik',
      'slogan': 'Swen figi, Pafen, Makiyaj ak Swen cheve',
      'banner': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
      'icon': Icons.spa_rounded,
      'color': const Color(0xFFDB2777),
      'subcategories': [
        'ALL',
        'Swen po',
        'Pafen',
        'Makiyaj',
        'Swen cheve',
        'Ijyèn kò',
      ],
    },
  };

  Map<String, dynamic> get _currentMeta {
    final k = widget.categoryKey.toUpperCase().trim();
    if (k == 'SUPERMARKET' || k == 'MAKET') return _catMeta['GROCERY']!;
    if (k == 'BOUTIQUE' || k == 'RAD' || k == 'FASHION') return _catMeta['CLOTHING']!;
    if (k == 'CONSTRUCTION' || k == 'MATERIAUX' || k == 'KINKAYRI') return _catMeta['HARDWARE']!;
    if (k == 'COSMETICS' || k == 'BOTE' || k == 'BEAUTE') return _catMeta['BEAUTY']!;
    if (k == 'TECH') return _catMeta['ELECTRONICS']!;
    if (k == 'FOOD') return _catMeta['RESTAURANT']!;
    return _catMeta[k] ??
        {
          'title': widget.categoryKey,
          'slogan': 'Boutik ak pwodwi nan kategori sa a',
          'banner': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
          'icon': Icons.storefront_rounded,
          'color': _kOrange,
          'subcategories': ['ALL'],
        };
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final meta = _currentMeta;
    final catColor = meta['color'] as Color;
    final subcategories = meta['subcategories'] as List<String>;
    final merchantsAsync = ref.watch(merchantsProvider(widget.categoryKey));

    return Scaffold(
      backgroundColor: _kBackground,
      appBar: AppBar(
        backgroundColor: _kHeaderBlack,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/categories');
            }
          },
        ),
        title: Text(
          meta['title'],
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Colors.white, size: 22),
            onPressed: () {
              // Focus search
            },
          ),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Hero Banner ─────────────────────────────────────────
          SliverToBoxAdapter(
            child: Stack(
              children: [
                // Banner Image
                Container(
                  height: 140,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    image: DecorationImage(
                      image: NetworkImage(meta['banner']),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                // Gradient Scrim
                Container(
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withValues(alpha: 0.8),
                        Colors.black.withValues(alpha: 0.35),
                        Colors.transparent,
                      ],
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                    ),
                  ),
                ),
                // Text Overlay
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 14,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: catColor,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(meta['icon'] as IconData, color: Colors.white, size: 14),
                                const SizedBox(width: 4),
                                Text(
                                  widget.categoryKey.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '⚡ Livrezon 20-35 min',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        meta['title'],
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.4,
                        ),
                      ),
                      Text(
                        meta['slogan'],
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Search & Subcategories Bar ──────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                  decoration: InputDecoration(
                    hintText: 'Chèche nan ${meta['title']}...',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    prefixIcon: const Icon(Icons.search_rounded, color: _kOrange, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF94A3B8)),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
              ),
            ),
          ),

          // ── Subcategories Horizontal Pills ──────────────────────
          if (subcategories.length > 1)
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.only(bottom: 12),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: subcategories.map((sub) {
                      final isSel = _selectedSubCat == sub;
                      final label = sub == 'ALL' ? 'Tout' : sub;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(label),
                          selected: isSel,
                          onSelected: (_) {
                            setState(() => _selectedSubCat = sub);
                          },
                          selectedColor: catColor,
                          backgroundColor: const Color(0xFFF1F5F9),
                          labelStyle: TextStyle(
                            color: isSel ? Colors.white : _kTextDark,
                            fontSize: 12,
                            fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(
                              color: isSel ? catColor : const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),

          // ── Merchant Section Title ──────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.storefront_rounded, color: catColor, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Boutik Disponib',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: _kTextDark,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Akòde ak ${meta['title']}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: _kTextMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Merchant List ───────────────────────────────────────
          merchantsAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: _kOrange),
                ),
              ),
            ),
            error: (err, _) => SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text('Erè nan chaje machann: $err'),
                ),
              ),
            ),
            data: (merchants) {
              var filtered = merchants;
              if (_searchQuery.isNotEmpty) {
                filtered = filtered
                    .where((m) =>
                        m.name.toLowerCase().contains(_searchQuery) ||
                        m.address.toLowerCase().contains(_searchQuery))
                    .toList();
              }

              if (filtered.isEmpty) {
                return SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.all(20),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Icon(meta['icon'] as IconData, size: 48, color: const Color(0xFFCBD5E1)),
                        const SizedBox(height: 12),
                        Text(
                          'Pa gen machann nan ${meta['title']} kounye a',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: _kTextDark,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Boutik sa yo ap disponib trè byento nan zòn ou an',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: _kTextMuted),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: catColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: () => context.go('/categories'),
                          child: const Text('Gade Lòt Kategori'),
                        ),
                      ],
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final m = filtered[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(18),
                          onTap: () => context.push('/merchant/${m.id}', extra: m),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Store Banner
                              Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                                    child: Container(
                                      height: 110,
                                      width: double.infinity,
                                      color: const Color(0xFFF1F5F9),
                                      child: m.bannerUrl != null && m.bannerUrl!.isNotEmpty
                                          ? Image.network(
                                              m.bannerUrl!,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) => Image.network(
                                                meta['banner'],
                                                fit: BoxFit.cover,
                                              ),
                                            )
                                          : Image.network(
                                              meta['banner'],
                                              fit: BoxFit.cover,
                                            ),
                                    ),
                                  ),
                                  // Store Open Pill
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.7),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 6,
                                            height: 6,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF10B981),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          const Text(
                                            'Ouvri',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              // Store Info Body
                              Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    // Logo
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                        image: m.logoUrl != null && m.logoUrl!.isNotEmpty
                                            ? DecorationImage(
                                                image: NetworkImage(m.logoUrl!),
                                                fit: BoxFit.cover,
                                              )
                                            : null,
                                      ),
                                      child: m.logoUrl == null || m.logoUrl!.isEmpty
                                          ? Icon(meta['icon'] as IconData, color: catColor, size: 24)
                                          : null,
                                    ),
                                    const SizedBox(width: 12),

                                    // Store Details
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            m.name,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              color: _kTextDark,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.star_rounded, size: 15, color: Color(0xFFFFB800)),
                                              const SizedBox(width: 2),
                                              Text(
                                                '${m.rating}',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                  color: _kTextDark,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                '• 150 HTG Livrezon',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: catColor,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            m.address,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: _kTextMuted,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Action
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: catColor.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            'Achte',
                                            style: TextStyle(
                                              color: catColor,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Icon(Icons.arrow_forward_ios_rounded, size: 10, color: catColor),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
