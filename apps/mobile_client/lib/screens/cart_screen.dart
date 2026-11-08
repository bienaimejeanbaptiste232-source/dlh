import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/constants.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';
import '../services/supabase_service.dart';
import '../widgets/location_picker_sheet.dart';
import '../widgets/moncash_payment_dialog.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen>
    with SingleTickerProviderStateMixin {
  String selectedPayment = 'MONCASH';
  final addressController = TextEditingController();
  final noteController = TextEditingController();
  final promoController = TextEditingController();

  static const Map<String, double> capHaitienZones = {
    'Sant Vil': 150.0,
    'Carénage': 160.0,
    'Haut-du-Cap': 180.0,
    'Baryè Boutèy / Vertières': 180.0,
    'Vaudreuil': 200.0,
    'Petite Anse': 220.0,
    'Madan Kolo': 250.0,
    'Bande du Nord': 300.0,
    'Labadie': 400.0,
  };

  String selectedDeliveryZone = 'Sant Vil';

  bool isSubmitting = false;
  String? appliedPromoCode;
  double discountAmount = 0.0;
  String? promoMessage;
  bool promoError = false;

  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  final paymentMethods = [
    {
      'id': 'MONCASH',
      'name': 'MonCash (Digicel)',
      'desc': 'Peye dirèkteman ak PIN MonCash ou sou entènèt',
      'icon': Icons.account_balance_wallet_rounded,
      'color': AppConstants.monCashRed,
    },
    {
      'id': 'NATCASH',
      'name': 'Natcash (Natcom)',
      'desc': 'Peye ak bous Natcash ou',
      'icon': Icons.phone_android_rounded,
      'color': AppConstants.natcashBlue,
    },
    {
      'id': 'CASH_ON_DELIVERY',
      'name': 'Kach nan men livrè a',
      'desc': 'Peye kach lè yo livre w la',
      'icon': Icons.payments_rounded,
      'color': Colors.amber,
    },
  ];

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final loc = ref.read(deliveryLocationProvider);
      addressController.text = loc.address.isNotEmpty
          ? loc.address
          : 'Boulevard du Cap, Cap-Haïtien';
    });
  }

  @override
  void dispose() {
    addressController.dispose();
    noteController.dispose();
    promoController.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  // ─── Promo Logic ──────────────────────────────────────────────
  void _applyPromo(String code, double subtotal, double deliveryFee) {
    final cleanCode = code.trim().toUpperCase();
    if (cleanCode.isEmpty) return;

    setState(() {
      switch (cleanCode) {
        case 'LAKAY10':
          discountAmount = (subtotal * 0.10).roundToDouble();
          appliedPromoCode = 'LAKAY10';
          promoMessage = 'Rabè 10% aplike avèk siksè (-${discountAmount.toInt()} HTG)';
          promoError = false;
          break;
        case 'GRATIS':
          discountAmount = deliveryFee;
          appliedPromoCode = 'GRATIS';
          promoMessage = 'Livrezon gratis pou ou jodi a (-${discountAmount.toInt()} HTG)';
          promoError = false;
          break;
        case 'BONBAKAY':
          discountAmount = 150.0;
          appliedPromoCode = 'BONBAKAY';
          promoMessage = 'Rabè 150 HTG aplike';
          promoError = false;
          break;
        case 'AYITI2026':
          discountAmount = 200.0;
          appliedPromoCode = 'AYITI2026';
          promoMessage = 'Bon kado 200 HTG aktive';
          promoError = false;
          break;
        default:
          discountAmount = 0.0;
          appliedPromoCode = null;
          promoMessage = 'Kòd promo "$cleanCode" pa valid.';
          promoError = true;
      }
    });
  }

  void _removePromo() {
    setState(() {
      appliedPromoCode = null;
      discountAmount = 0.0;
      promoMessage = null;
      promoError = false;
      promoController.clear();
    });
  }

  // ─── MonCash Handler (dédupliqué — anciennement répété 2x) ───
  Future<void> _handleMonCashPayment({
    required Order order,
    required bool mounted,
  }) async {
    final api = ref.read(apiServiceProvider);
    final supabaseService = SupabaseService();

    final moncashData = await api.initiateMonCashPayment(
      order.id,
      amount: order.totalAmount,
      orderNumber: order.orderNumber,
    );
    final redirectUrl = moncashData?['redirectUrl'] as String?;

    if (!mounted) return;
    setState(() => isSubmitting = false);

    if (redirectUrl != null && mounted) {
      await MoncashPaymentDialog.show(
        context: context,
        order: order,
        redirectUrl: redirectUrl,
        onPaymentSuccess: () {
          ref.read(cartProvider.notifier).clearCart();
          if (mounted) {
            context.pushReplacement(
              '/order-tracking/${order.id}',
              extra: order.copyWith(status: 'CONFIRMED', paymentStatus: 'PAID'),
            );
          }
        },
        onSwitchToCash: () async {
          await supabaseService.updateOrderStatus(order.id, 'CONFIRMED');
          ref.read(cartProvider.notifier).clearCart();
          if (mounted) {
            context.pushReplacement(
              '/order-tracking/${order.id}',
              extra: order.copyWith(
                paymentMethod: 'CASH_ON_DELIVERY',
                status: 'CONFIRMED',
              ),
            );
          }
        },
      );
    } else {
      if (mounted) {
        ref.read(cartProvider.notifier).clearCart();
        context.pushReplacement(
          '/order-tracking/${order.id}',
          extra: order,
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Kòmand lan kreye! Paske pòtal MonCash la pa reponn imedyatman, ou ka peye dirèkteman lè livrè a rive.',
            ),
            backgroundColor: Color(0xFFE4002B),
            behavior: SnackBarBehavior.floating,
            duration: Duration(seconds: 5),
          ),
        );
      }
    }
  }

  // ─── Submit Order ─────────────────────────────────────────────
  Future<void> _submitOrder() async {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty || cart.merchant == null) return;

    // Verifye si kliyan an konekte
    final currentUser = await SupabaseService().getCurrentUser();
    if (currentUser == null || currentUser['id'] == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tanpri konekte oswa kreye yon kont anvan ou pase kòmand lan.'),
            backgroundColor: Colors.deepOrange,
          ),
        );
        context.push('/login');
      }
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => isSubmitting = true);

    try {
      final api = ref.read(apiServiceProvider);
      final loc = ref.read(deliveryLocationProvider);
      final merchant = cart.merchant!;

      final noteParts = <String>[];
      if (noteController.text.trim().isNotEmpty) {
        noteParts.add(noteController.text.trim());
      }
      if (appliedPromoCode != null) {
        noteParts.add('[KÒD PWOMO: $appliedPromoCode (-${discountAmount.toInt()} HTG)]');
      }

      final deliveryStreet = addressController.text.trim().isNotEmpty
          ? addressController.text.trim()
          : (loc.address.isNotEmpty ? loc.address : 'Boulevard du Cap, Cap-Haïtien');

      final zoneBaseFee = capHaitienZones[selectedDeliveryZone] ?? 150.0;
      final finalDeliveryFee = zoneBaseFee + cart.volumeSurcharge + cart.categorySurcharge;

      final order = await api.createOrder(
        merchantId: merchant.id,
        items: cart.items
            .map((e) => {
                  'name': e.item.name,
                  'quantity': e.quantity,
                  'unitPrice': e.item.price,
                  'instructions': e.instructions,
                })
            .toList(),
        deliveryAddress: {
          'street': '$selectedDeliveryZone • $deliveryStreet',
          'city': 'Cap-Haïtien',
          'zone': selectedDeliveryZone,
          'note': noteParts.join(' • '),
        },
        paymentMethod: selectedPayment,
        deliveryFee: finalDeliveryFee,
        deliveryLatitude: loc.latitude ?? 19.7550,
        deliveryLongitude: loc.longitude ?? -72.2050,
        merchantLatitude: merchant.latitude,
        merchantLongitude: merchant.longitude,
      );

      final supabaseService = SupabaseService();

      if (order == null) {
        setState(() => isSubmitting = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Erè pandan kòmand lan t ap anrejistre. Tanpri tcheke koneksyon w epi eseye ankò.'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
        return;
      }

      final trackingOrder = Order(
        id: order.id,
        orderNumber: order.orderNumber,
        status: selectedPayment == 'MONCASH' ? 'PENDING' : order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: selectedPayment == 'MONCASH' ? 'PENDING' : order.paymentStatus,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        subtotal: order.subtotal,
        createdAt: order.createdAt,
        driverName: order.driverName,
        driverPhone: order.driverPhone,
        driverPlate: order.driverPlate,
        driverLat: order.driverLat,
        driverLng: order.driverLng,
        merchantName: order.merchantName ?? merchant.name,
        merchantPhone: order.merchantPhone ?? merchant.phone,
        merchantAddress: order.merchantAddress ?? merchant.address,
        deliveryAddress: order.deliveryAddress,
        merchantCategory: order.merchantCategory ?? merchant.category,
        merchantLogoUrl: order.merchantLogoUrl ?? merchant.logoUrl ?? merchant.image,
      );

      await supabaseService.saveLocalOrder(trackingOrder);
      ref.invalidate(ordersProvider);
      ref.read(loyaltyProvider.notifier).addPointsForOrder(trackingOrder.id, trackingOrder.totalAmount);

      // Route MonCash via unified handler
      if (selectedPayment == 'MONCASH') {
        await _handleMonCashPayment(order: trackingOrder, mounted: mounted);
        return;
      }

      // Cash / Natcash: confirmation directe
      ref.read(cartProvider.notifier).clearCart();
      if (mounted) {
        context.pushReplacement(
          '/order-tracking/${trackingOrder.id}',
          extra: trackingOrder,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erè : $e'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  // ─── BUILD ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);

    if (cart.items.isEmpty) {
      return _EmptyCartView();
    }

    final subtotal = cart.subtotal;
    final zoneBaseFee = capHaitienZones[selectedDeliveryZone] ?? 150.0;
    final deliveryFee = zoneBaseFee + cart.volumeSurcharge + cart.categorySurcharge;
    final rawTotal = subtotal + deliveryFee;
    final finalTotal = (rawTotal - discountAmount) > 0
        ? (rawTotal - discountAmount)
        : 0.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _buildAppBar(cart),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 130),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildMerchantBanner(cart),
              const SizedBox(height: 16),
              _buildItemsSection(cart),
              const SizedBox(height: 16),
              _buildZoneSelector(),
              const SizedBox(height: 16),
              _buildDeliveryAddress(),
              const SizedBox(height: 12),
              _buildOrderNote(),
              const SizedBox(height: 16),
              _buildPaymentSection(),
              const SizedBox(height: 12),
              _buildPromoSection(subtotal, deliveryFee),
              const SizedBox(height: 16),
              _buildReceiptSummary(subtotal, deliveryFee, finalTotal, cart),
            ],
          ),
        ),
      ),
      bottomSheet: _buildCheckoutBar(finalTotal),
    );
  }

  // ─── APP BAR ──────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar(CartState cart) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(72),
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Finalize Kòmand Ou',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Colors.white),
                      ),
                      Text(
                        cart.merchant?.name ?? 'Boutik',
                        style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.9), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, color: Colors.white),
                  tooltip: 'Vide panye a',
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    ref.read(cartProvider.notifier).clearCart();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── MERCHANT BANNER ──────────────────────────────────────────
  Widget _buildMerchantBanner(CartState cart) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppConstants.primaryCrimson.withValues(alpha: 0.06),
            const Color(0xFFF8FAFC),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: AppConstants.primaryCrimson.withValues(alpha: 0.15),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppConstants.primaryCrimson.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.storefront_rounded,
              color: AppConstants.primaryCrimson,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  cart.merchant?.name ?? 'Restoran',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.bolt_rounded, size: 14, color: Color(0xFFD97706)),
                    const SizedBox(width: 3),
                    Text(
                      '${cart.merchant?.avgPrepTimeMinutes ?? 25}–${(cart.merchant?.avgPrepTimeMinutes ?? 25) + 10} min livrezon',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    if (cart.distanceKm > 0) ...[
                      const Text(' · ', style: TextStyle(color: Color(0xFF94A3B8))),
                      Text(
                        '~${cart.distanceKm.toStringAsFixed(1)} km',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF0284C7),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${cart.itemCount} atik',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Color(0xFF15803D),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── ITEMS SECTION ────────────────────────────────────────────
  Widget _buildItemsSection(CartState cart) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Atik (${cart.items.length})',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1E293B),
              ),
            ),
            TextButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.add_rounded, size: 16, color: AppConstants.primaryCrimson),
              label: const Text(
                'Ajoute lòt',
                style: TextStyle(
                  color: AppConstants.primaryCrimson,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ...cart.items.map((cartItem) => _CartItemTile(
              cartItem: cartItem,
              onDecrement: () => ref
                  .read(cartProvider.notifier)
                  .updateQuantity(cartItem.item.id, -1),
              onIncrement: () => ref
                  .read(cartProvider.notifier)
                  .updateQuantity(cartItem.item.id, 1),
            )),
      ],
    );
  }

  // ─── DELIVERY ZONE SELECTOR ───────────────────────────────────
  Widget _buildZoneSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Zòn Livrezon (Okap)',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1E293B),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Text(
                '${(capHaitienZones[selectedDeliveryZone] ?? 150.0).toInt()} HTG baz',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1D4ED8),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selectedDeliveryZone,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
              items: capHaitienZones.entries.map((e) {
                return DropdownMenuItem<String>(
                  value: e.key,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.place_rounded, size: 18, color: Color(0xFFFF6600)),
                          const SizedBox(width: 8),
                          Text(
                            e.key,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '${e.value.toInt()} HTG',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  HapticFeedback.selectionClick();
                  setState(() => selectedDeliveryZone = val);
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  // ─── DELIVERY ADDRESS ─────────────────────────────────────────
  Widget _buildDeliveryAddress() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Adrès Livrezon',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        Consumer(
          builder: (ctx, cRef, _) {
            final loc = cRef.watch(deliveryLocationProvider);
            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () async {
                final result = await LocationPickerSheet.show(context);
                if (result != null) {
                  addressController.text = result.address;
                  if (result.landmark != null) noteController.text = result.landmark!;
                }
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6600).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.location_on_rounded,
                        color: Color(0xFFFF6600),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            loc.address.isNotEmpty
                                ? loc.address
                                : 'Boulevard du Cap, Cap-Haïtien',
                            style: const TextStyle(
                              color: Color(0xFF1E293B),
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (loc.landmark != null && loc.landmark!.isNotEmpty)
                            Text(
                              'Prè de: ${loc.landmark}',
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Modifye',
                        style: TextStyle(
                          color: Color(0xFFFF6600),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // ─── ORDER NOTE ───────────────────────────────────────────────
  Widget _buildOrderNote() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.edit_note_rounded, color: Color(0xFFD97706), size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: noteController,
              style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
              decoration: const InputDecoration(
                isDense: true,
                hintText: 'Nòt espesyal (eg: sòs apa, san piman...)',
                hintStyle: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── PAYMENT SECTION ──────────────────────────────────────────
  Widget _buildPaymentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chwazi Kijan w ap Peye',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 10),
        ...paymentMethods.map((pm) => _PaymentMethodTile(
              method: pm,
              isSelected: selectedPayment == pm['id'],
              onSelect: () {
                HapticFeedback.selectionClick();
                setState(() => selectedPayment = pm['id'] as String);
              },
            )),
      ],
    );
  }

  // ─── PROMO SECTION ────────────────────────────────────────────
  Widget _buildPromoSection(double subtotal, double deliveryFee) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: appliedPromoCode != null
                  ? const Color(0xFF16A34A).withValues(alpha: 0.4)
                  : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            children: [
              Icon(
                appliedPromoCode != null
                    ? Icons.check_circle_rounded
                    : Icons.local_offer_rounded,
                color: appliedPromoCode != null
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFD97706),
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: promoController,
                  enabled: appliedPromoCode == null,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: appliedPromoCode != null
                        ? '$appliedPromoCode aktif (-${discountAmount.toInt()} HTG)'
                        : 'Kòd promo (eg: LAKAY10, GRATIS)',
                    hintStyle: TextStyle(
                      fontSize: 12,
                      color: appliedPromoCode != null
                          ? const Color(0xFF16A34A)
                          : const Color(0xFF94A3B8),
                      fontWeight: appliedPromoCode != null
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                    border: InputBorder.none,
                  ),
                ),
              ),
              if (appliedPromoCode != null)
                TextButton(
                  onPressed: _removePromo,
                  style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                  child: const Text(
                    'Retire',
                    style: TextStyle(
                      color: Colors.redAccent,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              else
                ElevatedButton(
                  onPressed: () => _applyPromo(promoController.text, subtotal, deliveryFee),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E293B),
                    foregroundColor: Colors.white,
                    visualDensity: VisualDensity.compact,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  child: const Text('Aplike', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
        ),
        if (promoMessage != null && promoError) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              promoMessage!,
              style: const TextStyle(
                color: Colors.redAccent,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ],
    );
  }

  // ─── RECEIPT SUMMARY ──────────────────────────────────────────
  Widget _buildReceiptSummary(double subtotal, double deliveryFee, double finalTotal, CartState cart) {
    final baseFee = capHaitienZones[selectedDeliveryZone] ?? 150.0;
    final volumeFee = cart.volumeSurcharge;
    final catFee = cart.categorySurcharge;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _receiptRow('Total atik yo', '${subtotal.toInt()} HTG'),
          const SizedBox(height: 10),
          _receiptRow('Frè baz zòn ($selectedDeliveryZone)', '${baseFee.toInt()} HTG'),
          if (volumeFee > 0) ...[
            const SizedBox(height: 6),
            _receiptRow('Sipleman volim (${cart.totalQuantity} bwat/atik)', '+${volumeFee.toInt()} HTG'),
          ],
          if (catFee > 0) ...[
            const SizedBox(height: 6),
            _receiptRow('Sipleman machandiz lou', '+${catFee.toInt()} HTG'),
          ],
          const SizedBox(height: 6),
          _receiptRow('Total frè livrezon', '${deliveryFee.toInt()} HTG'),
          if (discountAmount > 0) ...[
            const SizedBox(height: 10),
            _receiptRow(
              'Rabè ($appliedPromoCode)',
              '-${discountAmount.toInt()} HTG',
              isDiscount: true,
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: Color(0xFFE2E8F0)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total pou w peye',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: Color(0xFF1E293B),
                ),
              ),
              Text(
                '${finalTotal.toInt()} HTG',
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  color: AppConstants.primaryCrimson,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _receiptRow(String label, String value, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isDiscount ? const Color(0xFF16A34A) : const Color(0xFF64748B),
            fontSize: 13,
            fontWeight: isDiscount ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: isDiscount ? const Color(0xFF16A34A) : const Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }

  // ─── STICKY CHECKOUT BAR ──────────────────────────────────────
  Widget _buildCheckoutBar(double finalTotal) {
    final isMoncash = selectedPayment == 'MONCASH';
    final buttonColor = isMoncash ? const Color(0xFFE4002B) : AppConstants.primaryCrimson;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.10),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total Pou Peye',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${finalTotal.toInt()} HTG',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppConstants.primaryCrimson,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: GestureDetector(
                  onTap: isSubmitting ? null : _submitOrder,
                  child: Container(
                    height: 54,
                    decoration: BoxDecoration(
                      gradient: isMoncash
                          ? const LinearGradient(colors: [Color(0xFFE4002B), Color(0xFFC00024)])
                          : const LinearGradient(
                              colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: (isMoncash ? const Color(0xFFE4002B) : const Color(0xFFFF6600))
                              .withValues(alpha: 0.35),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: isSubmitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  isMoncash
                                      ? Icons.lock_rounded
                                      : Icons.check_circle_rounded,
                                  size: 19,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  isMoncash
                                      ? 'Peye ak MonCash'
                                      : 'Konfime Kòmand lan',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── EMPTY CART VIEW ──────────────────────────────────────────────────────────
class _EmptyCartView extends StatefulWidget {
  @override
  State<_EmptyCartView> createState() => _EmptyCartViewState();
}

class _EmptyCartViewState extends State<_EmptyCartView>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut);
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Panye w la',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE2E8F0), height: 1),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: FadeTransition(
            opacity: _fade,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ScaleTransition(
                  scale: _scale,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppConstants.primaryCrimson.withValues(alpha: 0.12),
                          AppConstants.primaryCrimson.withValues(alpha: 0.06),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.shopping_bag_outlined,
                        size: 48,
                        color: AppConstants.primaryCrimson,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Panye w la vid',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Ajoute yon plat oswa pwodwi nan yon restoran\npou kòmanse kòmand ou.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 14, height: 1.5),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: 240,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () => context.go('/'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.primaryCrimson,
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shadowColor: AppConstants.primaryCrimson.withValues(alpha: 0.4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.explore_rounded, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Dekouvri Restoran yo',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── CART ITEM TILE (widget séparé pour lisibilité) ───────────────────────────
class _CartItemTile extends StatefulWidget {
  final CartItem cartItem;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _CartItemTile({
    required this.cartItem,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  State<_CartItemTile> createState() => _CartItemTileState();
}

class _CartItemTileState extends State<_CartItemTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _pressCtrl;
  late Animation<double> _pressAnim;

  @override
  void initState() {
    super.initState();
    _pressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.97,
      upperBound: 1.0,
    );
    _pressCtrl.value = 1.0;
    _pressAnim = _pressCtrl;
  }

  @override
  void dispose() {
    _pressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cartItem = widget.cartItem;
    return ScaleTransition(
      scale: _pressAnim,
      child: GestureDetector(
        onTapDown: (_) => _pressCtrl.reverse(),
        onTapUp: (_) => _pressCtrl.forward(),
        onTapCancel: () => _pressCtrl.forward(),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cartItem.item.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    if (cartItem.instructions != null &&
                        cartItem.instructions!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(
                          'Nòt: ${cartItem.instructions}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFFD97706),
                          ),
                        ),
                      ),
                    const SizedBox(height: 5),
                    Text(
                      '${cartItem.totalPrice.toInt()} HTG',
                      style: const TextStyle(
                        color: AppConstants.primaryCrimson,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                      onTap: widget.onDecrement,
                      child: const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(Icons.remove_rounded, size: 18, color: Color(0xFF64748B)),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        '${cartItem.quantity}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                    ),
                    InkWell(
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                      onTap: widget.onIncrement,
                      child: const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(
                          Icons.add_rounded,
                          size: 18,
                          color: AppConstants.primaryCrimson,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── PAYMENT METHOD TILE ──────────────────────────────────────────────────────
class _PaymentMethodTile extends StatelessWidget {
  final Map<String, dynamic> method;
  final bool isSelected;
  final VoidCallback onSelect;

  const _PaymentMethodTile({
    required this.method,
    required this.isSelected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final color = method['color'] as Color;
    final icon = method['icon'] as IconData;
    final isMoncash = method['id'] == 'MONCASH';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onSelect,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.07) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE2E8F0),
              width: isSelected ? 2.0 : 1.0,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: color.withValues(alpha: 0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          method['name'] as String,
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        if (isMoncash) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE4002B),
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: const Text(
                              'POPILÈ',
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      method['desc'] as String,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  isSelected
                      ? Icons.check_circle_rounded
                      : Icons.radio_button_off_rounded,
                  key: ValueKey(isSelected),
                  color: isSelected ? color : Colors.grey.shade300,
                  size: 22,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

