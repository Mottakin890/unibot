-- Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid not null references public.chatbots(id) on delete cascade,
  source text default 'playground' check (source in ('playground', 'widget')),
  visitor_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_conversations_chatbot_id on public.conversations(chatbot_id);

alter table public.conversations enable row level security;

-- Owner can see all conversations for their chatbots
create policy "conversations_select_owner" on public.conversations
  for select using (
    exists (
      select 1 from public.chatbots
      where chatbots.id = conversations.chatbot_id
      and chatbots.user_id = auth.uid()
    )
  );

-- Owner can insert conversations for their chatbots
create policy "conversations_insert_owner" on public.conversations
  for insert with check (
    exists (
      select 1 from public.chatbots
      where chatbots.id = conversations.chatbot_id
      and chatbots.user_id = auth.uid()
    )
  );

-- Owner can delete conversations for their chatbots
create policy "conversations_delete_owner" on public.conversations
  for delete using (
    exists (
      select 1 from public.chatbots
      where chatbots.id = conversations.chatbot_id
      and chatbots.user_id = auth.uid()
    )
  );

-- Anonymous users can insert conversations for public chatbots (widget)
create policy "conversations_insert_public" on public.conversations
  for insert with check (
    exists (
      select 1 from public.chatbots
      where chatbots.id = conversations.chatbot_id
      and chatbots.is_public = true
    )
  );

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

-- Owner can see all messages for their chatbot conversations
create policy "messages_select_owner" on public.messages
  for select using (
    exists (
      select 1 from public.conversations
      join public.chatbots on chatbots.id = conversations.chatbot_id
      where conversations.id = messages.conversation_id
      and chatbots.user_id = auth.uid()
    )
  );

-- Owner can insert messages for their chatbot conversations
create policy "messages_insert_owner" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations
      join public.chatbots on chatbots.id = conversations.chatbot_id
      where conversations.id = messages.conversation_id
      and chatbots.user_id = auth.uid()
    )
  );

-- Anonymous users can insert messages for public chatbot conversations
create policy "messages_insert_public" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      join public.chatbots cb on cb.id = c.chatbot_id
      where c.id = messages.conversation_id
      and cb.is_public = true
    )
  );

-- Anonymous users can select messages for public chatbot conversations
create policy "messages_select_public" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.chatbots cb on cb.id = c.chatbot_id
      where c.id = messages.conversation_id
      and cb.is_public = true
    )
  );
