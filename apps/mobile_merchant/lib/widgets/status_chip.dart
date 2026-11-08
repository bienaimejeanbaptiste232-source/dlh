import 'package:flutter/material.dart';

/// Widget chip pou montre estati yon kòmand DLH egzakteman tankou makèt la
class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final s = status.toUpperCase();

    if (s == 'DELIVERED' || s == 'LIVRE') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF00C853),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 13),
            SizedBox(width: 4),
            Text(
              'Livre',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
      );
    } else if (s == 'PENDING' || s == 'AN_PWOSESIS' || s == 'PREPARING' || s == 'RESTAURANT_ACCEPTED') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3CD),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFFEEBA), width: 1),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.hourglass_top_rounded, color: Color(0xFFB78103), size: 12),
            SizedBox(width: 4),
            Text(
              'An Pwosesis',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFFB78103),
              ),
            ),
          ],
        ),
      );
    } else if (s == 'IN_TRANSIT' || s == 'SOU_WOUT' || s == 'PICKED_UP' || s == 'DRIVER_ARRIVING') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFE1F5FE),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFB3E5FC), width: 1),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.two_wheeler_rounded, color: Color(0xFF0288D1), size: 13),
            SizedBox(width: 4),
            Text(
              'Sou wout',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0288D1),
              ),
            ),
          ],
        ),
      );
    } else {
      // Default / Confirmed / etc.
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFEDE9FE),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          s == 'CONFIRMED' ? 'Konfime' : (s == 'CANCELLED' ? 'Anile' : s),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF6D28D9),
          ),
        ),
      );
    }
  }
}
