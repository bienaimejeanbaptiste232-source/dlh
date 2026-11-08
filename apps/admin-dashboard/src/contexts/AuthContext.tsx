'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(identifier: string, password: string) {
    const res = await apiFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    
    const { accessToken, user: userData } = res.data;
    
    // Vérification que c'est un compte admin
    if (!['ADMIN', 'FINANCE', 'SUPER_ADMIN'].includes(userData.role)) {
      throw new Error('Accès refusé. Compte administrateur requis.');
    }

    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
