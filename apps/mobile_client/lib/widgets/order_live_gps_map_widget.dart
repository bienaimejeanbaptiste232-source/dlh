import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../config/constants.dart';
import '../config/store_type_config.dart';
import '../services/client_tracking_socket_service.dart';

class OrderLiveGpsMapWidget extends StatefulWidget {
  final String orderId;
  final String status;
  final String merchantName;
  final String? merchantCategory;
  final String customerAddress;
  final LatLng restaurantLocation;
  final LatLng deliveryLocation;
  final String? driverName;
  final String? driverPlate;

  const OrderLiveGpsMapWidget({
    super.key,
    required this.orderId,
    required this.status,
    required this.merchantName,
    this.merchantCategory,
    required this.customerAddress,
    required this.restaurantLocation,
    required this.deliveryLocation,
    this.driverName,
    this.driverPlate,
  });

  @override
  State<OrderLiveGpsMapWidget> createState() => _OrderLiveGpsMapWidgetState();
}

class _OrderLiveGpsMapWidgetState extends State<OrderLiveGpsMapWidget> {
  final MapController _mapController = MapController();
  final _socketService = ClientTrackingSocketService();

  LatLng? _driverLocation;
  double _driverHeading = 0.0;
  double? _distanceKm;
  int? _etaMinutes;
  DateTime? _lastUpdateTime;
  bool _isDriverOnline = false;
  List<LatLng> _routePoints = [];

  Stream<DeliveryLocationUpdate>? _locationStream;

  @override
  void initState() {
    super.initState();
    // Connecter au socket WebSocket et souscrire à la commande
    final wsUrl = AppConstants.apiBaseUrl.replaceAll('/api/v1', '');
    _socketService.connect(
      serverUrl: wsUrl,
    );
    _socketService.subscribeToDelivery(widget.orderId);

    _locationStream = _socketService.onLocationUpdate;
    _locationStream!.listen((update) {
      if (update.deliveryId == widget.orderId && mounted) {
        setState(() {
          _driverLocation = LatLng(update.latitude, update.longitude);
          _driverHeading = update.heading ?? _driverHeading;
          _distanceKm = update.distanceRemainingKm ?? _distanceKm;
          _etaMinutes = update.durationMinutes ?? _etaMinutes;
          _lastUpdateTime = update.timestamp;
          _isDriverOnline = true;

          if (update.routePolyline != null && update.routePolyline!.isNotEmpty) {
            _routePoints = update.routePolyline!.map((pt) {
              if (pt is Map) {
                return LatLng((pt['latitude'] as num).toDouble(), (pt['longitude'] as num).toDouble());
              }
              return const LatLng(0, 0);
            }).where((pt) => pt.latitude != 0).toList();
          }
        });

        // Déplacer doucement la caméra pour garder le livreur et la cible visibles
        if (_driverLocation != null) {
          _mapController.move(_driverLocation!, _mapController.camera.zoom);
        }
      }
    });
  }

  @override
  void dispose() {
    _socketService.unsubscribeFromDelivery(widget.orderId);
    super.dispose();
  }

  String _formatStatusLabel(String status) {
    final store = StoreTypeConfig.from(
      category: widget.merchantCategory,
      merchantName: widget.merchantName,
    );
    switch (status) {
      case 'DRIVER_ASSIGNED':
        return 'Livrè asiyen, li prè pou deplase';
      case 'DRIVER_ARRIVING':
        return 'Livrè a sou wout pou rive nan ${store.storeNoun} an';
      case 'READY_FOR_PICKUP':
        return 'Livrè a rive nan ${store.storeNoun} an, ap pran pake a';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'Livrè a rekipere pake a, li sou wout lakay ou';
      case 'DELIVERED':
        return 'Kòmand lan fin livre';
      default:
        return '${store.storeNoun} an ap prepare kòmand lan';
    }
  }

