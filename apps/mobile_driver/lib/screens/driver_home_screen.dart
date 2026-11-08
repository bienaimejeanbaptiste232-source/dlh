import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../config/constants.dart';
import '../models/driver_models.dart';
import '../providers/driver_providers.dart';
import '../services/driver_alert_service.dart';
import '../services/driver_api_service.dart';
import '../services/driver_location_service.dart';
import '../services/driver_navigation_service.dart';
import '../services/driver_offline_queue.dart';
import '../services/driver_socket_service.dart';
import '../widgets/driver_live_map_widget.dart';
import '../widgets/driver_profile_drawer.dart';
import '../widgets/glass_container.dart';
import 'driver_login_screen.dart';
import 'driver_wallet_screen.dart';


// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  Position? _currentGpsPosition;
  bool _isGpsActive = false;
  String? _gpsErrorMessage;
  late AnimationController _pulseController;

  bool _isAlertShowing = false;
  bool _isStepBubbleExpanded = false;
  Timer? _missionPollTimer;

  static final List<LatLng> _demoRoutePoints = [
    const LatLng(19.7625, -72.1985),
    const LatLng(19.7620, -72.1988),
    const LatLng(19.7614, -72.1993),
    const LatLng(19.7607, -72.1999),
    const LatLng(19.7601, -72.2004),
    const LatLng(19.7594, -72.2008),
  ];

  @override
  void initState() {
    super.initState();
    DriverAlertService().init();
    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);

    final profile = ref.read(currentDriverProfileProvider);
    final driverId = profile?.id.isNotEmpty == true ? profile!.id : '217712d7-1f9a-49cc-b1b4-50b163fa22a6';
    final userId = profile?.userId ?? '217712d7-1f9a-49cc-b1b4-50b163fa22a6';

    final socketUrl = kIsWeb ? DriverConstants.socketUrlLocal : DriverConstants.socketUrl;
    DriverSocketService().init(serverUrl: socketUrl, driverId: driverId, userId: userId);

    ref.read(driverApiProvider).getCurrentMission(driverId, userId: userId).then((realMission) {
      if (realMission != null && mounted) {
        if ((realMission.status == 'DRIVER_ASSIGNED' || realMission.status == 'PREPARING' ||
                realMission.status == 'CONFIRMED' || realMission.status == 'READY_FOR_PICKUP') &&
            !_isAlertShowing) {
          _showIncomingMissionAlert(realMission);
        } else {
          ref.read(activeMissionProvider.notifier).setMission(realMission);
        }
      }
    });

    DriverSocketService().onMissionAlert.listen((data) {
      if (mounted && !_isAlertShowing && ref.read(activeMissionProvider) == null) {
        _showIncomingMissionAlert(Mission.fromWebSocket(data));
      }
    });

    _missionPollTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      if (!mounted || _isAlertShowing || ref.read(activeMissionProvider) != null) return;
      try {
        final p = ref.read(currentDriverProfileProvider);
        final cId = p?.id.isNotEmpty == true ? p!.id : driverId;
        final cUId = p?.userId ?? userId;
        final m = await ref.read(driverApiProvider).getCurrentMission(cId, userId: cUId);
        if (m != null && mounted && !_isAlertShowing && ref.read(activeMissionProvider) == null) {
          if (m.status == 'DRIVER_ASSIGNED' || m.status == 'PREPARING' ||
              m.status == 'CONFIRMED' || m.status == 'READY_FOR_PICKUP') {
            _showIncomingMissionAlert(m);
          } else {
            ref.read(activeMissionProvider.notifier).setMission(m);
          }
        }
      } catch (_) {}
    });
  }

  Future<void> _startGpsTracking() async {
    final started = await DriverLocationService().startTracking(
      onPosition: (pos) {
        if (mounted) setState(() { _currentGpsPosition = pos; _isGpsActive = true; _gpsErrorMessage = null; });
        DriverSocketService().sendLocationUpdate(pos);
        final p = ref.read(currentDriverProfileProvider);
        final dId = p?.id.isNotEmpty == true ? p!.id : '217712d7-1f9a-49cc-b1b4-50b163fa22a6';
        DriverApiService().updateDriverLocation(driverId: dId, latitude: pos.latitude, longitude: pos.longitude, status: 'ONLINE');
      },
      onError: (err) { if (mounted) setState(() => _gpsErrorMessage = err); },
    );
    if (!started && mounted) setState(() { _isGpsActive = false; _gpsErrorMessage = 'GPS pa pemèt oswa enfimye sou aparèy sa a'; });
  }

  Future<void> _stopGpsTracking() async {
    await DriverLocationService().stopTracking();
    if (mounted) setState(() => _isGpsActive = false);
  }

  void _toggleOnlineStatus() async {
    final willBeOnline = !ref.read(driverStatusProvider);
    ref.read(driverStatusProvider.notifier).toggle();
    final p = ref.read(currentDriverProfileProvider);
    final dId = p?.id.isNotEmpty == true ? p!.id : '217712d7-1f9a-49cc-b1b4-50b163fa22a6';

    if (willBeOnline) {
      await _startGpsTracking();
      final lastPos = DriverLocationService().lastKnownPosition;
      await DriverApiService().updateDriverOnlineStatus(dId, true, lat: lastPos?.latitude, lng: lastPos?.longitude);
      if (mounted) {
        _showSnack('Ou an liy! GPS ap transmèt an tan reyel.', DriverConstants.neonGreen, Icons.radar);
      }
    } else {
      await _stopGpsTracking();
      DriverSocketService().setActiveOrderId(null);
      await DriverApiService().updateDriverOnlineStatus(dId, false);
      if (mounted) {
        _showSnack('Ou mete ko w hos liy.', const Color(0xFF374151), Icons.power_settings_new);
      }
    }
  }

  void _showSnack(String msg, Color bg, IconData icon) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [Icon(icon, color: Colors.white), const SizedBox(width: 8), Expanded(child: Text(msg))]),
      backgroundColor: bg,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      duration: const Duration(seconds: 2),
    ));
  }

  @override
  void dispose() {
    DriverAlertService().stopOrderAlarm();
    _pulseController.dispose();
    _missionPollTimer?.cancel();
    _stopGpsTracking();
    super.dispose();
  }

  void _triggerDemoMission() {
    _showIncomingMissionAlert(Mission(
      orderId: 'DEMO-OKAP-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
      orderNumber: 'HT-2026-9921',
      merchantName: 'Restoran Lakay Fritay',
      merchantAddress: 'Boulevard du Cap, bo lanme a',
      pickupLatitude: 19.7625, pickupLongitude: -72.1985,
      customerName: 'Wilson Dorilas', customerPhone: '+509 3700 0007',
      customerAddress: 'Rue 18 Santvil (anfas Famasi)',
      customerNote: 'Baryè vèt la, rele m lè w rive',
      customerLandmark: 'Anfas Famasi Santral, baryè vèt ak flè',
      dropoffLatitude: 19.7594, dropoffLongitude: -72.2008,
      deliveryFee: 250.0, totalOrderAmount: 1850.0,
      paymentMethod: 'CASH_ON_DELIVERY', status: 'DRIVER_ASSIGNED',
      distanceKm: 3.2, dispatchTimeout: 25,
      itemsDescription: '2x Griyo Konplè ak Bannann, 1x Ji Papay',
      tipAmount: 50.0, category: 'FOOD',
    ));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INCOMING MISSION DIALOG
  // ─────────────────────────────────────────────────────────────────────────────
  void _showIncomingMissionAlert(Mission mission) {
    if (_isAlertShowing) return;
    _isAlertShowing = true;
    DriverAlertService().startOrderAlarm();

    int countdown = mission.dispatchTimeout > 0 ? mission.dispatchTimeout : 25;
    final int totalSeconds = countdown;
    Timer? timer;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) {
        timer ??= Timer.periodic(const Duration(seconds: 1), (t) {
          if (countdown > 1) { setSt(() => countdown--); }
          else { t.cancel(); DriverAlertService().stopOrderAlarm(); DriverSocketService().rejectMission(mission.orderId); if (Navigator.canPop(ctx)) Navigator.pop(ctx); }
        });

        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
          child: Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 32, offset: Offset(0, 12))]),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              // ── Crimson gradient header ──────────────────────────────────
              Container(
                decoration: const BoxDecoration(gradient: DriverConstants.primaryGradient, borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                child: Row(children: [
                  Container(padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(14)),
                    child: const Icon(Icons.bolt, color: Colors.white, size: 22)),
                  const SizedBox(width: 12),
                  const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('NOUVO KOUS DISPONIB', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
                    SizedBox(height: 2),
                    Text('Reponn vit pou pa pedi kous la', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ])),
                  Stack(alignment: Alignment.center, children: [
                    SizedBox(width: 52, height: 52, child: CircularProgressIndicator(
                      value: countdown / totalSeconds, strokeWidth: 4, color: Colors.white, backgroundColor: Colors.white24)),
                    Text('$countdown', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: countdown < 8 ? Colors.yellow : Colors.white)),
                  ]),
                ]),
              ),
              // ── Body ─────────────────────────────────────────────────────
              Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Center(child: Column(children: [
                  Text('+${mission.totalDriverEarnings.toInt()} HTG', style: const TextStyle(fontSize: 44, fontWeight: FontWeight.w900, color: DriverConstants.primaryCrimson, letterSpacing: -1)),
                  const Text('Fre de baz + Pourbwa garanti', style: TextStyle(color: DriverConstants.textMuted, fontSize: 13)),
                ])),
                if (mission.isCashOnDelivery) ...[const SizedBox(height: 12), _cashBanner(mission.totalOrderAmount)],
                const SizedBox(height: 18),
                _routeCard(mission),
                const SizedBox(height: 12),
                Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: DriverConstants.borderLight)),
                  child: Row(children: [const Icon(Icons.shopping_bag_outlined, color: DriverConstants.textMuted, size: 18), const SizedBox(width: 10),
                    Expanded(child: Text(mission.itemsDescription, style: const TextStyle(color: DriverConstants.textDark, fontSize: 13, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis))])),
                const SizedBox(height: 22),
                Row(children: [
                  Expanded(child: OutlinedButton(
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5), foregroundColor: DriverConstants.textMuted, padding: const EdgeInsets.symmetric(vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    onPressed: () { timer?.cancel(); DriverAlertService().stopOrderAlarm(); DriverSocketService().rejectMission(mission.orderId); Navigator.pop(ctx); },
                    child: const Text('REFIZE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)))),
                  const SizedBox(width: 12),
                  Expanded(flex: 2, child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: DriverConstants.primaryCrimson, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 4, shadowColor: DriverConstants.primaryCrimson.withValues(alpha: 0.4)),
                    onPressed: () async {
                      timer?.cancel(); DriverAlertService().stopOrderAlarm(); DriverAlertService().playSuccessChime(); Navigator.pop(ctx);
                      if (!ref.read(driverStatusProvider)) { ref.read(driverStatusProvider.notifier).toggle(); await _startGpsTracking(); }
                      final ok = await ref.read(driverApiProvider).acceptMission(mission.orderId);
                      DriverSocketService().acceptMission(mission.orderId);
                      ref.read(activeMissionProvider.notifier).setMission(mission);
                      DriverSocketService().setActiveOrderId(mission.orderId);
                      if (mounted && !ok) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Aksepte an ofline. Y ap senkronize kou koneksyon revi.'), backgroundColor: const Color(0xFF92400E), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))));
                    },
                    child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.bolt, size: 18), SizedBox(width: 6),
                      Text('AKSEPTE KOUS LA', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
                    ]))),
                ]),
              ])),
            ]),
          ),
        );
      }),
    ).then((_) {
      DriverAlertService().stopOrderAlarm();
      if (mounted) { setState(() => _isAlertShowing = false); } else { _isAlertShowing = false; }
    });
  }

  Widget _cashBanner(double amount) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFCD34D))),
    child: Row(children: [const Text('💵', style: TextStyle(fontSize: 22)), const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('KACH SOU KLIYAN AN', style: TextStyle(color: Color(0xFFB45309), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        Text('Kolekte ${amount.toInt()} HTG', style: const TextStyle(color: Color(0xFF92400E), fontSize: 15, fontWeight: FontWeight.w900)),
      ]))]),
  );

  Widget _routeCard(Mission mission) => Container(
    decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: DriverConstants.borderLight)),
    child: Column(children: [
      // Merchant row
      Padding(padding: const EdgeInsets.all(14), child: Row(children: [
        Container(width: 36, height: 36, decoration: BoxDecoration(color: DriverConstants.primaryCrimson.withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(Icons.storefront_rounded, color: DriverConstants.primaryCrimson, size: 18)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('REKIPERE NAN', style: TextStyle(color: DriverConstants.textMuted, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          Text(mission.merchantName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: DriverConstants.textDark)),
          Text(mission.merchantAddress, style: const TextStyle(fontSize: 12, color: DriverConstants.textMuted)),
        ])),
      ])),
      // Distance divider
      Padding(padding: const EdgeInsets.symmetric(horizontal: 14), child: Row(children: [
        const SizedBox(width: 18), Container(width: 1, height: 16, color: const Color(0xFFDDE3ED)), const SizedBox(width: 16),
        if (mission.distanceKm > 0) Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFBFDBFE))),
          child: Text('${mission.distanceKm.toStringAsFixed(1)} km', style: const TextStyle(color: Color(0xFF1D4ED8), fontSize: 11, fontWeight: FontWeight.bold))),
      ])),
      // Customer row
      Padding(padding: const EdgeInsets.all(14), child: Row(children: [
        Container(width: 36, height: 36, decoration: BoxDecoration(color: const Color(0xFF1E3A8A).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(Icons.location_on_rounded, color: Color(0xFF1E3A8A), size: 18)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('LIVRE BAY', style: TextStyle(color: Color(0xFF1E3A8A), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          Text(mission.customerName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: DriverConstants.textDark)),
          Text(mission.customerAddress, style: const TextStyle(fontSize: 12, color: DriverConstants.textMuted)),
          if (mission.customerLandmark != null && mission.customerLandmark!.isNotEmpty)
            Padding(padding: const EdgeInsets.only(top: 2), child: Text('📍 ${mission.customerLandmark!}', style: const TextStyle(fontSize: 11, color: Color(0xFFB45309), fontWeight: FontWeight.bold))),
        ])),
      ])),
    ]),
  );

  void _confirmLogout() {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: DriverConstants.borderLight)),
      title: const Text('Dekonekte', style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold)),
      content: const Text('Eske w seten ou vle soti nan kont kousye w la?', style: TextStyle(color: DriverConstants.textMuted)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Anile', style: TextStyle(color: Colors.grey))),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: DriverConstants.primaryCrimson, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
          onPressed: () async {
            Navigator.pop(ctx); await _stopGpsTracking(); DriverSocketService().disconnect();
            await ref.read(driverApiProvider).logout();
            ref.read(currentDriverProfileProvider.notifier).setProfile(null);
            if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverLoginScreen()));
          }, child: const Text('Wi, Dekonekte')),
      ],
    ));
  }

  String _getMerchantEmoji(String? type) { final t = (type ?? '').toUpperCase(); if (t == 'PHARMACY') return '💊'; if (t == 'CONSTRUCTION') return '🧱'; if (t == 'SUPERMARKET' || t == 'GROCERY') return '🛒'; if (t == 'BAKERY') return '🥖'; return '🍽️'; }
  String _getMerchantPlaceLabel(String? type) { final t = (type ?? '').toUpperCase(); if (t == 'PHARMACY') return 'famasi a'; if (t == 'CONSTRUCTION') return 'depo materyo a'; if (t == 'SUPERMARKET' || t == 'GROCERY') return 'makèt la'; if (t == 'BAKERY') return 'boulanjri a'; return 'restoran an'; }

  void _showOrderItemsSheet(Mission mission) {
    final emoji = _getMerchantEmoji(mission.merchantType);
    final placeLabel = _getMerchantPlaceLabel(mission.merchantType);
    final Set<String> checked = {};
    showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => FutureBuilder<List<MissionItem>>(
        future: mission.items.isNotEmpty ? Future.value(mission.items) : DriverApiService().getOrderItems(mission.orderId),
        builder: (ctx, snapshot) {
          final items = snapshot.data ?? mission.items;
          final loading = snapshot.connectionState == ConnectionState.waiting && items.isEmpty;
          return Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.85),
            decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
            padding: const EdgeInsets.only(left: 20, right: 20, top: 16, bottom: 24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Center(child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 14),
              Row(children: [
                Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFFFEDD5))), child: Text(emoji, style: const TextStyle(fontSize: 24))),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Verifye Komand #${mission.orderNumber}', style: const TextStyle(color: DriverConstants.textDark, fontSize: 17, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
                  Text('Koche chak atik avan w kite $placeLabel', style: const TextStyle(color: DriverConstants.textMuted, fontSize: 12)),
                ])),
                IconButton(icon: const Icon(Icons.close, color: DriverConstants.textMuted), onPressed: () => Navigator.pop(ctx)),
              ]),
              const SizedBox(height: 14),
              const Divider(height: 1, color: DriverConstants.borderLight),
              const SizedBox(height: 12),
              if (loading) const Padding(padding: EdgeInsets.symmetric(vertical: 36), child: Center(child: CircularProgressIndicator(color: DriverConstants.primaryCrimson)))
              else if (items.isEmpty) Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: const Color(0xFFF8F9FA), borderRadius: BorderRadius.circular(14), border: Border.all(color: DriverConstants.borderLight)),
                child: Row(children: [const Icon(Icons.inventory_2_outlined, color: DriverConstants.textMuted), const SizedBox(width: 10), Expanded(child: Text(mission.itemsDescription.isNotEmpty ? mission.itemsDescription : 'Pa gen detay atik.', style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w600)))]))
              else Flexible(child: ListView.separated(
                shrinkWrap: true, itemCount: items.length, separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, idx) {
                  final item = items[idx]; final k = item.id.isNotEmpty ? item.id : '$idx-${item.name}'; final isC = checked.contains(k);
                  return InkWell(onTap: () => setSt(() { if (isC) { checked.remove(k); } else { checked.add(k); } }), borderRadius: BorderRadius.circular(14),
                    child: AnimatedContainer(duration: const Duration(milliseconds: 200), padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: isC ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14), border: Border.all(color: isC ? DriverConstants.neonGreen : DriverConstants.borderLight, width: isC ? 1.5 : 1)),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(width: 24, height: 24, decoration: BoxDecoration(color: isC ? DriverConstants.neonGreen : Colors.white, shape: BoxShape.circle, border: Border.all(color: isC ? DriverConstants.neonGreen : DriverConstants.borderLight, width: 1.5)), child: isC ? const Icon(Icons.check, size: 16, color: Colors.white) : null),
                        const SizedBox(width: 10),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: isC ? DriverConstants.neonGreen.withValues(alpha: 0.15) : DriverConstants.primaryCrimson.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                          child: Text('${item.quantity}x', style: TextStyle(color: isC ? DriverConstants.neonGreen : DriverConstants.primaryCrimson, fontWeight: FontWeight.w900, fontSize: 12))),
                        const SizedBox(width: 10),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(item.name, style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.bold, fontSize: 14, decoration: isC ? TextDecoration.lineThrough : null)),
                          if (item.instructions != null && item.instructions!.isNotEmpty) ...[const SizedBox(height: 2), Text('📝 ${item.instructions}', style: const TextStyle(color: Color(0xFFD97706), fontSize: 11))],
                        ])),
                        if (item.totalPrice > 0) Text('${item.totalPrice.toInt()} HTG', style: const TextStyle(color: DriverConstants.textDark, fontSize: 13, fontWeight: FontWeight.w800)),
                      ])));
                },
              )),
              const SizedBox(height: 12),
              if (mission.customerNote != null && mission.customerNote!.isNotEmpty)
                Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFCD34D))),
                  child: Row(children: [const Icon(Icons.info_outline, color: Color(0xFFB45309), size: 16), const SizedBox(width: 8), Expanded(child: Text('Not Kliyan: ${mission.customerNote}', style: const TextStyle(color: Color(0xFF92400E), fontSize: 12, fontWeight: FontWeight.w600)))])),
              SizedBox(width: double.infinity, child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: (items.isNotEmpty && checked.length == items.length) ? DriverConstants.neonGreen : DriverConstants.primaryCrimson, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                onPressed: () => Navigator.pop(ctx),
                child: Text(items.isNotEmpty ? 'VERIFYE (${checked.length}/${items.length} OK)' : 'MWEN VERIFYE TOUT BAGAY OK', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)))),
            ]),
          );
        },
      )));
  }

  void _showQuickContactDialog(String name, String phone,
      {double? lat, double? lng}) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(22),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          Text('Kontakte: $name', style: const TextStyle(color: DriverConstants.textDark, fontSize: 18, fontWeight: FontWeight.w900)),
          Text(phone, style: const TextStyle(color: DriverConstants.textMuted, fontSize: 14)),
          const SizedBox(height: 18),
          // ── Rele + WhatsApp ───────────────────────────────────────
          Row(children: [
            Expanded(child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: DriverConstants.primaryCrimson, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
              icon: const Icon(Icons.phone), label: const Text('Rele', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: () { Navigator.pop(ctx); DriverNavigationService().callPhone(phone); })),
            const SizedBox(width: 12),
            Expanded(child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF25D366), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
              icon: const Icon(Icons.chat), label: const Text('WhatsApp', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: () { Navigator.pop(ctx); DriverNavigationService().openWhatsApp(phone, message: 'Bonjou, mwen se chofè Delivery Haïti w ap tann nan. Mwen ap rive nan kèk minit.'); })),
          ]),
          // ── Navigasyon GPS (si koordinè disponib) ────────────────
          if (lat != null && lng != null) ...[
            const SizedBox(height: 10),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 12),
            const Text('Navige', style: TextStyle(color: DriverConstants.textMuted, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFF1A73E8)), foregroundColor: const Color(0xFF1A73E8), padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                icon: const Icon(Icons.map_outlined, size: 18), label: const Text('Google Maps', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                onPressed: () { Navigator.pop(ctx); DriverNavigationService().openGoogleMaps(lat, lng); })),
              const SizedBox(width: 10),
              Expanded(child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFF05C8F7)), foregroundColor: const Color(0xFF05C8F7), padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                icon: const Icon(Icons.navigation_outlined, size: 18), label: const Text('Waze', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                onPressed: () { Navigator.pop(ctx); DriverNavigationService().openWaze(lat, lng); })),
            ]),
          ],
        ]),
      ));
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final isOnline = ref.watch(driverStatusProvider);
    final activeMission = ref.watch(activeMissionProvider);
    final profile = ref.watch(currentDriverProfileProvider);

    return Scaffold(
      key: _scaffoldKey,
      drawer: DriverProfileDrawer(onLogout: _confirmLogout),
      body: Stack(children: [
        Positioned.fill(child: DriverLiveMapWidget(
          currentPosition: _currentGpsPosition,
          pickupLocation: activeMission?.pickupLocation,
          dropoffLocation: activeMission?.dropoffLocation,
          merchantName: activeMission?.merchantName,
          customerName: activeMission?.customerName,
          customerAddress: activeMission?.customerAddress,
          customerLandmark: activeMission?.customerLandmark ?? activeMission?.customerNote,
          isPickedUp: activeMission?.isPickedUp ?? false,
          routePoints: activeMission != null ? _getRoutePoints(activeMission) : null,
          isTracking: _isGpsActive, isFullScreen: true,
          showHotspots: isOnline && activeMission == null)),
        Positioned(top: 0, left: 0, right: 0,
          child: SafeArea(child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              _buildTopHudBar(profile, isOnline),
              if (_gpsErrorMessage != null) ...[const SizedBox(height: 6),
                Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFCA5A5))),
                  child: Row(children: [const Icon(Icons.location_off, color: Color(0xFFDC2626), size: 16), const SizedBox(width: 8), Expanded(child: Text(_gpsErrorMessage!, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 11, fontWeight: FontWeight.w600)))]))],
            ])))),
        Positioned(bottom: 0, left: 0, right: 0, child: _buildBottomPanel(isOnline, activeMission)),
      ]),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TOP HUD BAR
  // ─────────────────────────────────────────────────────────────────────────────
  Widget _buildTopHudBar(DriverUserProfile? profile, bool isOnline) {
    final name = (profile != null && profile.fullName.isNotEmpty) ? profile.fullName : 'Mackby Wise';
    final firstName = name.split(' ').first;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'M';
    final balance = profile?.walletBalance ?? 6635.0;

    return GlassContainer(
      borderRadius: BorderRadius.circular(20),
      surfaceColor: Colors.white.withValues(alpha: 0.97),
      border: Border.all(color: DriverConstants.borderLight),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      child: Row(children: [
        GestureDetector(
          onTap: () => _scaffoldKey.currentState?.openDrawer(),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Stack(children: [
              Container(width: 40, height: 40,
                decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFEB1700), Color(0xFFFF5630)], begin: Alignment.topLeft, end: Alignment.bottomRight), shape: BoxShape.circle),
                child: Center(child: Text(initial, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)))),
              Positioned(bottom: 0, right: 0, child: Container(width: 13, height: 13,
                decoration: BoxDecoration(shape: BoxShape.circle, color: isOnline ? DriverConstants.neonGreen : const Color(0xFF9CA3AF), border: Border.all(color: Colors.white, width: 2)))),
            ]),
            const SizedBox(width: 9),
            Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text(firstName, style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w900, fontSize: 13)),
              Text(isOnline ? 'AN LIG • OKAP' : 'HOS LIG', style: TextStyle(color: isOnline ? DriverConstants.neonGreen : const Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.bold)),
            ]),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down_rounded, color: DriverConstants.textMuted, size: 18),
          ])),
        const Spacer(),
        // Online toggle
        GestureDetector(
          onTap: _toggleOnlineStatus,
          child: AnimatedContainer(duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(color: isOnline ? DriverConstants.neonGreen : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              if (isOnline) AnimatedBuilder(animation: _pulseController, builder: (ctx, _) => Container(width: 8, height: 8,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white, boxShadow: [BoxShadow(color: Colors.white.withValues(alpha: 0.8 * _pulseController.value), blurRadius: 6 * _pulseController.value)])))
              else const Icon(Icons.power_settings_new, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 6),
              Text(isOnline ? 'AN LIG' : 'AKTIVE', style: TextStyle(color: isOnline ? Colors.white : const Color(0xFF6B7280), fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5)),
            ]))),
        const SizedBox(width: 8),
        // Wallet
        GestureDetector(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverWalletScreen())),
          child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: DriverConstants.borderLight)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.account_balance_wallet_rounded, size: 14, color: DriverConstants.primaryCrimson),
              const SizedBox(width: 5),
              Text('${balance.toInt()} G', style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w900, fontSize: 12)),
            ]))),
      ]),
    );
  }

  List<LatLng> _getRoutePoints(Mission mission) {
    if ((mission.pickupLatitude - 19.7625).abs() < 0.001 && (mission.dropoffLatitude - 19.7594).abs() < 0.001) return _demoRoutePoints;
    final dp = _currentGpsPosition != null ? LatLng(_currentGpsPosition!.latitude, _currentGpsPosition!.longitude) : null;
    if (!mission.isPickedUp) { final pts = <LatLng>[]; if (dp != null) pts.add(dp); pts.add(mission.pickupLocation); pts.add(mission.dropoffLocation); return pts; }
    else { final pts = <LatLng>[]; if (dp != null) pts.add(dp); pts.add(mission.dropoffLocation); return pts; }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BOTTOM PANEL
  // ─────────────────────────────────────────────────────────────────────────────
  Widget _buildBottomPanel(bool isOnline, Mission? mission) {
    return Container(
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.only(topLeft: Radius.circular(28), topRight: Radius.circular(28)), boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 24, offset: Offset(0, -4))]),
      child: SafeArea(top: false, child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Center(child: Container(width: 38, height: 4, decoration: BoxDecoration(color: const Color(0xFFDDE3ED), borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 14),
          if (mission != null) _buildActiveMissionPanel(mission)
          else if (isOnline) _buildOnlinePanel()
          else _buildOfflinePanel(),
        ]))));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OFFLINE PANEL
  // ─────────────────────────────────────────────────────────────────────────────
  Widget _buildOfflinePanel() => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
    Row(children: [
      Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
        child: const Icon(Icons.power_settings_new, color: Color(0xFF6B7280), size: 20)),
      const SizedBox(width: 12),
      const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('OU HOS LIG KOUNYE A', style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.3)),
        Text('Aktive rada a pou komanse resevwa kous', style: TextStyle(color: DriverConstants.textMuted, fontSize: 12)),
      ])),
      Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
        child: const Text('Okap · No', style: TextStyle(color: DriverConstants.textMuted, fontSize: 11, fontWeight: FontWeight.bold))),
    ]),
    const SizedBox(height: 14),
    _buildStatsRow(),
    const SizedBox(height: 14),
    SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _toggleOnlineStatus,
      style: ElevatedButton.styleFrom(backgroundColor: DriverConstants.primaryCrimson, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 17), elevation: 4, shadowColor: DriverConstants.primaryCrimson.withValues(alpha: 0.35), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
      child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.radar, size: 22), SizedBox(width: 10), Flexible(child: Text('AKTIVE RADA — KOMANSE RESEVWA KOUS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.3)))]))),
    const SizedBox(height: 6),
    Center(child: TextButton.icon(onPressed: _triggerDemoMission, icon: const Icon(Icons.bolt, size: 14, color: Color(0xFFD97706)), label: const Text('Tes yon kous demo', style: TextStyle(color: Color(0xFFD97706), fontSize: 12, fontWeight: FontWeight.bold)))),
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ONLINE PANEL
  // ─────────────────────────────────────────────────────────────────────────────
  Widget _buildOnlinePanel() => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
    Row(children: [
      AnimatedBuilder(animation: _pulseController, builder: (ctx, _) => Container(width: 42, height: 42,
        decoration: BoxDecoration(shape: BoxShape.circle, color: DriverConstants.neonGreen.withValues(alpha: 0.12),
          boxShadow: [BoxShadow(color: DriverConstants.neonGreen.withValues(alpha: 0.3 * _pulseController.value), blurRadius: 14 * _pulseController.value, spreadRadius: 2 * _pulseController.value)]),
        child: const Center(child: Icon(Icons.radar, color: DriverConstants.neonGreen, size: 22)))),
      const SizedBox(width: 12),
      const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('RADA AN LIG — AP CHÈCHE...', style: TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.3)),
        Text('Ou ap resevwa alèt otomatikman kou kous disponib', style: TextStyle(color: DriverConstants.textMuted, fontSize: 12)),
      ])),
    ]),
    const SizedBox(height: 12),
    _buildHotspotRow(),
    const SizedBox(height: 12),
    _buildStatsRow(),
    const SizedBox(height: 12),
    SizedBox(width: double.infinity, child: OutlinedButton.icon(style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5), foregroundColor: DriverConstants.textMuted, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))), icon: const Icon(Icons.pause_circle_outline, size: 18), label: const Text('Mete Poz — Hos Lig', style: TextStyle(fontWeight: FontWeight.bold)), onPressed: _toggleOnlineStatus)),
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE MISSION PANEL
  // ─────────────────────────────────────────────────────────────────────────────
  Widget _buildActiveMissionPanel(Mission mission) {
    final isPickedUp = mission.isPickedUp;
    final sc = isPickedUp ? DriverConstants.neonGreen : DriverConstants.primaryCrimson;
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      // Step header
      Container(padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: isPickedUp ? [DriverConstants.neonGreen.withValues(alpha: 0.12), DriverConstants.neonGreen.withValues(alpha: 0.03)] : [DriverConstants.primaryCrimson.withValues(alpha: 0.1), DriverConstants.primaryCrimson.withValues(alpha: 0.03)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(16), border: Border.all(color: sc.withValues(alpha: 0.25))),
        child: Row(children: [
          Container(width: 44, height: 44, decoration: BoxDecoration(color: sc, shape: BoxShape.circle), child: Center(child: Text(isPickedUp ? '2' : '1', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(isPickedUp ? 'ETAP 2 / 2 — LIVRE' : 'ETAP 1 / 2 — REKIPERE', style: TextStyle(color: sc, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5)),
            const SizedBox(height: 2),
            Text(isPickedUp ? mission.customerName : mission.merchantName, style: const TextStyle(color: DriverConstants.textDark, fontWeight: FontWeight.w900, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(isPickedUp ? mission.customerAddress : mission.merchantAddress, style: const TextStyle(color: DriverConstants.textMuted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _showQuickContactDialog(
              isPickedUp ? mission.customerName : mission.merchantName,
              isPickedUp ? mission.customerPhone : '+509 3700 0000',
              lat: isPickedUp ? mission.dropoffLatitude  : mission.pickupLatitude,
              lng: isPickedUp ? mission.dropoffLongitude : mission.pickupLongitude,
            ),
            child: Container(width: 40, height: 40, decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: sc.withValues(alpha: 0.3))), child: Icon(Icons.phone_rounded, color: sc, size: 18))),
        ])),
      const SizedBox(height: 10),
      _buildExpandableBubble(icon: isPickedUp ? Icons.person_pin_circle_rounded : Icons.storefront_rounded,
        title: isPickedUp ? 'LIVRE BAY: ${mission.customerName.toUpperCase()}' : 'REKIPERE NAN: ${mission.merchantName.toUpperCase()}',
        subtitle: isPickedUp ? mission.customerAddress : mission.merchantAddress,
        badge: '+${mission.totalDriverEarnings.toInt()} HTG',
        accentColor: sc, isExpanded: _isStepBubbleExpanded, isActive: true,
        onToggle: () => setState(() => _isStepBubbleExpanded = !_isStepBubbleExpanded),
        body: _buildStepBody(mission, isPickedUp)),
      const SizedBox(height: 14),
      ElevatedButton(
        style: ElevatedButton.styleFrom(backgroundColor: sc, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 17), elevation: 4, shadowColor: sc.withValues(alpha: 0.35), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
        onPressed: () async {
          final sm = ScaffoldMessenger.of(context);
          final ok = await ref.read(activeMissionProvider.notifier).progressMission();
          if (!mounted) return;
          DriverAlertService().playSuccessChime();
          if (!ok) {
            // Ofline: mete aksyon an nan kèk pou senkronize pita (fire & forget)
            unawaited(DriverOfflineQueue().enqueue(
              type: isPickedUp ? 'DELIVERY' : 'PICKUP',
              orderId: mission.orderId,
            ));
          }
          if (isPickedUp) {
            sm.showSnackBar(SnackBar(
              content: Text(ok ? 'Livrezon konfime! +${mission.totalDriverEarnings.toInt()} HTG nan bous ou.' : 'Livrezon anrejistre ofline — y ap senkronize kou koneksyon revi.'),
              backgroundColor: DriverConstants.neonGreen, behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), duration: const Duration(seconds: 4)));
          } else {
            sm.showSnackBar(SnackBar(
              content: Text('Pake rekipere${ok ? '' : ' (ofline)'}! Ale livre bay ${mission.customerName}.'),
              backgroundColor: DriverConstants.primaryCrimson, behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), duration: const Duration(seconds: 3)));
          }
        },
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(isPickedUp ? '✅' : '🛍️', style: const TextStyle(fontSize: 18)), const SizedBox(width: 10),
          Flexible(child: Text(isPickedUp ? 'KONFIME LIVREZON AN FINI' : 'MWEN REKIPERE PAKE A', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.3), overflow: TextOverflow.ellipsis)),
        ])),
      const SizedBox(height: 4),
      Center(child: TextButton.icon(
        onPressed: () { ref.read(activeMissionProvider.notifier).clearMission(); DriverSocketService().setActiveOrderId(null); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Kous la retire.'), backgroundColor: const Color(0xFF1E293B), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), duration: const Duration(seconds: 2))); },
        icon: const Icon(Icons.close_rounded, size: 14, color: Colors.grey), label: const Text('Retire kous sa a', style: TextStyle(color: Colors.grey, fontSize: 12)))),
    ]);
  }

  Widget _buildStepBody(Mission mission, bool isPickedUp) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
    if (isPickedUp && mission.isCashOnDelivery) ...[_cashBanner(mission.totalOrderAmount), const SizedBox(height: 10)],
    if (mission.customerNote != null && mission.customerNote!.isNotEmpty && isPickedUp) ...[
      Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFFCD34D))),
        child: Row(children: [const Icon(Icons.info_outline, color: Color(0xFFB45309), size: 15), const SizedBox(width: 8), Expanded(child: Text('Repè: ${mission.customerNote}', style: const TextStyle(color: Color(0xFF92400E), fontSize: 12, fontWeight: FontWeight.w600)))])),
      const SizedBox(height: 10),
    ],
    if (mission.customerLandmark != null && mission.customerLandmark!.isNotEmpty && isPickedUp) ...[
      Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFBBF7D0))),
        child: Row(children: [const Text('📍', style: TextStyle(fontSize: 14)), const SizedBox(width: 8), Expanded(child: Text(mission.customerLandmark!, style: const TextStyle(color: Color(0xFF166534), fontSize: 12, fontWeight: FontWeight.bold)))])),
      const SizedBox(height: 10),
    ],
    Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFBFDBFE))),
      child: Row(children: [const Icon(Icons.location_on, size: 14, color: Color(0xFF1D4ED8)), const SizedBox(width: 6),
        Expanded(child: Text(isPickedUp ? 'GPS: ${mission.dropoffLatitude.toStringAsFixed(4)}, ${mission.dropoffLongitude.toStringAsFixed(4)}' : 'GPS: ${mission.pickupLatitude.toStringAsFixed(4)}, ${mission.pickupLongitude.toStringAsFixed(4)}', style: const TextStyle(fontSize: 11, color: Color(0xFF1D4ED8), fontWeight: FontWeight.bold))),
        GestureDetector(onTap: () => _showQuickContactDialog(isPickedUp ? mission.customerName : mission.merchantName, isPickedUp ? mission.customerPhone : '+509 3700 0000'), child: const Text('📞', style: TextStyle(fontSize: 16)))])),
    const SizedBox(height: 10),
    GestureDetector(onTap: () => _showOrderItemsSheet(mission),
      child: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFFEDD5))),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(7), decoration: BoxDecoration(color: DriverConstants.primaryCrimson.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.checklist_rtl, color: DriverConstants.primaryCrimson, size: 16)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('VERIFYE ATIK YO', style: TextStyle(color: DriverConstants.primaryCrimson, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
            Text(mission.itemsDescription, style: const TextStyle(color: DriverConstants.textDark, fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: DriverConstants.primaryCrimson, borderRadius: BorderRadius.circular(8)), child: const Text('WÈ', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900))),
        ]))),
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPANDABLE BUBBLE
  // ─────────────────────────────────────────────────────────────────────────────
  Widget _buildExpandableBubble({required IconData icon, required String title, required String subtitle, required String? badge, required Color accentColor, required bool isExpanded, required VoidCallback onToggle, required Widget body, bool isActive = false}) {
    return AnimatedContainer(duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: isActive && !isExpanded ? accentColor.withValues(alpha: 0.04) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isExpanded ? accentColor.withValues(alpha: 0.35) : (isActive ? accentColor.withValues(alpha: 0.2) : DriverConstants.borderLight), width: isActive ? 1.5 : 1.0)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        InkWell(onTap: onToggle, borderRadius: BorderRadius.circular(16),
          child: Padding(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(children: [
              Container(width: 38, height: 38, decoration: BoxDecoration(color: accentColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: accentColor, size: 19)),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Flexible(child: Text(title, style: TextStyle(color: isActive ? accentColor : DriverConstants.textDark, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.2), overflow: TextOverflow.ellipsis)),
                  if (badge != null) ...[const SizedBox(width: 6), Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2), decoration: BoxDecoration(color: accentColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)), child: Text(badge, style: TextStyle(color: accentColor, fontSize: 10, fontWeight: FontWeight.w900)))],
                ]),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: DriverConstants.textMuted, fontSize: 11), overflow: TextOverflow.ellipsis),
              ])),
              const SizedBox(width: 8),
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: isExpanded ? accentColor.withValues(alpha: 0.1) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(isExpanded ? 'Kache' : 'Wè', style: TextStyle(color: isExpanded ? accentColor : DriverConstants.textMuted, fontSize: 10, fontWeight: FontWeight.w900)),
                  const SizedBox(width: 2),
                  Icon(isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, size: 14, color: isExpanded ? accentColor : DriverConstants.textMuted),
                ])),
            ]))),
        AnimatedCrossFade(duration: const Duration(milliseconds: 220),
          crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          firstChild: const SizedBox.shrink(),
          secondChild: Column(children: [const Divider(height: 1, indent: 14, endIndent: 14, color: DriverConstants.borderLight), Padding(padding: const EdgeInsets.fromLTRB(14, 12, 14, 14), child: body)])),
      ]));
  }

  Widget _buildStatsRow() => Row(children: [
    Expanded(child: _kpi('43', '🏍️ Kous Fini', DriverConstants.primaryCrimson)),
    const SizedBox(width: 8),
    Expanded(child: _kpi('6,635 G', '💰 Bous', DriverConstants.neonGreen)),
    const SizedBox(width: 8),
    Expanded(child: _kpi('5.0 ⭐', '📊 Nòt', DriverConstants.goldAccent)),
  ]);

  Widget _kpi(String v, String l, Color c) => Container(padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
    decoration: BoxDecoration(color: c.withValues(alpha: 0.07), borderRadius: BorderRadius.circular(14), border: Border.all(color: c.withValues(alpha: 0.2))),
    child: Column(children: [Text(v, style: TextStyle(color: c, fontWeight: FontWeight.w900, fontSize: 14)), const SizedBox(height: 2), Text(l, style: const TextStyle(color: DriverConstants.textMuted, fontSize: 10), textAlign: TextAlign.center)]));

  Widget _buildHotspotRow() => SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
    _pill('🔥 Bodme (+50 G)', const Color(0xFFD97706)), const SizedBox(width: 6),
    _pill('🔥 Santvil (+75 G)', const Color(0xFFEA580C)), const SizedBox(width: 6),
    _pill('🔥 Carenage (+40 G)', const Color(0xFFDC2626)),
  ]));

  Widget _pill(String t, Color c) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(color: c.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(20), border: Border.all(color: c.withValues(alpha: 0.3))),
    child: Text(t, style: TextStyle(color: c, fontSize: 12, fontWeight: FontWeight.bold)));
}
