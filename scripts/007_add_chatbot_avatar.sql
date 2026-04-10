-- Add avatar_url column to chatbots table
alter table public.chatbots 
add column if not exists avatar_url text;

-- Create storage bucket for chatbot avatars if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chatbot-avatars', 'chatbot-avatars', true)
on conflict (id) do nothing;

-- Set up RLS policies for chatbot-avatars bucket
-- Note: 'public' = true in the bucket definition allows public reads, 
-- but we should ensure the policies are explicit.

-- Allow authenticated users to upload their own avatars
create policy "avatars_upload" on storage.objects
  for insert with check (
    bucket_id = 'chatbot-avatars'
    and auth.role() = 'authenticated'
  );

-- Allow public to read avatars
create policy "avatars_read" on storage.objects
  for select using (
    bucket_id = 'chatbot-avatars'
  );

-- Allow authenticated users to delete their own avatars
create policy "avatars_delete" on storage.objects
  for delete using (
    bucket_id = 'chatbot-avatars'
    and auth.role() = 'authenticated'
  );
