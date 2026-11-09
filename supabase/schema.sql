-- Run this entire file in the Supabase SQL Editor as the project owner.
-- Re-running preserves existing topics, applications, settings, and admins.
begin;
create extension if not exists pgcrypto;

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null check (char_length(btrim(description)) between 20 and 5000),
  deadline timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  age integer not null check (age between 15 and 99),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  whatsapp text not null check (whatsapp ~ '^212[67][0-9]{8}$'),
  message text not null check (char_length(btrim(message)) between 20 and 5000),
  instagram text check (instagram is null or instagram ~ '^[a-zA-Z0-9._]{1,30}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (topic_id, whatsapp)
);
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- Additive upgrades: existing topics and applications keep their data.
alter table public.topics add column if not exists kind text not null default 'weekly';
alter table public.topics add column if not exists weekday integer;
alter table public.topics add column if not exists image_url text;
alter table public.topics add column if not exists badge text;
alter table public.topics add column if not exists accent_color text;
alter table public.topics add column if not exists sort_order integer not null default 0;
alter table public.topics add column if not exists form_fields jsonb not null default '[]'::jsonb;
alter table public.applications add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.topics drop constraint if exists topics_kind_check;
alter table public.topics add constraint topics_kind_check check (kind in ('weekly', 'special'));
alter table public.topics drop constraint if exists topics_weekday_check;
alter table public.topics add constraint topics_weekday_check check (weekday between 1 and 5);
alter table public.topics drop constraint if exists topics_accent_check;
alter table public.topics add constraint topics_accent_check check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$');
alter table public.applications drop constraint if exists applications_extra_check;
alter table public.applications add constraint applications_extra_check check (jsonb_typeof(extra) = 'object' and octet_length(extra::text) <= 65536);

