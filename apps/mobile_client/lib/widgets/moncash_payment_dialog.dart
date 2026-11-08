import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/supabase_service.dart';

class MoncashWebViewScreen extends StatefulWidget {
  final String redirectUrl;
  final Order order;
  final VoidCallback onPaymentSuccess;
  final VoidCallback? onCancel;

  const MoncashWebViewScreen({
    super.key,
    required this.redirectUrl,
    required this.order,
    required this.onPaymentSuccess,
    this.onCancel,
  });

  @override
  State<MoncashWebViewScreen> createState() => _MoncashWebViewScreenState();
}

class _MoncashWebViewScreenState extends State<MoncashWebViewScreen> {
  final _api = ApiService();
  final _supabase = SupabaseService();
  final _smsCodeController = TextEditingController();

  WebViewController? _controller;
  bool _showEmbeddedWebView = false;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMsg = '';
  bool _verifying = false;
  bool _verifiedSuccess = false;
  String _confirmedTransactionId = '';
  Timer? _pollTimer;
  int _pollCount = 0;

  static const Color monCashRed = Color(0xFFE4002B);
  static const Color monCashDarkRed = Color(0xFF99001D);
  static const Color emeraldGreen = Color(0xFF16A34A);

  @override
  void initState() {
    super.initState();

    // 1. Ouvri paj MonCash la dirèkteman nan Chrome / Navigatè Sistèm nan
    // Sa evite tout pwoblèm SSL renegotiation, SurfaceView crash, oswa paj ki vire san rete sou Android
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _openInBrowser();
    });

    // 2. Polling regilye chak 6 segonn pou verifye si peman an fèt sou sèvè Digicel la
    _pollTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      _pollCount++;
      if (_pollCount > 20) {
        _pollTimer?.cancel();
        return;
      }
      _pollSilently();
    });
  }

  Future<void> _openInBrowser() async {
    try {
      final uri = Uri.parse(widget.redirectUrl);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (_) {
      // Si ouvèti ekstèn lan gen pwoblèm, itilizatè a ka klike bouton an ankò
    }
  }

  void _initEmbeddedWebView() {
    if (_controller != null) return;
    try {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (url) {
              if (mounted) setState(() => _isLoading = true);
              _checkReturnUrl(url);
            },
            onPageFinished: (url) {
              if (mounted) setState(() => _isLoading = false);
              _checkReturnUrl(url);
            },
            onWebResourceError: (error) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                  _hasError = true;
                  _errorMsg = error.description;
                });
              }
            },
          ),
        )
        ..loadRequest(Uri.parse(widget.redirectUrl));
    } catch (e) {
      setState(() {
        _hasError = true;
        _errorMsg = e.toString();
      });
    }
  }

  void _checkReturnUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final tid = uri.queryParameters['transactionId'] ??
          uri.queryParameters['transaction_id'] ??
          uri.queryParameters['transId'];

      if (tid != null && tid.isNotEmpty) {
        _pollTimer?.cancel();
        _verifyPayment(transactionId: tid);
        return;
      }

      final lower = url.toLowerCase();
      if (lower.contains('payment/confirm') ||
          lower.contains('returnurl') ||
          lower.contains('success') ||
          lower.contains('callback')) {
        _pollTimer?.cancel();
        Future.delayed(const Duration(milliseconds: 1200), () => _verifyPayment());
      }
    } catch (_) {}
  }

  Future<void> _pollSilently() async {
    if (_verifying || _verifiedSuccess) return;
    try {
      final res = await _api.verifyMonCashPayment(widget.order.id);
      if (res != null) {
        final s = (res['status'] ?? res['paymentStatus'] ?? '').toString().toUpperCase();
        if (s == 'PAID' || s == 'CONFIRMED' || s == 'COMPLETED' || s == 'ALREADY_CONFIRMED') {
          _pollTimer?.cancel();
          _onSuccess(res);
        }
      }
    } catch (_) {}
  }

  Future<void> _verifyPayment({String? transactionId}) async {
    if (_verifying || _verifiedSuccess || !mounted) return;
    setState(() => _verifying = true);

    try {
      final res = await _api.verifyMonCashPayment(
        widget.order.id,
        transactionId: transactionId ?? _smsCodeController.text.trim(),
      );

      if (res != null) {
        final s = (res['status'] ?? res['paymentStatus'] ?? '').toString().toUpperCase();
        if (s == 'PAID' || s == 'CONFIRMED' || s == 'COMPLETED' || s == 'ALREADY_CONFIRMED') {
          _onSuccess(res);
          return;
        }

        final msg = res['message']?.toString() ?? 'Peman an poko konfime sou MonCash.';
        if (mounted) {
          setState(() => _verifying = false);
          _showFeedbackDialog(
            title: 'Peman Poko Konfime',
            message: msg,
            icon: Icons.access_time_rounded,
            iconColor: Colors.orange,
          );
        }
        return;
      }

      if (mounted) {
        setState(() => _verifying = false);
        _showFeedbackDialog(
          title: 'MonCash ap Trete L',
          message: 'Digicel poko voye konfimasyon an. Si w sot mete PIN ou nan Chrome, rete tann 5 segonn epi klike "Verifye" ankò.',
          icon: Icons.hourglass_top_rounded,
          iconColor: Colors.amber,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _verifying = false);
        _showFeedbackDialog(
          title: 'Erè Koneksyon',
          message: 'Pa ka kontakte sèvè a kounye a : $e',
          icon: Icons.error_outline_rounded,
          iconColor: Colors.red,
        );
      }
    }
  }

  void _showFeedbackDialog({
    required String title,
    required String message,
    required IconData icon,
    required Color iconColor,
  }) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        content: Text(message, style: const TextStyle(fontSize: 13, height: 1.4)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Dakò', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              _verifyPayment();
            },
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Re-eseye Kounye a'),
            style: ElevatedButton.styleFrom(
              backgroundColor: monCashRed,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _onSuccess(Map<String, dynamic> data) async {
    HapticFeedback.heavyImpact();
    _pollTimer?.cancel();

    final txId = (data['transactionId'] ?? data['transaction_id'] ?? data['transId'] ?? '').toString();
    setState(() {
      _verifying = false;
      _verifiedSuccess = true;
      _confirmedTransactionId = txId.isNotEmpty ? txId : 'MC-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    });

    final updated = widget.order.copyWith(
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    );
    await _supabase.saveLocalOrder(updated);

    await Future.delayed(const Duration(milliseconds: 1800));

    if (mounted) {
      Navigator.of(context).pop();
      widget.onPaymentSuccess();
    }
  }

  void _showCancelConfirmationSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.help_outline_rounded, color: monCashRed, size: 26),
                SizedBox(width: 10),
                Text(
                  'Èske w vle kite paj peman an ?',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Si w te deja antre PIN ou sou MonCash, klike "Verifye Peman an" anvan w soti.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.4),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _verifyPayment();
                },
                icon: const Icon(Icons.verified_rounded),
                label: const Text('Verifye Peman an Kounye a', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: emeraldGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            if (widget.onCancel != null) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _pollTimer?.cancel();
                    Navigator.of(context).pop();
                    widget.onCancel?.call();
                  },
                  icon: const Icon(Icons.payments_rounded, color: Colors.orange),
                  label: const Text('Pito m Peye Kach lè m resevwa l',
                      style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey.shade300),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 10),
            Center(
              child: TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _pollTimer?.cancel();
                  Navigator.of(context).pop();
                },
                child: const Text('Kite Paj la san konfime', style: TextStyle(color: Colors.redAccent, fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _smsCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_verifiedSuccess) {
      return _buildSuccessCelebrationView();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(75),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [monCashRed, monCashDarkRed],
            ),
            boxShadow: [
              BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
            ],
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                    tooltip: 'Retounen',
                    onPressed: _showCancelConfirmationSheet,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.lock_rounded, color: Colors.white, size: 10),
                                  SizedBox(width: 3),
                                  Text(
                                    '256-BIT SSL',
                                    style: TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'Digicel MonCash',
                              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${widget.order.totalAmount.toStringAsFixed(0)} HTG · #${widget.order.orderNumber}',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.open_in_browser_rounded, color: Colors.white),
                    tooltip: 'Ouvri nan Chrome',
                    onPressed: _openInBrowser,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: _showEmbeddedWebView ? _buildEmbeddedWebView() : _buildPaymentHubView(),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _verifying
                      ? null
                      : () {
                          if (_smsCodeController.text.trim().isNotEmpty) {
                            _verifyPayment(transactionId: _smsCodeController.text.trim());
                          } else {
                            _verifyPayment();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: emeraldGreen,
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_verifying) ...[
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        ),
                        const SizedBox(width: 12),
                        const Text('N ap verifye...', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ] else ...[
                        const Icon(Icons.check_circle_rounded, size: 22),
                        const SizedBox(width: 8),
                        const Text(
                          '✅ Mwen Fin Peye — Verifye Kounye a',
                          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Lè w fin tape PIN ou sou paj Digicel la, klike bouton vèt la pou konfime.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Ekran Prensipal : MonCash Payment Hub (Fyab, Rapid, Pa Janm Plante)
  Widget _buildPaymentHubView() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Kat 1 : Eta Peman an & Bouton Chrome
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [monCashRed.withValues(alpha: 0.08), Colors.white],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: monCashRed.withValues(alpha: 0.25)),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: monCashRed,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 28),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Paj Peman Digicel la',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.green,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Koneksyon aktif ak Digicel',
                                style: TextStyle(fontSize: 12, color: Color(0xFF16A34A), fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Nou ouvri paj sekirize Digicel MonCash la nan navigatè w pou w ka antre nimewo telefòn ak PIN ou an tout sekirite san okenn ralantisman.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: _openInBrowser,
                    icon: const Icon(Icons.open_in_browser_rounded, size: 20),
                    label: const Text('Ouvri Paj Digicel la nan Chrome', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: monCashRed,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Kat 2 : Kòd Tranzaksyon SMS Digicel
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.sms_rounded, color: Color(0xFF2563EB), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Ou te resevwa yon SMS MonCash ?',
                      style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Si w te peye pa *202# oswa sou app MonCash la, kole ID tranzaksyon ki nan SMS la la a :',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.3),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _smsCodeController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Eg : 284920492 oswa MC-892102',
                    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                    prefixIcon: const Icon(Icons.pin_rounded, color: Color(0xFF2563EB), size: 20),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.paste_rounded, color: Color(0xFF2563EB)),
                      tooltip: 'Kole Kòd la',
                      onPressed: () async {
                        final data = await Clipboard.getData(Clipboard.kTextPlain);
                        if (data?.text != null && mounted) {
                          setState(() => _smsCodeController.text = data!.text!.trim());
                        }
                      },
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
                      borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.8),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Opsyon WebView entèn si itilizatè a vle eseye
          Center(
            child: TextButton.icon(
              onPressed: () {
                _initEmbeddedWebView();
                setState(() => _showEmbeddedWebView = true);
              },
              icon: const Icon(Icons.smartphone_rounded, size: 16, color: Color(0xFF64748B)),
              label: const Text(
                'Eseye afiche paj la anndan app la (WebView)',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Ekran WebView entèn (avèk bouton pou retounen nan Hub la si l bloke)
  Widget _buildEmbeddedWebView() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          color: const Color(0xFFF1F5F9),
          child: Row(
            children: [
              const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF64748B)),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Si paj la pran twòp tan pou l chaje :',
                  style: TextStyle(fontSize: 11, color: Color(0xFF475569)),
                ),
              ),
              TextButton(
                onPressed: () => setState(() => _showEmbeddedWebView = false),
                style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                child: const Text('Tounen nan Hub la', style: TextStyle(color: monCashRed, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
        ),
        if (_isLoading && !_hasError)
          const LinearProgressIndicator(color: monCashRed, minHeight: 3),
        Expanded(
          child: _hasError
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.wifi_off_rounded, size: 48, color: monCashRed),
                        const SizedBox(height: 12),
                        const Text(
                          'Paj la pa ka ouvri anndan app la',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _errorMsg.isNotEmpty
                              ? 'Sèvè Digicel la bloke afichaj entèn ($_errorMsg). Klike anba a pou w ouvri l dirèkteman nan Chrome :'
                              : 'Sèvè Digicel la bloke afichaj entèn. Klike anba a pou w ouvri l dirèkteman nan Chrome :',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _openInBrowser,
                          icon: const Icon(Icons.open_in_browser_rounded),
                          label: const Text('Ouvri nan Chrome'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: monCashRed,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : (_controller != null ? WebViewWidget(controller: _controller!) : const SizedBox.shrink()),
        ),
      ],
    );
  }

  /// Ekran Selèbrasyon Siksè lè peman an konfime
  Widget _buildSuccessCelebrationView() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: emeraldGreen.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded, color: emeraldGreen, size: 68),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Peman MonCash Konfime !',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Kòmand #${widget.order.orderNumber} anrejistre avèk siksè.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Montan Peye :', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                          Text(
                            '${widget.order.totalAmount.toStringAsFixed(0)} HTG',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: monCashRed),
                          ),
                        ],
                      ),
                      if (_confirmedTransactionId.isNotEmpty) ...[
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Tranzaksyon ID :', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                            Flexible(
                              child: Text(
                                _confirmedTransactionId,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                const CircularProgressIndicator(color: emeraldGreen, strokeWidth: 3),
                const SizedBox(height: 12),
                const Text(
                  'N ap mennen w sou ekran swivi a...',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class MoncashPaymentDialog {
  static Future<void> show({
    required BuildContext context,
    required Order order,
    required String redirectUrl,
    required VoidCallback onPaymentSuccess,
    VoidCallback? onSwitchToCash,
  }) async {
    await Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => MoncashWebViewScreen(
        redirectUrl: redirectUrl,
        order: order,
        onPaymentSuccess: onPaymentSuccess,
        onCancel: onSwitchToCash,
      ),
    ));
  }
}
