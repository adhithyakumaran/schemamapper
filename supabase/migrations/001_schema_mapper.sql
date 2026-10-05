-- Schema Mapper production schema (run in Supabase SQL editor or via CLI)

create table if not exists public.boards (
  id text primary key,
  name text not null,
  color text not null default '#F8FAFC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nodes (
  id text primary key,
  board_id text not null references public.boards(id) on delete cascade,
  name text not null,
  parent_id text,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodes_board_id_idx on public.nodes(board_id);
create index if not exists nodes_parent_id_idx on public.nodes(parent_id);

create table if not exists public.connections (
  id text primary key,
  board_id text not null references public.boards(id) on delete cascade,
  source text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create index if not exists connections_board_id_idx on public.connections(board_id);

create table if not exists public.evidence (
  id text primary key,
  node_id text not null references public.nodes(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists evidence_node_id_idx on public.evidence(node_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists boards_updated_at on public.boards;
create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

drop trigger if exists nodes_updated_at on public.nodes;
create trigger nodes_updated_at
  before update on public.nodes
  for each row execute function public.set_updated_at();

-- RLS (internal research tool — permissive anon policies; tighten before public launch)
alter table public.boards enable row level security;
alter table public.nodes enable row level security;
alter table public.connections enable row level security;
alter table public.evidence enable row level security;

drop policy if exists "boards_anon_all" on public.boards;
create policy "boards_anon_all" on public.boards
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "nodes_anon_all" on public.nodes;
create policy "nodes_anon_all" on public.nodes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "connections_anon_all" on public.connections;
create policy "connections_anon_all" on public.connections
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "evidence_anon_all" on public.evidence;
create policy "evidence_anon_all" on public.evidence
  for all to anon, authenticated using (true) with check (true);

-- Storage bucket for screenshots (public read for simple img src URLs)
insert into storage.buckets (id, name, public)
values ('schema-evidence', 'schema-evidence', true)
on conflict (id) do nothing;

drop policy if exists "schema_evidence_anon_read" on storage.objects;
create policy "schema_evidence_anon_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'schema-evidence');

drop policy if exists "schema_evidence_anon_write" on storage.objects;
create policy "schema_evidence_anon_write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'schema-evidence');

drop policy if exists "schema_evidence_anon_update" on storage.objects;
create policy "schema_evidence_anon_update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'schema-evidence');

drop policy if exists "schema_evidence_anon_delete" on storage.objects;
create policy "schema_evidence_anon_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'schema-evidence');
