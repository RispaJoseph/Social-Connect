import axios from 'axios'
import { storage } from './storage'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = storage.get('sc_access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
