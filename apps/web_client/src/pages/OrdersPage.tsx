import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchOrders, clearLocalOrders } from '../lib/api'
import { showToast } from '../lib/toast'

const formatHTG = (n: number) => `${n.toLocaleString('fr-HT')} Gdes`

// ── Clean SVG Icons (Zero Emojis, Pure Professional Style) ────
const IconClock = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconCheck = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconChef = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
    <line x1="6" y1="17" x2="18" y2="17" />
  </svg>
)

const IconBox = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const IconTruck = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const IconCheckCircle = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconXCircle = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const IconMapPin = ({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconCalendar = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconRefresh = ({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconSort = ({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M3 6h18M6 12h12m-9 6h6" />
  </svg>
)

const STATUS_CONFIG: Record<string, { label: string; cls: string; Icon: React.FC<{ size?: number; color?: string }>; desc: string; step: number; color: string }> = {
  PENDING:    { label: 'An Atant',   cls: 'status-pending',   Icon: IconClock,       desc: 'Kòmand ou voye — ap tann konfimasyon', step: 1, color: '#D97706' },
  CONFIRMED:  { label: 'Konfime',    cls: 'status-confirmed', Icon: IconCheck,       desc: 'Boutik la konfime kòmand ou',         step: 2, color: '#2563EB' },
  PREPARING:  { label: 'Ap Prepare', cls: 'status-confirmed', Icon: IconChef,        desc: 'Boutik la ap prepare kòmand ou',        step: 2, color: '#7C3AED' },
  READY:      { label: 'Pare',       cls: 'status-confirmed', Icon: IconBox,         desc: 'Kòmand pare — chofè ap vini',         step: 3, color: '#0284C7' },
  IN_TRANSIT: { label: 'An Wout',    cls: 'status-transit',   Icon: IconTruck,       desc: 'Chofè a nan wout ak kòmand ou',        step: 3, color: '#FF6000' },
  DELIVERED:  { label: 'Livre',      cls: 'status-delivered', Icon: IconCheckCircle, desc: 'Kòmand livre avèk siksè!',             step: 4, color: '#16A34A' },
  CANCELLED:  { label: 'Anile',      cls: 'status-cancelled', Icon: IconXCircle,     desc: 'Kòmand sa a anile',                    step: 0, color: '#DC2626' },
  // aliases
  pending:    { label: 'An Atant',   cls: 'status-pending',   Icon: IconClock,       desc: 'Kòmand ou voye — ap tann konfimasyon', step: 1, color: '#D97706' },
  confirmed:  { label: 'Konfime',    cls: 'status-confirmed', Icon: IconCheck,       desc: 'Boutik la konfime kòmand ou',         step: 2, color: '#2563EB' },
  preparing:  { label: 'Ap Prepare', cls: 'status-confirmed', Icon: IconChef,        desc: 'Boutik la ap prepare kòmand ou',        step: 2, color: '#7C3AED' },
  delivered:  { label: 'Livre',      cls: 'status-delivered', Icon: IconCheckCircle, desc: 'Kòmand livre avèk siksè!',             step: 4, color: '#16A34A' },
  cancelled:  { label: 'Anile',      cls: 'status-cancelled', Icon: IconXCircle,     desc: 'Kòmand sa a anile',                    step: 0, color: '#DC2626' },
}

const STEPS = [
  { step: 1, label: 'Voye',    Icon: IconClock },
  { step: 2, label: 'Konfime', Icon: IconCheck },
  { step: 3, label: 'An Wout', Icon: IconTruck },
  { step: 4, label: 'Livre',   Icon: IconCheckCircle },
]

interface Order {
  id: string
  orderNumber?: string
  status: string
  totalAmount?: number
  total?: number
  subtotal?: number
  deliveryFee?: number
  serviceFee?: number
  createdAt: string
  paymentMethod?: string
  deliveryAddress?: string
  merchant?: { name: string; type?: string; logoUrl?: string; phone?: string } | null
  merchantPhone?: string
  driverName?: string | null
  driverPhone?: string | null
  driverPlate?: string | null
  driver?: any
  restaurantName?: string
  items?: Array<{ name?: string; productName?: string; quantity: number; unitPrice: number; totalPrice?: number }>
  order_items?: Array<{ name?: string; productName?: string; quantity: number; unitPrice: number; totalPrice?: number }>
}

function getStatusConf(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG['PENDING']
}

function getOrderTotal(o: Order) {
  return o.total ?? o.totalAmount ?? 0
}

function getRestaurantName(o: Order) {
  return o.merchant?.name ?? (o as any).merchantName ?? (o as any).restaurantName ?? ((o as any).items?.[0] as any)?.restaurantName ?? 'Boutik'
}

function getOrderItems(o: any): Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }> {
  const raw = o.items || o.order_items || o.orderItems || []
  if (!Array.isArray(raw)) return []
  return raw.map((it: any) => {
    const name = String(it.name || it.productName || it.title || 'Atik')
    const quantity = Number(it.quantity || 1)
    const unitPrice = Number(it.unitPrice || it.price || 0)
    const totalPrice = Number(it.totalPrice || (unitPrice * quantity))
    return { name, quantity, unitPrice, totalPrice }
  })
}

// ── Order detail card (expanded) ─────────────────────────────
function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const conf = getStatusConf(order.status)
  const StatusIcon = conf.Icon
  const date = new Date(order.createdAt).toLocaleDateString('fr-HT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const orderItems = getOrderItems(order)
  const calculatedSubtotal = orderItems.reduce((acc, it) => acc + it.totalPrice, 0)
  const subtotal = order.subtotal && order.subtotal > 0 ? order.subtotal : (calculatedSubtotal > 0 ? calculatedSubtotal : (getOrderTotal(order) - (order.deliveryFee ?? 150)))
  const deliveryFee = order.deliveryFee ?? 150
  const serviceFee = order.serviceFee ?? 50
  const total = getOrderTotal(order) || (subtotal + deliveryFee + serviceFee)

  const orderNumberStr = order.orderNumber ?? order.id?.toString().slice(0, 8).toUpperCase()
  const trackShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${orderNumberStr}`
    : `/track/${orderNumberStr}`

  // Driver details
  const driverName = order.driverName || (order.driver?.user?.firstName ? `${order.driver.user.firstName} ${order.driver.user.lastName || ''}`.trim() : null)
  const rawDriverPhone = order.driverPhone || order.driver?.user?.phoneNumber || null
  const cleanDriverPhone = rawDriverPhone ? rawDriverPhone.replace(/\D/g, '') : null
  const driverPlate = order.driverPlate || order.driver?.vehiclePlate || null

  // Merchant details
  const rawMerchantPhone = order.merchantPhone || order.merchant?.phone || '50940553636'
  const cleanMerchantPhone = rawMerchantPhone.replace(/\D/g, '')

  const handleCopyTrackLink = () => {
    try {
      navigator.clipboard.writeText(trackShareUrl)
      showToast('Lyen swivi kòmand lan kopye! Ou ka pataje l.', 'success')
    } catch {
      showToast('Pa ka kopye lyen an otomatikman', 'error')
    }
  }

  const driverWhatsAppMsg = encodeURIComponent(
    `Bonjou ${driverName || 'Livrè'}! Mwen se kliyan kòmand #${orderNumberStr} la sou Delivery Haïti. Ki kote ou ye kounye a?`
  )
  const supportWhatsAppMsg = encodeURIComponent(
    `Bonjou Delivery Haïti! Mwen bezwen enfòmasyon sou kòmand #${orderNumberStr} mwen an (${getRestaurantName(order)}).`
  )

  return (
    <div className="order-detail-overlay" onClick={onClose} style={{ zIndex: 999999, padding: '32px 16px' }}>
      <div className="order-detail-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 660, borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.35)' }}>
        {/* Sleek, High-Visibility Header */}
        <div style={{
          background: conf.step === 4 ? 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)' : conf.step === 0 ? '#DC2626' : 'linear-gradient(135deg, #EA580C 0%, #FF6000 100%)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(255,255,255,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', flexShrink: 0
            }}>
              <StatusIcon size={20} color="#FFFFFF" />
            </div>
            <div>
              {/* Boutique Name Large & Clear */}
              <div style={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
                {getRestaurantName(order)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.25)', padding: '2px 7px', borderRadius: 12
                }}>
                  {conf.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                  {conf.desc}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 8
            }}>
              #{orderNumberStr}
            </span>
            <button
              onClick={handleCopyTrackLink}
              title="Kopye lyen swivi kòmand"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 8, padding: '5px 8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 4, color: 'white', fontSize: '0.75rem', fontWeight: 700
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Pataje</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Fèmen"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: '50%', width: 30, height: 30,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', flexShrink: 0,
                fontSize: '0.9rem', fontWeight: 800
              }}>
              ✕
            </button>
          </div>
        </div>

        {/* Compact Horizontal Stepper */}
        {conf.step > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', background: '#F8FAFC', borderBottom: '1px solid #EDF2F7',
            gap: 6
          }}>
            {STEPS.map((s, i) => {
              const isDone = conf.step >= s.step
              const isCurrent = conf.step === s.step
              return (
                <React.Fragment key={s.step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: isDone ? 'var(--primary, #FF6000)' : '#E2E8F0',
                      color: isDone ? '#FFFFFF' : '#64748B',
                      fontSize: '0.65rem', fontWeight: 900,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isDone ? '✓' : s.step}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: isCurrent ? 800 : isDone ? 700 : 500,
                      color: isCurrent ? 'var(--primary, #FF6000)' : isDone ? '#0F172A' : '#94A3B8'
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: 2,
                      background: conf.step > s.step ? 'var(--primary, #FF6000)' : '#E2E8F0',
                      borderRadius: 1
                    }} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Body: High-density 2-column layout (Zero scroll needed!) */}
        <div style={{ padding: '14px 16px' }}>
          <div className="order-detail-grid">
            {/* Left Box: Enfòmasyon Kòmand */}
            <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                Enfòmasyon Livrezon
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Boutik</span>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>{getRestaurantName(order)}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Dat & Lè</span>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#334155' }}>{date}</span>
              </div>

              {order.deliveryAddress && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Adrès Livrezon</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <IconMapPin size={12} color="var(--primary, #FF6000)" />
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F172A' }}>
                      {order.deliveryAddress}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Mòd Peman</span>
                <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#334155' }}>
                  {(order.paymentMethod?.toUpperCase() === 'MONCASH' || order.paymentMethod === 'moncash')
                    ? 'MonCash (Peman Mobil)'
                    : 'Lajan Kach (Livrezon)'}
                </span>
              </div>
            </div>

            {/* Right Box: Atik Kòmande & Rezime Peman */}
            <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                    Atik Kòmande ({orderItems.length})
                  </span>
                </div>

                {orderItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {orderItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '1px 5px', borderRadius: 4,
                            background: 'rgba(255,96,0,0.1)', color: 'var(--primary, #FF6000)',
                            fontWeight: 800, fontSize: '0.72rem'
                          }}>
                            {item.quantity}×
                          </span>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>
                          {formatHTG(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 }}>
                    Pa gen detay atik pou kòmand sa a.
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: 2 }}>
                  <span>Sous-total:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatHTG(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: 2 }}>
                  <span>Livrezon:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatHTG(deliveryFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: 4 }}>
                  <span>Sèvis:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatHTG(serviceFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.875rem', color: '#0F172A' }}>Total Peye:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--primary, #FF6000)' }}>
                    {formatHTG(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── WhatsApp & Calling Direct Contact Row (Pwen 2) ── */}
          <div style={{
            marginTop: 14,
            padding: '12px 14px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#22C55E', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={16} height={16}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#14532D' }}>
                    {cleanDriverPhone ? `Livrè Asiyen: ${driverName || 'Chofè DLH'}` : `Kontak Boutik & Sipò DLH`}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#166534' }}>
                    {cleanDriverPhone
                      ? (driverPlate ? `Motosiklèt: ${driverPlate} • Rele oswa ekri sou WhatsApp` : 'Livrè a gen kòmand ou • Ou ka kominike avè l')
                      : 'Kominike dirèkteman avèk boutik la oswa asistans 24/7 nou an'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {cleanDriverPhone ? (
                  <>
                    <a
                      href={`tel:${cleanDriverPhone}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#0F172A', color: 'white', textDecoration: 'none',
                        padding: '7px 12px', borderRadius: 8,
                        fontSize: '0.78rem', fontWeight: 800
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z"/>
                      </svg>
                      <span>Rele Livrè</span>
                    </a>
                    <a
                      href={`https://wa.me/${cleanDriverPhone}?text=${driverWhatsAppMsg}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#25D366', color: 'white', textDecoration: 'none',
                        padding: '7px 14px', borderRadius: 8,
                        fontSize: '0.78rem', fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(37,211,102,0.3)'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.84-1.56 1.56-3.64 2.41-5.83 2.41-1.46 0-2.88-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.19-.31A8.204 8.204 0 0 1 3.79 11.9c0-4.55 3.69-8.23 8.26-8.23m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.8 2.75 4.36 3.86.61.26 1.09.42 1.46.54.61.2 1.17.17 1.61.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z"/>
                      </svg>
                      <span>WhatsApp Livrè</span>
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href={`tel:${cleanMerchantPhone}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#0F172A', color: 'white', textDecoration: 'none',
                        padding: '7px 12px', borderRadius: 8,
                        fontSize: '0.78rem', fontWeight: 800
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z"/>
                      </svg>
                      <span>Rele Boutik</span>
                    </a>
                    <a
                      href={`https://wa.me/50940553636?text=${supportWhatsAppMsg}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#25D366', color: 'white', textDecoration: 'none',
                        padding: '7px 14px', borderRadius: 8,
                        fontSize: '0.78rem', fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(37,211,102,0.3)'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.84-1.56 1.56-3.64 2.41-5.83 2.41-1.46 0-2.88-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.19-.31A8.204 8.204 0 0 1 3.79 11.9c0-4.55 3.69-8.23 8.26-8.23m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.8 2.75 4.36 3.86.61.26 1.09.42 1.46.54.61.2 1.17.17 1.61.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z"/>
                      </svg>
                      <span>WhatsApp Sipò</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleCopyTrackLink}
              style={{
                background: '#F1F5F9', color: '#334155',
                border: '1px solid #CBD5E1', borderRadius: 8,
                padding: '8px 16px', fontWeight: 700, fontSize: '0.8125rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Kopye Lyen Swivi</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#0F172A', color: '#FFFFFF',
                border: 'none', borderRadius: 8,
                padding: '8px 24px', fontWeight: 800, fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Fèmen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Orders Page ───────────────────────────────────────────────
export default function OrdersPage({
  initialTrackNumber = null,
  onSelectOrder,
  onGoHome,
}: {
  initialTrackNumber?: string | null
  onSelectOrder?: (orderNum: string | null) => void
  onGoHome: () => void
}) {
  const { token } = useAuth()
  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [selected, setSelected]   = useState<Order | null>(null)

  // Status & Date Filter States
  const [filter, setFilter]         = useState<'all' | 'active' | 'done'>('all')
  const [dateRange, setDateRange]   = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortOrder, setSortOrder]   = useState<'desc' | 'asc'>('desc')
  const [visibleLimit, setVisibleLimit] = useState<number>(10)

  const loadOrders = (isManual = false) => {
    if (isManual) setRefreshing(true)
    fetchOrders(token)
      .then(data => {
        setOrders(Array.isArray(data) ? data : [])
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => {
        setError('Erè chajman kòmand yo.')
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    loadOrders()
    const timer = setInterval(() => loadOrders(), 12000)
    return () => clearInterval(timer)
  }, [token])

  // ── Sync with URL track parameter (/track/:orderNumber) ────
  useEffect(() => {
    if (!initialTrackNumber) {
      if (selected) setSelected(null)
      return
    }
    if (orders.length > 0) {
      const needle = initialTrackNumber.trim().toUpperCase()
      const found = orders.find(o =>
        (o.orderNumber && o.orderNumber.toUpperCase() === needle) ||
        (o.id && o.id.toUpperCase() === needle) ||
        (o.id && o.id.slice(0, 8).toUpperCase() === needle)
      )
      if (found) {
        setSelected(found)
      }
    }
  }, [initialTrackNumber, orders])

  // Filter and Sort calculation
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000

  const filteredOrders = orders.filter(o => {
    // 1. Status Filter
    const isDone = ['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(o.status)
    if (filter === 'active' && isDone) return false
    if (filter === 'done' && !isDone) return false

    // 2. Date Range Filter
    const orderTime = new Date(o.createdAt).getTime()
    if (dateRange === 'today' && orderTime < startOfToday) return false
    if (dateRange === 'week' && orderTime < sevenDaysAgo) return false
    if (dateRange === 'month' && orderTime < thirtyDaysAgo) return false

    return true
  })

  // Sort by Date
  filteredOrders.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
  })

  const totalFiltered = filteredOrders.length
  const paginatedOrders = filteredOrders.slice(0, visibleLimit)
  const activeCount = orders.filter(o => !['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(o.status)).length
  const latestActive = orders.find(o => !['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(o.status))

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onGoHome}
            aria-label="Tounen nan Akèy"
            style={{
              background: 'white', borderRadius: 'var(--r-md)',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0,
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)'
            }}>
            ←
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.45rem', margin: 0, color: 'var(--text-primary)' }}>
              Kòmand Mwen Yo
            </h1>
            {!loading && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>
                {orders.length} total anrejistre{activeCount > 0 ? ` • ${activeCount} an kour` : ''}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              clearLocalOrders()
              setOrders([])
              loadOrders(true)
            }}
            title="Netwaye kach lokal"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'white', color: '#94A3B8',
              fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            <span>Netwaye Istorik</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'white', color: 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
            }}>
            <span style={{ display: 'inline-flex', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>
              <IconRefresh size={14} color="var(--primary, #FF6000)" />
            </span>
            <span>{refreshing ? 'Mizajou...' : 'Rafrechi'}</span>
          </button>
        </div>
      </div>

      {/* ── Active Order Hero Tracker (UberEats style) ── */}
      {latestActive && (
        <div
          onClick={() => setSelected(latestActive)}
          style={{
            background: 'linear-gradient(135deg, #17191C 0%, #1F242D 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            marginBottom: 24,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,96,0,0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B96B', boxShadow: '0 0 0 3px rgba(0,185,107,0.3)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#00B96B' }}>
                Kòmand an Kou · Suivi an Dirèk
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'monospace', fontWeight: 700 }}>
              #{latestActive.orderNumber ?? latestActive.id?.toString().slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' }}>
                {getRestaurantName(latestActive)}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>
                {getStatusConf(latestActive.status).desc}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FF6000' }}>
                {formatHTG(getOrderTotal(latestActive))}
              </span>
            </div>
          </div>

          {/* Stepper with progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {STEPS.map((s, i) => {
              const conf = getStatusConf(latestActive.status)
              const isDone = conf.step >= s.step
              const isCurrent = conf.step === s.step
              return (
                <React.Fragment key={s.step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: isDone ? '#FF6000' : 'rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(255,96,0,0.3)' : 'none',
                    }}>
                      {isDone ? '✓' : s.step}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: isDone ? 800 : 500, color: isDone ? '#FFFFFF' : '#6B7280' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: 2,
                      background: conf.step > s.step ? '#FF6000' : 'rgba(255,255,255,0.12)',
                      borderRadius: 1,
                    }} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}

      {/* Control Bar: Status Filter + Date Range + Sorting */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div className="cat-chips-row" style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'all' as const, label: 'Tout' },
              { key: 'active' as const, label: 'Aktif', hasDot: true },
              { key: 'done' as const, label: 'Fini' },
            ].map(f => (
              <button
                key={f.key}
                className={`cat-chip ${filter === f.key ? 'active' : ''}`}
                style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                onClick={() => { setFilter(f.key); setVisibleLimit(10); }}>
                {f.hasDot && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', marginRight: 5 }} />
                )}
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Order Button */}
          <button
            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--surface-3, #F8FAFC)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '6px 12px',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}>
            <IconSort size={13} color="var(--text-primary)" />
            <span>Dat: {sortOrder === 'desc' ? 'Pi Resan' : 'Pi Ansyen'}</span>
          </button>
        </div>

        {/* Date Range Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <IconCalendar size={13} color="var(--text-muted)" />
            <span>Peryòd:</span>
          </span>
          {[
            { key: 'all' as const, label: 'Tout Tan' },
            { key: 'today' as const, label: 'Jodi a' },
            { key: 'week' as const, label: '7 Dènye Jou' },
            { key: 'month' as const, label: 'Mwa Sa a' },
          ].map(d => (
            <button
              key={d.key}
              onClick={() => { setDateRange(d.key); setVisibleLimit(10); }}
              style={{
                background: dateRange === d.key ? 'var(--text-primary)' : 'transparent',
                color: dateRange === d.key ? '#FFFFFF' : 'var(--text-secondary)',
                border: dateRange === d.key ? 'none' : '1px solid var(--border)',
                borderRadius: 20, padding: '3px 10px',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}>
              {d.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {totalFiltered} kòmand twouve
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-error" style={{ marginBottom: 20 }}>
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="orders-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="order-card" style={{ padding: 18 }}>
              <div className="skeleton" style={{ height: 18, width: '40%', borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 24px', background: 'white', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
            <IconBox size={28} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', marginBottom: 6, color: 'var(--text-primary)' }}>
            {filter === 'active'
              ? 'Pa gen kòmand aktif pou peryòd sa a'
              : filter === 'done'
              ? 'Pa gen kòmand fini nan peryòd sa a'
              : 'Pa gen kòmand pou seleksyon sa a'}
          </h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 20, color: 'var(--text-secondary)' }}>
            {filter === 'all' && dateRange === 'all'
              ? 'Kòmande nan pi bon restoran nan Okap pou wè lis la isit!'
              : 'Eseye chanje filtè peryòd la oswa chwazi "Tout Tan".'}
          </p>
          {filter === 'all' && dateRange === 'all' ? (
            <button className="btn-submit" style={{ width: 'auto', padding: '0 28px', margin: '0 auto', fontSize: '0.875rem', height: 44 }} onClick={onGoHome}>
              Kòmanse Kòmande Kounye a
            </button>
          ) : (
            <button
              onClick={() => { setFilter('all'); setDateRange('all'); }}
              style={{
                background: 'var(--surface-3)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', padding: '8px 18px',
                fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer'
              }}>
              Retabli Tout Filtè Yo
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {paginatedOrders.map((order, idx) => {
            const conf = getStatusConf(order.status)
            const StatusIcon = conf.Icon
            const date = new Date(order.createdAt).toLocaleDateString('fr-HT', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
            const isActive = !['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(order.status)
            const cardItems = getOrderItems(order)

            return (
              <div
                key={order.id ?? idx}
                className="order-card order-card-clickable"
                style={{ padding: '16px 18px' }}
                onClick={() => { setSelected(order); onSelectOrder?.(order.orderNumber || order.id) }}>
                {/* Active pulse */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 9, height: 9, borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 0 3px rgba(16,185,129,0.25)',
                    animation: 'pulse 2s infinite',
                  }} />
                )}

                <div className="order-card-header" style={{ marginBottom: 10 }}>
                  <div className="order-card-id" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)' }}>
                      #{order.orderNumber ?? order.id?.toString().slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`order-status ${conf.cls}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontWeight: 700, fontSize: '0.75rem',
                      padding: '4px 10px', borderRadius: 20
                    }}>
                    <StatusIcon size={12} color={conf.color} />
                    <span>{conf.label}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                      {getRestaurantName(order)}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
                      {date}
                    </div>
                    {order.deliveryAddress && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconMapPin size={12} color="var(--primary, #FF6000)" />
                        <span>{order.deliveryAddress.length > 38 ? order.deliveryAddress.slice(0, 38) + '…' : order.deliveryAddress}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: 'var(--primary, #FF6000)', fontSize: '1.0625rem' }}>
                      {formatHTG(getOrderTotal(order))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: 2 }}>
                      {(order.paymentMethod?.toUpperCase() === 'MONCASH' || order.paymentMethod === 'moncash')
                        ? 'MonCash' : 'Kach'}
                    </div>
                  </div>
                </div>

                {/* ── Items preview on card ── */}
                {cardItems.length > 0 && (
                  <div style={{
                    marginTop: 10,
                    padding: '7px 11px',
                    background: 'var(--surface-3, #F8FAFC)',
                    borderRadius: 9,
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    border: '1px solid #EDF2F7',
                  }}>
                    <IconBox size={13} color="var(--primary, #FF6000)" />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cardItems.map(i => `${i.quantity}× ${i.name}`).join(' • ')}
                    </span>
                  </div>
                )}

                {/* Progress mini-bar for active orders */}
                {isActive && conf.step > 0 && (
                  <div className="order-mini-progress" style={{ marginTop: 12 }}>
                    {STEPS.map((s, i) => {
                      const MiniIcon = s.Icon
                      return (
                        <React.Fragment key={s.step}>
                          <div className={`order-mini-step ${conf.step >= s.step ? 'done' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MiniIcon size={11} color={conf.step >= s.step ? '#FFFFFF' : 'var(--text-muted)'} />
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`order-mini-line ${conf.step > s.step ? 'done' : ''}`} />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                )}

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--primary, #FF6000)', fontWeight: 800 }}>Detay Kòmand →</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {order.merchantPhone && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          const cleanP = (order.merchantPhone || '50940553636').replace(/\D/g, '')
                          const msg = encodeURIComponent(`Bonjou! Mwen bezwen enfòmasyon sou kòmand #${order.orderNumber || order.id?.slice(0,8)}`)
                          window.open(`https://wa.me/${cleanP}?text=${msg}`, '_blank')
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#E8F5E9', color: '#1B5E20', borderRadius: 6,
                          padding: '3px 8px', fontSize: '0.72rem', fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        WhatsApp
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Swiv an dirèk</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Load More Button for Pagination */}
          {totalFiltered > visibleLimit && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => setVisibleLimit(l => l + 10)}
                style={{
                  background: 'white', border: '1.5px solid var(--primary, #FF6000)',
                  borderRadius: 'var(--r-md)', padding: '10px 24px',
                  color: 'var(--primary, #FF6000)', fontWeight: 800, fontSize: '0.875rem',
                  cursor: 'pointer', boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.2s ease'
                }}>
                Chaje Plis Kòmand ({totalFiltered - visibleLimit} ki rete)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <OrderDetail order={selected} onClose={() => { setSelected(null); onSelectOrder?.(null) }} />
      )}
    </div>
  )
}
