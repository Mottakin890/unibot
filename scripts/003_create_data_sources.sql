-- Create data_sources table
create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid not null references public.chatbots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('text', 'file', 'qa', 'website')),
  name text not null,
  content text,
  file_url text,
  char_count int default 0,
  status text default 'processed' check (status in ('processing', 'processed', 'failed')),
  created_at timestamptz default now()
);

create index if not exists idx_data_sources_chatbot_id on public.data_sources(chatbot_id);

alter table public.data_sources enable row level security;

create policy "data_sources_select_own" on public.data_sources for select using (auth.uid() = user_id);
create policy "data_sources_insert_own" on public.data_sources for insert with check (auth.uid() = user_id);
create policy "data_sources_update_own" on public.data_sources for update using (auth.uid() = user_id);
create policy "data_sources_delete_own" on public.data_sources for delete using (auth.uid() = user_id);
