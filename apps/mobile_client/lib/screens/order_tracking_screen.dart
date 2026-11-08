import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/store_type_config.dart';
import '../models/models.dart';
import '../services/supabase_service.dart';
import '../widgets/rating_review_dialog.dart';
import '../widgets/moncash_payment_dialog.dart';
import '../services/api_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// ORDER TRACKING SCREEN — PROFESSIONAL REDESIGN
// Real-time polling | Timeline | Driver Card | Receipt | Orange #FF6600 brand
// ─────────────────────────────────────────────────────────────────────────────

const _kOrange = Color(0xFFFF6600);
const _kDark = Color(0xFF0F172A);
const _kMuted = Color(0xFF64748B);
const _kBg = Color(0xFFF4F5F7);
const _kGreen = Color(0xFF10B981);
const _kCard = Colors.white;

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;
  final Order? initialOrder;

  const OrderTrackingScreen({
    super.key,
    required this.orderId,
    this.initialOrder,
  });

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen>
    with TickerProviderStateMixin {
  final _service = SupabaseService();
  final _api = ApiService();
  Order? order;
  Timer? _pollingTimer;
  bool isLoading = true;
  String? _prevStatus;
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    order = widget.initialOrder;
    _prevStatus = order?.status;
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _fetchOrder();
    _pollingTimer = Timer.periodic(const Duration(seconds: 6), (_) => _fetchOrder());
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchOrder() async {
    final updated = await _service.trackOrder(widget.orderId);
    if (!mounted) return;
    final effective = updated ?? order ?? widget.initialOrder;
    if (effective != null && _prevStatus != null && _prevStatus != effective.status) {
      _showStatusSnack(effective.status);
    }
    setState(() {
      order = effective;
      _prevStatus = effective?.status;
      isLoading = false;
    });
  }

  void _showStatusSnack(String status) {
    final msgs = {
      'CONFIRMED': 'Kòmand ou a konfime!',
      'PREPARING': 'Machann nan ap prepare kòmand ou a!',
      'READY_FOR_PICKUP': 'Kòmand prè! Livrè a ap vini chache l...',
      'IN_TRANSIT': 'Livrè a sou chemen w!',
      'DELIVERED': '🎉 Kòmand livre avèk siksè!',
    };
    final msg = msgs[status] ?? 'Estati ajou: $status';
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.info_outline_rounded, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(msg, style: const TextStyle(fontWeight: FontWeight.w700))),
      ]),
      backgroundColor: status == 'DELIVERED' ? _kGreen : _kOrange,
      duration: const Duration(seconds: 4),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.all(12),
    ));
  }

  int _statusStep(String? status) {
    switch (status) {
      case 'PENDING':
      case 'PAYMENT_PENDING':
      case 'CONFIRMED':
        return 0;
      case 'RESTAURANT_ACCEPTED':
      case 'PREPARING':
        return 1;
      case 'READY_FOR_PICKUP':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
        return 2;
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  }

  Future<void> _call(String phone) async {
    HapticFeedback.lightImpact();
    final cleaned = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    await launchUrl(Uri.parse('tel:$cleaned'), mode: LaunchMode.externalApplication);
  }

  Future<void> _whatsApp(String phone, String msg) async {
    HapticFeedback.lightImpact();
    String n = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (!n.startsWith('509') && n.length == 8) n = '509$n';
    final enc = Uri.encodeComponent(msg);
    final appUri = Uri.parse('whatsapp://send?phone=$n&text=$enc');
    final webUri = Uri.parse('https://wa.me/$n?text=$enc');
    if (await canLaunchUrl(appUri)) {
      await launchUrl(appUri, mode: LaunchMode.externalApplication);
    } else {
      await launchUrl(webUri, mode: LaunchMode.externalApplication);
    }
  }

  // ════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    final status = order?.status ?? 'CONFIRMED';
    final step = _statusStep(status);
    final isDelivered = status == 'DELIVERED';
    final isCancelled = status == 'CANCELLED';
    final cfg = StoreTypeConfig.from(
      category: order?.merchantCategory,
      merchantName: order?.merchantName,
    );
    final num = order?.orderNumber ?? widget.orderId.substring(0, 8).toUpperCase();

    return Scaffold(
      backgroundColor: _kBg,
      body: isLoading
          ? const _LoadingView()
          : CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                // ── HEADER ──────────────────────────────────────────────────
                _SliverHeader(
                  orderNum: num,
                  merchantName: order?.merchantName ?? cfg.storeNoun,
                  onBack: () => context.canPop() ? context.pop() : context.go('/'),
                  onRefresh: () {
                    HapticFeedback.lightImpact();
                    _fetchOrder();
                  },
                ),

                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 30),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([

                      // ── 1. STATUS HERO ───────────────────────────────────
                      _StatusHeroCard(
                        step: step,
                        isDelivered: isDelivered,
                        isCancelled: isCancelled,
                        statusLabel: order?.statusLabel ?? 'Ap Prepare...',
                        cfg: cfg,
                        pulseCtrl: _pulseCtrl,
                      ),

                      const SizedBox(height: 14),

                      // ── 2. PROGRESS TIMELINE ─────────────────────────────
                      _TimelineCard(step: step, cfg: cfg, isCancelled: isCancelled),

                      const SizedBox(height: 14),

                      // ── 3. DRIVER CARD (only when assigned) ──────────────
                      if (step >= 2 || order?.driverName != null) ...[
                        _DriverCard(
                          order: order,
                          onCall: _call,
                          onWhatsApp: _whatsApp,
                        ),
                        const SizedBox(height: 14),
                      ],

                      // ── 4. DELIVERY ADDRESS ──────────────────────────────
                      _AddressCard(
                        address: order?.deliveryAddress ?? 'Cap-Haïtien, Ayiti',
                        merchantName: order?.merchantName ?? cfg.storeNoun,
                        merchantAddress: order?.merchantAddress,
                      ),

                      const SizedBox(height: 14),

                      // ── 5. MONCASH PAYMENT (if pending) ──────────────────
                      if (order != null && order!.paymentMethod == 'MONCASH') ...[
                        _MoncashCard(
                          order: order!,
                          api: _api,
                          service: _service,
                          onRefresh: _fetchOrder,
                        ),
                        const SizedBox(height: 14),
                      ],

                      // ── 6. RECEIPT ────────────────────────────────────────
                      _ReceiptCard(order: order, cfg: cfg),

                      const SizedBox(height: 14),

                      // ── 7. REVIEW or SUPPORT ─────────────────────────────
                      if (isDelivered)
                        _ReviewBanner(
                          orderId: widget.orderId,
                          merchantName: order?.merchantName ?? 'Machann',
                          driverName: order?.driverName,
                        )
                      else if (!isCancelled)
                        _SupportBanner(orderNum: num),

                      const SizedBox(height: 20),
                    ]),
                  ),
                ),
              ],
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING
// ─────────────────────────────────────────────────────────────────────────────
class _LoadingView extends StatelessWidget {
  const _LoadingView();
  @override
  Widget build(BuildContext context) => const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: _kOrange, strokeWidth: 2.5),
            SizedBox(height: 14),
            Text('Chaje estati kòmand...', style: TextStyle(color: _kMuted, fontSize: 13)),
          ],
        ),
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIVER HEADER
// ─────────────────────────────────────────────────────────────────────────────
class _SliverHeader extends StatelessWidget {
  final String orderNum;
  final String merchantName;
  final VoidCallback onBack;
  final VoidCallback onRefresh;
  const _SliverHeader({
    required this.orderNum,
    required this.merchantName,
    required this.onBack,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      pinned: true,
      elevation: 0,
      backgroundColor: _kOrange,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
        onPressed: onBack,
      ),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Swivi Kòmand #$orderNum',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Colors.white)),
          Text(merchantName,
              style: TextStyle(fontSize: 11.5, color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w500)),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
          tooltip: 'Rafrechi',
          onPressed: onRefresh,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATUS HERO CARD
// ─────────────────────────────────────────────────────────────────────────────
class _StatusHeroCard extends StatelessWidget {
  final int step;
  final bool isDelivered;
  final bool isCancelled;
  final String statusLabel;
  final StoreTypeConfig cfg;
  final AnimationController pulseCtrl;

  const _StatusHeroCard({
    required this.step,
    required this.isDelivered,
    required this.isCancelled,
    required this.statusLabel,
    required this.cfg,
    required this.pulseCtrl,
  });

  Color get _accentColor {
    if (isCancelled) return const Color(0xFFDC2626);
    if (isDelivered) return _kGreen;
    return _kOrange;
  }

  IconData get _icon {
    if (isCancelled) return Icons.cancel_rounded;
    if (isDelivered) return Icons.check_circle_rounded;
    if (step <= 1) return Icons.restaurant_rounded;
    return Icons.two_wheeler_rounded;
  }

  String get _subtitle {
    if (isCancelled) return 'Kòmand ou a te anile.';
    if (isDelivered) return 'Remèt nan men w. Mèsi pou fè konfyans nou!';
    switch (step) {
      case 0: return 'N ap tann machann nan konfime kòmand la';
      case 1: return 'Machann nan ap prepare pakè ou a...';
      case 2: return 'Livrè a sou wout pou chache kòmand lan';
      case 3: return 'Livrè a ap vini — estimasyon ~5-10 min';
      default: return 'Pwosesis livrezon an anba kontwòl';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _accentColor.withValues(alpha: 0.25), width: 1.2),
        boxShadow: [
          BoxShadow(color: _accentColor.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon badge
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: _accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(_icon, color: _accentColor, size: 30),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Live pill
                    if (!isDelivered && !isCancelled)
                      AnimatedBuilder(
                        animation: pulseCtrl,
                        builder: (_, __) => Row(
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _kOrange.withValues(alpha: 0.4 + 0.6 * pulseCtrl.value),
                              ),
                            ),
                            const SizedBox(width: 5),
                            const Text('AN TAN REYÈL',
                                style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: _kOrange, letterSpacing: 0.8)),
                          ],
                        ),
                      ),
                    if (isDelivered)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: _kGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                        child: const Text('LIVRE ✓', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: _kGreen)),
                      ),
                    if (isCancelled)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: const Color(0xFFDC2626).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                        child: const Text('ANILE', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFFDC2626))),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      isDelivered ? 'Livre Avèk Siksè 🎉' : (isCancelled ? 'Kòmand Anile' : statusLabel),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: _accentColor,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(_subtitle, style: const TextStyle(color: _kMuted, fontSize: 12, height: 1.4)),
                  ],
                ),
              ),
            ],
          ),
          if (!isCancelled) ...[
            const SizedBox(height: 18),
            // Progress bar
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('${((step + 1) / 5 * 100).toInt()}% konplete',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: _accentColor)),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: (step + 1) / 5,
                    backgroundColor: const Color(0xFFF1F5F9),
                    color: _accentColor,
                    minHeight: 7,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TIMELINE CARD
