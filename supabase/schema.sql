-- Supabase SQL Editor에서 한 번 실행하세요.
-- Table: 로그인한 사용자별 허브 상태(JSON)

create table if not exists public.hub_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{"version":1,"categories":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists hub_states_updated_at_idx on public.hub_states (updated_at desc);

alter table public.hub_states enable row level security;

create policy "hub_states_select_own"
  on public.hub_states for select
  using (auth.uid() = user_id);

create policy "hub_states_insert_own"
  on public.hub_states for insert
  with check (auth.uid() = user_id);

create policy "hub_states_update_own"
  on public.hub_states for update
  using (auth.uid() = user_id);

create policy "hub_states_delete_own"
  on public.hub_states for delete
  using (auth.uid() = user_id);
