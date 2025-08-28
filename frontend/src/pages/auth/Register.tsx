import { useState } from 'react'
import { register } from '../../api/auth'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'

export default function Register(){
  const [form, setForm] = useState({ email:'', username:'', password:'', first_name:'', last_name:'' })
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Registered! Please verify your email before login.')
      nav('/login')
    } catch (e:any) {
      toast.error(e?.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
        {['email','username','first_name','last_name'].map((k) => (
          <div key={k} className="mb-3">
            <label className="block text-sm mb-1 capitalize">{k.replace('_',' ')}</label>
            <input className="w-full border rounded-md px-3 py-2" value={(form as any)[k]} onChange={e=>setForm({...form, [k]: e.target.value})} required={k!=='last_name' && k!=='first_name'} />
          </div>
        ))}
        <label className="block text-sm mb-1">Password</label>
        <input type="password" className="w-full border rounded-md px-3 py-2 mb-4" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required />
        <button className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60" disabled={loading}>{loading?'Creating...':'Sign up'}</button>
        <p className="text-sm mt-4">Have an account? <Link to="/login" className="text-blue-600">Log in</Link></p>
      </form>
    </div>
  )
}
