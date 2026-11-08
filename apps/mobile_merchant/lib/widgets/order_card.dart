import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme/app_colors.dart';
import '../models/merchant_models.dart';
import 'status_chip.dart';

/// Kart pou afiche rezime yon kòmand DLH (egzakteman tankou makèt la)
class OrderCard extends StatelessWidget {
  final MerchantOrder? order;
  // Opsyon pou demontre si pa gen vrè objè
  final String? customOrderNumber;
  final String? customCustomerName;
  final String? customItems;
  final String? customStatus;
  final String? customTime;
  final VoidCallback? onTap;

  const OrderCard({
    super.key,
    this.order,
    this.customOrderNumber,
    this.customCustomerName,
    this.customItems,
    this.customStatus,
    this.customTime,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final orderNum = customOrderNumber != null
        ? (customOrderNumber!.startsWith('#') ? customOrderNumber! : '#$customOrderNumber')
        : (order != null ? '#DLH-${order!.orderNumber}' : '#DLH-00000');
    final custName = customCustomerName ?? (order != null ? 'Client: ${order!.customerName}' : 'Client');
    final itemsText = customItems ??
        (order != null && order!.items.isNotEmpty
            ? order!.items.map((i) => '${i.quantity} ${i.name}').join(' + ')
            : '1 Kòmand');
    final statusStr = customStatus ?? (order != null ? order!.status : 'PENDING');
    final timeStr = customTime ??
        (order != null ? DateFormat('hh:mm a').format(order!.createdAt) : '10:00 AM');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: DLHColors.dlhBorder.withValues(alpha: 0.8), width: 1),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 10,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Dark navy icon container with white bag (egzakteman tankou makèt la)
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFF0A1628),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.shopping_bag_outlined,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Order info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    orderNum,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: DLHColors.dlhTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    custName,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: DLHColors.dlhTextSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    itemsText,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF94A3B8),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Status chip & Time
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                StatusChip(status: statusStr),
                const SizedBox(height: 6),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.access_time_rounded,
                      size: 13,
                      color: Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      timeStr,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(width: 4),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF64748B),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
