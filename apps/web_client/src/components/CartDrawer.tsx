import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCart, DELIVERY_FEE } from '../contexts/CartContext'

const formatHTG = (n: number) => `${n.toLocaleString('fr-HT')} Gdes`

// Icons
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="18" height="18">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width="15" height="15">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconShoppingCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width="64" height="64">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="13" height="13">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="13" height="13">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width="14" height="14">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
    <rect x="9" y="11" width="14" height="10" rx="2"/>
    <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
  </svg>
)
const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width="14" height="14">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)

// Emoji fallback by food name keywords
function getItemEmoji(_name: string): string { return ""; }

export default function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotal, clearCart, deliveryBreakdown, deliveryFee, totalAmount } = useCart()
  const itemCount  = items.reduce((s, i) => s + i.quantity, 0)
  const drawerRef  = useRef<HTMLDivElement>(null)

  // Focus trap / scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      drawerRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeCart])

  if (!isOpen) return null

  // Group by restaurant
  const byRestaurant = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.restaurantId ?? 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  const restaurantCount = Object.keys(byRestaurant).length

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="cart-overlay" onClick={closeCart} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="cart-drawer"
        role="dialog"
        aria-label="Panye achè"
        aria-modal="true"
        tabIndex={-1}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="cart-header">
          <div>
            <div className="cart-title">Panye Ou</div>
            {itemCount > 0 && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                {itemCount} atikèl • {items[0]?.restaurantName ?? 'Boutik'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                title="Vide panye"
                style={{
                  border: 'none', background: 'transparent', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: '6px 10px',
                  borderRadius: 'var(--r-sm)',
                }}>
                Vide
              </button>
            )}
            <button id="cart-close" className="cart-close-btn" onClick={closeCart} aria-label="Fèmen panye">
              <IconX />
            </button>
          </div>
        </div>

        {/* ── Empty state ─────────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="cart-empty">
            <div style={{ color: 'var(--border)' }}><IconShoppingCart /></div>
            <div className="cart-empty-title">Panye ou vid</div>
            <p className="cart-empty-text">Ajoute manje pou kòmanse kòmande!</p>
            <button
              className="btn-submit"
              style={{ width: 'auto', padding: '0 24px', fontSize: '0.875rem', height: 42 }}
              onClick={closeCart}>
              Eksplore Boutik Yo
            </button>
          </div>
        ) : (
          /* ── Items ─────────────────────────────────────────────── */
          <div className="cart-items">
            {/* Multi-restaurant warning */}
            {restaurantCount > 1 && (
              <div style={{
                background: '#FFF7ED', border: '1px solid #FCD34D',
                borderRadius: 'var(--r-md)', padding: '10px 14px',
                fontSize: '0.8125rem', fontWeight: 600, color: '#92400E',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                Atansyon: Ou gen atikèl depi {restaurantCount} boutik diferan. Sèlman yon boutik pou chak kòmand.
              </div>
            )}

            {items.map(item => {
              const emoji = item.emoji ?? getItemEmoji(item.name)
              return (
                <div key={item.id} className="cart-item">
                  {/* Image / emoji */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', objectFit: 'cover', flexShrink: 0 }}
                      onError={e => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="cart-item-emoji" style={{ background: '#FFF3EB', color: '#FF6000', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '8px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    </div>
                  )}

                  {/* Info */}
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{formatHTG(item.price)}</div>
                    {item.specialInstructions && (
                      <div style={{ fontSize: '0.6875rem', color: '#D9480F', fontStyle: 'italic', marginTop: 2, background: 'rgba(255, 96, 0, 0.08)', padding: '2px 6px', borderRadius: 4 }}>
                        Nòt: {item.specialInstructions}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>
                      {item.restaurantName}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="cart-item-controls">
                    <button
                      className="cart-item-remove"
                      onClick={() => removeItem(item.id)}
                      title="Retire atikèl">
                      <IconTrash />
                    </button>
                    <div className="qty-control">
                      <button
                        className="qty-btn minus"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        aria-label="Retire youn">
                        <IconMinus />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        aria-label="Ajoute youn">
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Promo code input (decorative — future feature) */}
            <div style={{
              background: 'var(--bg)', borderRadius: 'var(--r-lg)', padding: '12px 14px',
              border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', opacity: 0.75,
            }}>
              <IconTag />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Ajoute kòd promo (HAITI2026)
              </span>
            </div>
          </div>
        )}

        {/* ── Footer / Totals ─────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="cart-footer">
            {/* Delivery info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0 12px',
              fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600,
              borderTop: '1px solid var(--border)',
            }}>
              <IconTruck />
              <span>Livrezon estime: <b style={{ color: 'var(--text-primary)' }}>30–45 min</b></span>
            </div>

            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Sou-total ({itemCount} atikèl)</span>
                <span>{formatHTG(subtotal)}</span>
              </div>
              <div className="cart-total-row">
                <span>Frè baz livrezon (~{deliveryBreakdown.distanceKm} km)</span>
                <span>{formatHTG(deliveryBreakdown.baseDistanceFee)}</span>
              </div>
              {deliveryBreakdown.volumeSurcharge > 0 && (
                <div className="cart-total-row" style={{ color: '#FF6000', fontWeight: 600 }}>
                  <span>Sipleman volim ({itemCount} bwat/atik)</span>
                  <span>+{formatHTG(deliveryBreakdown.volumeSurcharge)}</span>
                </div>
              )}
              {deliveryBreakdown.categorySurcharge > 0 && (
                <div className="cart-total-row" style={{ color: '#FF6000', fontWeight: 600 }}>
                  <span>Sipleman machandiz lou</span>
                  <span>+{formatHTG(deliveryBreakdown.categorySurcharge)}</span>
                </div>
              )}
              <div className="cart-total-row">
                <span>Total Frè Livrezon</span>
                <span style={{ fontWeight: 700 }}>{formatHTG(deliveryFee)}</span>
              </div>
              <div className="cart-total-row grand">
                <span>Total</span>
                <span className="amount">{formatHTG(totalAmount)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              id="cart-checkout-btn"
              className="btn-submit"
              onClick={() => { closeCart(); onCheckout() }}>
              <IconTruck />
              Pase Komand — {formatHTG(totalAmount)}
            </button>

            {/* Trust badges */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 10,
              fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
            }}>
              <span>Sèvis Sekirize</span><span>&bull;</span><span>MonCash & Natcash</span><span>&bull;</span><span>Cash sou Livrezon</span>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
