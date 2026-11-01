create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('estudiante_docente', 'tecnico', 'administrador')),
  created_at timestamptz not null default now()
);

create table if not exists ubicaciones (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists reportes (
  id bigint generated always as identity primary key,
  titulo text not null,
  descripcion text not null,
  ubicacion_id bigint not null references ubicaciones (id),
  categoria_id bigint not null references categorias (id),
  autor_id uuid not null references perfiles (id),
  tecnico_id uuid references perfiles (id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_revision', 'resuelto', 'cancelado')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reportes_estado on reportes (estado);
create index if not exists idx_reportes_ubicacion on reportes (ubicacion_id);
create index if not exists idx_reportes_categoria on reportes (categoria_id);
create index if not exists idx_reportes_autor on reportes (autor_id);

create table if not exists historial_estados (
  id bigint generated always as identity primary key,
  reporte_id bigint not null references reportes (id) on delete cascade,
  estado_nuevo text not null check (estado_nuevo in ('pendiente', 'en_revision', 'resuelto', 'cancelado')),
  autor_id uuid not null references perfiles (id),
  comentario text,
  created_at timestamptz not null default now()
);

create index if not exists idx_historial_reporte on historial_estados (reporte_id);

insert into ubicaciones (nombre) values
  ('Aula 1'), ('Aula 2'), ('Aula 3'), ('Baños'), ('Patio'),
  ('Pañol'), ('Server'), ('Taller')
on conflict (nombre) do nothing;

insert into categorias (nombre) values
  ('Electricidad'), ('Plomería'), ('Mobiliario'),
  ('Informática / Red'), ('Proyector'), ('Limpieza'), ('Otro')
on conflict (nombre) do nothing;

alter table perfiles enable row level security;
alter table ubicaciones enable row level security;
alter table categorias enable row level security;
alter table reportes enable row level security;
alter table historial_estados enable row level security;

create or replace function rol_actual()
returns text
language sql
security definer
stable
as $$
  select rol from perfiles where id = auth.uid();
$$;

drop policy if exists "perfiles_select_autenticados" on perfiles;
create policy "perfiles_select_autenticados"
  on perfiles for select
  to authenticated
  using (true);

drop policy if exists "perfiles_insert_propio" on perfiles;
drop policy if exists "perfiles_update_propio_o_admin" on perfiles;
create policy "perfiles_update_propio_o_admin"
  on perfiles for update
  to authenticated
  using (id = auth.uid() or rol_actual() = 'administrador');

create or replace function crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Sin nombre'),
    coalesce(new.raw_user_meta_data->>'rol', 'estudiante_docente')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();

drop policy if exists "ubicaciones_select_autenticados" on ubicaciones;
create policy "ubicaciones_select_autenticados"
  on ubicaciones for select to authenticated using (true);
drop policy if exists "ubicaciones_modifica_admin" on ubicaciones;
create policy "ubicaciones_modifica_admin"
  on ubicaciones for all to authenticated
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

drop policy if exists "categorias_select_autenticados" on categorias;
create policy "categorias_select_autenticados"
  on categorias for select to authenticated using (true);
drop policy if exists "categorias_modifica_admin" on categorias;
create policy "categorias_modifica_admin"
  on categorias for all to authenticated
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

drop policy if exists "reportes_select_autenticados" on reportes;
create policy "reportes_select_autenticados"
  on reportes for select to authenticated using (true);

-- Creación: estudiante/docente crea reportes a su propio nombre.
drop policy if exists "reportes_insert_propio" on reportes;
create policy "reportes_insert_propio"
  on reportes for insert to authenticated
  with check (autor_id = auth.uid());

drop policy if exists "reportes_update_tecnico_admin" on reportes;
create policy "reportes_update_tecnico_admin"
  on reportes for update to authenticated
  using (rol_actual() in ('tecnico', 'administrador'));

drop policy if exists "historial_select_autenticados" on historial_estados;
create policy "historial_select_autenticados"
  on historial_estados for select to authenticated using (true);

drop policy if exists "historial_insert_autor_tecnico_admin" on historial_estados;
create policy "historial_insert_autor_tecnico_admin"
  on historial_estados for insert to authenticated
  with check (
    autor_id = auth.uid()
    and (
      rol_actual() in ('tecnico', 'administrador')
      or exists (
        select 1 from reportes r
        where r.id = reporte_id and r.autor_id = auth.uid()
      )
    )
  );