import 'package:url_launcher/url_launcher.dart';

/// Sèvis navigasyon: ouvri Waze / Google Maps / Telefòn / WhatsApp
class DriverNavigationService {
  DriverNavigationService._();
  static final DriverNavigationService _i = DriverNavigationService._();
  factory DriverNavigationService() => _i;

  Future<bool> openWaze(double lat, double lng) async {
    final wazeApp = Uri.parse('waze://?ll=$lat,$lng&navigate=yes');
    final wazeWeb = Uri.parse('https://waze.com/ul?ll=$lat,$lng&navigate=yes');
    if (await canLaunchUrl(wazeApp)) {
      return launchUrl(wazeApp, mode: LaunchMode.externalApplication);
    }
    return launchUrl(wazeWeb, mode: LaunchMode.externalApplication);
  }

  Future<bool> openGoogleMaps(double lat, double lng) async {
    final mapsApp = Uri.parse('google.navigation:q=$lat,$lng&mode=d');
    final mapsWeb = Uri.parse('https://maps.google.com/?q=$lat,$lng');
    if (await canLaunchUrl(mapsApp)) {
      return launchUrl(mapsApp, mode: LaunchMode.externalApplication);
    }
    return launchUrl(mapsWeb, mode: LaunchMode.externalApplication);
  }

  Future<bool> callPhone(String phone) async {
    final digits = phone.replaceAll(RegExp(r'[\s\-()\+]'), '');
    return launchUrl(
      Uri.parse('tel:$digits'),
      mode: LaunchMode.externalApplication,
    );
  }

  Future<bool> openWhatsApp(String phone, {String message = ''}) async {
    final digits  = phone.replaceAll(RegExp(r'[\s\-()\+]'), '');
    final fullNum = digits.startsWith('509') ? digits : '509$digits';
    final encoded = Uri.encodeComponent(message);
    final waApp   = Uri.parse('whatsapp://send?phone=$fullNum&text=$encoded');
    final waWeb   = Uri.parse('https://api.whatsapp.com/send?phone=$fullNum&text=$encoded');
    if (await canLaunchUrl(waApp)) {
      return launchUrl(waApp, mode: LaunchMode.externalApplication);
    }
    return launchUrl(waWeb, mode: LaunchMode.externalApplication);
  }
}
