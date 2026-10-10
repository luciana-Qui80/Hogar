import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
export default function Reminders() {
  const { profile, isAdmin } = useAuth(); const [rows,setRows]=useState<any[]>([]); const [f,setF]=useState({title:'',remind_at:''})
  const load = async () => setRows((await supabase.from('reminders').select('*').order('remind_at')).data||[])
  useEffect(()=>{load()},[])
  const add = async () => { if(!f.title||!f.remind_at) return alert('Falta título o fecha')
    const {error}=await supabase.from('reminders').insert({title:f.title,remind_at:new Date(f.remind_at).toISOString(),household_id:profile!.household_id,created_by:profile!.id}); if(error) alert(error.message); else { setF({title:'',remind_at:''}); load() } }
  const del = async (id:string) => { await supabase.from('reminders').delete().eq('id',id); load() }
  const now = Date.now()
  return <div><h2>Recordatorios</h2>
    {isAdmin&&<div className="card form"><input placeholder="Ej: Revisar el gas, pagar internet…" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
      <input type="datetime-local" value={f.remind_at} onChange={e=>setF({...f,remind_at:e.target.value})}/><button onClick={add}>Agregar recordatorio</button></div>}
    {rows.map(r=>{ const t=new Date(r.remind_at).getTime(); const tag=t<now?'vencido':(t-now<864e5*3?'próximo':'')
      return <div className="card" key={r.id}><b>{r.title}</b> {tag&&<span className={'tag '+(tag==='vencido'?'rechazada':'pendiente')}>{tag}</span>}
      <div className="muted">{new Date(r.remind_at).toLocaleString()}</div>{isAdmin&&<button className="sec" onClick={()=>del(r.id)}>Eliminar</button>}</div> })}
    {!rows.length&&<p className="muted">Sin recordatorios.</p>}</div>
}
