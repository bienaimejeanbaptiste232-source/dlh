import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'config/delivery_theme_tokens.dart';
import 'models/models.dart';
import 'providers/app_providers.dart';
import 'screens/home_screen.dart';
import 'screens/categories_screen.dart';
import 'screens/category_detail_screen.dart';
import 'screens/merchant_detail_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/open_carts_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/loyalty_screen.dart';
import 'screens/splash_screen.dart';
import 'widgets/main_navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: DeliveryHaitiClientApp()));
}

final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    // ── Fullscreen Routes (No Bottom Nav) ───────────────────
    GoRoute(
      path: '/splash',
      builder: (context, state) => const ClientSplashScreen(),
    ),
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),

    // ── Persistent Navigation Shell (Bottom Nav Always Visible) ──
    ShellRoute(
      builder: (context, state, child) {
        return MainNavigationShell(child: child);
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/categories',
          builder: (context, state) => const CategoriesScreen(),
        ),
        GoRoute(
          path: '/category/:type',
          builder: (context, state) {
            final type = state.pathParameters['type'] ?? 'ALL';
            return CategoryDetailScreen(categoryKey: type);
          },
        ),
        GoRoute(
          path: '/merchant/:id',
          builder: (context, state) {
            final merchant = state.extra as Merchant;
            return MerchantDetailScreen(merchant: merchant);
          },
        ),
        GoRoute(
          path: '/cart',
          builder: (context, state) => const CartScreen(),
        ),
        GoRoute(
          path: '/open-carts',
          builder: (context, state) => const OpenCartsScreen(),
        ),
        GoRoute(
          path: '/order-tracking/:id',
          builder: (context, state) {
            final orderId = state.pathParameters['id'] ?? '';
            final order = state.extra as Order?;
            return OrderTrackingScreen(orderId: orderId, initialOrder: order);
          },
        ),
        GoRoute(
          path: '/orders',
          builder: (context, state) => const OrdersScreen(),
        ),
        GoRoute(
          path: '/wallet',
          builder: (context, state) => const WalletScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/favorites',
          builder: (context, state) => const FavoritesScreen(),
        ),
        GoRoute(
          path: '/loyalty',
          builder: (context, state) => const LoyaltyScreen(),
        ),
      ],
    ),
  ],
);

class DeliveryHaitiClientApp extends ConsumerWidget {
  const DeliveryHaitiClientApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeCategory = ref.watch(serviceThemeCategoryProvider);

    return MaterialApp.router(
      title: 'Delivery Haïti',
      debugShowCheckedModeBanner: false,
      theme: DeliveryThemeTokens.themeFor(activeCategory),
      routerConfig: _router,
    );
  }
}