// ─────────────────────────────────────────────────────────────────────────────
class _TimelineCard extends StatelessWidget {
  final int step;
  final StoreTypeConfig cfg;
  final bool isCancelled;

  const _TimelineCard({required this.step, required this.cfg, required this.isCancelled});

  @override
  Widget build(BuildContext context) {
    final steps = [
      _Step(Icons.receipt_long_rounded, 'Konfime', 'Kòmand lan anrejistre ak siksè'),
      _Step(Icons.storefront_rounded, 'Ap Prepare', '${cfg.storeNoun} ap prepare pakè a'),
      _Step(Icons.moped_rounded, 'Prè pou Pran', 'Livrè a rive nan machann nan'),
      _Step(Icons.two_wheeler_rounded, 'Sou Chemen', 'Moto a sou wout pou livre w'),
      _Step(Icons.where_to_vote_rounded, 'Livre', 'Remèt nan men kliyan an'),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4, height: 18,
                decoration: BoxDecoration(color: _kOrange, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 8),
              const Text('Etap Livrezon',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _kDark, letterSpacing: -0.3)),
            ],
          ),
          const SizedBox(height: 20),
          ...List.generate(steps.length, (i) {
            final done = i <= step && !isCancelled;
            final current = i == step && !isCancelled;
            final isLast = i == steps.length - 1;
            final s = steps[i];
            final lineColor = i < step && !isCancelled ? _kOrange : const Color(0xFFE2E8F0);

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Dot + line column
                SizedBox(
                  width: 32,
                  child: Column(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: done ? _kOrange : const Color(0xFFF1F5F9),
                          border: Border.all(
                            color: current ? _kOrange : (done ? _kOrange : const Color(0xFFCBD5E1)),
                            width: current ? 2.5 : 1.5,
                          ),
                          boxShadow: current
                              ? [BoxShadow(color: _kOrange.withValues(alpha: 0.3), blurRadius: 8, spreadRadius: 1)]
                              : [],
                        ),
                        child: Center(
                          child: done
                              ? Icon(s.icon, color: Colors.white, size: 15)
                              : Icon(Icons.circle, color: const Color(0xFFCBD5E1), size: 8),
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2,
                          height: 36,
                          margin: const EdgeInsets.symmetric(vertical: 2),
                          decoration: BoxDecoration(
                            color: lineColor,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16, top: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(s.title,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: current ? FontWeight.w900 : (done ? FontWeight.w700 : FontWeight.w500),
                                  color: done ? _kDark : const Color(0xFF94A3B8),
                                )),
                            if (current) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                    color: const Color(0xFFFFF1EB), borderRadius: BorderRadius.circular(6)),
                                child: const Text('Kounye a',
                                    style: TextStyle(color: _kOrange, fontSize: 9, fontWeight: FontWeight.w900)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(s.subtitle,
                            style: TextStyle(
                              fontSize: 11.5,
                              color: done ? _kMuted : const Color(0xFFCBD5E1),
                            )),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

class _Step {
  final IconData icon;
  final String title;
  final String subtitle;
  const _Step(this.icon, this.title, this.subtitle);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DRIVER CARD
// ─────────────────────────────────────────────────────────────────────────────
class _DriverCard extends StatelessWidget {
  final Order? order;
  final Future<void> Function(String) onCall;
  final Future<void> Function(String, String) onWhatsApp;

  const _DriverCard({required this.order, required this.onCall, required this.onWhatsApp});

  @override
  Widget build(BuildContext context) {
    final name = order?.driverName ?? 'Jean-Louis Moise';
    final phone = order?.driverPhone ?? '+509 37 12 3456';
    final plate = order?.driverPlate ?? 'HA-4829';
    final num = order?.orderNumber ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 4, height: 16,
              decoration: BoxDecoration(color: _kOrange, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(width: 8),
            const Text('Livrè Ou a', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: _kDark)),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            // Avatar
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFF1F5F9)),
              child: const Center(child: Icon(Icons.person_rounded, size: 28, color: Color(0xFF94A3B8))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Flexible(child: Text(name,
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5, color: _kDark),
                      overflow: TextOverflow.ellipsis)),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(6)),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.verified_rounded, size: 10, color: Color(0xFF15803D)),
                      SizedBox(width: 2),
                      Text('Verifye', style: TextStyle(color: Color(0xFF15803D), fontSize: 9, fontWeight: FontWeight.w800)),
                    ]),
                  ),
                ]),
                const SizedBox(height: 3),
                Row(children: [
                  const Icon(Icons.two_wheeler_rounded, size: 13, color: _kMuted),
                  const SizedBox(width: 4),
                  Text('Plak: $plate', style: const TextStyle(color: _kMuted, fontSize: 12, fontWeight: FontWeight.w500)),
                ]),
              ],
            )),
            // Rating
            Column(children: [
              const Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 18),
              const Text('4.9', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFB45309))),
            ]),
          ]),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 12),
          Row(children: [
            // Call
            Expanded(child: GestureDetector(
              onTap: () => onCall(phone),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _kGreen,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: _kGreen.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))],
                ),
                child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.phone_in_talk_rounded, size: 16, color: Colors.white),
                  SizedBox(width: 6),
                  Text('Rele Livrè', style: TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w900)),
                ]),
              ),
            )),
            const SizedBox(width: 10),
            // WhatsApp
            Expanded(child: GestureDetector(
              onTap: () => onWhatsApp(phone,
                  'Bonjou, mwen se kliyan kòmand #$num sou Delivery Lakay Haiti. Mwen la pou livrezon an.'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.chat_bubble_rounded, size: 16, color: Color(0xFF16A34A)),
                  SizedBox(width: 6),
                  Text('WhatsApp', style: TextStyle(color: Color(0xFF16A34A), fontSize: 12.5, fontWeight: FontWeight.w900)),
                ]),
              ),
            )),
          ]),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ADDRESS CARD
