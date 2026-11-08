/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY HAITI – DESIGN TOKENS (Sistèm Koulè pa Kategori)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type DeliveryServiceCategory = 'food' | 'logistics' | 'grocery' | 'modern';

export interface ThemeColors {
  primary: string;
  accentButton: string;
  background: string;
  cardSurface: string;
  textPrimary: string;
  textSecondary: string;
  borderSubtle: string;
  primaryGradient: string;
  heroGradient: string;
  boxShadow: string;
}

export const DELIVERY_THEMES: Record<DeliveryServiceCategory, {
  title: string;
  description: string;
  colors: ThemeColors;
}> = {
  // 1. Livrezon Manje (Dinamik & Manje)
  food: {
    title: 'Livrezon Manje',
    description: 'Dinamik, apetisan, ankouraje apeti ak aksyon rapid',
    colors: {
      primary: '#FF6B00',       // Oranj Dinamik
      accentButton: '#1A1A1A',  // Nwa Chabon
      background: '#FAFAFA',    // Blan Kase
      cardSurface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#6B7280',
      borderSubtle: '#E5E7EB',
      primaryGradient: 'linear-gradient(135deg, #FF6B00 0%, #FF8533 100%)',
      heroGradient: 'linear-gradient(180deg, #FF6B00 0%, #FF4500 100%)',
      boxShadow: '0 10px 25px -5px rgba(255, 107, 0, 0.15)',
    },
  },

  // 2. Pake ak Lojistik (Konfyans & Pwofesyonèl)
  logistics: {
    title: 'Pake ak Lojistik',
    description: 'Sekirite, serye, estrikti lojistik avanse',
    colors: {
      primary: '#0B3C95',       // Ble Rwayal
      accentButton: '#FFD200',  // Jòn Klere
      background: '#F4F6F9',    // Gri Klè
      cardSurface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      borderSubtle: '#E2E8F0',
      primaryGradient: 'linear-gradient(135deg, #0B3C95 0%, #1E5BBF 100%)',
      heroGradient: 'linear-gradient(180deg, #0B3C95 0%, #062561 100%)',
      boxShadow: '0 10px 25px -5px rgba(11, 60, 149, 0.15)',
    },
  },

  // 3. Makèt ak Pwodwi Fre (Ekolojik & Sante)
  grocery: {
    title: 'Makèt ak Pwodwi Fre',
    description: 'Frechè, byennèt, pwodwi natirèl ak mache lokal',
    colors: {
      primary: '#10B981',       // Vèt Sante
      accentButton: '#111827',  // Nwa Pwofon
      background: '#FFFFFF',    // Blan Pi
      cardSurface: '#F9FAFB',
      textPrimary: '#111827',
      textSecondary: '#4B5563',
      borderSubtle: '#E5E7EB',
      primaryGradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      heroGradient: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
      boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
    },
  },

  // 4. Livrezon Modèn (Teknoloji & Jèn)
  modern: {
    title: 'Livrezon Modèn',
    description: 'High-tech, ekspres, vib cyber ak eksperyans neo',
    colors: {
      primary: '#7C3AED',       // Mov Flash
      accentButton: '#00F5D4',  // Neon Vèt
      background: '#0F172A',    // Nwa Scur
      cardSurface: '#1E293B',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      borderSubtle: '#334155',
      primaryGradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
      heroGradient: 'linear-gradient(180deg, #7C3AED 0%, #4C1D95 100%)',
      boxShadow: '0 12px 30px -5px rgba(124, 58, 237, 0.25)',
    },
  },
};
