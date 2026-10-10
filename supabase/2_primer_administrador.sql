-- Ejecuta DESPUÉS de 1_schema.sql y de crear tu usuario en Authentication > Users.
-- Cambia el correo y el nombre por los tuyos (el correo debe ser el mismo del usuario creado).
do $$
declare hh uuid; uid uuid;
begin
  select id into uid from auth.users where email = 'CAMBIA@TUCORREO.COM';
  if uid is null then raise exception 'No existe ese usuario en Authentication'; end if;
  insert into households(name) values ('Mi Hogar') returning id into hh;
  insert into profiles(id,household_id,full_name,role) values (uid,hh,'CAMBIA TU NOMBRE','mama'); -- usa 'papa' si eres papá
end $$;
