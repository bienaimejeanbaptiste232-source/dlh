'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8F9FA',
      color: '#0F172A',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '3px solid rgba(235, 23, 0, 0.15)',
        borderTopColor: '#EB1700',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ marginTop: 16, color: '#64748B', fontSize: '0.95rem', fontWeight: 600 }}>Chargement de Delivery Haïti Admin...</p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
