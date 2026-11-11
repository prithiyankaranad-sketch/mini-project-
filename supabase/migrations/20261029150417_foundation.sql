begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('student','organizer','admin');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(btrim(email)) and email ~ '^[0-9]{12}@crescent[.]education$'),
  rrn text not null unique check (rrn ~ '^[0-9]{12}$' and split_part(email,'@',1) = rrn),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  department text not null check (char_length(btrim(department)) between 2 and 120),
  study_year smallint not null check (study_year between 1 and 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_role_idx on public.user_roles(role);
create index user_roles_granted_by_idx on public.user_roles(granted_by);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  subject_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_subject_idx on public.audit_logs(subject_id);

-- No user parameter: callers can ask only about the trusted current JWT subject.
create function private.is_active_verified() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.is_active and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= now())
  );
$$;
create function private.has_role(wanted public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_active_verified() and exists (
    select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = wanted
  );
$$;
revoke all on function private.is_active_verified() from public;
revoke all on function private.has_role(public.app_role) from public;
grant execute on function private.is_active_verified(), private.has_role(public.app_role) to authenticated;

create function private.create_student_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  normalized text := lower(btrim(new.email));
  person_name text := btrim(new.raw_user_meta_data ->> 'full_name');
  dept text := btrim(new.raw_user_meta_data ->> 'department');
  year_text text := new.raw_user_meta_data ->> 'study_year';
begin
  if normalized is null or normalized !~ '^[0-9]{12}@crescent[.]education$' then
    raise exception 'A 12-digit Crescent student email is required' using errcode = '23514';
  end if;
  if person_name is null or char_length(person_name) not between 2 and 120
    or dept is null or char_length(dept) not between 2 and 120
    or year_text is null or year_text !~ '^[1-6]$' then
    raise exception 'Valid name, department and study year are required' using errcode = '23514';
  end if;
  insert into public.profiles(id,email,rrn,full_name,department,study_year)
  values (new.id,normalized,split_part(normalized,'@',1),person_name,dept,year_text::smallint);
  -- Never trust a role or RRN supplied through raw_user_meta_data.
  insert into public.user_roles(user_id,role) values(new.id,'student');
  return new;
end;
$$;
revoke all on function private.create_student_profile() from public;
create trigger auth_user_created after insert on auth.users
for each row execute function private.create_student_profile();

create function private.prevent_identity_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if lower(btrim(new.email)) is distinct from lower(btrim(old.email)) then
    raise exception 'Student email changes require an approved identity migration' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_identity_change() from public;
create trigger auth_email_immutable before update of email on auth.users
for each row execute function private.prevent_identity_change();

create function private.protect_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('postgres','supabase_admin') and (
    new.id is distinct from old.id or new.email is distinct from old.email
    or new.rrn is distinct from old.rrn or new.is_active is distinct from old.is_active
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Protected identity fields cannot be changed' using errcode = '42501';
  end if;
  new.full_name := btrim(new.full_name);
  new.department := btrim(new.department);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.protect_profile() from public;
create trigger profile_update_guard before update on public.profiles
for each row execute function private.protect_profile();

create function private.audit_role_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_logs(actor_id,subject_id,action,details)
    values(auth.uid(),old.user_id,'role.revoked',jsonb_build_object('role',old.role));
    return old;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs(actor_id,subject_id,action,details)
    values(auth.uid(),new.user_id,'role.updated',jsonb_build_object('previous_role',old.role,'role',new.role));
  else
    insert into public.audit_logs(actor_id,subject_id,action,details)
    values(auth.uid(),new.user_id,'role.granted',jsonb_build_object('role',new.role));
  end if;
  return new;
end;
$$;
revoke all on function private.audit_role_change() from public;
create trigger role_change_audit after insert or update or delete on public.user_roles
for each row execute function private.audit_role_change();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- Remove broad default grants. No INSERT/DELETE policies for browser accounts.
revoke all on public.profiles, public.user_roles, public.audit_logs from anon, authenticated;
grant select on public.profiles,public.user_roles,public.audit_logs to authenticated;
grant update(full_name,department,study_year) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
using (private.is_active_verified() and (id = (select auth.uid()) or private.has_role('admin')));
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid()) and private.is_active_verified())
with check (id = (select auth.uid()) and private.is_active_verified());
create policy roles_select on public.user_roles for select to authenticated
using (private.is_active_verified() and (user_id = (select auth.uid()) or private.has_role('admin')));
create policy audit_select on public.audit_logs for select to authenticated
using (private.has_role('admin'));

-- All omitted operations intentionally DENY (no permissive policy and no grants).
comment on table public.profiles is 'Email control verified by Supabase Auth; no official enrollment roster verification asserted.';
comment on table public.user_roles is 'Only trusted database-owner administration can assign roles in Phase 1.';
commit;
