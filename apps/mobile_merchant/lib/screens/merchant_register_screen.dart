import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/business_type_config.dart';
import '../providers/merchant_providers.dart';

const Color _kPrimary = Color(0xFFFF5000);
const Color _kDark = Color(0xFF0F172A);
const Color _kMuted = Color(0xFF475569);
const Color _kLightMuted = Color(0xFF64748B);
const Color _kBorder = Color(0xFFCBD5E1);
const Color _kSurface = Color(0xFFF8FAFC);

class MerchantRegisterScreen extends ConsumerStatefulWidget {
  const MerchantRegisterScreen({super.key});

  @override
  ConsumerState<MerchantRegisterScreen> createState() => _MerchantRegisterScreenState();
}

class _MerchantRegisterScreenState extends ConsumerState<MerchantRegisterScreen> {
  final _step1FormKey = GlobalKey<FormState>();
  final _step2FormKey = GlobalKey<FormState>();

  int _currentStep = 0; // 0 = Biznis, 1 = Responsab & Sekirite

  // Kontwolè Chan yo
  final _businessNameController = TextEditingController();
  final _addressController = TextEditingController();

  final _ownerFirstNameController = TextEditingController();
  final _ownerLastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _selectedType = 'RESTAURANT';
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  final List<Map<String, String>> _merchantTypes = BusinessTypeConfig.allTypes;

