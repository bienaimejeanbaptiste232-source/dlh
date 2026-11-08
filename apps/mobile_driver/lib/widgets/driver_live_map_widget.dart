import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../config/constants.dart';

class DriverLiveMapWidget extends StatefulWidget {
  final Position? currentPosition;
  final LatLng? pickupLocation;
  final LatLng? dropoffLocation;
  final String? merchantName;
  final String? customerName;
  final String? customerAddress;
  final String? customerLandmark;
  final bool isPickedUp;
  final List<LatLng>? routePoints;
  final bool isTracking;
  final bool isFullScreen;
  final bool showHotspots;
  final Widget? overlayTop;
  final Widget? overlayBottom;

  const DriverLiveMapWidget({
    super.key,
    required this.currentPosition,
    this.pickupLocation,
    this.dropoffLocation,
    this.merchantName,
    this.customerName,
    this.customerAddress,
    this.customerLandmark,
    this.isPickedUp = false,
    this.routePoints,
    this.isTracking = false,
    this.isFullScreen = false,
    this.showHotspots = false,
    this.overlayTop,
    this.overlayBottom,
  });

  @override
  State<DriverLiveMapWidget> createState() => _DriverLiveMapWidgetState();
}

class _DriverLiveMapWidgetState extends State<DriverLiveMapWidget> {
  final MapController _mapController = MapController();
  bool _hasInitialFitted = false;

