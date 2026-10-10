import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
export default function Home() {
  const { profile, isAdmin } = useAuth(); const [n,setN]=useState<any>({})
  useEffect(()=>{ (async()=>{
    const c = async (t:string, f:(q:any)=>any) => (await f(supabase.from(t).select('id',{count:'exact',head:true}))).count||0
    setN({ pend: await c('requests',q=>q.eq('status','pendiente')), tareas: await c('household_tasks',q=>q.eq('assigned_to',profile!.id).eq('status','pendiente')), avisos: await c('notifications',q=>q.eq('read',false)) })
  })() },[])
  return <div><h2>Hola, {profile?.full_name}</h2><div className="grid">
    {isAdmin&&<div className="card"><h3>{n.pend??'…'}</h3>solicitudes por aprobar</div>}
    <div className="card"><h3>{n.tareas??'…'}</h3>tareas pendientes tuyas</div>
    <div className="card"><h3>{n.avisos??'…'}</h3>avisos sin leer</div></div></div>
}
