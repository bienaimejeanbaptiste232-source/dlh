-- ========================================================
-- SCHEMA DE LA PLATEFORME DE LIVRAISON HAÏTI (DELIVERY HAITI)
-- Optimisé pour Supabase PostgreSQL
-- ========================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ZONES DE LIVRAISON
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    polygon JSONB,
    "baseFee" NUMERIC(10, 2) DEFAULT 150.00,
    "perKmFee" NUMERIC(10, 2) DEFAULT 35.00,
    "riskLevel" VARCHAR(50) DEFAULT 'NORMAL',
    "nightSurcharge" NUMERIC(10, 2) DEFAULT 50.00,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. UTILISATEURS (USERS)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "phoneNumber" VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN DEFAULT TRUE,
    "isPhoneVerified" BOOLEAN DEFAULT FALSE,
    "avatarUrl" TEXT,
    "languagePreference" VARCHAR(10) DEFAULT 'ht',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROFILS CHAUFFEURS (DRIVERS)
CREATE TABLE IF NOT EXISTS driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    "vehicleType" VARCHAR(50) DEFAULT 'MOTO',
    "vehiclePlate" VARCHAR(50),
    "vehicleModel" VARCHAR(100),
    "licenseNumber" VARCHAR(100),
    "licensePhotoUrl" TEXT,
    "idCardPhotoUrl" TEXT,
    "isApproved" BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'OFFLINE',
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP WITH TIME ZONE,
    "cashInHandLimit" NUMERIC(10, 2) DEFAULT 10000.00,
    "currentCashInHand" NUMERIC(10, 2) DEFAULT 0.00,
    "canAcceptCash" BOOLEAN DEFAULT TRUE,
    rating DOUBLE PRECISION DEFAULT 5.0,
    "totalDeliveries" INT DEFAULT 0,
    "assignedZoneId" UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ADRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) DEFAULT 'Kay',
    "fullAddress" TEXT NOT NULL,
    landmark TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    "zoneId" UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    "isDefault" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. COMMERÇANTS / RESTAURANTS (MERCHANTS)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ownerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) DEFAULT 'RESTAURANT',
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    "zoneId" UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    phone VARCHAR(50) NOT NULL,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "commissionRate" DOUBLE PRECISION DEFAULT 15.0,
    "avgPrepTimeMinutes" INT DEFAULT 25,
    "isOpen" BOOLEAN DEFAULT TRUE,
    "isVerified" BOOLEAN DEFAULT TRUE,
    "openingHours" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CATÉGORIES & PRODUITS
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "merchantId" UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    "displayOrder" INT DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "merchantId" UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    "categoryId" UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'HTG',
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN DEFAULT TRUE,
    "prepTimeMinutes" INT DEFAULT 15,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PORTEFEUILLE (WALLETS)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'HTG',
    "isFrozen" BOOLEAN DEFAULT FALSE,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "walletId" UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- CREDIT, DEBIT
    source VARCHAR(50) NOT NULL, -- MONCASH, NATCASH, ORDER_PAYOUT, CASH_SETTLEMENT
    reference VARCHAR(150),
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. COMMANDES (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderNumber" VARCHAR(50) NOT NULL UNIQUE,
    "customerId" UUID NOT NULL REFERENCES users(id),
    "merchantId" UUID NOT NULL REFERENCES merchants(id),
    "driverId" UUID REFERENCES driver_profiles(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    "paymentMethod" VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
    "paymentStatus" VARCHAR(50) DEFAULT 'PENDING',
    subtotal NUMERIC(10, 2) NOT NULL,
    "deliveryFee" NUMERIC(10, 2) NOT NULL,
    "serviceFee" NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'HTG',
    "deliveryAddress" TEXT NOT NULL,
    "deliveryLatitude" DOUBLE PRECISION NOT NULL,
    "deliveryLongitude" DOUBLE PRECISION NOT NULL,
    "merchantLatitude" DOUBLE PRECISION NOT NULL,
    "merchantLongitude" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION DEFAULT 0.0,
    "notesForDriver" TEXT,
    "notesForMerchant" TEXT,
    "estimatedPrepTimeMinutes" INT DEFAULT 20,
    "estimatedDeliveryTimeMinutes" INT DEFAULT 35,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "productId" UUID REFERENCES products(id),
    "productName" VARCHAR(150) NOT NULL,
    "unitPrice" NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    "totalPrice" NUMERIC(10, 2) NOT NULL,
    notes TEXT
);

-- 9. PAIEMENTS (PAYMENTS)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'HTG',
    status VARCHAR(50) DEFAULT 'PENDING',
    "transactionId" VARCHAR(100),
    "moncashOrderId" VARCHAR(100),
    "natcashRef" VARCHAR(100),
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- DONNÉES DE DÉMONSTRATION (HAITI SEED DATA)
-- ========================================================

-- Zones
INSERT INTO delivery_zones (name, code, "baseFee", "perKmFee", "riskLevel")
VALUES 
  ('Pétion-Ville', 'PV-CENTRE', 150.00, 35.00, 'NORMAL'),
  ('Delmas', 'DELMAS-30-75', 180.00, 40.00, 'NORMAL'),
  ('Tabarre', 'TABARRE', 200.00, 45.00, 'ELEVATED')
ON CONFLICT (code) DO NOTHING;

-- Utilisateur démo Admin
INSERT INTO users ("phoneNumber", email, "passwordHash", "firstName", "lastName", role, "isPhoneVerified")
VALUES 
  ('+50937000001', 'admin@deliveryhaiti.ht', '$2b$10$wO87l.Yw9r.3j.oM6Q1oP.qVbE1Y2w5c7z8k9l0m1n2o3p4q5r6s7', 'Jean', 'Admin', 'SUPER_ADMIN', TRUE)
ON CONFLICT ("phoneNumber") DO NOTHING;

-- Utilisateur démo Client
INSERT INTO users ("phoneNumber", email, "passwordHash", "firstName", "lastName", role, "isPhoneVerified")
VALUES 
  ('+50937000002', 'client@deliveryhaiti.ht', '$2b$10$wO87l.Yw9r.3j.oM6Q1oP.qVbE1Y2w5c7z8k9l0m1n2o3p4q5r6s7', 'Nathalie', 'Pierre', 'CUSTOMER', TRUE)
ON CONFLICT ("phoneNumber") DO NOTHING;

-- Utilisateur démo Livreur
INSERT INTO users ("phoneNumber", email, "passwordHash", "firstName", "lastName", role, "isPhoneVerified")
VALUES 
  ('+50937000003', 'driver@deliveryhaiti.ht', '$2b$10$wO87l.Yw9r.3j.oM6Q1oP.qVbE1Y2w5c7z8k9l0m1n2o3p4q5r6s7', 'Fritz', 'Lafortune', 'DRIVER', TRUE)
ON CONFLICT ("phoneNumber") DO NOTHING;

-- Utilisateur démo Resto
INSERT INTO users ("phoneNumber", email, "passwordHash", "firstName", "lastName", role, "isPhoneVerified")
VALUES 
  ('+50937000004', 'resto@deliveryhaiti.ht', '$2b$10$wO87l.Yw9r.3j.oM6Q1oP.qVbE1Y2w5c7z8k9l0m1n2o3p4q5r6s7', 'Chef', 'Dorsainvil', 'RESTAURANT', TRUE)
ON CONFLICT ("phoneNumber") DO NOTHING;
