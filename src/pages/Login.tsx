import { useState } from 'react'
import { supabase } from '../lib/supabase'
export default function Login() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [err,setErr]=useState('')
  const go = async () => { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) setErr('Correo o contraseña incorrectos') }
  return <div className="login card"><h2>🏠 Mi Hogar</h2>
    <input placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}/>
    {err&&<p className="err">{err}</p>}<button onClick={go}>Entrar</button></div>
}
