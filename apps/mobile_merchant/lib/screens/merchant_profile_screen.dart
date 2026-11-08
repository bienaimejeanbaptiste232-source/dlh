import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/business_type_config.dart';
import '../config/constants.dart';
import '../providers/merchant_providers.dart';
import 'merchant_login_screen.dart';

class MerchantProfileScreen extends ConsumerWidget {
  final bool showAppBar;
  const MerchantProfileScreen({super.key, this.showAppBar = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(merchantProfileProvider);
    final config = BusinessTypeConfig.fromType(profile?.type);
    final isOpen = profile?.isOpen ?? true;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: showAppBar
          ? AppBar(
              title: Text('Pwofil ${config.title}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              backgroundColor: const Color(0xFFF8FAFC),
              elevation: 0,
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh, color: Color(0xFF0F172A)),
                  tooltip: 'Rafrechi Pwofil',
                  onPressed: () => ref.read(merchantProfileProvider.notifier).loadProfile(),
                ),
              ],
            )
          : null,
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          children: [
            // Kat Pwofil Restoran
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: MerchantConstants.cardGradient,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: MerchantConstants.borderLight),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: config.theme.gradient,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: config.theme.primary.withValues(alpha: 0.35),
                              blurRadius: 18,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(config.icon, style: const TextStyle(fontSize: 40)),
                        ),
                      ),
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isOpen ? MerchantConstants.successGreen : Colors.redAccent,
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        profile?.name ?? 'Kay Fritay Lakay',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: MerchantConstants.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.verified, color: MerchantConstants.brandAmber, size: 20),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${config.title} • ${profile?.zoneName ?? 'Pétion-Ville'}',
                    style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isOpen
                          ? MerchantConstants.successGreen.withValues(alpha: 0.12)
                          : Colors.redAccent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isOpen
                            ? MerchantConstants.successGreen.withValues(alpha: 0.3)
                            : Colors.redAccent.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isOpen ? MerchantConstants.successGreen : Colors.redAccent,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          isOpen ? '${config.title.toUpperCase()} A OUVRI POU KÒMAND' : '${config.title.toUpperCase()} A FÈMEN AKTYÈLMAN',
                          style: TextStyle(
                            color: isOpen ? MerchantConstants.successGreen : Colors.redAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Kat Chanje Estati Ouvri / Fèmen
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: MerchantConstants.borderLight),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isOpen
                          ? MerchantConstants.successGreen.withValues(alpha: 0.15)
                          : Colors.redAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      isOpen ? Icons.storefront : Icons.storefront_outlined,
                      color: isOpen ? MerchantConstants.successGreen : Colors.redAccent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Disponibilite ${config.title}',
                          style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isOpen ? 'Kliyan ka pase kòmand sou app la' : 'Kliyan pa ka pase nouvo kòmand',
                          style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: isOpen,
                    activeThumbColor: MerchantConstants.successGreen,
                    inactiveTrackColor: Colors.red.withValues(alpha: 0.3),
                    onChanged: (val) async {
                      final messenger = ScaffoldMessenger.of(context);
                      final ok = await ref.read(merchantProfileProvider.notifier).toggleOpenStatus();
                      if (ok) {
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                              val ? '🟢 ${config.title} a louvri pou resevwa kòmand!' : '🛑 ${config.title} a make fèmen.',
                            ),
                            backgroundColor: val ? Colors.green : Colors.redAccent,
                          ),
                        );
                      }
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Enfòmasyon Kontak & Operasyon
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: MerchantConstants.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Enfòmasyon sou ${config.title}',
                    style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 14),
                  _buildInfoRow(Icons.location_on_outlined, 'Adrès', profile?.address ?? 'Pétion-Ville, Haïti'),
                  const Divider(height: 20, color: MerchantConstants.borderLight),
                  _buildInfoRow(Icons.phone_outlined, 'Telefòn', profile?.phone ?? '+509 3700 0003'),
                  const Divider(height: 20, color: MerchantConstants.borderLight),
                  _buildInfoRow(Icons.timer_outlined, 'Tan Mwayèn Preparasyon', '${profile?.avgPrepTimeMinutes ?? 20} minit'),
                  const Divider(height: 20, color: MerchantConstants.borderLight),
                  _buildInfoRow(Icons.percent_outlined, 'To Komisyon Platfòm', '${profile?.commissionRate.toInt() ?? 15}%'),
                  const Divider(height: 20, color: MerchantConstants.borderLight),
                  _buildInfoRow(Icons.map_outlined, 'Zòn Livrezon', profile?.zoneName ?? 'Pétion-Ville'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Sant Sipò & Asistans
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: MerchantConstants.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sipò & Asistans Machann',
                    style: TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  _buildActionRow(Icons.headset_mic_outlined, 'Kontakte Sipò Delivery Haïti', '+509 2811 0000', () {}),
                  const Divider(height: 20, color: MerchantConstants.borderLight),
                  _buildActionRow(Icons.help_outline, 'Gid & Kesyon Moun Poze Souvan', 'FAQ Machann', () {}),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Bouton Dekoneksyon
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.redAccent,
                  side: const BorderSide(color: Colors.redAccent, width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.logout, size: 20),
                label: const Text(
                  'DEKONEKTE SOU KONT SA A',
                  style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
                onPressed: () async {
                  final nav = Navigator.of(context);
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      title: const Text('Dekonekte ?', style: TextStyle(color: MerchantConstants.textPrimary)),
                      content: Text(
                        'Èske ou sèten ou vle dekonekte sou kont ${config.title.toLowerCase()} sa a ?',
                        style: const TextStyle(color: MerchantConstants.textSecondary),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Non, rete konekte', style: TextStyle(color: MerchantConstants.textSecondary)),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Wi, dekonekte', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true) {
                    await ref.read(merchantApiProvider).logout();
                    nav.pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const MerchantLoginScreen()),
                      (route) => false,
                    );
                  }
                },
              ),
            ),

            const SizedBox(height: 24),

            // Footer DLH Branding
            Center(
              child: Column(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: MerchantConstants.brandOrange.withValues(alpha: 0.25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/dlh_logo.png',
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'DLH • Delivery Lakay Haïti',
                    style: TextStyle(
                      color: MerchantConstants.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Platfòm Ofisyèl Machann • v1.0.0',
                    style: TextStyle(
                      color: MerchantConstants.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: MerchantConstants.textSecondary, size: 18),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: Text(label, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 13)),
        ),
        const SizedBox(width: 8),
        Flexible(
          flex: 3,
          child: Text(
            value,
            style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildActionRow(IconData icon, String title, String subtitle, VoidCallback onTap, [Color? iconColor]) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Row(
        children: [
          Icon(icon, color: iconColor ?? MerchantConstants.brandOrange, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: MerchantConstants.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
                Text(subtitle, style: const TextStyle(color: MerchantConstants.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: MerchantConstants.textSecondary, size: 20),
        ],
      ),
    );
  }
}
