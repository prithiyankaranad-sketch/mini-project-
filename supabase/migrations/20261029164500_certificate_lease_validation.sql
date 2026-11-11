begin;
drop function public.complete_certificate(uuid,text,timestamptz);
create function public.complete_certificate(certificate_id uuid,storage_path text,generation_token uuid,document_issued_at timestamptz default now()) returns void language plpgsql security definer set search_path='' as $$declare c public.certificates;e public.events;begin
 select event_id into strict e.id from public.certificates where id=certificate_id;select * into strict e from public.events where id=e.id for update;select * into strict c from public.certificates where id=certificate_id for update;
 if document_issued_at>now()+interval '1 minute' or document_issued_at<now()-interval '15 minutes' then raise exception 'Certificate document timestamp is stale';end if;
 if storage_path<>c.user_id::text||'/'||c.id::text||'.pdf' then raise exception 'Invalid private certificate path';end if;
 if c.status='issued' and c.object_path=storage_path then return;end if;
 if c.generation_lease_until<now() or c.generation_lease is null or c.generation_lease is distinct from generation_token then raise exception 'Certificate generation lease expired';end if;
 if c.status<>'pending' or e.status<>'completed' or not e.attendance_finalized or private.attendance_percent(c.registration_id)<e.certificate_attendance_percent or not exists(select 1 from public.registrations where id=c.registration_id and status='confirmed') then raise exception 'Certificate finalization denied';end if;
 update public.certificates set object_path=storage_path,status='issued',issued_at=document_issued_at where id=c.id;perform private.audit('certificate.issued',c.id,jsonb_build_object('approved_by',c.approved_by));perform private.notify(c.user_id,c.event_id,'Certificate available','Your approved certificate is ready to download.','certificate:'||c.id);end;$$;
revoke all on function public.complete_certificate(uuid,text,uuid,timestamptz) from public,anon,authenticated;grant execute on function public.complete_certificate(uuid,text,uuid,timestamptz) to service_role;
commit;
