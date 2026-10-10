import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export default function Notifications() {
  const [rows,setRows]=useState<any[]>([])
  const load = async () => setRows((await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(50)).data||[])
  useEffect(()=>{load()},[])
  const read = async (id:string) => { await supabase.from('notifications').update({read:true}).eq('id',id); load() }
  return <div><h2>Notificaciones</h2>{rows.map(n=><div className="card" key={n.id} style={{opacity:n.read?.6:1}}><b>{n.title}</b><p>{n.body}</p>
    <span className="muted">{new Date(n.created_at).toLocaleString()}</span> {!n.read&&<button className="sec" onClick={()=>read(n.id)}>Marcar leída</button>}</div>)}
    {!rows.length&&<p className="muted">Sin avisos.</p>}</div>
}
