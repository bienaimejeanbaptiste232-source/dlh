import 'dart:async';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import 'merchant_dashboard_screen.dart';
import 'merchant_login_screen.dart';

class SplashScreen extends StatefulWidget {
  final bool hasSession;
  const SplashScreen({super.key, required this.hasSession});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  double _progress = 0.0;
  Timer? _progressTimer;
  Timer? _navTimer;

  @override
  void initState() {
    super.initState();

    // Animasyon Logo (Scale & Fade)
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutBack,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    );

    _animController.forward();

    // Bar pwogresyon ki ranpli sou 5 segonn egzakteman
    const totalMs = 5000;
    const intervalMs = 50;
    const steps = totalMs / intervalMs;
    int currentStep = 0;

    _progressTimer = Timer.periodic(const Duration(milliseconds: intervalMs), (timer) {
      currentStep++;
      if (mounted) {
        setState(() {
          _progress = (currentStep / steps).clamp(0.0, 1.0);
        });
      }
      if (currentStep >= steps) {
        timer.cancel();
      }
    });

    // Navigasyon apre 5 segonn
    _navTimer = Timer(const Duration(seconds: 5), () {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (ctx, anim, secAnim) => widget.hasSession
              ? const MerchantDashboardScreen()
              : const MerchantLoginScreen(),
          transitionsBuilder: (ctx, anim, secAnim, child) {
            return FadeTransition(opacity: anim, child: child);
          },
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _progressTimer?.cancel();
    _navTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF040812),
      body: SafeArea(
        child: Stack(
          children: [
            // ── CERCLES LUMINEUX CINÉMATOGRAPHIQUES ──
            // Glow orange top-right
            Positioned(
              top: -60,
              right: -60,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFF6000).withValues(alpha: 0.22),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            // Glow pink bottom-left
            Positioned(
              bottom: -80,
              left: -80,
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFE11D48).withValues(alpha: 0.18),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            // Glow bleu-violet center
            Positioned(
              top: MediaQuery.of(context).size.height * 0.3,
              left: MediaQuery.of(context).size.width * 0.1,
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF6366F1).withValues(alpha: 0.10),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ── KONTNI SANTRAL ──
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo 160x160 squircle ak triple box-shadow
                      Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(32),
                          boxShadow: [
                            // Orange glow eksteryè
                            BoxShadow(
                              color: MerchantConstants.brandOrange.withValues(alpha: 0.50),
                              blurRadius: 50,
                              spreadRadius: 8,
                            ),
                            // Roz/wouj halo lwen
                            BoxShadow(
                              color: const Color(0xFFE11D48).withValues(alpha: 0.25),
                              blurRadius: 100,
                              spreadRadius: 20,
                            ),
                            // Blan reflet entèn
                            BoxShadow(
                              color: Colors.white.withValues(alpha: 0.10),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(32),
                          child: Image.asset(
                            'assets/images/dlh_logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Tit sou 2 liy
                      const Text(
                        'DELIVERY LAKAY',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 3.0,
                        ),
                      ),
                      const Text(
                        'HAÏTI',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 3.0,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Liseré dégradé orange
                      Container(
                        width: 60,
                        height: 2,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFFF6000), Color(0xFFE11D48)],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Badge machann
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                        ),
                        child: const Text(
                          'ESPAS MACHANN & PATNÈ',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Tagline
                      const Text(
                        'Restoran • Famasi • Materyo • Makèt',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── PROGRESS BAR & LOADING NAN PIE PAJ ──
            Positioned(
              left: 36,
              right: 36,
              bottom: 36,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress bar ak glow effet
                  Stack(
                    children: [
                      // Background track
                      Container(
                        height: 3,
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      // Barre orange
                      FractionallySizedBox(
                        widthFactor: _progress,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFF6000), Color(0xFFE11D48)],
                            ),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF6000).withValues(alpha: 0.6),
                                blurRadius: 6,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 1.8,
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF94A3B8)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Chajman sistèm... ${(5 - (_progress * 5)).ceil()}s',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
