import React from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [role, setRole] = React.useState('buyer')
  const navigate = useNavigate()

  async function handle(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return alert(error.message)
    // create profile row with role
    await supabase.from('profiles').upsert({ id: data.user.id, role })
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handle} className="w-full max-w-md bg-white p-6 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold">Create account</h2>
        <input className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <div>
          <label className="mr-3"><input type="radio" name="role" value="buyer" checked={role==='buyer'} onChange={()=>setRole('buyer')} /> Buyer</label>
          <label><input type="radio" name="role" value="seller" checked={role==='seller'} onChange={()=>setRole('seller')} /> Seller</label>
        </div>
        <button className="w-full py-2 bg-sky-600 text-white rounded">Sign up</button>
      </form>
    </div>
  )
}