import 'package:flutter/material.dart';

/// Konfigirasyon adaptif selon kalite komès la (Famasi, Kinkayri/Materyo, Sipèmache, elatriye)
enum StoreType {
  pharmacy,
  construction,
  supermarket,
  bakery,
  beverageDepot,
  bar,
  autoParts,
  clothing,
  electronics,
  cosmetics,
  restaurant,
}

class StoreTimelineStep {
  final String title;
  final String subtitle;
  final IconData icon;

  const StoreTimelineStep({
    required this.title,
    required this.subtitle,
    required this.icon,
  });
}

class StoreTypeConfig {
  final StoreType type;
  final String label;
  final String storeNoun;
  final String itemNoun;
  final IconData icon;
  final IconData prepIcon;
  final Color primaryColor;
  final Color badgeBgColor;

  const StoreTypeConfig({
    required this.type,
    required this.label,
    required this.storeNoun,
    required this.itemNoun,
    required this.icon,
    required this.prepIcon,
    required this.primaryColor,
    required this.badgeBgColor,
  });

  /// Detekte kalite komès la otomatikman baze sou `category` oubyen non komèsan an
  factory StoreTypeConfig.from({String? category, String? merchantName}) {
    final cat = (category ?? '').trim().toLowerCase();
    final name = (merchantName ?? '').trim().toLowerCase();
    final combined = '$cat $name';

    // 1. Famasi
    if (cat == 'pharmacy' ||
        cat == 'famasi' ||
        cat == 'santé' ||
        cat == 'sante' ||
        combined.contains('pharm') ||
        combined.contains('famasi') ||
        combined.contains('med') ||
        combined.contains('clinic')) {
      return const StoreTypeConfig(
        type: StoreType.pharmacy,
        label: 'Famasi & Sante',
        storeNoun: 'Famasi',
        itemNoun: 'medikaman ak pwodui sante',
        icon: Icons.local_pharmacy_rounded,
        prepIcon: Icons.medication_liquid_rounded,
        primaryColor: Color(0xFF0284C7), // Sky blue
        badgeBgColor: Color(0xFFE0F2FE),
      );
    }

    // 2. Kinkayri & Materyo Konstriksyon
    if (cat == 'construction' ||
        cat == 'hardware' ||
        cat == 'materiaux' ||
        cat == 'kinkayri' ||
        combined.contains('mater') ||
        combined.contains('kinkay') ||
        combined.contains('quincaill') ||
        combined.contains('konstriksyon') ||
        combined.contains('ciment') ||
        combined.contains('haiti block')) {
      return const StoreTypeConfig(
        type: StoreType.construction,
        label: 'Materyo & Kinkayri',
        storeNoun: 'Kinkayri / Depo Materyo',
        itemNoun: 'materyo ak zouti',
        icon: Icons.construction_rounded,
        prepIcon: Icons.handyman_rounded,
        primaryColor: Color(0xFFD97706), // Amber / Construction
        badgeBgColor: Color(0xFFFEF3C7),
      );
    }

    // 3. Sipèmache & Episri
    if (cat == 'supermarket' ||
        cat == 'grocery' ||
        cat == 'epicerie' ||
        cat == 'makèt' ||
        combined.contains('superm') ||
        combined.contains('marche') ||
        combined.contains('maket') ||
        combined.contains('makèt') ||
        combined.contains('epicerie') ||
        combined.contains('provisions')) {
      return const StoreTypeConfig(
        type: StoreType.supermarket,
        label: 'Sipèmache & Episri',
        storeNoun: 'Sipèmache',
        itemNoun: 'pwovizyon ak kous',
        icon: Icons.shopping_basket_rounded,
        prepIcon: Icons.local_grocery_store_rounded,
        primaryColor: Color(0xFF059669), // Emerald
        badgeBgColor: Color(0xFFD1FAE5),
      );
    }

    // 4. Boulanje & Patisri
    if (cat == 'bakery' ||
        cat == 'boulangerie' ||
        cat == 'patisri' ||
        combined.contains('boulang') ||
        combined.contains('pain') ||
        combined.contains('patiss') ||
        combined.contains('pen')) {
      return const StoreTypeConfig(
        type: StoreType.bakery,
        label: 'Boulanje & Patisri',
        storeNoun: 'Boulanje',
        itemNoun: 'pen ak gato',
        icon: Icons.bakery_dining_rounded,
        prepIcon: Icons.cake_rounded,
        primaryColor: Color(0xFFB45309), // Warm Brown
        badgeBgColor: Color(0xFFFDE68A),
      );
    }

    // 5. Depo Bwason / Kola
    if (cat == 'beverage_depot' ||
        cat == 'depot' ||
        combined.contains('depo') ||
        combined.contains('kola') ||
        combined.contains('brasserie') ||
        combined.contains('bwason')) {
      return const StoreTypeConfig(
        type: StoreType.beverageDepot,
        label: 'Depo Bwason & Kola',
        storeNoun: 'Depo Bwason',
        itemNoun: 'bwason ak kès kola',
        icon: Icons.inventory_2_rounded,
        prepIcon: Icons.local_drink_rounded,
        primaryColor: Color(0xFF0891B2), // Cyan
        badgeBgColor: Color(0xFFCFFAFE),
      );
    }

    // 6. Bar & Lounge
    if (cat == 'bar' ||
        cat == 'lounge' ||
        combined.contains('bar') ||
        combined.contains('lounge') ||
        combined.contains('club')) {
      return const StoreTypeConfig(
        type: StoreType.bar,
        label: 'Bar & Lounge',
        storeNoun: 'Bar & Lounge',
        itemNoun: 'bwason ak koktèl',
        icon: Icons.sports_bar_rounded,
        prepIcon: Icons.local_bar_rounded,
        primaryColor: Color(0xFF7C3AED), // Purple
        badgeBgColor: Color(0xFFEDE9FE),
      );
    }

    // 7. Pyès Machin & Moto
    if (cat == 'auto_parts' ||
        cat == 'auto' ||
        cat == 'moto' ||
        combined.contains('auto') ||
        combined.contains('moto') ||
        combined.contains('pyès') ||
        combined.contains('pyes') ||
        combined.contains('garage')) {
      return const StoreTypeConfig(
        type: StoreType.autoParts,
        label: 'Pyès Machin & Moto',
        storeNoun: 'Magazen Pyès',
        itemNoun: 'pyès ak akseswa',
        icon: Icons.build_circle_rounded,
        prepIcon: Icons.settings_rounded,
        primaryColor: Color(0xFF475569), // Slate
        badgeBgColor: Color(0xFFF1F5F9),
      );
    }

    // 8. Rad & Mòd
    if (cat == 'clothing' ||
        cat == 'boutique' ||
        cat == 'mode' ||
        combined.contains('rad') ||
        combined.contains('boutique') ||
        combined.contains('vetement') ||
        combined.contains('mod')) {
      return const StoreTypeConfig(
        type: StoreType.clothing,
        label: 'Boutik Rad & Mòd',
        storeNoun: 'Boutik',
        itemNoun: 'rad ak atik mòd',
        icon: Icons.checkroom_rounded,
        prepIcon: Icons.shopping_bag_rounded,
        primaryColor: Color(0xFFDB2777), // Pink
        badgeBgColor: Color(0xFFFCE7F3),
      );
    }

    // 9. Elektwonik & Telefòn
    if (cat == 'electronics' ||
        cat == 'tech' ||
        combined.contains('electr') ||
        combined.contains('phone') ||
        combined.contains('tech') ||
        combined.contains('telefon')) {
      return const StoreTypeConfig(
        type: StoreType.electronics,
        label: 'Elektwonik & Teknoloji',
        storeNoun: 'Magazen Elektwonik',
        itemNoun: 'aparèy ak akseswa',
        icon: Icons.devices_rounded,
        prepIcon: Icons.memory_rounded,
        primaryColor: Color(0xFF2563EB), // Indigo/Blue
        badgeBgColor: Color(0xFFDBEAFE),
      );
    }

    // 10. Kosmetik & Bote
    if (cat == 'cosmetics' ||
        cat == 'beauty' ||
        combined.contains('beaute') ||
        combined.contains('bote') ||
        combined.contains('cosmet') ||
        combined.contains('parfum')) {
      return const StoreTypeConfig(
        type: StoreType.cosmetics,
        label: 'Kosmetik & Bote',
        storeNoun: 'Boutik Bote',
        itemNoun: 'pwodui bote ak pafen',
        icon: Icons.spa_rounded,
        prepIcon: Icons.auto_awesome_rounded,
        primaryColor: Color(0xFFBE185D), // Rose
        badgeBgColor: Color(0xFFFCE7F3),
      );
    }

    // 11. Defo: Restoran / Manje
    return const StoreTypeConfig(
      type: StoreType.restaurant,
      label: 'Restoran & Gastwonomi',
      storeNoun: 'Restoran',
      itemNoun: 'manje',
      icon: Icons.restaurant_rounded,
      prepIcon: Icons.soup_kitchen_rounded,
      primaryColor: Color(0xFFFF5722), // Coral / Food
      badgeBgColor: Color(0xFFFFEBE5),
    );
  }

