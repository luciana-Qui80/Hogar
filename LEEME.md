# Mi Hogar
1. Supabase > SQL Editor: pega y ejecuta supabase/1_schema.sql
2. Authentication > Users > Add user (correo + contraseña, marca "Auto Confirm User")
3. SQL Editor: edita correo/nombre en supabase/2_primer_administrador.sql y ejecútalo
4. Storage > New bucket: nombre exacto `adjuntos`, PRIVADO
5. Copia .env.example a .env y pon Project URL y anon key (Project Settings > API)
6. Local: npm install && npm run dev
7. Netlify: Build `npm run build`, Publish `dist`; agrega las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
