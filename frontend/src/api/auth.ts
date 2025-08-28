import { api } from '../lib/api'
import { storage } from '../lib/storage'
import { getMe } from './users'

export async function register(payload: {
  email: string
  username: string
  password: string
  first_name?: string
  last_name?: string
}) {
  const { data } = await api.post('/auth/register/', payload)
  return data
}

export async function login(payload: { username: string; password: string }) {
  // SimpleJWT returns { access, refresh }
  const { data } = await api.post('/auth/login/', payload)

  if (data?.access) storage.set('sc_access', data.access)
  if (data?.refresh) storage.set('sc_refresh', data.refresh)

  // Now that we have an access token, fetch the current user
  const me = await getMe()
  if (me) storage.set('sc_user', me)

  // Return tokens + user to the caller
  return { ...data, user: me }
}

export async function refreshToken(refresh: string) {
  const { data } = await api.post('/auth/token/refresh/', { refresh })
  if (data?.access) storage.set('sc_access', data.access)
  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout/', { refresh: storage.get('sc_refresh') })
  } catch {}
  storage.remove('sc_access')
  storage.remove('sc_refresh')
  storage.remove('sc_user')
}

export async function changePassword(payload: { old_password: string; new_password: string }) {
  const { data } = await api.post('/auth/change-password/', payload)
  return data
}

export async function requestPasswordReset(payload: { email: string }) {
  const { data } = await api.post('/auth/password-reset/', payload)
  return data
}

export async function confirmPasswordReset(payload: { uidb64: string; token: string; new_password: string }) {
  // Your backend expects uidb64 & token in the URL path
  const { uidb64, token, new_password } = payload
  const { data } = await api.post(`/auth/password-reset-confirm/${uidb64}/${token}/`, { new_password })
  return data
}
