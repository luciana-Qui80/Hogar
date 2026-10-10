-- ===== MI HOGAR: pega TODO esto una sola vez en Supabase > SQL Editor > Run =====
create extension if not exists pgcrypto with schema extensions;

create table households (id uuid primary key default gen_random_uuid(), name text not null default 'Mi Hogar', created_at timestamptz default now());
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id),
  full_name text not null,
  role text not null check (role in ('mama','papa','hijo','hija','abuela','abuelo','otro','limpieza')),
  active boolean not null default true, created_at timestamptz default now());
create table requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  type text not null check (type in ('compra','servicio','reparacion')),
  title text not null, description text, quantity numeric default 1, unit text, category text,
  priority text default 'media' check (priority in ('baja','media','alta')),
  location text, provider text, cost numeric, due_date date,
  status text not null default 'pendiente' check (status in ('pendiente','aprobada','rechazada','completada')),
  created_by uuid not null references profiles(id),
  approved_by uuid references profiles(id), approved_at timestamptz, reject_reason text,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table request_history (id uuid primary key default gen_random_uuid(), request_id uuid references requests(id) on delete cascade, old_status text, new_status text, changed_by uuid, changed_at timestamptz default now());
create table inventory_items (id uuid primary key default gen_random_uuid(), household_id uuid not null references households(id), name text not null, category text, quantity numeric default 0, unit text, location text, min_quantity numeric default 1, updated_by uuid references profiles(id), updated_at timestamptz default now());
create table household_tasks (id uuid primary key default gen_random_uuid(), household_id uuid not null references households(id), title text not null, description text, assigned_to uuid references profiles(id), due_date date, priority text default 'media', status text not null default 'pendiente' check (status in ('pendiente','hecha')), created_by uuid references profiles(id), created_at timestamptz default now());
create table reminders (id uuid primary key default gen_random_uuid(), household_id uuid not null references households(id), title text not null, remind_at timestamptz not null, request_id uuid references requests(id), task_id uuid references household_tasks(id), created_by uuid references profiles(id));
create table meal_plans (id uuid primary key default gen_random_uuid(), household_id uuid not null references households(id), meal_date date not null, meal_type text not null, dish text not null, notes text, created_by uuid references profiles(id));
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, title text not null, body text, request_id uuid references requests(id) on delete cascade, read boolean default false, created_at timestamptz default now());
create table attachments (id uuid primary key default gen_random_uuid(), household_id uuid not null references households(id), request_id uuid references requests(id) on delete cascade, path text not null, file_name text, mime_type text, uploaded_by uuid references profiles(id), created_at timestamptz default now());

create function is_admin() returns boolean language sql security definer stable set search_path=public as
$$ select exists(select 1 from profiles where id=auth.uid() and active and role in ('mama','papa')) $$;
create function my_hh() returns uuid language sql security definer stable set search_path=public as
$$ select household_id from profiles where id=auth.uid() and active $$;

-- Crear usuarios desde la app (solo administradores)
create function admin_create_user(p_email text, p_password text, p_full_name text, p_role text) returns uuid
language plpgsql security definer set search_path=public, extensions, auth as $$
declare uid uuid := gen_random_uuid();
begin
  if not is_admin() then raise exception 'Solo mamá o papá pueden crear usuarios'; end if;
  if length(p_password)<8 then raise exception 'Contraseña muy corta'; end if;
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
  values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',lower(p_email),crypt(p_password,gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
  insert into auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email',lower(p_email)),'email',uid::text,now(),now(),now());
  insert into profiles(id,household_id,full_name,role) values (uid,my_hh(),p_full_name,p_role);
  return uid;
end $$;
revoke all on function admin_create_user from public, anon; grant execute on function admin_create_user to authenticated;

create function trg_request_new() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into notifications(user_id,title,body,request_id)
  select id,'Nueva solicitud',new.title,new.id from profiles where household_id=new.household_id and role in ('mama','papa') and active and id<>new.created_by;
  insert into request_history(request_id,old_status,new_status,changed_by) values (new.id,null,new.status,new.created_by);
  return new; end $$;
