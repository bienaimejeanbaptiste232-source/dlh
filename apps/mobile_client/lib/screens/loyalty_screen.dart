import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/constants.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loyalty = ref.watch(loyaltyProvider);

    return Scaffold(
      backgroundColor: AppConstants.backgroundDark,
      body: CustomScrollView(
        slivers: [
          // ─── App Bar ──────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: AppConstants.backgroundDark,
            surfaceTintColor: Colors.transparent,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF191919)),
              onPressed: () => Navigator.of(context).pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: _LoyaltyHeroCard(loyalty: loyalty),
            ),
            title: const Text(
              'Pwogram Fidelite',
              style: TextStyle(color: Color(0xFF191919), fontWeight: FontWeight.w800),
            ),
          ),

          // ─── Tiers Section ────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Nivo Fidelite',
                    style: TextStyle(
                      color: Color(0xFF191919),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _TierRow(
                    icon: Icons.local_fire_department_rounded,
                    color: Colors.blueGrey,
                    label: 'Debutant',
                    range: '0 – 499 pwen',
                    isActive: loyalty.totalPoints < 500,
                  ),
                  _TierRow(
                    icon: Icons.workspace_premium_rounded,
                    color: AppConstants.accentCyan,
                    label: 'Abonè',
                    range: '500 – 1499 pwen',
                    isActive: loyalty.totalPoints >= 500 && loyalty.totalPoints < 1500,
                  ),
                  _TierRow(
                    icon: Icons.star_rounded,
                    color: AppConstants.goldAccent,
                    label: 'Gold VIP',
                    range: '1500 – 4999 pwen',
                    isActive: loyalty.totalPoints >= 1500 && loyalty.totalPoints < 5000,
                  ),
                  _TierRow(
                    icon: Icons.diamond_rounded,
                    color: AppConstants.primaryCrimson,
                    label: 'Platinom',
                    range: '5000+ pwen',
                    isActive: loyalty.totalPoints >= 5000,
                  ),
                  const SizedBox(height: 24),

                  // ─── How it works ────────────────────────────
                  const Text(
                    'Kijan sa travay?',
                    style: TextStyle(
                      color: Color(0xFF191919),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _InfoCard(
                    icon: Icons.shopping_bag_rounded,
                    color: AppConstants.accentEmerald,
                    title: 'Fè kòmand → Touche pwen',
                    subtitle: '1 pwen pou chak 10 HTG ou depanse',
                  ),
                  _InfoCard(
                    icon: Icons.redeem_rounded,
                    color: AppConstants.goldAccent,
                    title: '500 pwen = 1 rekonpans',
                    subtitle: 'Rekonpans: Livrezon gratis oswa 250 HTG rabè',
                  ),
                  _InfoCard(
                    icon: Icons.trending_up_rounded,
                    color: AppConstants.accentViolet,
                    title: 'Plis ou kòmande, plis ou monte',
                    subtitle: 'Nivo plis wo = avantaj eksklusif ak priyorite',
                  ),
                  const SizedBox(height: 24),

                  // ─── Transaction History ─────────────────────
                  const Text(
                    'Istwa Pwen',
                    style: TextStyle(
                      color: Color(0xFF191919),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // ─── Transactions List ─────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, i) {
                  final tx = loyalty.transactions[i];
                  return _TransactionTile(tx: tx);
                },
                childCount: loyalty.transactions.length,
              ),
            ),
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 48)),
        ],
      ),
    );
  }
}

// ─── Hero Card Widget ────────────────────────────────────────────
class _LoyaltyHeroCard extends StatelessWidget {
  final LoyaltyInfo loyalty;
  const _LoyaltyHeroCard({required this.loyalty});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFFEF3C7),
            Color(0xFFF8F9FA),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Star icon
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppConstants.goldAccent, Color(0xFFFF8C00)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppConstants.goldAccent.withOpacity(0.35),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(Icons.stars_rounded, color: Colors.white, size: 34),
              ),
              const SizedBox(height: 12),
              Text(
                '${loyalty.totalPoints}',
                style: const TextStyle(
                  color: Color(0xFFD97706),
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1,
                ),
              ),
              const Text(
                'PWEN FIDELITE',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12,
                  letterSpacing: 3,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              // Progress bar
              Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Pwochen rekonpans',
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${loyalty.pointsToNextReward} pwen rete',
                        style: const TextStyle(
                          color: Color(0xFFD97706),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: loyalty.progress,
                      minHeight: 10,
                      backgroundColor: const Color(0xFFE2E8F0),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppConstants.goldAccent),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${loyalty.rewardsEarned} rekonpans touche',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                      ),
                      Text(
                        'Objektif: ${loyalty.rewardThreshold} pwen',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Tier Row Widget ─────────────────────────────────────────────
class _TierRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String range;
  final bool isActive;

  const _TierRow({
    required this.icon,
    required this.color,
    required this.label,
    required this.range,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isActive ? color.withOpacity(0.08) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isActive ? color.withOpacity(0.4) : AppConstants.borderSubtle,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: isActive ? color : const Color(0xFF94A3B8), size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: const Color(0xFF191919),
                    fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  range,
                  style: TextStyle(
                    color: isActive ? color.withOpacity(0.9) : const Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          if (isActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Kounye a',
                style: TextStyle(
                    color: color, fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Info Card Widget ────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  const _InfoCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppConstants.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                      color: Color(0xFF191919),
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    )),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Transaction Tile ────────────────────────────────────────────
class _TransactionTile extends StatelessWidget {
  final LoyaltyTransaction tx;
  const _TransactionTile({required this.tx});

  @override
  Widget build(BuildContext context) {
    final diffDays = DateTime.now().difference(tx.date).inDays;
    final dateStr = diffDays == 0
        ? "Jodi a"
        : diffDays == 1
            ? "Yè"
            : "Il y a ${diffDays}j";

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppConstants.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppConstants.accentEmerald.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.receipt_long_rounded,
                color: AppConstants.accentEmerald, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.orderId,
                  style: const TextStyle(
                    color: Color(0xFF191919),
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                Text(
                  '${tx.orderAmount.toInt()} HTG · $dateStr',
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+${tx.pointsEarned}',
                style: const TextStyle(
                  color: Color(0xFFD97706),
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const Text(
                'pwen',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
