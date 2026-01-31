-- Bug reports table
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id text,
  username text,
  route text,
  view text,
  platform text,
  user_agent text,
  screen text,
  summary text not null,
  steps text,
  attachments text[],
  status text default 'new'
);

alter table public.bug_reports enable row level security;

create policy "Allow bug report inserts"
  on public.bug_reports for insert
  with check (true);

-- Storage bucket for bug report attachments
insert into storage.buckets (id, name, public)
values ('bug-reports', 'bug-reports', true)
on conflict (id) do nothing;

create policy "Public bug report attachments"
  on storage.objects for select
  using (bucket_id = 'bug-reports');

create policy "Allow bug report uploads"
  on storage.objects for insert
  to authenticated, anon
  with check (bucket_id = 'bug-reports');
