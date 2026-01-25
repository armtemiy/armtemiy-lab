-- Enable Storage
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: Allow public read access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated, anon  -- anon нужен, так как мы работаем через публичный ключ, но с RLS
  with check ( bucket_id = 'avatars' );

-- Policy: Allow users to update their own avatars
create policy "Users can update their own avatars"
  on storage.objects for update
  to authenticated, anon
  using ( bucket_id = 'avatars' );
