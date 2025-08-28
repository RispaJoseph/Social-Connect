import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { storage } from '../lib/storage'
import { refreshToken } from '../api/auth'

type User = {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string | null
  is_admin?: boolean
}

type AuthContextType = {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(storage.get('sc_user'))

  useEffect(() => {
    storage.set('sc_user', user)
  }, [user])

  // token refresh loop (optional lightweight)
  useEffect(() => {
    let t: number | undefined
    async function cycle() {
      try {
        const rt = storage.get('sc_refresh')
        if (rt) {
          const tokens = await refreshToken(rt)
          if (tokens?.access) storage.set('sc_access', tokens.access)
        }
      } catch {}
      t = window.setTimeout(cycle, 1000 * 60 * 10) // every 10 minutes
    }
    cycle()
    return () => { if (t) clearTimeout(t) }
  }, [])

  const value = useMemo(() => ({
    user, setUser,
    logout: () => {
      storage.remove('sc_access')
      storage.remove('sc_refresh')
      storage.remove('sc_user')
      setUser(null)
    }
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
