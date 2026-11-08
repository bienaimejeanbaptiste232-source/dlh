import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/app_providers.dart';

const Color _kBrandOrange = Color(0xFFFF6600);
const Color _kBrandOrangeLight = Color(0xFFFFF3EB);
const Color _kNavInactive = Color(0xFF94A3B8);

/// Persistent Shell that keeps the 5 Navigation Buttons ALWAYS visible across all pages
class MainNavigationShell extends ConsumerWidget {
  final Widget child;

  const MainNavigationShell({
    super.key,
    required this.child,
  });

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location == '/' || location.startsWith('/merchant')) {
      return 0;
    }
    if (location.startsWith('/categories') || location.startsWith('/category')) {
      return 1;
    }
    if (location.startsWith('/cart') || location.startsWith('/open-carts')) {
      return 2;
    }
    if (location.startsWith('/orders') || location.startsWith('/order-tracking')) {
      return 3;
    }
    if (location.startsWith('/profile') ||
        location.startsWith('/wallet') ||
        location.startsWith('/favorites') ||
        location.startsWith('/notifications') ||
        location.startsWith('/loyalty')) {
      return 4;
    }
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    HapticFeedback.lightImpact();
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/categories');
        break;
      case 2:
        context.go('/cart');
        break;
      case 3:
        context.go('/orders');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = _calculateSelectedIndex(context);
    final cartState = ref.watch(cartProvider);
    final cartCount = cartState.totalAllItemsCount;

    final ordersAsync = ref.watch(ordersProvider);
    final hasActiveOrder = ordersAsync.maybeWhen(
      data: (orders) => orders.any((o) =>
          o.status.toUpperCase() != 'DELIVERED' &&
          o.status.toUpperCase() != 'CANCELLED'),
      orElse: () => false,
    );

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Color(0x18000000),
              blurRadius: 18,
              offset: Offset(0, -3),
            ),
          ],
          border: Border(
            top: BorderSide(color: Color(0xFFE2E8F0), width: 0.8),
          ),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  context: context,
                  index: 0,
                  currentIndex: selectedIndex,
                  icon: Icons.home_rounded,
                  activeIcon: Icons.home_rounded,
                  label: 'Akèy',
                  badgeCount: 0,
                  hasDot: false,
                ),
                _buildNavItem(
                  context: context,
                  index: 1,
                  currentIndex: selectedIndex,
                  icon: Icons.grid_view_outlined,
                  activeIcon: Icons.grid_view_rounded,
                  label: 'Kategori',
                  badgeCount: 0,
                  hasDot: false,
                ),
                _buildNavItem(
                  context: context,
                  index: 2,
                  currentIndex: selectedIndex,
                  icon: Icons.shopping_bag_outlined,
                  activeIcon: Icons.shopping_bag_rounded,
                  label: 'Panyen',
                  badgeCount: cartCount,
                  hasDot: false,
                ),
                _buildNavItem(
                  context: context,
                  index: 3,
                  currentIndex: selectedIndex,
                  icon: Icons.receipt_long_outlined,
                  activeIcon: Icons.receipt_long_rounded,
                  label: 'Kòmand',
                  badgeCount: 0,
                  hasDot: hasActiveOrder,
                ),
                _buildNavItem(
                  context: context,
                  index: 4,
                  currentIndex: selectedIndex,
                  icon: Icons.person_outline_rounded,
                  activeIcon: Icons.person_rounded,
                  label: 'Pwofil',
                  badgeCount: 0,
                  hasDot: false,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required int index,
    required int currentIndex,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int badgeCount,
    required bool hasDot,
  }) {
    final isSelected = index == currentIndex;

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _onItemTapped(index, context),
          splashColor: _kBrandOrange.withValues(alpha: 0.12),
          highlightColor: Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOutCubic,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected ? _kBrandOrangeLight : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      isSelected ? activeIcon : icon,
                      size: 24,
                      color: isSelected ? _kBrandOrange : _kNavInactive,
                    ),
                  ),

                  // Red Badge for Cart Count
                  if (badgeCount > 0)
                    Positioned(
                      top: -2,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 5,
                          vertical: 1.5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 18,
                          minHeight: 18,
                        ),
                        child: Center(
                          child: Text(
                            badgeCount > 99 ? '99+' : '$badgeCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              height: 1.0,
                            ),
                          ),
                        ),
                      ),
                    ),

                  // Green Pulsing Dot for Active Order
                  if (hasDot && badgeCount == 0)
                    Positioned(
                      top: 0,
                      right: 10,
                      child: Container(
                        width: 9,
                        height: 9,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x6610B981),
                              blurRadius: 4,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                  color: isSelected ? _kBrandOrange : _kNavInactive,
                  letterSpacing: 0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

