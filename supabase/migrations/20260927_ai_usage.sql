-- Quotas mensuels d'usage de l'IA (pages lues, illustrations) par formateur.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  pages int not null default 0,
  images int not null default 0,
  primary key (user_id, month)
);
alter table public.ai_usage enable row level security;
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage for select using (auth.uid() = user_id);

create or replace function public.consume_ai_quota(kind text, max_count int)
returns boolean language plpgsql security definer set search_path = public as $$
declare m text := to_char(now() at time zone 'utc', 'YYYY-MM'); v int;
begin
  if auth.uid() is null or kind not in ('pages', 'images') then return false; end if;
  insert into public.ai_usage(user_id, month) values (auth.uid(), m) on conflict do nothing;
  if kind = 'pages' then
    update public.ai_usage set pages = pages + 1 where user_id = auth.uid() and month = m and pages < max_count returning pages into v;
  else
    update public.ai_usage set images = images + 1 where user_id = auth.uid() and month = m and images < max_count returning images into v;
  end if;
  return v is not null;
end $$;
revoke all on function public.consume_ai_quota(text, int) from public, anon;
grant execute on function public.consume_ai_quota(text, int) to authenticated;
