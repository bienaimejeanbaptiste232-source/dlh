import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class RatingReviewDialog extends StatefulWidget {
  final String orderId;
  final String merchantName;
  final String? driverName;

  const RatingReviewDialog({
    super.key,
    required this.orderId,
    required this.merchantName,
    this.driverName,
  });

  static Future<void> show(
    BuildContext context, {
    required String orderId,
    required String merchantName,
    String? driverName,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => RatingReviewDialog(
        orderId: orderId,
        merchantName: merchantName,
        driverName: driverName,
      ),
    );
  }

  @override
  State<RatingReviewDialog> createState() => _RatingReviewDialogState();
}

class _RatingReviewDialogState extends State<RatingReviewDialog> {
  int merchantRating = 5;
  int driverRating = 5;
  final Set<String> selectedTags = {'Manje a cho', 'Livrezon rapid'};
  final commentController = TextEditingController();
  bool isSubmitting = false;

  final availableTags = [
    'Manje a cho',
    'Livrezon rapid',
    'Bon anbalaj',
    'Livrè trè koutwa',
    'Plat byen prepare',
    'Kòmand egzat',
  ];

  @override
  void dispose() {
    commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    setState(() => isSubmitting = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final ratedIds = (prefs.getStringList('rated_order_ids') ?? []).toSet();
      ratedIds.add(widget.orderId);
      await prefs.setStringList('rated_order_ids', ratedIds.toList());

      final reviewData = {
        'orderId': widget.orderId,
        'merchantName': widget.merchantName,
        'driverName': widget.driverName,
        'merchantRating': merchantRating,
        'driverRating': driverRating,
        'tags': selectedTags.toList(),
        'comment': commentController.text.trim(),
        'createdAt': DateTime.now().toIso8601String(),
      };
      await prefs.setString('review_${widget.orderId}', jsonEncode(reviewData));
    } catch (_) {}

    await Future.delayed(const Duration(milliseconds: 300));
    if (mounted) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mèsi pou evalyasyon ou! Nòt ou anrejistre avèk siksè. ⭐'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),

            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.star_rounded, color: Colors.amber, size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Bay Nòt & Evalyasyon',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF191919),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Center(
              child: const Text(
                'Ede nou kenbe pi bon kalite sèvis nan Delivery Haïti',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
            ),

            const SizedBox(height: 24),

            // 1. Restaurant Rating
            Row(
              children: [
                const Icon(Icons.restaurant_rounded, size: 18, color: Color(0xFF64748B)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Restoran: ${widget.merchantName}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF191919), fontSize: 15),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final star = index + 1;
                return IconButton(
                  icon: Icon(
                    star <= merchantRating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 36,
                  ),
                  onPressed: () => setState(() => merchantRating = star),
                );
              }),
            ),

            const SizedBox(height: 16),

            // 2. Driver Rating
            Row(
              children: [
                const Icon(Icons.two_wheeler_rounded, size: 18, color: Color(0xFF64748B)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Livrè: ${widget.driverName ?? "Chofè moto"}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF191919), fontSize: 15),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final star = index + 1;
                return IconButton(
                  icon: Icon(
                    star <= driverRating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 36,
                  ),
                  onPressed: () => setState(() => driverRating = star),
                );
              }),
            ),

            const SizedBox(height: 18),

            // Tags
            const Text(
              'Kisa w te pi apresye ?',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF191919)),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: availableTags.map((tag) {
                final isSelected = selectedTags.contains(tag);
                return FilterChip(
                  label: Text(tag, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : const Color(0xFF191919))),
                  selected: isSelected,
                  selectedColor: AppConstants.primaryCrimson,
                  backgroundColor: const Color(0xFFF1F5F9),
                  side: BorderSide(color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0)),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        selectedTags.add(tag);
                      } else {
                        selectedTags.remove(tag);
                      }
                    });
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 18),

            // Comment Field
            TextField(
              controller: commentController,
              style: const TextStyle(color: Color(0xFF191919), fontSize: 14),
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Ekri yon ti kòmantè sou eksperyans ou (opsyonèl)...',
                hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                filled: true,
                fillColor: const Color(0xFFF8F9FA),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppConstants.primaryCrimson, width: 1.5),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: isSubmitting ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryCrimson,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: isSubmitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text(
                        'Voye Evalyasyon an ⭐',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
