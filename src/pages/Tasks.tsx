import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
export default function Tasks() {
  const { profile, isAdmin } = useAuth(); const [rows,setRows]=useState<any[]>([]); const [people,setPeople]=useState<any[]>([])
  const [f,setF]=useState<any>({title:'',description:'',assigned_to:'',due_date:'',priority:'media'})
  const load = async () => { setRows((await supabase.from('household_tasks').select('*, who:profiles!household_tasks_assigned_to_fkey(full_name)').order('due_date')).data||[])
    if(isAdmin) setPeople((await supabase.from('profiles').select('id,full_name').eq('active',true)).data||[]) }
  useEffect(()=>{load()},[])
  const create = async () => { if(!f.title||!f.assigned_to) return alert('Falta título o responsable')
    const {error}=await supabase.from('household_tasks').insert({...f,due_date:f.due_date||null,household_id:profile!.household_id,created_by:profile!.id}); if(error) alert(error.message); else { setF({...f,title:'',description:''}); load() } }
  const toggle = async (t:any) => { await supabase.from('household_tasks').update({status:t.status==='hecha'?'pendiente':'hecha'}).eq('id',t.id); load() }
  return <div><h2>Tareas del hogar</h2>
    {isAdmin&&<div className="card form"><input placeholder="Tarea" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
      <textarea placeholder="Instrucciones" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
      <select value={f.assigned_to} onChange={e=>setF({...f,assigned_to:e.target.value})}><option value="">Responsable…</option>{people.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
      <input type="date" value={f.due_date} onChange={e=>setF({...f,due_date:e.target.value})}/>
      <select value={f.priority} onChange={e=>setF({...f,priority:e.target.value})}><option>baja</option><option>media</option><option>alta</option></select>
      <button onClick={create}>Asignar tarea</button></div>}
    {rows.map(t=><div className="card" key={t.id}><label className="row"><input type="checkbox" checked={t.status==='hecha'} onChange={()=>toggle(t)} disabled={t.assigned_to!==profile!.id&&!isAdmin}/>
      <b>{t.title}</b></label><div className="muted">{t.who?.full_name} · {t.due_date||'sin fecha'} · {t.priority}</div>{t.description&&<p>{t.description}</p>}</div>)}
    {!rows.length&&<p className="muted">Sin tareas.</p>}</div>
}
