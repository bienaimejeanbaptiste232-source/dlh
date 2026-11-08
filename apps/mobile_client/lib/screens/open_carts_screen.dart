import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/app_providers.dart';

/// Ekran DoorDash "Open Carts" (Jere plizyè panyen ouvri an menm tan)
class OpenCartsScreen extends ConsumerWidget {
  const OpenCartsScreen({super.key});

  static const Color doordashRed = Color(0xFFEB1700);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartProvider);
    final openCarts = cartState.openCarts;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(68),
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
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                    onPressed: () => context.pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Panyen Ouvri Yo',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  if (openCarts.isNotEmpty)
                    TextButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            backgroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            title: const Text('Vide tout panyen yo?', style: TextStyle(color: Color(0xFF191919), fontWeight: FontWeight.bold)),
                            content: const Text('Èske w sèten ou vle efase tout panyen ou yo?', style: TextStyle(color: Color(0xFF64748B))),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('Anile', style: TextStyle(color: Color(0xFF64748B))),
                              ),
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  ref.read(cartProvider.notifier).clearAll();
                                },
                                child: const Text('Wi, vide yo', style: TextStyle(color: Color(0xFFFF6600), fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        );
                      },
                      child: const Text('Vide Tout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: openCarts.isEmpty
          ? _buildEmptyState(context)
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
              itemCount: openCarts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 18),
              itemBuilder: (ctx, index) {
                final cart = openCarts[index];
                return _buildCartCard(context, ref, cart);
              },
            ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: doordashRed.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_bag_outlined,
                size: 48,
                color: doordashRed,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Pa gen panyen ouvri kounye a',
              style: TextStyle(
                color: Color(0xFF191919),
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'Ajoute atik nan plizyè restoran oswa makèt an menm tan. Yo tout ap parèt la!',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 14,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: doordashRed,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                elevation: 4,
              ),
              onPressed: () => context.go('/'),
              child: const Text(
                'Dekouvri Machann yo',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartCard(BuildContext context, WidgetRef ref, MerchantCart cart) {
    final merchant = cart.merchant;
    final itemsSummary = cart.items.map((e) => e.item.name).take(4).join(' • ');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Header Machann ──────────────────────────────
          Row(
            children: [
              // Logo machann
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  image: merchant.logoUrl != null
                      ? DecorationImage(
                          image: NetworkImage(merchant.logoUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: merchant.logoUrl == null
                    ? Center(
                        child: Text(
                          merchant.name.isNotEmpty ? merchant.name[0] : 'M',
                          style: const TextStyle(
                            color: Color(0xFF191919),
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      merchant.name,
                      style: const TextStyle(
                        color: Color(0xFF191919),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '${cart.itemCount} atik • ${cart.totalAmount.toInt()} HTG',
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // Bouton efase panyen sa a
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFF94A3B8), size: 20),
                onPressed: () {
                  ref.read(cartProvider.notifier).clearCart(merchantId: merchant.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Panyen ${merchant.name} efase.'),
                      duration: const Duration(seconds: 2),
                      backgroundColor: const Color(0xFF1E293B),
                    ),
                  );
                },
              ),
            ],
          ),

          const SizedBox(height: 12),

          // ─── Tèks rezime atik yo ──────────────────────────
          Text(
            itemsSummary,
            style: const TextStyle(
              color: Color(0xFF475569),
              fontSize: 13,
              height: 1.3,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 14),

          // ─── Miniatire Imaj Pwodui yo (DoorDash thumbnails) ─
          SizedBox(
            height: 52,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: cart.items.length > 5 ? 6 : cart.items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                if (i == 5 && cart.items.length > 5) {
                  final remaining = cart.items.length - 5;
                  return Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Center(
                      child: Text(
                        '+$remaining',
                        style: const TextStyle(
                          color: Color(0xFF475569),
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                }

                final cartItem = cart.items[i];
                return Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    image: cartItem.item.image != null
                        ? DecorationImage(
                            image: NetworkImage(cartItem.item.image!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: cartItem.item.image == null
                      ? const Center(
                          child: Icon(Icons.fastfood_rounded, color: Colors.grey, size: 22),
                        )
                      : null,
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // ─── Bouton "View Cart" ───────────────────────────
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF1F5F9),
                foregroundColor: const Color(0xFF191919),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
              ),
              onPressed: () {
                ref.read(cartProvider.notifier).setActiveMerchant(merchant.id);
                context.push('/cart');
              },
              child: const Text(
                'Gade Panyen Sa a',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // ─── Lyen "Add more items" ────────────────────────
          Center(
            child: TextButton(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: () {
                context.push('/merchant/${merchant.id}', extra: merchant);
              },
              child: const Text(
                'Ajoute lòt atik',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
