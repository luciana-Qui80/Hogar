import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
export const ROLES: Record<string,string> = { mama:'Mamá', papa:'Papá', hijo:'Hijo', hija:'Hija', abuela:'Abuela', abuelo:'Abuelo', otro:'Otro familiar', limpieza:'Personal de limpieza' }