  String _getLastUpdatedLabel() {
    if (_lastUpdateTime == null) return 'Koneksyon ap tann...';
    final diff = DateTime.now().difference(_lastUpdateTime!).inSeconds;
    if (diff < 10) return 'Mizajou: Kounye a';
    if (diff < 60) return 'Mizajou: ${diff}s pase';
    return 'Dènye siyal: ${(diff / 60).round()} min pase';
  }

  @override
  Widget build(BuildContext context) {
    // Configuration dynamique selon le type de boutique (Pharmacie, Quincaillerie, etc.)
    final storeConfig = StoreTypeConfig.from(
      category: widget.merchantCategory,
      merchantName: widget.merchantName,
    );

    // Calcul du centre initial
    final center = _driverLocation ?? widget.restaurantLocation;

    return Container(
      height: 300,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        boxShadow: const [
          BoxShadow(
            color: Colors.black45,
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: 14.5,
              minZoom: 11.0,
              maxZoom: 18.0,
            ),
            children: [
              // Tuiles OpenStreetMap
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.mackbest1.delivery_client',
              ),

              // Tracé de l'itinéraire vers la destination
              if (_routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 4.5,
                      color: AppConstants.primaryCrimson,
                      borderStrokeWidth: 2.0,
                      borderColor: Colors.white30,
                    ),
                  ],
                ),

              // Marqueurs interactifs
              MarkerLayer(
                markers: [
                  // 1. Marqueur Boutique / Komèsan
                  Marker(
                    point: widget.restaurantLocation,
                    width: 44,
                    height: 44,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: storeConfig.primaryColor,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                          ),
                          child: Icon(storeConfig.icon, color: Colors.white, size: 18),
                        ),
                      ],
                    ),
                  ),

                  // 2. Marqueur Adresse Client
                  Marker(
                    point: widget.deliveryLocation,
                    width: 44,
                    height: 44,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                          ),
                          child: const Icon(Icons.home_rounded, color: Colors.white, size: 18),
                        ),
                      ],
                    ),
                  ),

                  // 3. Marqueur Livreur Moto (Mobile temps réel)
                  if (_driverLocation != null)
                    Marker(
                      point: _driverLocation!,
                      width: 50,
                      height: 50,
                      child: Transform.rotate(
                        angle: _driverHeading * (math.pi / 180),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppConstants.primaryCrimson.withValues(alpha: 0.25),
                              ),
                            ),
                            Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                shape: BoxShape.circle,
                                border: Border.all(color: AppConstants.primaryCrimson, width: 2.5),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppConstants.primaryCrimson.withValues(alpha: 0.5),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.two_wheeler_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),

          // En-tête Flottant (ETA & Distance Restante)
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 8)],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppConstants.primaryCrimson.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.timer_outlined, color: AppConstants.primaryCrimson, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _etaMinutes != null ? 'Ap rive nan ~$_etaMinutes min' : 'Ap kalkile tan kous la...',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _distanceKm != null
                              ? 'Distans: ${_distanceKm!.toStringAsFixed(1)} km · ${_formatStatusLabel(widget.status)}'
                              : _formatStatusLabel(widget.status),
                          style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isDriverOnline ? const Color(0xFF10B981) : Colors.amber,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Pied de Carte : Indicateur Dernière Position & Recadrer
          Positioned(
            bottom: 12,
            left: 12,
            right: 12,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.88),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Text(
                    _getLastUpdatedLabel(),
                    style: TextStyle(color: Colors.grey[300], fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                FloatingActionButton.small(
                  heroTag: 'client_recenter_map',
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: AppConstants.primaryCrimson,
                  onPressed: () {
                    if (_driverLocation != null) {
                      _mapController.move(_driverLocation!, 15.0);
                    } else {
                      _mapController.move(widget.restaurantLocation, 14.5);
                    }
                  },
                  child: const Icon(Icons.my_location, size: 18),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
