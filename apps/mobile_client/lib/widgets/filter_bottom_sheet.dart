import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/constants.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';

/// Bottom sheet for sort/filter options — call with showModalBottomSheet
class FilterBottomSheet extends ConsumerWidget {
  const FilterBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const FilterBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(filterProvider);
    final notifier = ref.read(filterProvider.notifier);

    final sortOptions = [
      (SortOption.recommended, 'Rekòmande', Icons.thumb_up_rounded),
      (SortOption.fastest, 'Pi Vit', Icons.flash_on_rounded),
      (SortOption.highestRated, 'Plis Note', Icons.star_rounded),
      (SortOption.priceAsc, 'Pri: Ba → Wo', Icons.arrow_upward_rounded),
      (SortOption.priceDesc, 'Pri: Wo → Ba', Icons.arrow_downward_rounded),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF161922),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filtè & Triye',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              TextButton(
                onPressed: () => notifier.reset(),
                child: Text(
                  'Efase tout',
                  style: TextStyle(color: AppConstants.primaryCrimson, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Sort Options
          const Text(
            'TRIYE PA',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: sortOptions.map((opt) {
              final isSelected = filter.sortBy == opt.$1;
              return GestureDetector(
                onTap: () => notifier.updateSort(opt.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppConstants.primaryCrimson
                        : AppConstants.cardElevated,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? AppConstants.primaryCrimson
                          : Colors.white.withOpacity(0.08),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(opt.$3,
                          size: 15,
                          color: isSelected ? Colors.white : Colors.white60),
                      const SizedBox(width: 6),
                      Text(
                        opt.$2,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white70,
                          fontSize: 13,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Toggle Filters
          const Text(
            'FILTÈ',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          _ToggleTile(
            icon: Icons.store_rounded,
            label: 'Ouvè Sèlman',
            value: filter.openOnly,
            onChanged: (_) => notifier.toggleOpenOnly(),
          ),
          _ToggleTile(
            icon: Icons.local_shipping_rounded,
            label: 'Livrezon Gratis',
            value: filter.freeDelivery,
            onChanged: (_) => notifier.toggleFreeDelivery(),
          ),
          const SizedBox(height: 12),

          // Max Delivery Fee Slider
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Maks Frè Livrezon',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
              Text(
                '${filter.maxDeliveryFee.toInt()} HTG',
                style: TextStyle(
                  color: AppConstants.accentCyan,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          Slider(
            value: filter.maxDeliveryFee,
            min: 0,
            max: 1000,
            divisions: 20,
            activeColor: AppConstants.primaryCrimson,
            inactiveColor: Colors.white12,
            onChanged: (v) => notifier.setMaxFee(v),
          ),
          const SizedBox(height: 16),

          // Apply Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.primaryCrimson,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Aplike Filtè',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: AppConstants.cardElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: value
              ? AppConstants.primaryCrimson.withOpacity(0.4)
              : Colors.white.withOpacity(0.06),
        ),
      ),
      child: Row(
        children: [
          Icon(icon,
              size: 20,
              color: value ? AppConstants.primaryCrimson : Colors.white54),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: value ? Colors.white : Colors.white70,
                fontSize: 14,
                fontWeight: value ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppConstants.primaryCrimson,
            inactiveThumbColor: Colors.white38,
            inactiveTrackColor: Colors.white12,
          ),
        ],
      ),
    );
  }
}
