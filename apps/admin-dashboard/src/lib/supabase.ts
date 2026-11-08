import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback in case NEXT_PUBLIC_ env vars aren't picked up by Turbopack at runtime
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://xwmxgpdkmrzoraibdzrf.supabase.co';

// Admin dashboard uses service role key to bypass RLS — only safe because this is a server-side admin tool
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Dashboard Stats ─────────────────────────────────────────
export async function getDashboardStats() {
  const [
    { count: totalOrders },
    { count: deliveredOrders },
    { count: pendingOrders },
    { count: totalCustomers },
    { count: activeDrivers },
    { count: totalMerchants },
    revenueRes,
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'DELIVERED'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
    supabase.from('driver_profiles').select('*', { count: 'exact', head: true }).eq('isApproved', true),
    supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('isVerified', true),
    supabase.from('orders').select('subtotal,deliveryFee,serviceFee,total').eq('status', 'DELIVERED'),
  ]);

  const orders = revenueRes.data || [];
  const grossRevenue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const deliveryFees = orders.reduce((s, o) => s + parseFloat(o.deliveryFee || 0), 0);
  const serviceFees = orders.reduce((s, o) => s + parseFloat(o.serviceFee || 0), 0);
  const platformRevenue = serviceFees;
  const merchantPayouts = orders.reduce((s, o) => s + parseFloat(o.subtotal || 0), 0);
  const driverPayouts = deliveryFees;

  const total = totalOrders || 0;
  const delivered = deliveredOrders || 0;

  return {
    orders: {
      total,
      delivered,
      pending: pendingOrders || 0,
      completionRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0',
    },
    users: {
      totalCustomers: totalCustomers || 0,
      activeDrivers: activeDrivers || 0,
      totalMerchants: totalMerchants || 0,
    },
    revenue: {
      grossRevenue,
      platformRevenue,
      merchantPayouts,
      driverPayouts,
      currency: 'HTG',
    },
  };
}

// ─── Orders ──────────────────────────────────────────────────
export async function getOrders(limit = 100, status?: string) {
  try {
    let q = supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customerId_fkey(id, firstName, lastName, phoneNumber),
        merchant:merchants(id, name, phone, address),
        driver:driver_profiles(id, vehicleType, vehiclePlate,
          user:users!driver_profiles_userId_fkey(firstName, lastName, phoneNumber)),
        order_items(*)
      `)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (status && status !== 'ALL') q = q.eq('status', status);

    const { data, error } = await q;
    if (!error && data) return data;
  } catch (err) {
    console.warn('Deep getOrders join warning, trying fallback:', err);
  }

  try {
    let q = supabase
      .from('orders')
      .select(`
        *,
        merchant:merchants(id, name, phone, address),
        order_items(*)
      `)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (status && status !== 'ALL') q = q.eq('status', status);

    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw new Error(error.message);
}

// ─── Dispatch ─────────────────────────────────────────────────
// Retounen kòmand ki PA gen chofè ki asinye yo (pou sant dispatch admin)
export async function getUnassignedOrders(limit = 50) {
  const { data, error } = await supabase
    .from('orders')
    .select(`*,
      merchant:merchants(id, name, address, latitude, longitude, phone),
      customer:users!orders_customerId_fkey(id, firstName, lastName, phoneNumber)`)
    .in('status', ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RESTAURANT_ACCEPTED'])
    .is('driverId', null)
    .order('createdAt', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

// Asinye yon chofè ba yon kòmand (si pa gen okenn chofè deja)
export async function dispatchOrderToDriver(orderId: string, driverId: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      driverId,
      status: 'DRIVER_ASSIGNED',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', orderId)
    .is('driverId', null); // evite double-assign si yon chofè aksepte deja
  if (error) throw new Error(error.message);
}

// ─── Merchants ───────────────────────────────────────────────
export async function getMerchants() {
  const { data, error } = await supabase
    .from('merchants')
    .select(`*, zone:delivery_zones(name, code), owner:users!merchants_ownerId_fkey(firstName, lastName, phoneNumber)`)
    .order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function toggleMerchantStatus(id: string, isVerified: boolean) {
  const { error } = await supabase.from('merchants').update({ isVerified }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Drivers ─────────────────────────────────────────────────
export async function getDrivers() {
  const { data, error } = await supabase
    .from('driver_profiles')
    .select(`*, user:users!driver_profiles_userId_fkey(id, firstName, lastName, phoneNumber, email, wallets(*))`)
    .order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map(d => ({
    driverId: d.id,
    userId: d.userId,
    name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Inconnu',
    phone: d.user?.phoneNumber || '—',
    email: d.user?.email || null,
    vehicleType: d.vehicleType,
    vehiclePlate: d.vehiclePlate,
    status: d.status,
    isApproved: d.isApproved,
    rating: d.rating || 5.0,
    totalDeliveries: d.totalDeliveries || 0,
    currentLatitude: d.currentLatitude,
    currentLongitude: d.currentLongitude,
    lastLocationUpdate: d.lastLocationUpdate,
    createdAt: d.createdAt,
    wallet: Array.isArray(d.user?.wallets) ? d.user.wallets[0] : (d.user?.wallets || null),
  }));
}

export async function updateDriverStatus(id: string, isApproved: boolean) {
  const { error } = await supabase.from('driver_profiles').update({ isApproved }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Finance ─────────────────────────────────────────────────
export async function getFinanceStats() {
  const { data: allOrders } = await supabase
    .from('orders')
    .select('total, subtotal, deliveryFee, serviceFee, paymentMethod, status');

  const all = allOrders || [];
  const totalGross = all.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const totalDeliveryFees = all.reduce((s, o) => s + parseFloat(o.deliveryFee || 0), 0);
  const totalCommissions = all.reduce((s, o) => s + parseFloat(o.serviceFee || 0), 0);

  const byMethod: Record<string, number> = { MONCASH: 0, NATCASH: 0, CASH_ON_DELIVERY: 0 };
  for (const o of all) {
    const m = o.paymentMethod || 'CASH_ON_DELIVERY';
    byMethod[m] = (byMethod[m] || 0) + parseFloat(o.total || 0);
  }

  return {
    revenue: { totalGross, totalDeliveryFees, totalCommissions },
    paymentBreakdown: byMethod,
  };
}

export async function getTransactions(limit = 30) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*, wallet:wallets(userId, currency)')
    .order('createdAt', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

// ─── Zones ───────────────────────────────────────────────────
export async function getZones() {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function toggleZoneStatus(id: string, isActive: boolean) {
  const { error } = await supabase.from('delivery_zones').update({ isActive }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Customers (Clients) ──────────────────────────────────────
export async function getCustomers() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      addresses(*),
      wallets(*),
      orders(id, orderNumber, total, status, createdAt, paymentMethod, paymentStatus)
    `)
    .eq('role', 'CUSTOMER')
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((u) => {
    const orders = u.orders || [];
    const totalSpent = orders.reduce((acc: number, o: any) => acc + (parseFloat(o.total) || 0), 0);
    const deliveredCount = orders.filter((o: any) => o.status === 'DELIVERED').length;
    const lastOrder = orders.length > 0 ? orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;

    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Client sans nom',
      phoneNumber: u.phoneNumber,
      email: u.email,
      role: u.role,
      isActive: u.isActive ?? true,
      isPhoneVerified: u.isPhoneVerified ?? false,
      avatarUrl: u.avatarUrl,
      languagePreference: u.languagePreference || 'ht',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      wallet: u.wallets || { balance: 0, currency: 'HTG', isFrozen: false },
      addresses: u.addresses || [],
      ordersCount: orders.length,
      deliveredOrdersCount: deliveredCount,
      totalSpent,
      lastOrder,
      orders,
    };
  });
}

