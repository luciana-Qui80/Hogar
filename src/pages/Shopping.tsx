import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export default function Shopping() {
  const [rows,setRows]=useState<any[]>([])
  const load = async () => setRows((await supabase.from('requests').select('*').eq('type','compra').in('status',['aprobada','completada']).order('category')).data||[])
  useEffect(()=>{load()},[])
  const toggle = async (r:any) => { await supabase.from('requests').update({status:r.status==='completada'?'aprobada':'completada'}).eq('id',r.id); load() }
  const cats = [...new Set(rows.map(r=>r.category))]
  return <div><h2>Lista de compras</h2>{cats.map(c=><div className="card" key={c}><h3>{c}</h3>
    {rows.filter(r=>r.category===c).map(r=><label key={r.id} className="row"><input type="checkbox" checked={r.status==='completada'} onChange={()=>toggle(r)}/>
      <span style={{textDecoration:r.status==='completada'?'line-through':'none'}}>{r.title} — {r.quantity} {r.unit}</span></label>)}</div>)}
    {!rows.length&&<p className="muted">No hay productos aprobados.</p>}</div>
}
