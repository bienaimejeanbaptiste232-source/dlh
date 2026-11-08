import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();
import {
  User,
  UserRole,
  DriverProfile,
  VehicleType,
  DriverStatus,
  DeliveryZone,
  Merchant,
  Category,
  Product,
  Address,
  Wallet,
  WalletTransaction,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Payment,
  Review,
  AdminAuditLog,
} from './entities';
import { entities } from '../config/database.config';

async function seed() {
  console.log('🌱 Démarrage du Seeding de la plateforme de livraison Haïti...');

  // Création du répertoire data si nécessaire
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const databaseUrl = process.env.DATABASE_URL;
  const dbType = (process.env.DB_TYPE || (databaseUrl ? 'postgres' : 'sqlite')) as any;
  const isSupabaseOrRemote = databaseUrl?.includes('supabase') || process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

  const dataSource = databaseUrl
    ? new DataSource({
        type: 'postgres',
        url: databaseUrl,
        entities,
        synchronize: true,
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
      })
    : new DataSource({
        type: dbType,
        database: dbType === 'postgres' ? (process.env.DB_NAME || 'delivery_haiti') : path.join(dataDir, 'dev.sqlite'),
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres123',
        entities,
        synchronize: true,
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
      });

  await dataSource.initialize();
  console.log('✅ Connexion base de données initialisée.');

  const userRepo = dataSource.getRepository(User);
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log(`ℹ️ La base de données contient déjà ${existingUsers} utilisateurs. Seeding terminé avec succès !`);
    await dataSource.destroy();
    return;
  }
  const driverRepo = dataSource.getRepository(DriverProfile);
  const zoneRepo = dataSource.getRepository(DeliveryZone);
  const merchantRepo = dataSource.getRepository(Merchant);
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const addressRepo = dataSource.getRepository(Address);
  const walletRepo = dataSource.getRepository(Wallet);
  const orderRepo = dataSource.getRepository(Order);
  const orderItemRepo = dataSource.getRepository(OrderItem);
  const paymentRepo = dataSource.getRepository(Payment);

  // 1. Zones de livraison en Haïti
  console.log('📍 Création des zones opérationnelles en Haïti...');
  const zonePV = await zoneRepo.save({
    name: 'Pétion-Ville & Environs',
    baseDeliveryFee: 150.0,
    perKmFee: 35.0,
    surgeMultiplier: 1.0,
    polygonCoordinates: JSON.stringify([
      { lat: 18.525, lng: -72.305 },
      { lat: 18.515, lng: -72.275 },
      { lat: 18.495, lng: -72.285 },
      { lat: 18.505, lng: -72.315 },
    ]),
  });

  const zoneDelmas = await zoneRepo.save({
    name: 'Delmas (33 à 75)',
    baseDeliveryFee: 140.0,
    perKmFee: 30.0,
    surgeMultiplier: 1.0,
    polygonCoordinates: JSON.stringify([
      { lat: 18.56, lng: -72.32 },
      { lat: 18.54, lng: -72.29 },
    ]),
  });

  // 2. Mots de passe hashés
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 3. Utilisateurs
  console.log('👤 Création des comptes utilisateurs de test...');
  const adminUser = await userRepo.save({
    phoneNumber: '+50937000001',
    email: 'admin@deliveryhaiti.ht',
    passwordHash: defaultPasswordHash,
    firstName: 'Jean-Marc',
    lastName: 'Célestin',
    role: UserRole.SUPER_ADMIN,
    isPhoneVerified: true,
    languagePreference: 'fr',
  });

  const financeUser = await userRepo.save({
    phoneNumber: '+50937000002',
    email: 'finance@deliveryhaiti.ht',
    passwordHash: defaultPasswordHash,
    firstName: 'Marie-Yolène',
    lastName: 'Beauvais',
    role: UserRole.FINANCE,
    isPhoneVerified: true,
    languagePreference: 'fr',
  });

  const merchantOwner1 = await userRepo.save({
    phoneNumber: '+50937000003',
    email: 'contact@kayfritay.ht',
    passwordHash: defaultPasswordHash,
    firstName: 'Jacques',
    lastName: 'Pierre',
    role: UserRole.RESTAURANT,
    isPhoneVerified: true,
    languagePreference: 'ht',
  });

  const driverUser1 = await userRepo.save({
    phoneNumber: '+50937000005',
    email: 'jean.livreur@gmail.com',
    passwordHash: defaultPasswordHash,
    firstName: 'Jean-Baptiste',
    lastName: 'Duval',
    role: UserRole.DRIVER,
    isPhoneVerified: true,
    languagePreference: 'ht',
  });

  const driverUser2 = await userRepo.save({
    phoneNumber: '+50937000006',
    email: 'pierre.livreur@gmail.com',
    passwordHash: defaultPasswordHash,
    firstName: 'Stevenson',
    lastName: 'François',
    role: UserRole.DRIVER,
    isPhoneVerified: true,
    languagePreference: 'fr',
  });

  const customerUser = await userRepo.save({
    phoneNumber: '+50937000007',
    email: 'client.wilson@gmail.com',
    passwordHash: defaultPasswordHash,
    firstName: 'Wilson',
    lastName: 'Dorilas',
    role: UserRole.CUSTOMER,
    isPhoneVerified: true,
    languagePreference: 'ht',
  });

  // 4. Profils Livreurs (Motos)
  console.log('🏍️ Configuration des profils des livreurs motos...');
  await driverRepo.save({
    id: driverUser1.id,
    vehicleType: VehicleType.MOTORCYCLE,
    licensePlate: 'MC-45892',
    identityCardNumber: '004-892-198-4',
    isVerified: true,
    status: DriverStatus.ONLINE,
    ratingAvg: 4.95,
    totalRatings: 142,
    currentLatitude: 18.5135,
    currentLongitude: -72.2842,
    lastLocationUpdate: new Date(),
    maxActiveOrders: 3,
    walletBalance: 2450.0,
  });

  await driverRepo.save({
    id: driverUser2.id,
    vehicleType: VehicleType.MOTORCYCLE,
    licensePlate: 'MC-78103',
    identityCardNumber: '006-731-902-1',
    isVerified: true,
    status: DriverStatus.ONLINE,
    ratingAvg: 4.88,
    totalRatings: 98,
    currentLatitude: 18.518,
    currentLongitude: -72.289,
    lastLocationUpdate: new Date(),
    maxActiveOrders: 3,
    walletBalance: 1200.0,
  });

  // 5. Portefeuilles (Wallets)
  console.log('💰 Création des Wallets virtuels...');
  await walletRepo.save([
    { userId: merchantOwner1.id, balance: 18450.0 },
    { userId: driverUser1.id, balance: 2450.0 },
    { userId: driverUser2.id, balance: 1200.0 },
    { userId: customerUser.id, balance: 500.0 },
  ]);

  // 6. Marchands (Restaurants haïtiens)
  console.log('🍽️ Ajout des restaurants partenaires...');
  const restoKayFritay = await merchantRepo.save({
    ownerId: merchantOwner1.id,
    name: 'Kay Fritay Lakay',
    type: 'RESTAURANT',
    address: '24 Rue Rebecca, Pétion-Ville',
    latitude: 18.512,
    longitude: -72.286,
    zoneId: zonePV.id,
    phone: '+50937000003',
    commissionRate: 15.0,
    avgPrepTimeMinutes: 20,
    isOpen: true,
    isVerified: true,
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
  });

  // 7. Catégories & Produits authentiques
  console.log('🍗 Ajout des menus et spécialités haïtiennes...');
  const catSpecialites = await categoryRepo.save({
    merchantId: restoKayFritay.id,
    name: 'Spécialités Haïtiennes',
    sortOrder: 1,
  });

  const catBoissons = await categoryRepo.save({
    merchantId: restoKayFritay.id,
    name: 'Bwason Frèch (Jus Naturels)',
    sortOrder: 2,
  });

  const prodGriot = await productRepo.save({
    merchantId: restoKayFritay.id,
    categoryId: catSpecialites.id,
    name: 'Griot ak Bannann Peze & Pikliz',
    description: 'Morceaux de porc mariné et frit croustillant, servi avec bananes pesées croustillantes et pikliz fait maison.',
    price: 650.0,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 20,
    options: JSON.stringify([
      { name: 'Sauce Ti-Malis', price: 0 },
      { name: 'Extra Pikliz Piquant', price: 50 },
    ]),
  });

  const prodTassot = await productRepo.save({
    merchantId: restoKayFritay.id,
    categoryId: catSpecialites.id,
    name: 'Tassot Cabrit ak Diri Djon Djon',
    description: 'Viande de cabri tendre et épicée, accompagnée de riz djon djon aux pois et bananes pesées.',
    price: 950.0,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 25,
  });

  const prodJus = await productRepo.save({
    merchantId: restoKayFritay.id,
    categoryId: catBoissons.id,
    name: 'Jus Grenadia ak Kowosòl Frais',
    description: 'Mélange onctueux et rafraîchissant de fruits de la passion et corossol naturel pressé.',
    price: 200.0,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
  });

  // 8. Adresse Client avec repères haïtiens
  console.log('🏠 Création de l’adresse de livraison avec repères...');
  const clientAddr = await addressRepo.save({
    userId: customerUser.id,
    title: 'Résidence Belvil',
    streetAddress: 'Belvil, Impasse des Lauriers, Maison #14',
    landmarkDirections: 'Maison avec barrière blanche en fer forgé, juste en face du petit supermarché.',
    latitude: 18.528,
    longitude: -72.274,
    zoneId: zonePV.id,
  });

  // 9. Commande d'exemple en cours de transit
  console.log('📦 Génération d’une commande d’exemple en temps réel...');
  const orderSubtotal = 850.0; // Griot (650) + Jus (200)
  const orderDeliveryFee = 185.0; // 150 base + 1 km sup
  const orderServiceFee = 68.0; // 8%
  const orderTotal = orderSubtotal + orderDeliveryFee + orderServiceFee; // 1103 HTG
  const merchantPart = orderSubtotal * 0.85; // 722.50 HTG
  const driverPart = 150.0;
  const platformComm = orderTotal - merchantPart - driverPart;

  const sampleOrder = await orderRepo.save({
    orderNumber: 'HT-2026-000101',
    customerId: customerUser.id,
    merchantId: restoKayFritay.id,
    driverId: driverUser1.id,
    deliveryAddressId: clientAddr.id,
    status: OrderStatus.IN_TRANSIT,
    subtotalAmount: orderSubtotal,
    deliveryFee: orderDeliveryFee,
    serviceFee: orderServiceFee,
    totalAmount: orderTotal,
    merchantEarnings: merchantPart,
    driverEarnings: driverPart,
    platformCommission: platformComm,
    currency: 'HTG',
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    notes: 'Tanpri rele mwen lè ou rive nan baryè a.',
  });

  await orderItemRepo.save([
    {
      orderId: sampleOrder.id,
      productId: prodGriot.id,
      productName: prodGriot.name,
      unitPrice: 650.0,
      quantity: 1,
      totalItemPrice: 650.0,
    },
    {
      orderId: sampleOrder.id,
      productId: prodJus.id,
      productName: prodJus.name,
      unitPrice: 200.0,
      quantity: 1,
      totalItemPrice: 200.0,
    },
  ]);

  await paymentRepo.save({
    orderId: sampleOrder.id,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    amount: orderTotal,
    currency: 'HTG',
    status: PaymentStatus.PENDING,
  });

  console.log('✨ SEEDING TERMINÉ AVEC SUCCÈS !');
  console.log('----------------------------------------------------');
  console.log('Données d’accès pour les tests :');
  console.log('Admin:       +50937000001 / Password123!');
  console.log('Finance:     +50937000002 / Password123!');
  console.log('Restaurant:  +50937000003 / Password123!');
  console.log('Livreur 1:   +50937000005 / Password123!');
  console.log('Client:      +50937000007 / Password123!');
  console.log('----------------------------------------------------');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seeding:', err);
  process.exit(1);
});
