import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
export default function Inventory() {
  const { profile, isAdmin } = useAuth(); const [rows,setRows]=useState<any[]>([]); const [f,setF]=useState<any>({name:'',category:'alimentos',quantity:0,unit:'unidad',location:'',min_quantity:1})
  const load = async () => setRows((await supabase.from('inventory_items').select('*').order('name')).data||[])
  useEffect(()=>{load()},[])
  const add = async () => { if(!f.name) return; const {error}=await supabase.from('inventory_items').insert({...f,household_id:profile!.household_id,updated_by:profile!.id}); if(error) alert(error.message); else { setF({...f,name:''}); load() } }
  const setQ = async (i:any,d:number) => { await supabase.from('inventory_items').update({quantity:Math.max(0,i.quantity+d),updated_by:profile!.id}).eq('id',i.id); load() }
  const reponer = async (i:any) => { const {error}=await supabase.from('requests').insert({type:'compra',title:i.name,quantity:Math.max(1,i.min_quantity*2-i.quantity),unit:i.unit,category:i.category,description:'Stock bajo en inventario',household_id:profile!.household_id,created_by:profile!.id}); alert(error?error.message:'Solicitud de compra creada') }
  return <div><h2>Inventario</h2>
    {isAdmin&&<div className="card form"><input placeholder="Producto" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
      <input type="number" value={f.quantity} onChange={e=>setF({...f,quantity:+e.target.value})}/><input placeholder="Unidad" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}/>
      <input placeholder="Ubicación" value={f.location} onChange={e=>setF({...f,location:e.target.value})}/><input type="number" value={f.min_quantity} onChange={e=>setF({...f,min_quantity:+e.target.value})}/>
      <button onClick={add}>Agregar</button></div>}
    {rows.map(i=><div className="card" key={i.id}><b>{i.name}</b> {i.quantity<=i.min_quantity&&<span className="tag rechazada">stock bajo</span>}
      <div className="muted">{i.quantity} {i.unit} · mín {i.min_quantity} · {i.location}</div>
      {isAdmin&&<><button className="sec" onClick={()=>setQ(i,-1)}>−</button> <button className="sec" onClick={()=>setQ(i,1)}>+</button> </>}
      {i.quantity<=i.min_quantity&&<button onClick={()=>reponer(i)}>Pedir reposición</button>}</div>)}</div>
}
