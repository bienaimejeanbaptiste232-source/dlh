import 'package:flutter/material.dart';

class BusinessTheme {
  final Color primary;
  final Color primaryDark;
  final Color accent;
  final Color lightBg;
  final Color cardBorder;
  final Color badgeBg;
  final Color badgeText;
  final List<Color> gradient;
  final IconData appIcon;
  final IconData navHome;
  final IconData navOrders;
  final IconData navCatalog;
  final IconData navFinance;
  final IconData navProfile;
  final String appBarEmoji;
  const BusinessTheme({required this.primary,required this.primaryDark,required this.accent,required this.lightBg,required this.cardBorder,required this.badgeBg,required this.badgeText,required this.gradient,required this.appIcon,required this.navHome,required this.navOrders,required this.navCatalog,required this.navFinance,required this.navProfile,required this.appBarEmoji});
}

class BusinessTypeConfig {
  final String type;
  final String title;
  final String emoji;
  final String catalogTitle;
  final String itemLabel;
  final String addItemLabel;
  final String nameFieldHint;
  final String descFieldHint;
  final String prepTimeLabel;
  final String ordersTitle;
  final String prepTabLabel;
  final String preparingKpiLabel;
  final IconData preparingKpiIcon;
  final String preparingSectionTitle;
  final String preparingEmptyTitle;
  final String readyButtonLabel;
  final String readyInstructionText;
  final String startPrepButtonLabel;
  final String dialogPrepQuestion;
  final String driverArrivingMessage;
  final bool hasPrescriptionField;
  final bool hasUnitField;
  final bool hasAlcoholWarning;
  final bool hasSizeField;
  final bool hasColorField;
  final bool hasVariantMatrix;
  final bool hasBrandField;
  final bool hasExpiryField;
  final bool hasDosageField;
  final bool hasTechSpecs;
  final bool hasTransportField;
  final bool hasDimensions;
  final bool hasPortions;
  final List<String> availableSizes;
  final List<String> availableColors;
  final List<String> availableUnits;
  final List<String> defaultCategories;
  final BusinessTheme theme;
  const BusinessTypeConfig({required this.type,required this.title,required this.emoji,required this.catalogTitle,required this.itemLabel,required this.addItemLabel,required this.nameFieldHint,required this.descFieldHint,required this.prepTimeLabel,required this.ordersTitle,required this.prepTabLabel,required this.preparingKpiLabel,required this.preparingKpiIcon,required this.preparingSectionTitle,required this.preparingEmptyTitle,required this.readyButtonLabel,required this.readyInstructionText,required this.startPrepButtonLabel,required this.dialogPrepQuestion,required this.driverArrivingMessage,required this.defaultCategories,required this.theme,this.hasPrescriptionField=false,this.hasUnitField=false,this.hasAlcoholWarning=false,this.hasSizeField=false,this.hasColorField=false,this.hasVariantMatrix=false,this.hasBrandField=false,this.hasExpiryField=false,this.hasDosageField=false,this.hasTechSpecs=false,this.hasTransportField=false,this.hasDimensions=false,this.hasPortions=false,this.availableSizes=const[],this.availableColors=const[],this.availableUnits=const[]});
  String get icon => emoji;
  static List<Map<String, String>> get allTypes => [
    {"type": "RESTAURANT", "label": "Restoran ak Kizin", "emoji": "🍽️"},
    {"type": "FAST_FOOD", "label": "Fast Food ak Snack", "emoji": "🍟"},
    {"type": "PHARMACY", "label": "Famasi ak Sante", "emoji": "💊"},
    {"type": "SUPERMARKET", "label": "Makèt ak Episri", "emoji": "🛒"},
    {"type": "BAKERY", "label": "Boulanjri ak Patisri", "emoji": "🥖"},
    {"type": "BAR", "label": "Bar, Lounge ak Diskotèk", "emoji": "🍺"},
    {"type": "BEVERAGE_DEPOT", "label": "Depo Kola ak Bwason", "emoji": "🥤"},
    {"type": "CONSTRUCTION", "label": "Materyo Konstriksyon", "emoji": "🧱"},
    {"type": "AUTO_PARTS", "label": "Garaj ak Pyes Auto", "emoji": "🔧"},
    {"type": "BEAUTY", "label": "Boutik Bote ak Salon", "emoji": "💄"},
    {"type": "CLOTHING", "label": "Boutik Vetman ak Mode", "emoji": "👗"},
    {"type": "ELECTRONICS", "label": "Teknoloji ak Aparèy", "emoji": "💻"},
  ];

