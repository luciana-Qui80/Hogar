import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
const TYPES = ['desayuno','almuerzo','merienda','cena']
export default function Meals() {
  const { profile, isAdmin } = useAuth(); const [rows,setRows]=useState<any[]>([])
  const [f,setF]=useState({meal_date:new Date().toISOString().slice(0,10),meal_type:'almuerzo',dish:'',notes:''})
  const load = async () => setRows((await supabase.from('meal_plans').select('*').gte('meal_date',new Date().toISOString().slice(0,10)).order('meal_date')).data||[])
  useEffect(()=>{load()},[])
  const add = async () => { if(!f.dish) return; const {error}=await supabase.from('meal_plans').insert({...f,household_id:profile!.household_id,created_by:profile!.id}); if(error) alert(error.message); else { setF({...f,dish:'',notes:''}); load() } }
  const del = async (id:string) => { await supabase.from('meal_plans').delete().eq('id',id); load() }
  // Ingredientes (separados por coma) -> solicitudes de compra, sin duplicar
  const ingredientes = async (m:any) => {
    const items = (m.notes||'').split(',').map((s:string)=>s.trim()).filter(Boolean); let n=0
    for(const it of items){
      const { data:dup } = await supabase.from('requests').select('id').eq('type','compra').in('status',['pendiente','aprobada']).ilike('title',it)
      if(dup?.length) continue
      const { error } = await supabase.from('requests').insert({type:'compra',title:it,quantity:1,unit:'unidad',category:'alimentos',description:'Para: '+m.dish,household_id:profile!.household_id,created_by:profile!.id}); if(!error) n++
    }
    alert(`${n} ingrediente(s) enviados como solicitud. ${items.length-n} ya estaban en la lista.`)
  }
  return <div><h2>Menús</h2>
    {isAdmin&&<div className="card form"><input type="date" value={f.meal_date} onChange={e=>setF({...f,meal_date:e.target.value})}/>
      <select value={f.meal_type} onChange={e=>setF({...f,meal_type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
      <input placeholder="Plato" value={f.dish} onChange={e=>setF({...f,dish:e.target.value})}/>
      <textarea placeholder="Ingredientes separados por coma: arroz, pollo, cebolla" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
      <button onClick={add}>Agregar al menú</button></div>}
    {rows.map(m=><div className="card" key={m.id}><b>{m.dish}</b> <span className="tag">{m.meal_type}</span>
      <div className="muted">{m.meal_date}</div>{m.notes&&<p>{m.notes}</p>}
      {m.notes&&<button onClick={()=>ingredientes(m)}>Pedir ingredientes</button>} {isAdmin&&<button className="sec" onClick={()=>del(m.id)}>Eliminar</button>}</div>)}
    {!rows.length&&<p className="muted">No hay comidas planificadas.</p>}</div>
}
