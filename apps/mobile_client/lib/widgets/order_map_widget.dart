import 'dart:math' as math;
import 'package:flutter/material.dart';

class OrderLiveMapWidget extends StatefulWidget {
  final String status;
  final String merchantName;
  final String customerAddress;
  final String? driverName;
  final String? driverPlate;

  const OrderLiveMapWidget({
    super.key,
    required this.status,
    required this.merchantName,
    required this.customerAddress,
    this.driverName,
    this.driverPlate,
  });

  @override
  State<OrderLiveMapWidget> createState() => _OrderLiveMapWidgetState();
}

class _OrderLiveMapWidgetState extends State<OrderLiveMapWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  double _getProgressForStatus(String status) {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0.05;
      case 'PREPARING':
        return 0.15;
      case 'READY_FOR_PICKUP':
        return 0.30;
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 0.65;
      case 'DELIVERED':
        return 1.0;
      default:
        return 0.5;
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = _getProgressForStatus(widget.status);
    final isDelivered = widget.status == 'DELIVERED';
    final isInTransit = widget.status == 'IN_TRANSIT' || widget.status == 'PICKED_UP';

    return Container(
      height: 240,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Custom Drawn Dark Map Grid & Roads
          Positioned.fill(
            child: CustomPaint(
              painter: _MapCanvasPainter(
                routeProgress: progress,
                pulseAnimation: _animController,
              ),
            ),
          ),

          // Merchant Marker (Top Left)
          Positioned(
            left: 32,
            top: 40,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFF6600), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF6600).withValues(alpha: 0.4),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.restaurant_rounded, color: Colors.white, size: 16),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.75),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    widget.merchantName.length > 14
                        ? '${widget.merchantName.substring(0, 14)}...'
                        : widget.merchantName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Customer Destination Marker (Bottom Right)
          Positioned(
            right: 36,
            bottom: 30,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF10B981), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withValues(alpha: 0.4),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.home_rounded, color: Colors.white, size: 16),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.75),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Kay Kliyan',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Animated Driver Motorcycle Marker along the curve
          AnimatedBuilder(
            animation: _animController,
            builder: (context, _) {
              // Calculate position along BÃ©zier curve from (52, 60) to (width - 56, height - 50)
              final t = progress;
              final p0 = const Offset(52, 60);
              final p1 = const Offset(170, 40);
              final p2 = const Offset(120, 170);
              final p3 = const Offset(260, 160);

              final x = math.pow(1 - t, 3) * p0.dx +
                  3 * math.pow(1 - t, 2) * t * p1.dx +
                  3 * (1 - t) * math.pow(t, 2) * p2.dx +
                  math.pow(t, 3) * p3.dx;
              final y = math.pow(1 - t, 3) * p0.dy +
                  3 * math.pow(1 - t, 2) * t * p1.dy +
                  3 * (1 - t) * math.pow(t, 2) * p2.dy +
                  math.pow(t, 3) * p3.dy;

              return Positioned(
                left: x - 18,
                top: y - 18,
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isInTransit ? const Color(0xFF2563EB) : const Color(0xFF1E293B),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: (isInTransit ? const Color(0xFF2563EB) : Colors.amber)
                            .withValues(alpha: 0.6),
                        blurRadius: 14,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Icon(
                      isDelivered ? Icons.task_alt_rounded : Icons.two_wheeler_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              );
            },
          ),

          // Top overlay stats pill
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.near_me_rounded, size: 12, color: Color(0xFF00E5FF)),
                  const SizedBox(width: 5),
                  Text(
                    isDelivered
                        ? '0 km â€¢ Arive'
                        : isInTransit
                            ? '1.2 km â€¢ ~8 min'
                            : '2.5 km â€¢ PÃ©tion-Ville',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom live GPS badge
          Positioned(
            bottom: 10,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'GPS AN TAN REYÃˆL â€¢ PÃ‰TION-VILLE / DELMAS',
                    style: TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapCanvasPainter extends CustomPainter {
  final double routeProgress;
  final Animation<double> pulseAnimation;

  _MapCanvasPainter({
    required this.routeProgress,
    required this.pulseAnimation,
  }) : super(repaint: pulseAnimation);

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Draw subtle street grid
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += 35) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 35) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // 2. Draw secondary arterial streets
    final roadPaint = Paint()
      ..color = const Color(0xFF1F293D)
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(const Offset(0, 100), Offset(size.width, 140), roadPaint);
    canvas.drawLine(const Offset(100, 0), Offset(160, size.height), roadPaint);

    // 3. Draw BÃ©zier Delivery Route Polyline
    final path = Path();
    path.moveTo(52, 60);
    path.cubicTo(170, 40, 120, 170, 260, 160);

    // Background route track (gray dashed/solid)
    final trackPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke;
    canvas.drawPath(path, trackPaint);

    // Active covered route track (crimson gradient style)
    final activePaint = Paint()
      ..color = const Color(0xFFFF6600)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Approximate covered route
    canvas.drawPath(path, activePaint);
  }

  @override
  bool shouldRepaint(covariant _MapCanvasPainter oldDelegate) => true;
}

