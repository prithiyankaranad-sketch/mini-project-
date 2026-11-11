# Deployment preparation — not deployed

## Environments and secrets
Local/test/staging/production are separate projects. Frontend environment contains only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Publishable keys are not service-role keys. RLS remains essential. Edge Functions receive SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, APP_BASE_URL and verified sender settings via Supabase secrets, not Vercel frontend variables. No actual credentials or deployed domain are included.

## Supabase
1. Authorized owner creates/selects the actual project and saves its reference privately.
2. Confirm the data region, subscription backup/PITR availability, password settings, email confirmation, SMTP sender, Auth redirect URLs and abuse protection. Enable CAPTCHA where appropriate only after real provider configuration and frontend integration; not implemented in this source.
3. Review migration on a disposable project; backup real data before applying. Use README CLI link/dry-run/push sequence and keep migration history in source control.
4. Verify RLS and column grants after deployment. Private schema must not be listed as an exposed API schema.
5. Configure precise Site URL, /auth/callback and /reset-password URLs for the actual owned deployment. Avoid broad wildcard production redirects.
6. Apply every migration in filename order. Full Supabase must provision the private event-posters and certificates buckets. A Storage-absent notice is a blocked release check, not success. Deploy both Edge Functions and verify real authorization and private object behavior.

## Bootstrap an approved administrator
Only a trusted database owner, after independently confirming authorization, may perform this. No invented email/UUID is provided. psql variables are supplied by the operator from the actual verified account. It intentionally does not create a user or bypass email verification.

```sql
-- In a privileged psql session: set approved_user_id to the reviewed real auth user ID.
-- \set approved_user_id ...
begin;
select set_config('portal.approved_user_id', :'approved_user_id', true);
do $$
declare account_id uuid := current_setting('portal.approved_user_id')::uuid;
begin
  if not exists (
    select 1 from auth.users u join public.profiles p on p.id=u.id
    where u.id=account_id and u.email_confirmed_at is not null and p.is_active
      and (u.banned_until is null or u.banned_until <= now())
  ) then raise exception 'A real active, verified profile is required'; end if;
  insert into public.user_roles(user_id,role,granted_by)
  values(account_id,'admin',account_id) on conflict do nothing;
end;
$$;
commit;
```
This assignment is audited by the role trigger; out-of-band owner actions may have NULL auth.uid() actor, so retain the owner's approval/ticket and connection audit evidence. granted_by preserves the reviewed account in this bootstrap. Subsequent organizer grants need the same verified-identity review; no one should elevate themselves through the browser. Faculty/nonstudent provisioning is intentionally not enabled by the student signup trigger and requires an approved separate implementation.

## Vercel / GitHub (manual actions still required)
1. Create an authorized GitHub repository; inspect .gitignore and secret scan before any push. No remote repository exists yet.
2. GitHub Actions configuration runs frontend checks and a full local Supabase database job on a Docker-capable hosted runner. Workflow has not run on GitHub in this environment.
3. Import the repo in Vercel using Vite, Node 24, npm ci and npm run build. Add actual frontend variables per environment. Keep privileged keys out.
4. Review vercel.json CSP for the actual Supabase hostname (custom API domains need explicit connect-src updates). Security headers are configured but not verified on a live HTTP deployment.
5. Use Vercel's actual issued URL after deployment; update Auth Site URL and redirect allowlist. No URL is invented here.
6. Smoke test real signup/inbox confirmation/login/recovery/logout, RLS isolation and private profile update. Event, team/capacity, attendance, certificate, feedback and provider smoke tests remain release blockers until executed with genuine approved accounts.

## Production checklist (all must be checked by actual evidence)
- [ ] All seven phase gates passed; no incomplete module represented as released.
- [ ] Real Supabase project linked and migration history reviewed/applied.
- [ ] RLS tests with actual signed student/organizer/admin sessions.
- [ ] Verified actual sender and successful verification/recovery/delivery.
- [ ] Role approval and enrollment-verification limitations acknowledged.
- [ ] Event/capacity/concurrency/team/waitlist operations tested.
- [ ] Attendance tokens and private certificates audited, issuance/revocation verified.
- [ ] Audit, retry/dead-letter handling and abuse protections verified.
- [ ] Accessibility, dependency/security review, load/performance checks completed.
- [ ] Deployed headers, TLS, SPA navigation and redirect URLs checked.
- [ ] Monitoring and alert ownership assigned; no sensitive tokens in logs.
- [ ] Backups, isolated restore rehearsal and rollback plan tested.
- [ ] All institutional branding, signatories and operational approvals are genuine.

Do not mark unchecked items complete based on the presence of source files.

## Server secrets and Edge Functions
Supabase supplies SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to hosted functions. Set actual APP_BASE_URL, RESEND_API_KEY, RESEND_FROM_EMAIL and a newly generated OUTBOX_WORKER_SECRET through the server secret store. Never put these privileged values into Vite variables, Git or chat. Keep the local secrets file outside the repository, permission 600.

```sh
npx --no-install supabase secrets set --env-file "$EDGE_SECRETS_FILE"
npx --no-install supabase functions deploy issue-certificate
npx --no-install supabase functions deploy deliver-email
```

Both functions disable gateway legacy JWT verification deliberately: issue-certificate verifies the actual bearer using Supabase Auth getUser and invokes authorized caller-scoped SQL; deliver-email requires the scheduler-only bearer secret. Neither trusts a client role field. Browser CORS accepts only the actual APP_BASE_URL origin. No-origin server requests still need the relevant authentication.

PDF generation bundles the genuine Noto Sans font and its SIL license using static_files in config.toml. Run the Deno check; verify the deployed font asset actually loads. Missing glyphs fail rather than changing names. Approve a covering font/layout if the institution needs additional scripts. No signatory details, signature image or template is fabricated.

## Reminder/delivery scheduling
Configure an authorized server scheduler to POST to the actual deployed deliver-email function URL, with Authorization: Bearer OUTBOX_WORKER_SECRET, at an approved interval (for example every minute). Store the real URL/secret in that scheduler's private configuration or Supabase Vault, never a public cron document. No cron job is installed by this repository. Five jobs are claimed per invocation; overlapping workers use row leases/SKIP LOCKED. Measure real volume, rate limits and runtime before choosing scheduler concurrency. Auth confirmation/recovery uses separately configured Auth SMTP; Resend outbox configuration does not automatically configure Auth email.

## Required initialization and release evidence
1. Complete real student signup and inbox confirmation; database owner independently approves and bootstraps the first administrator using the guarded procedure above.
2. Administrator enters actual categories, approved templates/signatories, support email and genuine roster evidence if required. No seed file supplies them.
3. Approve actual organizer requests and assign each actual event explicitly. Confirm unassigned staff cannot access it.
4. Execute tests/README.md student, organizer, privacy/concurrency and deployment journeys. Capture provider/inbox, Storage, PDF, camera and revocation evidence privately, not credentials.
5. Configure actual GitHub and Vercel projects, run CI there, verify the public domain/headers/TLS/redirects and test backups/restore. This environment has not done those external actions.