  @override
  void didUpdateWidget(covariant DriverLiveMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.dropoffLocation != null &&
        (oldWidget.dropoffLocation != widget.dropoffLocation ||
            oldWidget.isPickedUp != widget.isPickedUp ||
            !_hasInitialFitted)) {
      _hasInitialFitted = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fitObjectiveBounds();
      });
    } else if (widget.currentPosition != null &&
        (oldWidget.currentPosition == null ||
            oldWidget.currentPosition!.latitude != widget.currentPosition!.latitude ||
            oldWidget.currentPosition!.longitude != widget.currentPosition!.longitude)) {
      if (widget.dropoffLocation == null) {
        _mapController.move(
          LatLng(widget.currentPosition!.latitude, widget.currentPosition!.longitude),
          _mapController.camera.zoom,
        );
      }
    }
  }

  void _fitObjectiveBounds() {
    final points = <LatLng>[];
    if (widget.currentPosition != null) {
      points.add(LatLng(widget.currentPosition!.latitude, widget.currentPosition!.longitude));
    }
    if (widget.pickupLocation != null && !widget.isPickedUp) {
      points.add(widget.pickupLocation!);
    }
    if (widget.dropoffLocation != null) {
      points.add(widget.dropoffLocation!);
    }

    if (points.length >= 2) {
      try {
        _mapController.fitCamera(
          CameraFit.bounds(
            bounds: LatLngBounds.fromPoints(points),
            padding: const EdgeInsets.only(top: 130, bottom: 220, left: 40, right: 40),
          ),
        );
      } catch (_) {
        if (widget.dropoffLocation != null) {
          _mapController.move(widget.dropoffLocation!, 15.5);
        }
      }
    } else if (widget.dropoffLocation != null) {
      _mapController.move(widget.dropoffLocation!, 16.0);
    }
  }

  void _centerOnCustomerObjective() {
    if (widget.dropoffLocation != null) {
      _mapController.move(widget.dropoffLocation!, 16.5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final center = widget.currentPosition != null
        ? LatLng(widget.currentPosition!.latitude, widget.currentPosition!.longitude)
        : const LatLng(19.7594, -72.2008);

    final headingDeg = widget.currentPosition?.heading ?? 0.0;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: widget.isFullScreen ? BorderRadius.zero : BorderRadius.circular(20),
        border: widget.isFullScreen ? null : Border.all(color: DriverConstants.borderLight),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: widget.dropoffLocation ?? center,
              initialZoom: 15.0,
              minZoom: 10.0,
              maxZoom: 18.0,
              onMapReady: () {
                if (widget.dropoffLocation != null) {
                  _fitObjectiveBounds();
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.mackbest1.delivery_driver',
              ),

              if (widget.routePoints != null && widget.routePoints!.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: widget.routePoints!,
                      strokeWidth: 4.5,
                      color: DriverConstants.primaryCrimson,
                      borderStrokeWidth: 2.0,
                      borderColor: Colors.black26,
                    ),
                  ],
                ),

              MarkerLayer(
                markers: [
                  // Marqueur Restaurant (Pickup) - Visible sitou nan Etap 1
                  if (widget.pickupLocation != null)
                    Marker(
                      point: widget.pickupLocation!,
                      width: widget.isPickedUp ? 36 : 130,
                      height: widget.isPickedUp ? 36 : 60,
                      alignment: Alignment.bottomCenter,
                      child: widget.isPickedUp
                          ? Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade600,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: const Icon(Icons.check, color: Colors.white, size: 16),
                            )
                          : Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: DriverConstants.primaryCrimson, width: 1.2),
                                    boxShadow: const [
                                      BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.storefront, size: 11, color: DriverConstants.primaryCrimson),
                                      const SizedBox(width: 3),
                                      Flexible(
                                        child: Text(
                                          widget.merchantName ?? 'Restoran',
                                          style: const TextStyle(
                                            color: DriverConstants.textDark,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Container(
                                  width: 30,
                                  height: 30,
                                  decoration: BoxDecoration(
                                    color: DriverConstants.primaryCrimson,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                    boxShadow: const [
                                      BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
                                    ],
                                  ),
                                  child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 16),
                                ),
                              ],
                            ),
                    ),

                  // 🎯 MARQUEUR CLIENT (DROPOFF)
                  if (widget.dropoffLocation != null)
                    Marker(
                      point: widget.dropoffLocation!,
                      width: widget.isPickedUp ? 170 : 36,
                      height: widget.isPickedUp ? 84 : 36,
                      alignment: Alignment.bottomCenter,
                      child: widget.isPickedUp
                          ? Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFF1E3A8A), width: 1.5),
                                    boxShadow: const [
                                      BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2)),
                                    ],
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF1E3A8A),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text(
                                              '🎯 KLIYAN',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 8,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Flexible(
                                            child: Text(
                                              widget.customerName ?? 'Kliyan',
                                              style: const TextStyle(
                                                color: DriverConstants.textDark,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (widget.customerLandmark != null && widget.customerLandmark!.isNotEmpty)
                                        Text(
                                          '📍 ${widget.customerLandmark!}',
                                          style: const TextStyle(
                                            color: Color(0xFFB45309),
                                            fontSize: 8,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E3A8A),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                    boxShadow: const [
                                      BoxShadow(color: Colors.black38, blurRadius: 6, offset: Offset(0, 2)),
                                    ],
                                  ),
                                  child: const Icon(Icons.location_on_rounded, color: Colors.white, size: 18),
                                ),
                              ],
                            )
                          : Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E3A8A),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: const [
                                  BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
                                ],
                              ),
                              child: const Icon(Icons.flag_rounded, color: Colors.white, size: 16),
                            ),
                    ),

                  // Zòn cho nan Okap (Hotspots White Badges) - sèlman lè chofè a pa gen kous
                  if (widget.showHotspots) ...[
                    Marker(
                      point: const LatLng(19.7635, -72.1980),
                      width: 120,
                      height: 30,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(color: const Color(0xFFFCD34D)),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('🔥', style: TextStyle(fontSize: 11)),
                            SizedBox(width: 3),
                            Text('Bòdmè (+50 G)', style: TextStyle(color: Color(0xFFB45309), fontSize: 10, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],

                  // Marqueur du Livreur Moto
                  if (widget.currentPosition != null)
                    Marker(
                      point: center,
                      width: 44,
                      height: 44,
                      child: Transform.rotate(
                        angle: headingDeg * (math.pi / 180),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: DriverConstants.neonGreen.withValues(alpha: 0.2),
                              ),
                            ),
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(color: DriverConstants.neonGreen, width: 2.5),
                                boxShadow: [
                                  BoxShadow(
                                    color: DriverConstants.neonGreen.withValues(alpha: 0.3),
                                    blurRadius: 6,
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.two_wheeler_rounded,
                                color: DriverConstants.neonGreen,
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

          // Boutons Flotants Kontwòl Kat la (Diskrè, pran piti plas)
          Positioned(
            bottom: widget.isFullScreen ? 180 : 12,
            right: 14,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.dropoffLocation != null) ...[
                  FloatingActionButton.small(
                    heroTag: 'target_objective_btn',
                    backgroundColor: const Color(0xFF1E3A8A),
                    foregroundColor: Colors.white,
                    elevation: 3,
                    tooltip: 'Santre sou Kliyan',
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onPressed: _centerOnCustomerObjective,
                    child: const Icon(Icons.gps_fixed_rounded, size: 18),
                  ),
                  const SizedBox(height: 8),
                  FloatingActionButton.small(
                    heroTag: 'fit_route_bounds_btn',
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1E3A8A),
                    elevation: 3,
                    tooltip: 'Wè tout wout la',
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: DriverConstants.borderLight),
                    ),
                    onPressed: _fitObjectiveBounds,
                    child: const Icon(Icons.route_rounded, size: 18),
                  ),
                  const SizedBox(height: 8),
                ],

                FloatingActionButton.small(
                  heroTag: 'recenter_gps_btn',
                  backgroundColor: Colors.white,
                  foregroundColor: DriverConstants.primaryCrimson,
                  elevation: 3,
                  tooltip: 'Pozisyon Mwen',
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: DriverConstants.borderLight),
                  ),
                  onPressed: () {
                    _mapController.move(center, 16.0);
                  },
                  child: const Icon(Icons.my_location, size: 18),
                ),
              ],
            ),
          ),

          // Overlays
          if (widget.overlayTop != null)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: widget.overlayTop!,
            ),

          if (widget.overlayBottom != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: widget.overlayBottom!,
            ),
        ],
      ),
    );
  }
}