  static BusinessTypeConfig fromType(String? rawType) {
    final t = (rawType ?? 'RESTAURANT').toUpperCase();
    switch (t) {
      case 'ELECTRONICS':
      case 'TECH':
      case 'TELEPHONIE':     return _electronics;
      case 'PHARMACY':       return _pharmacy;
      case 'CONSTRUCTION':   return _construction;
      case 'SUPERMARKET':
      case 'GROCERY':        return _supermarket;
      case 'BAKERY':         return _bakery;
      case 'BAR':
      case 'LOUNGE':         return _bar;
      case 'BEVERAGE_DEPOT':
      case 'KOLA_DEPOT':     return _beverageDepot;
      case 'AUTO_PARTS':
      case 'GARAGE':         return _autoParts;
      case 'BEAUTY':
      case 'SALON':          return _beauty;
      case 'CLOTHING':
      case 'FASHION':        return _clothing;
      case 'FAST_FOOD':      return _fastFood;
      default:               return _restaurant;
    }
  }
  static const _restaurant = BusinessTypeConfig(
    type: 'RESTAURANT', title: 'Restoran ak Kizin Kreyòl', emoji: '🍽️',
    catalogTitle: 'Meni Restoran an', itemLabel: 'Plat / Manje', addItemLabel: 'Ajoute yon Nouvo Plat',
    nameFieldHint: 'Non Plat la (egz: Griot Konple, Tassot Kabrit...)',
    descFieldHint: 'Deskripsyon plat la (engredyan, akonpanyeman)', prepTimeLabel: 'Tan preparasyon nan kizin (minit)',
    ordersTitle: 'Komand Restoran', prepTabLabel: 'Kizin', preparingKpiLabel: 'Nan Kizin',
    preparingKpiIcon: Icons.outdoor_grill_outlined,
    preparingSectionTitle: 'Manje k ap Prepare nan Kizin', preparingEmptyTitle: 'Kizin lan lib pou kounye a',
    readyButtonLabel: 'MANJE A PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini prepare komand lan klike sou Manje a Pare.',
    startPrepButtonLabel: 'AKSEPTE AK KOMANSE KIZIN',
    dialogPrepQuestion: 'Konbyen tan kizin lan bezwen pou prepare komand sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan kizin lan',
    hasPortions: true,
    defaultCategories: ["🍗 Fritay ak Griot", "🍛 Plat Prensipal", "🥣 Soupe Kreyòl", "🐠 Pwason", "🥩 Vyann", "🍔 Burger", "🍕 Pizza", "🥗 Salad", "🥤 Bwason", "🍺 Bye"],
    theme: BusinessTheme(
      primary: Color(0xFFEA580C), primaryDark: Color(0xFFC2410C), accent: Color(0xFFFB923C),
      lightBg: Color(0xFFFFF7ED), cardBorder: Color(0xFFFED7AA), badgeBg: Color(0xFFFFEDD5), badgeText: Color(0xFFC2410C),
      gradient: [Color(0xFFEA580C), Color(0xFFC2410C)],
      appIcon: Icons.restaurant_rounded, navHome: Icons.storefront_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.menu_book_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🍽️',
    ),
  );
  static const _fastFood = BusinessTypeConfig(
    type: 'FAST_FOOD', title: 'Fast Food ak Snack', emoji: '🍟',
    catalogTitle: 'Meni Fast Food', itemLabel: 'Plat / Snack', addItemLabel: 'Ajoute yon Plat Fast Food',
    nameFieldHint: 'Non Plat la (egz: Burger, Poulet Frit, Hotdog...)',
    descFieldHint: 'Engredyan, gwose, opyon...', prepTimeLabel: 'Tan preparasyon rapid (minit)',
    ordersTitle: 'Komand Fast Food', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Prepare',
    preparingKpiIcon: Icons.fastfood_outlined,
    preparingSectionTitle: 'Komand k ap Prepare', preparingEmptyTitle: 'Pa gen komand k ap prepare kounye a',
    readyButtonLabel: 'KOMAND LAN PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini prepare komand lan klike sou Komand lan Pare.',
    startPrepButtonLabel: 'AKSEPTE AK PREPARE',
    dialogPrepQuestion: 'Konbyen tan pou prepare komand fast food sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan kwen an',
    hasPortions: true,
    defaultCategories: ["🍔 Burger", "🍟 Frit", "🌮 Taco", "🍕 Pizza", "🍗 Poulet Frit", "🌭 Hotdog", "🥤 Kola", "🍦 Glace"],
    theme: BusinessTheme(
      primary: Color(0xFFF97316), primaryDark: Color(0xFFEA580C), accent: Color(0xFFFDBA74),
      lightBg: Color(0xFFFFF7ED), cardBorder: Color(0xFFFED7AA), badgeBg: Color(0xFFFFEDD5), badgeText: Color(0xFFEA580C),
      gradient: [Color(0xFFF97316), Color(0xFFEA580C)],
      appIcon: Icons.fastfood_rounded, navHome: Icons.storefront_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.menu_book_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🍟',
    ),
  );
  static const _pharmacy = BusinessTypeConfig(
    type: 'PHARMACY', title: 'Famasi ak Sante', emoji: '💊',
    catalogTitle: 'Katalog Medikaman ak Remed', itemLabel: 'Medikaman / Remed', addItemLabel: 'Ajoute yon Nouvo Medikaman',
    nameFieldHint: 'Non Medikaman (egz: Paracetamol 500mg, Amoxicilline...)',
    descFieldHint: 'Doz, fomilasyon, fason pou bwe l...', prepTimeLabel: 'Tan pou prepare medikaman (minit)',
    ordersTitle: 'Komand Famasi ak Preskripsyon', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Prepare',
    preparingKpiIcon: Icons.medical_services_outlined,
    preparingSectionTitle: 'Medikaman k ap Prepare', preparingEmptyTitle: 'Pa gen medikaman k ap prepare kounye a',
    readyButtonLabel: 'MEDIKAMAN YO PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini prepare medikaman yo klike sou Medikaman yo Pare.',
    startPrepButtonLabel: 'AKSEPTE AK PREPARE REMED',
    dialogPrepQuestion: 'Konbyen tan famasi a bezwen pou prepare preskripsyon sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan famasi a', hasPrescriptionField: true, hasDosageField: true, hasExpiryField: true, hasBrandField: true,
    defaultCategories: ["💊 Doule ak Lafyev", "🦠 Antibiyotik", "🍊 Vitamin", "👶 Swen Ti Moun", "🩹 Premye Swen", "🩺 Tansyon ak Dyabet", "🪱 Tous ak Respiratwa", "🧴 Ijiyen", "👁️ Je ak Zorey", "🌿 Medsin Tradisyonel"],
    theme: BusinessTheme(
      primary: Color(0xFF0284C7), primaryDark: Color(0xFF0369A1), accent: Color(0xFF38BDF8),
      lightBg: Color(0xFFF0F9FF), cardBorder: Color(0xFFBAE6FD), badgeBg: Color(0xFFE0F2FE), badgeText: Color(0xFF0369A1),
      gradient: [Color(0xFF0284C7), Color(0xFF0369A1)],
      appIcon: Icons.local_pharmacy_rounded, navHome: Icons.medical_services_rounded, navOrders: Icons.medical_services_outlined,
      navCatalog: Icons.medication_rounded, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '💊',
    ),
  );
  static const _supermarket = BusinessTypeConfig(
    type: 'SUPERMARKET', title: 'Maket ak Episri', emoji: '🛒',
    catalogTitle: 'Katalog Pwodui Maket', itemLabel: 'Pwodui Episri', addItemLabel: 'Ajoute yon Pwodui Maket',
    nameFieldHint: 'Non Pwodui (egz: Diri Mega 25lbs, Lwil, Let...)',
    descFieldHint: 'Pwa, volim, mak, spesifikasyon...', prepTimeLabel: 'Tan pou rasanble koli a (minit)',
    ordersTitle: 'Komand Maket ak Episri', prepTabLabel: 'Rasanbleman', preparingKpiLabel: 'K ap Rasanble',
    preparingKpiIcon: Icons.shopping_basket_outlined,
    preparingSectionTitle: 'Komand k ap Rasanble', preparingEmptyTitle: 'Pa gen komand k ap rasanble kounye a',
    readyButtonLabel: 'KOMAND LAN PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini rasanble tout pwodui yo klike sou Komand lan Pare.',
    startPrepButtonLabel: 'AKSEPTE AK RASANBLE',
    dialogPrepQuestion: 'Konbyen tan pou rasanble atik sa yo?',
    driverArrivingMessage: 'Chofe a ap rive nan maket la', hasUnitField: true, hasExpiryField: true, hasBrandField: true, availableUnits: ['Sak','Pake','Boutèy','Bwat','Galon','Liv (lb)','Kilo (kg)','Lit (L)'],
    defaultCategories: ["🍚 Diri ak Mayi", "🛢️ Lwil ak Be", "🥩 Vyann ak Pwason Fre", "🥫 Konsev ak Epis", "🥤 Bwason ak Dlo", "🧀 Pwodui Letye", "🍪 Biskwit", "🥬 Fwi ak Legim", "🧴 Netwayaj Kay", "🧻 Swen Pesonel"],
    theme: BusinessTheme(
      primary: Color(0xFF16A34A), primaryDark: Color(0xFF15803D), accent: Color(0xFF4ADE80),
      lightBg: Color(0xFFF0FDF4), cardBorder: Color(0xFFBBF7D0), badgeBg: Color(0xFFDCFCE7), badgeText: Color(0xFF15803D),
      gradient: [Color(0xFF16A34A), Color(0xFF15803D)],
      appIcon: Icons.local_grocery_store_rounded, navHome: Icons.store_outlined, navOrders: Icons.shopping_cart_outlined,
      navCatalog: Icons.category_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🛒',
    ),
  );
  static const _bakery = BusinessTypeConfig(
    type: 'BAKERY', title: 'Boulanjri ak Patisri', emoji: '🥖',
    catalogTitle: 'Katalog Boulanjri ak Patisri', itemLabel: 'Pen / Patisri', addItemLabel: 'Ajoute yon Pen oswa Patisri',
    nameFieldHint: 'Non pwodui (egz: Pen Rwon, Baget Cho, Gato Chokola...)',
    descFieldHint: 'Gou, foma, engredyan espesyal...', prepTimeLabel: 'Tan pou kwit / prepare (minit)',
    ordersTitle: 'Komand Boulanjri ak Patisri', prepTabLabel: 'Four', preparingKpiLabel: 'Nan Four',
    preparingKpiIcon: Icons.bakery_dining_outlined,
    preparingSectionTitle: 'Pwodui k ap Kwit nan Four', preparingEmptyTitle: 'Pa gen pwodui k ap kwit kounye a',
    readyButtonLabel: 'PWODUI YO PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini kwit komand lan klike sou Pwodui yo Pare.',
    startPrepButtonLabel: 'AKSEPTE AK METE NAN FOUR',
    dialogPrepQuestion: 'Konbyen tan boulanjri a bezwen pou kwit / prepare sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan boulanjri a',
    defaultCategories: ["🥖 Pen Rwon ak Baget", "🥐 Krwasan", "🎂 Gato ak Patisri", "🥟 Pate ak Sandwich", "☕ Kafe ak Chokola", "🍪 Biskwit ak Ti Dous"],
    theme: BusinessTheme(
      primary: Color(0xFFD97706), primaryDark: Color(0xFF92400E), accent: Color(0xFFFBBF24),
      lightBg: Color(0xFFFFFBEB), cardBorder: Color(0xFFFDE68A), badgeBg: Color(0xFFFEF3C7), badgeText: Color(0xFF92400E),
      gradient: [Color(0xFFD97706), Color(0xFF92400E)],
      appIcon: Icons.bakery_dining_rounded, navHome: Icons.store_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.menu_book_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🥖',
    ),
  );
  static const _bar = BusinessTypeConfig(
    type: 'BAR', title: 'Bar, Lounge ak Diskotek', emoji: '🍺',
    catalogTitle: 'Meni Bwason ak Bouchon', itemLabel: 'Bwason / Ti Manje', addItemLabel: 'Ajoute yon Bwason oswa Plat',
    nameFieldHint: 'Non Bwason (egz: Prestige Fret, Rhum Barbancourt, Mojito...)',
    descFieldHint: 'Volim, degre alkol, gou spesyal...', prepTimeLabel: 'Tan pou prepare bwason (minit)',
    ordersTitle: 'Komand Bar ak Lounge', prepTabLabel: 'Bar', preparingKpiLabel: 'K ap Prepare',
    preparingKpiIcon: Icons.local_bar_outlined,
    preparingSectionTitle: 'Komand k ap Prepare nan Bar la', preparingEmptyTitle: 'Bar la lib pou kounye a',
    readyButtonLabel: 'KOMAND LAN PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini prepare bwason yo klike sou Komand lan Pare.',
    startPrepButtonLabel: 'AKSEPTE AK PREPARE',
    dialogPrepQuestion: 'Konbyen tan bar la bezwen pou prepare komand sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan bar la', hasAlcoholWarning: true,
    defaultCategories: ["🍺 Bye, Stout ak Lager", "🥃 Rhum, Whisky ak Spiri", "🍷 Diven ak Champenwa", "🍹 Koktel ak Mojito", "🥤 Bwason San Alkol", "🫙 Ponch ak Kremas Ayisyen", "🥗 Zetwal ak Bouchon", "🍔 Sandwich ak Ti Manje"],
    theme: BusinessTheme(
      primary: Color(0xFF7C3AED), primaryDark: Color(0xFF5B21B6), accent: Color(0xFFA78BFA),
      lightBg: Color(0xFFFAF5FF), cardBorder: Color(0xFFDDD6FE), badgeBg: Color(0xFFEDE9FE), badgeText: Color(0xFF5B21B6),
      gradient: [Color(0xFF7C3AED), Color(0xFF5B21B6)],
      appIcon: Icons.local_bar_rounded, navHome: Icons.nightlife_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.menu_book_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🍺',
    ),
  );
  static const _beverageDepot = BusinessTypeConfig(
    type: 'BEVERAGE_DEPOT', title: 'Depo Kola ak Bwason', emoji: '🥤',
    catalogTitle: 'Katalog Kola, Dlo ak Bwason', itemLabel: 'Keks / Bwason', addItemLabel: 'Ajoute yon Keks oswa Bwason',
    nameFieldHint: 'Non Pwodui (egz: Couronne 24 bout, Dlo Culligan 5 gal...)',
    descFieldHint: 'Kantite nan keks, volim, mak...', prepTimeLabel: 'Tan pou prepare chajman keks la (minit)',
    ordersTitle: 'Komand Kola ak Bwason', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Chaje',
    preparingKpiIcon: Icons.local_drink_outlined,
    preparingSectionTitle: 'Keks k ap Prepare pou Livrezon', preparingEmptyTitle: 'Pa gen keks k ap prepare kounye a',
    readyButtonLabel: 'KEKS YO PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini chaje keks yo klike sou Keks yo Pare.',
    startPrepButtonLabel: 'AKSEPTE AK CHAJE KEKS YO',
    dialogPrepQuestion: 'Konbyen tan depo a bezwen pou prepare chajman kola sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan depo kola a', hasUnitField: true, hasExpiryField: true, hasBrandField: true, availableUnits: ['Sak','Pake','Boutèy','Bwat','Galon','Liv (lb)','Kilo (kg)','Lit (L)'],
    defaultCategories: ["🥤 Kola ak Gazez", "💧 Dlo Bonnaj", "🍺 Bye Prestige", "🧃 Ji Fwi ak Nectar", "🫙 Bwason Enejik", "🍫 Chocolat Cho", "☕ Kafe Lacoma", "🧴 Dlo Sante"],
    theme: BusinessTheme(
      primary: Color(0xFF0891B2), primaryDark: Color(0xFF0E7490), accent: Color(0xFF22D3EE),
      lightBg: Color(0xFFECFEFF), cardBorder: Color(0xFFA5F3FC), badgeBg: Color(0xFFCFFAFE), badgeText: Color(0xFF0E7490),
      gradient: [Color(0xFF0891B2), Color(0xFF0E7490)],
      appIcon: Icons.local_drink_rounded, navHome: Icons.store_outlined, navOrders: Icons.delivery_dining_outlined,
      navCatalog: Icons.inventory_2_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🥤',
    ),
  );
  static const _construction = BusinessTypeConfig(
    type: 'CONSTRUCTION', title: 'Materyo Konstriksyon ak Kinkayri', emoji: '🧱',
    catalogTitle: 'Katalog Materyo ak Zouti', itemLabel: 'Materyo / Zouti', addItemLabel: 'Ajoute yon Nouvo Materyo',
    nameFieldHint: 'Non Materyo (egz: Siman Kolos, Fe 1/2, Blok 6 pous...)',
    descFieldHint: 'Kalite, dimansyon, epese, mak fabrikan...', prepTimeLabel: 'Tan pou prepare chajman (minit)',
    ordersTitle: 'Komand Materyo Konstriksyon', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Chaje',
    preparingKpiIcon: Icons.inventory_2_outlined,
    preparingSectionTitle: 'Materyo k ap Prepare pou Chajman', preparingEmptyTitle: 'Pa gen materyo k ap prepare kounye a',
    readyButtonLabel: 'MATERYO YO PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini prepare materyo yo klike sou Materyo yo Pare.',
    startPrepButtonLabel: 'AKSEPTE AK PREPARE MATERYO',
    dialogPrepQuestion: 'Konbyen tan depo a bezwen pou prepare chajman sa yo?',
    driverArrivingMessage: 'Chofe a ap rive nan depo a', hasUnitField: true, hasTransportField: true, hasDimensions: true, availableUnits: ['Sak','Mèt kib','Tòn','Moso','Pyès','Woulo'],
    defaultCategories: ["🧱 Siman, Sab ak Blok", "⛓️ Fe ak Asye", "🔨 Zouti ak Klou", "🎨 Penti", "🚰 Plonbri ak Tiyo", "⚡ Elektrisite ak Kab", "🪵 Bwa ak Panno", "🚪 Po ak Fenet", "🦺 Sekirite"],
    theme: BusinessTheme(
      primary: Color(0xFFD97706), primaryDark: Color(0xFFB45309), accent: Color(0xFFFBBF24),
      lightBg: Color(0xFFFFFBEB), cardBorder: Color(0xFFFDE68A), badgeBg: Color(0xFFFEF3C7), badgeText: Color(0xFF92400E),
      gradient: [Color(0xFFD97706), Color(0xFFB45309)],
      appIcon: Icons.construction_rounded, navHome: Icons.warehouse_outlined, navOrders: Icons.local_shipping_outlined,
      navCatalog: Icons.inventory_2_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🧱',
    ),
  );
  static const _autoParts = BusinessTypeConfig(
    type: 'AUTO_PARTS', title: 'Garaj, Mekanik ak Pyes Auto', emoji: '🔧',
    catalogTitle: 'Katalog Pyes Auto ak Akseswa', itemLabel: 'Pyes / Akseswa', addItemLabel: 'Ajoute yon Pyes Auto',
    nameFieldHint: 'Non Pyes (egz: Filte Lwil, Pye bo, Plaquettes Fre...)',
    descFieldHint: 'Nimewo pyes, model machin, mak konpatib...', prepTimeLabel: 'Tan pou jwenn ak prepare pyes la (minit)',
    ordersTitle: 'Komand Pyes ak Reparasyon', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Cheche',
    preparingKpiIcon: Icons.build_outlined,
    preparingSectionTitle: 'Pyes k ap Prepare', preparingEmptyTitle: 'Pa gen pyes k ap prepare kounye a',
    readyButtonLabel: 'PYES YO PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou jwenn pyes la klike sou Pyes yo Pare.',
    startPrepButtonLabel: 'AKSEPTE AK JWENN PYES LA',
    dialogPrepQuestion: 'Konbyen tan garaj la bezwen pou jwenn ak prepare pyes sa yo?',
    driverArrivingMessage: 'Chofe a ap rive nan garaj la', hasUnitField: true,
    defaultCategories: ["🔧 Mete ak Bolt Mote", "🛞 Kawotchou ak Jant", "⚡ Batri ak Alternateur", "🛢️ Lwil Mote ak Gres", "🔩 Fre ak Suspansyon", "💡 Fimel ak Fano", "🪟 Karosri ak Vit", "🧰 Zouti Mekanik"],
    theme: BusinessTheme(
      primary: Color(0xFF374151), primaryDark: Color(0xFF1F2937), accent: Color(0xFF6B7280),
      lightBg: Color(0xFFF9FAFB), cardBorder: Color(0xFFD1D5DB), badgeBg: Color(0xFFF3F4F6), badgeText: Color(0xFF374151),
      gradient: [Color(0xFF374151), Color(0xFF1F2937)],
      appIcon: Icons.car_repair_rounded, navHome: Icons.garage_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.build_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '🔧',
    ),
  );
  static const _beauty = BusinessTypeConfig(
    type: 'BEAUTY', title: 'Boutik Bote, Salon ak Spa', emoji: '💄',
    catalogTitle: 'Katalog Pwodui Bote ak Swen', itemLabel: 'Pwodui / Sevis Bote', addItemLabel: 'Ajoute yon Pwodui Bote',
    nameFieldHint: 'Non Pwodui (egz: Creme SBR, Perruque Brazilian, Lissage...)',
    descFieldHint: 'Teyti, koule, matye, dimansyon...', prepTimeLabel: 'Tan pou prepare komand lan (minit)',
    ordersTitle: 'Komand Bote ak Swen', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Prepare',
    preparingKpiIcon: Icons.face_retouching_natural_outlined,
    preparingSectionTitle: 'Komand Bote k ap Prepare', preparingEmptyTitle: 'Pa gen komand bote k ap prepare kounye a',
    readyButtonLabel: 'PWODUI YO PARE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini prepare pwodui bote yo klike sou Pwodui yo Pare.',
    startPrepButtonLabel: 'AKSEPTE AK PREPARE',
    dialogPrepQuestion: 'Konbyen tan boutik la bezwen pou prepare komand sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan boutik bote a',
    defaultCategories: ["💆 Swen Cheve ak Periki", "💅 Ongle, Gel ak Vernis", "🧴 Creme ak Seren", "💄 Makiyaj ak Cosmetik", "🌸 Pafim ak Deyodoran", "🪥 Swen Dante", "👗 Periki ak Ekstansyon", "🛁 Pwodui Beny"],
    theme: BusinessTheme(
      primary: Color(0xFFDB2777), primaryDark: Color(0xFFBE185D), accent: Color(0xFFF472B6),
      lightBg: Color(0xFFFFF1F2), cardBorder: Color(0xFFFCCDD7), badgeBg: Color(0xFFFFE4E6), badgeText: Color(0xFFBE185D),
      gradient: [Color(0xFFDB2777), Color(0xFFBE185D)],
      appIcon: Icons.face_retouching_natural_rounded, navHome: Icons.store_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.spa_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '💄',
    ),
  );
  static const _clothing = BusinessTypeConfig(
    type: 'CLOTHING', title: 'Boutik Vetman ak Mode', emoji: '👗',
    catalogTitle: 'Katalog Vetman ak Akseswa Mode', itemLabel: 'Atik Vetman / Akseswa', addItemLabel: 'Ajoute yon Atik Mode',
    nameFieldHint: 'Non Atik (egz: Chemiz Polo L, Wobe Wouj M, Sapat Nike 42...)',
    descFieldHint: 'Koule, matye, gwose disponib...', prepTimeLabel: 'Tan pou jwenn ak embale atik la (minit)',
    ordersTitle: 'Komand Vetman ak Mode', prepTabLabel: 'Anbalaj', preparingKpiLabel: 'K ap Embale',
    preparingKpiIcon: Icons.checkroom_outlined,
    preparingSectionTitle: 'Komand k ap Embale', preparingEmptyTitle: 'Pa gen komand vetman k ap prepare kounye a',
    readyButtonLabel: 'KOMAND LAN ANBALYE POU LIVRE 📦',
    readyInstructionText: 'Le ou fini embale komand lan klike sou Komand lan Pare.',
    startPrepButtonLabel: 'AKSEPTE AK EMBALE',
    dialogPrepQuestion: 'Konbyen tan boutik la bezwen pou jwenn ak embale atik sa a?',
    driverArrivingMessage: 'Chofe a ap rive nan boutik la',
    hasSizeField: true, hasColorField: true, hasVariantMatrix: true, hasBrandField: true,
    availableSizes: ['XS','S','M','L','XL','XXL'],
    availableColors: ['Nwa','Blan','Wouj','Ble','Vèt','Kaki','Gri','Jòn','Woz','Mawon'],
    defaultCategories: ["👕 Chemiz, T-Shirt ak Polo", "👖 Pantalon ak Jeans", "👗 Wobe ak Jip", "🧥 Manteau ak Jaket", "👟 Sapat ak Sandal", "🧣 Senti ak Akseswa", "🎒 Sak ak Valis", "👒 Chapo ak Kasket"],
    theme: BusinessTheme(
      primary: Color(0xFFEC4899), primaryDark: Color(0xFFBE185D), accent: Color(0xFFF9A8D4),
      lightBg: Color(0xFFFFF1F2), cardBorder: Color(0xFFFCCDD7), badgeBg: Color(0xFFFFE4E6), badgeText: Color(0xFFBE185D),
      gradient: [Color(0xFFEC4899), Color(0xFFBE185D)],
      appIcon: Icons.checkroom_rounded, navHome: Icons.store_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.style_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '👗',
    ),
  );
  static const _electronics = BusinessTypeConfig(
    type: 'ELECTRONICS', title: 'Boutik Teknoloji ak Aparèy', emoji: '💻',
    catalogTitle: 'Katalòg Pwodwi Teknoloji', itemLabel: 'Aparèy / Pwodwi Teknoloji', addItemLabel: 'Ajoute yon Pwodwi Teknoloji',
    nameFieldHint: 'Non Pwodwi (egz: iPhone 15 Pro Max 256GB, Dell XPS 15...)',
    descFieldHint: 'Karakteristik, memwa, eta (nouvo/dezyèm men)...', prepTimeLabel: 'Tan pou prepare ak teste aparèy la (minit)',
    ordersTitle: 'Kòmand Teknoloji ak Aparèy', prepTabLabel: 'Preparasyon', preparingKpiLabel: 'K ap Prepare',
    preparingKpiIcon: Icons.devices_other_outlined,
    preparingSectionTitle: 'Aparèy k ap Prepare ak Teste', preparingEmptyTitle: 'Pa gen aparèy k ap prepare kounye a',
    readyButtonLabel: 'APARÈY YO PARE POU LIVRE 📦',
    readyInstructionText: 'Lè ou fin teste ak anbalé aparèy la klike sou Pare.',
    startPrepButtonLabel: 'AKSEPTE AK PREPARE',
    dialogPrepQuestion: 'Konbyen tan boutik la bezwen pou prepare ak verifye aparèy la?',
    driverArrivingMessage: 'Chofè a ap rive nan boutik teknoloji a',
    hasTechSpecs: true, hasBrandField: true, hasColorField: true,
    availableColors: ['Nwa', 'Blan', 'Gri / Titàn', 'Ble', 'Lò', 'Ajan', 'Wouj'],
    defaultCategories: [
      "📱 Telefòn & Smartphones",
      "💻 Òdinatè & Laptops",
      "🎧 Ekoutè & AirPods",
      "🔌 Akseswa & Chajè",
      "🎮 Pwodwi Gaming & Konsòl",
      "⌚ Mont Entèlijan (Smartwatch)",
      "📷 Kamera & Sekirite",
      "🔊 Orpalè & Soundbar"
    ],
    theme: BusinessTheme(
      primary: Color(0xFF2563EB), primaryDark: Color(0xFF1D4ED8), accent: Color(0xFF60A5FA),
      lightBg: Color(0xFFEFF6FF), cardBorder: Color(0xFFBFDBFE), badgeBg: Color(0xFFDBEAFE), badgeText: Color(0xFF1E40AF),
      gradient: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
      appIcon: Icons.devices_rounded, navHome: Icons.storefront_outlined, navOrders: Icons.receipt_long_outlined,
      navCatalog: Icons.inventory_2_outlined, navFinance: Icons.account_balance_outlined, navProfile: Icons.badge_outlined, appBarEmoji: '💻',
    ),
  );
}
