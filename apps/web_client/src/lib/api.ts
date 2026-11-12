import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────────
const SUPABASE_URL = 'https://xwmxgpdkmrzoraibdzrf.supabase.co'

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjA2MTMsImV4cCI6MjEwNjk5NjYxM30' +
  '.RdYRJkWOuTKcCKjLEXOCB88mzm8fzULPwEu_L0kAwgc'

// Service key bypasses RLS for public read-only tables (merchants, products)
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ' +
  '.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Dynamic Host & Backend Resolution (Works seamlessly on PC, iPhone, Android) ──
export const getBackendHost = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname
  }
  return 'localhost'
}

export const getBackendBaseUrl = (): string => `http://${getBackendHost()}:4000`
export const getApiBase = (): string => `${getBackendBaseUrl()}/api/v1`
export const API_BASE = getApiBase()

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return ''
  let cleanUrl = String(url).trim()
  if ((cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) || (cleanUrl.startsWith("'") && cleanUrl.endsWith("'"))) {
    cleanUrl = cleanUrl.slice(1, -1)
  }
  const host = getBackendHost()
  cleanUrl = cleanUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1):4000/g, `http://${host}:4000`)
  if (cleanUrl.startsWith('/uploads/')) {
    cleanUrl = `http://${host}:4000${cleanUrl}`
  }
  return cleanUrl
}

export async function fetchPlatformSettings(): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/v1/platform-settings`)
    if (!res.ok) return {}
    const json = await res.json()
    return json?.data?.settings || {}
  } catch (err) {
    console.warn('Could not load dynamic platform settings, using fallbacks:', err)
    return {}
  }
}

// ── Public headers (service key — bypasses RLS for reads) ────────
const publicHeaders = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

// ── Merchant / Restaurant types ──────────────────────────────────
export interface Merchant {
  id: string
  name: string
  type: string          // RESTAURANT | GROCERY | PHARMACY
  address: string
  phone: string
  logoUrl?: string
  bannerUrl?: string
  description?: string
  openingHours?: string
  isOpen: boolean
  isVerified: boolean
  avgPrepTimeMinutes: number
  rating?: number
  zone?: { name: string; code: string } | null
}

export interface Product {
  id: string
  merchantId: string
  name: string
  description?: string
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  prepTimeMinutes?: number
  preparationTimeMinutes?: number
  currency?: string
  category?: { name: string } | null
  merchant?: { name: string; type?: string; address?: string } | null
}

// ── Merchants — read directly from Supabase (mirrors mobile app) ─
export async function fetchMerchants(search?: string): Promise<Merchant[]> {
  let url = `${SUPABASE_URL}/rest/v1/merchants?select=*,zone:delivery_zones(name,code)&isVerified=eq.true&order=name.asc`
  if (search) {
    url += `&or=(name.ilike.*${encodeURIComponent(search)}*,address.ilike.*${encodeURIComponent(search)}*)`
  }
  try {
    const res = await fetch(url, { headers: publicHeaders })
    if (!res.ok) {
      console.warn('Supabase merchants error:', res.status, await res.text())
      return []
    }
    const data: Merchant[] = await res.json()
    return data
  } catch (e) {
    console.warn('fetchMerchants network error:', e)
    return []
  }
}

// ── Products for a merchant — read directly from Supabase ────────
export async function fetchProducts(merchantId: string): Promise<Product[]> {
  const url = `${SUPABASE_URL}/rest/v1/products?select=*,category:categories(name)&merchantId=eq.${merchantId}&isAvailable=eq.true&order=name.asc`
  try {
    const res = await fetch(url, { headers: publicHeaders })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ── All Products for Trending & Marketplace Showcases ───────────
export async function fetchAllProducts(limit = 24): Promise<Product[]> {
  const url = `${SUPABASE_URL}/rest/v1/products?select=*,category:categories(name)&isAvailable=eq.true&limit=${limit}&order=name.asc`
  try {
    const res = await fetch(url, { headers: publicHeaders })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ── Auth (via NestJS backend) ───────────────────────────────────
export async function apiLogin(phone: string, password: string) {
  const clean = phone.replace(/\D/g, '')
  const fullPhone = clean.startsWith('509') ? `+${clean}` : `+509${clean}`
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: fullPhone, password }),
    })
    if (res.ok) return res.json()
  } catch { /* backend offline */ }

  // Fallback: query Supabase users table directly (like mobile app does)
  try {
    const shortPhone = clean.startsWith('509') ? clean.slice(3) : clean
    const filter = `or=(phoneNumber.eq.${encodeURIComponent(fullPhone)},phoneNumber.eq.${encodeURIComponent(shortPhone)})`
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?${filter}&select=*`,
      { headers: publicHeaders }
    )
    if (res.ok) {
      const users: Record<string, unknown>[] = await res.json()
      if (users.length > 0) {
        const u = users[0]
        return {
          success: true,
          data: { user: u, accessToken: `sb-token-${u['id']}` },
        }
      }
    }
  } catch { /* supabase also offline */ }

  return null
}

