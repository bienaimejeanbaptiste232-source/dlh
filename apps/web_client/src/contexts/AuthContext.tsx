import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { apiLogin, apiRegister } from '../lib/api'

interface User {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string
  address?: string
  languagePreference?: string
  role?: string
  isActive?: boolean
  imageUrl?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<{ ok: boolean; msg?: string }>
  register: (data: RegisterData) => Promise<{ ok: boolean; msg?: string }>
  logout: () => void
}

interface RegisterData {
  firstName: string
  lastName: string
  phoneNumber: string
  password: string
  email?: string
  languagePreference?: string
  address?: string
}

const AuthCtx = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'dh_token'
const USER_KEY  = 'dh_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  // Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser  = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch { /* invalid */ }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const result = await apiLogin(phone, password)
    if (!result) return { ok: false, msg: 'Nimewo telefòn oswa modpas pa kòrèk.' }

    const resAny = result as any
    const userData: User = resAny.data?.user ?? resAny.user ?? resAny
    const accessToken: string = resAny.data?.accessToken ?? resAny.accessToken ?? resAny.token ?? ''

    if (!accessToken) return { ok: false, msg: 'Repons sèvè a pa valab. Eseye ankò.' }

    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
    return { ok: true }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const phone = data.phoneNumber.startsWith('+509')
      ? data.phoneNumber
      : `+509${data.phoneNumber.replace(/\D/g, '')}`

    const result = await apiRegister({ ...data, phoneNumber: phone })
    if (!result) return { ok: false, msg: 'Nimewo telefòn sa deja itilize oswa gen yon erè rezo.' }

    const resAny = result as any
    const userData: User = resAny.data?.user ?? resAny.user ?? resAny
    const accessToken: string = resAny.data?.accessToken ?? resAny.accessToken ?? resAny.token ?? ''

    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setToken(accessToken)
      setUser(userData)
    }
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
