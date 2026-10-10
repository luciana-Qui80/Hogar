import { useEffect, useState } from 'react'
import { supabase, ROLES } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
const empty = { type:'compra', title:'', description:'', quantity:1, unit:'unidad', category:'alimentos', priority:'media' }
export default function Requests({ admin=false }:{ admin?:boolean }) {
  const { profile } = useAuth(); const [rows,setRows]=useState<any[]>([]); const [f,setF]=useState<any>(empty); const [file,setFile]=useState<File|null>(null); const [att,setAtt]=useState<Record<string,any[]>>({})
  const load = async () => {
    let q = supabase.from('requests').select('*, creator:profiles!requests_created_by_fkey(full_name,role)').order('created_at',{ascending:false})
    q = admin ? q.eq('status','pendiente') : q.eq('created_by',profile!.id)
    const data = (await q).data||[]; setRows(data)
    if(data.length){
      const { data:a } = await supabase.from('attachments').select('*').in('request_id',data.map((r:any)=>r.id))
      const m:Record<string,any[]> = {}
      for(const x of a||[]){ const { data:s } = await supabase.storage.from('adjuntos').createSignedUrl(x.path,3600); (m[x.request_id]??=[]).push({...x,url:s?.signedUrl}) }
      setAtt(m)
    }
  }
  useEffect(()=>{load()},[admin])
  const create = async () => {
    if(!f.title.trim()) return
    if(f.type==='compra'){
      const { data:dup } = await supabase.from('requests').select('id,title,quantity').eq('type','compra').in('status',['pendiente','aprobada']).ilike('title',f.title.trim())
      if(dup?.length && !confirm(`Ya existe "${dup[0].title}" en la lista. ¿Crear otra solicitud igualmente?`)) return
    }
    if(file){
      if(file.size>5*1024*1024) return alert('El archivo debe pesar máximo 5 MB')
      if(!(file.type.startsWith('image/')||file.type==='application/pdf')) return alert('Solo se permiten imágenes o PDF')
    }
    const { data:req, error } = await supabase.from('requests').insert({ ...f, household_id:profile!.household_id, created_by:profile!.id }).select('id').single()
    if(error) return alert(error.message)
    if(file){
      const path = `${profile!.id}/${req.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g,'_')}`
      const up = await supabase.storage.from('adjuntos').upload(path,file)
      if(up.error) alert('La solicitud se creó, pero el archivo no se pudo subir: '+up.error.message)
      else await supabase.from('attachments').insert({ household_id:profile!.household_id, request_id:req.id, path, file_name:file.name, mime_type:file.type, uploaded_by:profile!.id })
    }
    setF(empty); setFile(null); load()
  }
  const decide = async (r:any, ok:boolean) => {
    const reason = ok ? null : prompt('Motivo del rechazo (opcional)')
    if(!ok && reason===null) return
    const { error } = await supabase.from('requests').update({ status: ok?'aprobada':'rechazada', approved_by:profile!.id, approved_at:new Date().toISOString(), reject_reason:reason }).eq('id',r.id)
    if(error) alert(error.message); else load()
  }
  const finish = async (r:any) => { await supabase.from('requests').update({status:'completada'}).eq('id',r.id); load() }
  return <div><h2>{admin?'Centro de aprobación':'Mis solicitudes'}</h2>
    {!admin&&<div className="card form">
      <select value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="compra">Compra</option><option value="servicio">Servicio</option><option value="reparacion">Reparación</option></select>
      <input placeholder="¿Qué necesitas?" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
      <textarea placeholder="Motivo o descripción" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
      {f.type==='compra'&&<><input type="number" min={1} value={f.quantity} onChange={e=>setF({...f,quantity:+e.target.value})}/>
      <input placeholder="Unidad" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}/>
      <select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{['alimentos','limpieza','higiene','mascotas','mantenimiento','otros'].map(c=><option key={c}>{c}</option>)}</select></>}
      <select value={f.priority} onChange={e=>setF({...f,priority:e.target.value})}><option>baja</option><option>media</option><option>alta</option></select>
      <input type="file" accept="image/*,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/>
      <button onClick={create}>Enviar solicitud</button></div>}
    {rows.map(r=><div className="card" key={r.id}><b>{r.title}</b> <span className={'tag '+r.status}>{r.status}</span>
      <div className="muted">{r.type}{r.type==='compra'?` · ${r.quantity} ${r.unit} · ${r.category}`:''} · prioridad {r.priority} · {r.creator?.full_name} ({ROLES[r.creator?.role]})</div>
      {r.description&&<p>{r.description}</p>}{(att[r.id]||[]).map(a=><div key={a.id}><a href={a.url} target="_blank" rel="noreferrer">📎 {a.file_name}</a></div>)}{r.reject_reason&&<p className="err">Rechazada: {r.reject_reason}</p>}
      {admin&&<><button onClick={()=>decide(r,true)}>Aprobar</button> <button className="sec" onClick={()=>decide(r,false)}>Rechazar</button></>}
      {!admin&&r.status==='aprobada'&&r.type!=='compra'&&<button onClick={()=>finish(r)}>Marcar completada</button>}</div>)}
    {!rows.length&&<p className="muted">Nada por aquí.</p>}</div>
}
