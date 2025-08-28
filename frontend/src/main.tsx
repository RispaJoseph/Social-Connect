import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './styles.css'
import { router } from './router'
  import { AuthProvider } from './auth/useAuth'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <AuthProvider><RouterProvider router={router} /></AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
