import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/supabase_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  // Mode: true = Login, false = Register
  bool isLoginMode = true;

  // Controllers pou Login (pre-filled only in debug mode)
  final loginPhoneController = TextEditingController(
    text: kDebugMode ? '37000007' : '',
  );
  final loginPasswordController = TextEditingController(
    text: kDebugMode ? 'Password123!' : '',
  );

  // Controllers pou Register
  final regFirstNameController = TextEditingController();
  final regLastNameController = TextEditingController();
  final regPhoneController = TextEditingController();
  final regEmailController = TextEditingController();
  final regPasswordController = TextEditingController();
  final regConfirmPasswordController = TextEditingController();
  final regAddressController = TextEditingController();
  String selectedLanguage = 'ht';
  bool acceptTerms = true;

  bool isLoading = false;
  bool showPassword = false;
  String? errorMsg;
  String? successMsg;

  @override
  void dispose() {
    loginPhoneController.dispose();
    loginPasswordController.dispose();
    regFirstNameController.dispose();
    regLastNameController.dispose();
    regPhoneController.dispose();
    regEmailController.dispose();
    regPasswordController.dispose();
    regConfirmPasswordController.dispose();
    regAddressController.dispose();
    super.dispose();
  }

  // ─── LOGIN FUNCTION ─────────────────────────────────────────
  Future<void> _handleLogin() async {
    final phone = loginPhoneController.text.trim();
    final password = loginPasswordController.text.trim();

    final cleanDigits = phone.replaceAll(RegExp(r'\D'), '');
    if (cleanDigits.length < 8) {
      setState(() => errorMsg = 'Mete yon nimewo telefòn valab (omwen 8 chif)');
      return;
    }
    if (password.length < 6) {
      setState(() => errorMsg = 'Modpas la dwe gen omwen 6 karaktè');
      return;
    }

    setState(() {
      isLoading = true;
      errorMsg = null;
      successMsg = null;
    });

    final result = await SupabaseService().login(phone, password);

    setState(() => isLoading = false);

    if (!mounted) return;

    if (result != null) {
      final user = result['data']?['user'] ?? result['user'];
      final name = user != null ? '${user['firstName'] ?? 'Kliyan'}' : 'Kliyan';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Bonswa $name, koneksyon an reyisi.'),
          backgroundColor: const Color(0xFF10B981),
          duration: const Duration(seconds: 2),
        ),
      );
      context.go('/');
    } else {
      setState(() => errorMsg = 'Nimewo telefòn oswa modpas pa kòrèk. Eseye ankò.');
    }
  }

  // ─── REGISTER FUNCTION ──────────────────────────────────────
  Future<void> _handleRegister() async {
    final firstName = regFirstNameController.text.trim();
    final lastName = regLastNameController.text.trim();
    final phone = regPhoneController.text.trim();
    final email = regEmailController.text.trim();
    final password = regPasswordController.text.trim();
    final confirmPassword = regConfirmPasswordController.text.trim();
    final address = regAddressController.text.trim();

    if (firstName.isEmpty || lastName.isEmpty) {
      setState(() => errorMsg = 'Tanpri antre prenon ak non fanmi ou.');
      return;
    }
    if (phone.length < 8) {
      setState(() => errorMsg = 'Mete yon nimewo telefòn ayisyen valab (eg: 37123456).');
      return;
    }
    if (password.length < 6) {
      setState(() => errorMsg = 'Modpas la dwe gen omwen 6 karaktè.');
      return;
    }
    if (password != confirmPassword) {
      setState(() => errorMsg = 'Modpas yo pa idantik.');
      return;
    }
    if (!acceptTerms) {
      setState(() => errorMsg = 'Ou dwe aksepte kondisyon itilizasyon yo.');
      return;
    }

    setState(() {
      isLoading = true;
      errorMsg = null;
      successMsg = null;
    });

    final fullPhone = phone.startsWith('+509') ? phone : '+509$phone';

    final result = await SupabaseService().register(
      firstName: firstName,
      lastName: lastName,
      phoneNumber: fullPhone,
      password: password,
      email: email.isNotEmpty ? email : null,
      languagePreference: selectedLanguage,
      address: address.isNotEmpty ? address : null,
    );

    setState(() => isLoading = false);

    if (!mounted) return;

    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Byenvini $firstName! Kont ou kreye avèk siksè.'),
          backgroundColor: const Color(0xFF10B981),
          duration: const Duration(seconds: 3),
        ),
      );
      context.go('/');
    } else {
      setState(() {
        errorMsg = 'Nimewo telefòn sa a gen yon kont deja oswa gen yon erè rezo.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: Column(
        children: [
          // --- GRADIENT HERO HEADER (Alibaba style) ---
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFFF6600), Color(0xFFFF6600)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
            ),
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 32,
              bottom: 36,
              left: 24,
              right: 24,
            ),
            child: Column(
              children: [
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.6), width: 2),
                  ),
                  child: const Center(
                    child: Icon(Icons.delivery_dining_rounded, size: 40, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Delivery Haïti',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  isLoginMode
                      ? 'Konekte pou kòmande rapid \u26a1'
                      : 'Kreye kont ou gratis \u2014 fè premye kòmand ou',
                  style: TextStyle(
                    fontSize: 13.5,
                    color: Colors.white.withValues(alpha: 0.85),
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                // Toggle pill
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => isLoginMode = true),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: isLoginMode ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'Konekte',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: isLoginMode ? const Color(0xFFFF6600) : Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => isLoginMode = false),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !isLoginMode ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'Enskri',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: !isLoginMode ? const Color(0xFFFF6600) : Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // --- FORM BODY ---
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(22, 24, 22, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
              const SizedBox(height: 28),

              // LOGIN / REGISTER FORMS
              if (isLoginMode) ...[
                _buildFieldLabel('Nimewo telefon ou'),
                _buildPhoneInput(loginPhoneController),

                const SizedBox(height: 16),

                _buildFieldLabel('Modpas ou'),
                _buildPasswordInput(loginPasswordController),

                const SizedBox(height: 24),

                _buildSubmitButton(
                  title: 'Konekte sou Kont Mwen',
                  onPressed: _handleLogin,
                ),

                const SizedBox(height: 28),

              ] else ...[
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFieldLabel('Prenon *'),
                          _buildTextInput(
                            controller: regFirstNameController,
                            hint: 'Eg: Jean',
                            icon: Icons.person_outline,
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
                          _buildTextInput(
                            controller: regLastNameController,
                            hint: 'Eg: Baptiste',
                            icon: Icons.badge_outlined,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                _buildFieldLabel('Nimewo Telefòn Ayisyen *'),
                _buildPhoneInput(regPhoneController),

                const SizedBox(height: 16),

                _buildFieldLabel('Email (Opsyonèl)'),
                _buildTextInput(
                  controller: regEmailController,
                  hint: 'kliyan@gmail.com',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),

                const SizedBox(height: 16),

                _buildFieldLabel('Kreye yon Modpas * (omwen 6 karaktè)'),
                _buildPasswordInput(regPasswordController),

                const SizedBox(height: 16),

                _buildFieldLabel('Konfime Modpas la *'),
                _buildPasswordInput(regConfirmPasswordController),

                const SizedBox(height: 16),

                _buildFieldLabel('Adrès Livrezon Ou (Opsyonèl)'),
                _buildTextInput(
                  controller: regAddressController,
                  hint: 'Eg: Boulevard du Cap, Cap-Haïtien',
                  icon: Icons.location_on_outlined,
                ),

                const SizedBox(height: 16),

                // Language selection
                _buildFieldLabel('Preferans Lang'),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => selectedLanguage = 'ht'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                          decoration: BoxDecoration(
                            color: selectedLanguage == 'ht' ? const Color(0xFFFEF2F2) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selectedLanguage == 'ht' ? const Color(0xFFEB1700) : const Color(0xFFCBD5E1),
                              width: selectedLanguage == 'ht' ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: selectedLanguage == 'ht'
                                      ? const Color(0xFFEB1700)
                                      : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'HT',
                                  style: TextStyle(
                                    color: selectedLanguage == 'ht' ? Colors.white : const Color(0xFF475569),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Kreyòl',
                                style: TextStyle(
                                  color: selectedLanguage == 'ht' ? const Color(0xFFEB1700) : const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => selectedLanguage = 'fr'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                          decoration: BoxDecoration(
                            color: selectedLanguage == 'fr' ? const Color(0xFFFEF2F2) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selectedLanguage == 'fr' ? const Color(0xFFEB1700) : const Color(0xFFCBD5E1),
                              width: selectedLanguage == 'fr' ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: selectedLanguage == 'fr'
                                      ? const Color(0xFFEB1700)
                                      : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'FR',
                                  style: TextStyle(
                                    color: selectedLanguage == 'fr' ? Colors.white : const Color(0xFF475569),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Français',
                                style: TextStyle(
                                  color: selectedLanguage == 'fr' ? const Color(0xFFEB1700) : const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Terms Checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: acceptTerms,
                        activeColor: const Color(0xFFEB1700),
                        side: const BorderSide(color: Color(0xFF94A3B8)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        onChanged: (val) => setState(() => acceptTerms = val ?? false),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Mwen aksepte kondisyon itilizasyon ak règleman konfidansyalite Delivery Haïti.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF475569), fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 22),

                _buildSubmitButton(
                  title: 'Kreye Kont Mwen & Kòmanse',
                  onPressed: _handleRegister,
                ),

                const SizedBox(height: 20),
              ],

              // ─── TRUST FOOTER ───────────────────────────────────────
              const SizedBox(height: 16),
              const Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock_rounded, size: 14, color: Color(0xFF94A3B8)),
                    SizedBox(width: 6),
                    Text(
                      'Peman Sekirize • MonCash & Natcash Aksepte',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }


  // ─── REUSABLE UI WIDGETS ────────────────────────────────────

  Widget _buildFieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Text(
        text,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
      ),
    );
  }

  Widget _buildTextInput({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
          prefixIcon: Icon(icon, color: const Color(0xFF64748B), size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildPhoneInput(TextEditingController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: const BoxDecoration(
              border: Border(right: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: const Row(
              children: [
                Text(
                  '🇭🇹',
                  style: TextStyle(fontSize: 18),
                ),
                SizedBox(width: 8),
                Text(
                  '+509',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
              decoration: const InputDecoration(
                hintText: '37 XX XX XX',
                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordInput(TextEditingController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: !showPassword,
              style: const TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w600),
              decoration: const InputDecoration(
                hintText: '••••••••',
                hintStyle: TextStyle(color: Color(0xFF94A3B8)),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                prefixIcon: Icon(Icons.lock_outline_rounded, color: Color(0xFF64748B), size: 20),
              ),
            ),
          ),
          IconButton(
            icon: Icon(
              showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: const Color(0xFF64748B),
              size: 20,
            ),
            onPressed: () => setState(() => showPassword = !showPassword),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton({required String title, required VoidCallback onPressed}) {
    return Container(
      width: double.infinity,
      height: 52,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: const Color(0xFFEB1700),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEB1700).withValues(alpha: 0.3),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : Text(
                title,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.3),
              ),
      ),
    );
  }

  Widget _demoRow(String label, String phone, String pass) {
    return InkWell(
      onTap: () {
        loginPhoneController.text = phone;
        loginPasswordController.text = pass;
      },
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          children: [
            Text('$label: ', style: const TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w500)),
            Text(
              '+509 $phone',
              style: const TextStyle(fontSize: 13, color: Color(0xFFEB1700), fontWeight: FontWeight.w800),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('Klike', style: TextStyle(fontSize: 11, color: Color(0xFF475569), fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}
