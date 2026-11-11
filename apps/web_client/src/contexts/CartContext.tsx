import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  emoji?: string
  imageUrl?: string
  restaurantId: string
  restaurantName: string
  restaurantCategory?: string
  quantity: number
  specialInstructions?: string
}

export interface DeliveryBreakdown {
  baseDistanceFee: number
  volumeSurcharge: number
  categorySurcharge: number
  totalDeliveryFee: number
  distanceKm: number
}

export function calculateVolumeSurcharge(totalQty: number): number {
  if (totalQty <= 4) return 0
  if (totalQty <= 10) return 50
  if (totalQty <= 25) return 150
  if (totalQty <= 50) return 350
  if (totalQty <= 100) return 750 // 100 bwat katon / kago moto miltip
  return 750 + (totalQty - 100) * 10
}

export function calculateDeliveryFee({
  baseFee = 150,
  distanceKm = 2.5,
  totalQty = 1,
  category = 'RESTAURANT',
}: {
  baseFee?: number
  distanceKm?: number
  totalQty?: number
  category?: string
}): DeliveryBreakdown {
  const extraKm = Math.max(0, distanceKm - 2.0)
  const longDistKm = Math.max(0, distanceKm - 10.0)
  const baseDistanceFee = Math.round(baseFee + (extraKm * 35) + (longDistKm * 15))
  const volumeSurcharge = calculateVolumeSurcharge(totalQty)
  
  let categorySurcharge = 0
  const cat = (category || '').toUpperCase()
  if (cat === 'SUPERMARKET' || cat === 'GROCERY') categorySurcharge = 30
  else if (cat === 'LOGISTICS' || cat === 'CARGO' || cat === 'HARDWARE') categorySurcharge = 100

  const totalDeliveryFee = baseDistanceFee + volumeSurcharge + categorySurcharge
  return {
    baseDistanceFee,
    volumeSurcharge,
    categorySurcharge,
    totalDeliveryFee,
    distanceKm,
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  subtotal: number
  deliveryBreakdown: DeliveryBreakdown
  deliveryFee: number
  totalAmount: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartCtx = createContext<CartContextType | null>(null)

// Retained for backward-compat export, but now dynamically evaluated
const DELIVERY_FEE: number = 150  // HTG de baz

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setOpen] = useState(false)
  const [switchConflict, setSwitchConflict] = useState<{
    newItem: Omit<CartItem, 'quantity'>
    currentRestaurantName: string
    newRestaurantName: string
  } | null>(null)

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    // Single-Merchant Cart Policy: Enforce 1 store per delivery order
    if (items.length > 0) {
      const currentRestaurantId = items[0].restaurantId
      if (item.restaurantId && currentRestaurantId && item.restaurantId !== currentRestaurantId) {
        setSwitchConflict({
          newItem: item,
          currentRestaurantName: items[0].restaurantName || 'Boutik aktyèl la',
          newRestaurantName: item.restaurantName || 'Nouvo boutik la',
        })
        return
      }
    }

    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? {
          ...i,
          quantity: i.quantity + 1,
          specialInstructions: item.specialInstructions || i.specialInstructions
        } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    setOpen(true)
  }, [items])

  const confirmSwitchStore = useCallback(() => {
    if (switchConflict) {
      setItems([{ ...switchConflict.newItem, quantity: 1 }])
      setSwitchConflict(null)
      setOpen(true)
    }
  }, [switchConflict])

  const cancelSwitchStore = useCallback(() => {
    setSwitchConflict(null)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart  = useCallback(() => setOpen(true), [])
  const closeCart = useCallback(() => setOpen(false), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal   = items.reduce((s, i) => s + i.price * i.quantity, 0)

  // Dynamic delivery fee calculation
  const primaryCategory = items[0]?.restaurantCategory || 'RESTAURANT'
  const deliveryBreakdown = calculateDeliveryFee({
    baseFee: 150,
    distanceKm: 2.5,
    totalQty: totalItems,
    category: primaryCategory,
  })
  const deliveryFee = items.length > 0 ? deliveryBreakdown.totalDeliveryFee : 0
  const totalAmount = subtotal + deliveryFee

  return (
    <CartCtx.Provider value={{
      items, totalItems, subtotal,
      deliveryBreakdown, deliveryFee, totalAmount,
      addItem, removeItem, updateQty, clearCart,
      isOpen, openCart, closeCart,
    }}>
      {children}

      {/* ── Single-Merchant Conflict Confirmation Modal ── */}
      {switchConflict && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, maxWidth: 440, width: '100%',
            padding: '26px 24px', boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
            textAlign: 'center', animation: 'slideUp 0.25s ease'
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(255, 96, 0, 0.12)', color: 'var(--primary, #FF6000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={28} height={28}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Kòmanse yon nouvo panye?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 24px 0' }}>
              Panye w la deja gen atik ki soti nan <strong style={{ color: 'var(--text-primary)' }}>{switchConflict.currentRestaurantName}</strong>. Yon sèl kòmand pa ka fèt nan 2 boutik diferan pou livrezon an fèt rapid e cho. Èske w vle vide panye a pou w kòmanse kòmande nan <strong style={{ color: 'var(--primary, #FF6000)' }}>{switchConflict.newRestaurantName}</strong>?
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={cancelSwitchStore}
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  border: '1px solid var(--border)', background: '#F8FAFC',
                  color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Kite Panye Aktyèl la
              </button>
              <button
                onClick={confirmSwitchStore}
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  border: 'none', background: 'var(--primary, #FF6000)',
                  color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem',
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 96, 0, 0.35)'
                }}
              >
                Wi, Chanje Boutik
              </button>
            </div>
          </div>
        </div>
      )}
    </CartCtx.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export { DELIVERY_FEE }
