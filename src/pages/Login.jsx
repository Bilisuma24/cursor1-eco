import React from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const navigate = useNavigate()

  async function handle(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handle} className="w-full max-w-md bg-white p-6 rounded shadow space-y-3">
        <h2 className="text-xl font-semibold">Sign in</h2>
        <input className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <button className="w-full py-2 bg-sky-600 text-white rounded">Sign in</button>
      </form>
    </div>
  )
}