import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/constants.dart';
import '../providers/driver_providers.dart';
import 'driver_home_screen.dart';

class DriverLoginScreen extends ConsumerStatefulWidget {
  final bool initialIsRegister;
  const DriverLoginScreen({super.key, this.initialIsRegister = false});

  @override
  ConsumerState<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends ConsumerState<DriverLoginScreen> {
  late bool isRegisterMode;

  final _phoneController = TextEditingController(text: '40553636');
  final _passwordController = TextEditingController(text: 'Password123!');

  // Register fields
  final _regFirstNameController = TextEditingController();
  final _regLastNameController = TextEditingController();
  final _regPhoneController = TextEditingController();
  final _regEmailController = TextEditingController();
  final _regPasswordController = TextEditingController();
  final _regPlateController = TextEditingController();
  final _regLicenseController = TextEditingController();
  String _selectedVehicleType = 'MOTORCYCLE';

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    isRegisterMode = widget.initialIsRegister;
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _regFirstNameController.dispose();
    _regLastNameController.dispose();
    _regPhoneController.dispose();
    _regEmailController.dispose();
    _regPasswordController.dispose();
    _regPlateController.dispose();
    _regLicenseController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin([String? overridePhone, String? overridePassword]) async {
    final rawPhone = overridePhone ?? _phoneController.text.trim();
    final password = overridePassword ?? _passwordController.text.trim();

    if (rawPhone.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Tanpri antre nimewo telefòn ak modpas ou.');
      return;
    }

    String phone = rawPhone.replaceAll(RegExp(r'\s+'), '');
    if (!phone.startsWith('+509')) {
      if (phone.startsWith('509')) {
        phone = '+$phone';
      } else {
        phone = '+509$phone';
      }
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final api = ref.read(driverApiProvider);
      final profile = await api.login(identifier: phone, password: password);

      if (mounted) {
        setState(() => _isLoading = false);

        if (profile != null) {
          ref.read(currentDriverProfileProvider.notifier).setProfile(profile);
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const DriverHomeScreen()),
          );
        } else {
          setState(() {
            _errorMessage = 'Nimewo oswa modpas la pa kòrèk.';
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Koneksyon entènèt la pa stab. Eseye ankò.';
        });
      }
    }
  }

