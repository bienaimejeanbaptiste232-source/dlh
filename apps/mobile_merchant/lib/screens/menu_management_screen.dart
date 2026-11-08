import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../config/business_type_config.dart';
import '../config/constants.dart';
import '../models/merchant_models.dart';
import '../providers/merchant_providers.dart';
import '../utils/product_meta.dart';

class MenuManagementScreen extends ConsumerStatefulWidget {
  final bool showAppBar;
  const MenuManagementScreen({super.key, this.showAppBar = true});

  @override
  ConsumerState<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends ConsumerState<MenuManagementScreen> {
  String? _selectedCategoryId;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showEditPriceModal(BuildContext context, MerchantProduct product, BusinessTypeConfig config) {
    final priceController = TextEditingController(text: product.price.toInt().toString());
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          'Chanje Pri: ${product.name}',
          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 17, fontWeight: FontWeight.bold),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mete nouvo pri a an Gourdes (HTG) pou ${config.itemLabel.toLowerCase()} sa a:',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: priceController,
                keyboardType: TextInputType.number,
                autofocus: true,
                style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 18),
                decoration: InputDecoration(
                  suffixText: 'HTG',
                  suffixStyle: const TextStyle(color: MerchantConstants.brandAmber, fontWeight: FontWeight.bold),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: config.theme.primary, width: 1.8)),
                  labelText: 'Nouvo Pri',
                  labelStyle: const TextStyle(color: Color(0xFF475569)),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Anile', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: config.theme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              final newP = double.tryParse(priceController.text);
              if (newP != null && newP > 0) {
                Navigator.pop(ctx);
                final ok = await ref.read(merchantProductsProvider.notifier).updatePrice(product.id, newP);
                if (mounted) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        ok ? 'Pri ${product.name} modifye pou ${newP.toInt()} HTG !' : 'Erè lè w t ap chanje pri a',
                      ),
                      backgroundColor: ok ? Colors.green : Colors.redAccent,
                    ),
                  );
                }
              }
            },
            child: const Text('Anrejistre', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showCreateCategoryDialog(BuildContext context, BusinessTypeConfig config) {
    final catNameController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.category_outlined, color: config.theme.primary),
            const SizedBox(width: 8),
            const Text('Nouvo Kategori', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mete non nouvo kategori w vle kreye a pou klase ${config.itemLabel.toLowerCase()} yo:',
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: catNameController,
              autofocus: true,
              style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                labelText: 'Non Kategori',
                hintText: 'egz: Spesyal Chef la, Salad, Soupe...',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: config.theme.primary, width: 1.8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Anile', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: config.theme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              final name = catNameController.text.trim();
              if (name.isEmpty) return;

              final profile = ref.read(merchantProfileProvider);
              final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(ctx);

              final newCat = await ref.read(merchantApiProvider).createCustomCategory(
                merchantId: merchantId,
                name: name,
              );

              ref.invalidate(merchantCategoriesProvider);

              if (mounted) {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(newCat != null ? 'Kategori "$name" ajoute avèk siksè !' : 'Erè pandan kreyasyon kategori a'),
                    backgroundColor: newCat != null ? Colors.green : Colors.redAccent,
                  ),
                );
              }
            },
            child: const Text('Kreye Kategori', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  static Color _colorFromName(String name) {
    switch (name.toLowerCase()) {
      case 'nwa': return Colors.black;
      case 'blan': return Colors.white;
      case 'wouj': return Colors.red;
      case 'ble': return Colors.blue;
      case 'vèt': case 'vet': return Colors.green;
      case 'kaki': return const Color(0xFF8B7355);
      case 'gri': return Colors.grey;
      case 'jòn': case 'jon': return Colors.yellow.shade700;
      case 'woz': return Colors.pink;
      case 'mawon': return Colors.brown;
      default: return Colors.grey.shade400;
    }
  }

  void _showAddProductDialog(BuildContext context, List<MerchantCategory> categories, BusinessTypeConfig config) {
    // Deduplike kategori pa non pou pa janm gen doublon nan dropdown an
    final Map<String, MerchantCategory> uniqueCategoriesMap = {};
    for (final cat in categories) {
      final key = cat.name.trim().toLowerCase();
      if (!uniqueCategoriesMap.containsKey(key)) {
        uniqueCategoriesMap[key] = cat;
      }
    }
    final activeCategories = uniqueCategoriesMap.values.toList();

    final nameController = TextEditingController();
    final priceController = TextEditingController();
    final descController = TextEditingController();
    final unitController = TextEditingController();
    final brandController = TextEditingController();
    final dosageController = TextEditingController();
    final expiryController = TextEditingController();
    final usageController = TextEditingController();
    final dimensionsController = TextEditingController();
    final ramController = TextEditingController();
    final storageController = TextEditingController();
    final warrantyController = TextEditingController();
    final imageUrlController = TextEditingController();
    final customOptionController = TextEditingController();
    final selectedOptions = <String>{};
    final selectedExtras = <String>{};
    bool requiresPrescription = false;
    // CLOTHING fields
    final selectedSizes = <String>{};
    final selectedColors = <String>{};
    // Map "size|color" -> stock
    final Map<String, TextEditingController> variantStockControllers = {};
    // RESTAURANT fields
    final selectedPortions = <String>{};
    final selectedAccompaniments = <String>{};
    // CONSTRUCTION fields
    String? selectedTransportCondition;
    String? selectedUnit;
    // TECH fields
    String? selectedCondition;

    String selectedCatId = activeCategories.isNotEmpty ? activeCategories.first.id : (config.defaultCategories.first);
    int selectedPrepMinutes = 15;

    Uint8List? pickedImageBytes;
    bool isUploadingImage = false;
    final ImagePicker imagePicker = ImagePicker();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          Future<void> pickLocalPhoto(ImageSource source) async {
            try {
              final XFile? file = await imagePicker.pickImage(
                source: source,
                maxWidth: 800,
                maxHeight: 800,
                imageQuality: 75,
              );
              if (file != null) {
                setModalState(() {
                  isUploadingImage = true;
                });
                final bytes = await file.readAsBytes();
                pickedImageBytes = bytes;

                final profile = ref.read(merchantProfileProvider);
                final merchantId = profile?.id ?? '0bdb1352-ac29-4b2b-8cc5-89091bee384a';

                final uploaded = await ref.read(merchantApiProvider).uploadProductImage(
                  merchantId: merchantId,
                  imageBytes: bytes,
                  fileName: file.name,
                );

                if (uploaded != null) {
                  imageUrlController.text = uploaded;
                }
                setModalState(() {
                  isUploadingImage = false;
                });
              }
            } catch (e) {
              debugPrint('[PickImage] error: $e');
              setModalState(() {
                isUploadingImage = false;
              });
            }
          }

          return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.85,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Text(config.icon, style: const TextStyle(fontSize: 22)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                config.addItemLabel,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                const SizedBox(height: 14),

                // Non pwodwi / medikaman / materyo / plat
                TextField(
                  controller: nameController,
                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    labelText: config.nameFieldHint,
                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                    prefixIcon: Icon(
                      config.type == 'PHARMACY'
                          ? Icons.medication
                          : (config.type == 'CONSTRUCTION' ? Icons.construction : Icons.storefront),
                      color: MerchantConstants.brandOrange,
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: MerchantConstants.brandOrange, width: 1.8)),
                  ),
                ),
                const SizedBox(height: 12),

                // Kategori Espesyalize
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Kategori:', style: TextStyle(color: Color(0xFF334155), fontSize: 13, fontWeight: FontWeight.w600)),
                    InkWell(
                      onTap: () => _showCreateCategoryDialog(context, config),
                      child: const Row(
                        children: [
                          Icon(Icons.add_circle_outline, size: 14, color: MerchantConstants.brandOrange),
                          SizedBox(width: 4),
                          Text(
                            '+ Nouvo Kategori',
                            style: TextStyle(color: MerchantConstants.brandOrange, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: activeCategories.any((cat) => cat.id == selectedCatId)
                          ? selectedCatId
                          : (activeCategories.isNotEmpty ? activeCategories.first.id : (config.defaultCategories.first)),
                      isExpanded: true,
                      dropdownColor: Colors.white,
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.w500),
                      items: (activeCategories.isNotEmpty)
                          ? activeCategories.map((cat) => DropdownMenuItem(value: cat.id, child: Text(cat.name))).toList()
                          : config.defaultCategories.map((cName) => DropdownMenuItem(value: cName, child: Text(cName))).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setModalState(() => selectedCatId = val);
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Chan Preskripsyon pou Famasi
                if (config.hasPrescriptionField) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.assignment_outlined, color: Color(0xFFD97706), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Preskripsyon Medikal Obligatwa',
                              style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        Switch(
                          value: requiresPrescription,
                          activeThumbColor: const Color(0xFFD97706),
                          onChanged: (val) => setModalState(() => requiresPrescription = val),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Chan Inite Vant pou Materyo Konstriksyon oswa Makèt
                if (config.hasUnitField) ...[
                  TextField(
                    controller: unitController,
                    style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                    decoration: InputDecoration(
                      labelText: 'Inite Vant (egz: Sak, Mèt, Pake, Pyès, Barik, Lit)',
                      labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                      prefixIcon: const Icon(Icons.straighten, color: Color(0xFF0284C7)),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: MerchantConstants.brandOrange, width: 1.8)),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Pri
                TextField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Pri (an HTG) *',
                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                    prefixIcon: const Icon(Icons.payments_outlined, color: MerchantConstants.brandAmber),
                    suffixText: 'HTG',
                    suffixStyle: const TextStyle(color: MerchantConstants.brandAmber, fontWeight: FontWeight.bold),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: MerchantConstants.brandOrange, width: 1.8)),
                  ),
                ),
                const SizedBox(height: 12),

                // Foto / Imaj Plat la oswa Atik la (Kote machann mete foto pou kliyan wè)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.camera_alt_outlined, size: 16, color: MerchantConstants.brandOrange),
                        const SizedBox(width: 6),
                        Text(
                          'Foto ${config.itemLabel.toLowerCase()} an:',
                          style: const TextStyle(color: Color(0xFF334155), fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    if (isUploadingImage)
                      const Row(
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: MerchantConstants.brandOrange),
                          ),
                          SizedBox(width: 6),
                          Text(
                            'Chajman ap fèt...',
                            style: TextStyle(color: MerchantConstants.brandOrange, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 8),

                // Bouton pou chwazi an lokal sou aparèy la (Kamera oswa Galeri)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: MerchantConstants.brandOrange,
                          side: const BorderSide(color: MerchantConstants.brandOrange, width: 1.4),
                          backgroundColor: const Color(0xFFFFF7ED),
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.photo_camera, size: 18),
                        label: const Text(
                          'Pran Foto',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        onPressed: isUploadingImage ? null : () => pickLocalPhoto(ImageSource.camera),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0F172A),
                          side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                          backgroundColor: const Color(0xFFF8FAFC),
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.photo_library_outlined, size: 18, color: Color(0xFF0284C7)),
                        label: const Text(
                          'Galeri Aparèy',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        onPressed: isUploadingImage ? null : () => pickLocalPhoto(ImageSource.gallery),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Aperçu Live ak Chan URL Foto (si machann vle kole lyen)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Preview bwat la
                    Container(
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: (pickedImageBytes != null || imageUrlController.text.trim().isNotEmpty)
                              ? MerchantConstants.brandOrange
                              : const Color(0xFFCBD5E1),
                          width: (pickedImageBytes != null || imageUrlController.text.trim().isNotEmpty) ? 1.5 : 1,
                        ),
                      ),
                      child: isUploadingImage
                          ? const Center(
                              child: SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2, color: MerchantConstants.brandOrange),
                              ),
                            )
                          : (pickedImageBytes != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(11),
                                  child: Image.memory(pickedImageBytes!, fit: BoxFit.cover),
                                )
                              : (imageUrlController.text.trim().isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(11),
                                      child: _buildProductPhotoWidget(
                                        imageUrlController.text.trim(),
                                        fallback: const Center(
                                          child: Icon(Icons.broken_image, color: Color(0xFF94A3B8), size: 24),
                                        ),
                                      ),
                                    )
                                  : const Center(
                                      child: Icon(Icons.add_a_photo_outlined, color: Color(0xFF94A3B8), size: 24),
                                    ))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: imageUrlController,
                        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                        onChanged: (_) {
                          pickedImageBytes = null;
                          setModalState(() {});
                        },
                        decoration: InputDecoration(
                          labelText: 'Lyen foto a (otomatik oswa manyèl)',
                          labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                          hintText: 'Pran foto sou aparèy la oswa kole lyen...',
                          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                          suffixIcon: (imageUrlController.text.isNotEmpty || pickedImageBytes != null)
                              ? IconButton(
                                  icon: const Icon(Icons.close, size: 18),
                                  onPressed: () {
                                    imageUrlController.clear();
                                    pickedImageBytes = null;
                                    setModalState(() {});
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: MerchantConstants.brandOrange, width: 1.8)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Sugesyon / Foto Predefini
                const Text(
                  'Oubyen chwazi yon modèl rapid si w pa gen foto:',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 6),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _getPresetImages(config.type).map((preset) {
                      final isSelected = imageUrlController.text.trim() == preset['url'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () {
                            pickedImageBytes = null;
                            imageUrlController.text = preset['url']!;
                            setModalState(() {});
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFFFF7ED) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected ? MerchantConstants.brandOrange : const Color(0xFFE2E8F0),
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(preset['emoji'] ?? '🍽️', style: const TextStyle(fontSize: 12)),
                                const SizedBox(width: 4),
                                Text(
                                  preset['label']!,
                                  style: TextStyle(
                                    color: isSelected ? MerchantConstants.brandOrange : const Color(0xFF334155),
                                    fontSize: 11,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 12),

                // Deskripsyon / Dòz / Espesifikasyon
                TextField(
                  controller: descController,
                  maxLines: 2,
                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                  decoration: InputDecoration(
                    labelText: config.descFieldHint,
                    labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                    prefixIcon: const Icon(Icons.notes, color: Color(0xFF64748B)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: MerchantConstants.brandOrange, width: 1.8)),
                  ),
                ),
                const SizedBox(height: 14),

                // ── SEKSYON DINAMIK PA KALITE BOUTIK ──

                // ── PHARMACY seksyon ──
                if (config.hasDosageField) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F9FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(children: [
                          Icon(Icons.medical_services_outlined, size: 16, color: Color(0xFF0284C7)),
                          SizedBox(width: 6),
                          Text('Enfòmasyon Medikal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                        ]),
                        const SizedBox(height: 10),
                        // Brand/Fabrikan
                        TextField(
                          controller: brandController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Mak / Non Fabrikan',
                            hintText: 'egz: Pfizer, Bayer, GlaxoSmithKline...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.business_outlined, color: Color(0xFF0284C7), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Dosage/Volume
                        TextField(
                          controller: dosageController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Dòz / Volim / Gwosè',
                            hintText: 'egz: 500mg, 120ml, 1L, 2 konprime/jou...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.science_outlined, color: Color(0xFF0284C7), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Expiry Date
                        TextField(
                          controller: expiryController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Dat Ekspirasyon (si aplikab)',
                            hintText: 'egz: 03/2027, Janvye 2026...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.event_outlined, color: Color(0xFF0284C7), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Usage instructions
                        TextField(
                          controller: usageController,
                          maxLines: 2,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                          decoration: InputDecoration(
                            labelText: 'Enstriksyon Itilizasyon (opsyonèl)',
                            hintText: 'egz: Pran 1 konprime 3 fwa pa jou...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                            prefixIcon: const Icon(Icons.info_outline, color: Color(0xFF64748B), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Prescription switch
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: requiresPrescription ? const Color(0xFFFEF3C7) : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: requiresPrescription ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(children: [
                                Icon(Icons.assignment_outlined, color: Color(0xFFD97706), size: 20),
                                SizedBox(width: 8),
                                Text('Preskripsyon Medikal Obligatwa',
                                    style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.bold, fontSize: 13)),
                              ]),
                              Switch(
                                value: requiresPrescription,
                                activeThumbColor: const Color(0xFFD97706),
                                activeTrackColor: const Color(0xFFFDE68A),
                                onChanged: (val) => setModalState(() => requiresPrescription = val),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // ── CLOTHING seksyon ──
                if (config.hasVariantMatrix) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFCCDD7)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(children: [
                          Icon(Icons.checkroom_outlined, size: 16, color: Color(0xFFEC4899)),
                          SizedBox(width: 6),
                          Text('Gwosè ak Koulè Disponib', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                        ]),
                        const SizedBox(height: 10),
                        // Brand & Model
                        Row(children: [
                          Expanded(
                            child: TextField(
                              controller: brandController,
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                labelText: 'Mak',
                                hintText: 'Nike, Adidas...',
                                labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                                filled: true, fillColor: Colors.white,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFFCCDD7))),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFFCCDD7))),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFEC4899), width: 1.8)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: warrantyController,
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                labelText: 'Modèl',
                                hintText: 'Air Max, Slim Fit...',
                                labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                                filled: true, fillColor: Colors.white,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFFCCDD7))),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFFCCDD7))),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFEC4899), width: 1.8)),
                              ),
                            ),
                          ),
                        ]),
                        const SizedBox(height: 12),
                        // Sizes
                        const Text('Gwosè Disponib:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: config.availableSizes.map((size) {
                            final sel = selectedSizes.contains(size);
                            return GestureDetector(
                              onTap: () => setModalState(() {
                                if (sel) {
                                  selectedSizes.remove(size);
                                  // Remove variant controllers for this size
                                  variantStockControllers.removeWhere((k, v) => k.startsWith('$size|'));
                                } else {
                                  selectedSizes.add(size);
                                }
                              }),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(
                                  color: sel ? const Color(0xFFEC4899) : Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: sel ? const Color(0xFFEC4899) : const Color(0xFFCBD5E1)),
                                ),
                                child: Text(size, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: sel ? Colors.white : const Color(0xFF334155))),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 12),
                        // Colors
                        const Text('Koulè Disponib:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 10, runSpacing: 10,
                          children: config.availableColors.map((colorName) {
                            final sel = selectedColors.contains(colorName);
                            final c = _colorFromName(colorName);
                            return GestureDetector(
                              onTap: () => setModalState(() {
                                if (sel) {
                                  selectedColors.remove(colorName);
                                  variantStockControllers.removeWhere((k, v) => k.endsWith('|$colorName'));
                                } else {
                                  selectedColors.add(colorName);
                                }
                              }),
                              child: Tooltip(
                                message: colorName,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.all(3),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: sel ? const Color(0xFFEC4899) : Colors.transparent, width: 2.5),
                                  ),
                                  child: CircleAvatar(
                                    radius: 16,
                                    backgroundColor: c,
                                    child: c == Colors.white
                                        ? Icon(Icons.check, size: 14, color: sel ? const Color(0xFFEC4899) : Colors.transparent)
                                        : sel ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        // Variant matrix (stock per size × color)
                        if (selectedSizes.isNotEmpty && selectedColors.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          const Text('Stock pa Gwosè × Koulè:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                          const SizedBox(height: 8),
                          ...selectedSizes.map((size) => Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(size, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFEC4899))),
                              const SizedBox(height: 4),
                              Row(
                                children: selectedColors.map((color) {
                                  final key = '$size|$color';
                                  variantStockControllers.putIfAbsent(key, () => TextEditingController());
                                  return Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 6),
                                      child: Column(
                                        children: [
                                          Text(color, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                          const SizedBox(height: 2),
                                          TextField(
                                            controller: variantStockControllers[key],
                                            keyboardType: TextInputType.number,
                                            style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
                                            textAlign: TextAlign.center,
                                            decoration: InputDecoration(
                                              hintText: '0',
                                              hintStyle: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                                              isDense: true,
                                              filled: true, fillColor: Colors.white,
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFFCCDD7))),
                                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFFCCDD7))),
                                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFEC4899))),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 8),
                            ],
                          )),
                        ] else if (selectedSizes.isNotEmpty || selectedColors.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          const Text('💡 Chwazi omwen yon gwosè AK yon koulè pou kreye matris stock la.', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // ── RESTAURANT / FAST_FOOD seksyon ──
                if (config.hasPortions) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF5F5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(children: [
                          Icon(Icons.restaurant_outlined, size: 16, color: Color(0xFFDC2626)),
                          SizedBox(width: 6),
                          Text('Pòsyon & Akonpayman', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                        ]),
                        const SizedBox(height: 10),
                        // Portions
                        const Text('Gwosè Pòsyon (opsyonèl):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 8, runSpacing: 6,
                          children: ['Ti', 'Mwayen', 'Gwo'].map((portion) {
                            final sel = selectedPortions.contains(portion);
                            return FilterChip(
                              label: Text(portion, style: TextStyle(fontSize: 12, color: sel ? Colors.white : const Color(0xFF334155))),
                              selected: sel,
                              selectedColor: const Color(0xFFDC2626),
                              backgroundColor: Colors.white,
                              side: BorderSide(color: sel ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1)),
                              showCheckmark: false,
                              onSelected: (val) => setModalState(() { if (val) { selectedPortions.add(portion); } else { selectedPortions.remove(portion); } }),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 10),
                        // Accompaniments
                        const Text('Chwa / Akonpayman (kliyan chwazi gratis):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: ['Diri Kole ak Pwa', 'Diri Blan & Sòs', 'Bannann Peze', 'Fritay Melanje', 'Pikliz Separe', 'San Pikliz', 'Lalo', 'Soup Joumou'].map((opt) {
                            final isSel = selectedAccompaniments.contains(opt);
                            return FilterChip(
                              label: Text(opt, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : const Color(0xFF334155))),
                              selected: isSel,
                              selectedColor: MerchantConstants.brandOrange,
                              backgroundColor: Colors.white,
                              side: BorderSide(color: isSel ? MerchantConstants.brandOrange : const Color(0xFFCBD5E1)),
                              showCheckmark: false,
                              onSelected: (val) => setModalState(() { if (val) { selectedAccompaniments.add(opt); } else { selectedAccompaniments.remove(opt); } }),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 10),
                        // Extras
                        const Text('Ekstra & Sipleman (ak pri anplis):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: ['Ekstra Sòs (+50G)', 'Ekstra Zaboka (+150G)', 'Ekstra Fwomaj (+100G)', 'Bwason Anplis (+75G)', 'Ekstra Pikliz (+50G)', 'Fwi de mè (+200G)'].map((ext) {
                            final isSel = selectedExtras.contains(ext);
                            return FilterChip(
                              label: Text(ext, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w600)),
                              selected: isSel,
                              selectedColor: const Color(0xFFEA580C),
                              backgroundColor: Colors.white,
                              side: BorderSide(color: isSel ? const Color(0xFFEA580C) : const Color(0xFFCBD5E1)),
                              showCheckmark: false,
                              onSelected: (val) => setModalState(() { if (val) { selectedExtras.add(ext); } else { selectedExtras.remove(ext); } }),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 8),
                        // Custom option
                        Row(children: [
                          Expanded(
                            child: TextField(
                              controller: customOptionController,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
                              decoration: const InputDecoration(
                                hintText: 'Ajoute opsyon koutim (egz: Piman Dous, Sòs Mayo...)',
                                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                isDense: true, filled: true, fillColor: Colors.white,
                                border: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFFCBD5E1))),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              final text = customOptionController.text.trim();
                              if (text.isNotEmpty) {
                                setModalState(() { selectedExtras.add(text); customOptionController.clear(); });
                              }
                            },
                            child: const Text('+ Ajoute', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ]),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // ── SUPERMARKET / BEVERAGE_DEPOT seksyon ──
                if (config.hasUnitField && !config.hasTransportField) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(children: [
                          Icon(Icons.shopping_basket_outlined, size: 16, color: Color(0xFF16A34A)),
                          SizedBox(width: 6),
                          Text('Detay Makèt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                        ]),
                        const SizedBox(height: 10),
                        TextField(
                          controller: brandController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Mak Fabrikan',
                            hintText: 'egz: Nestlé, Unilever, Dlo Culligan...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.business_outlined, color: Color(0xFF16A34A), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBBF7D0))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBBF7D0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Unit dropdown
                        const Text('Inite Vant:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: config.availableUnits.map((unit) {
                            final sel = selectedUnit == unit;
                            return GestureDetector(
                              onTap: () => setModalState(() => selectedUnit = sel ? null : unit),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: sel ? const Color(0xFF16A34A) : Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: sel ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1)),
                                ),
                                child: Text(unit, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: sel ? Colors.white : const Color(0xFF334155))),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 10),
                        // Weight/Volume
                        TextField(
                          controller: dosageController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Pwa / Volim (opsyonèl)',
                            hintText: 'egz: 25 lbs, 5 galon, 1 lit...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.scale_outlined, color: Color(0xFF16A34A), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBBF7D0))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBBF7D0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Expiry
                        TextField(
                          controller: expiryController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Dat Ekspirasyon (si aplikab)',
                            hintText: 'egz: 03/2027...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.event_outlined, color: Color(0xFF16A34A), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBBF7D0))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFBBF7D0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.8)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // ── CONSTRUCTION seksyon ──
                if (config.hasTransportField) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(children: [
                          Icon(Icons.construction_outlined, size: 16, color: Color(0xFFD97706)),
                          SizedBox(width: 6),
                          Text('Detay Materyo Konstriksyon', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                        ]),
                        const SizedBox(height: 10),
                        // Unit
                        const Text('Inite Vant:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: config.availableUnits.map((unit) {
                            final sel = selectedUnit == unit;
                            return GestureDetector(
                              onTap: () => setModalState(() => selectedUnit = sel ? null : unit),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: sel ? const Color(0xFFD97706) : Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: sel ? const Color(0xFFD97706) : const Color(0xFFCBD5E1)),
                                ),
                                child: Text(unit, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: sel ? Colors.white : const Color(0xFF334155))),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 10),
                        // Dimensions
                        TextField(
                          controller: dimensionsController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                          decoration: InputDecoration(
                            labelText: 'Dimansyon / Tay',
                            hintText: 'egz: 1/2 pous, 6 pous, 20 pye, 50kg...',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.aspect_ratio_outlined, color: Color(0xFFD97706), size: 18),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFFDE68A))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFFDE68A))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD97706), width: 1.8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Transport condition
                        const Text('Kondisyon Transpò:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: ['Tipik', 'Kamyon lou obligatwa', 'Moto kago posib'].map((cond) {
                            final sel = selectedTransportCondition == cond;
                            final isWarning = cond == 'Kamyon lou obligatwa';
                            return GestureDetector(
                              onTap: () => setModalState(() => selectedTransportCondition = sel ? null : cond),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: sel ? (isWarning ? const Color(0xFFEF4444) : const Color(0xFFD97706)) : Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: sel ? (isWarning ? const Color(0xFFEF4444) : const Color(0xFFD97706)) : const Color(0xFFCBD5E1)),
                                ),
                                child: Row(mainAxisSize: MainAxisSize.min, children: [
                                  if (isWarning && sel) const Icon(Icons.warning_amber_rounded, size: 14, color: Colors.white),
                                  if (isWarning && sel) const SizedBox(width: 4),
                                  Text(cond, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: sel ? Colors.white : const Color(0xFF334155))),
                                ]),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // ── TECH seksyon ──
                if (config.hasTechSpecs) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(children: [
                          Icon(Icons.devices_other_rounded, size: 16, color: Color(0xFF0F172A)),
                          SizedBox(width: 6),
                          Text('Karakteristik Teknoloji', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                        ]),
                        const SizedBox(height: 10),
                        Row(children: [
                          Expanded(
                            child: TextField(
                              controller: ramController,
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                labelText: 'RAM (egz: 4GB, 8GB...)',
                                labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                                filled: true, fillColor: Colors.white,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: storageController,
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                labelText: 'Estokaj (egz: 128GB, 256GB...)',
                                labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                                filled: true, fillColor: Colors.white,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                              ),
                            ),
                          ),
                        ]),
                        const SizedBox(height: 10),
                        TextField(
                          controller: warrantyController,
                          style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                          decoration: InputDecoration(
                            labelText: 'Garanti (egz: 3 mwa, 1 an...)',
                            labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                            filled: true, fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Kondisyon aparèy la:',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: ['Nouvo (Tou nèf)', 'Dezyèm men (Bon eta)', 'Rekondisyone'].map((cond) {
                            final isSel = selectedCondition == cond;
                            return ChoiceChip(
                              label: Text(cond, style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal, color: isSel ? Colors.white : const Color(0xFF334155))),
                              selected: isSel,
                              selectedColor: config.theme.primary,
                              backgroundColor: Colors.white,
                              onSelected: (val) {
                                setModalState(() {
                                  selectedCondition = val ? cond : null;
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // ── GENERIC (non-special types) — keep old options UI ──
                if (!config.hasDosageField && !config.hasVariantMatrix && !config.hasPortions && !config.hasUnitField && !config.hasTechSpecs) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.tune, size: 16, color: MerchantConstants.brandOrange),
                          const SizedBox(width: 6),
                          const Text(
                            'Varyasyon & Ekstra (Opsyonèl)',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                          ),
                          const Spacer(),
                          Text(
                            '${selectedOptions.length + selectedExtras.length} chwazi',
                            style: const TextStyle(fontSize: 11, color: MerchantConstants.brandOrange, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // 1. Chwa / Akonpayman
                      const Text(
                        'Chwa / Akonpayman (kliyan chwazi gratis):',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: (config.type == 'PHARMACY'
                                ? ['Siwo', 'Konprime', 'Kapsil', 'Solib']
                                : (config.type == 'CONSTRUCTION'
                                    ? ['Livrezon Chantye', 'Rekiperasyon sou Plas', 'Estanda']
                                    : ['Diri Kole ak Pwa', 'Diri Blan & Sòs', 'Bannann Peze', 'Fritay Melanje', 'Pikliz Separe', 'San Pikliz']))
                            .map((opt) {
                          final isSel = selectedOptions.contains(opt);
                          return FilterChip(
                            label: Text(opt, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : const Color(0xFF334155))),
                            selected: isSel,
                            selectedColor: MerchantConstants.brandOrange,
                            backgroundColor: Colors.white,
                            side: BorderSide(color: isSel ? MerchantConstants.brandOrange : const Color(0xFFCBD5E1)),
                            showCheckmark: false,
                            onSelected: (val) {
                              setModalState(() {
                                if (val) {
                                  selectedOptions.add(opt);
                                } else {
                                  selectedOptions.remove(opt);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 10),

                      // 2. Ekstra & Sipleman
                      const Text(
                        'Ekstra & Sipleman (ak pri anplis):',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: (config.type == 'PHARMACY'
                                ? ['Livrezon Ijan (+100G)', 'Pake Pansman (+150G)', 'Dlo Distile (+75G)']
                                : (config.type == 'CONSTRUCTION'
                                    ? ['Dechaje Kamyon (+500G)', 'Sache Pwoteksyon (+100G)']
                                    : ['Ekstra Sòs (+50G)', 'Ekstra Zaboka (+150G)', 'Ekstra Fwomaj (+100G)', 'Bwason Anplis (+75G)', 'Ekstra Pikliz (+50G)']))
                            .map((ext) {
                          final isSel = selectedExtras.contains(ext);
                          return FilterChip(
                            label: Text(ext, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w600)),
                            selected: isSel,
                            selectedColor: const Color(0xFFEA580C),
                            backgroundColor: Colors.white,
                            side: BorderSide(color: isSel ? const Color(0xFFEA580C) : const Color(0xFFCBD5E1)),
                            showCheckmark: false,
                            onSelected: (val) {
                              setModalState(() {
                                if (val) {
                                  selectedExtras.add(ext);
                                } else {
                                  selectedExtras.remove(ext);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 10),

                      // 3. Ajoute opsyon koutim
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: customOptionController,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
                              decoration: const InputDecoration(
                                hintText: 'Tape yon lòt opsyon (egz: Piman Dous, Sòs Mayo...)',
                                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                isDense: true,
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFFCBD5E1))),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              final text = customOptionController.text.trim();
                              if (text.isNotEmpty) {
                                setModalState(() {
                                  selectedOptions.add(text);
                                  customOptionController.clear();
                                });
                              }
                            },
                            child: const Text('+ Ajoute', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                ], // end if generic

                // Tan preparasyon
                Text(config.prepTimeLabel, style: const TextStyle(color: Color(0xFF334155), fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [10, 15, 20, 30, 45].map((mins) {
                    final isSel = selectedPrepMinutes == mins;
                    return GestureDetector(
                      onTap: () => setModalState(() => selectedPrepMinutes = mins),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSel ? MerchantConstants.brandOrange : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSel ? MerchantConstants.brandOrange : const Color(0xFFCBD5E1)),
                        ),
                        child: Text(
                          '$mins min',
                          style: TextStyle(
                            color: isSel ? Colors.white : const Color(0xFF334155),
                            fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 22),

                // Bouton ajoute
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: MerchantConstants.brandOrange,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 1,
                    ),
                    onPressed: () async {
                      final name = nameController.text.trim();
                      final price = double.tryParse(priceController.text.trim());
                      final imgUrl = imageUrlController.text.trim();

                      if (name.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Tanpri antre non ${config.itemLabel.toLowerCase()} a'), backgroundColor: Colors.redAccent),
                        );
                        return;
                      }
                      if (price == null || price <= 0) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Tanpri antre yon pri valab'), backgroundColor: Colors.redAccent),
                        );
                        return;
                      }

                      String fullDesc = descController.text.trim();
                      if (unitController.text.trim().isNotEmpty) {
                        fullDesc = '[Inite: ${unitController.text.trim()}] $fullDesc';
                      }
                      if (requiresPrescription) {
                        fullDesc = '⚠️ Preskripsyon Medikal Obligatwa. $fullDesc';
                      }
                      if (selectedOptions.isNotEmpty) {
                        fullDesc = fullDesc.isNotEmpty ? '$fullDesc • [Opsyon: ${selectedOptions.join(", ")}]' : '[Opsyon: ${selectedOptions.join(", ")}]';
                      }
                      if (selectedExtras.isNotEmpty) {
                        fullDesc = fullDesc.isNotEmpty ? '$fullDesc • [Ekstra: ${selectedExtras.join(", ")}]' : '[Ekstra: ${selectedExtras.join(", ")}]';
                      }

                      // Build ProductMeta for structured serialization
                      List<ProductVariant> variants = [];
                      if (config.hasVariantMatrix && selectedSizes.isNotEmpty && selectedColors.isNotEmpty) {
                        for (final size in selectedSizes) {
                          for (final color in selectedColors) {
                            final key = '$size|$color';
                            final stockText = variantStockControllers[key]?.text.trim() ?? '';
                            final stock = int.tryParse(stockText) ?? 0;
                            variants.add(ProductVariant(size: size, color: color, stock: stock));
                          }
                        }
                      }

                      final hasDynamicData = requiresPrescription ||
                          brandController.text.trim().isNotEmpty ||
                          dosageController.text.trim().isNotEmpty ||
                          expiryController.text.trim().isNotEmpty ||
                          selectedUnit != null ||
                          dimensionsController.text.trim().isNotEmpty ||
                          selectedTransportCondition != null ||
                          selectedSizes.isNotEmpty ||
                          selectedColors.isNotEmpty ||
                          variants.isNotEmpty ||
                          selectedPortions.isNotEmpty ||
                          selectedAccompaniments.isNotEmpty ||
                          ramController.text.trim().isNotEmpty ||
                          storageController.text.trim().isNotEmpty ||
                          warrantyController.text.trim().isNotEmpty ||
                          selectedCondition != null;

                      if (hasDynamicData) {
                        final meta = ProductMeta(
                          type: config.type,
                          brand: brandController.text.trim().isNotEmpty ? brandController.text.trim() : null,
                          model: warrantyController.text.trim().isNotEmpty && config.hasVariantMatrix ? warrantyController.text.trim() : null,
                          sizes: selectedSizes.toList(),
                          colors: selectedColors.toList(),
                          variants: variants,
                          unit: selectedUnit ?? (unitController.text.trim().isNotEmpty ? unitController.text.trim() : null),
                          dosage: dosageController.text.trim().isNotEmpty ? dosageController.text.trim() : null,
                          expiryDate: expiryController.text.trim().isNotEmpty ? expiryController.text.trim() : null,
                          requiresPrescription: requiresPrescription,
                          dimensions: dimensionsController.text.trim().isNotEmpty ? dimensionsController.text.trim() : null,
                          transportCondition: selectedTransportCondition,
                          condition: selectedCondition,
                          usageInstructions: usageController.text.trim().isNotEmpty ? usageController.text.trim() : null,
                          portions: selectedPortions.toList(),
                          accompaniments: selectedAccompaniments.toList(),
                          extras: selectedExtras.toList(),
                          ram: ramController.text.trim().isNotEmpty ? ramController.text.trim() : null,
                          storage: storageController.text.trim().isNotEmpty ? storageController.text.trim() : null,
                          warranty: config.hasTechSpecs && warrantyController.text.trim().isNotEmpty ? warrantyController.text.trim() : null,
                        );
                        fullDesc = ProductMeta.serialize(meta, plainDesc: descController.text.trim());
                      }

                      final messenger = ScaffoldMessenger.of(context);
                      Navigator.pop(ctx);

                      final ok = await ref.read(merchantProductsProvider.notifier).addProduct(
                        name: name,
                        categoryId: selectedCatId,
                        price: price,
                        description: fullDesc.isNotEmpty ? fullDesc : null,
                        imageUrl: imgUrl.isNotEmpty ? imgUrl : null,
                        prepTimeMinutes: selectedPrepMinutes,
                      );

                      if (mounted) {
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                              ok ? '${config.itemLabel} "$name" ajoute avèk siksè !' : 'Erè pandan kreyasyon an',
                            ),
                            backgroundColor: ok ? Colors.green : Colors.redAccent,
                          ),
                        );
                      }
                    },
                    child: Text(
                      'AJOUTE ${config.itemLabel.toUpperCase()} AN',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  ),
);
}

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(merchantProfileProvider);
    final config = BusinessTypeConfig.fromType(profile?.type);

    final products = ref.watch(merchantProductsProvider);
    final categoriesAsync = ref.watch(merchantCategoriesProvider);
    final rawCategories = categoriesAsync.value ?? [];

    // Deduplike kategori pa non pou retire nenpòt doublon
    final uniqueCategoriesMap = <String, MerchantCategory>{};
    for (final cat in rawCategories) {
      final key = cat.name.trim().toLowerCase();
      if (!uniqueCategoriesMap.containsKey(key)) {
        uniqueCategoriesMap[key] = cat;
      }
    }
    final categories = uniqueCategoriesMap.values.toList();

    // Filtraj pwodwi pa kategori ak pa rechèch
    final filteredProducts = products.where((p) {
      if (_selectedCategoryId != null && _selectedCategoryId!.isNotEmpty) {
        if (p.categoryId != _selectedCategoryId && p.category != _selectedCategoryId) return false;
      }
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchName = p.name.toLowerCase().contains(query);
        final matchCategory = p.category.toLowerCase().contains(query);
        final matchDesc = (p.description ?? '').toLowerCase().contains(query);
        if (!matchName && !matchCategory && !matchDesc) return false;
      }
      return true;
    }).toList();

    final totalCount = products.length;
    final availableCount = products.where((p) => p.isAvailable).length;
    final outOfStockCount = totalCount - availableCount;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: widget.showAppBar
          ? AppBar(
              title: Row(
                children: [
                  Text(config.icon, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 8),
                  Text(config.catalogTitle, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A), fontSize: 18)),
                ],
              ),
              backgroundColor: Colors.white,
              elevation: 0,
              surfaceTintColor: Colors.transparent,
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(1),
                child: Container(color: const Color(0xFFE2E8F0), height: 1),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh, color: Color(0xFF0F172A)),
                  tooltip: 'Rafrechi',
                  onPressed: () async {
                    await ref.read(merchantProductsProvider.notifier).refreshProducts();
                    ref.invalidate(merchantCategoriesProvider);
                  },
                ),
              ],
            )
          : null,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: config.theme.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(config.addItemLabel, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: () => _showAddProductDialog(context, categories, config),
      ),
      body: RefreshIndicator(
        color: config.theme.primary,
        onRefresh: () async {
          await ref.read(merchantProductsProvider.notifier).refreshProducts();
          ref.invalidate(merchantCategoriesProvider);
        },
        child: Column(
          children: [
            // Kontè Estatistik rapid — Nwa sou Blan
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: Colors.white,
              child: Row(
                children: [
                  _buildStatBadge('Total ${config.itemLabel}', '$totalCount', const Color(0xFF0F172A)),
                  const SizedBox(width: 8),
                  _buildStatBadge('Disponib', '$availableCount', MerchantConstants.successGreen),
                  const SizedBox(width: 8),
                  _buildStatBadge('Fin fèt / Pa la', '$outOfStockCount', Colors.redAccent),
                ],
              ),
            ),

            // Ba Rechèch
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.w500),
                decoration: InputDecoration(
                  hintText: 'Chèche nan ${config.catalogTitle.toLowerCase()}...',
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 20),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Color(0xFF64748B), size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: config.theme.primary, width: 1.5),
                  ),
                ),
                onChanged: (val) => setState(() => _searchQuery = val.trim()),
              ),
            ),

            // Pil Kategori
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildCategoryPill(
                    id: null,
                    label: 'Tout (${products.length})',
                    isSelected: _selectedCategoryId == null,
                    activeColor: config.theme.primary,
                  ),
                  if (categories.isNotEmpty)
                    ...categories.map((cat) {
                      final count = products.where((p) => p.categoryId == cat.id).length;
                      return _buildCategoryPill(
                        id: cat.id,
                        label: '${cat.name} ($count)',
                        isSelected: _selectedCategoryId == cat.id,
                        activeColor: config.theme.primary,
                      );
                    })
                  else
                    ...config.defaultCategories.map((cName) {
                      return _buildCategoryPill(
                        id: cName,
                        label: cName,
                        isSelected: _selectedCategoryId == cName,
                        activeColor: config.theme.primary,
                      );
                    }),
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: ActionChip(
                      backgroundColor: Colors.white,
                      side: BorderSide(color: config.theme.primary, width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      avatar: Icon(Icons.add, size: 16, color: config.theme.primary),
                      label: Text(
                        'Kategori',
                        style: TextStyle(color: config.theme.primary, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      onPressed: () => _showCreateCategoryDialog(context, config),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Lis Pwodwi yo
            Expanded(
              child: filteredProducts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(config.icon, style: const TextStyle(fontSize: 54)),
                          const SizedBox(height: 12),
                          Text(
                            _searchQuery.isNotEmpty
                                ? 'Pa gen okenn ${config.itemLabel.toLowerCase()} ki matche ak "$_searchQuery"'
                                : 'Pa gen okenn ${config.itemLabel.toLowerCase()} nan kategori sa a',
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: MerchantConstants.brandOrange,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            icon: const Icon(Icons.add, color: Colors.white, size: 18),
                            label: Text(config.addItemLabel, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            onPressed: () => _showAddProductDialog(context, categories, config),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 80),
                      itemCount: filteredProducts.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final product = filteredProducts[index];
                        return _buildProductCard(context, product, config);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBadge(String title, String count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.18), width: 1),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              count,
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: color),
            ),
            const SizedBox(width: 5),
            Flexible(
              child: Text(
                title,
                style: TextStyle(color: color.withValues(alpha: 0.9), fontSize: 11, fontWeight: FontWeight.w700),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryPill({
    required String? id,
    required String label,
    required bool isSelected,
    Color activeColor = MerchantConstants.brandOrange,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _selectedCategoryId = id),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? activeColor : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? activeColor : const Color(0xFFCBD5E1),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : const Color(0xFF334155),
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  String _getItemEmoji(String name, String category, BusinessTypeConfig config) {
    final lower = ('$name $category').toLowerCase();

    if (config.type == 'PHARMACY') {
      if (lower.contains('siwo') || lower.contains('likid')) return '🧴';
      if (lower.contains('vitamin') || lower.contains('c') || lower.contains('zinc')) return '🍊';
      if (lower.contains('bebe') || lower.contains('kouch')) return '👶';
      if (lower.contains('panseman') || lower.contains('bando') || lower.contains('koton')) return '🩹';
      if (lower.contains('tous') || lower.contains('grip')) return '🫁';
      return '💊';
    }

    if (config.type == 'CONSTRUCTION') {
      if (lower.contains('siman') || lower.contains('blok') || lower.contains('sab')) return '🧱';
      if (lower.contains('fe') || lower.contains('asye') || lower.contains('metal')) return '⛓️';
      if (lower.contains('penti') || lower.contains('verni') || lower.contains('roulo')) return '🎨';
      if (lower.contains('tiyo') || lower.contains('plonbri') || lower.contains('tiyo')) return '🚰';
      if (lower.contains('kab') || lower.contains('fil') || lower.contains('priz')) return '⚡';
      if (lower.contains('zouti') || lower.contains('mato') || lower.contains('vis')) return '🔨';
      return '🧱';
    }

    if (config.type == 'SUPERMARKET' || config.type == 'GROCERY') {
      if (lower.contains('diri') || lower.contains('pwa') || lower.contains('mayi')) return '🍚';
      if (lower.contains('lwil') || lower.contains('bè')) return '🛢️';
      if (lower.contains('savon') || lower.contains('klòks') || lower.contains('netwayaj')) return '🧴';
      if (lower.contains('vyann') || lower.contains('pwason')) return '🥩';
      return '🛒';
    }

    if (config.type == 'BAKERY') {
      if (lower.contains('gato') || lower.contains('cake')) return '🎂';
      if (lower.contains('sandwich')) return '🥪';
      if (lower.contains('kafe') || lower.contains('te')) return '☕';
      return '🥖';
    }

    // Default Restaurant
    if (lower.contains('bwason') || lower.contains('jus') || lower.contains('ji') || lower.contains('dlo')) return '🍹';
    if (lower.contains('griot') || lower.contains('griyo') || lower.contains('kochon')) return '🥩';
    if (lower.contains('poul') || lower.contains('kabrit') || lower.contains('vyann')) return '🍗';
    if (lower.contains('diri') || lower.contains('pwa')) return '🍚';
    if (lower.contains('bannann') || lower.contains('fritay') || lower.contains('akra') || lower.contains('marinad')) return '🍌';
    if (lower.contains('soup') || lower.contains('bouyon')) return '🥣';
    if (lower.contains('pwason') || lower.contains('lanbi') || lower.contains('krab')) return '🐟';
    return '🍲';
  }

  List<Map<String, String>> _getPresetImages(String? businessType) {
    if (businessType == 'PHARMACY') {
      return [
        {
          'label': 'Grenn & Kapsil',
          'emoji': '💊',
          'url': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Siwo & Likid',
          'emoji': '🧴',
          'url': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Swen & Ijyèn',
          'emoji': '🩹',
          'url': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop',
        },
      ];
    }
    if (businessType == 'CONSTRUCTION') {
      return [
        {
          'label': 'Siman & Sab',
          'emoji': '🧱',
          'url': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Zouti & Materyo',
          'emoji': '🔨',
          'url': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Penti & Bwòs',
          'emoji': '🎨',
          'url': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop',
        },
      ];
    }
    if (businessType == 'SUPERMARKET' || businessType == 'GROCERY') {
      return [
        {
          'label': 'Pwodwi Alimantè',
          'emoji': '🍚',
          'url': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Bwason & Ji',
          'emoji': '🧃',
          'url': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Netwayaj & Kay',
          'emoji': '🧴',
          'url': 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=600&auto=format&fit=crop',
        },
      ];
    }
    if (businessType == 'BAKERY') {
      return [
        {
          'label': 'Gato & Pâtisserie',
          'emoji': '🎂',
          'url': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Pen & Krwasan',
          'emoji': '🥐',
          'url': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop',
        },
        {
          'label': 'Kafe & Te',
          'emoji': '☕',
          'url': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop',
        },
      ];
    }
    // Default Restaurant
    return [
      {
        'label': 'Griot & Bannann',
        'emoji': '🥩',
        'url': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
      },
      {
        'label': 'Diri Djon Djon & Poul',
        'emoji': '🍚',
        'url': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop',
      },
      {
        'label': 'Fritay & Tassot',
        'emoji': '🍌',
        'url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop',
      },
      {
        'label': 'Pwason Boukannen',
        'emoji': '🐟',
        'url': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop',
      },
      {
        'label': 'Burger & Frit',
        'emoji': '🍔',
        'url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
      },
      {
        'label': 'Pizza Kreyòl',
        'emoji': '🍕',
        'url': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop',
      },
      {
        'label': 'Ji Fre & Bwason',
        'emoji': '🍹',
        'url': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop',
      },
    ];
  }

  Widget _buildProductPhotoWidget(String? imageUrl, {double? width, double? height, BoxFit fit = BoxFit.cover, Widget? fallback}) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return fallback ?? const SizedBox.shrink();
    }
    final trimmed = imageUrl.trim();
    if (trimmed.startsWith('data:image')) {
      try {
        final base64String = trimmed.split(',').last;
        final bytes = base64Decode(base64String);
        return Image.memory(bytes, width: width, height: height, fit: fit);
      } catch (_) {
        return fallback ?? const SizedBox.shrink();
      }
    }
    return Image.network(
      trimmed,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => fallback ?? const SizedBox.shrink(),
    );
  }

  Widget _buildMetaBadge(String text, Color bg, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: textColor.withValues(alpha: 0.25), width: 0.8),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10, color: textColor, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, MerchantProduct product, BusinessTypeConfig config) {
    final emoji = _getItemEmoji(product.name, product.category, config);
    final hasValidImage = product.imageUrl != null && product.imageUrl!.trim().isNotEmpty;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: product.isAvailable ? const Color(0xFFE2E8F0) : Colors.redAccent.withValues(alpha: 0.3),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar Ikon oswa Vre Foto Plat la
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: product.isAvailable
                        ? config.theme.primary.withValues(alpha: 0.1)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: product.isAvailable
                          ? config.theme.primary.withValues(alpha: 0.25)
                          : const Color(0xFFCBD5E1),
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(13),
                    child: hasValidImage
                        ? _buildProductPhotoWidget(
                            product.imageUrl!.trim(),
                            width: 56,
                            height: 56,
                            fit: BoxFit.cover,
                            fallback: Center(
                              child: Text(emoji, style: const TextStyle(fontSize: 26)),
                            ),
                          )
                        : Center(
                            child: Text(emoji, style: const TextStyle(fontSize: 26)),
                          ),
                  ),
                ),
                const SizedBox(width: 12),

                // Non & Deskripsyon
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              product.name,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: product.isAvailable ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                decoration: product.isAvailable ? null : TextDecoration.lineThrough,
                              ),
                            ),
                          ),
                          Switch(
                            value: product.isAvailable,
                            activeThumbColor: MerchantConstants.successGreen,
                            inactiveTrackColor: Colors.red.withValues(alpha: 0.3),
                            onChanged: (val) {
                              ref.read(merchantProductsProvider.notifier).toggleAvailability(product.id);
                            },
                          ),
                        ],
                      ),
                      if (product.description != null && product.description!.trim().isNotEmpty) ...[
                        const SizedBox(height: 5),
                        Builder(
                          builder: (context) {
                            final raw = product.description!.trim();
                            final meta = ProductMeta.parse(raw);
                            final cleanText = ProductMeta.plainDescription(raw)
                                .replaceAll(RegExp(r'\[(Opsyon|Ekstra|Inite):[^\]]+\]'), '')
                                .replaceAll('•', '')
                                .trim();

                            final optMatch = RegExp(r'\[Opsyon:([^\]]+)\]').firstMatch(raw);
                            final extMatch = RegExp(r'\[Ekstra:([^\]]+)\]').firstMatch(raw);

                            final options = optMatch != null
                                ? optMatch.group(1)!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList()
                                : <String>[];
                            final extras = extMatch != null
                                ? extMatch.group(1)!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList()
                                : <String>[];

                            final badges = <Widget>[];

                            if (meta.brand != null && meta.brand!.isNotEmpty) {
                              badges.add(_buildMetaBadge('🏷️ ${meta.brand}', const Color(0xFFEFF6FF), const Color(0xFF1D4ED8)));
                            }
                            if (meta.ram != null && meta.ram!.isNotEmpty) {
                              badges.add(_buildMetaBadge('⚡ RAM: ${meta.ram}', const Color(0xFFF0FDF4), const Color(0xFF15803D)));
                            }
                            if (meta.storage != null && meta.storage!.isNotEmpty) {
                              badges.add(_buildMetaBadge('💾 ${meta.storage}', const Color(0xFFF0FDF4), const Color(0xFF15803D)));
                            }
                            if (meta.warranty != null && meta.warranty!.isNotEmpty) {
                              badges.add(_buildMetaBadge('🛡️ ${meta.warranty}', const Color(0xFFFEF3C7), const Color(0xFFB45309)));
                            }
                            if (meta.condition != null && meta.condition!.isNotEmpty) {
                              badges.add(_buildMetaBadge('✨ ${meta.condition}', const Color(0xFFF1F5F9), const Color(0xFF334155)));
                            }
                            if (meta.dosage != null && meta.dosage!.isNotEmpty) {
                              badges.add(_buildMetaBadge('💊 Dòz: ${meta.dosage}', const Color(0xFFEFF6FF), const Color(0xFF0284C7)));
                            }
                            if (meta.unit != null && meta.unit!.isNotEmpty) {
                              badges.add(_buildMetaBadge('📦 / ${meta.unit}', const Color(0xFFF8FAFC), const Color(0xFF475569)));
                            }
                            if (meta.sizes.isNotEmpty) {
                              badges.add(_buildMetaBadge('📏 ${meta.sizes.join(", ")}', const Color(0xFFFDF2F8), const Color(0xFFBE185D)));
                            }
                            if (meta.colors.isNotEmpty) {
                              badges.add(_buildMetaBadge('🎨 ${meta.colors.join(", ")}', const Color(0xFFFDF4FF), const Color(0xFF7E22CE)));
                            }

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (cleanText.isNotEmpty)
                                  Text(
                                    cleanText,
                                    style: const TextStyle(color: Color(0xFF475569), fontSize: 12.5, height: 1.3),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                if (badges.isNotEmpty) ...[
                                  const SizedBox(height: 5),
                                  Wrap(
                                    spacing: 4,
                                    runSpacing: 4,
                                    children: badges,
                                  ),
                                ],
                                if (options.isNotEmpty || extras.isNotEmpty) ...[
                                  const SizedBox(height: 5),
                                  Wrap(
                                    spacing: 4,
                                    runSpacing: 4,
                                    children: [
                                      ...options.map((opt) => Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF1F5F9),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFCBD5E1), width: 0.8),
                                            ),
                                            child: Text('✨ $opt', style: const TextStyle(fontSize: 10, color: Color(0xFF334155), fontWeight: FontWeight.w600)),
                                          )),
                                      ...extras.map((ext) => Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFF7ED),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFFDBA74), width: 0.8),
                                            ),
                                            child: Text('+ $ext', style: const TextStyle(fontSize: 10, color: Color(0xFFC2410C), fontWeight: FontWeight.bold)),
                                          )),
                                    ],
                                  ),
                                ],
                              ],
                            );
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            const Divider(height: 16, color: Color(0xFFE2E8F0)),

            // Footer: Badges & Pri (Responsive Layout pou anpeche debòdman)
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            product.category,
                            style: const TextStyle(color: Color(0xFF475569), fontSize: 11, fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.schedule, size: 12, color: Color(0xFFEA580C)),
                            const SizedBox(width: 3),
                            Text(
                              '${product.prepTimeMinutes}m',
                              style: const TextStyle(color: Color(0xFFEA580C), fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Pri & Bouton Modifye (Klike dirèkteman pou chanje pri a)
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _showEditPriceModal(context, product, config),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFFDBB5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${product.price.toInt()} HTG',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFFF6600),
                            ),
                          ),
                          const SizedBox(width: 5),
                          const Icon(Icons.edit_outlined, size: 14, color: Color(0xFFFF6600)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