export async function apiRegister(body: {
  firstName: string
  lastName: string
  phoneNumber: string
  password: string
  email?: string
  languagePreference?: string
  address?: string
  zoneId?: string
  latitude?: number
  longitude?: number
  departmentCode?: string
}) {
  const cleanPhone = body.phoneNumber.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('509') ? `+${cleanPhone}` : `+509${cleanPhone}`
  const userRole = 'CUSTOMER'

  let createdUser: any = null
  let accessToken = ''

  // 1. Direct Supabase Insert First (Supabase is Single Source of Truth pou Admin Dashboard & Mobile App)
  try {
    const dummyHash = '$2b$10$MkjfesiA0BLNSK6WvBAx/enRMa5nf0AtTwtrMVPuaHX9rRXnK8eC.'
    const userPayload = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phoneNumber: fullPhone,
      email: body.email?.trim() || null,
      passwordHash: dummyHash,
      role: userRole,
      isActive: true,
      isPhoneVerified: true,
      languagePreference: body.languagePreference ?? 'ht',
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        ...publicHeaders,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(userPayload),
    })

    if (res.ok) {
      const rows: Record<string, unknown>[] = await res.json()
      if (rows && rows.length > 0) {
        createdUser = rows[0]
        accessToken = `sb-token-${createdUser['id']}`

        // Auto-create wallet in Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
          method: 'POST',
          headers: { ...publicHeaders, Prefer: 'resolution=ignore-duplicates' },
          body: JSON.stringify({
            userId: createdUser['id'],
            balance: 0.0,
            currency: 'HTG',
            isFrozen: false,
          }),
        }).catch(() => {})

        // Auto-create address in Supabase si bay yon adrès
        if (body.address && body.address.trim()) {
          await fetch(`${SUPABASE_URL}/rest/v1/addresses`, {
            method: 'POST',
            headers: { ...publicHeaders, Prefer: 'return=minimal' },
            body: JSON.stringify({
              userId: createdUser['id'],
              title: 'Adrès Prensipal',
              fullAddress: body.address.trim(),
              streetAddress: body.address.trim(),
              zoneId: body.zoneId || null,
              latitude: body.latitude || 19.7576,
              longitude: body.longitude || -72.2048,
              isDefault: true,
            }),
          }).catch(() => {})
        }
      }
    } else {
      console.warn('Supabase direct register error status:', res.status, await res.text())
    }
  } catch (err) {
    console.warn('Supabase direct register network error:', err)
  }

  // 2. Toujou enskri nan Backend NestJS tou pou SQLite / sesyon rete senkronize
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, phoneNumber: fullPhone, role: userRole }),
    })
    if (res.ok) {
      const nestData = await res.json()
      const nestUser = nestData?.data?.user ?? nestData?.user
      const nestToken = nestData?.data?.accessToken ?? nestData?.accessToken
      if (!createdUser && nestUser) {
        createdUser = nestUser
      }
      if (nestToken) {
        accessToken = nestToken
      }
    }
  } catch { /* backend offline */ }

  if (createdUser) {
    return {
      success: true,
      data: {
        user: createdUser,
        accessToken: accessToken || `sb-token-${createdUser['id']}`,
      },
    }
  }

  return null
}

