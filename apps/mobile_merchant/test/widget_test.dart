import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_merchant/main.dart';

void main() {
  testWidgets('Merchant App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: DeliveryHaitiMerchantApp()));
    expect(find.text('Delivery Haïti Machann'), findsNothing);
  });
}
