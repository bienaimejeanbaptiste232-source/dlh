import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:geolocator/geolocator.dart';

class DriverSocketService {
  static final DriverSocketService _instance = DriverSocketService._internal();
  factory DriverSocketService() => _instance;
  DriverSocketService._internal();

  io.Socket? _socket;
  final _connectionController = StreamController<bool>.broadcast();
  final _missionAlertController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<bool> get onConnectionChanged => _connectionController.stream;
  Stream<Map<String, dynamic>> get onMissionAlert => _missionAlertController.stream;

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  String? _currentDriverId;
  String? _currentUserId;
  String? _activeOrderId;

  // Throttling pour éviter de saturer le réseau mobile
  DateTime? _lastSentTime;
  Position? _lastSentPosition;

  void init({
    required String serverUrl,
    required String driverId,
    String? userId,
    String? token,
  }) {
    _currentDriverId = driverId;
    _currentUserId = userId;

    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
    }

    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionAttempts(15)
          .setAuth({'token': token ?? ''})
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      _connectionController.add(true);
      debugPrint('[DriverSocket] ✅ Konekte ak sèvè WebSocket NestJS');

      // Rejoindre la salle privée du chauffeur apè koneksyon
      // Nou voye tou de driverId ak userId pou kouvri tout kanal
      _socket!.emit('driver:join', {
        'driverId': _currentDriverId,
        'userId': _currentUserId,
      });
      debugPrint('[DriverSocket] 📡 Koute sèl prive: driver_private_$_currentDriverId');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      _connectionController.add(false);
      debugPrint('[DriverSocket] 🛑 Dekonekte de sèvè a');
    });

    _socket!.onConnectError((err) {
      _isConnected = false;
      _connectionController.add(false);
      debugPrint('[DriverSocket] ⚠️ Erè koneksyon WebSocket: $err');
    });

    void processIncomingMission(dynamic data) {
      if (data is Map) {
        try {
          final map = Map<String, dynamic>.from(data);
          debugPrint('[DriverSocket] ⚡ NOUVO MISYON RESEVWA: orderId=${map["orderId"]}, orderNumber=${map["orderNumber"]}');
          _missionAlertController.add(map);
        } catch (e) {
          debugPrint('[DriverSocket] Erè parse misyon: $e');
        }
      }
    }

    // 1. Koute kanal prive dirèk
    _socket!.on('driver:mission:incoming', processIncomingMission);

    // 2. Koute kanal broadcast fallback si targetDriverId matche
    _socket!.on('driver:mission:broadcast', (data) {
      if (data is Map) {
        final target = data['targetDriverId']?.toString();
        if (target == null ||
            target.isEmpty ||
            target == _currentDriverId ||
            (target == _currentUserId && _currentUserId != null)) {
          processIncomingMission(data);
        }
      }
    });

    // 3. Koute kanal dispatch admin jeneral
    _socket!.on('admin:mission_dispatched', (data) {
      if (data is Map) {
        final target = data['driverId']?.toString();
        if (target == _currentDriverId || (target == _currentUserId && _currentUserId != null)) {
          final mData = data['missionData'];
          if (mData is Map) {
            processIncomingMission(mData);
          }
        }
      }
    });
  }

  void setActiveOrderId(String? orderId) {
    _activeOrderId = orderId;
  }

  /// Envoyer la position GPS réelle au backend
  void sendLocationUpdate(Position position) {
    if (_socket == null || !_isConnected || _currentDriverId == null) {
      return;
    }

    final now = DateTime.now();

    // Throttling : Pas plus d'une transmission toutes les 3 secondes, sauf si déplacement notable (> 15m)
    if (_lastSentTime != null && _lastSentPosition != null) {
      final elapsedSec = now.difference(_lastSentTime!).inSeconds;
      final distanceM = Geolocator.distanceBetween(
        _lastSentPosition!.latitude,
        _lastSentPosition!.longitude,
        position.latitude,
        position.longitude,
      );

      if (elapsedSec < 3 && distanceM < 15) {
        return; // Éviter l'envoi redondant
      }
    }

    _lastSentTime = now;
    _lastSentPosition = position;

    final payload = {
      'driverId': _currentDriverId,
      'orderId': _activeOrderId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'accuracy': position.accuracy,
      'speed': position.speed,
      'heading': position.heading,
      'timestamp': position.timestamp.millisecondsSinceEpoch,
    };

    // Événement requis : 'driver:location:update'
    _socket!.emit('driver:location:update', payload);
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _isConnected = false;
    _connectionController.add(false);
  }

  /// Chaffè aksepte misyon an — voye répons ba backend
  void acceptMission(String orderId) {
    if (_socket == null || !_isConnected) return;
    _socket!.emit('driver:mission:response', {
      'orderId': orderId,
      'accepted': true,
      'driverId': _currentDriverId,
    });
    debugPrint('[DriverSocket] ✅ Aksepte misyon: $orderId');
  }

  /// Chaffè refize misyon an — dispatch envoye au prochain candidat
  void rejectMission(String orderId) {
    if (_socket == null || !_isConnected) return;
    _socket!.emit('driver:mission:response', {
      'orderId': orderId,
      'accepted': false,
      'driverId': _currentDriverId,
    });
    debugPrint('[DriverSocket] ❌ Refize misyon: $orderId');
  }

  /// Chofè rekipere pake a nan restoran an — avèti tout sistèm nan via WebSocket
  void confirmPickup(String orderId) {
    if (_socket == null || !_isConnected) return;
    _socket!.emit('driver:pickup', {
      'orderId': orderId,
      'driverId': _currentDriverId,
    });
    debugPrint('[DriverSocket] 🛍️ Rekipere pake: $orderId');
  }

  /// Chofè livre pake a bay kliyan an — avèti tout sistèm nan via WebSocket
  void confirmDelivery(String orderId) {
    if (_socket == null || !_isConnected) return;
    _socket!.emit('driver:delivered', {
      'orderId': orderId,
      'driverId': _currentDriverId,
    });
    _activeOrderId = null;
    debugPrint('[DriverSocket] 🎉 Livrezon fini: $orderId');
  }
}