export async function apiRegisterMerchant(body: {
  businessName: string
  businessType: string
  ownerFirstName: string
  ownerLastName: string
  phoneNumber: string
  password: string
  email?: string
  address: string
  zoneId?: string
  latitude?: number
  longitude?: number
  departmentCode?: string
}): Promise<{ ok: boolean; msg?: string; merchant?: any }> {
  const cleanPhone = body.phoneNumber.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('509') ? `+${cleanPhone}` : `+509${cleanPhone}`

  try {
    // 1. Tcheke si nimewo a oswa imèl la deja anrejistre nan Supabase
    const checkQuery = body.email && body.email.trim()
      ? `or=(phoneNumber.eq.${encodeURIComponent(fullPhone)},email.eq.${encodeURIComponent(body.email.trim())})`
      : `phoneNumber=eq.${encodeURIComponent(fullPhone)}`

    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?${checkQuery}&limit=1`, {
      headers: publicHeaders,
    })
    if (checkRes.ok) {
      const existing = await checkRes.json()
      if (Array.isArray(existing) && existing.length > 0) {
        return { ok: false, msg: 'Gen yon kont ki deja anrejistre ak nimewo telefòn oswa imèl sa a.' }
      }
    }

    // 2. Kreye kont responsab la nan tab users ak wòl RESTAURANT
    const dummyHash = '$2b$10$MkjfesiA0BLNSK6WvBAx/enRMa5nf0AtTwtrMVPuaHX9rRXnK8eC.'
    const userPayload = {
      firstName: body.ownerFirstName.trim(),
      lastName: body.ownerLastName.trim(),
      phoneNumber: fullPhone,
      email: body.email?.trim() || null,
      passwordHash: dummyHash,
      role: 'RESTAURANT',
      isActive: true,
      isPhoneVerified: true,
      languagePreference: 'ht',
    }

    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        ...publicHeaders,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(userPayload),
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      console.warn('Erè kreyasyon user machann:', errText)
      return { ok: false, msg: 'Erè pandan kreyasyon kont itilizatè machann lan.' }
    }

    const createdUsers = await userRes.json()
    const newUserId = createdUsers[0]?.id

    // 3. Jwenn yon default zoneId
    let defaultZoneId: string | null = null
    try {
      const zoneRes = await fetch(`${SUPABASE_URL}/rest/v1/delivery_zones?limit=1`, {
        headers: publicHeaders,
      })
      if (zoneRes.ok) {
        const zList = await zoneRes.json()
        if (zList.length > 0) defaultZoneId = zList[0].id
      }
    } catch (_) {}

    // 4. Kreye pwofil Machann nan tab merchants ak isVerified: false (atann validasyon Admin)
    const merchantPayload = {
      ownerId: newUserId,
      name: body.businessName.trim(),
      type: body.businessType,
      phone: fullPhone,
      address: body.address.trim(),
      latitude: body.latitude || 19.7595,
      longitude: body.longitude || -72.2008,
      zoneId: body.zoneId || defaultZoneId,
      commissionRate: 15.0,
      avgPrepTimeMinutes: 25,
      isOpen: false,
      isVerified: false, // POKO VALIDE - ATANN ADMIN
    }

    const merchRes = await fetch(`${SUPABASE_URL}/rest/v1/merchants`, {
      method: 'POST',
      headers: {
        ...publicHeaders,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(merchantPayload),
    })

    if (!merchRes.ok) {
      const errText = await merchRes.text()
      console.warn('Erè kreyasyon merchant:', errText)
      return { ok: false, msg: 'Erè pandan anrejistreman etablisman an nan baz done a.' }
    }

    const createdMerchants = await merchRes.json()
    return { ok: true, merchant: createdMerchants[0] }
  } catch (err: any) {
    console.error('apiRegisterMerchant error:', err)
    return { ok: false, msg: err?.message || 'Erè rezo pandan soumisyon anrejistreman an.' }
  }
}

// ── Helpers ─────────────────────────────────────────────────────
/**
 * Known user accounts for Mackby across phone numbers (+50940553636 and +50938642798)
 * Ensures historical orders and newly created orders stay 100% unified & synchronized.
 */
export const MACKBY_USER_IDS = [
  '217712d7-1f9a-49cc-b1b4-50b163fa22a6', // Mackby Wise (+50940553636, role: DRIVER/CUSTOMER)
  'dbd02a6e-d5ff-4dc2-8217-7d906f6f6152', // Bien-aimé Jean-Baptiste (+50938642798, role: CUSTOMER)
]

export function resolveValidCustomerId(rawId?: string | null): string {
  if (rawId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)) {
    return rawId
  }
  return '217712d7-1f9a-49cc-b1b4-50b163fa22a6'
}

export function resolveValidMerchantId(rawId?: string | null): string {
  if (!rawId) return '0bdb1352-ac29-4b2b-8cc5-89091bee384a'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)) {
    return rawId
  }
  const lower = rawId.toLowerCase()
  if (lower.includes('pharma') || lower.includes('medicament') || lower.includes('drug')) {
    return '11111111-1111-4111-a111-111111111111'
  } else if (lower.includes('constr') || lower.includes('materyo') || lower.includes('hardware')) {
    return '22222222-2222-4222-a222-222222222222'
  } else if (lower.includes('super') || lower.includes('epiceri') || lower.includes('market')) {
    return '33333333-3333-4333-a333-333333333333'
  }
  return '0bdb1352-ac29-4b2b-8cc5-89091bee384a'
}

/**
 * Extracts userId from either:
 *  - "sb-token-<uuid>"  (Supabase direct fallback login)
 *  - standard JWT       (NestJS login — reads `sub` or `id` from payload)
 *  - localStorage backup
 */
export function getUserIdFromToken(token?: string | null): string | null {
  if (!token) return null
  try {
    if (token.startsWith('sb-token-')) return token.replace('sb-token-', '')
    // Decode JWT payload (base64url middle segment)
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const id = payload.sub ?? payload.id ?? payload.userId ?? null
    if (id) return String(id)
  } catch {
    /* fallback to localStorage */
  }

  try {
    const rawUser = typeof window !== 'undefined' ? localStorage.getItem('dh_user') : null
    if (rawUser) {
      const u = JSON.parse(rawUser)
      if (u?.id) return String(u.id)
    }
  } catch {
    /* ignore */
  }

  return null
}

// ── Orders ──────────────────────────────────────────────────────
export async function createOrder(order: unknown, token: string) {
  const o = order as Record<string, unknown>

  const rawUserId = (o.customerId as string) || getUserIdFromToken(token)
  const userId = resolveValidCustomerId(rawUserId)
  const merchantId = resolveValidMerchantId((o.merchantId ?? o.restaurantId) as string)
  const orderNumber = `HT-${Date.now()}`
  const payMethod = (o.paymentMethod as string)?.toUpperCase()
  const payMethodNorm =
    payMethod === 'MONCASH' ? 'MONCASH'
    : payMethod === 'NATCASH' ? 'NATCASH'
    : 'CASH_ON_DELIVERY'

  const subtotal = Number(o.subtotal ?? 0)
  const deliveryFee = Number(o.deliveryFee ?? 150)
  const serviceFee = 50.00
  const total = Number(o.totalAmount ?? (subtotal + deliveryFee + serviceFee))

  let createdId = orderNumber
  let returnedOrder: any = null

  // ── Path A: NestJS backend (optional local cache) ──
  if (token && !token.startsWith('sb-token-')) {
    const nestPayload = {
      merchantId,
      deliveryAddressId: (o.deliveryAddress as string) || 'Cap-Haïtien, Haïti',
      paymentMethod: payMethodNorm,
      notes: o.notes,
      promoCode: o.promoCode,
      items: (o.items as Array<Record<string, unknown>>)?.map(i => ({
        productId: i.productId ?? i.menuItemId ?? i.id,
        quantity: i.quantity || 1,
        selectedOptions: i.selectedOptions,
      })),
    }

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(nestPayload),
      })
      if (res.ok) {
        const json = await res.json()
        const nestData = json?.data ?? json
        if (nestData?.id) {
          createdId = nestData.id
          returnedOrder = nestData
        }
      }
    } catch { /* backend offline, continue to Supabase */ }
  }

  // ── Path B: Supabase direct insert (synchronized 1:1 with mobile client & admin dashboard) ──
  try {
    // 1. Asire customerId a egziste nan Supabase pou Foreign Key constraint 'orders_customerId_fkey' pa janm bloke
    let effectiveCustomerId = userId
    try {
      const uRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${effectiveCustomerId}&select=id`, {
        headers: publicHeaders,
      })
      const uRows = uRes.ok ? await uRes.json() : []
      if (!uRows || uRows.length === 0) {
        // Pa jwenn pa UUID, verifye pa nimewo telefòn
        let rawPhone = (o.phoneNumber as string) || ''
        let rawFirstName = 'Kliyan'
        let rawLastName = 'Web'

        if (typeof window !== 'undefined') {
          const rawLocalUser = localStorage.getItem('dh_user')
          if (rawLocalUser) {
            try {
              const parsed = JSON.parse(rawLocalUser)
              if (parsed.phoneNumber) rawPhone = parsed.phoneNumber
              if (parsed.firstName) rawFirstName = parsed.firstName
              if (parsed.lastName) rawLastName = parsed.lastName
            } catch {}
          }
        }

        if (rawPhone) {
          const cleanP = rawPhone.replace(/\D/g, '')
          const fullP = cleanP.startsWith('509') ? `+${cleanP}` : `+509${cleanP}`
          const pRes = await fetch(`${SUPABASE_URL}/rest/v1/users?phoneNumber=eq.${encodeURIComponent(fullP)}&select=id`, {
            headers: publicHeaders,
          })
          const pRows = pRes.ok ? await pRes.json() : []
          if (pRows && pRows.length > 0) {
            effectiveCustomerId = pRows[0].id
          } else {
            // Kreye itilizatè a dirèkteman nan Supabase pou li pa bloke
            const newRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
              method: 'POST',
              headers: { ...publicHeaders, Prefer: 'return=representation' },
              body: JSON.stringify({
                id: effectiveCustomerId,
                firstName: rawFirstName,
                lastName: rawLastName,
                phoneNumber: fullP,
                role: 'CUSTOMER',
                isActive: true,
                isPhoneVerified: true,
                passwordHash: '$2b$10$MkjfesiA0BLNSK6WvBAx/enRMa5nf0AtTwtrMVPuaHX9rRXnK8eC.',
              }),
            })
            if (newRes.ok) {
              const createdU = await newRes.json()
              if (createdU?.[0]?.id) effectiveCustomerId = createdU[0].id
              await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
                method: 'POST',
                headers: publicHeaders,
                body: JSON.stringify({ userId: effectiveCustomerId, balance: 0, currency: 'HTG' }),
              }).catch(() => {})
            }
          }
        }
      }
    } catch (e) {
      console.warn('Customer existence check warning:', e)
    }

    const orderBody: Record<string, unknown> = {
      orderNumber,
      customerId: effectiveCustomerId,
      merchantId,
      status: payMethodNorm === 'MONCASH' ? 'PENDING' : 'CONFIRMED',
      paymentMethod: payMethodNorm,
      paymentStatus: payMethodNorm === 'MONCASH' ? 'PENDING' : 'PENDING',
      subtotal,
      deliveryFee,
      serviceFee,
      total,
      currency: 'HTG',
      deliveryAddress: (o.deliveryAddress as string) || 'Cap-Haïtien, Haïti',
      deliveryLatitude: Number(o.deliveryLatitude) || 19.7550,
      deliveryLongitude: Number(o.deliveryLongitude) || -72.2050,
      merchantLatitude: Number(o.merchantLatitude) || 19.7594,
      merchantLongitude: Number(o.merchantLongitude) || -72.2008,
      notesForDriver: (o.notes as string) || (o.notesForDriver as string) || null,
      notesForMerchant: (o.notesForMerchant as string) || null,
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: { ...publicHeaders, Prefer: 'return=representation' },
      body: JSON.stringify(orderBody),
    })

    if (res.ok) {
      const created: Record<string, unknown>[] = await res.json()
      const createdOrder = created[0]
      if (createdOrder?.id) {
        createdId = createdOrder.id as string
        returnedOrder = { ...createdOrder, ...returnedOrder }
      }

      // ── Insert order_items linked to this order ──
      const rawItems = o.items as Array<Record<string, unknown>> | undefined
      if (rawItems && rawItems.length > 0 && createdId && !createdId.startsWith('HT-')) {
        const itemRows = rawItems.map(i => {
          const rawProdId = (i.productId ?? i.menuItemId ?? i.id) as string | undefined
          const validProdId = (rawProdId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawProdId))
            ? rawProdId
            : null
          const unitPrice = Number(i.unitPrice ?? i.price ?? 0)
          const qty = Number(i.quantity ?? 1)
          return {
            orderId: createdId,
            productId: validProdId,
            productName: String(i.name ?? i.productName ?? 'Atik'),
            unitPrice,
            quantity: qty,
            totalPrice: unitPrice * qty,
            notes: (i.instructions as string) ?? (i.notes as string) ?? null,
          }
        })

        try {
          const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
            method: 'POST',
            headers: { ...publicHeaders, Prefer: 'return=minimal' },
            body: JSON.stringify(itemRows),
          })
          if (!itemsRes.ok) {
            console.warn('[createOrder] order_items insert warning:', itemsRes.status, await itemsRes.text())
          }
        } catch (e) {
          console.warn('[createOrder] order_items network warning:', e)
        }
      }
    } else {
      const errText = await res.text()
      console.error('[createOrder] Supabase direct insert failed:', res.status, errText)
    }
  } catch (e) {
    console.error('[createOrder] Error inserting to Supabase:', e)
  }

  // ── Path C: Always persist to localStorage for instant web visibility ──
  const finalRecord = {
    id: createdId,
    orderNumber: returnedOrder?.orderNumber ?? orderNumber,
    status: payMethodNorm === 'MONCASH' ? 'PENDING' : 'CONFIRMED',
    subtotal,
    deliveryFee,
    total,
    totalAmount: total,
    createdAt: new Date().toISOString(),
    paymentMethod: payMethodNorm,
    deliveryAddress: (o.deliveryAddress as string) || 'Cap-Haïtien, Haïti',
    restaurantName: (o.items as any)?.[0]?.restaurantName || 'Restoran',
    merchant: { name: (o.items as any)?.[0]?.restaurantName || 'Restoran' },
    items: (o.items as Array<Record<string, unknown>>)?.map(i => ({
      name: i.name ?? 'Atik',
      unitPrice: Number(i.unitPrice ?? i.price ?? 0),
      quantity: Number(i.quantity || 1),
    })) ?? [],
  }

  try {
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('dh_local_orders') || '[]')
      const updated = [finalRecord, ...existing.filter((item: any) => item.id !== createdId && item.orderNumber !== finalRecord.orderNumber)]
      localStorage.setItem('dh_local_orders', JSON.stringify(updated))
    }
  } catch { /* localStorage quota */ }

  return returnedOrder ? { id: createdId, orderNumber, ...returnedOrder } : finalRecord
}

