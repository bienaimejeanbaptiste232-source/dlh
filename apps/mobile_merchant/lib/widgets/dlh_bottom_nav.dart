import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Bottom navigation bar DLH:
/// 1) Row siperyè: 4 bèl kat aksyon rapid (Manje, Rapò, Anviwònman, Sipò)
/// 2) Row enferyè: Navigasyon prensipal fonse marin (Kay, Lòd, Statistik, Profil)
class DLHBottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onIndexChanged;
  final int orderBadgeCount;
  final VoidCallback? onTapManje;
  final VoidCallback? onTapRapo;
  final VoidCallback? onTapAnviwonman;
  final VoidCallback? onTapSipo;

  const DLHBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onIndexChanged,
    this.orderBadgeCount = 2,
    this.onTapManje,
    this.onTapRapo,
    this.onTapAnviwonman,
    this.onTapSipo,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: DLHColors.dlhBg,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── 1. Row kat aksyon rapid (Manje, Rapò, Anviwònman, Sipò) ──
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
            child: Row(
              children: [
                _ActionNavCard(
                  icon: Icons.restaurant_rounded,
                  label: 'Manje',
                  badgeCount: orderBadgeCount,
                  onTap: onTapManje ?? () {},
                ),
                const SizedBox(width: 8),
                _ActionNavCard(
                  icon: Icons.bar_chart_rounded,
                  label: 'Rapò',
                  onTap: onTapRapo ?? () => onIndexChanged(2),
                ),
                const SizedBox(width: 8),
                _ActionNavCard(
                  icon: Icons.settings_rounded,
                  label: 'Anviwònman',
                  onTap: onTapAnviwonman ?? () {},
                ),
                const SizedBox(width: 8),
                _ActionNavCard(
                  icon: Icons.headset_mic_rounded,
                  label: 'Sipò',
                  onTap: onTapSipo ?? () {},
                ),
              ],
            ),
          ),

          // ── 2. Row prensipal fonse marin (#0A1628) ────────────────────
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFF0A1628),
              borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _PrimaryNavItem(
                      icon: Icons.home_rounded,
                      label: 'Kay',
                      isSelected: selectedIndex == 0,
                      onTap: () => onIndexChanged(0),
                    ),
                    _PrimaryNavItem(
                      icon: Icons.assignment_outlined,
                      label: 'Lòd',
                      isSelected: selectedIndex == 1,
                      onTap: () => onIndexChanged(1),
                    ),
                    _PrimaryNavItem(
                      icon: Icons.bar_chart_rounded,
                      label: 'Statistik',
                      isSelected: selectedIndex == 2,
                      onTap: () => onIndexChanged(2),
                    ),
                    _PrimaryNavItem(
                      icon: Icons.person_outline_rounded,
                      label: 'Profil',
                      isSelected: selectedIndex == 3,
                      onTap: () => onIndexChanged(3),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Kat bouton blan ak lonbraj pou aksyon rapid yo
class _ActionNavCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final int badgeCount;
  final VoidCallback onTap;

  const _ActionNavCard({
    required this.icon,
    required this.label,
    this.badgeCount = 0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: DLHColors.dlhBorder.withValues(alpha: 0.8), width: 1),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    icon,
                    size: 22,
                    color: const Color(0xFF0A1628),
                  ),
                  if (badgeCount > 0)
                    Positioned(
                      right: -8,
                      top: -6,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFFE63946),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
                        child: Text(
                          '$badgeCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 5),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Item navigasyon prensipal nan ba marin fonse a
class _PrimaryNavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PrimaryNavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 24,
              color: isSelected ? const Color(0xFFE63946) : const Color(0xFF94A3B8),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                color: isSelected ? const Color(0xFFE63946) : const Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 3),
            // Ti liy wouj anba onglet seleksyone a
            Container(
              width: 16,
              height: 2.5,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFE63946) : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