create trigger t_req_new after insert on requests for each row execute function trg_request_new();

create function trg_request_upd() returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at=now();
  if new.status<>old.status then
    insert into request_history(request_id,old_status,new_status,changed_by) values (new.id,old.status,new.status,auth.uid());
    if new.created_by<>auth.uid() then
      insert into notifications(user_id,title,body,request_id) values (new.created_by,'Tu solicitud fue '||new.status,new.title,new.id); end if;
  end if; return new; end $$;
create trigger t_req_upd before update on requests for each row execute function trg_request_upd();

create function trg_request_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if is_admin() then return new; end if;
  if new.status in ('aprobada','rechazada') and new.status<>old.status then raise exception 'Solo mamá o papá pueden aprobar o rechazar'; end if;
  if old.status in ('pendiente','rechazada') and new.status<>old.status then raise exception 'Cambio no permitido'; end if;
  if new.title is distinct from old.title or new.created_by<>old.created_by or new.approved_by is distinct from old.approved_by or new.type<>old.type then raise exception 'Cambio no permitido'; end if;
  return new; end $$;
create trigger t_req_guard before update on requests for each row execute function trg_request_guard();

alter table households enable row level security; alter table profiles enable row level security; alter table requests enable row level security;
alter table request_history enable row level security; alter table inventory_items enable row level security; alter table household_tasks enable row level security;
alter table reminders enable row level security; alter table meal_plans enable row level security; alter table notifications enable row level security; alter table attachments enable row level security;

create policy hh_r on households for select using (id=my_hh());
create policy prof_r on profiles for select using (household_id=my_hh());
create policy prof_u on profiles for update using (is_admin() and household_id=my_hh()) with check (is_admin() and household_id=my_hh());

create policy req_r on requests for select using (household_id=my_hh() and (is_admin() or created_by=auth.uid() or (type='compra' and status in ('aprobada','completada'))));
create policy req_i on requests for insert with check (household_id=my_hh() and created_by=auth.uid() and status='pendiente');
create policy req_u on requests for update using (household_id=my_hh() and (is_admin() or created_by=auth.uid() or (type='compra' and status in ('aprobada','completada'))));
create policy hist_r on request_history for select using (is_admin() or exists(select 1 from requests r where r.id=request_id and r.created_by=auth.uid()));

create policy inv_r on inventory_items for select using (household_id=my_hh());
create policy inv_w on inventory_items for all using (is_admin() and household_id=my_hh()) with check (is_admin() and household_id=my_hh());
create policy task_r on household_tasks for select using (household_id=my_hh() and (is_admin() or assigned_to=auth.uid() or created_by=auth.uid()));
create policy task_i on household_tasks for insert with check (is_admin() and household_id=my_hh());
create policy task_u on household_tasks for update using (household_id=my_hh() and (is_admin() or assigned_to=auth.uid()));
create policy task_d on household_tasks for delete using (is_admin() and household_id=my_hh());
create policy rem_r on reminders for select using (household_id=my_hh());
create policy rem_w on reminders for all using (is_admin() and household_id=my_hh()) with check (is_admin() and household_id=my_hh());
create policy meal_r on meal_plans for select using (household_id=my_hh());
create policy meal_w on meal_plans for all using (is_admin() and household_id=my_hh()) with check (is_admin() and household_id=my_hh());
create policy note_r on notifications for select using (user_id=auth.uid());
create policy note_u on notifications for update using (user_id=auth.uid());
create policy att_r on attachments for select using (household_id=my_hh() and (is_admin() or uploaded_by=auth.uid()));
create policy att_i on attachments for insert with check (household_id=my_hh() and uploaded_by=auth.uid());

create policy "adjuntos leer" on storage.objects for select to authenticated using (bucket_id='adjuntos' and (is_admin() or owner=auth.uid()));
create policy "adjuntos subir" on storage.objects for insert to authenticated with check (bucket_id='adjuntos' and owner=auth.uid());
