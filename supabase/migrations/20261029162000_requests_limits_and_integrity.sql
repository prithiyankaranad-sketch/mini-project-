begin;
create table public.organizer_requests(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),reason text not null check(char_length(btrim(reason)) between 20 and 3000),status text not null default 'pending' check(status in('pending','approved','rejected')),reviewed_by uuid references public.profiles(id),review_note text,created_at timestamptz not null default now(),reviewed_at timestamptz);
create unique index organizer_request_pending on public.organizer_requests(user_id) where status='pending';
create table public.support_issues(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),subject text not null check(char_length(btrim(subject)) between 5 and 160),description text not null check(char_length(btrim(description)) between 20 and 5000),status text not null default 'open' check(status in('open','reviewed','resolved')),resolution text,reviewed_by uuid references public.profiles(id),created_at timestamptz not null default now());
create index support_issues_created on public.support_issues(created_at desc);
create table private.operation_limits(user_id uuid not null,operation text not null,bucket_start timestamptz not null default date_trunc('minute',now()),attempts integer not null default 1,primary key(user_id,operation));
alter table public.organizer_requests enable row level security;alter table public.support_issues enable row level security;alter table private.operation_limits enable row level security;
revoke all on public.organizer_requests,public.support_issues from anon,authenticated;
create function private.consume_limit(op text) returns void language plpgsql security definer set search_path='' as $$declare tries integer;begin
 insert into private.operation_limits(user_id,operation) values(auth.uid(),op) on conflict(user_id,operation) do update set attempts=case when operation_limits.bucket_start<date_trunc('minute',now()) then 1 else operation_limits.attempts+1 end,bucket_start=date_trunc('minute',now()) returning attempts into tries;
 if tries>(case when op in('event_message','team_invite','request_organizer','support_report') then 5 else 60 end) then raise exception 'Too many operations. Try again after one minute.' using errcode='54000';end if;end;$$;
-- Wrap existing command/read RPCs, preserving their independent authorization.
alter function public.portal_command(text,jsonb) rename to portal_command_core;
revoke all on function public.portal_command_core(text,jsonb) from public,anon,authenticated;
alter function public.portal_read(text,jsonb) rename to portal_read_core;
revoke all on function public.portal_read_core(text,jsonb) from public,anon,authenticated;
create function public.portal_command(operation text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$declare actor uuid:=private.require_actor();rid uuid;request public.organizer_requests;begin
 perform private.consume_limit(operation);
 if operation='request_organizer' then insert into public.organizer_requests(user_id,reason) values(actor,payload->>'reason') returning id into rid;return jsonb_build_object('id',rid);
 elsif operation='review_organizer' then if not private.has_role('admin') then raise exception 'Admin required';end if;select * into strict request from public.organizer_requests where id=(payload->>'id')::uuid and status='pending' for update;
 if request.user_id=actor then raise exception 'Cannot approve own request';end if;if char_length(btrim(coalesce(payload->>'note','')))<10 then raise exception 'Review note required';end if;
 if (payload->>'approve')::boolean then perform public.portal_command_core('role_set',jsonb_build_object('user_id',request.user_id,'role','organizer','enabled',true));end if;
 update public.organizer_requests set status=case when(payload->>'approve')::boolean then 'approved' else 'rejected' end,reviewed_by=actor,review_note=payload->>'note',reviewed_at=now() where id=request.id;perform private.audit(operation,request.id);return '{}';
 elsif operation='support_report' then insert into public.support_issues(user_id,subject,description) values(actor,payload->>'subject',payload->>'description') returning id into rid;return jsonb_build_object('id',rid);
 elsif operation='support_resolve' then if not private.has_role('admin') then raise exception 'Admin required';end if;if char_length(btrim(coalesce(payload->>'resolution','')))<10 then raise exception 'Resolution note required';end if;update public.support_issues set status='resolved',resolution=payload->>'resolution',reviewed_by=actor where id=(payload->>'id')::uuid;perform private.audit(operation,(payload->>'id')::uuid);return '{}';
 else return public.portal_command_core(operation,payload);end if;end;$$;
create function public.portal_read(resource text,args jsonb default '{}') returns jsonb language plpgsql stable security definer set search_path='' as $$declare actor uuid:=private.require_actor();result jsonb;page_no integer:=greatest(0,least(coalesce((args->>'page')::integer,0),100000));begin
 if resource='organizer_requests' then select coalesce(jsonb_agg(to_jsonb(q)),'[]') into result from(select r.*,p.full_name,p.email from public.organizer_requests r join public.profiles p on p.id=r.user_id where(private.has_role('admin') or r.user_id=actor) order by r.created_at desc limit 50 offset page_no*50)q;return result;
 elsif resource='support_issues' then select coalesce(jsonb_agg(to_jsonb(q)),'[]') into result from(select * from public.support_issues where private.has_role('admin') or user_id=actor order by created_at desc limit 50 offset page_no*50)q;return result;
 else return public.portal_read_core(resource,args);end if;end;$$;
revoke all on function public.portal_command(text,jsonb),public.portal_read(text,jsonb) from public,anon;grant execute on function public.portal_command(text,jsonb),public.portal_read(text,jsonb) to authenticated;
revoke all on function private.consume_limit(text) from public,anon,authenticated;
-- Validate immutable foreign relationships and keep eligibility evidence consistent.
create function private.certificate_integrity() returns trigger language plpgsql set search_path='' as $$begin
 if not exists(select 1 from public.registrations r where r.id=new.registration_id and r.user_id=new.user_id and r.event_id=new.event_id) then raise exception 'Certificate identity does not match registration';end if;return new;end;$$;
create trigger certificate_identity before insert or update on public.certificates for each row execute function private.certificate_integrity();
revoke all on function private.certificate_integrity() from public;
-- A pre-existing bucket must not accidentally remain public.
do $$begin if to_regclass('storage.buckets') is not null then update storage.buckets set public=false where id in('event-posters','certificates');end if;end;$$;
commit;
