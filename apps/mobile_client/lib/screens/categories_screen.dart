import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const Color _kOrange = Color(0xFFFF6600);
const Color _kHeaderBlack = Color(0xFF111111);
const Color _kBackground = Color(0xFFF8FAFC);
const Color _kTextDark = Color(0xFF0F172A);
const Color _kTextMuted = Color(0xFF64748B);

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  // High-Resolution Professional Categories with Real Photography
  final List<Map<String, dynamic>> _departments = [
    {
      'key': 'RESTAURANT',
      'title': 'Restoran & Manje Cho',
      'tagline': 'Griyo, Pizza, Bègè, Plat Lokal & Bwason',
      'tags': ['Plat lokal', 'Fast food', 'Desè', 'Bwason'],
      'image': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      'accent': const Color(0xFFEA580C),
      'badge': 'Plis kòmande',
      'icon': Icons.restaurant_rounded,
    },
    {
      'key': 'GROCERY',
      'title': 'Supermarché & Makèt',
      'tagline': 'Pwodui Alimantè, Pake Dlo, Lwil & Netwayaj',
      'tags': ['Diri & Pwa', 'Bwason', 'Netwayaj', 'Swen Kay'],
      'image': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      'accent': const Color(0xFF16A34A),
      'badge': 'Pri Depo',
      'icon': Icons.local_grocery_store_rounded,
    },
    {
      'key': 'PHARMACY',
      'title': 'Famasi & Sante',
      'tagline': 'Medikaman, Lèt Ti Bebe, Vitamin & Premye Swen',
      'tags': ['Medikaman', 'Lèt bebe', 'Vitamin', 'Ijyèn'],
      'image': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
      'accent': const Color(0xFF0284C7),
      'badge': 'Sèvis Medikal',
      'icon': Icons.medical_services_rounded,
    },
    {
      'key': 'CLOTHING',
      'title': 'Boutik Rad & Mòd',
      'tagline': 'Mayo, Pantalon, Wòb, Soulye & Akseswa',
      'tags': ['Mayo & Chemiz', 'Wòb', 'Soulye', 'Mont & Sak'],
      'image': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      'accent': const Color(0xFF9333EA),
      'badge': 'Nouvo Koleksyon',
      'icon': Icons.checkroom_rounded,
    },
    {
      'key': 'ELECTRONICS',
      'title': 'Teknoloji & Aparèy',
      'tagline': 'Telefòn, Òdinatè, Ekoutè & Pwodwi Gaming',
      'tags': ['Telefòn', 'Laptop', 'AirPods', 'Pwodwi Gaming'],
      'image': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
      'accent': const Color(0xFF2563EB),
      'badge': 'Garanti 100%',
      'icon': Icons.devices_rounded,
    },
    {
      'key': 'HARDWARE',
      'title': 'Materyo Konstriksyon',
      'tagline': 'Siman, Fè, Blòk, Plonbri, Elektrik & Zouti',
      'tags': ['Siman & Fè', 'Plonbri', 'Elektrik', 'Zouti'],
      'image': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
      'accent': const Color(0xFFB45309),
      'badge': 'Kago & Transpò',
      'icon': Icons.construction_rounded,
    },
    {
      'key': 'BEAUTY',
      'title': 'Bote & Kosmetik',
      'tagline': 'Pafen Original, Swen Po, Makiyaj & Cheve',
      'tags': ['Pafen', 'Swen Po', 'Makiyaj', 'Swen Cheve'],
      'image': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
      'accent': const Color(0xFFDB2777),
      'badge': '100% Otantik',
      'icon': Icons.spa_rounded,
    },
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _routeToCategory(String key) {
    HapticFeedback.lightImpact();
    context.push('/category/$key');
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _departments.where((d) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final title = d['title'].toString().toLowerCase();
      final tagline = d['tagline'].toString().toLowerCase();
      final tags = (d['tags'] as List<String>).join(' ').toLowerCase();
      return title.contains(q) || tagline.contains(q) || tags.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: _kBackground,
      appBar: AppBar(
        backgroundColor: _kHeaderBlack,
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.storefront_rounded, color: _kOrange, size: 24),
            SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Kategori & Boutik',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.4,
                  ),
                ),
                Text(
                  'Delivery Lakay • Tout Kalite Komès',
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Search Bar ──────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: _kHeaderBlack,
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                  decoration: InputDecoration(
                    hintText: 'Chèche yon kategori (manje, famasi, rad, zouti)...',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    prefixIcon: const Icon(Icons.search_rounded, color: _kOrange, size: 22),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF94A3B8)),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
            ),
          ),

          // ── Section Header ──────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Depatman & Kategori',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: _kTextDark,
                      letterSpacing: 0.2,
                    ),
                  ),
                  Text(
                    '${_departments.length} Kategori Espesyalis',
                    style: const TextStyle(
                      fontSize: 12,
                      color: _kTextMuted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Professional Magazine Category Cards ────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final dept = filtered[index];
                  final String key = dept['key'];
                  final String title = dept['title'];
                  final String tagline = dept['tagline'];
                  final String image = dept['image'];
                  final Color accent = dept['accent'];
                  final String badge = dept['badge'];
                  final List<String> tags = dept['tags'];
                  final IconData icon = dept['icon'];

                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    height: 160,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 14,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => _routeToCategory(key),
                        splashColor: accent.withValues(alpha: 0.25),
                        highlightColor: accent.withValues(alpha: 0.1),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            // 1. High-Resolution Photo Background
                            Image.network(
                              image,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(color: accent),
                            ),

                            // 2. Cinematic Gradient Scrim
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    Colors.black.withValues(alpha: 0.45),
                                    Colors.black.withValues(alpha: 0.88),
                                  ],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  stops: const [0.0, 0.45, 1.0],
                                ),
                              ),
                            ),

                            // 3. Top Badges
                            Positioned(
                              top: 12,
                              left: 14,
                              right: 14,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  // Department Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: accent,
                                      borderRadius: BorderRadius.circular(8),
                                      boxShadow: [
                                        BoxShadow(
                                          color: accent.withValues(alpha: 0.4),
                                          blurRadius: 6,
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(icon, color: Colors.white, size: 14),
                                        const SizedBox(width: 5),
                                        Text(
                                          badge,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Arrow Indicator Button
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.25),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: Icon(
                                        Icons.arrow_forward_rounded,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // 4. Bottom Content
                            Positioned(
                              bottom: 14,
                              left: 16,
                              right: 16,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    tagline,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.9),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),

                                  // Subcategory Chips Row
                                  Row(
                                    children: tags.map((t) {
                                      return Container(
                                        margin: const EdgeInsets.only(right: 6),
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.18),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(
                                            color: Colors.white.withValues(alpha: 0.25),
                                            width: 0.5,
                                          ),
                                        ),
                                        child: Text(
                                          t,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
                childCount: filtered.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
