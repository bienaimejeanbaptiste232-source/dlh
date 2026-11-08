import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/constants.dart';
import '../providers/app_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _iconForType(String type) {
    switch (type) {
      case 'ORDER_UPDATE':
        return Icons.local_shipping_rounded;
      case 'PROMO':
        return Icons.local_offer_rounded;
      case 'LOYALTY':
        return Icons.stars_rounded;
      case 'SYSTEM':
        return Icons.verified_user_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'ORDER_UPDATE':
        return const Color(0xFF2563EB); // Royal Blue
      case 'PROMO':
        return AppConstants.primaryCrimson;
      case 'LOYALTY':
        return const Color(0xFFF59E0B); // Amber gold
      case 'SYSTEM':
        return const Color(0xFF10B981); // Emerald green
      default:
        return const Color(0xFF6366F1); // Indigo
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'Kounye a';
    if (diff.inMinutes < 60) return 'Sa gen ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Sa gen ${diff.inHours}h';
    if (diff.inDays < 7) return 'Sa gen ${diff.inDays}j';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final notifNotifier = ref.read(notificationsProvider.notifier);
    final unread = ref.watch(unreadCountProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        color: AppConstants.primaryCrimson,
        onRefresh: () async {
          await notifNotifier.refresh();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            SliverAppBar(
              expandedHeight: 120,
              pinned: true,
              backgroundColor: const Color(0xFFFF6600),
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                onPressed: () => Navigator.of(context).pop(),
              ),
              flexibleSpace: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: FlexibleSpaceBar(
                  titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
                  title: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Notifikasyon',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      if (unread > 0)
                        Text(
                          "$unread mesaj poko li",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        )
                      else if (notifications.isNotEmpty)
                        Text(
                          "${notifications.length} mesaj",
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              actions: [
                if (unread > 0)
                  TextButton.icon(
                    onPressed: () => notifNotifier.markAllRead(),
                    icon: const Icon(Icons.done_all_rounded, size: 16, color: Colors.white),
                    label: const Text('Tout li',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                if (notifications.isNotEmpty)
                  IconButton(
                    tooltip: 'Efase tout',
                    icon: const Icon(Icons.delete_sweep_rounded, color: Colors.white, size: 22),
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (dCtx) => AlertDialog(
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                          title: const Row(
                            children: [
                              Icon(Icons.delete_outline_rounded,
                                  color: Color(0xFFEF4444)),
                              SizedBox(width: 8),
                              Text('Efase tout notifikasyon?',
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                          content: const Text(
                            'Èske w sèten ou vle efase tout notifikasyon yo nèt sou aparèy sa a?',
                            style: TextStyle(color: Color(0xFF475569)),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(dCtx).pop(),
                              child: const Text('Anile',
                                  style: TextStyle(color: Color(0xFF64748B))),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFEF4444),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () {
                                Navigator.of(dCtx).pop();
                                notifNotifier.clearAll();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Tout notifikasyon yo efase!'),
                                    backgroundColor: Color(0xFF0F172A),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              },
                              child: const Text('Wi, Efase Tout',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                const SizedBox(width: 8),
              ],
            ),

            notifications.isEmpty
                ? SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: const Icon(Icons.notifications_off_rounded,
                                  size: 40, color: Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'Okenn notifikasyon pou kounye a',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Lè ou pase yon kòmand oswa gen yon aktyalizasyon sou kont ou, mesaj yo ap parèt isit la an tan reyèl.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 13,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 24),
                            OutlinedButton.icon(
                              onPressed: () => notifNotifier.refresh(),
                              icon: const Icon(Icons.refresh_rounded, size: 18),
                              label: const Text('Rachaje notifikasyon yo'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF0F172A),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 10),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) {
                          final notif = notifications[i];
                          final color = _colorForType(notif.type);

                          return Dismissible(
                            key: Key(notif.id),
                            direction: DismissDirection.endToStart,
                            onDismissed: (_) {
                              notifNotifier.dismiss(notif.id);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Notifikasyon efase'),
                                  duration: Duration(seconds: 1),
                                ),
                              );
                            },
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEE2E2),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.delete_outline_rounded,
                                  color: Color(0xFFEF4444), size: 28),
                            ),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () {
                                notifNotifier.markRead(notif.id);
                                if (notif.orderId != null && notif.orderId!.isNotEmpty) {
                                  context.push('/order-tracking/${notif.orderId}');
                                }
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: notif.isRead
                                        ? const Color(0xFFE2E8F0)
                                        : color.withValues(alpha: 0.35),
                                    width: notif.isRead ? 1 : 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                          alpha: notif.isRead ? 0.02 : 0.05),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: color.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Icon(_iconForType(notif.type),
                                            color: color, size: 22),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    notif.title,
                                                    style: TextStyle(
                                                      color: const Color(0xFF0F172A),
                                                      fontSize: 14,
                                                      fontWeight: notif.isRead
                                                          ? FontWeight.w600
                                                          : FontWeight.w900,
                                                    ),
                                                  ),
                                                ),
                                                if (!notif.isRead) ...[
                                                  Container(
                                                    width: 8,
                                                    height: 8,
                                                    decoration: BoxDecoration(
                                                      color: color,
                                                      shape: BoxShape.circle,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 4),
                                                ],
                                                IconButton(
                                                  icon: const Icon(
                                                    Icons.close_rounded,
                                                    color: Color(0xFF94A3B8),
                                                    size: 18,
                                                  ),
                                                  splashRadius: 16,
                                                  padding: EdgeInsets.zero,
                                                  constraints: const BoxConstraints(),
                                                  tooltip: 'Efase notifikasyon sa a',
                                                  onPressed: () {
                                                    notifNotifier.dismiss(notif.id);
                                                    ScaffoldMessenger.of(context)
                                                        .showSnackBar(
                                                      const SnackBar(
                                                        content: Text(
                                                            'Notifikasyon efase'),
                                                        duration:
                                                            Duration(seconds: 1),
                                                      ),
                                                    );
                                                  },
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 5),
                                            Text(
                                              notif.body,
                                              style: TextStyle(
                                                color: notif.isRead
                                                    ? const Color(0xFF64748B)
                                                    : const Color(0xFF334155),
                                                fontSize: 13,
                                                height: 1.35,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Icon(Icons.access_time_rounded,
                                                    size: 12,
                                                    color: color.withValues(alpha: 0.8)),
                                                const SizedBox(width: 4),
                                                Text(
                                                  _timeAgo(notif.createdAt),
                                                  style: TextStyle(
                                                    color: color.withValues(alpha: 0.9),
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                                if (notif.orderId != null &&
                                                    notif.orderId!.isNotEmpty) ...[
                                                  const Spacer(),
                                                  Row(
                                                    children: [
                                                      Text(
                                                        'Swiv kòmand',
                                                        style: TextStyle(
                                                          color: color,
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w800,
                                                        ),
                                                      ),
                                                      Icon(
                                                          Icons.chevron_right_rounded,
                                                          size: 14,
                                                          color: color),
                                                    ],
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                        childCount: notifications.length,
                      ),
                    ),
                  ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
          ],
        ),
      ),
    );
  }
}