// ─────────────────────────────────────────────────────────────────────────────
class _AddressCard extends StatelessWidget {
  final String address;
  final String merchantName;
  final String? merchantAddress;
  const _AddressCard({required this.address, required this.merchantName, this.merchantAddress});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(children: [
        // Merchant
        Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: _kOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.storefront_rounded, color: _kOrange, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Depa', style: TextStyle(fontSize: 10.5, color: _kMuted, fontWeight: FontWeight.w500)),
            Text(merchantName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: _kDark)),
            if (merchantAddress != null)
              Text(merchantAddress!, style: const TextStyle(fontSize: 11, color: _kMuted), overflow: TextOverflow.ellipsis),
          ])),
        ]),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 17, vertical: 6),
          child: Row(children: [
            Container(width: 2, height: 24, decoration: BoxDecoration(color: _kOrange.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(1))),
          ]),
        ),
        // Customer
        Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.where_to_vote_rounded, color: _kGreen, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Destinasyon', style: TextStyle(fontSize: 10.5, color: _kMuted, fontWeight: FontWeight.w500)),
            Text(address, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: _kDark)),
          ])),
        ]),
      ]),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MONCASH CARD
// ─────────────────────────────────────────────────────────────────────────────
class _MoncashCard extends StatelessWidget {
  final Order order;
  final ApiService api;
  final SupabaseService service;
  final VoidCallback onRefresh;
  const _MoncashCard({required this.order, required this.api, required this.service, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final isPaid = order.paymentStatus == 'PAID';
    if (isPaid) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFECFDF5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFA7F3D0)),
        ),
        child: Row(children: [
          const Icon(Icons.verified_rounded, color: Color(0xFF059669), size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(
            'Peman MonCash ${order.totalAmount.toInt()} HTG konfime ✓',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: Color(0xFF065F46)),
          )),
        ]),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFECDD3)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(color: Color(0xFFE4002B), shape: BoxShape.circle),
            child: const Icon(Icons.payment_rounded, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Peman MonCash an Attente', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5, color: _kDark)),
            Text('Montan: ${order.totalAmount.toInt()} HTG', style: const TextStyle(fontSize: 12, color: _kMuted)),
          ])),
        ]),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 44,
          child: ElevatedButton.icon(
            onPressed: () async {
              final data = await api.initiateMonCashPayment(
                order.id,
                amount: order.totalAmount,
                orderNumber: order.orderNumber,
              );
              final url = data?['redirectUrl'] as String?;
              if (url != null && context.mounted) {
                await MoncashPaymentDialog.show(
                  context: context,
                  order: order,
                  redirectUrl: url,
                  onPaymentSuccess: onRefresh,
                  onSwitchToCash: () async {
                    await service.updateOrderStatus(order.id, 'CONFIRMED');
                    onRefresh();
                  },
                );
              }
            },
            icon: const Icon(Icons.payment_rounded, color: Colors.white, size: 18),
            label: const Text('Peye MonCash Kounye a', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE4002B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RECEIPT CARD
// ─────────────────────────────────────────────────────────────────────────────
class _ReceiptCard extends StatelessWidget {
  final Order? order;
  final StoreTypeConfig cfg;
  const _ReceiptCard({required this.order, required this.cfg});

  @override
  Widget build(BuildContext context) {
    final total = order?.totalAmount ?? 0.0;
    final subtotal = order?.subtotal ?? (total - (order?.deliveryFee ?? 150.0));
    final fee = order?.deliveryFee ?? 150.0;
    final address = order?.deliveryAddress ?? 'Cap-Haïtien, Ayiti';
    final merchant = order?.merchantName ?? cfg.storeNoun;
    final payment = order?.paymentMethod ?? 'CASH';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [
            Container(width: 4, height: 18, decoration: BoxDecoration(color: _kOrange, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 8),
            const Text('Resi Kòmand', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _kDark)),
          ]),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
            child: Text(payment, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: _kMuted)),
          ),
        ]),
        const SizedBox(height: 14),
        _row(Icons.storefront_rounded, 'Machann', merchant),
        const SizedBox(height: 10),
        _row(Icons.location_on_rounded, 'Adrès', address),
        const SizedBox(height: 10),
        _row(Icons.shopping_bag_rounded, 'Sou-total', '${subtotal.toInt()} HTG'),
        const SizedBox(height: 10),
        _row(Icons.two_wheeler_rounded, 'Frè Livrezon', '${fee.toInt()} HTG'),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 12),
          child: Divider(height: 1, color: Color(0xFFF1F5F9)),
        ),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Total', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: _kDark)),
          Text('${total.toInt()} HTG',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: _kOrange, letterSpacing: -0.5)),
        ]),
      ]),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Row(children: [
      Icon(icon, size: 15, color: _kOrange),
      const SizedBox(width: 8),
      Text(label, style: const TextStyle(fontSize: 12, color: _kMuted, fontWeight: FontWeight.w500)),
      const Spacer(),
      Flexible(
        child: Text(value,
            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: _kDark),
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis),
      ),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. REVIEW BANNER (after delivery)
// ─────────────────────────────────────────────────────────────────────────────
class _ReviewBanner extends StatelessWidget {
  final String orderId;
  final String merchantName;
  final String? driverName;
  const _ReviewBanner({required this.orderId, required this.merchantName, this.driverName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)]),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: const BoxDecoration(color: Color(0xFFFEF3C7), shape: BoxShape.circle),
          child: const Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 24),
        ),
        const SizedBox(width: 12),
        const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Eksperyans ou an te kijan?', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5, color: Color(0xFF92400E))),
          Text('Bay nòt sou sèvis livrezon an', style: TextStyle(fontSize: 11.5, color: Color(0xFFB45309))),
        ])),
        ElevatedButton(
          onPressed: () => RatingReviewDialog.show(
            context,
            orderId: orderId,
            merchantName: merchantName,
            driverName: driverName,
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFD97706),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            elevation: 0,
          ),
          child: const Text('Evalye', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7b. SUPPORT BANNER (during delivery)
// ─────────────────────────────────────────────────────────────────────────────
class _SupportBanner extends StatelessWidget {
  final String orderNum;
  const _SupportBanner({required this.orderNum});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: const BoxDecoration(color: Color(0xFFF8F9FA), shape: BoxShape.circle),
          child: const Icon(Icons.support_agent_rounded, color: _kDark, size: 22),
        ),
        const SizedBox(width: 12),
        const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Bezwen èd?', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5, color: _kDark)),
          Text('Sipò Delivery Lakay disponib 24/7', style: TextStyle(fontSize: 11.5, color: _kMuted)),
        ])),
        GestureDetector(
          onTap: () async {
            final uri = Uri.parse('tel:+50940553636');
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(color: _kOrange, borderRadius: BorderRadius.circular(10)),
            child: const Text('Rele', style: TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w800)),
          ),
        ),
      ]),
    );
  }
}