  Future<void> _handleRegister() async {
    final firstName = _regFirstNameController.text.trim();
    final lastName = _regLastNameController.text.trim();
    final rawPhone = _regPhoneController.text.trim();
    final email = _regEmailController.text.trim();
    final password = _regPasswordController.text.trim();
    final plate = _regPlateController.text.trim();
    final license = _regLicenseController.text.trim();

    if (firstName.isEmpty || lastName.isEmpty) {
      setState(() => _errorMessage = 'Antre non ak siyati w.');
      return;
    }
    if (rawPhone.length < 8) {
      setState(() => _errorMessage = 'Antre yon nimewo telefòn valab.');
      return;
    }
    if (password.length < 6) {
      setState(() => _errorMessage = 'Modpas la dwe gen omwen 6 karaktè.');
      return;
    }
    if (plate.isEmpty) {
      setState(() => _errorMessage = 'Antre plak veyikil la.');
      return;
    }
    if (license.isEmpty) {
      setState(() => _errorMessage = 'Antre nimewo lisans oswa NIF/CIN.');
      return;
    }

    String phone = rawPhone.replaceAll(RegExp(r'\s+'), '');
    if (!phone.startsWith('+509')) {
      phone = '+509$phone';
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final api = ref.read(driverApiProvider);
      final result = await api.registerDriver(
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email.isNotEmpty ? email : '$rawPhone@deliveryhaiti.ht',
        password: password,
        vehicleType: _selectedVehicleType,
        vehiclePlate: plate,
        licenseNumber: license,
        city: 'Cap-Haïtien',
      );

      if (mounted) {
        setState(() => _isLoading = false);

        if (result['success'] == true && result['profile'] != null) {
          ref.read(currentDriverProfileProvider.notifier).setProfile(result['profile']);
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const DriverHomeScreen()),
          );
        } else {
          setState(() {
            _errorMessage = result['error'] ?? 'Nou pa ka kreye kont lan kounye a.';
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Erè koneksyon. Eseye ankò.';
        });
      }
    }
  }

  void _fillDemo(String phone) {
    _phoneController.text = phone.replaceAll('+509', '');
    _passwordController.text = 'Password123!';
    _handleLogin(phone, 'Password123!');
  }

  void _openSupport() async {
    final uri = Uri.parse('https://wa.me/50937000001?text=Bonjou,%20mwen%20se%20chofè');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          leading: isRegisterMode
              ? IconButton(
                  icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
                  onPressed: () => setState(() {
                    isRegisterMode = false;
                    _errorMessage = null;
                  }),
                )
              : null,
          actions: [
            TextButton(
              onPressed: _openSupport,
              child: Text(
                'Èd & Sipò',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Brand mark
                Image.asset(
                  'assets/images/dlh_logo.png',
                  height: 48,
                  alignment: Alignment.centerLeft,
                ),

                const SizedBox(height: 28),

                // Title & Subtitle
                Text(
                  isRegisterMode ? 'Enskri kòm chofè' : 'Konekte',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  isRegisterMode
                      ? 'Ranpli fòmilè a pou kòmanse resevwa kous nan Cap-Haïtien.'
                      : 'Antre nimewo telefòn ou pou w jwenn kòmand yo.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    color: const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),

                const SizedBox(height: 28),

                if (_errorMessage != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFEE2E2)),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: GoogleFonts.plusJakartaSans(
                        color: const Color(0xFFB91C1C),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                if (!isRegisterMode) _buildLoginFields() else _buildRegisterFields(),

                const SizedBox(height: 32),

                // Switch between Login / Register
                Center(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        isRegisterMode = !isRegisterMode;
                        _errorMessage = null;
                      });
                    },
                    child: RichText(
                      text: TextSpan(
                        style: GoogleFonts.plusJakartaSans(fontSize: 14, color: const Color(0xFF64748B)),
                        children: [
                          TextSpan(
                            text: isRegisterMode ? 'Ou gen kont deja? ' : 'Ou poko gen kont? ',
                          ),
                          TextSpan(
                            text: isRegisterMode ? 'Konekte' : 'Vin yon chofè patnè',
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w700,
                              color: DriverConstants.primaryCrimson,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Subtle developer quick login (clean & non-intrusive)
                if (!isRegisterMode) ...[
                  const Divider(height: 32, color: Color(0xFFF1F5F9)),
                  Center(
                    child: Text(
                      'KONT DEMO POU TÈS',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        letterSpacing: 0.8,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _fillDemo('+50940553636'),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text(
                            'Mackby Wise',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _fillDemo('+50937000006'),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text(
                            'Stevenson',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel('Nimewo telefòn'),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              alignment: Alignment.center,
              child: Text(
                '+509',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: const Color(0xFF334155),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: const Color(0xFF0F172A),
                ),
                decoration: _cleanInputDecoration('3700 0005'),
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildLabel('Modpas'),
            GestureDetector(
              onTap: _openSupport,
              child: Text(
                'Bliye modpas?',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: DriverConstants.primaryCrimson,
                ),
              ),
            ),
          ],
        ),
        TextField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w600,
            fontSize: 15,
            color: const Color(0xFF0F172A),
          ),
          decoration: _cleanInputDecoration(
            'Modpas ou',
            suffix: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: const Color(0xFF94A3B8),
                size: 20,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
        ),

        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : () => _handleLogin(),
            style: ElevatedButton.styleFrom(
              backgroundColor: DriverConstants.primaryCrimson,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    'Konekte',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('Non'),
                  TextField(
                    controller: _regFirstNameController,
                    style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
                    decoration: _cleanInputDecoration('Jean'),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('Siyati'),
                  TextField(
                    controller: _regLastNameController,
                    style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
                    decoration: _cleanInputDecoration('Baptiste'),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        _buildLabel('Telefòn'),
        TextField(
          controller: _regPhoneController,
          keyboardType: TextInputType.phone,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
          decoration: _cleanInputDecoration('+509 3800 0000'),
        ),

        const SizedBox(height: 16),

        _buildLabel('Email (opsyonèl)'),
        TextField(
          controller: _regEmailController,
          keyboardType: TextInputType.emailAddress,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
          decoration: _cleanInputDecoration('chofe@deliveryhaiti.ht'),
        ),

        const SizedBox(height: 16),

        _buildLabel('Kreye yon modpas'),
        TextField(
          controller: _regPasswordController,
          obscureText: _obscurePassword,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
          decoration: _cleanInputDecoration(
            'Omwen 6 karaktè',
            suffix: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: const Color(0xFF94A3B8),
                size: 20,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
        ),

        const SizedBox(height: 20),

        _buildLabel('Tip veyikil'),
        Row(
          children: [
            _buildVehiclePill('MOTORCYCLE', 'Moto'),
            const SizedBox(width: 8),
            _buildVehiclePill('CAR', 'Machin'),
            const SizedBox(width: 8),
            _buildVehiclePill('BICYCLE', 'Bisiklèt'),
          ],
        ),

        const SizedBox(height: 16),

        _buildLabel('Nimewo plak'),
        TextField(
          controller: _regPlateController,
          textCapitalization: TextCapitalization.characters,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
          decoration: _cleanInputDecoration('MC-45920'),
        ),

        const SizedBox(height: 16),

        _buildLabel('Nimewo lisans oswa NIF/CIN'),
        TextField(
          controller: _regLicenseController,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14),
          decoration: _cleanInputDecoration('004-982-102-1'),
        ),

        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : () => _handleRegister(),
            style: ElevatedButton.styleFrom(
              backgroundColor: DriverConstants.primaryCrimson,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    'Kreye kont chofè a',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildVehiclePill(String type, String title) {
    final isSelected = _selectedVehicleType == type;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedVehicleType = type),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            title,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : const Color(0xFF475569),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF334155),
        ),
      ),
    );
  }

  InputDecoration _cleanInputDecoration(String hint, {Widget? suffix}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.plusJakartaSans(
        color: const Color(0xFF94A3B8),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
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
        borderSide: const BorderSide(color: Color(0xFF0F172A), width: 1.5),
      ),
    );
  }
}
