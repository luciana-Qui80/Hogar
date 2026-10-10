import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase, ROLES } from '../lib/supabase'
export default function Layout() {
  const { profile, isAdmin } = useAuth()
  const links = [['/','Inicio'],['/solicitudes','Mis solicitudes'],...(isAdmin?[['/aprobacion','Aprobación']]:[]),['/compras','Compras'],['/tareas','Tareas'],['/recordatorios','Recordatorios'],['/menus','Menús'],['/inventario','Inventario'],['/notificaciones','Avisos'],...(isAdmin?[['/integrantes','Integrantes']]:[])]
  return <div className="app">
    <header><b>🏠 Mi Hogar</b><span>{profile?.full_name} · {ROLES[profile?.role||'']}</span><button onClick={()=>supabase.auth.signOut()}>Salir</button></header>
    <nav>{links.map(([to,l]) => <NavLink key={to} to={to} end={to==='/'}>{l}</NavLink>)}</nav>
    <main><Outlet/></main>
  </div>
}
