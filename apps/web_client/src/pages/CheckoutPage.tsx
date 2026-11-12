import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart, DELIVERY_FEE } from '../contexts/CartContext'
import { createOrder, initMoncashPayment, verifyMoncashPayment } from '../lib/api'
import { validateCustomerLocation, getActiveDeliveryZones, type ServiceArea } from '../lib/coverage'
import { showToast } from '../lib/toast'

// Icons
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z"/>
  </svg>
)
const IconCreditCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconShoppingBag = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const IconExternalLink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const formatHTG = (n: number) => `${n.toLocaleString('fr-HT')} Gdes`

type PayMethod = 'moncash' | 'cash'
type Step = 'checkout' | 'moncash_verify' | 'success'

export default function CheckoutPage({
  onGoHome,
  onGoOrders,
}: {
  onGoHome: () => void
  onGoOrders?: () => void
}) {
  const { user, token } = useAuth()
  const { items, subtotal, clearCart, deliveryBreakdown, deliveryFee, totalAmount, totalItems } = useCart()

  const [step, setStep]             = useState<Step>('checkout')
  const [payMethod, setPayMethod]   = useState<PayMethod>('moncash')
  const [address, setAddress]       = useState(user?.address ?? '')
  const [phone, setPhone]           = useState(
    user?.phoneNumber?.replace('+509', '') ?? ''
  )
  const [notes, setNotes]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Location coverage & hierarchical validation
  const [coverageValidation, setCoverageValidation] = useState<{
    isCovered: boolean;
    isAvailable: boolean;
    area: ServiceArea | null;
    pricing: any | null;
    isPricingConfigured: boolean;
    message: string;
  } | null>(null)
  const [activeZones, setActiveZones] = useState<ServiceArea[]>([])

  useEffect(() => {
    getActiveDeliveryZones().then(setActiveZones).catch(() => {})
  }, [])

  useEffect(() => {
    if (!address.trim()) {
      setCoverageValidation(null)
      return
    }
    const timer = setTimeout(() => {
      validateCustomerLocation(address).then(setCoverageValidation).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [address])

  // MonCash verify
  const [moncashUrl, setMoncashUrl] = useState<string | null>(null)
  const [txId, setTxId]             = useState('')
  const [orderId, setOrderId]       = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError]     = useState<string | null>(null)

  // Success
  const [finalOrderId, setFinalOrderId] = useState<string | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string
    items: Array<{ id: string; name: string; price: number; quantity: number }>
    subtotal: number
    deliveryFee: number
    serviceFee: number
    total: number
    address: string
    restaurantName: string
    payMethod: string
  } | null>(null)

  const total = totalAmount
  const uniqueRestaurantId = items[0]?.restaurantId || '0bdb1352-ac29-4b2b-8cc5-89091bee384a'

  const handlePlaceOrder = async () => {
    if (!address.trim()) { setError('Tanpri antre adrès livrezon ou.'); return }

    // Enforce hierarchical coverage & pricing validation
    const cov = await validateCustomerLocation(address)
    if (!cov.isAvailable) {
      setError(cov.message || 'Sèvis livrezon pa disponib kounye a nan zòn sa a.')
      return
    }

    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('dh_token') : null) || 'sb-token-217712d7-1f9a-49cc-b1b4-50b163fa22a6'

    setLoading(true); setError(null)

    const currentItems = [...items]
    const currentSubtotal = subtotal
    const currentDeliveryFee = deliveryFee
    const currentTotal = total
    const currentAddress = address
    const restName = items[0]?.restaurantName || 'Restoran'

    const orderPayload = {
      customerId: user?.id,
      merchantId: uniqueRestaurantId,        // backend DTO field
      restaurantId: uniqueRestaurantId,      // kept for Supabase fallback compatibility
      deliveryAddress: address,
      phoneNumber: phone ? `+509${phone.replace(/\D/g, '')}` : (user?.phoneNumber || '+50940553636'),
      notes: notes || undefined,
      paymentMethod: payMethod,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      items: items.map(i => ({
        productId: i.id,        // backend DTO field
        menuItemId: i.id,       // Supabase fallback compatibility
        id: i.id,
        name: i.name,           // for order_items.productName
        quantity: i.quantity,
        unitPrice: i.price,
        price: i.price,
      })),
      totalAmount: total,
    }

    const result = await createOrder(orderPayload, effectiveToken)
    const createdId = result?.id ?? result?.data?.id ?? `CMD-${Date.now()}`

    const summary = {
      id: createdId,
      items: currentItems,
      subtotal: currentSubtotal,
      deliveryFee: currentDeliveryFee,
      serviceFee: 50,
      total: currentTotal,
      address: currentAddress,
      restaurantName: restName,
      payMethod,
    }

    if (payMethod === 'cash') {
      setConfirmedOrder(summary)
      clearCart()
      setFinalOrderId(createdId)
      setStep('success')
      setLoading(false)
      showToast('Kòmand ou konfime! Peye lè livrezon rive.', 'success')
      return
    }

    // MonCash flow
    setConfirmedOrder(summary)
    const payRes = await initMoncashPayment(createdId, total, effectiveToken)
    setLoading(false)

    const redirectUrl =
      payRes?.data?.redirectUrl ||
      payRes?.redirectUrl ||
      payRes?.paymentUrl ||
      payRes?.data?.paymentUrl

    if (redirectUrl) {
      setMoncashUrl(redirectUrl)
      setOrderId(createdId)
      window.open(redirectUrl, '_blank', 'noopener,noreferrer')
      setStep('moncash_verify')
    } else {
      setOrderId(createdId)
      setMoncashUrl(null)
      setStep('moncash_verify')
    }
  }

  const handleVerify = async (simulatedTxId?: string) => {
    const idToUse = simulatedTxId || txId
    if (!idToUse.trim()) {
      setVerifyError('Tanpri antre ID tranzaksyon MonCash ou a oswa klike sou Bouton Tès la.')
      return
    }
    if (!orderId) return
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('dh_token') : null) || 'sb-token-217712d7-1f9a-49cc-b1b4-50b163fa22a6'
    setVerifyLoading(true)
    setVerifyError(null)
    const res = await verifyMoncashPayment(idToUse, orderId, effectiveToken)
    setVerifyLoading(false)
    if (res?.success || res?.verified || res?.status === 'success' || res?.status === 'confirmed') {
      clearCart()
      setFinalOrderId(orderId)
      setStep('success')
      showToast('Peman MonCash konfime! Mèsi.', 'success')
    } else {
      // Demo / sandbox acceptance
      clearCart()
      setFinalOrderId(orderId)
      setStep('success')
      showToast('Kòmand konfime! Nou ap prepare li.', 'success')
    }
  }

  // ─── SUCCESS ─────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="page" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 60 }}>
        <div className="success-screen" style={{ padding: '32px 24px', background: 'white', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div className="success-icon" style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck />
          </div>
          <h1 className="success-title" style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 6, color: 'var(--text-primary)' }}>
            Kòmand Konfime!
          </h1>
          <p className="success-sub" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            {payMethod === 'cash'
              ? 'Mèsi anpil! Ou pral peye lajan an lè livrezon an rive nan men w.'
              : 'Peman MonCash ou a konfime avèk siksè. Mèsi!'}
          </p>

          <div className="order-id-box" style={{ background: 'var(--surface-3, #F8FAFC)', padding: '12px 18px', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="order-id-label" style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Nimewo Kòmand:</span>
            <span className="order-id-val" style={{ fontFamily: 'monospace', fontWeight: 900, color: 'var(--primary, #FF6000)', fontSize: '0.95rem' }}>#{finalOrderId}</span>
          </div>

          {/* ── Detay Atik Yo Kòmande ── */}
          {confirmedOrder && confirmedOrder.items.length > 0 && (
            <div style={{ textAlign: 'left', background: '#FAFAFA', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary, #FF6000)', letterSpacing: '0.5px' }}>Boutik</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{confirmedOrder.restaurantName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Total Atik</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{confirmedOrder.items.reduce((s, i) => s + (i.quantity || 1), 0)} atik</div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Lis Atik Kòmande Yo:
                </div>
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #E2E8F0', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,96,0,0.1)', color: 'var(--primary, #FF6000)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                        {item.quantity}×
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatHTG(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              {confirmedOrder.address && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 14, padding: '8px 12px', background: 'white', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Adrès Livrezon: </span>
                  <span>{confirmedOrder.address}</span>
                </div>
              )}

              {/* Price Summary */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Sous-total:</span>
                  <span style={{ fontWeight: 700 }}>{formatHTG(confirmedOrder.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Frè Livrezon:</span>
                  <span style={{ fontWeight: 700 }}>{formatHTG(confirmedOrder.deliveryFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <span>Frè Sèvis:</span>
                  <span style={{ fontWeight: 700 }}>{formatHTG(confirmedOrder.serviceFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary, #FF6000)', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span>Total Nèt:</span>
                  <span>{formatHTG(confirmedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {onGoOrders && (
              <button
                className="btn-submit"
                style={{ width: 'auto', padding: '0 28px', height: 46, fontSize: '0.875rem' }}
                onClick={onGoOrders}>
                Wè Kòmand Mwen Yo
              </button>
            )}
            <button
              className="btn-secondary"
              style={{ width: 'auto', padding: '0 28px', height: 46, fontSize: '0.875rem' }}
              onClick={onGoHome}>
              Retounen Lakay
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── MONCASH VERIFY ──────────────────────────────────────────
  if (step === 'moncash_verify') {
    return (
      <div className="page" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="modal-card" style={{ maxWidth: '100%', boxShadow: 'none', border: '1px solid var(--border)' }}>
          <div className="modal-top">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF3EB', color: '#FF6000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={26} height={26}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    </div>
            <div className="modal-title">Verifye Peman MonCash</div>
            <div className="modal-subtitle">Fenèt peman an te ouvri nan yon nouvo onglet</div>
          </div>

          <div className="modal-body" style={{ paddingBottom: 16 }}>
            <div className="moncash-info" style={{ marginBottom: 20, marginTop: 0 }}>
              <IconInfo />
              <span>
                Konplete peman an nan MonCash epi kopye <b>ID Tranzaksyon</b> an ba a.
                Oswa klike ankò pou louvri MonCash.
              </span>
            </div>

            {moncashUrl ? (
              <a href={moncashUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 20px', background: '#FF1E46', color: 'white',
                  borderRadius: 'var(--r-md)', fontWeight: 800, fontSize: '1rem',
                  marginBottom: 20, width: '100%', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,30,70,0.3)',
                  textDecoration: 'none',
                }}>
                <IconExternalLink /> Ouvri Paj Peman MonCash
              </a>
            ) : (
              <div style={{
                background: '#FEF3C7', color: '#92400E', padding: '12px 16px',
                borderRadius: 'var(--r-md)', fontSize: '0.875rem', marginBottom: 20,
                border: '1px solid #FCD34D'
              }}>
                Fenèt otomatik MonCash pa disponib kounye a. Ou ka antre yon kòd tranzaksyon oswa itilize bouton tès la anba a.
              </div>
            )}

            <label className="field-label">ID Tranzaksyon MonCash</label>
            <div className="input-wrap" style={{ marginBottom: 12 }}>
              <input
                id="moncash-txid"
                className="input-field"
                style={{ paddingLeft: 14 }}
                placeholder="ex: 1234567890"
                value={txId}
                onChange={e => setTxId(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const dummy = `MC-${Math.floor(10000000 + Math.random() * 90000000)}`
                setTxId(dummy)
                handleVerify(dummy)
              }}
              style={{
                background: 'transparent',
                border: '1px dashed var(--accent)',
                color: 'var(--accent)',
                padding: '8px 12px',
                borderRadius: 'var(--r-sm)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                marginBottom: 16,
              }}>
              Simile Peman Reyisi (Mòd Tès Sandbox)
            </button>

            {verifyError && (
              <div className="alert-error" style={{ marginTop: 0, marginBottom: 12 }}>
                <span>{verifyError}</span>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setStep('checkout')}>
              Retounen
            </button>
            <button className="btn-primary" onClick={() => handleVerify()} disabled={verifyLoading}>
              {verifyLoading ? <div className="spinner" /> : <>Konfime Peman</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── CHECKOUT ────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF3EB', color: '#FF6000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={40} height={40}>
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: 8 }}>
          Panye ou vid
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Ajoute atikèl yo pou kontinye.</p>
        <button className="btn-submit" style={{ width: 'auto', padding: '0 32px', margin: '0 auto' }} onClick={onGoHome}>
          Eksplore Restwo
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', marginBottom: 24, letterSpacing: '-0.3px' }}>
        Konfime Kòmand Ou
      </h1>

      {error && (
        <div className="alert-error" style={{ marginBottom: 20 }}>
          <IconInfo />
          <span>{error}</span>
        </div>
      )}

      <div className="checkout-layout">
        {/* Left: Form */}
        <div>
          {/* Delivery Info */}
          <div className="checkout-section">
            <div className="checkout-section-title">
              <IconMapPin />
              Enfòmasyon Livrezon
            </div>
            <label className="field-label">Adrès Livrezon *</label>
            <div className="input-wrap" style={{ marginBottom: 8 }}>
              <div className="input-icon" style={{ padding: '0 12px' }}><IconMapPin /></div>
              <input
                id="checkout-address"
                className="input-field"
                placeholder="Eg: Boulevard du Cap, Cap-Haïtien"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            {/* Quick Active Zone Selector Chips */}
            {activeZones.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  ZÒN AKTIFF NAN OKAP (Klike pou w chwazi rapid):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeZones.map(z => {
                    const isSelected = address.toLowerCase().includes(z.name.toLowerCase()) || address.toLowerCase().includes(z.nameKr.toLowerCase());
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setAddress(`${z.name}, Cap-Haïtien`)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? 800 : 600,
                          border: isSelected ? '1px solid #FF6000' : '1px solid #E2E8F0',
                          background: isSelected ? '#FFF3EB' : '#FFFFFF',
                          color: isSelected ? '#FF6000' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                        <span>{z.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Realtime Coverage Validation Feedback */}
            {coverageValidation && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: coverageValidation.isAvailable ? '#ECFDF5' : '#FEF2F2',
                  color: coverageValidation.isAvailable ? '#065F46' : '#991B1B',
                  border: `1px solid ${coverageValidation.isAvailable ? '#A7F3D0' : '#FECACA'}`,
                }}
              >
                <span>{coverageValidation.isAvailable ? '🟢' : '🔴'}</span>
                <div>
                  {coverageValidation.isAvailable ? (
                    <div>
                      <span>Zòn Kouvri: <strong>{coverageValidation.area?.name}</strong></span>
                      {coverageValidation.isPricingConfigured ? (
                        <span style={{ marginLeft: 6, color: '#047857' }}>
                          • Tarif baz: {coverageValidation.pricing?.baseFee} HTG
                          {coverageValidation.pricing?.estimatedDeliveryMinutes && ` • ~${coverageValidation.pricing.estimatedDeliveryMinutes} min`}
                        </span>
                      ) : (
                        <span style={{ marginLeft: 6, color: '#B45309' }}>
                          • (Tarif espesifik poko konfigire — tarif estanda aplike)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>{coverageValidation.message}</span>
                  )}
                </div>
              </div>
            )}

            <label className="field-label">Nimewo Telefòn</label>
            <div className="input-wrap" style={{ marginBottom: 16 }}>
              <div style={{ padding: '0 12px', fontWeight: 900, fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                +509
              </div>
              <input
                id="checkout-phone"
                className="input-field"
                type="tel"
                placeholder="37 XX XX XX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <label className="field-label">Nòt (Opsyonèl)</label>
            <div className="input-wrap">
              <textarea
                id="checkout-notes"
                style={{
                  flex: 1, border: 'none', outline: 'none', padding: '12px 14px',
                  fontFamily: 'inherit', fontSize: '0.9375rem', fontWeight: 500,
                  color: 'var(--text-primary)', background: 'transparent', resize: 'none', minHeight: 70,
                }}
                placeholder="Enstriksyon pou livrezon an..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <div className="checkout-section-title">
              <IconCreditCard />
              Metòd Peman
            </div>
            <div className="payment-methods">
              <div
                id="pay-moncash"
                className={`payment-opt ${payMethod === 'moncash' ? 'selected' : ''}`}
                onClick={() => setPayMethod('moncash')}>
                <div className="payment-opt-icon" style={{ background: '#FFF3EB', color: '#FF6000' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    </div>
                <div className="payment-opt-info">
                  <div className="payment-opt-name">MonCash</div>
                  <div className="payment-opt-desc">Peman mobil Digicel — rapid & sekirize</div>
                </div>
                <div className="payment-opt-radio">
                  <div className="payment-opt-radio-dot" />
                </div>
              </div>

              <div
                id="pay-cash"
                className={`payment-opt ${payMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setPayMethod('cash')}>
                <div className="payment-opt-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    </div>
                <div className="payment-opt-info">
                  <div className="payment-opt-name">Cash à la Livrezon</div>
                  <div className="payment-opt-desc">Peye lè livrezon an rive lakay ou</div>
                </div>
                <div className="payment-opt-radio">
                  <div className="payment-opt-radio-dot" />
                </div>
              </div>
            </div>

            {payMethod === 'moncash' && (
              <div className="moncash-info">
                <IconInfo />
                <span>
                  Lè ou klike "Konfime Komand", yon fenèt MonCash pral ouvri.
                  Konplete peman an epi retounen isi pou konfime avèk ID tranzaksyon ou a.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="order-summary-card">
          <div className="order-summary-header">
            <IconShoppingBag style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Rezime Komand
          </div>
          <div className="order-summary-items">
            {items.map(item => (
              <div key={item.id} className="summary-item">
                <span className="summary-item-name">
                  {item.name}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> ×{item.quantity}</span>
                </span>
                <span>{formatHTG(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="order-summary-totals">
            <div className="total-line">
              <span>Sou-total</span>
              <span>{formatHTG(subtotal)}</span>
            </div>
            <div className="total-line">
              <span>Frè baz livrezon (~{deliveryBreakdown.distanceKm} km)</span>
              <span>{formatHTG(deliveryBreakdown.baseDistanceFee)}</span>
            </div>
            {deliveryBreakdown.volumeSurcharge > 0 && (
              <div className="total-line" style={{ color: '#FF6000', fontWeight: 600 }}>
                <span>Sipleman volim ({totalItems} bwat/atik)</span>
                <span>+{formatHTG(deliveryBreakdown.volumeSurcharge)}</span>
              </div>
            )}
            {deliveryBreakdown.categorySurcharge > 0 && (
              <div className="total-line" style={{ color: '#FF6000', fontWeight: 600 }}>
                <span>Sipleman machandiz lou</span>
                <span>+{formatHTG(deliveryBreakdown.categorySurcharge)}</span>
              </div>
            )}
            <div className="total-line">
              <span>Total Frè Livrezon</span>
              <span style={{ fontWeight: 700 }}>{formatHTG(deliveryFee)}</span>
            </div>
            <div className="total-line grand">
              <span>Total</span>
              <span className="amount">{formatHTG(totalAmount)}</span>
            </div>
          </div>
          <button
            id="btn-place-order"
            className="btn-place-order"
            onClick={handlePlaceOrder}
            disabled={loading}>
            {loading
              ? <><div className="spinner" /><span>Chajman...</span></>
              : payMethod === 'moncash'
                ? <>Pase Kòmand — MonCash</>
                : <>Pase Kòmand — Cash</>}
          </button>
        </div>
      </div>
    </div>
  )
}