export async function getCustomerDetails(customerId: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      *,
      addresses(*),
      wallets(*)
    `)
    .eq('id', customerId)
    .single();

  if (userError) throw new Error(userError.message);

  // Orders with merchant and driver info
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      merchant:merchants(id, name, phone, address),
      driver:driver_profiles(id, vehicleType, vehiclePlate, user:users!driver_profiles_userId_fkey(firstName, lastName, phoneNumber)),
      order_items(*)
    `)
    .eq('customerId', customerId)
    .order('createdAt', { ascending: false });

  if (ordersError) throw new Error(ordersError.message);

  // Wallet transactions if wallet exists
  let transactions: any[] = [];
  if (user.wallets?.id) {
    const { data: txData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('walletId', user.wallets.id)
      .order('createdAt', { ascending: false });
    transactions = txData || [];
  }

  const allOrders = orders || [];
  const totalSpent = allOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  return {
    ...user,
    orders: allOrders,
    walletTransactions: transactions,
    totalSpent,
    totalOrders: allOrders.length,
  };
}

export async function toggleCustomerStatus(userId: string, isActive: boolean) {
  const { error } = await supabase
    .from('users')
    .update({ isActive, updatedAt: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function adjustCustomerWallet(userId: string, amount: number, type: 'CREDIT' | 'DEBIT', description: string) {
  // 1. Get or create wallet
  let { data: wallet } = await supabase.from('wallets').select('*').eq('userId', userId).single();

  if (!wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({ userId, balance: 0, currency: 'HTG', isFrozen: false })
      .select()
      .single();
    if (createError) throw new Error(createError.message);
    wallet = newWallet;
  }

  const currentBalance = parseFloat(wallet.balance || 0);
  const newBalance = type === 'CREDIT' ? currentBalance + amount : Math.max(0, currentBalance - amount);

  // 2. Update wallet
  const { error: updateError } = await supabase
    .from('wallets')
    .update({ balance: newBalance, updatedAt: new Date().toISOString() })
    .eq('id', wallet.id);
  if (updateError) throw new Error(updateError.message);

  // 3. Record transaction
  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      walletId: wallet.id,
      amount,
      type,
      source: 'ADMIN_ADJUSTMENT',
      reference: `ADMIN-${Date.now().toString().slice(-6)}`,
      description: description || `Ajisteman balans pa Administrateur (${type})`,
    });

  if (txError) console.warn('Could not record wallet transaction:', txError.message);

  return newBalance;
}

export async function createCustomer(customer: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
}) {
  const dummyHash = '$2b$10$MkjfesiA0BLNSK6WvBAx/enRMa5nf0AtTwtrMVPuaHX9rRXnK8eC.';
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phoneNumber,
      email: customer.email || null,
      passwordHash: dummyHash,
      role: 'CUSTOMER',
      isActive: true,
      isPhoneVerified: true,
      languagePreference: 'ht',
    })
    .select()
    .single();

  if (userError) throw new Error(userError.message);

  // Create initial wallet
  await supabase
    .from('wallets')
    .insert({
      userId: newUser.id,
      balance: 0,
      currency: 'HTG',
      isFrozen: false,
    });

  // If address provided, create initial address
  if (customer.address) {
    await supabase
      .from('addresses')
      .insert({
        userId: newUser.id,
        title: 'Adres Prensipal',
        fullAddress: customer.address,
        latitude: 18.5392,
        longitude: -72.3364,
        isDefault: true,
      });
  }

  return newUser;
}