  @override
  void dispose() {
    _businessNameController.dispose();
    _addressController.dispose();
    _ownerFirstNameController.dispose();
    _ownerLastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _proceedToStep2() {
    HapticFeedback.lightImpact();
    if (!_step1FormKey.currentState!.validate()) return;
    setState(() => _currentStep = 1);
  }

  void _backToStep1() {
    HapticFeedback.lightImpact();
    setState(() => _currentStep = 0);
  }

  Future<void> _handleRegister() async {
    HapticFeedback.mediumImpact();
    if (!_step2FormKey.currentState!.validate()) return;

    if (_passwordController.text.trim() != _confirmPasswordController.text.trim()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Modpas yo pa idantik. Tanpri verifye yo kòrèkteman.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    // Prepare clean phone
    String rawPhone = _phoneController.text.trim();
    if (!rawPhone.startsWith('+509')) {
      rawPhone = '+509$rawPhone';
    }

    setState(() => _isLoading = true);

    final api = ref.read(merchantApiProvider);
    final result = await api.registerMerchant(
      businessName: _businessNameController.text.trim(),
      businessType: _selectedType,
      ownerFirstName: _ownerFirstNameController.text.trim(),
      ownerLastName: _ownerLastNameController.text.trim(),
      phoneNumber: rawPhone,
      password: _passwordController.text.trim(),
      email: _emailController.text.trim(),
      address: _addressController.text.trim(),
    );

    if (mounted) {
      setState(() => _isLoading = false);

      if (result.success) {
        _showSuccessDialog();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.errorMessage ?? 'Erè pandan enskripsyon an. Tanpri eseye ankò.'),
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF16A34A), width: 2),
              ),
              child: const Center(
                child: Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 40),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Demann Soumèt avèk Siksè!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: _kDark,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.hourglass_top_rounded, color: Color(0xFFD97706), size: 18),
                      const SizedBox(width: 6),
                      Text(
                        'Statut: Nan Atant Validasyon',
                        style: TextStyle(
                          color: Colors.amber.shade900,
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Kont machann ou an anrejistre kòrèkteman.\n\nEkip administratè Delivery Haïti a ap valide etablisman w lan rapidman pou w ka konekte epi kòmanse resevwa kòmand nan Cap-Haïtien.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF78350F),
                      height: 1.45,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _kPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                child: const Text(
                  'TOUNEN NAN KONEKSYON',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kSurface,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: _kDark, size: 20),
          onPressed: () {
            if (_currentStep == 1) {
              _backToStep1();
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text(
          'Kreyasyon Kont Machann',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: _kDark,
            letterSpacing: 0.2,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE2E8F0), height: 1),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Step Indicator Progress Header ─────────────────────
              _buildStepIndicator(),

              const SizedBox(height: 20),

              // ── Step Content ───────────────────────────────────────
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _currentStep == 0 ? _buildStep1() : _buildStep2(),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROGRESS STEPPER BAR
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Step 1
          Expanded(
            child: GestureDetector(
              onTap: () {
                if (_currentStep == 1) _backToStep1();
              },
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _currentStep == 0 ? _kPrimary : const Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: _currentStep == 1
                          ? const Icon(Icons.check_rounded, color: Colors.white, size: 16)
                          : const Text(
                              '1',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ETAP 1',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: _currentStep == 0 ? _kPrimary : const Color(0xFF10B981),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const Text(
                          'Biznis Ou',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: _kDark,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Divider arrow
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 22),
          ),

          // Step 2
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: _currentStep == 1 ? _kPrimary : const Color(0xFFE2E8F0),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '2',
                      style: TextStyle(
                        color: _currentStep == 1 ? Colors.white : const Color(0xFF64748B),
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ETAP 2',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: _currentStep == 1 ? _kPrimary : const Color(0xFF94A3B8),
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        'Responsab & Sekirite',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: _currentStep == 1 ? _kDark : const Color(0xFF94A3B8),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAP 1: BIZNIS OU
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep1() {
    return Form(
      key: _step1FormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner Enfòmasyon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3EB),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.storefront_rounded, color: _kPrimary, size: 28),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Enfòmasyon sou Etablisman an',
                        style: TextStyle(
                          color: _kDark,
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Antre non biznis la ak adrès li nan Cap-Haïtien pou livrè yo ka jwenn li fasil.',
                        style: TextStyle(color: _kMuted, fontSize: 13, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Chan: Non Biznis
          _buildFieldLabel('Non Etablisman oswa Restoran an *'),
          const SizedBox(height: 6),
          _buildTextFormField(
            controller: _businessNameController,
            hint: 'Ex: Kay Fritay Lakay, Grillades Okap, Pharmacie du Cap...',
            icon: Icons.business_rounded,
            validator: (val) {
              if (val == null || val.trim().isEmpty) {
                return 'Tanpri antre non biznis la.';
              }
              if (val.trim().length < 3) {
                return 'Non biznis la dwe gen omwen 3 lèt.';
              }
              return null;
            },
          ),

          const SizedBox(height: 18),

          // Chan: Kategori Biznis (2-Column Large Touch Cards)
          _buildFieldLabel('Kategori Aktivite Etablisman an *'),
          const SizedBox(height: 3),
          const Text(
            'Chwazi tip biznis ou a — koòdone a ak meni an ap adapte otomatikman.',
            style: TextStyle(color: _kLightMuted, fontSize: 13, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 10),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _merchantTypes.length,
            itemBuilder: (ctx, i) {
              final item = _merchantTypes[i];
              final isSelected = _selectedType == item['type'];
              final cfg = BusinessTypeConfig.fromType(item['type']);
              final Color activeColor = cfg.theme.primary;

              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedType = item['type']!);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? activeColor.withValues(alpha: 0.1) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? activeColor : const Color(0xFFCBD5E1),
                      width: isSelected ? 2.0 : 1.0,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: activeColor.withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : const [
                            BoxShadow(
                              color: Color(0x04000000),
                              blurRadius: 4,
                              offset: Offset(0, 1),
                            ),
                          ],
                  ),
                  child: Row(
                    children: [
                      Text(item['emoji']!, style: const TextStyle(fontSize: 22)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item['label']!,
                          style: TextStyle(
                            color: isSelected ? activeColor : _kDark,
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isSelected)
                        Icon(Icons.check_circle_rounded, color: activeColor, size: 16),
                    ],
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 18),

          // Chan: Adrès
          _buildFieldLabel('Adrès Fizik nan Cap-Haïtien *'),
          const SizedBox(height: 6),
          _buildTextFormField(
            controller: _addressController,
            hint: 'Ex: Ri 18 A, Vaudreuil, Carrefour La Mort...',
            icon: Icons.location_on_rounded,
            validator: (val) {
              if (val == null || val.trim().isEmpty) {
                return 'Tanpri antre adrès fizik etablisman an.';
              }
              if (val.trim().length < 4) {
                return 'Adrès la dwe pi presi pou livrè yo ka jwenn li.';
              }
              return null;
            },
          ),
          const SizedBox(height: 4),
          const Text(
            'Livrè Delivery Haïti yo ap pase ranmase kòmand yo nan adrès sa a.',
            style: TextStyle(color: _kLightMuted, fontSize: 12),
          ),

          const SizedBox(height: 28),

          // Bouton Etap 1
          SizedBox(
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _kPrimary,
                foregroundColor: Colors.white,
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _proceedToStep2,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'KONTINYE NAN ETAP 2',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, size: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAP 2: RESPONSAB & SEKIRITE
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep2() {
    return Form(
      key: _step2FormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner Responsab
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.shield_outlined, color: Color(0xFF2563EB), size: 28),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Enfòmasyon Pwopriyetè & Modpas',
                        style: TextStyle(
                          color: _kDark,
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Mete non responsab la ak nimewo telefòn ki pral sèvi pou konekte sou kont lan.',
                        style: TextStyle(color: _kMuted, fontSize: 13, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Prenon & Non Fanmi
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldLabel('Prenon Responsab *'),
                    const SizedBox(height: 6),
                    _buildTextFormField(
                      controller: _ownerFirstNameController,
                      hint: 'Ex: Jean',
                      icon: Icons.person_rounded,
                      validator: (val) => val == null || val.trim().isEmpty ? 'Mete prenon.' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldLabel('Non Fanmi *'),
                    const SizedBox(height: 6),
                    _buildTextFormField(
                      controller: _ownerLastNameController,
                      hint: 'Ex: Baptiste',
                      icon: Icons.badge_rounded,
                      validator: (val) => val == null || val.trim().isEmpty ? 'Mete non.' : null,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Chan: Nimewo Telefòn (Ak Prefiks +509)
          _buildFieldLabel('Nimewo Telefòn Prensipal *'),
          const SizedBox(height: 6),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: _kDark, fontSize: 15, fontWeight: FontWeight.w700),
            validator: (val) {
              if (val == null || val.trim().isEmpty) {
                return 'Tanpri antre yon nimewo telefòn.';
              }
              final clean = val.replaceAll(RegExp(r'[^0-9]'), '');
              if (clean.length < 8) {
                return 'Nimewo telefòn lan dwe gen omwen 8 chif.';
              }
              return null;
            },
            decoration: InputDecoration(
              hintText: '3700 0000 oswa 4400 0000',
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
              prefixIcon: Container(
                margin: const EdgeInsets.only(right: 10),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: const BoxDecoration(
                  border: Border(right: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('🇭🇹', style: TextStyle(fontSize: 18)),
                    SizedBox(width: 6),
                    Text(
                      '+509',
                      style: TextStyle(
                        color: _kDark,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _kBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _kBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _kPrimary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Colors.redAccent),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Nimewo sa a ap sèvi pou konekte epi pou livreur yo ka kontakte w si gen bezwen.',
            style: TextStyle(color: _kLightMuted, fontSize: 12),
          ),

          const SizedBox(height: 18),

          // Chan: Imèl
          _buildFieldLabel('Adrès Imèl (Opsyonèl)'),
          const SizedBox(height: 6),
          _buildTextFormField(
            controller: _emailController,
            hint: 'restoran@gmail.com',
            icon: Icons.email_rounded,
            keyboardType: TextInputType.emailAddress,
          ),

          const SizedBox(height: 18),

          // Chan: Modpas
          _buildFieldLabel('Kreye yon Modpas Sekirize *'),
          const SizedBox(height: 6),
          _buildTextFormField(
            controller: _passwordController,
            hint: 'Omwen 6 karaktè',
            icon: Icons.lock_rounded,
            obscureText: _obscurePassword,
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                color: _kMuted,
                size: 20,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            validator: (val) {
              if (val == null || val.trim().length < 6) {
                return 'Modpas la dwe gen omwen 6 karaktè.';
              }
              return null;
            },
          ),

          const SizedBox(height: 18),

          // Chan: Konfimasyon Modpas
          _buildFieldLabel('Konfime Modpas la *'),
          const SizedBox(height: 6),
          _buildTextFormField(
            controller: _confirmPasswordController,
            hint: 'Repete menm modpas la',
            icon: Icons.lock_clock_rounded,
            obscureText: _obscureConfirm,
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                color: _kMuted,
                size: 20,
              ),
              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
            validator: (val) {
              if (val == null || val.trim().isEmpty) {
                return 'Tanpri konfime modpas la.';
              }
              return null;
            },
          ),

          const SizedBox(height: 24),

          // Sekirite Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.lock_outline_rounded, color: Color(0xFF10B981), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Done ou yo pwoteje avèk chifreman sekirize SSL 256-bit.',
                    style: TextStyle(color: _kMuted, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Bouton Soumèt
          SizedBox(
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _kPrimary,
                foregroundColor: Colors.white,
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _isLoading ? null : _handleRegister,
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.how_to_reg_rounded, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'SOUMÈT DEMANN ENSKRIPSYON AN',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
            ),
          ),

          const SizedBox(height: 12),

          // Bouton Retou nan Etap 1
          TextButton.icon(
            onPressed: _isLoading ? null : _backToStep1,
            icon: const Icon(Icons.arrow_back_rounded, size: 18, color: _kLightMuted),
            label: const Text(
              'Retounen nan Etap 1 (Modifye Enfòmasyon Biznis)',
              style: TextStyle(color: _kLightMuted, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS POU CHAN FÒMILÈ
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildFieldLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        color: _kDark,
        fontSize: 14,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.1,
      ),
    );
  }

  Widget _buildTextFormField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      style: const TextStyle(color: _kDark, fontSize: 15, fontWeight: FontWeight.w700),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5, fontWeight: FontWeight.w400),
        prefixIcon: Icon(icon, color: _kPrimary, size: 21),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _kBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _kBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _kPrimary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      ),
    );
  }
}
