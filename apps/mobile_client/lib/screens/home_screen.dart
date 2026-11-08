import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';
import '../services/supabase_service.dart';
import '../widgets/doordash_cart_bar.dart';
import '../widgets/location_picker_sheet.dart';

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY LAKAY HAITI — HOME SCREEN
// Pure Real Data | Fully Interactive Menus | Haitian Creole UI
// ─────────────────────────────────────────────────────────────────────────────

const _kOrange = Color(0xFFFF6600);
const _kHeaderBlack = Color(0xFF111111);
const _kBackground = Color(0xFFF3F4F6);
const _kTextDark = Color(0xFF0F172A);
const _kTextMuted = Color(0xFF64748B);
const _kStarGold = Color(0xFFFFB800);

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with WidgetsBindingObserver {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String selectedCategory = 'ALL';
  String searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  String quickFilter = 'ALL';
  Timer? _homeRefreshTimer;

  // User info
  String clientName = 'Kliyan';
  String clientPhone = '';
  String clientAddress = 'Cap-Haïtien';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadClientInfo();
    _startAutoRefreshTimer();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _homeRefreshTimer?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Lè itilizatè a retounen nan app la, rafrechi tout bagay otomatikman san bezwen fèmen app la
      _triggerFullRefresh();
    }
  }

  void _startAutoRefreshTimer() {
    _homeRefreshTimer?.cancel();
    // Oto-rafrechi chak 4 segonn san blokaj pou tout nouvo kòmand, machann, ak pwodwi monte imedyatman
    _homeRefreshTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _triggerFullRefresh();
    });
  }

  void _triggerFullRefresh() {
    if (!mounted) return;
    ref.invalidate(ordersProvider);
    ref.invalidate(merchantsProvider(selectedCategory));
    if (selectedCategory != 'ALL') {
      ref.invalidate(merchantsProvider('ALL'));
    }
    ref.invalidate(featuredProductsProvider);
    ref.invalidate(unreadCountProvider);
    _loadClientInfo();
  }

  Future<void> _loadClientInfo() async {
    try {
      final profile = await SupabaseService().getUserProfile();
      if (profile != null && mounted) {
        setState(() {
          final fn = profile['firstName']?.toString() ?? '';
          final ln = profile['lastName']?.toString() ?? '';
          final full = '$fn $ln'.trim();
          if (full.isNotEmpty) clientName = full;
          clientPhone = profile['phoneNumber']?.toString() ?? '';
          final addrs = profile['addresses'] as List?;
          if (addrs != null && addrs.isNotEmpty) {
            clientAddress = addrs.first['fullAddress'] ?? clientAddress;
          }
        });
      }
    } catch (_) {}
  }

  void _onCategoryTapped(String catKey) {
    HapticFeedback.selectionClick();
    setState(() {
      selectedCategory = selectedCategory == catKey ? 'ALL' : catKey;
    });
  }

  @override
  Widget build(BuildContext context) {
    final merchantsAsync = ref.watch(merchantsProvider(selectedCategory));
    final productsAsync = ref.watch(featuredProductsProvider);
    final cart = ref.watch(cartProvider);
    final ordersAsync = ref.watch(ordersProvider);
    final unreadNotifs = ref.watch(unreadCountProvider);
    final deliveryLoc = ref.watch(deliveryLocationProvider);

    final displayAddress =
        deliveryLoc.address.isNotEmpty ? deliveryLoc.address : clientAddress;

    final hasActiveOrder = ordersAsync.maybeWhen(
      data: (orders) => orders.any((o) => o.isActive),
      orElse: () => false,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: _kHeaderBlack,
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        key: _scaffoldKey,
        drawer: _buildLakayDrawer(
          clientName: clientName,
          clientPhone: clientPhone,
          clientAddress: displayAddress,
          cartCount: cart.totalAllItemsCount,
          hasActiveOrder: hasActiveOrder,
        ),
        backgroundColor: _kBackground,
        body: Stack(
          children: [
            // ── MAIN SCROLL ─────────────────────────────────────────────────
            RefreshIndicator(
              color: _kOrange,
              onRefresh: () async {
                ref.invalidate(merchantsProvider(selectedCategory));
                ref.invalidate(featuredProductsProvider);
                ref.invalidate(ordersProvider);
              },
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(
                    parent: AlwaysScrollableScrollPhysics()),
                slivers: [
                  // 1. BLACK HEADER
                  SliverToBoxAdapter(
                    child: _buildLakayHeader(
                      displayAddress: displayAddress,
                      unreadNotifs: unreadNotifs,
                      cartCount: cart.totalAllItemsCount,
                    ),
                  ),

                  // 2. 7-CATEGORY HORIZONTAL SCROLL (FULLY INTERACTIVE)
                  SliverToBoxAdapter(
                    child: _CategoryScrollRow(
                      selectedCategory: selectedCategory,
                      onCategorySelect: _onCategoryTapped,
                    ),
                  ),

                  // 3. LIVE ORDER BAR (if active)
                  ordersAsync.maybeWhen(
                    data: (orders) {
                      final active = orders.where((o) => o.isActive).toList();
                      if (active.isEmpty) {
                        return const SliverToBoxAdapter(
                            child: SizedBox.shrink());
                      }
                      return SliverToBoxAdapter(
                        child: _buildLiveOrderBar(active.first),
                      );
                    },
                    orElse: () =>
                        const SliverToBoxAdapter(child: SizedBox.shrink()),
                  ),

                  // 4. HERO BANNER
                  SliverToBoxAdapter(
                    child: _HeroBanner(
                      onCtaTap: () {
                        setState(() => selectedCategory = 'RESTAURANT');
                      },
                    ),
                  ),

                  // 5. BOUTIK POPILÈ YO (REAL MERCHANTS FROM DATABASE)
                  SliverToBoxAdapter(
                    child: _BoutikPopile(
                      merchantsAsync: merchantsAsync,
                      onMerchantTap: (m) async {
                        await context.push('/merchant/${m.id}', extra: m);
                        if (mounted) _triggerFullRefresh();
                      },
                    ),
                  ),

                  // 6. PWODWI REKÒMANDE YO (REAL PRODUCTS FROM DATABASE)
                  SliverToBoxAdapter(
                    child: _PwodwiRekomande(
                      productsAsync: productsAsync,
                      merchantsAsync: merchantsAsync,
                    ),
                  ),

                  // 7. SECTION HEADER "Tout Biznis yo"
                  SliverToBoxAdapter(
                    child: _buildMerchantsHeader(merchantsAsync),
                  ),

                  // 8. MERCHANT GRID (REAL DATABASE MERCHANTS)
                  merchantsAsync.when(
                    skipLoadingOnReload: true,
                    skipLoadingOnRefresh: true,
                    loading: () => SliverPadding(
                      padding: const EdgeInsets.fromLTRB(8, 0, 8, 110),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 0.72,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (_, _) => _buildSkeletonCard(),
                          childCount: 6,
                        ),
                      ),
                    ),
                    error: (err, _) => SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.cloud_off_rounded,
                                  size: 40, color: _kTextMuted),
                              const SizedBox(height: 8),
                              const Text('Pa ka chaje biznis yo kounye a',
                                  style: TextStyle(
                                      color: _kTextDark,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14)),
                              const SizedBox(height: 10),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                    backgroundColor: _kOrange),
                                onPressed: () => ref.invalidate(
                                    merchantsProvider(selectedCategory)),
                                child: const Text('Eseye Ankò',
                                    style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    data: (merchants) {
                      var filtered = merchants.where((m) {
                        if (searchQuery.isNotEmpty) {
                          final q = searchQuery.toLowerCase();
                          return m.name.toLowerCase().contains(q) ||
                              m.address.toLowerCase().contains(q);
                        }
                        return true;
                      }).toList();

                      if (quickFilter == 'TOP_RATED') {
                        filtered =
                            filtered.where((m) => m.rating >= 4.5).toList();
                      } else if (quickFilter == 'FAST') {
                        filtered = filtered
                            .where((m) => m.avgPrepTimeMinutes <= 25)
                            .toList();
                      }

                      if (filtered.isEmpty) {
                        return SliverFillRemaining(
                          hasScrollBody: false,
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.storefront_outlined,
                                      size: 48, color: _kTextMuted),
                                  const SizedBox(height: 10),
                                  const Text(
                                    'Pa gen okenn biznis nan kategori sa a',
                                    style: TextStyle(
                                        color: _kTextDark,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 8),
                                  TextButton(
                                    onPressed: () =>
                                        setState(() => selectedCategory = 'ALL'),
                                    child: const Text('Gade Tout Biznis yo',
                                        style: TextStyle(color: _kOrange)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }

                      return SliverPadding(
                        padding: const EdgeInsets.fromLTRB(8, 0, 8, 110),
                        sliver: SliverGrid(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                            childAspectRatio: 0.72,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (_, i) => _LakayMerchantCard(
                                merchant: filtered[i]),
                            childCount: filtered.length,
                          ),
                        ),
                      );
                    },
                  ),

                  // 9. TRUST BAR (WITH REAL CONTACT ACTION)
                  SliverToBoxAdapter(
                    child: _TrustBar(
                      onContactTap: () => _openContactModal(context),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 90)),
                ],
              ),
            ),

            // ── FLOATING CART BAR ────────────────────────────────────────────
            if (cart.openCarts.isNotEmpty)
              const Positioned(
                left: 0,
                right: 0,
                bottom: 12,
                child: DoorDashCartBar(),
              ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. BLACK HEADER — Menu | Logo | Bell | Location pill | Search bar
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildLakayHeader({
    required String displayAddress,
    required int unreadNotifs,
    required int cartCount,
  }) {
    return Container(
      color: _kHeaderBlack,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ROW 1: Hamburger | Logo + Name + Tagline | Bell
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
              child: Row(
                children: [
                  // Hamburger Button -> Opens Drawer
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _scaffoldKey.currentState?.openDrawer();
                    },
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.menu_rounded,
                          color: Colors.white, size: 24),
                    ),
                  ),

                  // Center Logo + Name + Tagline
                  Expanded(
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 30,
                              height: 30,
                              decoration: const BoxDecoration(
                                color: _kOrange,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.two_wheeler_rounded,
                                  color: Colors.white, size: 17),
                            ),
                            const SizedBox(width: 8),
                            RichText(
                              text: const TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'DELIVERY\n',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.0,
                                      height: 1.1,
                                    ),
                                  ),
                                  TextSpan(
                                    text: 'LAKAY HAITI',
                                    style: TextStyle(
                                      color: _kOrange,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                      height: 1.1,
                                    ),
                                  ),
                                ],
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Pi rapid • Pi fyab • Tout kote',
                          style: TextStyle(
                            color: Color(0xFFCCCCCC),
                            fontSize: 10,
                            fontWeight: FontWeight.w400,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Notification Bell + Badge
                  GestureDetector(
                    onTap: () async {
                      await context.push('/notifications');
                      if (mounted) _triggerFullRefresh();
                    },
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.notifications_none_rounded,
                              color: Colors.white, size: 24),
                        ),
                        if (unreadNotifs > 0)
                          Positioned(
                            right: -2,
                            top: -2,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: _kOrange,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              constraints: const BoxConstraints(
                                  minWidth: 16, minHeight: 16),
                              child: Center(
                                child: Text(
                                  unreadNotifs > 9 ? '9+' : '$unreadNotifs',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ROW 2: Location pill (opens LocationPicker) + Search bar
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Row(
                children: [
                  // Location pill
                  GestureDetector(
                    onTap: () async {
                      HapticFeedback.lightImpact();
                      await LocationPickerSheet.show(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.25),
                            width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on_rounded,
                              color: _kOrange, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            displayAddress.length > 16
                                ? '${displayAddress.substring(0, 14)}…'
                                : displayAddress,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 3),
                          const Icon(Icons.keyboard_arrow_down_rounded,
                              color: Colors.white, size: 15),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(width: 10),

                  // Search bar
                  Expanded(
                    child: Container(
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(left: 10, right: 6),
                            child: Icon(Icons.search_rounded,
                                color: Color(0xFF9CA3AF), size: 18),
                          ),
                          Expanded(
                            child: TextField(
                              controller: _searchCtrl,
                              onChanged: (val) =>
                                  setState(() => searchQuery = val),
                              style: const TextStyle(
                                  color: _kTextDark,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500),
                              decoration: InputDecoration(
                                hintText: 'Chèche yon bagay...',
                                hintStyle: const TextStyle(
                                    color: Color(0xFF9CA3AF), fontSize: 12),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding:
                                    const EdgeInsets.symmetric(vertical: 10),
                                suffixIcon: searchQuery.isNotEmpty
                                    ? GestureDetector(
                                        onTap: () {
                                          _searchCtrl.clear();
                                          setState(() => searchQuery = '');
                                        },
                                        child: const Icon(Icons.close_rounded,
                                            size: 15,
                                            color: Color(0xFF9CA3AF)),
                                      )
                                    : null,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIDE DRAWER MENU (REAL APP MENU)
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildLakayDrawer({
    required String clientName,
    required String clientPhone,
    required String clientAddress,
    required int cartCount,
    required bool hasActiveOrder,
  }) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            Container(
              padding: const EdgeInsets.all(18),
              color: _kHeaderBlack,
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: _kOrange,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Center(
                      child: Icon(Icons.person_rounded,
                          color: Colors.white, size: 28),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          clientName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          clientPhone.isNotEmpty
                              ? clientPhone
                              : 'Kliyan Delivery Lakay',
                          style: const TextStyle(
                            color: Color(0xFF9CA3AF),
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.location_on_rounded,
                                color: _kOrange, size: 12),
                            const SizedBox(width: 2),
                            Expanded(
                              child: Text(
                                clientAddress,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Menu Items List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _drawerTile(
                    icon: Icons.home_rounded,
                    title: 'Akèy',
                    onTap: () => Navigator.pop(context),
                  ),
                  _drawerTile(
                    icon: Icons.storefront_rounded,
                    title: 'Tout Biznis & Restoran',
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => selectedCategory = 'ALL');
                    },
                  ),
                  _drawerTile(
                    icon: Icons.lunch_dining_rounded,
                    title: 'Restoran & Manje Cho',
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => selectedCategory = 'RESTAURANT');
                    },
                  ),
                  _drawerTile(
                    icon: Icons.local_grocery_store_rounded,
                    title: 'Boutik & Makèt',
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => selectedCategory = 'GROCERY');
                    },
                  ),
                  _drawerTile(
                    icon: Icons.grid_view_rounded,
                    title: 'Tout 7 Kategori yo',
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/categories');
                    },
                  ),
                  const Divider(height: 16, indent: 16, endIndent: 16),
                  _drawerTile(
                    icon: Icons.shopping_cart_rounded,
                    title: 'Panyen Mwen',
                    badge: cartCount > 0 ? '$cartCount' : null,
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/cart');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  _drawerTile(
                    icon: Icons.receipt_long_rounded,
                    title: 'Kòmand Mwen',
                    badge: hasActiveOrder ? 'Aktif' : null,
                    badgeColor: Colors.green,
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/orders');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  _drawerTile(
                    icon: Icons.account_balance_wallet_rounded,
                    title: 'Bous Vityèl',
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/wallet');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  _drawerTile(
                    icon: Icons.favorite_rounded,
                    title: 'Favori Mwen yo',
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/favorites');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  _drawerTile(
                    icon: Icons.card_giftcard_rounded,
                    title: 'Pwen Fidelite & Kado',
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/loyalty');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  _drawerTile(
                    icon: Icons.notifications_rounded,
                    title: 'Notifikasyon',
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/notifications');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  const Divider(height: 16, indent: 16, endIndent: 16),
                  _drawerTile(
                    icon: Icons.edit_location_alt_rounded,
                    title: 'Chanje Zòn / Adrès',
                    onTap: () async {
                      Navigator.pop(context);
                      await LocationPickerSheet.show(context);
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                  _drawerTile(
                    icon: Icons.headset_mic_rounded,
                    title: 'Sipò Kliyan 24/7',
                    onTap: () {
                      Navigator.pop(context);
                      _openContactModal(context);
                    },
                  ),
                  _drawerTile(
                    icon: Icons.person_outline_rounded,
                    title: 'Profil & Paramèt',
                    onTap: () async {
                      Navigator.pop(context);
                      await context.push('/profile');
                      if (mounted) _triggerFullRefresh();
                    },
                  ),
                ],
              ),
            ),

            // Drawer Footer
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                'Delivery Lakay Haiti • v2.0\nCap-Haïtien, Haïti',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    String? badge,
    Color badgeColor = _kOrange,
  }) {
    return ListTile(
      dense: true,
      leading: Icon(icon, color: _kOrange, size: 21),
      title: Text(
        title,
        style: const TextStyle(
          color: _kTextDark,
          fontSize: 13,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: badge != null
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badge,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w900),
              ),
            )
          : null,
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE ORDER BAR
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildLiveOrderBar(Order order) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: _kOrange.withValues(alpha: 0.4), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: _kOrange.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: Color(0xFFFFF1EB),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.two_wheeler_rounded,
                color: _kOrange, size: 19),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Kòmand #${order.orderNumber} ap prepare',
                  style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12.5,
                      color: _kTextDark),
                ),
                Text(
                  order.merchantName ?? 'Restoran DLH',
                  style: const TextStyle(fontSize: 11, color: _kTextMuted),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () =>
                context.push('/order-tracking/${order.id}', extra: order),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _kOrange,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Swiv',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MERCHANTS SECTION HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildMerchantsHeader(AsyncValue<List<Merchant>> merchantsAsync) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: _kOrange,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Tout Biznis yo',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: _kTextDark,
                    letterSpacing: -0.3),
              ),
            ],
          ),
          // Filter chips
          Row(
            children: [
              _filterChip('Tout', 'ALL'),
              const SizedBox(width: 6),
              _filterChip('Top ★', 'TOP_RATED'),
              const SizedBox(width: 6),
              _filterChip('Vit', 'FAST'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String key) {
    final sel = quickFilter == key;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => quickFilter = key);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: sel ? _kOrange : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: sel ? _kOrange : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: sel ? Colors.white : _kTextMuted,
            fontSize: 10.5,
            fontWeight: sel ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SKELETON LOADING CARD
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildSkeletonCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 110,
            decoration: const BoxDecoration(
              color: Color(0xFFE2E8F0),
              borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 12, width: 100, color: const Color(0xFFE2E8F0)),
                const SizedBox(height: 6),
                Container(height: 10, width: 60, color: const Color(0xFFF1F5F9)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACT MODAL (WHATSAPP & PHONE)
  // ═══════════════════════════════════════════════════════════════════════════
  void _openContactModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Kontakte Sipò Delivery Lakay',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: _kTextDark,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Ekip nou an disponib 24/7 pou ede w ak nenpòt kesyon',
                style: TextStyle(color: _kTextMuted, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Color(0xFF25D366),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.chat_rounded, color: Colors.white),
                ),
                title: const Text('WhatsApp Sipò',
                    style: TextStyle(fontWeight: FontWeight.w800)),
                subtitle: const Text('+509 40 55 36 36'),
                onTap: () async {
                  Navigator.pop(ctx);
                  final uri = Uri.parse('https://wa.me/50940553636?text=Bonjou,%20mwen%20bezwen%20èd%20sou%20Delivery%20Lakay');
                  if (await canLaunchUrl(uri)) launchUrl(uri);
                },
              ),
              const Divider(),
              ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: _kOrange,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.phone_rounded, color: Colors.white),
                ),
                title: const Text('Rele Nou Dirèkteman',
                    style: TextStyle(fontWeight: FontWeight.w800)),
                subtitle: const Text('+509 40 55 36 36'),
                onTap: () async {
                  Navigator.pop(ctx);
                  final uri = Uri.parse('tel:+50940553636');
                  if (await canLaunchUrl(uri)) launchUrl(uri);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7-CATEGORY HORIZONTAL SCROLL ROW (FULLY INTERACTIVE & VISUAL FEEDBACK)
// ─────────────────────────────────────────────────────────────────────────────
class _CategoryScrollRow extends StatelessWidget {
  final String selectedCategory;
  final ValueChanged<String> onCategorySelect;

  const _CategoryScrollRow({
    required this.selectedCategory,
    required this.onCategorySelect,
  });

  static const _cats = [
    _CatData(
      keyId: 'RESTAURANT',
      label: 'Manje &\nRestoran',
      icon: Icons.restaurant_rounded,
      color: Color(0xFFFF6600),
    ),
    _CatData(
      keyId: 'GROCERY',
      label: 'Supermarché\n& Makèt',
      icon: Icons.local_grocery_store_rounded,
      color: Color(0xFF16A34A),
    ),
    _CatData(
      keyId: 'PHARMACY',
      label: 'Famasi &\nSante',
      icon: Icons.medical_services_rounded,
      color: Color(0xFF0284C7),
    ),
    _CatData(
      keyId: 'CLOTHING',
      label: 'Boutik Rad\n& Mòd',
      icon: Icons.checkroom_rounded,
      color: Color(0xFF9333EA),
    ),
    _CatData(
      keyId: 'ELECTRONICS',
      label: 'Teknoloji\n& Aparèy',
      icon: Icons.devices_rounded,
      color: Color(0xFF2563EB),
    ),
    _CatData(
      keyId: 'HARDWARE',
      label: 'Materyo\nKonstriksyon',
      icon: Icons.construction_rounded,
      color: Color(0xFFB45309),
    ),
    _CatData(
      keyId: 'BEAUTY',
      label: 'Bote &\nKosmetik',
      icon: Icons.spa_rounded,
      color: Color(0xFFDB2777),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14),
      margin: const EdgeInsets.only(bottom: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: _cats.map((cat) {
            final isSelected = selectedCategory == cat.keyId;
            return Padding(
              padding: const EdgeInsets.only(right: 18),
              child: _CatItem(
                cat: cat,
                isSelected: isSelected,
                onTap: () => onCategorySelect(cat.keyId),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _CatData {
  final String keyId;
  final String label;
  final IconData icon;
  final Color color;
  const _CatData({
    required this.keyId,
    required this.label,
    required this.icon,
    required this.color,
  });
}

class _CatItem extends StatelessWidget {
  final _CatData cat;
  final bool isSelected;
  final VoidCallback onTap;

  const _CatItem({
    required this.cat,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: isSelected ? cat.color : cat.color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? cat.color : cat.color.withValues(alpha: 0.25),
                  width: isSelected ? 2.5 : 1.5,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: cat.color.withValues(alpha: 0.4),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        )
                      ]
                    : null,
              ),
              child: Center(
                child: Icon(
                  cat.icon,
                  size: 26,
                  color: isSelected ? Colors.white : cat.color,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              cat.label,
              style: TextStyle(
                color: isSelected ? cat.color : _kTextDark,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                height: 1.3,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNER
// ─────────────────────────────────────────────────────────────────────────────
class _HeroBanner extends StatefulWidget {
  final VoidCallback onCtaTap;
  const _HeroBanner({required this.onCtaTap});

  @override
  State<_HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<_HeroBanner> {
  int _dot = 0;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    _t = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted) setState(() => _dot = (_dot + 1) % 3);
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 4, 12, 10),
      height: 150,
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0D0D1A), Color(0xFF1A1A2E)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
            Positioned(
              left: -10,
              bottom: 0,
              top: 0,
              child: SizedBox(
                width: 160,
                child: Image.network(
                  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFF6600), Color(0xFFFF9933)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Center(
                      child: Icon(Icons.lunch_dining_rounded,
                          color: Colors.white, size: 60),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 100,
              top: 0,
              bottom: 0,
              width: 60,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.transparent, Color(0xFF1A1A2E)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                ),
              ),
            ),
            Positioned(
              right: 14,
              top: 20,
              bottom: 20,
              left: 150,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Livrezon Manje\nnan kèk minit!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      height: 1.25,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      widget.onCtaTap();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: _kOrange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Kòmande Kounye',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded,
                              color: Colors.white, size: 13),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              bottom: 10,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (i) {
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: i == _dot ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _dot
                          ? _kOrange
                          : Colors.white.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOUTIK POPILÈ YO — REAL DATABASE MERCHANTS (ZERO FAKE DATA)
// ─────────────────────────────────────────────────────────────────────────────
class _BoutikPopile extends ConsumerWidget {
  final AsyncValue<List<Merchant>> merchantsAsync;
  final void Function(Merchant) onMerchantTap;

  const _BoutikPopile({
    required this.merchantsAsync,
    required this.onMerchantTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: _kOrange.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Center(
                      child: Icon(Icons.storefront_rounded,
                          color: _kOrange, size: 15),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Boutik Popilè yo',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: _kTextDark,
                        letterSpacing: -0.3),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => HapticFeedback.lightImpact(),
                child: const Row(
                  children: [
                    Text(
                      'Wè tout',
                      style: TextStyle(
                          color: _kOrange,
                          fontSize: 12,
                          fontWeight: FontWeight.w700),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios_rounded,
                        color: _kOrange, size: 10),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Horizontal Merchants List
        SizedBox(
          height: 195,
          child: merchantsAsync.when(
            skipLoadingOnReload: true,
            skipLoadingOnRefresh: true,
            loading: () => ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: 3,
              itemBuilder: (_, _) => Container(
                width: 130,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Container(height: 100, color: const Color(0xFFE2E8F0)),
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(height: 10, width: 80, color: const Color(0xFFE2E8F0)),
                          const SizedBox(height: 6),
                          Container(height: 8, width: 50, color: const Color(0xFFF1F5F9)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            error: (_, _) => const SizedBox.shrink(),
            data: (merchants) {
              if (merchants.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'Pa gen boutik ki anrejistre kounye a',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                  ),
                );
              }
              return ListView.builder(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: merchants.length,
                itemBuilder: (_, i) {
                  final m = merchants[i];
                  final isFav = ref.watch(favoritesProvider.notifier).isFavorite(m.id);
                  return _RealBoutikCard(
                    merchant: m,
                    isFavorite: isFav,
                    onFollowTap: () {
                      HapticFeedback.lightImpact();
                      ref.read(favoritesProvider.notifier).toggle(m);
                    },
                    onTap: () => onMerchantTap(m),
                  );
                },
              );
            },
          ),
        ),

        const SizedBox(height: 4),
      ],
    );
  }
}

class _RealBoutikCard extends StatelessWidget {
  final Merchant merchant;
  final bool isFavorite;
  final VoidCallback onFollowTap;
  final VoidCallback onTap;

  const _RealBoutikCard({
    required this.merchant,
    required this.isFavorite,
    required this.onFollowTap,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final img = (merchant.bannerUrl != null && merchant.bannerUrl!.isNotEmpty)
        ? merchant.bannerUrl!
        : (merchant.logoUrl != null && merchant.logoUrl!.isNotEmpty)
            ? merchant.logoUrl!
            : _fallbackImg(merchant.category);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 135,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Merchant Image
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(14)),
              child: SizedBox(
                height: 98,
                width: double.infinity,
                child: Image.network(
                  img,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    color: const Color(0xFFF1F5F9),
                    child: const Icon(Icons.storefront_rounded,
                        size: 36, color: Color(0xFFCBD5E1)),
                  ),
                ),
              ),
            ),

            // Merchant Info
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 7),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    merchant.name,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: _kTextDark,
                      height: 1.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          color: _kStarGold, size: 12),
                      const SizedBox(width: 2),
                      Text(
                        merchant.rating.toStringAsFixed(1),
                        style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: _kTextDark),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '(${merchant.avgPrepTimeMinutes}m)',
                        style: const TextStyle(
                            fontSize: 9.5, color: _kTextMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: onFollowTap,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: isFavorite ? const Color(0xFF059669) : _kOrange,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            isFavorite ? 'Swiv ✓' : 'Swiv +',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PWODWI REKÒMANDE YO — REAL DATABASE PRODUCTS (ZERO FAKE DATA)
// ─────────────────────────────────────────────────────────────────────────────
class _PwodwiRekomande extends ConsumerWidget {
  final AsyncValue<List<MenuItem>> productsAsync;
  final AsyncValue<List<Merchant>> merchantsAsync;

  const _PwodwiRekomande({
    required this.productsAsync,
    required this.merchantsAsync,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: _kOrange.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Center(
                      child: Icon(Icons.local_offer_rounded,
                          color: _kOrange, size: 15),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Pwodwi Rekòmande yo',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: _kTextDark,
                        letterSpacing: -0.3),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => HapticFeedback.lightImpact(),
                child: const Row(
                  children: [
                    Text(
                      'Wè tout',
                      style: TextStyle(
                          color: _kOrange,
                          fontSize: 12,
                          fontWeight: FontWeight.w700),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios_rounded,
                        color: _kOrange, size: 10),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Product Scroll
        SizedBox(
          height: 170,
          child: productsAsync.when(
            skipLoadingOnReload: true,
            skipLoadingOnRefresh: true,
            loading: () => ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: 4,
              itemBuilder: (_, _) => Container(
                width: 110,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Container(height: 90, color: const Color(0xFFE2E8F0)),
                    Padding(
                      padding: const EdgeInsets.all(6),
                      child: Container(height: 10, color: const Color(0xFFF1F5F9)),
                    ),
                  ],
                ),
              ),
            ),
            error: (_, _) => const SizedBox.shrink(),
            data: (products) {
              if (products.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'Pa gen pwodwi disponib kounye a',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                  ),
                );
              }
              return ListView.builder(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: products.length,
                itemBuilder: (_, i) {
                  final p = products[i];
                  return _RealProductCard(
                    product: p,
                    onAddToCart: () {
                      HapticFeedback.lightImpact();
                      // Find merchant for this product
                      final merchants = merchantsAsync.value ?? [];
                      Merchant? matchedMerchant;
                      if (p.merchantId != null) {
                        try {
                          matchedMerchant = merchants.firstWhere((m) => m.id == p.merchantId);
                        } catch (_) {}
                      }
                      matchedMerchant ??= merchants.isNotEmpty ? merchants.first : null;

                      if (matchedMerchant != null) {
                        ref.read(cartProvider.notifier).addItem(matchedMerchant, p);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${p.name} ajoute nan panyen!'),
                            duration: const Duration(seconds: 1),
                            backgroundColor: _kOrange,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
                  );
                },
              );
            },
          ),
        ),

        const SizedBox(height: 10),
      ],
    );
  }
}

class _RealProductCard extends StatelessWidget {
  final MenuItem product;
  final VoidCallback onAddToCart;

  const _RealProductCard({
    required this.product,
    required this.onAddToCart,
  });

  @override
  Widget build(BuildContext context) {
    final imgUrl = product.image ?? '';

    return Container(
      width: 115,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            child: SizedBox(
              height: 90,
              width: double.infinity,
              child: imgUrl.isNotEmpty
                  ? Image.network(
                      imgUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        color: const Color(0xFFF1F5F9),
                        child: const Icon(Icons.shopping_bag_rounded,
                            size: 32, color: Color(0xFFCBD5E1)),
                      ),
                    )
                  : Container(
                      color: const Color(0xFFF1F5F9),
                      child: const Icon(Icons.shopping_bag_rounded,
                          size: 32, color: Color(0xFFCBD5E1)),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(7, 6, 7, 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: _kTextDark,
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 5),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${product.price.toInt()} Gdes',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: _kTextDark,
                      ),
                    ),
                    GestureDetector(
                      onTap: onAddToCart,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: _kOrange,
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: const Icon(Icons.add_shopping_cart_rounded,
                            color: Colors.white, size: 14),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUST BAR — Security + 24/7 Support + Real Contact
// ─────────────────────────────────────────────────────────────────────────────
class _TrustBar extends StatelessWidget {
  final VoidCallback onContactTap;
  const _TrustBar({required this.onContactTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Security
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.verified_user_rounded,
                      color: Color(0xFF059669), size: 15),
                ),
                const SizedBox(width: 6),
                const Expanded(
                  child: Text(
                    'Livrezon\nan sekirite\nak garanti',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        height: 1.3),
                  ),
                ),
              ],
            ),
          ),

          Container(
              width: 1,
              height: 36,
              color: Colors.white.withValues(alpha: 0.15)),

          // 24/7 Support
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _kOrange.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.headset_mic_rounded,
                        color: _kOrange, size: 15),
                  ),
                  const SizedBox(width: 6),
                  const Expanded(
                    child: Text(
                      'Sèvis Kliyan\n24/7',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Contact CTA
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              onContactTap();
            },
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _kOrange,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Kontakte',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900),
                  ),
                  Text(
                    'Nou',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900),
                  ),
                  Icon(Icons.arrow_forward_rounded,
                      color: Colors.white, size: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAKAY MERCHANT CARD (REAL 3-column grid)
// ─────────────────────────────────────────────────────────────────────────────
class _LakayMerchantCard extends ConsumerWidget {
  final Merchant merchant;
  const _LakayMerchantCard({required this.merchant});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliveryLoc = ref.watch(deliveryLocationProvider);
    final cLat = deliveryLoc.latitude ?? 19.7550;
    final cLng = deliveryLoc.longitude ?? -72.2050;
    final distKm = _haversine(
        merchant.latitude, merchant.longitude, cLat, cLng);
    final extraKm = math.max(0.0, distKm - 2.0);
    final deliveryFee = (150.0 + (extraKm * 35.0)).round();

    final imageUrl =
        (merchant.bannerUrl != null && merchant.bannerUrl!.isNotEmpty)
            ? merchant.bannerUrl!
            : (merchant.logoUrl != null && merchant.logoUrl!.isNotEmpty)
                ? merchant.logoUrl!
                : _fallbackImg(merchant.category);

    return GestureDetector(
      onTap: () => context.push('/merchant/${merchant.id}', extra: merchant),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 0.8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 52,
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(14)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        color: const Color(0xFFF1F5F9),
                        child: const Icon(Icons.storefront_rounded,
                            size: 36, color: Color(0xFFCBD5E1)),
                      ),
                    ),
                    Positioned(
                      left: 6,
                      bottom: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.access_time_rounded,
                                size: 10, color: Colors.white),
                            const SizedBox(width: 3),
                            Text(
                              '${merchant.avgPrepTimeMinutes} min',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Info
            Expanded(
              flex: 48,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(6, 5, 6, 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      merchant.name,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: _kTextDark,
                        letterSpacing: -0.2,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            color: _kStarGold, size: 11),
                        const SizedBox(width: 2),
                        Text(
                          merchant.rating.toStringAsFixed(1),
                          style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFB45309)),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(
                      'Frè $deliveryFee G',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: _kOrange,
                        letterSpacing: -0.3,
                      ),
                      overflow: TextOverflow.ellipsis,
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
  final dLat = (lat2 - lat1) * (3.141592653589793 / 180.0);
  final dLon = (lon2 - lon1) * (3.141592653589793 / 180.0);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1 * (3.141592653589793 / 180.0)) *
          math.cos(lat2 * (3.141592653589793 / 180.0)) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);
  return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}
