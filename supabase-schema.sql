-- Run once in Supabase SQL Editor. Any account created through the site's
-- sign-up form can see the shared gallery. Keep the site link private.
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 80),
  owner text not null check (char_length(owner) between 1 and 32),
  photo_path text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Upgrade the earlier two-name constraint if this schema was run before.
alter table public.memories drop constraint if exists memories_owner_check;
alter table public.memories add constraint memories_owner_check
  check (char_length(owner) between 1 and 32);

alter table public.memories enable row level security;
drop policy if exists "friends can view shared memories" on public.memories;
drop policy if exists "friends can add shared memories" on public.memories;
drop policy if exists "friends can remove shared memories" on public.memories;
create policy "friends can view shared memories" on public.memories
  for select to authenticated using (true);
create policy "friends can add shared memories" on public.memories
  for insert to authenticated with check (
    auth.uid() = created_by
  );
create policy "friends can remove shared memories" on public.memories
  for delete to authenticated using (auth.uid() = created_by);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 8388608, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 8388608;

drop policy if exists "friends can view shared photos" on storage.objects;
drop policy if exists "friends can upload their photos" on storage.objects;
drop policy if exists "friends can delete their photos" on storage.objects;
create policy "friends can view shared photos" on storage.objects
  for select to authenticated using (bucket_id = 'memories');
create policy "friends can upload their photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "friends can delete their photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Keep both friends' galleries in sync while the page is open.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memories'
  ) then
    alter publication supabase_realtime add table public.memories;
  end if;
end
$$;
