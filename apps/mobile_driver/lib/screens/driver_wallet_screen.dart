import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../config/constants.dart';
import '../providers/driver_providers.dart';

class DriverWalletScreen extends ConsumerStatefulWidget {
  const DriverWalletScreen({super.key});

  @override
  ConsumerState<DriverWalletScreen> createState() => _DriverWalletScreenState();
}

class _DriverWalletScreenState extends ConsumerState<DriverWalletScreen>
    with SingleTickerProviderStateMixin {
  double availableBalance = 6635.0;
  double cashCollectedCod = 2850.0;
  double todayEarnings = 3450.0;
  int todayCourses = 9;
  String selectedFilter = 'TOUT'; // TOUT, KOUS, RETRE, BONIS

  late TabController _tabController;
  DateTime _historyDate = DateTime.now();
  String _historyPeriod = 'JODI'; // JODI, SEMÈN, MWA, DATE

  // Transaction demo data
  final List<Map<String, dynamic>> _transactions = [
    {
      'id': 'TX-9021',
      'title': 'Kous Livwe • Restoran Lakay Fritay',
      'type': 'RIDE',
      'amount': 350.0,
      'isCredit': true,
      'time': 'Jodi a, 18:40',
      'method': 'Bous Dijital',
      'customer': 'Wilson Dorilas (Santvil)',
      'distance': '3.2 km',
      'tip': 50.0,
    },
    {
      'id': 'TX-9020',
      'title': 'Kous Livwe • Pizza Real Okap',
      'type': 'RIDE',
      'amount': 450.0,
      'isCredit': true,
      'time': 'Jodi a, 16:15',
      'method': 'Bous Dijital',
      'customer': 'Marie Rose (Boulevard)',
      'distance': '4.1 km',
      'tip': 100.0,
    },
    {
      'id': 'TX-9018',
      'title': 'Retrè Enstantane sou MonCash',
      'type': 'WITHDRAW',
      'amount': -2500.0,
      'isCredit': false,
      'time': 'Jodi a, 13:05',
      'method': 'MonCash (3700-0005)',
      'customer': 'Transfè Chofè',
      'distance': null,
      'tip': null,
    },
    {
      'id': 'TX-9015',
      'title': 'Bonis Zòn Cho (Boulevard Peak Hours)',
      'type': 'BONUS',
      'amount': 200.0,
      'isCredit': true,
      'time': 'Jodi a, 12:30',
      'method': 'Bonis Pwomosyon',
      'customer': 'Delivery Haïti Dispatch',
      'distance': null,
      'tip': null,
    },
    {
      'id': 'TX-9010',
      'title': 'Kous Livwe • Chez Marie Diri & Pwa',
      'type': 'RIDE',
      'amount': 300.0,
      'isCredit': true,
      'time': 'Jodi a, 10:45',
      'method': 'Kach sou Livrezon (COD)',
      'customer': 'Jean Baptiste (Carénage)',
      'distance': '2.8 km',
      'tip': 0.0,
    },
    {
      'id': 'TX-8998',
      'title': 'Remèt Lajan Kach Kolekte bay Sant lan',
      'type': 'REMIT',
      'amount': -1500.0,
      'isCredit': false,
      'time': 'Yè, 20:10',
      'method': 'Natcash Peman Santral',
      'customer': 'Bous Delivery Haïti',
      'distance': null,
      'tip': null,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadRealOrders());
  }

  Future<void> _loadRealOrders() async {
    final profile = ref.read(currentDriverProfileProvider);
    final driverId = profile?.id ?? '217712d7-1f9a-49cc-b1b4-50b163fa22a6';
    final api = ref.read(driverApiProvider);
    final orders = await api.getDriverCompletedOrders(driverId);

    if (mounted && orders.isNotEmpty) {
      final List<Map<String, dynamic>> converted = [];
      for (final ord in orders) {
        final ordNum = ord['orderNumber'] ?? 'HT-2026';
        final fee = (ord['deliveryFee'] as num?)?.toDouble() ?? 150.0;
        final total = (ord['total'] as num?)?.toDouble() ?? 0.0;
        final merchant = ord['merchant']?['name'] ?? 'Rosie Boutique';
        final customer = '${ord['customer']?['firstName'] ?? ''} ${ord['customer']?['lastName'] ?? ''}'.trim();
        final pMethod = ord['paymentMethod'] ?? 'MONCASH';
        final rawDate = ord['createdAt'];
        String timeStr = 'Dènyèman';
        if (rawDate != null) {
          try {
            final dt = DateTime.parse(rawDate).toLocal();
            timeStr = DateFormat('d MMM, HH:mm').format(dt);
          } catch (_) {}
        }

        converted.add({
          'id': ordNum,
          'title': 'Kous Livwe • $merchant',
          'type': 'RIDE',
          'amount': fee,
          'isCredit': true,
          'time': timeStr,
          'method': pMethod == 'CASH_ON_DELIVERY' ? 'Kach sou Livrezon (COD)' : pMethod,
          'customer': customer.isNotEmpty ? customer : 'Kliyan Delivery Haïti',
          'distance': '3.2 km',
          'tip': 0.0,
          'orderTotal': total,
        });
      }

      setState(() {
        _transactions.clear();
        _transactions.addAll(converted);
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _pickHistoryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _historyDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: ThemeData.light().copyWith(
          colorScheme: const ColorScheme.light(
            primary: DriverConstants.primaryCrimson,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() { _historyDate = picked; _historyPeriod = 'DATE'; });
  }

  String _historyLabel() {
    if (_historyPeriod == 'JODI') return 'Jodi a • ${DateFormat('d MMM yyyy').format(DateTime.now())}';
    if (_historyPeriod == 'SEMÈN') return 'Semèn sa a';
    if (_historyPeriod == 'MWA') return 'Mwa sa a';
    return DateFormat('EEEE, d MMMM yyyy').format(_historyDate);
  }

  List<Map<String, dynamic>> _filteredByDate() {
    return _transactions.where((tx) {
      // Demo data uses 'Jodi a' / 'Yè' as time labels — filter on those
      final time = tx['time']?.toString() ?? '';
      final now = DateTime.now();
      if (_historyPeriod == 'JODI') return time.startsWith('Jodi a');
      if (_historyPeriod == 'SEMÈN') return !time.startsWith('Il y a');
      if (_historyPeriod == 'MWA') return true;
      // For a specific date: compare formatted date label
      final dateLabel = DateFormat('d MMM yyyy').format(_historyDate);
      final todayLabel = DateFormat('d MMM yyyy').format(now);
      if (dateLabel == todayLabel) return time.startsWith('Jodi a');
      final yesterday = now.subtract(const Duration(days: 1));
      final yLabel = DateFormat('d MMM yyyy').format(yesterday);
      if (dateLabel == yLabel) return time.startsWith('Yè');
      return false;
    }).toList();
  }

  void _showWithdrawModal() {
    final profile = ref.read(currentDriverProfileProvider);
    final rawPhone = (profile != null && profile.phoneNumber.isNotEmpty)
        ? profile.phoneNumber.replaceAll('+509', '').trim()
        : '40553636';
    final amountController = TextEditingController(text: '2000');
    final phoneController = TextEditingController(text: rawPhone);
    String walletType = 'MONCASH';
    final presetAmounts = [500.0, 1000.0, 2000.0, 5000.0];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 20)],
          ),
          padding: EdgeInsets.only(
            left: 22,
            right: 22,
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
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Retire Lajan sou Bous Ou',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: DriverConstants.textDark,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: DriverConstants.primaryCrimson.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${availableBalance.toInt()} G',
                      style: const TextStyle(
                        color: DriverConstants.primaryCrimson,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Transfè a fèt enstantaneman sou telefòn ou san okenn frè kache.',
                style: TextStyle(color: DriverConstants.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 18),

              // Chwa MonCash oswa Natcash
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setModalState(() => walletType = 'MONCASH'),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                        decoration: BoxDecoration(
                          color: walletType == 'MONCASH'
                              ? DriverConstants.monCashRed.withValues(alpha: 0.1)
                              : const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: walletType == 'MONCASH'
                                ? DriverConstants.monCashRed
                                : DriverConstants.borderLight,
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: DriverConstants.monCashRed,
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Text('M', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'MonCash',
                              style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => setModalState(() => walletType = 'NATCASH'),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                        decoration: BoxDecoration(
                          color: walletType == 'NATCASH'
                              ? DriverConstants.natcashBlue.withValues(alpha: 0.1)
                              : const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: walletType == 'NATCASH'
                                ? DriverConstants.natcashBlue
                                : DriverConstants.borderLight,
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: DriverConstants.natcashBlue,
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Text('N', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Natcash',
                              style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),
              const Text('Chwazi Montan an', style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 10),

              // Chips Montan rapid
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ...presetAmounts.map((amt) {
                      final isSelected = amountController.text == amt.toInt().toString();
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text('${amt.toInt()} G'),
                          selected: isSelected,
                          selectedColor: DriverConstants.primaryCrimson,
                          backgroundColor: const Color(0xFFF1F5F9),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : DriverConstants.textDark,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (_) => setModalState(() {
                            amountController.text = amt.toInt().toString();
                          }),
                        ),
                      );
                    }),
                    ChoiceChip(
                      label: const Text('Tout Balans lan'),
                      selected: amountController.text == availableBalance.toInt().toString(),
                      selectedColor: DriverConstants.primaryCrimson,
                      backgroundColor: const Color(0xFFF1F5F9),
                      labelStyle: TextStyle(
                        color: amountController.text == availableBalance.toInt().toString() ? Colors.white : DriverConstants.textDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      onSelected: (_) => setModalState(() {
                        amountController.text = availableBalance.toInt().toString();
                      }),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 18),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.attach_money, color: DriverConstants.primaryCrimson),
                  suffixText: 'HTG',
                  suffixStyle: const TextStyle(color: DriverConstants.textMuted, fontWeight: FontWeight.bold),
                  labelText: 'Montan ou vle retire',
                  labelStyle: const TextStyle(color: DriverConstants.textMuted),
                  filled: true,
                  fillColor: const Color(0xFFF8F9FA),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),

              const SizedBox(height: 14),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  prefixText: '+509 ',
                  prefixStyle: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold),
                  prefixIcon: const Icon(Icons.phone_iphone, color: DriverConstants.textMuted),
                  labelText: 'Nimewo Telefòn Resevwa a',
                  labelStyle: const TextStyle(color: DriverConstants.textMuted),
                  filled: true,
                  fillColor: const Color(0xFFF8F9FA),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),

              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: DriverConstants.primaryCrimson,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () {
                    final amount = double.tryParse(amountController.text) ?? 0;
                    if (amount <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tanpri antre yon montan valab.')),
                      );
                      return;
                    }
                    if (amount > availableBalance) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Montan sa depase lajan ki disponib sou bous ou an.')),
                      );
                      return;
                    }

                    setState(() {
                      availableBalance -= amount;
                      _transactions.insert(0, {
                        'id': 'TX-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
                        'title': 'Retrè Enstantane sou $walletType',
                        'type': 'WITHDRAW',
                        'amount': -amount,
                        'isCredit': false,
                        'time': 'Kounye a',
                        'method': '$walletType (+509 ${phoneController.text})',
                        'customer': 'Transfè Chofè',
                        'distance': null,
                        'tip': null,
                      });
                    });

                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.white),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text('✅ Transfè ${amount.toInt()} HTG voye sou $walletType avèk siksè!'),
                            ),
                          ],
                        ),
                        backgroundColor: DriverConstants.neonGreen,
                        duration: const Duration(seconds: 4),
                      ),
                    );
                  },
                  child: const Text(
                    'KONFIME RETRÈ A KOUNYE A',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRemitCashModal() {
    final remitAmountController = TextEditingController(text: cashCollectedCod.toInt().toString());
    String remitMethod = 'MONCASH';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 20)],
          ),
          padding: EdgeInsets.only(
            left: 22,
            right: 22,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2))),
              ),
              const SizedBox(height: 18),
              const Row(
                children: [
                  Text('💵', style: TextStyle(fontSize: 22)),
                  SizedBox(width: 8),
                  Text(
                    'Remèt Lajan Kach Kolekte (COD)',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: DriverConstants.textDark),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Lè ou livre kòmand ki peye kach, ou dwe remèt montan kòmand lan bay platfòm lan.',
                style: TextStyle(color: DriverConstants.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFCD34D)),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text('Total Kach pou Remèt:', style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${cashCollectedCod.toInt()} HTG',
                      style: const TextStyle(color: Color(0xFFB45309), fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setModalState(() => remitMethod = 'MONCASH'),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: remitMethod == 'MONCASH' ? DriverConstants.monCashRed.withValues(alpha: 0.1) : const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: remitMethod == 'MONCASH' ? DriverConstants.monCashRed : DriverConstants.borderLight),
                        ),
                        child: const Center(
                          child: Text('Peye ak MonCash', style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => setModalState(() => remitMethod = 'NATCASH'),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: remitMethod == 'NATCASH' ? DriverConstants.natcashBlue.withValues(alpha: 0.1) : const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: remitMethod == 'NATCASH' ? DriverConstants.natcashBlue : DriverConstants.borderLight),
                        ),
                        child: const Center(
                          child: Text('Peye ak Natcash', style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              TextField(
                controller: remitAmountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'Montan w ap remèt kounye a',
                  labelStyle: const TextStyle(color: DriverConstants.textMuted),
                  suffixText: 'HTG',
                  suffixStyle: const TextStyle(color: DriverConstants.textMuted, fontWeight: FontWeight.bold),
                  filled: true,
                  fillColor: const Color(0xFFF8F9FA),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF191919),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () {
                    final remitAmt = double.tryParse(remitAmountController.text) ?? 0;
                    if (remitAmt <= 0) return;

                    setState(() {
                      cashCollectedCod = (cashCollectedCod - remitAmt).clamp(0, 999999);
                      _transactions.insert(0, {
                        'id': 'TX-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
                        'title': 'Remèt Lajan Kach bay Biwo a ($remitMethod)',
                        'type': 'REMIT',
                        'amount': -remitAmt,
                        'isCredit': false,
                        'time': 'Kounye a',
                        'method': '$remitMethod Depo Santral',
                        'customer': 'Delivery Haïti Baz',
                        'distance': null,
                        'tip': null,
                      });
                    });

                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('✅ Remèt $remitAmt HTG anrejistre avèk siksè!'),
                        backgroundColor: DriverConstants.neonGreen,
                      ),
                    );
                  },
                  child: const Text('REMET LAJAN AN KOUNYE A', style: TextStyle(fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showTransactionDetails(Map<String, dynamic> tx) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 20)],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: Text(
                    tx['id'],
                    style: const TextStyle(color: DriverConstants.textMuted, fontSize: 13, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: tx['isCredit']
                        ? DriverConstants.neonGreen.withValues(alpha: 0.12)
                        : Colors.orange.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    tx['isCredit'] ? 'KREDI' : 'DEBI',
                    style: TextStyle(
                      color: tx['isCredit'] ? DriverConstants.neonGreen : Colors.orange[800],
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              tx['title'],
              style: const TextStyle(color: DriverConstants.textDark, fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 4),
            Text(
              '${(tx['amount'] as double) > 0 ? '+' : ''}${(tx['amount'] as double).toInt()} HTG',
              style: TextStyle(
                color: tx['isCredit'] ? DriverConstants.neonGreen : DriverConstants.textDark,
                fontSize: 28,
                fontWeight: FontWeight.w900,
              ),
            ),
            const Divider(color: DriverConstants.borderLight, height: 28),

            _buildDetailRow('Lè / Dat', tx['time']),
            _buildDetailRow('Mwayen Peman', tx['method']),
            _buildDetailRow('Kliyan / Destinasyon', tx['customer']),
            if (tx['distance'] != null) _buildDetailRow('Distans', tx['distance']),
            if (tx['tip'] != null && (tx['tip'] as double) > 0)
              _buildDetailRow('Pourbwa Kliyan', '+${(tx['tip'] as double).toInt()} HTG'),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(ctx),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: DriverConstants.borderLight),
                  foregroundColor: DriverConstants.textDark,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Fèmen Resi a'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: DriverConstants.textMuted, fontSize: 13)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 13),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              maxLines: 2,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(currentDriverProfileProvider);
    if (profile != null) {
      availableBalance = profile.walletBalance;
    }

    final filteredList = _transactions.where((tx) {
      if (selectedFilter == 'TOUT') return true;
      if (selectedFilter == 'KOUS') return tx['type'] == 'RIDE';
      if (selectedFilter == 'RETRE') return tx['type'] == 'WITHDRAW';
      if (selectedFilter == 'BONIS') return tx['type'] == 'BONUS';
      return true;
    }).toList();

    final historyList = _filteredByDate();
    final historyEarnings = historyList
        .where((t) => t['isCredit'] == true)
        .fold(0.0, (s, t) => s + (t['amount'] as double));
    final historyTrips = historyList.where((t) => t['type'] == 'RIDE').length;
    final historyBonus = historyList
        .where((t) => t['type'] == 'BONUS')
        .fold(0.0, (s, t) => s + (t['amount'] as double));
    final historyWithdrawn = historyList
        .where((t) => t['type'] == 'WITHDRAW')
        .fold(0.0, (s, t) => s + (t['amount'] as double)).abs();

    return Scaffold(
      backgroundColor: DriverConstants.backgroundLight,
      appBar: AppBar(
        title: const Text('Bous & Revni Chofè a',
            style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: DriverConstants.textDark),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_rounded, color: DriverConstants.primaryCrimson),
            tooltip: 'Chwazi Dat',
            onPressed: _pickHistoryDate,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: DriverConstants.primaryCrimson,
          indicatorWeight: 3,
          labelColor: DriverConstants.primaryCrimson,
          unselectedLabelColor: DriverConstants.textMuted,
          tabs: const [
            Tab(text: 'Bous & Retrete'),
            Tab(text: 'Istorik Jounalye'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ═══ TAB 1: BOUS & RETRÈ ══════════════════════════════════
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
            // ─── 1. HERO CARD SOLDE CHOFÈ PRO (DOORDASH CRIMSON GRADIENT) ───
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: DriverConstants.primaryGradient,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(color: DriverConstants.primaryCrimson.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'SOLDE DISPONIB POU W RETIRE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black26,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('⚡', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '${availableBalance.toInt()} HTG',
                    style: const TextStyle(
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _showWithdrawModal,
                          icon: const Icon(Icons.arrow_upward_rounded, size: 18),
                          label: const Text('Retire sou MonCash / Natcash', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: DriverConstants.primaryCrimson,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ─── 2. CARTE DOUBLE STATS DU JOUR (WHITE CARDS) ───────
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: DriverConstants.borderLight),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 3)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('🏍️ Kous Jodi a', style: TextStyle(color: DriverConstants.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: DriverConstants.neonGreen.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                              child: const Text('Top 10%', style: TextStyle(color: DriverConstants.neonGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('$todayCourses kous', style: const TextStyle(color: DriverConstants.textDark, fontSize: 22, fontWeight: FontWeight.w900)),
                        const SizedBox(height: 2),
                        Text('${todayEarnings.toInt()} HTG fè jodi a', style: const TextStyle(color: DriverConstants.primaryCrimson, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: _showRemitCashModal,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 3)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('💵 Kach COD', style: TextStyle(color: Color(0xFFB45309), fontSize: 12, fontWeight: FontWeight.bold)),
                              Icon(Icons.touch_app, color: Color(0xFFB45309), size: 14),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('${cashCollectedCod.toInt()} HTG', style: const TextStyle(color: Color(0xFFB45309), fontSize: 20, fontWeight: FontWeight.w900)),
                          const SizedBox(height: 2),
                          const Text('Klike pou remèt bay baz', style: TextStyle(color: DriverConstants.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // ─── 3. FILTRES TRANSAKSYON YO ────────────────────────────
            Row(
              children: [
                const Text('Istorik', style: TextStyle(color: DriverConstants.textDark, fontSize: 16, fontWeight: FontWeight.w900)),
                const SizedBox(width: 8),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('Tout', 'TOUT'),
                        _buildFilterChip('Kous', 'KOUS'),
                        _buildFilterChip('Retrè', 'RETRE'),
                        _buildFilterChip('Bonis', 'BONIS'),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // ─── 4. LIS TRANSAKSYON YO (PURE WHITE CONTAINER) ─────────
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: DriverConstants.borderLight),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 3)),
                ],
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.all(8),
                itemCount: filteredList.length,
                separatorBuilder: (context, index) => const Divider(color: DriverConstants.borderLight, height: 1),
                itemBuilder: (ctx, index) {
                  final tx = filteredList[index];
                  final isCredit = tx['isCredit'] as bool;
                  final amount = tx['amount'] as double;

                  return InkWell(
                    onTap: () => _showTransactionDetails(tx),
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: isCredit
                                  ? (tx['type'] == 'BONUS' ? const Color(0xFFFEF3C7) : DriverConstants.primaryCrimson.withValues(alpha: 0.1))
                                  : (tx['type'] == 'REMIT' ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9)),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Center(
                              child: Icon(
                                isCredit
                                    ? (tx['type'] == 'BONUS' ? Icons.stars : Icons.delivery_dining)
                                    : (tx['type'] == 'REMIT' ? Icons.price_check : Icons.arrow_outward_rounded),
                                color: isCredit
                                    ? (tx['type'] == 'BONUS' ? const Color(0xFFD97706) : DriverConstants.primaryCrimson)
                                    : (tx['type'] == 'REMIT' ? const Color(0xFFD97706) : const Color(0xFF64748B)),
                                size: 22,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tx['title'],
                                  style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 13),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  '${tx['time']} • ${tx['method']}',
                                  style: const TextStyle(color: DriverConstants.textMuted, fontSize: 11),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${isCredit ? "+" : ""}${amount.toInt()} G',
                                    style: TextStyle(
                                      color: isCredit
                                          ? DriverConstants.primaryCrimson
                                          : DriverConstants.textDark,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 14,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                tx['id'],
                                style: const TextStyle(color: DriverConstants.textMuted, fontSize: 10),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
          ),

          // ═══ TAB 2: ISTORIK JOUNALYE ══════════════════════════════
          Column(
            children: [
              // Date filter bar
              Container(
                color: const Color(0xFFF1F5F9),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    ('JODI', 'Jodi a', Icons.wb_sunny_rounded),
                    ('SEMÈN', 'Semèn', Icons.date_range_rounded),
                    ('MWA', 'Mwa', Icons.calendar_month_rounded),
                    ('DATE', 'Dat Presi', Icons.edit_calendar_rounded),
                  ].map((p) {
                    final bool sel = _historyPeriod == p.$1;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => p.$1 == 'DATE'
                            ? _pickHistoryDate()
                            : setState(() => _historyPeriod = p.$1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: sel ? DriverConstants.primaryCrimson : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: sel ? DriverConstants.primaryCrimson : DriverConstants.borderLight),
                          ),
                          child: Column(
                            children: [
                              Icon(p.$3,
                                  size: 14,
                                  color: sel ? Colors.white : DriverConstants.textMuted),
                              const SizedBox(height: 3),
                              Text(p.$2,
                                  style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: sel ? Colors.white : DriverConstants.textMuted),
                                  textAlign: TextAlign.center),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              // 4 explicit mini stats
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
                child: Row(
                  children: [
                    _driverMiniStat('Kous', '$historyTrips',
                        Icons.delivery_dining, DriverConstants.primaryCrimson),
                    const SizedBox(width: 8),
                    _driverMiniStat('Revni', '${historyEarnings.toInt()} G',
                        Icons.attach_money, DriverConstants.neonGreen),
                    const SizedBox(width: 8),
                    _driverMiniStat('Bonis', '${historyBonus.toInt()} G',
                        Icons.stars_rounded, const Color(0xFFD97706)),
                    const SizedBox(width: 8),
                    _driverMiniStat('Retire', '${historyWithdrawn.toInt()} G',
                        Icons.arrow_upward_rounded, const Color(0xFF6366F1)),
                  ],
                ),
              ),

              // Period label
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                child: Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 13, color: DriverConstants.textMuted),
                    const SizedBox(width: 6),
                    Text(_historyLabel(),
                        style: const TextStyle(color: DriverConstants.textMuted, fontSize: 12)),
                    const Spacer(),
                    Text('${historyList.length} transaksyon',
                        style: const TextStyle(color: DriverConstants.textMuted, fontSize: 12)),
                  ],
                ),
              ),

              // Transaction list
              Expanded(
                child: historyList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('📭', style: TextStyle(fontSize: 44)),
                            const SizedBox(height: 10),
                            Text(
                              'Pa gen transaksyon pou ${_historyLabel()}',
                              style: const TextStyle(color: DriverConstants.textMuted),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
                        itemCount: historyList.length,
                        separatorBuilder: (_, idx) => const SizedBox(height: 8),
                        itemBuilder: (ctx, i) {
                          final tx = historyList[i];
                          final bool isCredit = tx['isCredit'] as bool;
                          final double amount = tx['amount'] as double;
                          return InkWell(
                            onTap: () => _showTransactionDetails(tx),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: DriverConstants.borderLight),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: isCredit
                                          ? DriverConstants.primaryCrimson.withValues(alpha: 0.1)
                                          : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      tx['type'] == 'RIDE'
                                          ? Icons.delivery_dining
                                          : tx['type'] == 'BONUS'
                                              ? Icons.stars_rounded
                                              : tx['type'] == 'WITHDRAW'
                                                  ? Icons.arrow_upward_rounded
                                                  : Icons.price_check,
                                      color: isCredit
                                          ? DriverConstants.primaryCrimson
                                          : DriverConstants.textMuted,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(tx['title'],
                                            style: const TextStyle(
                                                color: DriverConstants.textDark,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 3),
                                        Text('${tx['time']} • ${tx['method']}',
                                            style: const TextStyle(
                                                color: DriverConstants.textMuted, fontSize: 11),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '${isCredit ? '+' : ''}${amount.toInt()} G',
                                    style: TextStyle(
                                        color: isCredit
                                            ? DriverConstants.primaryCrimson
                                            : DriverConstants.textDark,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String key) {
    final isSelected = selectedFilter == key;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: InkWell(
        onTap: () => setState(() => selectedFilter = key),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isSelected ? DriverConstants.primaryCrimson : const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : DriverConstants.textDark,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _driverMiniStat(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 14)),
            Text(label,
                style: const TextStyle(color: DriverConstants.textMuted, fontSize: 9),
                overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
