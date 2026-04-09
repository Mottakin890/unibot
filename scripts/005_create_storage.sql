-- Create storage bucket for file uploads
insert into storage.buckets (id, name, public, file_size_limit)
values ('data-sources', 'data-sources', false, 52428800)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "data_sources_upload" on storage.objects
  for insert with check (
    bucket_id = 'data-sources'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to read their own files
create policy "data_sources_read" on storage.objects
  for select using (
    bucket_id = 'data-sources'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own files
create policy "data_sources_delete" on storage.objects
  for delete using (
    bucket_id = 'data-sources'
    and auth.role() = 'authenticated'
  );