  /// Retounen etap swivi komand yo adapte ak kalite komès sa a
  List<StoreTimelineStep> getTimelineSteps() {
    switch (type) {
      case StoreType.pharmacy:
        return [
          const StoreTimelineStep(
            title: 'Kòmand voye',
            subtitle: 'Famasi a resevwa preskripsyon / demann ou an',
            icon: Icons.check_circle_rounded,
          ),
          StoreTimelineStep(
            title: 'Famasi a ap verifye e prepare',
            subtitle: 'Famasyen an ap prepare medikaman ak pwodui w yo',
            icon: prepIcon,
          ),
          const StoreTimelineStep(
            title: 'Pake pare pou livrezon',
            subtitle: 'Livè a ap vini pran pake medikaman w lan',
            icon: Icons.inventory_2_rounded,
          ),
          const StoreTimelineStep(
            title: 'Sou wout pou livrezon',
            subtitle: 'Livè a ap pote medikaman w yo rapidman',
            icon: Icons.two_wheeler_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livre ak swen',
            subtitle: 'Kòmand medikaman w lan rive nan men w san danje',
            icon: Icons.task_alt_rounded,
          ),
        ];

      case StoreType.construction:
        return [
          const StoreTimelineStep(
            title: 'Kòmand voye',
            subtitle: 'Depo materyo a resevwa lis atik ou yo',
            icon: Icons.check_circle_rounded,
          ),
          StoreTimelineStep(
            title: 'Depo a ap rasanble materyo yo',
            subtitle: 'Ekip la ap prepare ak kontwole zouti/materyo w yo',
            icon: prepIcon,
          ),
          const StoreTimelineStep(
            title: 'Chajman pare',
            subtitle: 'Transpòtè / livè a prale pran chajman an',
            icon: Icons.local_shipping_rounded,
          ),
          const StoreTimelineStep(
            title: 'Materyo yo sou wout chantye a',
            subtitle: 'Livrezon materyo w yo an rout pou adrès ou',
            icon: Icons.delivery_dining_rounded,
          ),
          const StoreTimelineStep(
            title: 'Materyo byen livre',
            subtitle: 'Kòmand materyo w lan depoze nan adrès ou a',
            icon: Icons.task_alt_rounded,
          ),
        ];

      case StoreType.supermarket:
        return [
          const StoreTimelineStep(
            title: 'Kòmand voye',
            subtitle: 'Sipèmache a resevwa lis kous ou an',
            icon: Icons.check_circle_rounded,
          ),
          StoreTimelineStep(
            title: 'Makèt la ap prepare panyen w lan',
            subtitle: 'Atik ak pwovizyon w yo ap anballe avèk swen',
            icon: prepIcon,
          ),
          const StoreTimelineStep(
            title: 'Panyen pare pou ranmase',
            subtitle: 'Livè a ap vini pran sak pwovizyon w yo',
            icon: Icons.shopping_bag_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livè a sou wout lakay ou',
            subtitle: 'Kous ou yo an wout pou rive lakay ou',
            icon: Icons.two_wheeler_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livre',
            subtitle: 'Pwovizyon w yo rive byen anballe',
            icon: Icons.task_alt_rounded,
          ),
        ];

      case StoreType.bakery:
        return [
          const StoreTimelineStep(
            title: 'Kòmand voye',
            subtitle: 'Boulanje a resevwa kòmand ou an',
            icon: Icons.check_circle_rounded,
          ),
          StoreTimelineStep(
            title: 'Boulanje a ap chwazi e anballe',
            subtitle: 'Pen, gato ak patisri w yo ap prepare tou cho',
            icon: prepIcon,
          ),
          const StoreTimelineStep(
            title: 'Pare pou pran',
            subtitle: 'Livè a rive nan boulanje a',
            icon: Icons.inventory_2_rounded,
          ),
          const StoreTimelineStep(
            title: 'Sou wout',
            subtitle: 'Patisri w yo sou wout pou lakay ou',
            icon: Icons.two_wheeler_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livre',
            subtitle: 'Kòmand boulanje w lan rive lakay ou',
            icon: Icons.task_alt_rounded,
          ),
        ];

      case StoreType.beverageDepot:
        return [
          const StoreTimelineStep(
            title: 'Kòmand voye',
            subtitle: 'Depo a resevwa lòd bwason w lan',
            icon: Icons.check_circle_rounded,
          ),
          StoreTimelineStep(
            title: 'Depo a ap prepare kès ak bwason yo',
            subtitle: 'Bwason w yo ap gwoupe e pake pou transpò',
            icon: prepIcon,
          ),
          const StoreTimelineStep(
            title: 'Pare pou livrezon',
            subtitle: 'Chofè a ap chaje bwason w yo',
            icon: Icons.local_shipping_rounded,
          ),
          const StoreTimelineStep(
            title: 'Bwason yo sou wout',
            subtitle: 'Livè a an deplasman pou livre kòmand lan',
            icon: Icons.delivery_dining_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livre',
            subtitle: 'Tout kès ak bwason w yo byen livre',
            icon: Icons.task_alt_rounded,
          ),
        ];

      case StoreType.restaurant:
      default:
        return [
          const StoreTimelineStep(
            title: 'Kòmand voye',
            subtitle: 'Restoran an resevwa kòmand ou an',
            icon: Icons.check_circle_rounded,
          ),
          StoreTimelineStep(
            title: 'Kizin lan ap prepare manje a',
            subtitle: 'Chèf kizin lan ap kuit manje w la tou cho',
            icon: prepIcon,
          ),
          const StoreTimelineStep(
            title: 'Manje a pare pou livè a',
            subtitle: 'Plat yo anballe byen cho pou livrezon',
            icon: Icons.inventory_2_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livè a sou wout',
            subtitle: 'Livè a ap pote manje w la tou cho rapidman',
            icon: Icons.two_wheeler_rounded,
          ),
          const StoreTimelineStep(
            title: 'Livre! Bon apeti!',
            subtitle: 'Manje w la rive nan adrès ou a',
            icon: Icons.task_alt_rounded,
          ),
        ];
    }
  }

  /// Deskripsyon estati kòmand la pou kat ak lis
  String getStatusDescription(String status) {
    final s = status.toUpperCase();
    switch (s) {
      case 'PENDING':
        return '$storeNoun an ap verifye kòmand lan';
      case 'ACCEPTED':
      case 'PREPARING':
        switch (type) {
          case StoreType.pharmacy:
            return 'Famasi a ap prepare medikaman w yo';
          case StoreType.construction:
            return 'Depo a ap prepare materyo ak zouti w yo';
          case StoreType.supermarket:
            return 'Sipèmache a ap rasanble kous ou yo';
          case StoreType.bakery:
            return 'Boulanje a ap anballe patisri w yo';
          case StoreType.beverageDepot:
            return 'Depo a ap rasanble bwason w yo';
          default:
            return '$storeNoun an ap prepare kòmand ou a';
        }
      case 'READY_FOR_PICKUP':
      case 'READY':
        return 'Pake a pare nan $storeNoun an, livè a ap pran li';
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
        return 'Livè a sou wout pou pote $itemNoun w yo';
      case 'DELIVERED':
        return 'Kòmand lan byen livre!';
      case 'CANCELLED':
        return 'Kòmand sa a te anile';
      default:
        return 'Estati: $status';
    }
  }
}
