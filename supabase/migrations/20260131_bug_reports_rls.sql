-- Ensure insert policy allows anon/authenticated
drop policy if exists "Allow bug report inserts" on public.bug_reports;

create policy "Allow bug report inserts"
  on public.bug_reports for insert
  to anon, authenticated
  with check (true);
