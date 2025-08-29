// import { createContext, useContext, useEffect, useMemo, useState } from 'react'
// import { api } from '../lib/api'
// import { storage } from '../lib/storage'
// import { refreshToken } from '../api/auth'

// type User = {
//   id: number
//   username: string
//   email: string
//   first_name?: string
//   last_name?: string
//   avatar_url?: string | null
//   is_admin?: boolean
// }

// type AuthContextType = {
//   user: User | null
//   setUser: (u: User | null) => void
//   logout: () => void
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(storage.get('sc_user'))

//   useEffect(() => {
//     storage.set('sc_user', user)
//   }, [user])

//   // token refresh loop (optional lightweight)
//   useEffect(() => {
//     let t: number | undefined
//     async function cycle() {
//       try {
//         const rt = storage.get('sc_refresh')
//         if (rt) {
//           const tokens = await refreshToken(rt)
//           if (tokens?.access) storage.set('sc_access', tokens.access)
//         }
//       } catch {}
//       t = window.setTimeout(cycle, 1000 * 60 * 10) // every 10 minutes
//     }
//     cycle()
//     return () => { if (t) clearTimeout(t) }
//   }, [])

//   const value = useMemo(() => ({
//     user, setUser,
//     logout: () => {
//       storage.remove('sc_access')
//       storage.remove('sc_refresh')
//       storage.remove('sc_user')
//       setUser(null)
//     }
//   }), [user])

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext)
//   if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
//   return ctx
// }



// src/auth/useAuth.tsx
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
  // admin flags
  is_admin?: boolean
  is_staff?: boolean
  // optional fields some backends use
  role?: string
  groups?: string[]
}

type AuthContextType = {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ---- helper: normalize whatever backend returns into our User shape ----
function normalizeUser(raw: any): User {
  const isAdmin = Boolean(
    raw?.is_admin ||
    raw?.is_staff ||
    raw?.role === 'admin' ||
    (Array.isArray(raw?.groups) && raw.groups.includes('admin'))
  )

  return {
    id: raw?.id,
    username: raw?.username,
    email: raw?.email,
    first_name: raw?.first_name,
    last_name: raw?.last_name,
    avatar_url: raw?.avatar_url ?? null,
    is_admin: isAdmin,
    is_staff: Boolean(raw?.is_staff),
    role: raw?.role,
    groups: Array.isArray(raw?.groups) ? raw.groups : undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // read any cached user and normalize it
  const cached = storage.get('sc_user')
  const [user, setUserState] = useState<User | null>(
    cached ? normalizeUser(cached) : null
  )

  // persist user to storage whenever it changes
  useEffect(() => {
    storage.set('sc_user', user)
  }, [user])

  // hydrate current user from /auth/me if we have a token but no user yet
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const access = storage.get('sc_access')
        if (!access) return
        if (user) return
        const { data } = await api.get('/auth/me/')
        if (!alive) return
        setUserState(normalizeUser(data))
      } catch {
        // ignore silently; route guards will handle auth redirects
      }
    })()
    return () => { alive = false }
  }, [user])

  // token refresh loop (every 10 minutes)
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
      t = window.setTimeout(cycle, 1000 * 60 * 10)
    }
    cycle()
    return () => { if (t) clearTimeout(t) }
  }, [])

  const value = useMemo(() => ({
    user,
    // always store a normalized user so downstream checks are consistent
    setUser: (u: User | null) => {
      setUserState(u ? normalizeUser(u) : null)
    },
    logout: () => {
      storage.remove('sc_access')
      storage.remove('sc_refresh')
      storage.remove('sc_user')
      setUserState(null)
    }
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
