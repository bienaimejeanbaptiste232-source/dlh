import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Sèvis Son & Vibwasyon Ijan pou Chofè Delivery Haïti (DLH)
/// Fèt pou atire atansyon livrè moto a menm nan gwo bri trafik ak van sou wout Okap.
class DriverAlertService {
  static final DriverAlertService _instance = DriverAlertService._internal();
  factory DriverAlertService() => _instance;
  DriverAlertService._internal();

  AudioPlayer? _alertPlayer;
  AudioPlayer? _effectPlayer;
  Timer? _vibrationTimer;
  bool _isPlaying = false;
  bool _soundEnabled = true;

  bool get isSoundEnabled => _soundEnabled;
  bool get isPlaying => _isPlaying;

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _soundEnabled = prefs.getBool('driver_sound_alert_enabled') ?? true;
    } catch (e) {
      debugPrint('[DriverAlertService] Erè inisyalizasyon prefs: $e');
    }
  }

  Future<void> setSoundEnabled(bool enabled) async {
    _soundEnabled = enabled;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('driver_sound_alert_enabled', enabled);
    } catch (e) {
      debugPrint('[DriverAlertService] Erè sovgad preferans: $e');
    }
  }

  /// Kòmanse son alèt repete + vibwasyon fò lè yon nouvo kòmand parèt
  Future<void> startOrderAlarm() async {
    if (_isPlaying) return;
    _isPlaying = true;

    // 1. Vibwasyon imedyat ak vibwasyon repete chak 1.5 segonn
    try {
      HapticFeedback.heavyImpact();
      _vibrationTimer?.cancel();
      _vibrationTimer = Timer.periodic(const Duration(milliseconds: 1400), (_) {
        if (!_isPlaying) {
          _vibrationTimer?.cancel();
          return;
        }
        HapticFeedback.vibrate();
      });
    } catch (e) {
      debugPrint('[DriverAlertService] Vibwasyon pa sipòte: $e');
    }

    // 2. Jwe son alèt kòmand si son an aktif
    if (!_soundEnabled) return;

    try {
      _alertPlayer ??= AudioPlayer();
      await _alertPlayer!.setReleaseMode(ReleaseMode.loop);
      await _alertPlayer!.setVolume(1.0);
      await _alertPlayer!.play(AssetSource('audio/order_alert.wav'));
      debugPrint('[DriverAlertService] 🔊 Son alèt kòmand ap sonnen (Bouk aktif)...');
    } catch (e) {
      debugPrint('[DriverAlertService] Erè jwe odyo alèt: $e');
    }
  }

  /// Fèmen son an ak vibwasyon an touswit (lè chofè a aksepte, refize oswa tan an fini)
  Future<void> stopOrderAlarm() async {
    _isPlaying = false;
    _vibrationTimer?.cancel();
    _vibrationTimer = null;

    try {
      if (_alertPlayer != null) {
        await _alertPlayer!.stop();
      }
    } catch (e) {
      debugPrint('[DriverAlertService] Erè kanpe son: $e');
    }
  }

  /// Jwe son viktwa lè chofè a aksepte kous la oswa lè li livre bay kliyan an
  Future<void> playSuccessChime() async {
    try {
      HapticFeedback.mediumImpact();
      if (!_soundEnabled) return;

      _effectPlayer ??= AudioPlayer();
      await _effectPlayer!.setReleaseMode(ReleaseMode.stop);
      await _effectPlayer!.setVolume(0.9);
      await _effectPlayer!.play(AssetSource('audio/delivery_success.wav'));
    } catch (e) {
      debugPrint('[DriverAlertService] Erè jwe success chime: $e');
    }
  }

  /// Tès rapid pou chofè a verifye si son an mache byen nan paramèt li
  Future<void> testAlert() async {
    try {
      HapticFeedback.heavyImpact();
      _effectPlayer ??= AudioPlayer();
      await _effectPlayer!.setReleaseMode(ReleaseMode.stop);
      await _effectPlayer!.setVolume(1.0);
      await _effectPlayer!.play(AssetSource('audio/order_alert.wav'));
    } catch (e) {
      debugPrint('[DriverAlertService] Erè tès son: $e');
    }
  }

  void dispose() {
    stopOrderAlarm();
    _alertPlayer?.dispose();
    _effectPlayer?.dispose();
    _alertPlayer = null;
    _effectPlayer = null;
  }
}
