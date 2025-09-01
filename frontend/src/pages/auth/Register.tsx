import { useState } from 'react'
import { register } from '../../api/auth'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false) // 👈 password toggle state
  const nav = useNavigate()

  function validate() {
    const errs: Record<string, string> = {}

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
      errs.username =
        'Username must be 3–30 characters, only letters, numbers, and underscores'
    }
    if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }
    if (form.first_name && !/^[a-zA-Z]+$/.test(form.first_name)) {
      errs.first_name = 'First name should only contain letters'
    }
    if (form.last_name && !/^[a-zA-Z]+$/.test(form.last_name)) {
      errs.last_name = 'Last name should only contain letters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await register(form)
      toast.success('Registered! Please verify your email before login.')
      nav('/login')
    } catch (e: any) {
      const data = e?.response?.data

      if (data) {
        // If backend returned field-specific errors
        if (typeof data === 'object' && !data.detail) {
          const messages = Object.values(data).flat().join('\n')
          toast.error(messages)
        } else {
          // fallback to detail or generic
          toast.error(data.detail || 'Registration failed')
        }
      } else {
        toast.error('Registration failed')
      }
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-2xl shadow space-y-3"
      >
        <h1 className="text-2xl font-semibold mb-4">Create your account</h1>

        {/* Email */}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          {errors.username && (
            <p className="text-xs text-red-600 mt-1">{errors.username}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm mb-1">First name</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          {errors.first_name && (
            <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          {errors.last_name && (
            <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>
          )}
        </div>

        {/* Password with toggle */}
        <div>
          <label className="block text-sm mb-1">Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className="w-full border rounded-md px-3 py-2 pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password}</p>
          )}
        </div>

        <button
          className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Sign up'}
        </button>

        <p className="text-sm mt-4">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
