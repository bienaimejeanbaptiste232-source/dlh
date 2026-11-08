import { useState, useEffect } from 'react'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // 1.8s display then smooth 400ms fade out (Total ~2.2s like UberEats / DoorDash)
    const timer = setTimeout(() => {
      setFading(true)
    }, 1800)

    const finishTimer = setTimeout(() => {
      onFinish()
    }, 2200)

    return () => {
      clearTimeout(timer)
      clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Subtle modern background ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,96,0,0.06) 0%, rgba(255,96,0,0.01) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Brand Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'splashEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          zIndex: 1,
        }}
      >
        {/* Crisp Brand Logo with soft aura */}
        <div
          style={{
            position: 'relative',
            width: 136,
            height: 136,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -12,
              borderRadius: 36,
              background: 'radial-gradient(circle, rgba(255, 96, 0, 0.12) 0%, rgba(255, 96, 0, 0.02) 65%, transparent 75%)',
              animation: 'auraPulse 2s ease-in-out infinite',
            }}
          />
          <img
            src="/logo.png"
            alt="Delivery Lakay Haïti"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.08))',
            }}
          />
        </div>

        {/* Brand Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '-0.4px',
              color: '#17191C',
              fontFamily: '"Outfit", "Inter", -apple-system, sans-serif',
            }}
          >
            Delivery Lakay
          </h1>
          <span
            style={{
              background: '#FFF3EB',
              color: '#FF6000',
              border: '1px solid rgba(255,96,0,0.25)',
              borderRadius: 5,
              padding: '2px 7px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
            }}
          >
            HAÏTI
          </span>
        </div>

        {/* Pro Subtitle */}
        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '0.85rem',
            color: '#6B7280',
            fontWeight: 500,
            letterSpacing: '0.2px',
          }}
        >
          Livrezon rapid · Manje, Makèt & Sèvis
        </p>

        {/* Ultra-sleek minimalist loading indicator */}
        <div
          style={{
            width: 140,
            height: 3,
            background: '#F3F4F6',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              background: 'linear-gradient(90deg, #FF6000, #FF8A3D)',
              borderRadius: 3,
              animation: 'slickProgress 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          />
        </div>
      </div>

      {/* Official Footnote */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#9CA3AF',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00B96B' }} />
        <span>Sèvis Ofisyèl Cap-Haïtien</span>
      </div>

      <style>{`
        @keyframes splashEnter {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(10px);
          }
          60% {
            opacity: 1;
            transform: scale(1.01) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes auraPulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
        @keyframes slickProgress {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
