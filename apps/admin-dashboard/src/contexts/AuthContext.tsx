'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  authenticateAdmin,
  updateAdminCredentials,
  AdminUser,
} from '../lib/adminAuth';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  changeCredentials: (
    currentPass: string,
    newUsername: string,
    newPass: string
  ) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Erè lekti sesyon lokal:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(identifier: string, password: string) {
    const { user: adminUser, token: authToken } = await authenticateAdmin(
      identifier,
      password
    );

    setToken(authToken);
    setUser(adminUser);
    localStorage.setItem('admin_token', authToken);
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
  }

  async function changeCredentials(
    currentPass: string,
    newUsername: string,
    newPass: string
  ) {
    const res = await updateAdminCredentials(currentPass, newUsername, newPass);
    if (res.success && user) {
      const updatedUser: AdminUser = {
        ...user,
        username: res.username,
        firstName: res.username,
      };
      setUser(updatedUser);
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, changeCredentials, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
