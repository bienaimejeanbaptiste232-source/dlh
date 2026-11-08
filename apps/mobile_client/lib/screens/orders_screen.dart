import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/constants.dart';
import '../config/store_type_config.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';
import '../widgets/rating_review_dialog.dart';

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  Timer? _pollingTimer;
  String _historyFilter = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  bool _pulseOn = true;
  Timer? _pulseTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 2, vsync: this);
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted) ref.invalidate(ordersProvider);
    });
    _pulseTimer = Timer.periodic(const Duration(milliseconds: 800), (_) {
      if (mounted) setState(() => _pulseOn = !_pulseOn);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tabController.dispose();
    _pollingTimer?.cancel();
    _pulseTimer?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      ref.invalidate(ordersProvider);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(ordersProvider);
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: _buildAppBar(ordersAsync),
      body: ordersAsync.when(
        skipLoadingOnReload: true,
        skipLoadingOnRefresh: true,
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppConstants.primaryCrimson)),
        error: (err, stack) => _buildErrorView(),
        data: (orders) {
          final active = orders.where((o) => o.isActive).toList();
          final past = orders.where((o) => !o.isActive).toList();
          return RefreshIndicator(
            color: AppConstants.primaryCrimson,
            onRefresh: () async {
              ref.invalidate(ordersProvider);
            },
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildActiveTab(active),
                _buildHistoryTab(past),
              ],
            ),
          );
        },
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APP BAR
  // ─────────────────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar(AsyncValue<List<Order>> ordersAsync) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(115),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                      onPressed: () {
                        if (context.canPop()) {
                          context.pop();
                        } else {
                          context.go("/");
                        }
                      },
                    ),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Kòmand Mwen Yo',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white, letterSpacing: -0.3),
                          ),
                          Text('Suiv ak jere tout kòmand ou yo',
                            style: TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 24),
                      tooltip: 'Rafrechi kòmand yo',
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        ref.invalidate(ordersProvider);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Row(
                              children: [
                                Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
                                SizedBox(width: 8),
                                Text('Kòmand yo rafrechi avèk siksè!'),
                              ],
                            ),
                            backgroundColor: Color(0xFF0F172A),
                            duration: Duration(seconds: 1),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: ordersAsync.maybeWhen(
                  data: (orders) {
                    final activeCount = orders.where((o) => o.isActive).length;
                    final pastCount = orders.where((o) => !o.isActive).length;
                    return _buildTabBar(activeCount, pastCount);
                  },
                  orElse: () => _buildTabBar(0, 0),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar(int activeCount, int pastCount) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelColor: const Color(0xFFFF6600),
        unselectedLabelColor: Colors.white,
        labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
        tabs: [
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (activeCount > 0) ...[
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: _pulseOn
                          ? const Color(0xFF10B981)
                          : const Color(0xFF10B981).withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                ],
                const Text('An Kour'),
                if (activeCount > 0) ...[
                  const SizedBox(width: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF6600),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "$activeCount",
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Istorik'),
                if (pastCount > 0) ...[
                  const SizedBox(width: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "$pastCount",
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1 — ACTIVE ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildActiveTab(List<Order> active) {
    if (active.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                  border:
                      Border.all(color: const Color(0xFFE2E8F0), width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.moped_rounded,
                      color: Color(0xFF94A3B8), size: 46),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Pa gen kòmand an kour',
                style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Lè w pase yon kòmand, w ap ka swiv livrè a sou kat la an tan reyèl isit la.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Color(0xFF64748B), fontSize: 13, height: 1.5),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.restaurant_menu_rounded,
                    size: 18, color: Colors.white),
                label: const Text(
                  'Kòmande Kounye a',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryCrimson,
                  elevation: 2,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 26, vertical: 13),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppConstants.primaryCrimson,
      onRefresh: () async => ref.refresh(ordersProvider),
      child: ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 36),
        itemCount: active.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, i) => _buildActiveOrderCard(active[i]),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIVE ORDER CARD
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildActiveOrderCard(Order order) {
    final badge = _statusBadge(order.status, true);
    final step = _activeStep(order.status);
    final storeConfig = StoreTypeConfig.from(
      category: order.merchantCategory,
      merchantName: order.merchantName,
    );
    final mName = order.merchantName ?? storeConfig.storeNoun;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
            color: const Color(0xFF38BDF8).withValues(alpha: 0.5),
            width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.10),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildActiveCardHeader(mName, order, badge, storeConfig),
          _buildProgressStepper(order.status, step, storeConfig),
          if (order.driverName != null && order.driverName!.isNotEmpty)
            _buildDriverCard(order),
          _buildActiveCardFooter(order),
          _buildActiveCardActions(order),
        ],
      ),
    );
  }

  Widget _buildActiveCardHeader(
      String mName, Order order, _BadgeStyle badge, StoreTypeConfig storeConfig) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 14, 12),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: storeConfig.badgeBgColor,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: storeConfig.primaryColor.withValues(alpha: 0.3)),
            ),
            child: Center(
              child: Icon(storeConfig.icon,
                  color: storeConfig.primaryColor, size: 24),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.tag_rounded,
                        size: 12, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 2),
                    Flexible(
                      child: Text(
                        order.orderNumber,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(
                            ClipboardData(text: order.orderNumber));
                        _snack('Nimewo kòmand kopye!', Colors.blueGrey);
                      },
                      child: const Icon(Icons.copy_rounded,
                          size: 13, color: Color(0xFFBAE6FD)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Status badge with pulse dot
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: badge.bg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: badge.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: _pulseOn
                        ? badge.fg
                        : badge.fg.withValues(alpha: 0.3),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  badge.label,
                  style: TextStyle(
                    color: badge.fg,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressStepper(String status, int step, StoreTypeConfig storeConfig) {
    const steps = ['Konfime', 'Ap Prepare', 'Rekipere', 'Sou Wout'];
    final icons = [
      Icons.check_circle_outline_rounded,
      storeConfig.prepIcon,
      Icons.two_wheeler_rounded,
      Icons.near_me_rounded,
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Estati Livrezon',
                style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF64748B)),
              ),
              Text(
                _estimatedTime(status),
                style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0284C7)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Progress bar
          Row(
            children: List.generate(4, (i) {
              final done = i <= step;
              final current = i == step;
              return Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  height: 5,
                  margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: done
                        ? (current
                            ? const Color(0xFF0284C7)
                            : const Color(0xFF10B981))
                        : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 12),
          // Step icons + labels
          Row(
            children: List.generate(4, (i) {
              final done = i <= step;
              final current = i == step;
              return Expanded(
                child: Column(
                  children: [
                    Icon(
                      icons[i],
                      size: 18,
                      color: done
                          ? (current
                              ? storeConfig.primaryColor
                              : const Color(0xFF10B981))
                          : const Color(0xFFCBD5E1),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      steps[i],
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight:
                            current ? FontWeight.w800 : FontWeight.w500,
                        color: done
                            ? (current
                                ? storeConfig.primaryColor
                                : const Color(0xFF10B981))
                            : const Color(0xFFCBD5E1),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          Text(
            _statusDescription(status, storeConfig),
            style: const TextStyle(
              fontSize: 11.5,
              color: Color(0xFF475569),
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDriverCard(Order order) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 19,
              backgroundColor: Color(0xFF10B981),
              child: Icon(Icons.two_wheeler_rounded,
                  color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.driverName!,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF065F46),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    order.driverPlate != null
                        ? 'Plak: ${order.driverPlate}'
                        : 'Livrè Ofisyèl DLH',
                    style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF047857),
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
            if (order.driverPhone != null &&
                order.driverPhone!.isNotEmpty) ...[
              _circleAction(
                icon: Icons.phone_rounded,
                color: const Color(0xFF10B981),
                tooltip: 'Rele Livrè',
                onTap: () => _makePhoneCall(order.driverPhone!),
              ),
              const SizedBox(width: 6),
              _circleAction(
                icon: Icons.chat_bubble_outline_rounded,
                color: const Color(0xFF25D366),
                tooltip: 'WhatsApp Livrè',
                onTap: () => _openWhatsApp(
                  phone: order.driverPhone!,
                  message:
                      'Bonjou ${order.driverName ?? "Livrè"}, mwen se kliyan pou kòmand #${order.orderNumber}.',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActiveCardFooter(Order order) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Row(
        children: [
          const Icon(Icons.location_on_rounded,
              size: 15, color: Color(0xFFEF4444)),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              order.deliveryAddress ?? 'Adrès livrezon konfime',
              style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF475569),
                  fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '${order.totalAmount.toInt()} HTG',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveCardActions(Order order) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 2, 14, 14),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: SizedBox(
              height: 44,
              child: ElevatedButton.icon(
                onPressed: () =>
                    context.push('/order-tracking/${order.id}', extra: order),
                icon: const Icon(Icons.near_me_rounded,
                    color: Colors.white, size: 17),
                label: const Text(
                  'Suiv sou Kat',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 13.5),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  elevation: 1,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 44,
              child: OutlinedButton.icon(
                onPressed: () => _showReceiptSheet(order),
                icon: const Icon(Icons.receipt_rounded,
                    size: 16, color: Color(0xFF0F172A)),
                label: const Text(
                  'Resi',
                  style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                      fontSize: 13),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  backgroundColor: const Color(0xFFF8FAFC),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2 — ORDER HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildHistoryTab(List<Order> past) {
    if (past.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: const Color(0xFFE2E8F0), width: 1.5),
                ),
                child: const Center(
                  child: Icon(Icons.history_rounded,
                      color: Color(0xFF94A3B8), size: 44),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Ou poko gen kòmand pase',
                style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Tout kòmand ou te pase deja yo ap anrejistre isit la pou w re-kòmande fasilman.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Color(0xFF64748B), fontSize: 13, height: 1.5),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.storefront_rounded,
                    size: 18, color: Colors.white),
                label: const Text(
                  'Kòmanse Kòmande',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 13),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final filtered = past.where((o) {
      if (_historyFilter == 'DELIVERED' && o.status != 'DELIVERED') {
        return false;
      }
      if (_historyFilter == 'CANCELLED' &&
          !['CANCELLED', 'REFUNDED'].contains(o.status)) {
        return false;
      }
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        return (o.merchantName ?? '').toLowerCase().contains(q) ||
            o.orderNumber.toLowerCase().contains(q);
      }
      return true;
    }).toList();

    return Column(
      children: [
        // ── SEARCH + FILTER BAR ─────────────────────────────────────
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          child: Column(
            children: [
              Container(
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) =>
                      setState(() => _searchQuery = v.trim()),
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    hintText: 'Restoran oswa nimewo kòmand…',
                    hintStyle: const TextStyle(
                        fontSize: 12, color: Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_rounded,
                        size: 18, color: Color(0xFF64748B)),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded,
                                size: 16, color: Color(0xFF64748B)),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding:
                        const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _filterChip('Tout', 'ALL', past.length),
                  const SizedBox(width: 8),
                  _filterChip(
                    'Livre',
                    'DELIVERED',
                    past.where((o) => o.status == 'DELIVERED').length,
                  ),
                  const SizedBox(width: 8),
                  _filterChip(
                    'Anile',
                    'CANCELLED',
                    past
                        .where((o) =>
                            ['CANCELLED', 'REFUNDED'].contains(o.status))
                        .length,
                  ),
                ],
              ),
            ],
          ),
        ),

        // ── LIST ─────────────────────────────────────────────────────
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_off_rounded,
                            size: 48, color: Color(0xFFCBD5E1)),
                        const SizedBox(height: 12),
                        const Text(
                          'Pa jwenn kòmand',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                              color: Color(0xFF475569)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Eseye chanje rechèch oswa retire filtè a.',
                          style: TextStyle(
                              fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  color: AppConstants.primaryCrimson,
                  onRefresh: () async => ref.refresh(ordersProvider),
                  child: ListView.separated(
                    physics: const BouncingScrollPhysics(),
                    padding:
                        const EdgeInsets.fromLTRB(16, 14, 16, 36),
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (_, i) =>
                        _buildPastOrderCard(filtered[i]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _filterChip(String label, String value, int count) {
    final selected = _historyFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _historyFilter = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0F172A)
              : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected
                ? const Color(0xFF0F172A)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : const Color(0xFF475569),
                fontSize: 12,
                fontWeight:
                    selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: selected
                    ? Colors.white.withValues(alpha: 0.2)
                    : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color:
                      selected ? Colors.white : const Color(0xFF64748B),
                  fontSize: 9.5,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAST ORDER CARD
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildPastOrderCard(Order order) {
    final badge = _statusBadge(order.status, false);
    final storeConfig = StoreTypeConfig.from(
      category: order.merchantCategory,
      merchantName: order.merchantName,
    );
    final mName = order.merchantName ?? storeConfig.storeNoun;
    final dateStr = _fmtDate(order.createdAt);
    final isDelivered = order.status == 'DELIVERED';

    return InkWell(
      onTap: () => _showReceiptSheet(order),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── HEADER ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: storeConfig.badgeBgColor,
                      borderRadius: BorderRadius.circular(11),
                      border:
                          Border.all(color: storeConfig.primaryColor.withValues(alpha: 0.3)),
                    ),
                    child: Center(
                      child: Icon(storeConfig.icon,
                          color: storeConfig.primaryColor, size: 20),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          mName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Text(
                              dateStr,
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF64748B),
                                  fontWeight: FontWeight.w500),
                            ),
                            const Padding(
                              padding:
                                  EdgeInsets.symmetric(horizontal: 5),
                              child: Text('·',
                                  style: TextStyle(
                                      color: Color(0xFFCBD5E1),
                                      fontSize: 13)),
                            ),
                            Flexible(
                              child: Text(
                                '#${order.orderNumber}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF475569),
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w700,
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
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: badge.bg,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: badge.border),
                    ),
                    child: Text(
                      badge.label,
                      style: TextStyle(
                        color: badge.fg,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: Color(0xFFF1F5F9)),

            // ── ITEMS PREVIEW ────────────────────────────────────────
            if (order.items.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFEDF2F7)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shopping_bag_outlined, size: 13, color: Color(0xFFFF6000)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          order.items.map((i) => '${i.quantity}× ${i.name}').join(' • '),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF334155),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // ── PAYMENT + TOTAL ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _paymentIcon(order.paymentMethod),
                          size: 13,
                          color: const Color(0xFF475569),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _fmtPayment(order.paymentMethod),
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF334155)),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${order.totalAmount.toInt()} HTG',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: Color(0xFFF1F5F9)),

            // ── ACTION DOCK ──────────────────────────────────────────
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 38,
                      child: ElevatedButton.icon(
                        onPressed: () => _handleReorder(order),
                        icon: const Icon(Icons.replay_rounded,
                            color: Colors.white, size: 15),
                        label: const Text(
                          'Re-kòmande',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.primaryCrimson,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 38,
                    child: OutlinedButton.icon(
                      onPressed: () => _showReceiptSheet(order),
                      icon: const Icon(Icons.receipt_long_rounded,
                          size: 15, color: Color(0xFF334155)),
                      label: const Text(
                        'Resi',
                        style: TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 12,
                            fontWeight: FontWeight.w700),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(
                            color: Color(0xFFCBD5E1)),
                        backgroundColor: const Color(0xFFF8FAFC),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  if (isDelivered) ...[
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 38,
                      child: OutlinedButton(
                        onPressed: () {
                          RatingReviewDialog.show(
                            context,
                            orderId: order.id,
                            merchantName: mName,
                            driverName: order.driverName,
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(
                              color: Color(0xFFFDE68A)),
                          backgroundColor: const Color(0xFFFEF3C7),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Icon(Icons.star_rounded,
                            color: Color(0xFFD97706), size: 18),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECEIPT BOTTOM SHEET
  // ═══════════════════════════════════════════════════════════════════════════
  void _showReceiptSheet(Order order) {
    final badge = _statusBadge(order.status, order.isActive);
    final storeConfig = StoreTypeConfig.from(
      category: order.merchantCategory,
      merchantName: order.merchantName,
    );
    final mName = order.merchantName ?? storeConfig.storeNoun;
    final dateStr = _fmtDate(order.createdAt);
    final subtotal = order.subtotal > 0
        ? order.subtotal
        : (order.totalAmount - order.deliveryFee);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.70,
          minChildSize: 0.45,
          maxChildSize: 0.93,
          builder: (_, scrollCtrl) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius:
                    BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Fixed header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Container(
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: const Color(0xFFCBD5E1),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            const Flexible(
                              child: Text(
                                'Fakti & Resi Kòmand',
                                style: TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0F172A),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: badge.bg,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: badge.border),
                              ),
                              child: Text(
                                badge.label,
                                style: TextStyle(
                                  color: badge.fg,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.tag_rounded,
                                size: 13, color: Color(0xFF94A3B8)),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                order.orderNumber,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  color: Color(0xFF64748B),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () {
                                Clipboard.setData(
                                    ClipboardData(
                                        text: order.orderNumber));
                                _snack('Nimewo kopye!', Colors.blueGrey);
                              },
                              child: const Icon(Icons.copy_rounded,
                                  size: 14, color: Color(0xFF0284C7)),
                            ),
                            const Spacer(),
                            Text(dateStr,
                                style: const TextStyle(
                                    fontSize: 11.5,
                                    color: Color(0xFF94A3B8))),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(
                            height: 1, color: Color(0xFFE2E8F0)),
                      ],
                    ),
                  ),

                  // Scrollable body
                  Expanded(
                    child: ListView(
                      controller: scrollCtrl,
                      padding: EdgeInsets.fromLTRB(
                          20,
                          14,
                          20,
                          MediaQuery.of(ctx).viewInsets.bottom + 24),
                      children: [
                        // Merchant info
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Icon(storeConfig.icon,
                                  color: storeConfig.primaryColor,
                                  size: 22),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      mName,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (order.merchantAddress != null)
                                      Text(
                                        order.merchantAddress!,
                                        style: const TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF64748B)),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Delivery address
                        if (order.deliveryAddress != null &&
                            order.deliveryAddress!.isNotEmpty) ...[
                          Row(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.location_on_outlined,
                                  color: Color(0xFF64748B), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    const Text('Adrès Livrezon :',
                                        style: TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF64748B))),
                                    Text(
                                      order.deliveryAddress!,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Order items breakdown
                        if (order.items.isNotEmpty) ...[
                          Row(
                            children: [
                              const Icon(Icons.shopping_bag_outlined,
                                  size: 15, color: Color(0xFF64748B)),
                              const SizedBox(width: 6),
                              Text(
                                'Atik Kòmande Yo (${order.items.length})',
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              children: [
                                for (int i = 0; i < order.items.length; i++) ...[
                                  if (i > 0)
                                    const Divider(height: 16, color: Color(0xFFE2E8F0)),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFF6000).withValues(alpha: 0.1),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                '${order.items[i].quantity}×',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 12,
                                                  color: Color(0xFFFF6000),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                order.items[i].name,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 13,
                                                  color: Color(0xFF0F172A),
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '${order.items[i].totalPrice.toInt()} HTG',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13,
                                          color: Color(0xFF0F172A),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Price breakdown
                        const Row(
                          children: [
                            Icon(Icons.receipt_outlined,
                                size: 15, color: Color(0xFF64748B)),
                            SizedBox(width: 6),
                            Text(
                              'Detay Pri',
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            children: [
                              _receiptRow(
                                  'Sous-total',
                                  '${subtotal.toInt()} HTG'),
                              const SizedBox(height: 8),
                              _receiptRow(
                                  'Frè Livrezon',
                                  '${order.deliveryFee.toInt()} HTG'),
                              const SizedBox(height: 10),
                              const Divider(
                                  height: 1,
                                  color: Color(0xFFE2E8F0)),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Total Peye',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 16,
                                        color: Color(0xFF0F172A)),
                                  ),
                                  Text(
                                    '${order.totalAmount.toInt()} HTG',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 18,
                                      color: AppConstants.primaryCrimson,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.end,
                                children: [
                                  const Icon(
                                      Icons.check_circle_rounded,
                                      color: Color(0xFF10B981),
                                      size: 13),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      'Peye via ${_fmtPayment(order.paymentMethod)}',
                                      style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF10B981)),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Action buttons
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 46,
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    _contactSupport(order);
                                  },
                                  icon: const Icon(
                                      Icons.help_outline_rounded,
                                      size: 16,
                                      color: Color(0xFF25D366)),
                                  label: const Text(
                                    'Èd Kòmand',
                                    style: TextStyle(
                                        color: Color(0xFF25D366),
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(
                                        color: Color(0xFF25D366)),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: SizedBox(
                                height: 46,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    _handleReorder(order);
                                  },
                                  icon: const Icon(
                                      Icons.replay_rounded,
                                      color: Colors.white,
                                      size: 16),
                                  label: const Text(
                                    'Re-kòmande',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 13),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        AppConstants.primaryCrimson,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12)),
                                  ),
                                ),
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
          },
        );
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                  color: Color(0xFFFEF2F2), shape: BoxShape.circle),
              child: const Icon(Icons.error_outline_rounded,
                  color: Color(0xFFDC2626), size: 38),
            ),
            const SizedBox(height: 16),
            const Text(
              'Pa ka jwenn kòmand yo',
              style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Tanpri verifye koneksyon entènèt ou epi eseye ankò.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
            ),
            const SizedBox(height: 18),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => ref.refresh(ordersProvider),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Eseye ankò',
                  style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _receiptRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500)),
        Text(value,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A))),
      ],
    );
  }

  Widget _circleAction({
    required IconData icon,
    required Color color,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
      ),
    );
  }

  int _activeStep(String status) {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
      case 'RESTAURANT_ACCEPTED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'READY_FOR_PICKUP':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
      case 'PICKED_UP':
        return 2;
      case 'IN_TRANSIT':
        return 3;
      default:
        return 1;
    }
  }

  String _estimatedTime(String status) {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return '⏱ ~30-40 min';
      case 'PREPARING':
        return '⏱ ~20-30 min';
      case 'READY_FOR_PICKUP':
      case 'DRIVER_ASSIGNED':
        return '⏱ ~15-20 min';
      case 'IN_TRANSIT':
        return '⏱ ~5-15 min';
      default:
        return '⏱ Talè';
    }
  }

  String _statusDescription(String status, [StoreTypeConfig? storeConfig]) {
    if (storeConfig != null) {
      return storeConfig.getStatusDescription(status);
    }
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 'Nou resevwa kòmand ou a epi transmis nan komès la.';
      case 'PREPARING':
        return 'Komèsan an ap prepare kòmand ou a avèk swen.';
      case 'READY_FOR_PICKUP':
      case 'DRIVER_ASSIGNED':
        return 'Kòmand lan pare — chofè livrè a sou wout pou rekipere l.';
      case 'IN_TRANSIT':
        return 'Livrè moto a ap pote kòmand ou a vin jwenn ou kounye a.';
      default:
        return 'Kòmand ou a ap trete avèk siksè.';
    }
  }

  String _fmtDate(DateTime dt) {
    const m = [
      'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
      'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    final h = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} ${m[dt.month - 1]}, $h:$min';
  }

  String _fmtPayment(String method) {
    final m = method.toUpperCase();
    if (m.contains('MONCASH')) return 'MonCash';
    if (m.contains('NATCASH')) return 'Natcash';
    if (m.contains('CASH') || m.contains('COD')) return 'Kach sou Livrezon';
    return method;
  }

  IconData _paymentIcon(String method) {
    final m = method.toUpperCase();
    if (m.contains('MONCASH')) return Icons.phone_android_rounded;
    if (m.contains('NATCASH')) return Icons.account_balance_wallet_rounded;
    return Icons.payments_outlined;
  }

  _BadgeStyle _statusBadge(String status, bool isActive) {
    switch (status) {
      case 'DELIVERED':
        return const _BadgeStyle(
            label: 'Livre',
            bg: Color(0xFFDCFCE7),
            border: Color(0xFF86EFAC),
            fg: Color(0xFF15803D));
      case 'IN_TRANSIT':
        return const _BadgeStyle(
            label: 'Sou Wout',
            bg: Color(0xFFE0F2FE),
            border: Color(0xFF7DD3FC),
            fg: Color(0xFF0369A1));
      case 'PICKED_UP':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
        return const _BadgeStyle(
            label: 'Chofè Asiyen',
            bg: Color(0xFFE0F2FE),
            border: Color(0xFF7DD3FC),
            fg: Color(0xFF0369A1));
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return const _BadgeStyle(
            label: 'Ap Prepare',
            bg: Color(0xFFFEF3C7),
            border: Color(0xFFFDE68A),
            fg: Color(0xFFB45309));
      case 'CONFIRMED':
      case 'RESTAURANT_ACCEPTED':
        return const _BadgeStyle(
            label: 'Konfime',
            bg: Color(0xFFF3E8FF),
            border: Color(0xFFD8B4FE),
            fg: Color(0xFF7E22CE));
      case 'CANCELLED':
      case 'REFUNDED':
        return const _BadgeStyle(
            label: 'Anile',
            bg: Color(0xFFFEE2E2),
            border: Color(0xFFFCA5A5),
            fg: Color(0xFFB91C1C));
      default:
        return _BadgeStyle(
            label: isActive ? 'An Kour' : 'Fèmen',
            bg: const Color(0xFFF1F5F9),
            border: const Color(0xFFCBD5E1),
            fg: const Color(0xFF475569));
    }
  }

  void _snack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    HapticFeedback.lightImpact();
    final cleaned = phoneNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$cleaned');
    try {
      final launched =
          await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        _snack('Pa ka louvri aplikasyon apèl la ($cleaned)',
            const Color(0xFFDC2626));
      }
    } catch (e) {
      _snack('Erè pandan lansman apèl la', const Color(0xFFDC2626));
    }
  }

  Future<void> _openWhatsApp(
      {required String phone, required String message}) async {
    HapticFeedback.lightImpact();
    String cleaned = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (!cleaned.startsWith('509') && cleaned.length == 8) {
      cleaned = '509$cleaned';
    }
    final encodedMsg = Uri.encodeComponent(message);

    final appUri = Uri.parse('whatsapp://send?phone=$cleaned&text=$encodedMsg');
    final webUri = Uri.parse('https://wa.me/$cleaned?text=$encodedMsg');

    try {
      if (await canLaunchUrl(appUri)) {
        await launchUrl(appUri, mode: LaunchMode.externalApplication);
      } else {
        final launched =
            await launchUrl(webUri, mode: LaunchMode.externalApplication);
        if (!launched) {
          _snack('Pa ka louvri WhatsApp pou nimewo $cleaned',
              const Color(0xFFDC2626));
        }
      }
    } catch (e) {
      try {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } catch (_) {
        _snack('WhatsApp pa disponib sou aparèy sa a',
            const Color(0xFFDC2626));
      }
    }
  }

  void _contactSupport(Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 44,
                    height: 4.5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Header
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.support_agent_rounded,
                        color: Color(0xFF16A34A),
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Èd & Sipò Kòmand',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          Text(
                            'Kòmand #${order.orderNumber} • ${order.merchantName ?? "Delivery Haïti"}',
                            style: const TextStyle(
                              fontSize: 12.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded,
                          color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(sheetCtx),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Chwazi kijan ou vle kontakte nou pou èd imedya:',
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF475569),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),

                // Opsyon 1: WhatsApp Dirèk
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(sheetCtx);
                      _openWhatsApp(
                        phone: AppConstants.supportWhatsApp,
                        message:
                            'Bonjou Sipò Delivery Haïti, mwen bezwen asistans pou kòmand mwen #${order.orderNumber}.\n'
                            '• Restoran: ${order.merchantName ?? "N/A"}\n'
                            '• Montan: ${order.totalAmount.toInt()} HTG\n'
                            '• Estati: ${order.status}\n'
                            '• Adrès livrezon: ${order.deliveryAddress ?? "N/A"}.',
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: const Color(0xFF86EFAC), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: const BoxDecoration(
                              color: Color(0xFF25D366),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.chat_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'WhatsApp Sipò DLH',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    SizedBox(width: 6),
                                    _ChoiceBadge(
                                      text: 'RAPID',
                                      bg: Color(0xFFDCFCE7),
                                      fg: Color(0xFF15803D),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 3),
                                Text(
                                  'Mennen w dirèk sou WhatsApp ak tout enfòmasyon kòmand lan deja prepare',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF166534),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 15,
                            color: Color(0xFF16A34A),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Opsyon 2: Fè Kòl Dirèk
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(sheetCtx);
                      _makePhoneCall(AppConstants.supportPhone);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: const Color(0xFFE2E8F0), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.phone_in_talk_rounded,
                              color: Color(0xFF0284C7),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Text(
                                      'Fè Kòl Telefòn Dirèk',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    SizedBox(width: 6),
                                    _ChoiceBadge(
                                      text: 'DIRÈK',
                                      bg: Color(0xFFE0F2FE),
                                      fg: Color(0xFF0369A1),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Rele sèvis kliyan nou sou ${AppConstants.supportPhoneDisplay}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 15,
                            color: Color(0xFF64748B),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Opsyon 3: Kontak Chofè a si li asiyen
                if (order.driverPhone != null &&
                    order.driverPhone!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'OUBYEN KONTAKTE CHOFÈ A',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                      const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Rele chofè
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(sheetCtx);
                            _makePhoneCall(order.driverPhone!);
                          },
                          icon: const Icon(Icons.phone_rounded,
                              size: 16, color: Color(0xFF10B981)),
                          label: Text(
                            'Rele ${order.driverName?.split(" ").first ?? "Livrè"}',
                            style: const TextStyle(
                              color: Color(0xFF065F46),
                              fontWeight: FontWeight.w800,
                              fontSize: 12.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(
                                color: Color(0xFFBBF7D0)),
                            backgroundColor: const Color(0xFFF0FDF4),
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // WhatsApp chofè
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(sheetCtx);
                            _openWhatsApp(
                              phone: order.driverPhone!,
                              message:
                                  'Bonjou ${order.driverName ?? "Livrè"}, mwen se kliyan kòmand #${order.orderNumber}.',
                            );
                          },
                          icon: const Icon(
                              Icons.chat_bubble_outline_rounded,
                              size: 16,
                              color: Color(0xFF25D366)),
                          label: const Text(
                            'WhatsApp Livrè',
                            style: TextStyle(
                              color: Color(0xFF166534),
                              fontWeight: FontWeight.w800,
                              fontSize: 12.5,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(
                                color: Color(0xFF86EFAC)),
                            backgroundColor: const Color(0xFFF0FDF4),
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => Navigator.pop(sheetCtx),
                    child: const Text(
                      'Fèmen',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleReorder(Order order) {
    final mName = order.merchantName ?? 'Restoran Delivery Haïti';
    final mockMerchant = Merchant(
      id: 'm-reorder-${order.id}',
      name: mName,
      category: 'RESTAURANT',
      phone: order.merchantPhone ?? '+509 3700 0000',
      address: order.merchantAddress ?? 'Cap-Haïtien',
      rating: 4.9,
      isActive: true,
      isVerified: true,
      menuItems: [],
    );

    final item = MenuItem(
      id: 'item-reorder-${order.id}',
      name: 'Repa Kòmand #${order.orderNumber}',
      description: 'Menm meni ou te kòmande deja a',
      price: order.subtotal > 0
          ? order.subtotal
          : (order.totalAmount - order.deliveryFee),
      category: 'Plats',
      isAvailable: true,
    );

    ref.read(cartProvider.notifier).setCart(
      mockMerchant,
      [CartItem(item: item, quantity: 1)],
    );

    _snack('Atik yo ajoute nan panye w soti $mName',
        const Color(0xFF10B981));
    context.push('/cart');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA CLASS
// ─────────────────────────────────────────────────────────────────────────────
class _BadgeStyle {
  final String label;
  final Color bg;
  final Color border;
  final Color fg;

  const _BadgeStyle({
    required this.label,
    required this.bg,
    required this.border,
    required this.fg,
  });
}

class _ChoiceBadge extends StatelessWidget {
  final String text;
  final Color bg;
  final Color fg;

  const _ChoiceBadge({
    required this.text,
    required this.bg,
    required this.fg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontSize: 9.5,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}




