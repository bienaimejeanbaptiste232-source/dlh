import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/constants.dart';
import '../providers/app_providers.dart';
import '../services/supabase_service.dart';


class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _service = SupabaseService();
  Map<String, dynamic>? profile;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => isLoading = true);
    final data = await _service.getUserProfile();
    if (mounted) {
      setState(() {
        profile = data;
        isLoading = false;
      });
    }
  }

  Future<void> _handleAddAddress() async {
    final titleCtrl = TextEditingController(text: 'Kay');
    final addressCtrl = TextEditingController();

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 18,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [BoxShadow(color: Color(0x2A000000), blurRadius: 24, offset: Offset(0, -4))],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 18),
              const Row(
                children: [
                  Icon(Icons.add_location_alt_rounded, color: AppConstants.primaryCrimson, size: 22),
                  SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      'Ajoute Nouvo Adrès',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Text('Non Adrès la', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: titleCtrl,
                style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  hintText: 'Ex: Kay, Travay, Biwo',
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                  filled: true, fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(vertical: 13, horizontal: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppConstants.primaryCrimson, width: 1.8)),
                ),
              ),
              const SizedBox(height: 14),
              const Text('Adres Konplè', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: addressCtrl,
                maxLines: 2,
                style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  hintText: 'Ex: Ri Lamarre, Pétion-Ville, Port-au-Prince',
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  filled: true, fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(vertical: 13, horizontal: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppConstants.primaryCrimson, width: 1.8)),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Anile', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryCrimson,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Anrejistre Adrès', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (result == true && addressCtrl.text.trim().isNotEmpty) {
      final ok = await _service.addUserAddress(
        titleCtrl.text.trim(),
        addressCtrl.text.trim(),
      );
      if (ok && mounted) {
        _showToast('Adrès anrejistre avèk siksè! ');
        _loadProfile();
      }
    }
  }

  Future<void> _logout() async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(22),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [BoxShadow(color: Color(0x2A000000), blurRadius: 24, offset: Offset(0, -4))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: const Color(0xFFFFE4E6), shape: BoxShape.circle),
              child: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 28),
            ),
            const SizedBox(height: 14),
            const Text('Dekoneksyon', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            const Text(
              'Èske w sèten ou vle dekonekte?\nW ap ka rekonekte nenpòt ki lè.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13.5, color: Color(0xFF64748B), height: 1.4),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Anile', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Dekonekte', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );

    if (confirm == true) {
      await _service.logout();
      if (mounted) context.go('/auth');
    }
  }

  void _showToast(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
        backgroundColor: isError ? const Color(0xFFDC2626) : const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final firstName = profile?['firstName'] ?? 'Wilson';
    final lastName = profile?['lastName'] ?? 'Dorilas';
    final phone = profile?['phoneNumber'] ?? profile?['phone'] ?? '+50937000007';
    final email = profile?['email'] ?? 'client.wilson@gmail.com';
    final walletBalance = (profile?['wallets']?['balance'] as num?)?.toDouble() ?? 500.0;
    final addresses = (profile?['addresses'] as List?) ?? [];
    final initials = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();
    final fullName = '$firstName $lastName';
    final imageUrl = profile?['imageUrl'] as String?;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go("/");
                      }
                    },
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Profil Mwen',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3),
                        ),
                        Text('Jere kont Delivery Haïti ou',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: "Rafrechi",
                    icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
                    onPressed: _loadProfile,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: AppConstants.primaryCrimson))
          : RefreshIndicator(
              color: AppConstants.primaryCrimson,
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ─── 1. HERO AVATAR HEADER ─────────────────────────
                    _buildProfileHeroCard(initials, fullName, phone, email, imageUrl),

                    const SizedBox(height: 14),

                    // ─── 2. QUICK STATS CARDS ──────────────────────────
                    _buildQuickStats(walletBalance),

                    const SizedBox(height: 14),

                    // ─── 3. LOYALTY + FAVORI + NOTIF ──────────────────
                    _buildEngagementSection(),

                    const SizedBox(height: 14),

                    // ─── 4. SAVED ADDRESSES ────────────────────────────
                    _buildAddressSection(addresses),

                    const SizedBox(height: 14),

                    // ─── 5. SETTINGS & SUPPORT ─────────────────────────
                    _buildSettingsSection(),

                    const SizedBox(height: 24),

                    // ─── 6. LOGOUT BUTTON ──────────────────────────────
                    _buildLogoutButton(),
                  ],
                ),
              ),
            ),
    );
  }

  // ─── 1. PROFILE HERO CARD ─────────────────────────────────────────────────
  Widget _buildProfileHeroCard(String initials, String fullName, String phone, String email, String? imageUrl) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF6600).withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.2),
                border: Border.all(color: Colors.white, width: 3),
                gradient: imageUrl == null || imageUrl.isEmpty ? null : null,
              ),
              child: ClipOval(
                child: imageUrl != null && imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Center(
                          child: Text(initials,
                            style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                        ),
                      )
                    : Center(
                        child: Text(initials,
                          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              fullName,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3),
            ),
            const SizedBox(height: 4),
            Text(
              phone,
              style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600),
            ),
            if (email.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                email,
                style: TextStyle(fontSize: 11.5, color: Colors.white.withValues(alpha: 0.7)),
              ),
            ],
            const SizedBox(height: 14),
            // Verifye badge + Edit button row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_rounded, color: Colors.white, size: 12),
                      SizedBox(width: 4),
                      Text('Kont Verifye', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: () => _showToast('Fonksyon edite pwofil ap vini byento!'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.edit_rounded, color: Colors.white, size: 12),
                        SizedBox(width: 4),
                        Text('Modifye', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }


  // ─── 2. QUICK STATS ────────────────────────────────────────────────────────
  Widget _buildQuickStats(double walletBalance) {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              context.push('/wallet');
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.025), blurRadius: 8, offset: const Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppConstants.accentCyan.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.account_balance_wallet_rounded, color: AppConstants.accentCyan, size: 18),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF94A3B8)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '${walletBalance.toStringAsFixed(0)} HTG',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppConstants.accentCyan),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text('Bous Dijital', style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              context.push('/orders');
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.025), blurRadius: 8, offset: const Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD97706).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.inventory_2_rounded, color: Color(0xFFD97706), size: 18),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF94A3B8)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Kòmand Yo',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFFD97706)),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text('Wè istwa kòmand', style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ─── 3. ENGAGEMENT (LOYALTY + FAVORI + NOTIF) ─────────────────────────────
  Widget _buildEngagementSection() {
    return Consumer(
      builder: (ctx, cRef, child) {
        final loyalty = cRef.watch(loyaltyProvider);
        final favCount = cRef.watch(favoritesProvider).length;
        final unread = cRef.watch(unreadCountProvider);

        return Column(
          children: [
            // Loyalty Card — full width
            GestureDetector(
              onTap: () => context.push('/loyalty'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                  boxShadow: [BoxShadow(color: Colors.amber.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 2))],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [AppConstants.goldAccent, Color(0xFFFF8C00)]),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.stars_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Pwen Fidelite', style: TextStyle(color: Color(0xFF64748B), fontSize: 11.5, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 1),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              '${loyalty.totalPoints} pts',
                              style: const TextStyle(color: Color(0xFFD97706), fontSize: 20, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${loyalty.pointsToNextReward} rete',
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                        ),
                        const SizedBox(height: 5),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: SizedBox(
                            width: 72,
                            child: LinearProgressIndicator(
                              value: loyalty.progress,
                              minHeight: 6,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: const AlwaysStoppedAnimation<Color>(AppConstants.goldAccent),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: Color(0xFF94A3B8)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 10),

            // Favori + Notif — 2 columns
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => context.push('/favorites'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.025), blurRadius: 7, offset: const Offset(0, 2))],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.favorite_rounded, color: AppConstants.primaryCrimson, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Favori', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 13), overflow: TextOverflow.ellipsis),
                                Text('$favCount restoran', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11), overflow: TextOverflow.ellipsis),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, size: 11, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () => context.push('/notifications'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.025), blurRadius: 7, offset: const Offset(0, 2))],
                      ),
                      child: Row(
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              const Icon(Icons.notifications_rounded, color: AppConstants.accentViolet, size: 20),
                              if (unread > 0)
                                Positioned(
                                  right: -4,
                                  top: -4,
                                  child: Container(
                                    width: 14,
                                    height: 14,
                                    decoration: const BoxDecoration(color: AppConstants.primaryCrimson, shape: BoxShape.circle),
                                    child: Center(
                                      child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900)),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Notif', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 13), overflow: TextOverflow.ellipsis),
                                Text(
                                  unread > 0 ? '$unread nouvo' : 'Tout li',
                                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, size: 11, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  // ─── 4. SAVED ADDRESSES ───────────────────────────────────────────────────
  Widget _buildAddressSection(List addresses) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.025), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_on_rounded, color: AppConstants.primaryCrimson, size: 19),
                  SizedBox(width: 7),
                  Text(
                    'Adrès Livrezon',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              GestureDetector(
                onTap: _handleAddAddress,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryCrimson.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppConstants.primaryCrimson.withValues(alpha: 0.2)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_rounded, color: AppConstants.primaryCrimson, size: 15),
                      SizedBox(width: 3),
                      Text('Ajoute', style: TextStyle(color: AppConstants.primaryCrimson, fontSize: 12.5, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ],
          ),

          if (addresses.isEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0), style: BorderStyle.solid),
              ),
              child: const Row(
                children: [
                  Icon(Icons.add_location_outlined, color: Color(0xFF94A3B8), size: 20),
                  SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      'Pa gen okenn adrès anrejistre pou kounye a.',
                      style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 10),
            ...addresses.map((a) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: AppConstants.primaryCrimson.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: const Icon(Icons.home_rounded, color: AppConstants.primaryCrimson, size: 15),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            a['title'] ?? 'Kay',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                          Text(
                            a['fullAddress'] ?? 'Port-au-Prince',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 18),
                  ],
                ),
              ),
            )),
          ],
        ],
      ),
    );
  }

  // ─── 5. SETTINGS & SUPPORT ────────────────────────────────────────────────
  Widget _buildSettingsSection() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.025), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          // Language
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            leading: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
              decoration: BoxDecoration(
                color: AppConstants.primaryCrimson.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(7),
              ),
              child: const Text('HT', style: TextStyle(color: AppConstants.primaryCrimson, fontSize: 11, fontWeight: FontWeight.w900)),
            ),
            title: const Text('Lang Aplikasyon an', style: TextStyle(color: Color(0xFF0F172A), fontSize: 13.5, fontWeight: FontWeight.w700)),
            trailing: const Text('Kreyòl Ayisyen', style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5, fontWeight: FontWeight.w600)),
            onTap: () {},
          ),

          Divider(height: 1, color: const Color(0xFFE2E8F0), indent: 16, endIndent: 16),

          // Notifications prefs
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            leading: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: AppConstants.accentViolet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.notifications_outlined, color: AppConstants.accentViolet, size: 18),
            ),
            title: const Text('Preferans Notifikasyon', style: TextStyle(color: Color(0xFF0F172A), fontSize: 13.5, fontWeight: FontWeight.w700)),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: Color(0xFF94A3B8)),
            onTap: () => _showToast('Paramèt notifikasyon ap vini byento!'),
          ),

          Divider(height: 1, color: const Color(0xFFE2E8F0), indent: 16, endIndent: 16),

          // WhatsApp Support
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            leading: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: const Color(0xFF22C55E).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.support_agent_rounded, color: Color(0xFF22C55E), size: 18),
            ),
            title: const Text('Sipò Kliyan WhatsApp', style: TextStyle(color: Color(0xFF0F172A), fontSize: 13.5, fontWeight: FontWeight.w700)),
            subtitle: Text(AppConstants.supportPhoneDisplay, style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: Color(0xFF94A3B8)),
            onTap: () async {
              final uri = Uri.parse(
                  'https://wa.me/${AppConstants.supportWhatsApp}?text=Bonjou%20Delivery%20Ha%C3%AFti,%20mwen%20bezwen%20%C3%A8d.');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),

          Divider(height: 1, color: const Color(0xFFE2E8F0), indent: 16, endIndent: 16),

          // Privacy Policy
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            leading: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: const Color(0xFF2563EB).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.privacy_tip_outlined, color: Color(0xFF2563EB), size: 18),
            ),
            title: const Text('Politik Prive & CGU', style: TextStyle(color: Color(0xFF0F172A), fontSize: 13.5, fontWeight: FontWeight.w700)),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: Color(0xFF94A3B8)),
            onTap: () => _showToast('Dokiman legal ap disponib byento!'),
          ),

          Divider(height: 1, color: const Color(0xFFE2E8F0), indent: 16, endIndent: 16),

          // Version Info
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            leading: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.info_outline_rounded, color: Color(0xFF64748B), size: 18),
            ),
            title: const Text('Vèsyon Aplikasyon', style: TextStyle(color: Color(0xFF0F172A), fontSize: 13.5, fontWeight: FontWeight.w700)),
            trailing: const Text('v1.0.0', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12.5, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  // ─── 6. LOGOUT BUTTON ──────────────────────────────────────────────────────
  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton.icon(
        onPressed: _logout,
        icon: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 18),
        label: const Text('Dekonekte sou Kont sa a', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w900, fontSize: 14)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: const Color(0xFFDC2626).withValues(alpha: 0.45)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}
