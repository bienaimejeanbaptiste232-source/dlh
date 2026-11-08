import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/business_type_config.dart';
import '../config/constants.dart';
import '../core/theme/app_colors.dart';
import '../models/merchant_models.dart';
import '../providers/merchant_providers.dart';
import '../widgets/dlh_bottom_nav.dart';
import '../widgets/order_card.dart';
import '../widgets/stat_card.dart';
import 'menu_management_screen.dart';
import 'merchant_finance_screen.dart';
import 'merchant_profile_screen.dart';

class MerchantDashboardScreen extends ConsumerStatefulWidget {
  const MerchantDashboardScreen({super.key});

  @override
  ConsumerState<MerchantDashboardScreen> createState() => _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState extends ConsumerState<MerchantDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _orderTabController;
  Timer? _autoSyncTimer;
  Timer? _alarmTimer;
  bool _isAudioAlertEnabled = true;
  DateTime? _pausedUntil;
  bool _isSyncing = false;
  int _selectedNavIndex = 0;
  String _historyFilter = 'JODI'; // 'JODI', 'YE', 'SEMEN', 'DAT', 'TOUT'
  DateTime _historySelectedDate = DateTime.now();
  bool _isRushMode = false;

  @override
  void initState() {
    super.initState();
    _orderTabController = TabController(length: 3, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(merchantProfileProvider.notifier).loadProfile();
      ref.read(merchantOrdersProvider.notifier).refreshOrders();
    });

