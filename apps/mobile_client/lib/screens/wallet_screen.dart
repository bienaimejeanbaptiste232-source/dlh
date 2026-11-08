import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/constants.dart';
import '../services/supabase_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen>
    with SingleTickerProviderStateMixin {
  final _service = SupabaseService();
  double balance = 0.0;
  bool isLoading = true;
  bool isBalanceHidden = false;
  Map<String, dynamic>? userProfile;

  // Selected sub-tab: 0 = Rechaj Rapid, 1 = Istorik Tranzaksyon
  int selectedMainTab = 0;

  // Recharge State
  final List<double> presetAmounts = [100, 250, 500, 1000, 2500, 5000];
  double selectedAmount = 500;
  String selectedMethod = 'MONCASH'; // 'MONCASH', 'NATCASH'
  final TextEditingController _customAmountCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  bool isCustomAmount = false;
  bool isProcessingTopUp = false;

  // Transaction History State
  List<Map<String, dynamic>> transactions = [];
  String txFilter = 'ALL'; // 'ALL', 'CREDIT', 'DEBIT', 'REFUND'
  String txSearchQuery = '';
  final TextEditingController _txSearchCtrl = TextEditingController();

  // Exchange rate estimate (1 USD ≈ 131.50 HTG)
  final double htgToUsdRate = 131.50;

  @override
  void initState() {
    super.initState();
    _loadWalletData();
  }

  @override
  void dispose() {
    _customAmountCtrl.dispose();
    _phoneCtrl.dispose();
    _txSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadWalletData() async {
    setState(() => isLoading = true);
    try {
      final profile = await _service.getUserProfile();
      final txList = await _service.getWalletTransactions();

      if (mounted) {
        setState(() {
          userProfile = profile;
          if (profile != null) {
            final w = profile['wallets'];
            if (w != null) {
              balance = (w['balance'] as num?)?.toDouble() ?? 0.0;
            } else if (profile['walletBalance'] != null) {
              balance = (profile['walletBalance'] as num?)?.toDouble() ?? 0.0;
            }
            if (_phoneCtrl.text.isEmpty && profile['phone'] != null) {
              _phoneCtrl.text = profile['phone'].toString().replaceAll('+509', '').trim();
            }
          }
          transactions = txList;
          isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => isLoading = false);
    }
  }

  String _formatHtg(double amount) {
    final parts = amount.toStringAsFixed(0).split('');
    final buffer = StringBuffer();
    for (int i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(parts[i]);
    }
    return buffer.toString();
  }

  // ─── TOP UP CONFIRMATION & EXECUTION ─────────────────────────────────────
  Future<void> _handleTopUp() async {
    HapticFeedback.mediumImpact();
    final amount = isCustomAmount
        ? (double.tryParse(_customAmountCtrl.text.trim()) ?? selectedAmount)
        : selectedAmount;

    if (amount < 25) {
      _showToast('Montan minimòm pou rechaje se 25 HTG', isError: true);
      return;
    }

    final methodLabel = selectedMethod == 'MONCASH' ? 'MonCash' : 'Natcash';
    final operatorColor = selectedMethod == 'MONCASH'
        ? AppConstants.monCashRed
        : AppConstants.natcashBlue;
    final phone = _phoneCtrl.text.trim().replaceAll(' ', '');

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 18,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [
            BoxShadow(color: Color(0x2A000000), blurRadius: 28, offset: Offset(0, -6)),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              const SizedBox(height: 18),

              // Header
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: operatorColor.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(color: operatorColor.withValues(alpha: 0.3)),
                    ),
                    child: Center(
                      child: Text(
                        selectedMethod == 'MONCASH' ? 'M' : 'N',
                        style: TextStyle(
                          color: operatorColor,
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Konfimasyon Rechaj $methodLabel',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Peman an sekirite • 0% frè komisyon',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: AppConstants.accentEmerald,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildSummaryRow('Montan k ap rantre', '${_formatHtg(amount)} HTG', isBold: true),
                    const Divider(height: 18, color: Color(0xFFE2E8F0)),
                    _buildSummaryRow('Nimewo Peman', phone.isNotEmpty ? '+509 $phone' : 'Nimewo anrejistre'),
                    const SizedBox(height: 8),
                    _buildSummaryRow('Operatè', methodLabel),
                    const SizedBox(height: 8),
                    _buildSummaryRow('Frè tranzaksyon', 'GRATIS (0 HTG)', color: AppConstants.accentEmerald),
                    const Divider(height: 18, color: Color(0xFFE2E8F0)),
                    _buildSummaryRow(
                      'Nouvo Balans Estimatif',
                      '${_formatHtg(balance + amount)} HTG',
                      isBold: true,
                      highlight: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // USSD Instruction Banner
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        selectedMethod == 'MONCASH'
                            ? 'W ap resevwa yon notifikasyon sou Digicel ou pou tape kòd PIN MonCash ou pou otorize depozit la.'
                            : 'W ap resevwa yon envitasyon Natcash sou Natcom ou pou konfime peman an ak kòd sekrè w.',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF1E3A8A),
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Anile',
                          style: TextStyle(
                            color: Color(0xFF475569),
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: LinearGradient(
                          colors: selectedMethod == 'MONCASH'
                              ? [AppConstants.monCashRed, const Color(0xFFDC2626)]
                              : [AppConstants.natcashBlue, const Color(0xFF1D4ED8)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: operatorColor.withValues(alpha: 0.35),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'Konfime ${_formatHtg(amount)} HTG',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 14.5,
                            ),
                          ),
                        ),
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

    if (confirmed == true) {
      setState(() => isProcessingTopUp = true);
      final ok = await _service.topUpWallet(amount, selectedMethod);
      if (mounted) {
        setState(() => isProcessingTopUp = false);
        if (ok) {
          _showToast('${_formatHtg(amount)} HTG ajoute sou bous ou avèk siksè! 🎉');
          _customAmountCtrl.clear();
          isCustomAmount = false;
          _loadWalletData();
        } else {
          _showToast('Erè pandan rechaj la. Tanpri eseye ankò.', isError: true);
        }
      }
    }
  }

  Widget _buildSummaryRow(String label, String value,
      {bool isBold = false, bool highlight = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 4,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              color: highlight ? const Color(0xFF0F172A) : const Color(0xFF64748B),
              fontWeight: highlight ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 5,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: highlight ? 15 : 13,
              color: color ?? (highlight ? AppConstants.primaryCrimson : const Color(0xFF0F172A)),
              fontWeight: isBold || highlight ? FontWeight.w900 : FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  // ─── TRANSFER (VOYE LAJAN) MODAL ─────────────────────────────────────────
  void _openTransferModal() {
    HapticFeedback.lightImpact();
    final recipientCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    final noteCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 18,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              boxShadow: [
                BoxShadow(color: Color(0x33000000), blurRadius: 28, offset: Offset(0, -6)),
              ],
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.send_rounded, color: Color(0xFF6366F1), size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Voye Lajan bay yon Moun',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            Text(
                              'Transfè gratis ant kont Delivery Haïti',
                              style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Phone Input
                  const Text('Nimewo Telefòn Moun K ap Resevwa a',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: recipientCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      prefixIcon: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Text('🇭🇹 +509',
                            style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0F172A), fontSize: 14)),
                      ),
                      prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                      hintText: '3700-0000',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Amount Input
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Flexible(
                        child: Text('Montan pou voye (HTG)',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                      ),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'Balans: ${_formatHtg(balance)} HTG',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppConstants.accentEmerald),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    decoration: InputDecoration(
                      suffixText: 'HTG',
                      suffixStyle: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                      prefixIcon: const Icon(Icons.attach_money_rounded, color: Color(0xFF6366F1)),
                      hintText: 'Ex: 500',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 15, fontWeight: FontWeight.normal),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Optional Note
                  const Text('Nòt / Mesaj (Opsyonèl)',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: noteCtrl,
                    decoration: InputDecoration(
                      hintText: 'Ex: Kado manje midi 🍕',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(vertical: 13, horizontal: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        final recipient = recipientCtrl.text.trim();
                        final amt = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                        if (recipient.length < 8) {
                          _showToast('Tanpri mete yon nimewo telefòn valid (8 chif)', isError: true);
                          return;
                        }
                        if (amt <= 0) {
                          _showToast('Mete yon montan valid', isError: true);
                          return;
                        }
                        if (amt > balance) {
                          _showToast('Balans ou pa ase pou transfè sa a', isError: true);
                          return;
                        }

                        Navigator.pop(ctx);
                        setState(() => isLoading = true);
                        final success = await _service.transferWalletFunds(
                          recipient,
                          amt,
                          noteCtrl.text.trim(),
                        );
                        if (mounted) {
                          setState(() => isLoading = false);
                          if (success) {
                            _showToast('${_formatHtg(amt)} HTG voye bay $recipient avèk siksè! 🚀');
                            _loadWalletData();
                          } else {
                            _showToast('Erè pandan transfè a. Eseye ankò.', isError: true);
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        elevation: 2,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_rounded, color: Colors.white, size: 18),
                          SizedBox(width: 8),
                          Text('Voye Kounye a',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ─── CASH OUT (RETRÈ) MODAL ───────────────────────────────────────────────
  void _openWithdrawModal() {
    HapticFeedback.lightImpact();
    final amountCtrl = TextEditingController();
    String method = 'MONCASH';
    final phone = _phoneCtrl.text.trim();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 18,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              boxShadow: [
                BoxShadow(color: Color(0x33000000), blurRadius: 28, offset: Offset(0, -6)),
              ],
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: AppConstants.accentEmerald.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.account_balance_wallet_rounded,
                            color: AppConstants.accentEmerald, size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Retrè Lajan sou Bous',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            Text(
                              'Voye sou MonCash oswa Natcash ou dirèk',
                              style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Choose Method
                  const Text('Chwazi Operatè pou Resevwa Kòb la',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => method = 'MONCASH'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                            decoration: BoxDecoration(
                              color: method == 'MONCASH'
                                  ? AppConstants.monCashRed.withValues(alpha: 0.08)
                                  : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: method == 'MONCASH' ? AppConstants.monCashRed : const Color(0xFFE2E8F0),
                                width: method == 'MONCASH' ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                      color: AppConstants.monCashRed, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 6),
                                const Flexible(
                                  child: Text('MonCash',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 13.5)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => method = 'NATCASH'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                            decoration: BoxDecoration(
                              color: method == 'NATCASH'
                                  ? AppConstants.natcashBlue.withValues(alpha: 0.08)
                                  : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: method == 'NATCASH' ? AppConstants.natcashBlue : const Color(0xFFE2E8F0),
                                width: method == 'NATCASH' ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                      color: AppConstants.natcashBlue, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 6),
                                const Flexible(
                                  child: Text('Natcash',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 13.5)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Amount
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Flexible(
                        child: Text('Montan pou retire (HTG)',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                      ),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'Disponib: ${_formatHtg(balance)} HTG',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppConstants.accentEmerald),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    decoration: InputDecoration(
                      suffixText: 'HTG',
                      suffixStyle: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                      prefixIcon: const Icon(Icons.payments_outlined, color: AppConstants.accentEmerald),
                      hintText: 'Ex: 1000',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 15, fontWeight: FontWeight.normal),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppConstants.accentEmerald, width: 1.8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        final amt = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                        if (amt < 50) {
                          _showToast('Montan minimòm pou retrè se 50 HTG', isError: true);
                          return;
                        }
                        if (amt > balance) {
                          _showToast('Balans ou pa ase pou fè retrè sa a', isError: true);
                          return;
                        }

                        Navigator.pop(ctx);
                        setState(() => isLoading = true);
                        final success = await _service.withdrawWalletFunds(amt, method, phone);
                        if (mounted) {
                          setState(() => isLoading = false);
                          if (success) {
                            _showToast('${_formatHtg(amt)} HTG voye sou $method ($phone) avèk siksè!');
                            _loadWalletData();
                          } else {
                            _showToast('Erè pandan retrè a. Eseye ankò.', isError: true);
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.accentEmerald,
                        elevation: 2,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
                          SizedBox(width: 8),
                          Text('Konfime Retrè a',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ─── DIGITAL RECEIPT MODAL ────────────────────────────────────────────────
  void _openReceiptModal(Map<String, dynamic> tx) {
    HapticFeedback.lightImpact();
    final isCredit = tx['type'] == 'CREDIT';
    final amount = (tx['amount'] as num?)?.toDouble() ?? 0.0;
    final dateStr = tx['createdAt'] != null
        ? DateTime.tryParse(tx['createdAt'].toString())?.toLocal().toString().substring(0, 16) ?? ''
        : '';
    final ref = tx['reference'] ?? tx['id'] ?? 'N/A';
    final desc = tx['description'] ?? 'Tranzaksyon Bous';
    final source = tx['source'] ?? 'SISTÈM';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [
            BoxShadow(color: Color(0x33000000), blurRadius: 28, offset: Offset(0, -6)),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
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
              const SizedBox(height: 18),

              // Top Status Icon
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: isCredit
                      ? AppConstants.accentEmerald.withValues(alpha: 0.12)
                      : AppConstants.primaryCrimson.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isCredit ? Icons.check_circle_rounded : Icons.receipt_long_rounded,
                  size: 30,
                  color: isCredit ? AppConstants.accentEmerald : AppConstants.primaryCrimson,
                ),
              ),
              const SizedBox(height: 10),

              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  isCredit ? '+ ${_formatHtg(amount)} HTG' : '- ${_formatHtg(amount)} HTG',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: isCredit ? AppConstants.accentEmerald : const Color(0xFF0F172A),
                    letterSpacing: -0.5,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'TRANZAKSYON FINI AK SIKSÈ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                    color: Colors.grey[700],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Detailed Paper Receipt Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildSummaryRow('Deskripsyon', desc),
                    const Divider(height: 16, color: Color(0xFFE2E8F0)),
                    _buildSummaryRow('Kanal / Metòd', source),
                    const SizedBox(height: 8),
                    _buildSummaryRow('Dat & Lè', dateStr.isNotEmpty ? dateStr : 'Jodi a'),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Flexible(
                          child: Text('Kòd Referans',
                              style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: GestureDetector(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: ref));
                              _showToast('Kòd referans kopye: $ref');
                            },
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    ref,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF2563EB)),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.copy_rounded, size: 14, color: Color(0xFF2563EB)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final shareText =
                            'Resi Bous Delivery Haïti:\nMontan: ${_formatHtg(amount)} HTG\nReferans: $ref\nDat: $dateStr';
                        Clipboard.setData(ClipboardData(text: shareText));
                        _showToast('Resi a kopye pou pataje!');
                      },
                      icon: const Icon(Icons.share_outlined, size: 17),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('Pataje Resi'),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF334155),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('Fèmen', style: TextStyle(fontWeight: FontWeight.w900)),
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

  // ─── HELP / SUPPORT BOTTOM SHEET ──────────────────────────────────────────
  void _openSupportSheet() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(22),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [
            BoxShadow(color: Color(0x33000000), blurRadius: 28, offset: Offset(0, -6)),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              const SizedBox(height: 18),
              const Row(
                children: [
                  Icon(Icons.headset_mic_rounded, color: AppConstants.primaryCrimson, size: 24),
                  SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      'Asistans Bous & Peman',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Ekip sipò nou an disponib 24/7 pou ede w rezoud nenpòt kesyon sou MonCash oswa Natcash.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B), height: 1.4),
              ),
              const SizedBox(height: 18),

              // WhatsApp Direct Action
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                tileColor: const Color(0xFFF0FDF4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: Color(0xFFBBF7D0)),
                ),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Color(0xFF22C55E), shape: BoxShape.circle),
                  child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 18),
                ),
                title: const Text('Chat sou WhatsApp',
                    style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF14532D), fontSize: 14)),
                subtitle: const Text('Repons imedyat nan 2 minit', style: TextStyle(fontSize: 11.5, color: Color(0xFF15803D))),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 15, color: Color(0xFF16A34A)),
                onTap: () async {
                  Navigator.pop(ctx);
                  final uri = Uri.parse(
                      'https://wa.me/${AppConstants.supportWhatsApp}?text=Bonjou%20Delivery%20Haïti,%20mwen%20bezwen%20èd%20sou%20bous%20mwen.');
                  if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
                },
              ),
              const SizedBox(height: 10),

              // Direct Call
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                tileColor: const Color(0xFFF8FAFC),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Color(0xFF0F172A), shape: BoxShape.circle),
                  child: const Icon(Icons.call_rounded, color: Colors.white, size: 18),
                ),
                title: const Text('Rele Nimewo Dirèk la',
                    style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 14)),
                subtitle: Text(AppConstants.supportPhoneDisplay,
                    style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 15, color: Color(0xFF94A3B8)),
                onTap: () async {
                  Navigator.pop(ctx);
                  final uri = Uri.parse('tel:${AppConstants.supportPhone}');
                  if (await canLaunchUrl(uri)) await launchUrl(uri);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showToast(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
        backgroundColor: isError ? const Color(0xFFDC2626) : const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _buildAppBar(),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: AppConstants.primaryCrimson))
          : RefreshIndicator(
              color: AppConstants.primaryCrimson,
              onRefresh: _loadWalletData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Luxury Holographic VIP Card
                    _buildLuxuryHoloCard(),

                    const SizedBox(height: 16),

                    // 2. Quick Action Grid (Rechaje, Voye, Retrè, Istorik)
                    _buildQuickActionGrid(),

                    const SizedBox(height: 18),

                    // 3. Tab Pill Switcher (Rechaj Rapid vs Istorik)
                    _buildTabSwitcher(),

                    const SizedBox(height: 16),

                    // 4. Active Tab Content
                    if (selectedMainTab == 0) _buildRechargePanel() else _buildTransactionHistoryPanel(),

                    const SizedBox(height: 20),

                    // 5. Trust & Security Banner
                    _buildSecurityTrustBanner(),
                  ],
                ),
              ),
            ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APP BAR
  // ─────────────────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar() {
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
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Bous Dijital Mwen',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3),
                      ),
                      Text('Peman rapid • MonCash & Natcash',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Asistans Bous',
                  icon: const Icon(Icons.help_outline_rounded, color: Colors.white, size: 22),
                  onPressed: _openSupportSheet,
                ),
                IconButton(
                  tooltip: 'Rafrechi',
                  icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
                  onPressed: _loadWalletData,
                ),
                const SizedBox(width: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. LUXURY HOLOGRAPHIC VIP CARD
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildLuxuryHoloCard() {
    final userName = userProfile?['name'] ?? userProfile?['fullName'] ?? 'Kliyan Delivery Haïti';
    final cardId = userProfile?['id'] != null
        ? 'DH-${userProfile!['id'].toString().substring(0, 4).toUpperCase()}-PAY'
        : 'DH-PAY-8821';
    final usdEstimate = (balance / htgToUsdRate).toStringAsFixed(2);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0B132B),
            Color(0xFF1C2541),
            Color(0xFF1E1B4B),
            Color(0xFF0A0F1D),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B132B).withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
        border: Border.all(color: Colors.white.withValues(alpha: 0.16), width: 1.2),
      ),
      child: Stack(
        children: [
          // Ambient Glow effects inside card
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppConstants.primaryCrimson.withValues(alpha: 0.35),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -35,
            left: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF6366F1).withValues(alpha: 0.3),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Main Card Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Logo & Status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('🇭🇹', style: TextStyle(fontSize: 11)),
                            SizedBox(width: 5),
                            Flexible(
                              child: Text(
                                'DELIVERY HAÏTI PAY',
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppConstants.accentEmerald.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppConstants.accentEmerald.withValues(alpha: 0.5)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.shield_rounded, color: AppConstants.accentEmerald, size: 11),
                          SizedBox(width: 4),
                          Text(
                            'Sekirize',
                            style: TextStyle(
                              color: AppConstants.accentEmerald,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Middle: Balance & Hide toggle
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'BALANS TOTAL DISPONIB',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 1.1,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => isBalanceHidden = !isBalanceHidden);
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isBalanceHidden ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                            color: const Color(0xFFCBD5E1),
                            size: 15,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isBalanceHidden ? 'Montre' : 'Kache',
                            style: const TextStyle(
                              color: Color(0xFFCBD5E1),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Amount HTG & USD
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        isBalanceHidden ? '••••••••' : _formatHtg(balance),
                        style: const TextStyle(
                          fontSize: 35,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.8,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'HTG',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFFBBF24),
                        ),
                      ),
                      if (!isBalanceHidden) ...[
                        const SizedBox(width: 10),
                        Text(
                          '(≈ \$$usdEstimate USD)',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: Colors.white.withValues(alpha: 0.65),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // Bottom Row: Holder name, NFC chip & Virtual Card ID
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName.toUpperCase(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 2),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: cardId));
                              _showToast('ID Bous kopye: $cardId');
                            },
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    cardId,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white.withValues(alpha: 0.7),
                                      fontFamily: 'Courier',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Icon(Icons.copy_rounded, size: 11, color: Colors.white.withValues(alpha: 0.7)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Contactless Waves & Chip Icon
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.contactless_rounded, color: Colors.white.withValues(alpha: 0.8), size: 22),
                        const SizedBox(width: 8),
                        Container(
                          width: 28,
                          height: 21,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            gradient: const LinearGradient(
                              colors: [Color(0xFFE2E8F0), Color(0xFFCBD5E1)],
                            ),
                          ),
                          child: const Icon(Icons.credit_card_rounded, size: 14, color: Color(0xFF475569)),
                        ),
                      ],
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

  // ─────────────────────────────────────────────────────────────────────────
  // 2. QUICK ACTION GRID
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildQuickActionGrid() {
    return Row(
      children: [
        _buildActionButton(
          label: 'Rechaje',
          icon: Icons.add_circle_outline_rounded,
          color: AppConstants.primaryCrimson,
          onTap: () => setState(() => selectedMainTab = 0),
        ),
        const SizedBox(width: 8),
        _buildActionButton(
          label: 'Voye',
          icon: Icons.send_rounded,
          color: const Color(0xFF6366F1),
          onTap: _openTransferModal,
        ),
        const SizedBox(width: 8),
        _buildActionButton(
          label: 'Retrè',
          icon: Icons.account_balance_wallet_outlined,
          color: AppConstants.accentEmerald,
          onTap: _openWithdrawModal,
        ),
        const SizedBox(width: 8),
        _buildActionButton(
          label: 'Istorik',
          icon: Icons.receipt_long_rounded,
          color: const Color(0xFF2563EB),
          onTap: () => setState(() => selectedMainTab = 1),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 2),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.025),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 6),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    label,
                    maxLines: 1,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
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

  // ─────────────────────────────────────────────────────────────────────────
  // 3. TAB PILL SWITCHER
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildTabSwitcher() {
    return Container(
      padding: const EdgeInsets.all(3.5),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => selectedMainTab = 0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selectedMainTab == 0 ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(11),
                  boxShadow: selectedMainTab == 0
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.bolt_rounded,
                      size: 16,
                      color: selectedMainTab == 0 ? AppConstants.primaryCrimson : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        'Rechaje Bous',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: selectedMainTab == 0 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => selectedMainTab = 1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selectedMainTab == 1 ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(11),
                  boxShadow: selectedMainTab == 1
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.receipt_long_rounded,
                      size: 16,
                      color: selectedMainTab == 1 ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        'Istorik (${transactions.length})',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: selectedMainTab == 1 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4A. RECHARGE PANEL
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildRechargePanel() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.025),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          const Text(
            '1. Chwazi Operatè Peman',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),

          // MonCash & Natcash Selector
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => selectedMethod = 'MONCASH');
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: selectedMethod == 'MONCASH'
                          ? AppConstants.monCashRed.withValues(alpha: 0.08)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selectedMethod == 'MONCASH'
                            ? AppConstants.monCashRed
                            : const Color(0xFFE2E8F0),
                        width: selectedMethod == 'MONCASH' ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              width: 30,
                              height: 30,
                              decoration: const BoxDecoration(
                                color: AppConstants.monCashRed,
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Text(
                                  'M',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                            ),
                            if (selectedMethod == 'MONCASH')
                              const Icon(Icons.check_circle_rounded, color: AppConstants.monCashRed, size: 18),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'MonCash',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Digicel • Enstantane',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => selectedMethod = 'NATCASH');
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: selectedMethod == 'NATCASH'
                          ? AppConstants.natcashBlue.withValues(alpha: 0.08)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selectedMethod == 'NATCASH'
                            ? AppConstants.natcashBlue
                            : const Color(0xFFE2E8F0),
                        width: selectedMethod == 'NATCASH' ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              width: 30,
                              height: 30,
                              decoration: const BoxDecoration(
                                color: AppConstants.natcashBlue,
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Text(
                                  'N',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                            ),
                            if (selectedMethod == 'NATCASH')
                              const Icon(Icons.check_circle_rounded, color: AppConstants.natcashBlue, size: 18),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Natcash',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Natcom • Enstantane',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Phone Number Input
          const Text(
            '2. Nimewo Telefòn Pou Debite a',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A)),
            decoration: InputDecoration(
              prefixIcon: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                child: Text('🇭🇹 +509',
                    style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 14)),
              ),
              prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
              hintText: '3700-0000',
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal, fontSize: 14),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(vertical: 13, horizontal: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: selectedMethod == 'MONCASH' ? AppConstants.monCashRed : AppConstants.natcashBlue,
                  width: 1.8,
                ),
              ),
            ),
          ),

          const SizedBox(height: 18),

          // Preset Amount Chips
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Flexible(
                child: Text(
                  '3. Chwazi Montan Pou Depoze',
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  setState(() {
                    isCustomAmount = !isCustomAmount;
                    if (isCustomAmount) _customAmountCtrl.text = selectedAmount.toStringAsFixed(0);
                  });
                },
                child: Text(
                  isCustomAmount ? 'Montan Fiks' : 'Lòt Montan',
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF2563EB),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (!isCustomAmount)
            LayoutBuilder(
              builder: (context, constraints) {
                // Responsive grid: 3 chips per row
                final chipWidth = (constraints.maxWidth - 16) / 3;
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: presetAmounts.map((amt) {
                    final isSelected = selectedAmount == amt;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => selectedAmount = amt);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 140),
                        width: chipWidth,
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? (selectedMethod == 'MONCASH' ? AppConstants.monCashRed : AppConstants.natcashBlue)
                              : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
                            width: 1,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: (selectedMethod == 'MONCASH'
                                            ? AppConstants.monCashRed
                                            : AppConstants.natcashBlue)
                                        .withValues(alpha: 0.28),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ]
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            '${_formatHtg(amt)} G',
                            style: TextStyle(
                              color: isSelected ? Colors.white : const Color(0xFF0F172A),
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                              fontSize: 13.5,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            )
          else
            TextField(
              controller: _customAmountCtrl,
              keyboardType: TextInputType.number,
              autofocus: true,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.attach_money_rounded, color: AppConstants.primaryCrimson),
                suffixText: 'HTG',
                suffixStyle: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B)),
                hintText: 'Mete montan ou vle a (ex: 750)',
                hintStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.normal, color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(14)),
                  borderSide: BorderSide(color: AppConstants.primaryCrimson, width: 2),
                ),
              ),
            ),

          const SizedBox(height: 20),

          // Big Call to action Recharge Button (with FittedBox to prevent any overflow)
          Container(
            width: double.infinity,
            height: 52,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: selectedMethod == 'MONCASH'
                    ? [AppConstants.monCashRed, const Color(0xFFB91C1C)]
                    : [AppConstants.natcashBlue, const Color(0xFF1D4ED8)],
              ),
              boxShadow: [
                BoxShadow(
                  color: (selectedMethod == 'MONCASH' ? AppConstants.monCashRed : AppConstants.natcashBlue)
                      .withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: isProcessingTopUp ? null : _handleTopUp,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: isProcessingTopUp
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                    )
                  : FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.bolt_rounded, color: Colors.white, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Rechaje ${_formatHtg(isCustomAmount ? (double.tryParse(_customAmountCtrl.text) ?? selectedAmount) : selectedAmount)} HTG Kounye a',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4B. TRANSACTION HISTORY PANEL
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildTransactionHistoryPanel() {
    var list = transactions.where((t) {
      if (txFilter == 'CREDIT') return t['type'] == 'CREDIT';
      if (txFilter == 'DEBIT') return t['type'] == 'DEBIT';
      if (txFilter == 'REFUND') return t['source'] == 'REFUND';
      return true;
    }).toList();

    if (txSearchQuery.isNotEmpty) {
      list = list.where((t) {
        final desc = (t['description'] ?? '').toString().toLowerCase();
        final ref = (t['reference'] ?? '').toString().toLowerCase();
        return desc.contains(txSearchQuery.toLowerCase()) || ref.contains(txSearchQuery.toLowerCase());
      }).toList();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search & Filter Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: _txSearchCtrl,
            onChanged: (val) => setState(() => txSearchQuery = val.trim()),
            decoration: const InputDecoration(
              icon: Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
              hintText: 'Chèche pa referans oswa kòmand...',
              hintStyle: TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
              border: InputBorder.none,
            ),
          ),
        ),

        const SizedBox(height: 10),

        // Filter Pills
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              _buildFilterChip('Tout', 'ALL'),
              _buildFilterChip('Rechaj (+)', 'CREDIT'),
              _buildFilterChip('Peman Kòmand (-)', 'DEBIT'),
              _buildFilterChip('Ranbousman', 'REFUND'),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Transaction Items
        if (list.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Icon(Icons.receipt_long_outlined, size: 44, color: Colors.grey[400]),
                const SizedBox(height: 10),
                const Text(
                  'Pa gen tranzaksyon ki koresponn',
                  style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF475569), fontSize: 14),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Rechaj oswa peman w yo ap parèt isit la.',
                  style: TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: list.length,
            separatorBuilder: (context, index) => const SizedBox(height: 9),
            itemBuilder: (ctx, index) {
              final tx = list[index];
              final isCredit = tx['type'] == 'CREDIT';
              final amt = (tx['amount'] as num?)?.toDouble() ?? 0.0;
              final desc = tx['description'] ?? 'Tranzaksyon';
              final ref = tx['reference'] ?? tx['id'] ?? '';
              final source = tx['source'] ?? '';
              final dateStr = tx['createdAt'] != null
                  ? DateTime.tryParse(tx['createdAt'].toString())?.toLocal().toString().substring(5, 16) ?? ''
                  : '';

              IconData icon = Icons.payments_rounded;
              Color iconColor = AppConstants.accentEmerald;
              Color iconBg = const Color(0xFFECFDF5);

              if (source == 'MONCASH') {
                icon = Icons.account_balance_wallet_rounded;
                iconColor = AppConstants.monCashRed;
                iconBg = AppConstants.monCashRed.withValues(alpha: 0.1);
              } else if (source == 'NATCASH') {
                icon = Icons.account_balance_wallet_rounded;
                iconColor = AppConstants.natcashBlue;
                iconBg = AppConstants.natcashBlue.withValues(alpha: 0.1);
              } else if (source == 'REFUND' || source == 'CASHBACK') {
                icon = Icons.redeem_rounded;
                iconColor = const Color(0xFF059669);
                iconBg = const Color(0xFFD1FAE5);
              } else {
                icon = Icons.shopping_bag_rounded;
                iconColor = const Color(0xFFFF6600);
                iconBg = const Color(0xFFFFE4E6);
              }

              return InkWell(
                onTap: () => _openReceiptModal(tx),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                        child: Icon(icon, color: iconColor, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              desc,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    ref,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF64748B),
                                      fontFamily: 'Courier',
                                    ),
                                  ),
                                ),
                                if (dateStr.isNotEmpty) ...[
                                  const Text(' • ', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 10)),
                                  Text(
                                    dateStr,
                                    style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              isCredit ? '+ ${_formatHtg(amt)}' : '- ${_formatHtg(amt)}',
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w900,
                                color: isCredit ? AppConstants.accentEmerald : const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          const Text(
                            'HTG',
                            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 18),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = txFilter == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => txFilter = value);
      },
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6.5),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. SECURITY TRUST BANNER
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildSecurityTrustBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.verified_user_rounded, size: 18, color: AppConstants.accentEmerald),
              SizedBox(width: 7),
              Flexible(
                child: Text(
                  'Garanti & Pwoteksyon Bous Delivery Haïti',
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            '• Kòb ou an sekirite 100% sou rezo MonCash & Natcash.\n'
            '• Peman 1-klik rapid pandan kòmand san pwoblèm monnen kach.\n'
            '• Ranbousman otomatik si yon komèsan anile yon atik.\n'
            '• Sipò kliyan disponib 24/7 sou WhatsApp.',
            style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.55),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: _openSupportSheet,
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Bezwen asistans? Kontakte Sipò Nou',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: Color(0xFF2563EB)),
                ),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward_rounded, size: 15, color: Color(0xFF2563EB)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
