-- Create chatbots table
create table if not exists public.chatbots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  system_prompt text default 'You are a helpful AI assistant.',
  model text default 'google/gemini-2.5-flash',
  temperature float default 0.7,
  welcome_message text default 'Hi! How can I help you today?',
  theme_color text default '#6366f1',
  display_name text,
  initial_messages jsonb default '[]'::jsonb,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_chatbots_user_id on public.chatbots(user_id);

alter table public.chatbots enable row level security;

create policy "chatbots_select_own" on public.chatbots for select using (auth.uid() = user_id);
create policy "chatbots_insert_own" on public.chatbots for insert with check (auth.uid() = user_id);
create policy "chatbots_update_own" on public.chatbots for update using (auth.uid() = user_id);
create policy "chatbots_delete_own" on public.chatbots for delete using (auth.uid() = user_id);

-- Allow anonymous select for public chatbots (widget)
create policy "chatbots_select_public" on public.chatbots for select using (is_public = true);