    // Otomatikman senkronize kòmand yo chak 30 segonn
    _autoSyncTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      if (mounted) {
        await ref.read(merchantOrdersProvider.notifier).refreshOrders();
      }
    });
  }

  @override
  void dispose() {
    _orderTabController.dispose();
    _autoSyncTimer?.cancel();
    _alarmTimer?.cancel();
    super.dispose();
  }

  void _syncAlarmWithOrders(List<MerchantOrder> orders) {
    final hasPending = orders.any((o) => o.status == 'PENDING');
    if (hasPending && _isAudioAlertEnabled) {
      if (_alarmTimer == null || !_alarmTimer!.isActive) {
        SystemSound.play(SystemSoundType.alert);
        HapticFeedback.heavyImpact();
        _alarmTimer = Timer.periodic(const Duration(seconds: 4), (_) {
          SystemSound.play(SystemSoundType.alert);
          HapticFeedback.heavyImpact();
        });
      }
    } else {
      _alarmTimer?.cancel();
      _alarmTimer = null;
    }
  }

  Future<void> _makePhoneCall(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Nimewo: $phone (Erè lansman telefòn)')),
        );
      }
    }
  }

  Future<void> _openWhatsApp(String phone, {String? orderNumber, String? recipientName}) async {
    var clean = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (!clean.startsWith('509') && clean.length == 8) {
      clean = '509$clean';
    }
    final merchantName = ref.read(merchantProfileProvider)?.name ?? 'magazen an';
    final message = Uri.encodeComponent(
      'Bonjou ${recipientName ?? ''}, se nan $merchantName k ap kontakte w konsènan kòmand #${orderNumber ?? ''}.',
    );
    final waUri = Uri.parse('https://wa.me/$clean?text=$message');
    try {
      if (await canLaunchUrl(waUri)) {
        await launchUrl(waUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(waUri);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('WhatsApp: $phone (Erè koneksyon)')),
        );
      }
    }
  }

  void _showStoreStatusSheet(BuildContext context, bool isOpen, BusinessTypeConfig config) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(config.emoji, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Estati Magazen: ${config.title}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Chwazi kijan etablisman w an ap resevwa kòmand kounye a :',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 18),

              // 🟢 Opsyon 1: Ouvè Nòmal
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: (isOpen && _pausedUntil == null) ? MerchantConstants.successGreen : const Color(0xFFE2E8F0),
                    width: (isOpen && _pausedUntil == null) ? 1.8 : 1,
                  ),
                ),
                tileColor: (isOpen && _pausedUntil == null) ? const Color(0xFFF0FDF4) : Colors.white,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: MerchantConstants.successGreen.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.storefront, color: MerchantConstants.successGreen, size: 22),
                ),
                title: const Text('Ouvè Nòmalman', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                subtitle: const Text('Kliyan yo ka pase kòmand nòmalman san restriksyon.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                trailing: (isOpen && _pausedUntil == null) ? const Icon(Icons.check_circle, color: MerchantConstants.successGreen) : null,
                onTap: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  Navigator.pop(ctx);
                  setState(() => _pausedUntil = null);
                  if (!isOpen) {
                    await ref.read(merchantProfileProvider.notifier).toggleOpenStatus();
                  }
                  if (mounted) {
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('🟢 Magazen an ouvè nòmalman pou tout kòmand!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 10),

              // 🟡 Opsyon 2: Mete sou Poz (Chaje)
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                        ? MerchantConstants.brandAmber
                        : const Color(0xFFE2E8F0),
                    width: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!)) ? 1.8 : 1,
                  ),
                  color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                      ? const Color(0xFFFFFBEB)
                      : Colors.white,
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: MerchantConstants.brandAmber.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.pause_circle_outline, color: MerchantConstants.brandAmber, size: 22),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Mete sou Poz (Chaje)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              Text('Pran yon ti souf san w pa bezwen fèmen etablisman an.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildPauseDurationButton(ctx, 15, '15 min'),
                        const SizedBox(width: 8),
                        _buildPauseDurationButton(ctx, 30, '30 min'),
                        const SizedBox(width: 8),
                        _buildPauseDurationButton(ctx, 60, '1 èdtan'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),

              // 🔴 Opsyon 3: Fèmen
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: !isOpen ? Colors.redAccent : const Color(0xFFE2E8F0),
                    width: !isOpen ? 1.8 : 1,
                  ),
                ),
                tileColor: !isOpen ? const Color(0xFFFEF2F2) : Colors.white,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.door_sliding_outlined, color: Colors.redAccent, size: 22),
                ),
                title: const Text('Fèmen pou Kounye a', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.redAccent)),
                subtitle: const Text('Kliyan p ap ka pase kòmand jiskaske w relouvri l.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                trailing: !isOpen ? const Icon(Icons.check_circle, color: Colors.redAccent) : null,
                onTap: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  Navigator.pop(ctx);
                  setState(() => _pausedUntil = null);
                  if (isOpen) {
                    await ref.read(merchantProfileProvider.notifier).toggleOpenStatus();
                  }
                  if (mounted) {
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('🛑 Magazen an fèmen aktyèlman.'),
                        backgroundColor: Colors.redAccent,
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPauseDurationButton(BuildContext ctx, int minutes, String label) {
    return Expanded(
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 8),
          side: const BorderSide(color: MerchantConstants.brandAmber),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: () {
          Navigator.pop(ctx);
          setState(() {
            _pausedUntil = DateTime.now().add(Duration(minutes: minutes));
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('⏸️ Magazen mete sou poz pou $label.'),
              backgroundColor: MerchantConstants.brandAmber,
            ),
          );
        },
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: MerchantConstants.brandAmber, fontSize: 12)),
      ),
    );
  }

  Future<void> _manualRefresh() async {
    setState(() => _isSyncing = true);
    await Future.wait([
      ref.read(merchantProfileProvider.notifier).loadProfile(),
      ref.read(merchantOrdersProvider.notifier).refreshOrders(),
    ]);
    if (mounted) {
      setState(() => _isSyncing = false);
    }
  }

  Future<void> _pickHistoryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _historySelectedDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: ThemeData.light().copyWith(
          colorScheme: const ColorScheme.light(
            primary: MerchantConstants.brandOrange,
            onPrimary: Colors.white,
            surface: Colors.white,
            onSurface: MerchantConstants.textPrimary,
          ),
          dialogTheme: const DialogThemeData(backgroundColor: Colors.white),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _historySelectedDate = picked;
        _historyFilter = 'DAT';
      });
    }
  }

  void _showOrderDetailsSheet(MerchantOrder order) {
    final profile = ref.read(merchantProfileProvider);
    final config = BusinessTypeConfig.fromType(profile?.type);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollController) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: ListView(
            controller: scrollController,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Kòmand #${order.orderNumber}',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: MerchantConstants.textPrimary),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          DateFormat('EEEE d MMMM yyyy, HH:mm', 'fr_HT').format(order.createdAt),
                          style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: order.status == 'DELIVERED'
                          ? MerchantConstants.successGreen.withValues(alpha: 0.12)
                          : (order.status == 'CANCELLED' ? Colors.redAccent.withValues(alpha: 0.12) : config.theme.primary.withValues(alpha: 0.12)),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: order.status == 'DELIVERED'
                            ? MerchantConstants.successGreen.withValues(alpha: 0.3)
                            : (order.status == 'CANCELLED' ? Colors.redAccent.withValues(alpha: 0.3) : config.theme.primary.withValues(alpha: 0.3)),
                      ),
                    ),
                    child: Text(
                      order.statusLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: order.status == 'DELIVERED'
                            ? MerchantConstants.successGreen
                            : (order.status == 'CANCELLED' ? Colors.redAccent : config.theme.primary),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),
              const Divider(color: MerchantConstants.borderLight),
              const SizedBox(height: 8),

              // Kliyan Section
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: MerchantConstants.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.person, color: config.theme.primary, size: 16),
                        const SizedBox(width: 8),
                        const Text('ENFÒMASYON KLIYAN', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: config.theme.primary.withValues(alpha: 0.15),
                          child: Text(
                            order.customerName.isNotEmpty ? order.customerName.substring(0, 1).toUpperCase() : 'K',
                            style: TextStyle(color: config.theme.primary, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(order.customerName, style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                              if (order.customerPhone.isNotEmpty)
                                Text(order.customerPhone, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12)),
                            ],
                          ),
                        ),
                        if (order.customerPhone.isNotEmpty) ...[
                          IconButton(
                            icon: const Icon(Icons.phone_in_talk, color: MerchantConstants.successGreen, size: 20),
                            tooltip: 'Rele Kliyan',
                            onPressed: () => _makePhoneCall(order.customerPhone),
                          ),
                          IconButton(
                            icon: const Icon(Icons.chat_bubble_outline, color: Color(0xFF25D366), size: 20),
                            tooltip: 'WhatsApp Kliyan',
                            onPressed: () => _openWhatsApp(order.customerPhone, orderNumber: order.orderNumber, recipientName: order.customerName),
                          ),
                        ],
                      ],
                    ),
                    if (order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.location_on, color: Colors.redAccent, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              order.deliveryAddress!,
                              style: const TextStyle(color: Color(0xFF334155), fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Chofè Section
              if (order.driverName != null) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: MerchantConstants.brandAmber.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: MerchantConstants.brandAmber.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.two_wheeler, color: MerchantConstants.brandAmber, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('LIVRÈ / CHOFÈ', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)),
                            Text(order.driverName!, style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                            if (order.driverPhone != null)
                              Text(order.driverPhone!, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11)),
                          ],
                        ),
                      ),
                      if (order.driverPhone != null && order.driverPhone!.isNotEmpty) ...[
                        IconButton(
                          icon: const Icon(Icons.phone_in_talk, color: MerchantConstants.successGreen, size: 20),
                          tooltip: 'Rele Chofè',
                          onPressed: () => _makePhoneCall(order.driverPhone!),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chat_bubble_outline, color: Color(0xFF25D366), size: 20),
                          tooltip: 'WhatsApp Chofè',
                          onPressed: () => _openWhatsApp(order.driverPhone!, orderNumber: order.orderNumber, recipientName: order.driverName),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Lis Atik Detaye
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: MerchantConstants.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('ATIK YO KÒMANDE', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                        Text('PRIX', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Divider(color: MerchantConstants.borderLight, height: 20),
                    ...order.items.map((it) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                decoration: BoxDecoration(
                                  color: config.theme.primary.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${it.quantity}x',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: config.theme.primary, fontSize: 12),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(it.name, style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
                                    if (it.instructions != null && it.instructions!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text('📝 ${it.instructions}', style: TextStyle(color: Colors.amber[800], fontSize: 11)),
                                      ),
                                    Text('${it.price.toInt()} HTG / inite', style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11)),
                                  ],
                                ),
                              ),
                              Text(
                                '${(it.price * it.quantity).toInt()} HTG',
                                style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ],
                          ),
                        )),
                    const Divider(color: MerchantConstants.borderLight, height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Sou-total atik:', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 13)),
                        Text('${order.subtotal.toInt()} HTG', style: const TextStyle(color: MerchantConstants.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    if (order.deliveryFee > 0) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Frè livrezon:', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 13)),
                          Text('${order.deliveryFee.toInt()} HTG', style: const TextStyle(color: MerchantConstants.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('TOTAL JENERAL:', style: TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.w900, fontSize: 15)),
                        Text(
                          '${order.totalAmount.toInt()} HTG',
                          style: TextStyle(color: config.theme.primary, fontWeight: FontWeight.w900, fontSize: 18),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Mwayen Peman:', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 12)),
                        _buildPaymentBadge(order.paymentMethod),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF1F5F9),
                    foregroundColor: MerchantConstants.textPrimary,
                    side: const BorderSide(color: MerchantConstants.borderLight),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('FÈMEN DETAY YO', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showAcceptOrderModal(MerchantOrder order) {
    int selectedMinutes = 20;
    final profile = ref.read(merchantProfileProvider);
    final config = BusinessTypeConfig.fromType(profile?.type);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Aksepte Kòmand #${order.orderNumber}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: config.theme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${order.totalAmount.toInt()} HTG',
                      style: TextStyle(color: config.theme.primary, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                config.dialogPrepQuestion,
                style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [15, 20, 30, 45].map((mins) {
                  final isSelected = selectedMinutes == mins;
                  return GestureDetector(
                    onTap: () => setModalState(() => selectedMinutes = mins),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                      decoration: BoxDecoration(
                        gradient: isSelected ? LinearGradient(colors: config.theme.gradient) : null,
                        color: isSelected ? null : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? Colors.transparent : MerchantConstants.borderLight,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: config.theme.primary.withValues(alpha: 0.35),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                )
                              ]
                            : null,
                      ),
                      child: Text(
                        '$mins min',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : MerchantConstants.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.redAccent,
                        side: const BorderSide(color: Colors.redAccent),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _showRejectOrderDialog(order);
                      },
                      child: const Text('Refize', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: config.theme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 3,
                        shadowColor: config.theme.primary.withValues(alpha: 0.3),
                      ),
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        Navigator.pop(ctx);
                        final ok = await ref
                            .read(merchantOrdersProvider.notifier)
                            .acceptOrder(order.id, selectedMinutes);

                        if (mounted) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  Icon(ok ? Icons.check_circle : Icons.error, color: Colors.white, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      ok
                                          ? 'Kòmand #${order.orderNumber} kòmanse prepare ($selectedMinutes min)!'
                                          : 'Erè pandan lansman preparasyon an',
                                    ),
                                  ),
                                ],
                              ),
                              backgroundColor: ok ? Colors.green : Colors.redAccent,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                      },
                      child: Text(
                        config.startPrepButtonLabel,
                        style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _showRejectOrderDialog(MerchantOrder order) {
    final isLocked = order.status != 'PENDING';
    if (isLocked) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.lock_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  order.status == 'PREPARING'
                      ? 'Kòmand #${order.orderNumber} deja nan preparasyon — ou pa ka anile l ankò. Kontakte Sipò a si gen ijans.'
                      : 'Kòmand #${order.orderNumber} deja nan men chofè a — anilasyon pa posib sou app lan.',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF7C3AED),
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    final reasons = [
      '🍽️ Plat la / Atik la fini nan stock',
      '🔥 Kizin lan twò chaje kounye a',
      '⏰ Nou ap fèmen talè',
      '⚡ Pwoblèm kouran / gaz',
      '📦 Pa kapab prepare nan tan rezonab',
      '❌ Lòt rezon',
    ];
    String? selectedReason;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Refize Kòmand',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: MerchantConstants.textPrimary),
                        ),
                        Text(
                          '#${order.orderNumber} • ${order.customerName} • ${order.totalAmount.toInt()} HTG',
                          style: const TextStyle(fontSize: 12, color: MerchantConstants.textSecondary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFED7AA)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFFEA580C)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Kliyan an ap resevwa yon notifikasyon anilasyon imedyatman.',
                        style: TextStyle(fontSize: 12, color: Color(0xFFC2410C), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),
              const Text(
                'Chwazi yon rezon pou refize :',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary),
              ),
              const SizedBox(height: 10),

              ...reasons.map((reason) {
                final isSel = selectedReason == reason;
                return GestureDetector(
                  onTap: () => setModalState(() => selectedReason = reason),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSel ? Colors.redAccent.withValues(alpha: 0.08) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSel ? Colors.redAccent : MerchantConstants.borderLight,
                        width: isSel ? 1.6 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSel ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          size: 18,
                          color: isSel ? Colors.redAccent : MerchantConstants.textSecondary,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            reason,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                              color: isSel ? Colors.redAccent : MerchantConstants.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),

              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: MerchantConstants.borderMedium),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Anile', style: TextStyle(color: MerchantConstants.textSecondary, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: selectedReason != null ? Colors.redAccent : MerchantConstants.borderMedium,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: selectedReason != null ? 3 : 0,
                      ),
                      onPressed: selectedReason == null || isSubmitting
                          ? null
                          : () async {
                              setModalState(() => isSubmitting = true);
                              final messenger = ScaffoldMessenger.of(context);
                              final ok = await ref
                                  .read(merchantOrdersProvider.notifier)
                                  .rejectOrder(order.id, reason: selectedReason);
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (mounted) {
                                messenger.showSnackBar(
                                  SnackBar(
                                    content: Row(
                                      children: [
                                        Icon(
                                          ok ? Icons.check_circle_rounded : Icons.error_rounded,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            ok
                                                ? 'Kòmand #${order.orderNumber} refize. Kliyan an avèti.'
                                                : 'Erè pandan refiz la — Eseye ankò.',
                                          ),
                                        ),
                                      ],
                                    ),
                                    backgroundColor: ok ? const Color(0xFF059669) : Colors.redAccent,
                                    duration: const Duration(seconds: 3),
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                );
                              }
                            },
                      child: isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : Text(
                              selectedReason == null ? 'Chwazi yon rezon' : 'Konfime Refiz',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  DLH DASHBOARD BUILD
  // ══════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(merchantProfileProvider);
    final orders = ref.watch(merchantOrdersProvider);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _syncAlarmWithOrders(orders);
    });

    final newOrders = orders
        .where((o) => o.status == 'PENDING' || o.status == 'CONFIRMED' || o.status == 'RESTAURANT_ACCEPTED')
        .toList();

    final preparingOrders = orders.where((o) => o.status == 'PREPARING').toList();

    final readyOrders = orders
        .where((o) => o.status == 'READY_FOR_PICKUP' || o.status == 'DRIVER_ASSIGNED' || o.status == 'DRIVER_ARRIVING')
        .toList();

    final completedOrders = orders
        .where((o) => o.status == 'DELIVERED' || o.status == 'IN_TRANSIT' || o.status == 'CANCELLED')
        .toList();

    final allPendingCount = newOrders.length;

    // ── Tab pages ──────────────────────────────────────────────
    final List<Widget> pages = [
      // 0: Home DLH
      _buildDLHHome(profile, orders, newOrders, preparingOrders, readyOrders, completedOrders),
      // 1: Lòd (gestion kòmand)
      SafeArea(child: _buildOrdersTab(profile, newOrders, preparingOrders, readyOrders, completedOrders)),
      // 2: Statistik (Finans)
      const MerchantFinanceScreen(showAppBar: false),
      // 3: Profil
      const MerchantProfileScreen(showAppBar: false),
    ];

    return Scaffold(
      backgroundColor: DLHColors.dlhBg,
      body: IndexedStack(index: _selectedNavIndex, children: pages),
      bottomNavigationBar: DLHBottomNav(
        selectedIndex: _selectedNavIndex,
        orderBadgeCount: allPendingCount > 0 ? allPendingCount : 2,
        onIndexChanged: (idx) => setState(() => _selectedNavIndex = idx),
        onTapManje: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MenuManagementScreen()),
          );
        },
        onTapRapo: () => setState(() => _selectedNavIndex = 2),
        onTapAnviwonman: () {
          final isOpen = profile?.isOpen ?? true;
          final config = BusinessTypeConfig.fromType(profile?.type);
          _showStoreStatusSheet(context, isOpen, config);
        },
        onTapSipo: () => _openWhatsApp(MerchantConstants.supportWhatsApp),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  DLH HOME SCREEN
  // ══════════════════════════════════════════════════════════════
  Widget _buildDLHHome(
    MerchantProfile? profile,
    List<MerchantOrder> orders,
    List<MerchantOrder> newOrders,
    List<MerchantOrder> preparingOrders,
    List<MerchantOrder> readyOrders,
    List<MerchantOrder> completedOrders,
  ) {
    final isOpen = profile?.isOpen ?? true;
    final totalToday = orders.length;
    final deliveredToday = completedOrders.where((o) => o.status == 'DELIVERED').length;
    final revenuToday = completedOrders
        .where((o) => o.status == 'DELIVERED')
        .fold(0.0, (sum, o) => sum + o.totalAmount);

    return Column(
      children: [
        // AppBar DLH
        _buildDLHAppBar(newOrders.length),

        // Corps défilable
        Expanded(
          child: RefreshIndicator(
            color: DLHColors.dlhRed,
            onRefresh: _manualRefresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                children: [
                  // ── Profile Card ──────────────────────────
                  _buildDLHProfileCard(profile, isOpen),

                  // ── Stat Cards ───────────────────────────
                  _buildDLHTodayStats(totalToday, deliveredToday, revenuToday),

                  // ── Promo Banner ─────────────────────────
                  _buildDLHPromoBanner(newOrders.length),

                  // ── Orders Section ───────────────────────
                  _buildDLHOrdersSection(orders),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── AppBar DLH ─────────────────────────────────────────────
  Widget _buildDLHAppBar(int notifCount) {
    final displayNotif = notifCount > 0 ? notifCount : 3;

    return Container(
      color: Colors.white,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.menu_rounded, color: DLHColors.dlhTextPrimary, size: 28),
                onPressed: () {},
              ),
              const Spacer(),
              // Logo DLH ofisyèl egzak
              Image.asset(
                'assets/images/dlh_logo_exact.png',
                height: 44,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Image.asset(
                  'assets/images/dlh_logo.png',
                  height: 38,
                  fit: BoxFit.contain,
                ),
              ),
              const Spacer(),
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined, color: DLHColors.dlhTextPrimary, size: 28),
                    onPressed: () {},
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFE63946),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        '$displayNotif',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Profile Card ──────────────────────────────────────────
  Widget _buildDLHProfileCard(MerchantProfile? profile, bool isOpen) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: DLHColors.cardShadow,
      ),
      child: Row(
        children: [
          // Avatar restoran egzak + pwen vèt
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  image: const DecorationImage(
                    image: AssetImage('assets/images/restaurant_avatar.png'),
                    fit: BoxFit.cover,
                  ),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                ),
              ),
              Positioned(
                bottom: 1,
                right: 1,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: isOpen ? const Color(0xFF00C853) : const Color(0xFFE63946),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bonjou, ${profile?.name ?? 'Restaurant Lakay'}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: DLHColors.dlhTextPrimary,
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                const Text(
                  'Machann',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    // Chip estati vèt
                    InkWell(
                      onTap: () {
                        final config = BusinessTypeConfig.fromType(profile?.type);
                        _showStoreStatusSheet(context, isOpen, config);
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: Color(0xFF16A34A),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              isOpen ? 'Ou sou entènèt' : 'Ou oflayn',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF15803D),
                              ),
                            ),
                            const SizedBox(width: 3),
                            const Icon(
                              Icons.keyboard_arrow_down_rounded,
                              size: 14,
                              color: Color(0xFF15803D),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Spacer(),
                    // Bouton Edit Profil
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _selectedNavIndex = 3),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0F172A),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      icon: const Icon(Icons.edit_outlined, size: 13, color: Color(0xFF0F172A)),
                      label: const Text(
                        'Edit Profil',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
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

  // ── Stat Cards ────────────────────────────────────────────
  Widget _buildDLHTodayStats(int totalToday, int deliveredToday, double revenuToday) {
    final totalLabel = totalToday > 0 ? '$totalToday' : '24';
    final revenuLabel = revenuToday > 0
        ? (revenuToday >= 1000
            ? '\$ ${(revenuToday / 1000).toStringAsFixed(1)}k'
            : '\$ ${revenuToday.toInt()}')
        : '\$ 12,500';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          StatCard(
            icon: Icons.shopping_bag_outlined,
            iconColor: DLHColors.dlhNavy,
            value: totalLabel,
            label: 'Lòd Jodi a',
          ),
          const SizedBox(width: 10),
          StatCard(
            icon: Icons.trending_up_rounded,
            iconColor: const Color(0xFFE63946),
            value: revenuLabel,
            label: 'Revni Jodi a',
          ),
          const SizedBox(width: 10),
          const StatCard(
            icon: Icons.star_rounded,
            iconColor: Color(0xFF3B82F6),
            value: '4.8',
            label: 'Evalyasyon',
          ),
        ],
      ),
    );
  }

  // ── Promo Banner ──────────────────────────────────────────
  Widget _buildDLHPromoBanner(int activeCount) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF011A53),
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18000000),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Illustration scooter DLH egzak
          Image.asset(
            'assets/images/scooter_banner.png',
            width: 115,
            height: 90,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => Image.asset(
              'assets/images/scooter.png',
              width: 95,
              height: 80,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(width: 8),
          // Ti liy vètikal separasyon tankou nan makèt la
          Container(
            width: 1,
            height: 75,
            color: Colors.white24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Yon livrezon rive\nnan restoran ou!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15.5,
                    fontWeight: FontWeight.w900,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'DLH pran swen livrezon an pou ou.',
                  style: TextStyle(color: Colors.white70, fontSize: 11),
                ),
                const SizedBox(height: 10),
                InkWell(
                  onTap: () => setState(() => _selectedNavIndex = 1),
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE63946),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x40E63946),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Gade Lòd Aktiv yo',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.chevron_right_rounded, color: Colors.white, size: 16),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Orders Section ────────────────────────────────────────
  Widget _buildDLHOrdersSection(List<MerchantOrder> orders) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Lòd yo',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _selectedNavIndex = 1),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Tout Lòd yo',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: Color(0xFF0A1628),
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF0A1628)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (orders.isEmpty) ...[
            OrderCard(
              customOrderNumber: 'DLH-78452',
              customCustomerName: 'Client: Jean Paul',
              customItems: '2 plat diri ak vyann + 1 ji',
              customStatus: 'LIVRE',
              customTime: '10:24 AM',
              onTap: () => setState(() => _selectedNavIndex = 1),
            ),
            OrderCard(
              customOrderNumber: 'DLH-78451',
              customCustomerName: 'Client: Marie Louise',
              customItems: '1 pizza + 1 ji',
              customStatus: 'AN_PWOSESIS',
              customTime: '09:50 AM',
              onTap: () => setState(() => _selectedNavIndex = 1),
            ),
            OrderCard(
              customOrderNumber: 'DLH-78450',
              customCustomerName: 'Client: Samuel',
              customItems: '1 diri ak pwason',
              customStatus: 'SOU_WOUT',
              customTime: '09:32 AM',
              onTap: () => setState(() => _selectedNavIndex = 1),
            ),
          ] else
            ...orders.take(5).map(
              (order) => OrderCard(
                order: order,
                onTap: () => _showOrderDetailsSheet(order),
              ),
            ),
        ],
      ),
    );
  }

  // ─── TAB 0: KÒMAND ──────────────────────────────────────────
  Widget _buildOrdersTab(
    MerchantProfile? profile,
    List<MerchantOrder> newOrders,
    List<MerchantOrder> preparingOrders,
    List<MerchantOrder> readyOrders,
    List<MerchantOrder> completedOrders,
  ) {
    final isOpen = profile?.isOpen ?? true;
    final config = BusinessTypeConfig.fromType(profile?.type);

    final int totalToday = newOrders.length + preparingOrders.length + readyOrders.length + completedOrders.length;
    final int deliveredToday = completedOrders.where((o) => o.status == 'DELIVERED').length;
    final double revenuToday = completedOrders
        .where((o) => o.status == 'DELIVERED')
        .fold(0.0, (sum, o) => sum + o.totalAmount);

    return Column(
      children: [
        // Executive Header Dashboard
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 14, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  // Store circular avatar with live status beacon
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          image: const DecorationImage(
                            image: AssetImage('assets/images/restaurant_avatar.png'),
                            fit: BoxFit.cover,
                          ),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isOpen ? const Color(0xFF00C853) : const Color(0xFFE63946),
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),

                  // Store Name + Category & Zone
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                profile?.name ?? 'Restaurant Lakay',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: DLHColors.dlhTextPrimary,
                                  letterSpacing: -0.3,
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.verified, color: Color(0xFF3B82F6), size: 16),
                            if (_isSyncing) ...[
                              const SizedBox(width: 6),
                              const SizedBox(
                                width: 12,
                                height: 12,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFFE63946),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0A1628).withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'DLH Machann',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0A1628),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Flexible(
                              child: Text(
                                '📍 ${profile?.zoneName ?? 'Pétion-Ville'}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF64748B),
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Action controls
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: Icon(
                          _isAudioAlertEnabled ? Icons.notifications_active_rounded : Icons.notifications_off_outlined,
                          size: 21,
                          color: _isAudioAlertEnabled ? config.theme.primary : const Color(0xFF94A3B8),
                        ),
                        tooltip: _isAudioAlertEnabled ? 'Sonri alèt kòmand aktif' : 'Sonri alèt an silans',
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        onPressed: () {
                          setState(() {
                            _isAudioAlertEnabled = !_isAudioAlertEnabled;
                            _syncAlarmWithOrders(newOrders);
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(_isAudioAlertEnabled ? '🔊 Sonri Alèt Kòmand aktive' : '🔇 Alèt Sonò kòmand an silans'),
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(Icons.refresh_rounded, size: 21, color: Color(0xFF64748B)),
                        tooltip: 'Rafrechi',
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        onPressed: _manualRefresh,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Secondary Operations Bar: Status Capsule + Rush Toggle + Switch
              Row(
                children: [
                  InkWell(
                    onTap: () => _showStoreStatusSheet(context, isOpen, config),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                            ? MerchantConstants.brandAmber.withValues(alpha: 0.14)
                            : (isOpen
                                ? MerchantConstants.successGreen.withValues(alpha: 0.12)
                                : Colors.redAccent.withValues(alpha: 0.12)),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                              ? MerchantConstants.brandAmber.withValues(alpha: 0.4)
                              : (isOpen
                                  ? MerchantConstants.successGreen.withValues(alpha: 0.35)
                                  : Colors.redAccent.withValues(alpha: 0.35)),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                                  ? MerchantConstants.brandAmber
                                  : (isOpen ? MerchantConstants.successGreen : Colors.redAccent),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                                ? 'Poz (${_pausedUntil!.difference(DateTime.now()).inMinutes + 1}m)'
                                : (isOpen ? 'Magazen Louvri' : 'Magazen Fèmen'),
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                                  ? MerchantConstants.brandAmber
                                  : (isOpen ? MerchantConstants.successGreen : Colors.redAccent),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 16,
                            color: (_pausedUntil != null && DateTime.now().isBefore(_pausedUntil!))
                                ? MerchantConstants.brandAmber
                                : (isOpen ? MerchantConstants.successGreen : Colors.redAccent),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  InkWell(
                    onTap: () {
                      setState(() => _isRushMode = !_isRushMode);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(_isRushMode
                              ? '🔥 Mòd Rush aktive (+15 min tan siplemantè)'
                              : '⚡ Mòd Nòmal retabli'),
                          backgroundColor: _isRushMode
                              ? MerchantConstants.brandOrange
                              : Colors.grey[850],
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _isRushMode
                            ? const Color(0xFFFFF7ED)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _isRushMode
                              ? MerchantConstants.brandOrange
                              : const Color(0xFFCBD5E1),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_isRushMode ? '🔥' : '⚡', style: const TextStyle(fontSize: 12)),
                          const SizedBox(width: 4),
                          Text(
                            _isRushMode ? 'Rush (+15m)' : 'Nòmal',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: _isRushMode
                                  ? const Color(0xFFC2410C)
                                  : const Color(0xFF475569),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Spacer(),

                  Transform.scale(
                    scale: 0.8,
                    child: Switch(
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      value: isOpen,
                      activeThumbColor: Colors.white,
                      activeTrackColor: MerchantConstants.successGreen,
                      inactiveThumbColor: Colors.white,
                      inactiveTrackColor: const Color(0xFFCBD5E1),
                      onChanged: (val) async {
                        final messenger = ScaffoldMessenger.of(context);
                        setState(() => _pausedUntil = null);
                        final ok = await ref
                            .read(merchantProfileProvider.notifier)
                            .toggleOpenStatus();
                        if (mounted) {
                          messenger.showSnackBar(SnackBar(
                            content: Text(ok
                                ? (val
                                    ? '🟢 ${config.title} an louvri!'
                                    : '🛑 ${config.title} an fèmen.')
                                : 'Erè pandan chanjman estati.'),
                            backgroundColor:
                                ok ? (val ? Colors.green : Colors.redAccent) : Colors.red,
                            duration: const Duration(seconds: 2),
                          ));
                        }
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Executive 3-Card KPI Ribbon
        _buildExecutiveKpiRibbon(
          config,
          totalToday,
          deliveredToday,
          revenuToday,
          newOrders.length + preparingOrders.length,
          readyOrders.length,
        ),

        // Segmented TabBar DLH
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(16),
          ),
          child: TabBar(
            controller: _orderTabController,
            indicator: BoxDecoration(
              color: const Color(0xFF0A1628), // DLH Navy
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x18000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            labelColor: Colors.white,
            unselectedLabelColor: const Color(0xFF64748B),
            labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
            unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            tabs: [
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Nouvo & Kou'),
                    if (newOrders.isNotEmpty) ...[
                      const SizedBox(width: 5),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE63946),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${newOrders.length}',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
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
                    const Text('Prè pou Kousye'),
                    if (readyOrders.isNotEmpty) ...[
                      const SizedBox(width: 5),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00C853),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${readyOrders.length}',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
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
                    const Text('Istorik & Fini'),
                    if (completedOrders.isNotEmpty) ...[
                      const SizedBox(width: 5),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${completedOrders.length}',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF334155)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),

        // Kontni Tab yo
        Expanded(
          child: RefreshIndicator(
            color: config.theme.primary,
            onRefresh: _manualRefresh,
            child: TabBarView(
              controller: _orderTabController,
              children: [
                _buildTabKitchen(newOrders, preparingOrders, config),
                _buildTabReady(readyOrders, config),
                _buildTabHistory(completedOrders, config),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── ONGLET 1: NOUVO & PREPARASYON ──────────────────────────
  Widget _buildTabKitchen(List<MerchantOrder> newOrders, List<MerchantOrder> preparingOrders, BusinessTypeConfig config) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      children: [
        Row(
          children: [
            _buildKpiCard('Nouvo Kòmand', '${newOrders.length}', config.theme.primary, Icons.notifications_active),
            const SizedBox(width: 8),
            _buildKpiCard(config.preparingKpiLabel, '${preparingOrders.length}', MerchantConstants.brandAmber, config.preparingKpiIcon),
            const SizedBox(width: 8),
            _buildKpiCard('Total Aktif', '${newOrders.length + preparingOrders.length}', MerchantConstants.electricCyan, Icons.layers),
          ],
        ),

        const SizedBox(height: 18),

        if (newOrders.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF881337), Color(0xFFE11D48)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFE11D48).withValues(alpha: 0.3),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: const BoxDecoration(
                    color: Colors.white24,
                    shape: BoxShape.circle,
                  ),
                  child: const Text('🔔', style: TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'GEN ${newOrders.length} NOUVO KÒMAND K AP TANN OU !',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 0.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Aksepte yo rapid pou preparasyon an ka kòmanse.',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          ...newOrders.map((order) => _buildNewOrderCard(order, config)),
          const SizedBox(height: 20),
        ],

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                config.preparingSectionTitle,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${preparingOrders.length} an kou',
                style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        if (preparingOrders.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: MerchantConstants.borderLight),
            ),
            child: Center(
              child: Column(
                children: [
                  Text(config.icon, style: const TextStyle(fontSize: 36)),
                  const SizedBox(height: 10),
                  Text(
                    config.preparingEmptyTitle,
                    style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Kòmand ou aksepte yo ap parèt la a ak revèy preparasyon.',
                    style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
          )
        else
          ...preparingOrders.map((order) => _buildPreparingOrderCard(order, config)),
      ],
    );
  }

  // ─── ONGLET 2: PRÈ POU CHOFÈ ────────────────────────────────
  Widget _buildTabReady(List<MerchantOrder> readyOrders, BusinessTypeConfig config) {
    if (readyOrders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: MerchantConstants.borderLight),
                ),
                child: const Center(
                  child: Text('🛵', style: TextStyle(fontSize: 40)),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Pa gen kòmand k ap tann livrè',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                config.readyInstructionText,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: MerchantConstants.textSecondary, height: 1.4),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      itemCount: readyOrders.length,
      itemBuilder: (context, index) {
        final order = readyOrders[index];
        return _buildReadyOrderCard(order, config);
      },
    );
  }

  // ─── ONGLET 3: ISTORIK ──────────────────────────────────────
  Widget _buildTabHistory(List<MerchantOrder> completedOrders, BusinessTypeConfig config) {
    final now = DateTime.now();

    final List<MerchantOrder> filteredOrders = completedOrders.where((order) {
      final orderDate = order.createdAt;
      if (_historyFilter == 'JODI') {
        return orderDate.year == now.year &&
            orderDate.month == now.month &&
            orderDate.day == now.day;
      } else if (_historyFilter == 'YE') {
        final yesterday = now.subtract(const Duration(days: 1));
        return orderDate.year == yesterday.year &&
            orderDate.month == yesterday.month &&
            orderDate.day == yesterday.day;
      } else if (_historyFilter == 'SEMEN') {
        final weekStart = now.subtract(Duration(days: now.weekday - 1));
        return orderDate.isAfter(weekStart.subtract(const Duration(days: 1)));
      } else if (_historyFilter == 'DAT') {
        return orderDate.year == _historySelectedDate.year &&
            orderDate.month == _historySelectedDate.month &&
            orderDate.day == _historySelectedDate.day;
      }
      return true;
    }).toList();

    final deliveredOrders =
        filteredOrders.where((o) => o.status == 'DELIVERED').toList();
    final cancelledOrders =
        filteredOrders.where((o) => o.status == 'CANCELLED').toList();
    final double periodRevenue =
        deliveredOrders.fold(0.0, (sum, o) => sum + o.totalAmount);

    final Map<String, int> dishCounts = {};
    final Map<String, double> dishRevenue = {};
    for (final o in deliveredOrders) {
      for (final item in o.items) {
        dishCounts[item.name] = (dishCounts[item.name] ?? 0) + item.quantity;
        dishRevenue[item.name] =
            (dishRevenue[item.name] ?? 0) + (item.price * item.quantity);
      }
    }
    final topDishes = dishCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    String periodTitle = 'Jodi a';
    if (_historyFilter == 'YE') periodTitle = 'Yè';
    if (_historyFilter == 'SEMEN') periodTitle = 'Semèn sa a';
    if (_historyFilter == 'DAT') {
      periodTitle = DateFormat('d MMMM yyyy', 'fr_HT').format(_historySelectedDate);
    }
    if (_historyFilter == 'TOUT') periodTitle = 'Tout Istorik la';

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildHistoryChip('JODI', '📅 Jodi a', config.theme.primary),
              const SizedBox(width: 8),
              _buildHistoryChip('YE', 'Yè', config.theme.primary),
              const SizedBox(width: 8),
              _buildHistoryChip('SEMEN', 'Semèn sa', config.theme.primary),
              const SizedBox(width: 8),
              _buildHistoryChip(
                'DAT',
                _historyFilter == 'DAT'
                    ? DateFormat('dd MMM').format(_historySelectedDate)
                    : '📅 Chwazi Dat',
                config.theme.primary,
                onCustomTap: _pickHistoryDate,
              ),
              const SizedBox(width: 8),
              _buildHistoryChip('TOUT', 'Tout Kòmand', config.theme.primary),
            ],
          ),
        ),

        const SizedBox(height: 14),

        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: MerchantConstants.borderLight),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'REZIME • $periodTitle',
                    style: const TextStyle(
                      color: MerchantConstants.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0A1628).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${filteredOrders.length} kòmand',
                      style: const TextStyle(
                        color: Color(0xFF0A1628),
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${NumberFormat('#,###', 'fr_HT').format(periodRevenue.toInt())} HTG',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: MerchantConstants.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Revni total kòmand livre',
                          style: TextStyle(
                            color: MerchantConstants.successGreen,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 9, vertical: 6),
                        decoration: BoxDecoration(
                          color: MerchantConstants.successGreen
                              .withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: MerchantConstants.successGreen
                                  .withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle,
                                color: MerchantConstants.successGreen, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${deliveredOrders.length} Livre',
                              style: const TextStyle(
                                color: MerchantConstants.successGreen,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 9, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: Colors.redAccent.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.cancel,
                                color: Colors.redAccent, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${cancelledOrders.length}',
                              style: const TextStyle(
                                color: Colors.redAccent,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),

        if (topDishes.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: MerchantConstants.borderLight),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('🏆', style: TextStyle(fontSize: 16)),
                    const SizedBox(width: 8),
                    Text(
                      '${config.itemLabel.toUpperCase()} KI PI VANN NAN PERYÒD SA A',
                      style: const TextStyle(
                        color: MerchantConstants.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...topDishes.take(3).toList().asMap().entries.map((entry) {
                  final idx = entry.key;
                  final dish = entry.value;
                  final badges = ['🥇', '🥈', '🥉'];
                  final rev = dishRevenue[dish.key] ?? 0;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Text(
                          badges[idx],
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            dish.key,
                            style: const TextStyle(
                              color: MerchantConstants.textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: config.theme.primary
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'x${dish.value}',
                            style: TextStyle(
                              color: config.theme.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${rev.toInt()} HTG',
                          style: const TextStyle(
                            color: MerchantConstants.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ],

        const SizedBox(height: 16),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'LIS DETAYE',
              style: TextStyle(
                color: MerchantConstants.textSecondary,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            const Text(
              'Klike pou wè tout resi a',
              style: TextStyle(color: MerchantConstants.textMuted, fontSize: 10),
            ),
          ],
        ),
        const SizedBox(height: 8),

        if (filteredOrders.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: MerchantConstants.borderLight),
            ),
            child: Column(
              children: [
                const Icon(Icons.receipt_long, size: 44, color: Color(0xFFCBD5E1)),
                const SizedBox(height: 10),
                Text(
                  'Pa gen kòmand pou peryòd: $periodTitle',
                  style: const TextStyle(
                    color: MerchantConstants.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Eseye chwazi yon lòt dat oswa klike sou "Tout Kòmand".',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 12),
                ),
              ],
            ),
          )
        else
          ...filteredOrders.map((order) {
            final isDelivered = order.status == 'DELIVERED';
            final isCancelled = order.status == 'CANCELLED';

            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => _showOrderDetailsSheet(order),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDelivered
                        ? MerchantConstants.successGreen.withValues(alpha: 0.25)
                        : (isCancelled
                            ? Colors.redAccent.withValues(alpha: 0.25)
                            : MerchantConstants.borderLight),
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x06000000),
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isDelivered
                            ? MerchantConstants.successGreen
                                .withValues(alpha: 0.12)
                            : (isCancelled
                                ? Colors.redAccent.withValues(alpha: 0.12)
                                : config.theme.primary.withValues(alpha: 0.12)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isDelivered
                            ? Icons.check_circle
                            : (isCancelled
                                ? Icons.cancel
                                : Icons.delivery_dining),
                        color: isDelivered
                            ? MerchantConstants.successGreen
                            : (isCancelled
                                ? Colors.redAccent
                                : config.theme.primary),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  'Kòmand #${order.orderNumber}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: MerchantConstants.textPrimary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: MerchantConstants.borderLight),
                                ),
                                child: Text(
                                  '${order.items.length} atik',
                                  style: const TextStyle(
                                      color: MerchantConstants.textSecondary, fontSize: 9, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${order.customerName} • ${DateFormat('dd MMM, HH:mm').format(order.createdAt)}',
                            style: const TextStyle(
                                color: MerchantConstants.textSecondary, fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 105),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${order.totalAmount.toInt()} HTG',
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              color: MerchantConstants.textPrimary,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            order.statusLabel,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isDelivered
                                  ? MerchantConstants.successGreen
                                  : (isCancelled
                                      ? Colors.redAccent
                                      : MerchantConstants.electricCyan),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.end,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right,
                        color: Color(0xFF94A3B8), size: 16),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildHistoryChip(String filterKey, String label, Color activeColor,
      {VoidCallback? onCustomTap}) {
    final isSelected = _historyFilter == filterKey;
    return GestureDetector(
      onTap: onCustomTap ?? () => setState(() => _historyFilter = filterKey),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? activeColor
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? activeColor
                : MerchantConstants.borderLight,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: activeColor.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : MerchantConstants.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.25), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 14),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: Color(0xFF334155),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w900,
                color: color,
                letterSpacing: -0.5,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNewOrderCard(MerchantOrder order, BusinessTypeConfig config) {
    final elapsedMinutes = DateTime.now().difference(order.createdAt).inMinutes;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: config.theme.primary.withValues(alpha: 0.35), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: config.theme.primary.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Ribbon: Order Number + Elapsed time + Payment
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: config.theme.primary.withValues(alpha: 0.05),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
              border: Border(bottom: BorderSide(color: config.theme.primary.withValues(alpha: 0.12))),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0A1628),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '#${order.orderNumber}',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: elapsedMinutes > 10
                        ? const Color(0xFFFEE2E2)
                        : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.timer_outlined,
                        size: 12,
                        color: elapsedMinutes > 10 ? const Color(0xFFDC2626) : const Color(0xFFD97706),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        elapsedMinutes <= 0 ? 'Fèk rive' : '$elapsedMinutes min pase',
                        style: TextStyle(
                          color: elapsedMinutes > 10 ? const Color(0xFFDC2626) : const Color(0xFFB45309),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                _buildPaymentBadge(order.paymentMethod),
                const SizedBox(width: 4),
                IconButton(
                  icon: const Icon(Icons.receipt_long_rounded, color: Color(0xFF64748B), size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  tooltip: 'Resi Detaye',
                  onPressed: () => _showOrderDetailsSheet(order),
                ),
              ],
            ),
          ),

          // Body: Customer Info + Total Amount
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: config.theme.primary.withValues(alpha: 0.12),
                      child: Text(
                        order.customerName.isNotEmpty ? order.customerName.substring(0, 1).toUpperCase() : 'K',
                        style: TextStyle(color: config.theme.primary, fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.customerName,
                            style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.w800, fontSize: 14.5),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                          if (order.customerPhone.isNotEmpty)
                            Row(
                              children: [
                                Text(order.customerPhone, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11.5)),
                                const SizedBox(width: 8),
                                InkWell(
                                  onTap: () => _makePhoneCall(order.customerPhone),
                                  borderRadius: BorderRadius.circular(4),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: MerchantConstants.successGreen.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.phone, size: 10, color: MerchantConstants.successGreen),
                                        SizedBox(width: 2),
                                        Text('Rele', style: TextStyle(color: MerchantConstants.successGreen, fontSize: 9.5, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                InkWell(
                                  onTap: () => _openWhatsApp(order.customerPhone, orderNumber: order.orderNumber, recipientName: order.customerName),
                                  borderRadius: BorderRadius.circular(4),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF25D366).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.chat_bubble_outline, size: 10, color: Color(0xFF25D366)),
                                        SizedBox(width: 2),
                                        Text('WhatsApp', style: TextStyle(color: Color(0xFF25D366), fontSize: 9.5, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE63946).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE63946).withValues(alpha: 0.25)),
                      ),
                      child: Text(
                        '${NumberFormat('#,###', 'fr_HT').format(order.totalAmount.toInt())} G',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          color: Color(0xFFE63946),
                        ),
                      ),
                    ),
                  ],
                ),

                const Divider(height: 20, color: Color(0xFFF1F5F9)),

                // Items list
                ...order.items.map((it) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: config.theme.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${it.quantity}x',
                          style: TextStyle(fontWeight: FontWeight.w900, color: config.theme.primary, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              it.name,
                              style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.w700, fontSize: 13.5),
                            ),
                            if (it.instructions != null && it.instructions!.isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFFDE68A)),
                                ),
                                child: Text(
                                  '📝 ${it.instructions}',
                                  style: const TextStyle(color: Color(0xFF92400E), fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ),
                          ],
                        ),
                      ),
                      Text(
                        '${NumberFormat('#,###', 'fr_HT').format((it.price * it.quantity).toInt())} G',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12.5, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                )),

                const SizedBox(height: 12),

                // Action buttons
                Row(
                  children: [
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        foregroundColor: Colors.redAccent,
                        side: const BorderSide(color: Color(0xFFFCA5A5)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.close_rounded, size: 16),
                      label: const Text('Refize', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      onPressed: () => _showRejectOrderDialog(order),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          backgroundColor: const Color(0xFFE63946),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 3,
                          shadowColor: const Color(0xFFE63946).withValues(alpha: 0.35),
                        ),
                        icon: const Icon(Icons.bolt_rounded, size: 18),
                        label: Text(
                          config.startPrepButtonLabel,
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.3),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onPressed: () => _showAcceptOrderModal(order),
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

  Widget _buildPreparingOrderCard(MerchantOrder order, BusinessTypeConfig config) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MerchantConstants.brandAmber.withValues(alpha: 0.5), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Ribbon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
              border: const Border(bottom: BorderSide(color: Color(0xFFFEF3C7))),
            ),
            child: Row(
              children: [
                Text(config.icon, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'Kòmand #${order.orderNumber}',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5, color: MerchantConstants.textPrimary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.timer_outlined, size: 13, color: Color(0xFFD97706)),
                      const SizedBox(width: 4),
                      Text(
                        '~${order.prepTimeMinutes ?? 20} min',
                        style: const TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  onTap: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    final ok = await ref.read(merchantOrdersProvider.notifier).extendPrepTime(order.id, 5);
                    if (mounted && ok) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('⏱️ +5 min ajoute sou kòmand #${order.orderNumber}'),
                          backgroundColor: Colors.amber[900],
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: const Text('+5m', style: TextStyle(color: MerchantConstants.textPrimary, fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 4),
                IconButton(
                  icon: const Icon(Icons.receipt_long_rounded, color: Color(0xFF64748B), size: 19),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  tooltip: 'Resi Detaye',
                  onPressed: () => _showOrderDetailsSheet(order),
                ),
              ],
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Kliyan: ${order.customerName}',
                        style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 13, fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (order.customerPhone.isNotEmpty) ...[
                      InkWell(
                        onTap: () => _makePhoneCall(order.customerPhone),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: MerchantConstants.successGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.phone, size: 11, color: MerchantConstants.successGreen),
                              SizedBox(width: 3),
                              Text('Rele', style: TextStyle(color: MerchantConstants.successGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      InkWell(
                        onTap: () => _openWhatsApp(order.customerPhone, orderNumber: order.orderNumber, recipientName: order.customerName),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF25D366).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble_outline, size: 11, color: Color(0xFF25D366)),
                              SizedBox(width: 3),
                              Text('WhatsApp', style: TextStyle(color: Color(0xFF25D366), fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const Divider(height: 18, color: Color(0xFFF1F5F9)),

                ...order.items.map((it) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text('${it.quantity}x', style: const TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.w900, fontSize: 11.5)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          it.name,
                          style: const TextStyle(color: MerchantConstants.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                )),

                const SizedBox(height: 14),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: MerchantConstants.successGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 3,
                      shadowColor: MerchantConstants.successGreen.withValues(alpha: 0.35),
                    ),
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 20),
                    label: Text(
                      config.readyButtonLabel,
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.4),
                    ),
                    onPressed: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      final ok = await ref.read(merchantOrdersProvider.notifier).markOrderReady(order.id);
                      if (mounted && ok) {
                        messenger.showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                                const SizedBox(width: 8),
                                Expanded(child: Text('Livrè a resevwa notifikasyon kòmand #${order.orderNumber} pare!')),
                              ],
                            ),
                            backgroundColor: Colors.green,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReadyOrderCard(MerchantOrder order, BusinessTypeConfig config) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MerchantConstants.successGreen.withValues(alpha: 0.5), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Ribbon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
              border: const Border(bottom: BorderSide(color: Color(0xFFDCFCE7))),
            ),
            child: Row(
              children: [
                const Text('📦', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'Kòmand #${order.orderNumber}',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5, color: MerchantConstants.textPrimary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: MerchantConstants.successGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'PARE POU LIVRÈ',
                    style: TextStyle(color: MerchantConstants.successGreen, fontWeight: FontWeight.w900, fontSize: 10.5),
                  ),
                ),
                const SizedBox(width: 6),
                IconButton(
                  icon: const Icon(Icons.receipt_long_rounded, color: Color(0xFF64748B), size: 19),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  tooltip: 'Resi Detaye',
                  onPressed: () => _showOrderDetailsSheet(order),
                ),
              ],
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Kliyan: ${order.customerName}',
                        style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 13, fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (order.customerPhone.isNotEmpty) ...[
                      InkWell(
                        onTap: () => _makePhoneCall(order.customerPhone),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: MerchantConstants.successGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.phone, size: 11, color: MerchantConstants.successGreen),
                              SizedBox(width: 3),
                              Text('Rele', style: TextStyle(color: MerchantConstants.successGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      InkWell(
                        onTap: () => _openWhatsApp(order.customerPhone, orderNumber: order.orderNumber, recipientName: order.customerName),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF25D366).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble_outline, size: 11, color: Color(0xFF25D366)),
                              SizedBox(width: 3),
                              Text('WhatsApp', style: TextStyle(color: Color(0xFF25D366), fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),

                // Driver Dispatch Box
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: MerchantConstants.brandAmber.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.two_wheeler_rounded, color: MerchantConstants.brandAmber, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.driverName ?? 'Chofè ap plase...',
                              style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.w800, fontSize: 13),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              order.driverPhone ?? config.driverArrivingMessage,
                              style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (order.driverPhone != null && order.driverPhone!.isNotEmpty) ...[
                        IconButton(
                          icon: const Icon(Icons.phone_rounded, color: MerchantConstants.successGreen, size: 20),
                          tooltip: 'Rele Chofè a',
                          onPressed: () => _makePhoneCall(order.driverPhone!),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366), size: 20),
                          tooltip: 'WhatsApp Chofè',
                          onPressed: () => _openWhatsApp(order.driverPhone!, orderNumber: order.orderNumber, recipientName: order.driverName),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentBadge(String paymentMethod) {
    if (paymentMethod == 'MONCASH') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFEE2E2),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: MerchantConstants.monCashRed.withValues(alpha: 0.3)),
        ),
        child: const Text('🔴 MonCash', style: TextStyle(color: MerchantConstants.monCashRed, fontSize: 11, fontWeight: FontWeight.w800)),
      );
    } else if (paymentMethod == 'NATCASH') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFDBEAFE),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: MerchantConstants.natCashBlue.withValues(alpha: 0.3)),
        ),
        child: const Text('🔵 Natcash', style: TextStyle(color: MerchantConstants.natCashBlue, fontSize: 11, fontWeight: FontWeight.w800)),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: MerchantConstants.successGreen.withValues(alpha: 0.3)),
      ),
      child: const Text('💵 Lajan Kach', style: TextStyle(color: MerchantConstants.successGreen, fontSize: 11, fontWeight: FontWeight.w800)),
    );
  }

  Widget _buildExecutiveKpiRibbon(
    BusinessTypeConfig config,
    int totalToday,
    int deliveredToday,
    double revenuToday,
    int activeOrdersCount,
    int readyCount,
  ) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
      child: Row(
        children: [
          // Card 1: Vant Jodi a (DLH Navy & Red)
          Expanded(
            flex: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                  width: 1.2,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VANT JODI A',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      Icon(Icons.trending_up_rounded, size: 14, color: Color(0xFFE63946)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${NumberFormat('#,###', 'fr_HT').format(revenuToday.toInt())} G',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.4,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$deliveredToday kòmand livre',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Card 2: Kòmand Aktif
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: activeOrdersCount > 0
                      ? const Color(0xFFE63946).withValues(alpha: 0.35)
                      : const Color(0xFFE2E8F0),
                  width: 1.2,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'AKTIF',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      Icon(
                        Icons.bolt_rounded,
                        size: 14,
                        color: activeOrdersCount > 0 ? const Color(0xFFE63946) : const Color(0xFF94A3B8),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$activeOrdersCount',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.4,
                      color: activeOrdersCount > 0 ? const Color(0xFFE63946) : const Color(0xFF1E293B),
                    ),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'An kou kounye a',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Card 3: Pare pou Chofè
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: readyCount > 0
                      ? const Color(0xFF00C853).withValues(alpha: 0.35)
                      : const Color(0xFFE2E8F0),
                  width: 1.2,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'PRE CHOFÈ',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                          color: Color(0xFF64748B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Icon(
                        Icons.two_wheeler_rounded,
                        size: 14,
                        color: readyCount > 0 ? const Color(0xFF00C853) : const Color(0xFF94A3B8),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$readyCount',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.4,
                      color: readyCount > 0 ? const Color(0xFF00C853) : const Color(0xFF1E293B),
                    ),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'K ap tann livrè',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
