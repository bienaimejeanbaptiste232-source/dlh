import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class DeliveryLocationUpdate {
  final String deliveryId;
  final String? driverId;
  final double latitude;
  final double longitude;
  final double? heading;
  final double? speed;
  final double? accuracy;
  final double? distanceRemainingKm;
  final int? durationMinutes;
  final DateTime? eta;
  final List<dynamic>? routePolyline;
  final DateTime timestamp;
  final bool isInitial;

  DeliveryLocationUpdate({
    required this.deliveryId,
    this.driverId,
    required this.latitude,
    required this.longitude,
    this.heading,
    this.speed,
    this.accuracy,
    this.distanceRemainingKm,
    this.durationMinutes,
    this.eta,
    this.routePolyline,
    required this.timestamp,
    this.isInitial = false,
  });

  factory DeliveryLocationUpdate.fromMap(Map<String, dynamic> map) {
    DateTime parsedEta = DateTime.now().add(const Duration(minutes: 15));
    if (map['eta'] != null) {
      parsedEta = DateTime.tryParse(map['eta'].toString()) ?? parsedEta;
    }

    DateTime parsedTimestamp = DateTime.now();
    if (map['timestamp'] != null) {
      if (map['timestamp'] is int) {
        parsedTimestamp = DateTime.fromMillisecondsSinceEpoch(map['timestamp']);
      } else {
        parsedTimestamp = DateTime.tryParse(map['timestamp'].toString()) ?? parsedTimestamp;
      }
    }

    return DeliveryLocationUpdate(
      deliveryId: map['deliveryId'] ?? '',
      driverId: map['driverId'],
      latitude: (map['latitude'] as num?)?.toDouble() ?? 19.7594,
      longitude: (map['longitude'] as num?)?.toDouble() ?? -72.2008,
      heading: (map['heading'] as num?)?.toDouble(),
      speed: (map['speed'] as num?)?.toDouble(),
      accuracy: (map['accuracy'] as num?)?.toDouble(),
      distanceRemainingKm: (map['distanceRemainingKm'] as num?)?.toDouble(),
      durationMinutes: (map['durationMinutes'] as num?)?.toInt(),
      eta: parsedEta,
      routePolyline: map['routePolyline'] as List<dynamic>?,
      timestamp: parsedTimestamp,
      isInitial: map['initialState'] == true,
    );
  }
}

class ClientTrackingSocketService {
  static final ClientTrackingSocketService _instance = ClientTrackingSocketService._internal();
  factory ClientTrackingSocketService() => _instance;
  ClientTrackingSocketService._internal();

  IO.Socket? _socket;
  String? _currentOrderId;

  final _locationUpdateController = StreamController<DeliveryLocationUpdate>.broadcast();
  final _statusUpdateController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  Stream<DeliveryLocationUpdate> get onLocationUpdate => _locationUpdateController.stream;
  Stream<Map<String, dynamic>> get onStatusUpdate => _statusUpdateController.stream;
  Stream<bool> get onConnectionChanged => _connectionController.stream;

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  void connect({
    required String serverUrl,
    String? token,
  }) {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
    }

    _socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionAttempts(10)
          .setAuth({'token': token ?? ''})
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      _connectionController.add(true);
      debugPrint('[ClientSocket] Konekte ak sèvè MACKBEST1');

      // Si une commande était en cours de suivi, réabonner automatiquement
      if (_currentOrderId != null) {
        subscribeToDelivery(_currentOrderId!);
      }
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      _connectionController.add(false);
      debugPrint('[ClientSocket] Dekonekte de sèvè a');
    });

    _socket!.onConnectError((err) {
      _isConnected = false;
      _connectionController.add(false);
      debugPrint('[ClientSocket] Erè koneksyon: $err');
    });

    // Événement requis : 'delivery:location:updated'
    _socket!.on('delivery:location:updated', (data) {
      if (data is Map<String, dynamic>) {
        _locationUpdateController.add(DeliveryLocationUpdate.fromMap(data));
      }
    });

    // Événement requis : 'delivery:status:updated'
    _socket!.on('delivery:status:updated', (data) {
      if (data is Map<String, dynamic>) {
        _statusUpdateController.add(data);
      }
    });
  }

  /// S'abonner aux mises à jour GPS d'une livraison spécifique
  void subscribeToDelivery(String orderId) {
    _currentOrderId = orderId;
    if (_socket != null && _isConnected) {
      // Événement requis : 'delivery:location:subscribe'
      _socket!.emit('delivery:location:subscribe', {'deliveryId': orderId});
      debugPrint('[ClientSocket] Soukri ak livrezon: $orderId');
    }
  }

  /// Se désabonner de la livraison
  void unsubscribeFromDelivery(String orderId) {
    if (_socket != null && _isConnected) {
      // Événement requis : 'delivery:location:unsubscribe'
      _socket!.emit('delivery:location:unsubscribe', {'deliveryId': orderId});
      debugPrint('[ClientSocket] Desoukri de livrezon: $orderId');
    }
    if (_currentOrderId == orderId) {
      _currentOrderId = null;
    }
  }

  void disconnect() {
    if (_currentOrderId != null) {
      unsubscribeFromDelivery(_currentOrderId!);
    }
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _isConnected = false;
    _connectionController.add(false);
  }
}
