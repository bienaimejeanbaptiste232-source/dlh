import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

enum LocationServiceStatus {
  idle,
  checkingPermissions,
  serviceDisabled,
  permissionDenied,
  permissionDeniedForever,
  trackingActive,
  error,
}

class DriverLocationService {
  static final DriverLocationService _instance = DriverLocationService._internal();
  factory DriverLocationService() => _instance;
  DriverLocationService._internal();

  StreamSubscription<Position>? _positionStreamSub;
  final _locationController = StreamController<Position>.broadcast();
  final _statusController = StreamController<LocationServiceStatus>.broadcast();

  Stream<Position> get onLocationChanged => _locationController.stream;
  Stream<LocationServiceStatus> get onStatusChanged => _statusController.stream;

  LocationServiceStatus _currentStatus = LocationServiceStatus.idle;
  LocationServiceStatus get currentStatus => _currentStatus;

  Position? _lastKnownPosition;
  Position? get lastKnownPosition => _lastKnownPosition;

  void _setStatus(LocationServiceStatus status) {
    _currentStatus = status;
    _statusController.add(status);
  }

  /// Vérifier et demander les permissions de localisation
  Future<bool> checkAndRequestPermissions() async {
    _setStatus(LocationServiceStatus.checkingPermissions);

    // 1. Vérifier si le service GPS est activé sur l'appareil
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _setStatus(LocationServiceStatus.serviceDisabled);
      return false;
    }

    // 2. Vérifier la permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _setStatus(LocationServiceStatus.permissionDenied);
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _setStatus(LocationServiceStatus.permissionDeniedForever);
      return false;
    }

    return true;
  }

  /// Démarrer le suivi GPS réel avec optimisation batterie et précision haute
  Future<bool> startTracking({
    required Function(Position position) onPosition,
    Function(String error)? onError,
  }) async {
    final hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) {
      return false;
    }

    // Arrêter tout flux précédent
    await stopTracking();

    try {
      // Obtenir la première position immédiatement
      final initialPosition = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      _lastKnownPosition = initialPosition;
      onPosition(initialPosition);
      _locationController.add(initialPosition);
    } catch (e) {
      debugPrint('Initial GPS position note: $e');
    }

    // Paramètres optimisés : filtre de distance 10 mètres pour économiser la batterie
    // tout en gardant une excellente réactivité lors des déplacements moto
    final locationSettings = defaultTargetPlatform == TargetPlatform.android
        ? AndroidSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 10,
            intervalDuration: const Duration(seconds: 4),
            foregroundNotificationConfig: const ForegroundNotificationConfig(
              notificationText: 'MACKBEST1 ap transmèt pozisyon w pandan kous livrezon an',
              notificationTitle: 'Sèvis GPS Livrezon Aktif',
              enableWakeLock: true,
            ),
          )
        : defaultTargetPlatform == TargetPlatform.iOS
            ? AppleSettings(
                accuracy: LocationAccuracy.high,
                distanceFilter: 10,
                activityType: ActivityType.automotiveNavigation,
                pauseLocationUpdatesAutomatically: false,
                showBackgroundLocationIndicator: true,
              )
            : const LocationSettings(
                accuracy: LocationAccuracy.high,
                distanceFilter: 10,
              );

    _positionStreamSub = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _lastKnownPosition = position;
        _locationController.add(position);
        onPosition(position);
      },
      onError: (err) {
        _setStatus(LocationServiceStatus.error);
        if (onError != null) onError(err.toString());
      },
    );

    _setStatus(LocationServiceStatus.trackingActive);
    return true;
  }

  /// Arrêter le suivi GPS (économise la batterie lorsque le livreur passe hors ligne)
  Future<void> stopTracking() async {
    if (_positionStreamSub != null) {
      await _positionStreamSub!.cancel();
      _positionStreamSub = null;
    }
    _setStatus(LocationServiceStatus.idle);
  }

  /// Ouvrir les paramètres système si la permission est refusée définitivement
  Future<bool> openSettings() async {
    return await Geolocator.openAppSettings();
  }

  /// Ouvrir les paramètres de localisation pour activer le GPS
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }
}