create table if not exists public.schedule_days (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null unique check (weekday between 1 and 5),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  title_ar text not null check (char_length(btrim(title_ar)) between 2 and 160),
  description text not null check (char_length(btrim(description)) between 10 and 500),
  emoji text not null check (char_length(emoji) between 1 and 20),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  is_enabled boolean not null default true
);
create table if not exists public.clinic_team (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  role text not null check (char_length(btrim(role)) between 2 and 160),
  bio text not null check (char_length(btrim(bio)) between 10 and 1000),
  photo_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create or replace function public.valid_topic_fields(definition jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare field jsonb; choice jsonb; field_key text; keys text[] := '{}';
begin
  if jsonb_typeof(definition) is distinct from 'array' then return false; end if;
  if jsonb_array_length(definition) > 12 then return false; end if;
  for field in select value from jsonb_array_elements(definition) loop
    if jsonb_typeof(field) is distinct from 'object'
      or jsonb_typeof(field->'key') is distinct from 'string'
      or jsonb_typeof(field->'label') is distinct from 'string'
      or jsonb_typeof(field->'required') is distinct from 'boolean'
      or jsonb_typeof(field->'type') is distinct from 'string' then return false; end if;
    field_key := field->>'key';
    if field_key !~ '^[a-z][a-z0-9_]{0,39}$' or field_key = any(keys)
      or field_key = any(array['full_name','age','city','whatsapp','instagram','topic_id','website','status','extra','constructor','prototype'])
      or char_length(btrim(field->>'label')) not between 2 and 160
      or field->>'type' not in ('text','textarea','select') then return false; end if;
    keys := array_append(keys, field_key);
    if field_key = 'message' and (field->>'type' <> 'textarea' or field->>'required' <> 'true') then return false; end if;
    if field ? 'options' then
      if jsonb_typeof(field->'options') is distinct from 'array' then return false; end if;
      if jsonb_array_length(field->'options') > 12 then return false; end if;
      for choice in select value from jsonb_array_elements(field->'options') loop
        if jsonb_typeof(choice) is distinct from 'string' or char_length(btrim(choice #>> '{}')) not between 1 and 100 then return false; end if;
      end loop;
    end if;
    if field->>'type' = 'select' then
      if not (field ? 'options') then return false; end if;
      if jsonb_array_length(field->'options') < 2 then return false; end if;
      if (select count(distinct value) from jsonb_array_elements(field->'options')) <> jsonb_array_length(field->'options') then return false; end if;
    end if;
  end loop;
  return true;
end;
$$;
alter table public.topics drop constraint if exists topics_form_fields_check;
alter table public.topics add constraint topics_form_fields_check check (public.valid_topic_fields(form_fields));

create or replace function public.valid_application_extra(definition jsonb, answers jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare field jsonb; item record; answer text; minimum integer; maximum integer;
begin
  if not public.valid_topic_fields(definition) or jsonb_typeof(answers) is distinct from 'object' then return false; end if;
  if octet_length(answers::text) > 65536 then return false; end if;
  for item in select key, value from jsonb_each(answers) loop
    if jsonb_typeof(item.value) is distinct from 'string' or not exists (
      select 1 from jsonb_array_elements(definition) f where f->>'key' = item.key and item.key <> 'message'
    ) then return false; end if;
  end loop;
  for field in select value from jsonb_array_elements(definition) loop
    if field->>'key' = 'message' then continue; end if;
    answer := btrim(coalesce(answers->>(field->>'key'), ''), E' \t\n\r');
    if answer = '' and field->>'required' = 'false' then continue; end if;
    minimum := case when field->>'type' = 'textarea' then 20 else 1 end;
    maximum := case when field->>'type' = 'textarea' then 5000 else 500 end;
    if char_length(answer) not between minimum and maximum then return false; end if;
    if field->>'type' = 'select' and not ((field->'options') ? answer) then return false; end if;
  end loop;
  return true;
end;
$$;
create index if not exists applications_topic_created_idx on public.applications(topic_id, created_at desc);
create index if not exists applications_status_created_idx on public.applications(status, created_at desc);
create index if not exists applications_phone_created_idx on public.applications(whatsapp, created_at desc);
create index if not exists topics_active_created_idx on public.topics(is_active, created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- Expose only a boolean. Non-admins cannot enumerate the admins table.
create or replace function public.first_admin_available()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and not exists (select 1 from public.admins);
$$;

create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = '' as $$
declare claimant uuid := (select auth.uid());
begin
  if claimant is null then return false; end if;
  -- Serialize claims even when the table has no rows to lock.
  lock table public.admins in share row exclusive mode;
  if exists (select 1 from public.admins) then return false; end if;
  insert into public.admins(user_id) values (claimant);
  return true;
end;
$$;

-- This guard also applies to direct REST inserts and across server instances.
create or replace function public.guard_application_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare definition jsonb;
begin
  select form_fields into definition from public.topics where id = new.topic_id;
  if definition is null or not public.valid_application_extra(definition, new.extra) then
    raise exception 'invalid_extra_answers' using errcode = '23514';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.whatsapp, 0));
  if (select count(*) from public.applications
      where whatsapp = new.whatsapp and created_at > now() - interval '15 minutes') >= 3 then
    raise exception 'application_rate_limit' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end;
$$;

-- Atomic reordering also handles pre-existing topics whose sort_order values tie.
create or replace function public.reorder_topic(p_topic_id uuid, p_direction integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare ids uuid[]; current_position integer; next_position integer; swap_id uuid;
begin
  if not public.is_admin() then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_direction not in (-1, 1) or p_direction is null then return false; end if;
  lock table public.topics in share row exclusive mode;
  select array_agg(id order by sort_order, created_at desc, id) into ids from public.topics;
  current_position := array_position(ids, p_topic_id);
  next_position := current_position + p_direction;
  if current_position is null or next_position < 1 or next_position > array_length(ids, 1) then return false; end if;
  swap_id := ids[current_position]; ids[current_position] := ids[next_position]; ids[next_position] := swap_id;
  update public.topics t set sort_order = ordered.position::integer
    from unnest(ids) with ordinality as ordered(id, position) where t.id = ordered.id;
  return true;
end;
$$;
drop trigger if exists application_insert_guard on public.applications;
create trigger application_insert_guard before insert on public.applications
  for each row execute function public.guard_application_insert();

-- Counts are aggregated in Postgres, so they are not truncated by REST row limits.
create or replace function public.admin_application_counts()
returns table(topic_id uuid, total bigint, pending bigint, accepted bigint, rejected bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admin_required' using errcode = '42501'; end if;
  return query
    select a.topic_id, count(*),
      count(*) filter (where a.status = 'pending'),
      count(*) filter (where a.status = 'accepted'),
      count(*) filter (where a.status = 'rejected')
    from public.applications a group by grouping sets ((a.topic_id), ());
end;
$$;

alter table public.topics enable row level security;
alter table public.applications enable row level security;
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.schedule_days enable row level security;
alter table public.clinic_team enable row level security;

drop policy if exists topics_public_read on public.topics;
create policy topics_public_read on public.topics for select to anon, authenticated
  using (is_active and (deadline is null or deadline > now()));
drop policy if exists topics_admin_all on public.topics;
create policy topics_admin_all on public.topics for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists applications_public_insert on public.applications;
create policy applications_public_insert on public.applications for insert to anon, authenticated
  with check (status = 'pending' and exists (
    select 1 from public.topics t where t.id = topic_id and t.is_active and (t.deadline is null or t.deadline > now())
  ));
drop policy if exists applications_admin_select on public.applications;
create policy applications_admin_select on public.applications for select to authenticated using ((select public.is_admin()));
drop policy if exists applications_admin_update on public.applications;
create policy applications_admin_update on public.applications for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists applications_admin_delete on public.applications;
create policy applications_admin_delete on public.applications for delete to authenticated using ((select public.is_admin()));

drop policy if exists admins_admin_read on public.admins;
create policy admins_admin_read on public.admins for select to authenticated using ((select public.is_admin()));
-- No direct INSERT/UPDATE/DELETE policy for admins. Bootstrap only via claim_first_admin.
drop policy if exists settings_admin_all on public.settings;
create policy settings_admin_all on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists settings_programme_public_read on public.settings;
create policy settings_programme_public_read on public.settings for select to anon, authenticated using (key = 'programme_image');
drop policy if exists schedule_public_read on public.schedule_days;
create policy schedule_public_read on public.schedule_days for select to anon, authenticated using (is_enabled);
drop policy if exists schedule_admin_all on public.schedule_days;
create policy schedule_admin_all on public.schedule_days for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists clinic_public_read on public.clinic_team;
create policy clinic_public_read on public.clinic_team for select to anon, authenticated using (is_active);
drop policy if exists clinic_admin_all on public.clinic_team;
create policy clinic_admin_all on public.clinic_team for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.topics, public.applications, public.admins, public.settings from anon, authenticated;
grant select on public.topics to anon, authenticated;
grant insert, update, delete on public.topics to authenticated;
grant insert (topic_id, full_name, age, city, whatsapp, message, instagram, status, extra) on public.applications to anon, authenticated;
grant select, update, delete on public.applications to authenticated;
grant select on public.admins to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select on public.settings to anon;
revoke all on public.schedule_days, public.clinic_team from anon, authenticated;
grant select on public.schedule_days, public.clinic_team to anon, authenticated;
grant insert, update, delete on public.schedule_days, public.clinic_team to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.first_admin_available() from public, anon;
grant execute on function public.first_admin_available() to authenticated;
revoke all on function public.claim_first_admin() from public, anon;
grant execute on function public.claim_first_admin() to authenticated;
revoke all on function public.admin_application_counts() from public, anon;
grant execute on function public.admin_application_counts() to authenticated;
revoke all on function public.guard_application_insert() from public, anon, authenticated;
revoke all on function public.reorder_topic(uuid, integer) from public, anon;
grant execute on function public.reorder_topic(uuid, integer) to authenticated;
revoke all on function public.valid_topic_fields(jsonb), public.valid_application_extra(jsonb, jsonb) from public;
grant execute on function public.valid_topic_fields(jsonb), public.valid_application_extra(jsonb, jsonb) to authenticated;

-- Public images; every write requires a logged-in admin. No service-role key.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('topic-images', 'topic-images', true, 3145728, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
update storage.buckets set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'topic-images';
drop policy if exists topic_images_public_read on storage.objects;
create policy topic_images_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'topic-images');
drop policy if exists topic_images_admin_insert on storage.objects;
create policy topic_images_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'topic-images' and (select public.is_admin()));
drop policy if exists topic_images_admin_update on storage.objects;
create policy topic_images_admin_update on storage.objects for update to authenticated using (bucket_id = 'topic-images' and (select public.is_admin())) with check (bucket_id = 'topic-images' and (select public.is_admin()));
drop policy if exists topic_images_admin_delete on storage.objects;
create policy topic_images_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'topic-images' and (select public.is_admin()));
-- Restrictive guards prevent unrelated pre-existing permissive Storage policies
-- from granting non-admin writes to this bucket. Other buckets are unaffected.
drop policy if exists topic_images_insert_guard on storage.objects;
create policy topic_images_insert_guard on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'topic-images' or (select public.is_admin()));
drop policy if exists topic_images_update_guard on storage.objects;
create policy topic_images_update_guard on storage.objects as restrictive for update to anon, authenticated
  using (bucket_id <> 'topic-images' or (select public.is_admin())) with check (bucket_id <> 'topic-images' or (select public.is_admin()));
drop policy if exists topic_images_delete_guard on storage.objects;
create policy topic_images_delete_guard on storage.objects as restrictive for delete to anon, authenticated
  using (bucket_id <> 'topic-images' or (select public.is_admin()));

delete from public.clinic_team where id in ('c4f621a2-7bf2-4215-8c32-cb2a06cd0002', 'c4f621a2-7bf2-4215-8c32-cb2a06cd0003');
insert into public.topics(id, title, description) values
 ('a4f621a2-7bf2-4215-8c32-cb2a06cd0001', 'الغربة: الحلم والواقع', 'خرجتي من المغرب باش تقلب على فرصة جديدة؟ بين الحلم والواقع، شنو تبدل؟ حكي لينا على البداية والتضحيات وداكشي اللي علماتك الغربة.'),
 ('a4f621a2-7bf2-4215-8c32-cb2a06cd0002', 'بديت من الزيرو، ونتا؟', 'مشروع صغير، تبديل الخدمة، ولا بداية جديدة فالحياة. إلا عاودتي بديتي من الزيرو، بغينا نسمعو كيفاش لقيتي الشجاعة وشنو تعلمتي فالطريق.'),
 ('a4f621a2-7bf2-4215-8c32-cb2a06cd0003', 'السوشيال ميديا والحياة الحقيقية', 'بين الستوري واللايكات والفيلترات، فين كاينة الحياة الحقيقية؟ إلا السوشيال ميديا بدلات فيك شي حاجة، مزيانة ولا خايبة، أجي نهضرو على التجربة ديالك.')
on conflict (id) do update set title = excluded.title, description = excluded.description;
insert into public.settings(key, value) values (
 'whatsapp_template', 'سلام {name}، تقبلنا ليك فموضوع "{topic}" ️ بغينا نهضرو معاك. جاوبنا هنا باش نتفاهمو على الوقت.'
) on conflict (key) do update set value = excluded.value;
insert into public.settings(key, value) values ('programme_image', '/programme.jpeg') on conflict (key) do nothing;

insert into public.schedule_days(weekday, title, title_ar, description, emoji, color) values
 (1, 'قصص مع السعاية والمتسولين', 'قصص مع السعاية والمتسولين', 'حكايات من الزنقة وتجارب ووجوه خاصنا نسمعو ليهم.', '🤲', '#e5232b'),
 (2, 'الاكتئاب', 'الاكتئاب', 'نهضرو على المشاعر والوحدة والهضرة اللي كتخفف.', '🌧️', '#ff8a00'),
 (3, 'الحمام المغربي', 'الحمام المغربي', 'بين الكيس والبرمة، كل واحد عندو شي حكاية.', '🧼', '#9b30ff'),
 (4, 'طاكسي وتطبيقات النقل، كل خميس الخدمة', 'طاكسي وتطبيقات الترونسبور', 'الشوفيرية والكليان والتطبيقات: الهضرة على الطريق.', '🚕', '#ffd400'),
 (5, 'عيادة الحب مع بلال', 'عيادة الحب مع بلال', 'القلب كيشكي؟ الاستقبال محلول، أجي حكي لينا.', '💚', '#22c55e')
on conflict (weekday) do update set title = excluded.title, title_ar = excluded.title_ar, description = excluded.description, emoji = excluded.emoji, color = excluded.color;

insert into public.topics(id, title, description, kind, weekday, image_url, badge, accent_color, sort_order, form_fields) values
 ('a4f621a2-7bf2-4215-8c32-cb2a06cd0010', 'المحكمة', 'عندك خلاف مع شي واحد؟ طلع نتا وهو، وبلال غادي يحكم بيناتكم ⚖️', 'special', null, '/m7kama-poster.jpeg', 'LIVE', '#ffc94a', -20,
  '[{"key":"opponent","label":"شكون هو الخصم / الطرف الثاني؟","type":"text","required":true},{"key":"message","label":"شنو كان الخلاف؟ (شرح بالتفصيل)","type":"textarea","required":true}]'::jsonb),
 ('a4f621a2-7bf2-4215-8c32-cb2a06cd0011', 'عيادة الحب', 'عندك مشكل عاطفي ولا علاقاتي وحاير ودايخ وبغيتي تلقا الحل، مرحبا بيك.', 'special', 5, null, 'الجمعة', '#22c55e', -10,
  '[{"key":"message","label":"شنو المشكل ديال الحب ديالك؟","type":"textarea","required":true},{"key":"relationship","label":"شنو الحالة ديالك (عازب/مخطوب/فعلاقة/متفرقين)","type":"select","required":true,"options":["عازب","مخطوب","فعلاقة","متفرقين"]}]'::jsonb)
on conflict (id) do update set title=excluded.title, description=excluded.description, kind=excluded.kind, weekday=excluded.weekday, image_url=excluded.image_url, badge=excluded.badge, accent_color=excluded.accent_color, form_fields=excluded.form_fields;

insert into public.clinic_team(id, name, role, bio, sort_order) values
 ('c4f621a2-7bf2-4215-8c32-cb2a06cd0001', 'د. بلال', 'طبيب الحب النفسي', 'متخصص فالكراشات اللي ما كيجاوبوش. الوصفة ديالو: شوية ديال الهضرة وبزاف ديال الضحك.', 1)
on conflict (id) do update set name=excluded.name, role=excluded.role, bio=excluded.bio;
commit;