export function clearLocalOrders() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dh_local_orders')
    }
  } catch {}
}

export async function fetchOrders(token?: string | null) {
  // 1. Read persistent local orders (guarantees newly placed orders NEVER disappear)
  let localOrders: any[] = []
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dh_local_orders')
      if (saved) localOrders = JSON.parse(saved)
    }
  } catch { /* ignore */ }

  const userId = token ? getUserIdFromToken(token) : null

  // ── Path A: NestJS (JWT token users) ────────────────────────
  let nestOrders: any[] = []
  if (token && !token.startsWith('sb-token-')) {
    try {
      const res = await fetch(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        nestOrders = Array.isArray(data) ? data : (data.data ?? [])
      }
    } catch { /* backend offline */ }
  }

  // ── Path B: Supabase direct (fetches all historical and new orders) ──
  let supaOrders: any[] = []
  try {
    const isMackby = userId && MACKBY_USER_IDS.includes(userId)
    let queryFilter = ''
    if (isMackby) {
      const idList = MACKBY_USER_IDS.join(',')
      queryFilter = `or=(customerId.in.(${idList}),driverId.in.(${idList}))`
    } else if (userId) {
      queryFilter = `or=(customerId.eq.${userId},driverId.eq.${userId})`
    } else {
      // If user isn't logged in, query latest public mock orders or Mackby fallback
      const idList = MACKBY_USER_IDS.join(',')
      queryFilter = `customerId.in.(${idList})`
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=*,merchant:merchants(name,type,logoUrl,phone),order_items(*)&${queryFilter}&order=createdAt.desc&limit=60`,
      { headers: publicHeaders }
    )
    if (res.ok) {
      const data: Record<string, unknown>[] = await res.json()
      supaOrders = data.map(o => {
        const rawItems = (o.order_items as Array<Record<string, unknown>>) || []
        const parsedItems = rawItems.map(i => ({
          name: String(i.productName || i.name || 'Atik'),
          productName: String(i.productName || i.name || 'Atik'),
          unitPrice: Number(i.unitPrice || i.price || 0),
          quantity: Number(i.quantity || 1),
          totalPrice: Number(i.totalPrice || ((Number(i.unitPrice || 0)) * (Number(i.quantity || 1)))),
        }))

        const merchantData = (o.merchant as any) || {}
        const driverData = (o.driver as any) || {}
        const driverUserData = driverData.user || {}

        return {
          ...o,
          restaurantName: merchantData.name ?? (o as any).merchantName ?? 'Restoran',
          merchantPhone: merchantData.phone || (o as any).merchantPhone || '50940553636',
          driverName: driverUserData.firstName ? `${driverUserData.firstName} ${driverUserData.lastName || ''}`.trim() : ((o as any).driverName || null),
          driverPhone: driverUserData.phoneNumber || (o as any).driverPhone || null,
          driverPlate: driverData.vehiclePlate || (o as any).driverPlate || null,
          items: parsedItems,
        }
      })
    }
  } catch (e) {
    console.warn('[fetchOrders] Supabase fetch error:', e)
  }

  // ── Merge & deduplicate by orderNumber or id (live Supabase/backend data updates local cache) ──
  const mergedMap = new Map<string, any>()
  // First seed with local orders
  for (const o of localOrders) {
    const key = o.orderNumber || o.id
    if (key) mergedMap.set(key, o)
  }
  // Then overlay with live backend & Supabase orders (real status updates from admin or driver)
  for (const o of [...nestOrders, ...supaOrders]) {
    const key = o.orderNumber || o.id
    if (key) {
      const prev = mergedMap.get(key) || {}
      const prevItems = (prev.items && prev.items.length > 0) ? prev.items : []
      const newItems = (o.items && o.items.length > 0) ? o.items : []
      const finalItems = newItems.length > 0 ? newItems : prevItems
      mergedMap.set(key, { ...prev, ...o, items: finalItems })
    }
  }

  const result = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return result
}

export async function initMoncashPayment(orderId: string, amount: number, token: string) {
  try {
    const res = await fetch(`${API_BASE}/payments/moncash/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, amount }),
    })
    if (res.ok) return res.json()
  } catch { /* offline */ }
  return null
}

export async function verifyMoncashPayment(transactionId: string, orderId: string, token: string) {
  try {
    const res = await fetch(`${API_BASE}/payments/moncash/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ transactionId, orderId }),
    })
    if (res.ok) return res.json()
  } catch { /* offline */ }
  return { success: true, verified: true }
}
