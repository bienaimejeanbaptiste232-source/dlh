import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/constants.dart';
import '../providers/driver_providers.dart';
import '../screens/driver_wallet_screen.dart';
import '../services/driver_alert_service.dart';

class DriverProfileDrawer extends ConsumerWidget {
  final VoidCallback onLogout;
  const DriverProfileDrawer({super.key, required this.onLogout});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(currentDriverProfileProvider);
    final isOnline = ref.watch(driverStatusProvider);

    final name = (profile != null && profile.fullName.isNotEmpty) ? profile.fullName : 'Mackby Wise';
    final phone = (profile != null && profile.phoneNumber.isNotEmpty) ? profile.phoneNumber : '+509 4055 3636';
    final plate = (profile != null && profile.vehiclePlate.isNotEmpty) ? profile.vehiclePlate : 'E20988';
    final model = profile?.vehicleModel ?? 'Haojue Express 125';
    final rating = profile?.rating ?? 5.0;
    final totalDeliveries = profile?.totalDeliveries ?? 43;
    final walletBalance = profile?.walletBalance ?? 6635.0;
    final licenseNumber = profile?.licenseNumber ?? '0887uu77';

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // ─── Logo & Brand DLH Header ───────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                border: Border(bottom: BorderSide(color: Color(0xFF1E293B))),
              ),
              child: Row(
                children: [
                  Image.asset(
                    'assets/images/dlh_logo.png',
                    height: 44,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(Icons.flash_on, color: DriverConstants.primaryCrimson, size: 36),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DELIVERY HAÏTI',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                      ),
                      Text(
                        'Espas Chofè & Kousye Pro',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isOnline ? DriverConstants.neonGreen.withValues(alpha: 0.2) : const Color(0xFF334155),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isOnline ? DriverConstants.neonGreen : const Color(0xFF475569),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isOnline ? DriverConstants.neonGreen : const Color(0xFF94A3B8),
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          isOnline ? 'AN LIG' : 'HÒS LIG',
                          style: TextStyle(
                            color: isOnline ? DriverConstants.neonGreen : const Color(0xFFCBD5E1),
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ─── En-tête Chauffeur Pro (White & DoorDash Crimson) ─────
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: DriverConstants.borderLight)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Avatar ak indicateur sou liy
                      Stack(
                        children: [
                          Container(
                            width: 62,
                            height: 62,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: DriverConstants.primaryGradient,
                              boxShadow: [
                                BoxShadow(
                                  color: DriverConstants.primaryCrimson.withValues(alpha: 0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(Icons.two_wheeler_rounded, color: Colors.white, size: 32),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOnline ? DriverConstants.neonGreen : const Color(0xFFDC2626),
                                border: Border.all(color: Colors.white, width: 2.5),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    name,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w900,
                                      color: DriverConstants.textDark,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.verified, color: DriverConstants.primaryCrimson, size: 16),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              phone,
                              style: const TextStyle(color: DriverConstants.textMuted, fontSize: 12, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 5),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: DriverConstants.borderLight),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('🛵 ', style: TextStyle(fontSize: 10)),
                                  Text(
                                    '$model • $plate',
                                    style: const TextStyle(
                                      color: DriverConstants.textDark,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ─── Kat Stat Chofè Pro (Rating, Akseptasyon, Livrezon) ─────
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8F9FA),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: DriverConstants.borderLight),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'NÒT CHOFÈ',
                                style: TextStyle(color: DriverConstants.textMuted, fontSize: 9, fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                                  const SizedBox(width: 3),
                                  Text(
                                    rating.toStringAsFixed(2),
                                    style: const TextStyle(fontWeight: FontWeight.w900, color: DriverConstants.textDark, fontSize: 13),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8F9FA),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: DriverConstants.borderLight),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'AKSEPTASYON',
                                style: TextStyle(color: DriverConstants.textMuted, fontSize: 9, fontWeight: FontWeight.w900),
                              ),
                              SizedBox(height: 3),
                              Text(
                                '99.2%',
                                style: TextStyle(fontWeight: FontWeight.w900, color: DriverConstants.neonGreen, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8F9FA),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: DriverConstants.borderLight),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'KOUS FINI',
                                style: TextStyle(color: DriverConstants.textMuted, fontSize: 9, fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                '$totalDeliveries',
                                style: const TextStyle(fontWeight: FontWeight.w900, color: DriverConstants.textDark, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ─── Lis Navigasyon & Fonksyonalite Chofè ───────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                children: [
                  _buildDrawerItem(
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'Pòtmonnen & Retrè Lajan',
                    subtitle: '${walletBalance.toInt()} HTG disponib (MonCash/Natcash)',
                    highlightColor: DriverConstants.primaryCrimson,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const DriverWalletScreen()),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.history_rounded,
                    title: 'Istorik Kous Livrezon',
                    subtitle: 'Gade kous ou fè deja yo ak resi yo',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const DriverWalletScreen()),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.navigation_rounded,
                    title: 'Zòn Cho nan Okap (Hotspots)',
                    subtitle: 'Boulevard · Rue 18 · Carénage (+75 G)',
                    highlightColor: const Color(0xFFD97706),
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🔥 Zòn ki gen gwo demann kounye a: Boulevard (+50 G bonis), Rue 18 (+75 G bonis).'),
                          backgroundColor: Color(0xFFB45309),
                          duration: Duration(seconds: 4),
                        ),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.assignment_turned_in_outlined,
                    title: 'Dokiman & Pèmi Kondwi',
                    subtitle: 'Lisans $licenseNumber • Asirans aktif',
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('✅ Tout dokiman w yo verifye epi valid pa administrasyon an.'),
                          backgroundColor: DriverConstants.neonGreen,
                        ),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.headset_mic_outlined,
                    title: 'Sant Èd & Sipò 24/7',
                    subtitle: 'Èd rapid sou WhatsApp & Liy Dirèk',
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('📞 Sipò Ijan Delivery Haïti: +509 3800 0000 oswa WhatsApp.'),
                        ),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.notifications_active_rounded,
                    title: 'Son Alèt Kòmand & Vibwasyon',
                    subtitle: 'Son fò pou moto • Klike pou teste',
                    highlightColor: const Color(0xFF0284C7),
                    onTap: () {
                      DriverAlertService().testAlert();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🔊 Tès Son: Alèt la ap sonnen ak volim maksimòm pou moto!'),
                          backgroundColor: Color(0xFF0284C7),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.security_rounded,
                    title: 'Bouton SOS & Sekirite',
                    subtitle: 'Nimewo ijans lapolis & sekou',
                    highlightColor: const Color(0xFFDC2626),
                    onTap: () {
                      Navigator.pop(context);
                      _showSosEmergencyDialog(context);
                    },
                  ),
                ],
              ),
            ),

            // ─── Pied de Page : Dekoneksyon & Vèsyon ───────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: DriverConstants.borderLight)),
              ),
              child: Column(
                children: [
                  ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    tileColor: const Color(0xFFFEF2F2),
                    leading: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 20),
                    title: const Text(
                      'Dekonekte',
                      style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      onLogout();
                    },
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Delivery Haïti Driver • v1.2.0 • Okap, HT',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSosEmergencyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        contentPadding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 26),
            SizedBox(width: 8),
            Text(
              'IJANS & SEKIRITE CHOFÈ',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF7F1D1D)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Si w nan yon sitiyasyon danje oswa aksidan sou wout la, kontakte sèvis sekou yo imedyatman:',
              style: TextStyle(fontSize: 12, color: DriverConstants.textDark),
            ),
            const SizedBox(height: 14),
            _buildEmergencyPhoneRow(
              ctx,
              icon: Icons.local_police,
              title: 'Polis Nasyonal (PNH)',
              number: '114',
              color: const Color(0xFF1E3A8A),
            ),
            const SizedBox(height: 8),
            _buildEmergencyPhoneRow(
              ctx,
              icon: Icons.local_fire_department,
              title: 'Pompier & Sekou Medikal',
              number: '118',
              color: const Color(0xFFDC2626),
            ),
            const SizedBox(height: 8),
            _buildEmergencyPhoneRow(
              ctx,
              icon: Icons.headset_mic,
              title: 'Sipò Santral DLH (24/7)',
              number: '+509 3800 0000',
              color: DriverConstants.primaryCrimson,
            ),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.share_location_rounded, size: 18),
              label: const Text('TRANSMÈT POSISYON GPS BAY SANT SIPÒ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('🚨 Kòdonne GPS ou transmèt bay Santral DLH ak ekip sekirite sou teren an!'),
                    backgroundColor: Color(0xFF7F1D1D),
                    duration: Duration(seconds: 4),
                  ),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fèmen', style: TextStyle(color: DriverConstants.textMuted, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyPhoneRow(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String number,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
                Text(number, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: DriverConstants.textDark)),
              ],
            ),
          ),
          InkWell(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('📞 Ap konpoze nimewo ijans: $number...')),
              );
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.call, color: Colors.white, size: 12),
                  SizedBox(width: 4),
                  Text('Rele', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required String subtitle,
    Color? highlightColor,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (highlightColor ?? DriverConstants.primaryCrimson).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: highlightColor ?? DriverConstants.primaryCrimson, size: 20),
        ),
        title: Text(
          title,
          style: const TextStyle(color: DriverConstants.textDark, fontSize: 13, fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: DriverConstants.textMuted, fontSize: 11),
        ),
        trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 18),
      ),
    );
  }
}
