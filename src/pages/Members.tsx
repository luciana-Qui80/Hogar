import { useEffect, useState } from 'react'
import { supabase, ROLES } from '../lib/supabase'
export default function Members() {
  const [rows,setRows]=useState<any[]>([]); const [f,setF]=useState({email:'',password:'',full_name:'',role:'hijo'})
  const load = async () => setRows((await supabase.from('profiles').select('*').order('full_name')).data||[])
  useEffect(()=>{load()},[])
  const create = async () => {
    if(f.password.length<8) return alert('La contraseña debe tener al menos 8 caracteres')
    const { error } = await supabase.rpc('admin_create_user',{ p_email:f.email, p_password:f.password, p_full_name:f.full_name, p_role:f.role })
    if(error) alert(error.message); else { setF({email:'',password:'',full_name:'',role:'hijo'}); load() }
  }
  const toggle = async (p:any) => { await supabase.from('profiles').update({active:!p.active}).eq('id',p.id); load() }
  return <div><h2>Integrantes</h2><div className="card form">
    <input placeholder="Nombre" value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/>
    <select value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
    <input placeholder="Correo" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
    <input placeholder="Contraseña (mín. 8)" type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
    <button onClick={create}>Crear usuario</button></div>
    {rows.map(p=><div className="card" key={p.id}><b>{p.full_name}</b> · {ROLES[p.role]} {!p.active&&<span className="tag rechazada">inactivo</span>} <button className="sec" onClick={()=>toggle(p)}>{p.active?'Desactivar':'Activar'}</button></div>)}</div>
}
