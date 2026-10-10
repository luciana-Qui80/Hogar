import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
type Ctx = { loading:boolean; session:any; profile:Profile|null; isAdmin:boolean }
const C = createContext<Ctx>({ loading:true, session:null, profile:null, isAdmin:false })
export const useAuth = () => useContext(C)
export function AuthProvider({ children }:{ children:ReactNode }) {
  const [session,setSession] = useState<any>(null)
  const [profile,setProfile] = useState<Profile|null>(null)
  const [loading,setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({data}) => { setSession(data.session); if(!data.session) setLoading(false) })
    const { data:sub } = supabase.auth.onAuthStateChange((_e,s) => { setSession(s); if(!s){ setProfile(null); setLoading(false) } })
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if(!session) return
    supabase.from('profiles').select('*').eq('id',session.user.id).single().then(({data}) => { setProfile(data); setLoading(false) })
  }, [session])
  const isAdmin = profile?.role==='mama' || profile?.role==='papa'
  return <C.Provider value={{loading,session,profile,isAdmin}}>{children}</C.Provider>
}
