import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Requests from '../pages/Requests'
import Shopping from '../pages/Shopping'
import Tasks from '../pages/Tasks'
import Inventory from '../pages/Inventory'
import Notifications from '../pages/Notifications'
import Reminders from '../pages/Reminders'
import Meals from '../pages/Meals'
import Members from '../pages/Members'
export default function AppRoutes() {
  const { loading, session, profile, isAdmin } = useAuth()
  if (loading) return <p style={{padding:20}}>Cargando…</p>
  if (!session) return <Login/>
  if (!profile) return <p style={{padding:20}}>Tu cuenta no tiene perfil. Pide a mamá o papá que lo configure.</p>
  return <Routes><Route element={<Layout/>}>
    <Route path="/" element={<Home/>}/>
    <Route path="/solicitudes" element={<Requests/>}/>
    <Route path="/aprobacion" element={isAdmin?<Requests admin/>:<Navigate to="/"/>}/>
    <Route path="/compras" element={<Shopping/>}/>
    <Route path="/tareas" element={<Tasks/>}/>
    <Route path="/recordatorios" element={<Reminders/>}/>
    <Route path="/menus" element={<Meals/>}/>
    <Route path="/inventario" element={<Inventory/>}/>
    <Route path="/notificaciones" element={<Notifications/>}/>
    <Route path="/integrantes" element={isAdmin?<Members/>:<Navigate to="/"/>}/>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Route></Routes>
}
