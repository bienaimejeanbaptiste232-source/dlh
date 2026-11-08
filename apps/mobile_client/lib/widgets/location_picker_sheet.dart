import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';

const _kOrange = Color(0xFFFF6600);
const _kOrangeSoft = Color(0xFFFFF1EB);
const _kDarkText = Color(0xFF0F172A);
const _kMutedText = Color(0xFF64748B);
const _kBorderColor = Color(0xFFE2E8F0);

/// Modal modèn pou chwazi ak presize adrès livrezon nan vil Cap-Haïtien
class LocationPickerSheet extends ConsumerStatefulWidget {
  const LocationPickerSheet({super.key});

  static Future<DeliveryLocation?> show(BuildContext context) {
    return showModalBottomSheet<DeliveryLocation>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const LocationPickerSheet(),
    );
  }

  @override
  ConsumerState<LocationPickerSheet> createState() =>
      _LocationPickerSheetState();
}

class _LocationPickerSheetState extends ConsumerState<LocationPickerSheet> {
  late TextEditingController _addressController;
  late TextEditingController _landmarkController;
  late TextEditingController _instructionsController;

  final List<String> _quickAddresses = [
    'Boulevard du Cap (Bòdmè), Cap-Haïtien',
    'Rue 18 & Boulevard, Carénage, Cap-Haïtien',
    'Place d\'Armes (Santvil), Cap-Haïtien',
    'Carrefour Samari, Haut-du-Cap, Cap-Haïtien',
    'Baryè Boutèy / Vertières, Cap-Haïtien',
    'Madeline / Petite Anse, Cap-Haïtien',
    'Rivyè Frwad / Nan Bannann, Cap-Haïtien',
  ];

  final List<String> _landmarkSuggestions = [
    'Bò Katedral la',
    'Bòdmè / Lakwa',
    'Baryè Boutèy',
    'Bank BNC / Sogebank',
    'Estasyon Gazolin Total',
    'Lopital Jistinien',
  ];

  @override
  void initState() {
    super.initState();
    final current = ref.read(deliveryLocationProvider);
    _addressController = TextEditingController(
      text: current.address.isNotEmpty
          ? current.address
          : 'Boulevard du Cap (Bòdmè), Cap-Haïtien',
    );
    _landmarkController = TextEditingController(text: current.landmark ?? '');
    _instructionsController =
        TextEditingController(text: current.instructions ?? '');
  }

  @override
  void dispose() {
    _addressController.dispose();
    _landmarkController.dispose();
    _instructionsController.dispose();
    super.dispose();
  }

  void _confirm() {
    HapticFeedback.lightImpact();
    final addr = _addressController.text.trim().isEmpty
        ? 'Cap-Haïtien, Haïti'
        : _addressController.text.trim();
    final loc = DeliveryLocation(
      address: addr,
      landmark: _landmarkController.text.trim().isEmpty
          ? null
          : _landmarkController.text.trim(),
      instructions: _instructionsController.text.trim().isEmpty
          ? null
          : _instructionsController.text.trim(),
      latitude: 19.7550,
      longitude: -72.2050,
    );
    ref.read(deliveryLocationProvider.notifier).updateLocation(loc);
    Navigator.of(context).pop(loc);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, 24 + bottomInset),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header Row
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: _kOrangeSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(Icons.location_on_rounded,
                        color: _kOrange, size: 24),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Adrès Livrezon',
                        style: TextStyle(
                          color: _kDarkText,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                        ),
                      ),
                      Text(
                        'Chwazi oswa ekri kote pou kourye a livre w la',
                        style: TextStyle(color: _kMutedText, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close_rounded,
                        size: 20, color: _kMutedText),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Light Vector Map Placeholder
            Container(
              height: 130,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: const Color(0xFFF8FAFC),
                border: Border.all(color: _kBorderColor),
              ),
              child: Stack(
                children: [
                  CustomPaint(
                    size: const Size(double.infinity, 130),
                    painter: _LightMapGridPainter(),
                  ),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _kOrange.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_pin,
                            color: _kOrange,
                            size: 32,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _kOrange,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: _kOrange.withValues(alpha: 0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: const Text(
                            'Pozisyon Ou • Cap-Haïtien',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: _kBorderColor),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.my_location_rounded,
                              size: 13, color: Color(0xFF059669)),
                          SizedBox(width: 4),
                          Text(
                            'GPS Aktif',
                            style: TextStyle(
                              color: Color(0xFF059669),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Quick Addresses Chips
            const Text(
              'ADRÈS RAPID NAN CAP-HAÏTIEN',
              style: TextStyle(
                color: _kMutedText,
                fontSize: 11,
                letterSpacing: 1.0,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 38,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: _quickAddresses.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) {
                  final addr = _quickAddresses[i];
                  final isSelected =
                      _addressController.text.trim() == addr.trim();
                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _addressController.text = addr);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isSelected ? _kOrangeSoft : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? _kOrange : _kBorderColor,
                          width: isSelected ? 1.5 : 1.0,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        addr.split(',').first,
                        style: TextStyle(
                          color: isSelected ? _kOrange : _kDarkText,
                          fontWeight:
                              isSelected ? FontWeight.w800 : FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),

            // Address Text Field
            _buildLightField(
              controller: _addressController,
              label: 'Adrès Konplè *',
              icon: Icons.home_rounded,
              hint: 'Ex: Boulevard du Cap, Carénage, etc.',
            ),
            const SizedBox(height: 14),

            // Landmark Field
            const Text(
              'REPÈ VIZYÈL (Opsyonèl)',
              style: TextStyle(
                color: _kMutedText,
                fontSize: 11,
                letterSpacing: 1.0,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: _landmarkSuggestions.map((s) {
                final isSelected =
                    _landmarkController.text.trim() == s.trim();
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _landmarkController.text = s);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? _kOrangeSoft : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected ? _kOrange : _kBorderColor,
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Text(
                      s,
                      style: TextStyle(
                        color: isSelected ? _kOrange : _kDarkText,
                        fontSize: 11.5,
                        fontWeight:
                            isSelected ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            _buildLightField(
              controller: _landmarkController,
              label: 'Repè espesifik pre ou',
              icon: Icons.place_rounded,
              hint: 'Ex: Devan Bank Sogebank, Bò estasyon Total...',
            ),
            const SizedBox(height: 14),

            // Instructions Field
            _buildLightField(
              controller: _instructionsController,
              label: 'Enstriksyon pou Kourye a (Opsyonèl)',
              icon: Icons.notes_rounded,
              hint: 'Ex: Rele m lè w devan pòtay la. Kay ble.',
              maxLines: 2,
            ),
            const SizedBox(height: 22),

            // Confirm Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _confirm,
                icon: const Icon(Icons.check_circle_rounded, size: 20),
                label: const Text(
                  'Konfime Adrès Sa a',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    letterSpacing: 0.2,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _kOrange,
                  foregroundColor: Colors.white,
                  elevation: 3,
                  shadowColor: _kOrange.withValues(alpha: 0.4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLightField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required String hint,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(
          color: _kDarkText, fontSize: 13.5, fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: const TextStyle(color: _kMutedText, fontSize: 13),
        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 12.5),
        prefixIcon: Icon(icon, color: _kOrange, size: 20),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _kBorderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _kBorderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _kOrange, width: 1.8),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Light Map Grid Texture
// ─────────────────────────────────────────────────────────────────────────────
class _LightMapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1;

    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}
