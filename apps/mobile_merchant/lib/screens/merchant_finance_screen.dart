import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../config/constants.dart';
import '../providers/merchant_providers.dart';

class MerchantFinanceScreen extends ConsumerStatefulWidget {
  final bool showAppBar;
  const MerchantFinanceScreen({super.key, this.showAppBar = true});

  @override
  ConsumerState<MerchantFinanceScreen> createState() => _MerchantFinanceScreenState();
}

class _MerchantFinanceScreenState extends ConsumerState<MerchantFinanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _selectedDate = DateTime.now();
  String _selectedPeriod = 'JODI';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
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
        _selectedDate = picked;
        _selectedPeriod = 'DATE';
      });
    }
  }

  String _formatPeriodLabel() {
    if (_selectedPeriod == 'JODI') return 'Jodi a • ${DateFormat('d MMM yyyy').format(DateTime.now())}';
    if (_selectedPeriod == 'SEMÈN') return 'Semèn sa a';
    if (_selectedPeriod == 'MWA') return 'Mwa sa a';
    return DateFormat('EEEE, d MMMM yyyy').format(_selectedDate);
  }

  List<dynamic> _filterOrdersByPeriod(List orders) {
    final now = DateTime.now();
    return orders.where((order) {
      final dateStr = order['createdAt']?.toString() ?? '';
      if (dateStr.isEmpty) return false;
      final orderDate = DateTime.tryParse(dateStr);
      if (orderDate == null) return false;
      if (_selectedPeriod == 'JODI') {
        return orderDate.year == now.year && orderDate.month == now.month && orderDate.day == now.day;
      } else if (_selectedPeriod == 'SEMÈN') {
        final weekStart = now.subtract(Duration(days: now.weekday - 1));
        return orderDate.isAfter(weekStart.subtract(const Duration(days: 1)));
      } else if (_selectedPeriod == 'MWA') {
        return orderDate.year == now.year && orderDate.month == now.month;
      } else {
        return orderDate.year == _selectedDate.year &&
            orderDate.month == _selectedDate.month &&
            orderDate.day == _selectedDate.day;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final financeAsync = ref.watch(merchantFinanceProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: widget.showAppBar
          ? AppBar(
              title: const Text(
                '💰 Finans & Revni',
                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A), fontSize: 18),
              ),
              backgroundColor: Colors.white,
              elevation: 0,
              surfaceTintColor: Colors.transparent,
              actions: [
                IconButton(
                  icon: const Icon(Icons.calendar_month_rounded, color: MerchantConstants.brandOrange),
                  tooltip: 'Chwazi Dat',
                  onPressed: _pickDate,
                ),
                IconButton(
                  icon: const Icon(Icons.refresh_rounded, color: Color(0xFF0F172A)),
                  onPressed: () => ref.invalidate(merchantFinanceProvider),
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(56),
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  child: Container(
                    height: 42,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      indicator: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x14000000),
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      indicatorSize: TabBarIndicatorSize.tab,
                      dividerColor: Colors.transparent,
                      labelColor: MerchantConstants.brandOrange,
                      unselectedLabelColor: const Color(0xFF64748B),
                      labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      tabs: const [
                        Tab(text: 'Rezime Finans'),
                        Tab(text: 'Istorik Jounalye'),
                      ],
                    ),
                  ),
                ),
              ),
            )
          : null,
      body: financeAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: MerchantConstants.brandOrange),
        ),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
              const SizedBox(height: 14),
              Text('Erè: $err',
                  style: const TextStyle(color: MerchantConstants.textSecondary), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: MerchantConstants.brandOrange),
                onPressed: () => ref.invalidate(merchantFinanceProvider),
                child: const Text('Eseye Ankò', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
        data: (stats) {
          final double totalGross = (stats['totalGross'] as num?)?.toDouble() ?? 0.0;
          final double commissionRate = (stats['commissionRate'] as num?)?.toDouble() ?? 15.0;
          final double totalCommission = (stats['totalCommission'] as num?)?.toDouble() ?? 0.0;
          final double netPayout = (stats['netPayout'] as num?)?.toDouble() ?? 0.0;
          final int completedCount = (stats['completedCount'] as num?)?.toInt() ?? 0;
          final Map<String, dynamic> breakdown = stats['paymentBreakdown'] ?? {};
          final List orders = stats['orders'] ?? [];

          final double monCashTotal = (breakdown['MONCASH'] as num?)?.toDouble() ?? 0.0;
          final double natCashTotal = (breakdown['NATCASH'] as num?)?.toDouble() ?? 0.0;
          final double cashTotal = (breakdown['CASH_ON_DELIVERY'] as num?)?.toDouble() ?? 0.0;

          final filteredOrders = _filterOrdersByPeriod(orders);
          final double filteredGross = filteredOrders.fold(0.0, (sum, o) {
            final num v = o['subtotal'] ?? o['total'] ?? 0;
            return sum + v.toDouble();
          });
          final double filteredNet = filteredGross * (1 - commissionRate / 100);
          final int filteredDelivered =
              filteredOrders.where((o) => o['status'] == 'DELIVERED').length;
          final int filteredPending = filteredOrders
              .where((o) => ['PENDING', 'PREPARING', 'READY'].contains(o['status']?.toString()))
              .length;

          final fmt = NumberFormat('#,###', 'fr_HT');

          return TabBarView(
            controller: _tabController,
            children: [
              // ── TAB 1: REZIME FINANS ─────────────────────────────────
              RefreshIndicator(
                onRefresh: () async => ref.invalidate(merchantFinanceProvider),
                color: MerchantConstants.brandOrange,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildNetBanner(fmt, netPayout, completedCount),
                      const SizedBox(height: 14),

                      // 3 KPI Cards
                      Row(
                        children: [
                          _buildKpiCard('🟢 Livre', '$completedCount', const Color(0xFF059669)),
                          const SizedBox(width: 10),
                          _buildKpiCard(
                            '🔴 Anile',
                            '${orders.where((o) => o['status'] == 'CANCELLED').length}',
                            Colors.redAccent,
                          ),
                          const SizedBox(width: 10),
                          _buildKpiCard('⏳ Total', '${orders.length}', const Color(0xFFD97706)),
                        ],
                      ),
                      const SizedBox(height: 16),

                      _buildBreakdownCard(fmt, totalGross, commissionRate, totalCommission, netPayout),
                      const SizedBox(height: 20),

                      const Text(
                        'Distribisyon pa Mwayen Peman',
                        style: TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _buildPaymentTile('MonCash', '${fmt.format(monCashTotal.toInt())} HTG',
                              const Color(0xFFEF4444), '🔴'),
                          const SizedBox(width: 8),
                          _buildPaymentTile('Natcash', '${fmt.format(natCashTotal.toInt())} HTG',
                              const Color(0xFF3B82F6), '🔵'),
                          const SizedBox(width: 8),
                          _buildPaymentTile('Kach', '${fmt.format(cashTotal.toInt())} HTG',
                              MerchantConstants.successGreen, '💵'),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _buildPayoutCard(),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),

              // ── TAB 2: ISTORIK JOUNALYE ──────────────────────────────
              Column(
                children: [
                  _buildDateFilterBar(),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                    child: Row(
                      children: [
                        _buildMiniStat('Kòmand Total', '${filteredOrders.length}',
                            Icons.receipt_long_rounded, const Color(0xFF6366F1)),
                        const SizedBox(width: 8),
                        _buildMiniStat('Livre ✓', '$filteredDelivered',
                            Icons.check_circle_rounded, MerchantConstants.successGreen),
                        const SizedBox(width: 8),
                        _buildMiniStat('Annatant', '$filteredPending',
                            Icons.pending_rounded, MerchantConstants.brandOrange),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _buildPeriodRevenueBanner(fmt, filteredGross, filteredNet),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    child: Row(
                      children: [
                        const Icon(Icons.schedule_rounded, size: 13, color: MerchantConstants.textSecondary),
                        const SizedBox(width: 6),
                        Text(_formatPeriodLabel(),
                            style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12)),
                        const Spacer(),
                        Text('${filteredOrders.length} kòmand',
                            style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ),
                  Expanded(
                    child: filteredOrders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('📭', style: TextStyle(fontSize: 44)),
                                const SizedBox(height: 12),
                                Text(
                                  'Pa gen kòmand pou peryòd sa a',
                                  style: const TextStyle(color: MerchantConstants.textSecondary),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: filteredOrders.length,
                            separatorBuilder: (_, idx) => const SizedBox(height: 8),
                            itemBuilder: (ctx, i) =>
                                _buildOrderCard(filteredOrders[i], fmt, i),
                          ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDateFilterBar() {
    const periods = [
      ('JODI', '📅 Jodi a', Icons.wb_sunny_rounded),
      ('SEMÈN', 'Semèn', Icons.date_range_rounded),
      ('MWA', 'Mwa', Icons.calendar_month_rounded),
      ('DATE', 'Dat', Icons.edit_calendar_rounded),
    ];
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: periods.map((p) {
            final bool sel = _selectedPeriod == p.$1;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => p.$1 == 'DATE' ? _pickDate() : setState(() => _selectedPeriod = p.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: sel ? MerchantConstants.brandOrange : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: sel ? MerchantConstants.brandOrange : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Text(
                    p.$2,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: sel ? Colors.white : MerchantConstants.textSecondary,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 22),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 10, fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(value,
                      style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(label,
                      style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 9),
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodRevenueBanner(NumberFormat fmt, double gross, double net) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [
          MerchantConstants.brandOrange.withValues(alpha: 0.15),
          const Color(0xFF6366F1).withValues(alpha: 0.08),
        ]),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: MerchantConstants.brandOrange.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Vant Bwit', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 11)),
              Text('${fmt.format(gross.toInt())} HTG',
                  style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          ),
          Container(width: 1, height: 36, color: Colors.grey.withValues(alpha: 0.3)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('Nèt (15% komisyon)', style: TextStyle(color: MerchantConstants.textSecondary, fontSize: 11)),
              Text('${fmt.format(net.toInt())} HTG',
                  style: TextStyle(
                      color: MerchantConstants.successGreen,
                      fontWeight: FontWeight.bold,
                      fontSize: 18)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(dynamic order, NumberFormat fmt, int index) {
    final num total = order['subtotal'] ?? order['total'] ?? 0;
    final status = order['status']?.toString() ?? '';
    final payment = order['paymentMethod']?.toString() ?? 'CASH_ON_DELIVERY';
    final numOrd =
        order['orderNumber'] ?? order['id']?.toString().substring(0, 8) ?? '';
    final dateStr = order['createdAt']?.toString() ?? '';
    final dateFormatted = dateStr.isNotEmpty
        ? DateFormat('d MMM, HH:mm').format(DateTime.tryParse(dateStr) ?? DateTime.now())
        : '--:--';

    Color statusColor = Colors.grey;
    String statusLabel = status;
    IconData statusIcon = Icons.receipt_long;

    if (status == 'DELIVERED') {
      statusColor = MerchantConstants.successGreen;
      statusLabel = 'Livre ✓';
      statusIcon = Icons.check_circle_rounded;
    } else if (['PENDING', 'PREPARING'].contains(status)) {
      statusColor = MerchantConstants.brandOrange;
      statusLabel = status == 'PENDING' ? 'Annatant' : 'Ap Prepare';
      statusIcon = Icons.pending_rounded;
    } else if (status == 'READY') {
      statusColor = const Color(0xFF6366F1);
      statusLabel = 'Prè pou Pran';
      statusIcon = Icons.restaurant_rounded;
    }

    String payLabel = '💵 Kach';
    if (payment == 'MONCASH') payLabel = '🔴 MonCash';
    if (payment == 'NATCASH') payLabel = '🔵 Natcash';

    // Alternance de fond
    final rowBg = index.isEven ? Colors.white : const Color(0xFFFAFAFB);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: rowBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
        boxShadow: const [
          BoxShadow(color: Color(0x05000000), blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(statusIcon, color: statusColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('#$numOrd',
                    style: const TextStyle(
                        color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 3),
                Text('$dateFormatted  •  $payLabel',
                    style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${fmt.format(total.toInt())} G',
                  style: TextStyle(
                      color: status == 'DELIVERED'
                          ? MerchantConstants.successGreen
                          : MerchantConstants.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 14)),
              const SizedBox(height: 3),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(statusLabel,
                    style: TextStyle(
                        color: statusColor, fontSize: 9, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNetBanner(NumberFormat fmt, double net, int count) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
            colors: [Color(0xFF059669), Color(0xFF047857)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: const Color(0xFF059669).withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('REVNI NET',
                  style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration:
                    BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(20)),
                child: Text('$count kòmand livre',
                    style: const TextStyle(
                        color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text('${fmt.format(net.toInt())} HTG',
              style: const TextStyle(
                  fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Vireman otomatik chak semèn • 15% komisyon dedwi',
              style: TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildBreakdownCard(
      NumberFormat fmt, double gross, double rate, double commission, double net) {
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: MerchantConstants.borderLight),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _row('Total Vant Bwit (Gross)', '${fmt.format(gross.toInt())} HTG', MerchantConstants.textPrimary),
            const Divider(height: 20, color: MerchantConstants.borderLight),
            _row('Komisyon Platfòm (${rate.toInt()}%)',
                '-${fmt.format(commission.toInt())} HTG', Colors.redAccent),
            const Divider(height: 20, color: MerchantConstants.borderLight),
            _row('Total Nèt Restoran', '${fmt.format(net.toInt())} HTG',
                MerchantConstants.successGreen,
                bold: true),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value, Color color, {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(label,
              style: TextStyle(
                  color: MerchantConstants.textSecondary,
                  fontSize: 13,
                  fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
        ),
        Text(value,
            style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: bold ? FontWeight.bold : FontWeight.w600)),
      ],
    );
  }

  Widget _buildPaymentTile(String label, String amount, Color color, String emoji) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 11)),
            const SizedBox(height: 4),
            Text(amount,
                style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildPayoutCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: MerchantConstants.borderLight)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Kont pou Resevwa Peman',
              style:
                  TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: MerchantConstants.textPrimary)),
          const SizedBox(height: 12),
          _payoutRow('🏦', 'Sogebank Haïti (Kont Kouran)',
              'Kont: 261-0094-**** (Kay Fritay Lakay)'),
          const Divider(height: 24, color: MerchantConstants.borderLight),
          _payoutRow('📲', 'MonCash Biznis', '+509 37 00 0003 (Verifye)'),
        ],
      ),
    );
  }

  Widget _payoutRow(String emoji, String title, String subtitle) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
          child: Text(emoji, style: const TextStyle(fontSize: 22)),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: MerchantConstants.textPrimary)),
              Text(subtitle, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12)),
            ],
          ),
        ),
        const Icon(Icons.check_circle, color: MerchantConstants.successGreen, size: 20),
      ],
    );
  }
}
