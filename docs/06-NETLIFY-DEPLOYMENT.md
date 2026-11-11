# Netlify + Supabase deployment map

## Architecture and current status
Browser → Netlify (React/Vite static frontend) → Supabase (Auth, Postgres, private Storage and Edge Functions). The email Edge Function → Resend. A secure scheduler invokes that function. Supabase Auth confirmation/recovery → separately configured SMTP.

Netlify does not run the SQL migrations or Supabase Edge Functions automatically. No Netlify Functions, paid Netlify database or framework plugin is required for this static frontend. `netlify.toml` provides the build command, publish directory, Node 24, SPA rewrite, security headers and hashed-asset caching. `vercel.json` is retained for the alternative host; Netlify does not use it.

The new Netlify configuration was parsed locally and compared with the existing headers. It has NOT been deployed to Netlify. Existing verification in docs/STATUS.md remains local-only. Do not announce a production launch until genuine-account acceptance checks pass.

## 1 — Collect access and choose the environment
- GitHub repository you own or are authorized to publish to; keep it private initially.
- Netlify account authorized to import that repository.
- A Supabase project authorized for this portal; use a clean staging project first. If it contains data, take and verify a backup and review every migration before applying anything.
- Real Supabase URL and publishable key; actual project reference and database password stored securely.
- Approved sender/domain, SMTP credentials and Resend account. You cannot configure sender DNS for crescent.education without institutional DNS authorization; do not impersonate that domain.
- Authorized genuine student, organizer and administrator accounts and approved content for end-to-end checks.

Use a separate Supabase project for production. Do not connect untrusted pull-request/deploy-preview builds to production credentials or student data.

**Gate:** establish ownership, institutional authorization, data region, backup needs and free-only/student-only scope. Faculty provisioning, payment processing and CAPTCHA integration are not implemented.

## 2 — Prepare the repository locally
Extract the updated source ZIP. Open the folder containing package.json and netlify.toml, not its parent. Install Node 24 and Git, then run:

```sh
node --version
npm ci
npm run check
```

Never upload node_modules, .env.local, database dumps, server-secret files or private student records. .env.example has empty public settings intentionally. Keep package-lock.json, all migrations, supabase/functions/deno.lock, the genuine bundled font and its license. Do not run npm audit fix --force or regenerate dependencies merely to deploy.

If Git is not initialized, run git init. Create an empty private GitHub repository using your own account, then add its actual remote using GitHub's displayed instructions, commit the source and push. Do not copy a fabricated repository URL. Review GitHub Actions results; these jobs have not been run on hosted GitHub in this environment.

**Gate:** npm run check succeeds and no private credentials/data appear in the commit.

## 3 — Create/import the Netlify site
In Netlify, choose the option to import an existing Git repository and authorize only the intended repository. Select your production branch. Labels in the dashboard may vary.

| Setting | Value |
|---|---|
| Base directory | Blank when package.json is at repository root; otherwise the actual subfolder containing it |
| Build command | npm run build |
| Publish directory | dist, relative to the base directory |
| Node version | 24, set by netlify.toml |
| Package installation | Netlify installs dependencies from the committed npm lockfile |
| Functions directory | Not needed; do not point it at supabase/functions |

Set the two frontend environment variables in Netlify, scoped to builds for the intended environment:
- VITE_SUPABASE_URL: actual Supabase project URL.
- VITE_SUPABASE_PUBLISHABLE_KEY: actual project's publishable key.

Do not prefix service-role, SMTP, Resend or scheduler secrets with VITE_. Never add them to this frontend site. Vite embeds VITE_ values into public JavaScript; the publishable key is public by design and requires working RLS.

Deploy and record the exact HTTPS URL Netlify issues. It is acceptable to inspect an unconfigured first build to learn this URL, but do not enable or advertise signup until the backend is ready. Rebuild after adding/changing either VITE_ variable: editing a variable alone does not update an already-built bundle.

**Gate:** deploy log succeeds; home page and directly refreshed /login, /signup and /events load, with no route 404 or horizontal overflow. An unloaded backend is not proof of an empty event database.

## 4 — Apply the Supabase database migrations
Run from the project root on your own trusted computer:

```sh
npx --no-install supabase login
read -r -p 'Actual Supabase project reference: ' SUPABASE_PROJECT_REF
npx --no-install supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx --no-install supabase db push --dry-run
# Stop, inspect the target and review the proposed migration list.
npx --no-install supabase db push
npx --no-install supabase migration list
```

Allow the CLI's secure prompt to request the actual database password if required. Never put it in Git/chat. Apply all eight migrations in filename order; do not execute only the foundation migration or selectively skip failures. A dry run is not a full semantic execution test; perform the actual migration on staging first.

Check that profiles, roles, events, registrations, attendance and certificate tables exist; RLS/grants are installed; the private schema is NOT exposed through the Data API. Confirm the event-posters and certificates Storage buckets exist and are private. Storage-absent migration notices are a release blocker. Never disable RLS or make private buckets public to fix a permission error.

**Gate:** all eight migrations recorded, no failed migration, private buckets/policies present. Execute tests/database/*.sql only against an actual disposable migrated database as instructed by tests/README.md, not casually against production.

## 5 — Configure hosted Supabase Auth
In the hosted Supabase dashboard, configure the actual project's Auth settings. supabase/config.toml's localhost Auth values configure the local stack; do not assume deploying a function updates hosted Auth.

- Enable email/password signup and mandatory email confirmation.
- Set minimum password length to 12 and require upper/lowercase letters, digits and symbols consistently with the app.
- Set Site URL to your exact canonical Netlify/custom-domain HTTPS origin.
- Add that origin's /auth/callback and /reset-password URLs to the redirect allowlist.
- Review email/signup/verification rate limits for approved usage and provider limits.
- Keep production redirects exact; do not permit arbitrary *.netlify.app domains.
- This source uses PKCE. Confirmation/recovery links must be opened in the browser that initiated the operation. Email verification proves inbox control, not institutional enrollment.

Choose one canonical domain. If you later add a custom domain, update Site URL, both allowed redirects and APP_BASE_URL together. Redirect alternate origins to the canonical one, retest all links and allow for links already sent before the change.

**Gate:** hosted settings match the exact issued URL, with HTTPS and no unintentional localhost production redirects.

## 6 — Configure the two email paths
### Auth SMTP
Configure approved custom SMTP in Supabase Auth, using your provider's actual host, port, username/password and verified sender. Use the provider's documented TLS settings. Supabase's default sending service is not a production email solution. Review both Auth and provider quotas. Disable provider email-link tracking where it rewrites/breaks verification links.

### Portal notification email
Verify a domain/sender in Resend using authorized DNS changes. Obtain the actual Resend API key and approved From address. This is used by deliver-email, not automatically by Auth. A Resend API key is not an SMTP host/password configuration.

**Gate:** a genuine approved user's confirmation and password-recovery messages arrive and links work. Record provider acceptance separately from inbox delivery. Never invent mail-delivery evidence.

## 7 — Set Edge secrets and deploy the server functions
Use Supabase's secure Edge Function secret settings to set:

| Secret | Actual required value |
|---|---|
| APP_BASE_URL | Canonical frontend HTTPS origin, without a path |
| RESEND_API_KEY | Authorized Resend API key |
| RESEND_FROM_EMAIL | Provider-approved sender address |
| OUTBOX_WORKER_SECRET | Newly generated high-entropy random scheduler-only secret |

Generate OUTBOX_WORKER_SECRET with your password manager or a cryptographic generator, store it privately, and use the same value only in the Edge secret store and trusted scheduler/Vault. Supabase normally supplies SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to hosted functions; do not expose these privileged runtime settings to Netlify/browser code.

Deploy from the linked project root:

```sh
npx --no-install supabase functions deploy issue-certificate
npx --no-install supabase functions deploy deliver-email
```

Keep the committed config.toml verify_jwt=false settings: these handlers implement their own authentication. issue-certificate verifies the user through Auth and scoped SQL; deliver-email validates the scheduler bearer secret. Disabling the gateway check does NOT mean callers are authorized. Do not replace the scheduler credential with a publishable key.

Confirm the NotoSans font asset declared in static_files is bundled with issue-certificate. Missing/unsupported glyphs fail explicitly. Browser CORS permits only APP_BASE_URL's origin: Netlify preview URLs will not work against these production functions by default. Use separately configured staging, rather than broadening production CORS.

**Gate:** both functions appear deployed; unauthenticated invocations are rejected; an approved genuine user's certificate workflow is authorized and produces an inspectable PDF after eligibility review. Do not claim function deployment alone proves PDF generation.

## 8 — Install an authenticated email scheduler
Use Supabase Cron with pg_cron, pg_net and Vault, or an authorized external scheduler that can keep secrets private. A static Netlify deployment will not run this worker automatically.

Using Supabase's secure Vault interface, save actual values under these names:
- portal_function_origin: the actual project API origin (no path or trailing slash).
- portal_outbox_worker_secret: exactly the OUTBOX_WORKER_SECRET configured above.

Enable Cron/pg_net through your project's supported integrations. Then, in a trusted SQL session, review and schedule the following. The job contains Vault references, not plaintext secret values:

```sql
select cron.schedule(
  'portal-email-worker',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'portal_function_origin') || '/functions/v1/deliver-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets
         where name = 'portal_outbox_worker_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
```

The custom bearer header matches THIS repository's deliver-email handler; do not substitute a generic example using only apikey. Verify each Vault name exists exactly once and restrict secret access. Avoid duplicate jobs; inspect the Cron jobs list before scheduling. One-minute scheduling is a starting cadence, not a volume guarantee; the handler claims up to five jobs per invocation.

**Gate:** Cron executions return successfully, wrong-secret calls return 401, and a notification from an authorized real event reaches its intended recipient. Investigate outbox retries/dead letters rather than retrying indefinitely. No artificial notification records are needed.

## 9 — Bootstrap the approved first administrator
Have the independently approved owner register normally with a genuine 12-digit student college email and complete confirmation. Their UUID in Supabase Auth must match their profile UUID.

Use the guarded privileged psql procedure in docs/04-DEPLOYMENT.md under “Bootstrap an approved administrator”, setting approved_user_id to the actual reviewed account UUID. The procedure refuses unconfirmed/inactive/banned users; it does not create an account. This is database-owner work, never browser JavaScript. Retain authorization/audit evidence. Sign out/in or refresh the account session/profile to confirm the approved admin UI is visible.

Use the admin UI to enter genuine categories, approved institution settings, certificate templates/signatories and any authorized roster evidence. Approve actual organizer requests and explicitly assign real events. Do not fabricate category counts or signatories to make the dashboard look populated.

**Gate:** admin succeeds; genuine ordinary students cannot self-grant roles or read another student's records. Faculty/non-student signup is not implemented and must not be bypassed by altering college-email rules ad hoc.

## 10 — Verify the full staged user journey
Read tests/README.md and execute with consenting real accounts/data:
1. Genuine signup, inbox confirmation, login, reload restoration, logout, recovery and expired-link behavior.
2. Student/organizer/admin role isolation; a second student's records remain private; unassigned organizers are denied.
3. Actual event draft → publish → eligible registration → duplicate rejection → capacity/waitlist → cancellation/promotion. Include accepted-team and competing last-seat checks using authorized participants.
4. Actual event/session attendance through camera and manual paths; repeat scans rejected, corrections audited and finalization honored. Test camera permissions on HTTPS with a real phone.
5. Real approved-template eligible certificate: exact name/body/signatory and date, private signed download, minimal public verification, revocation and no cross-user file access.
6. Feedback permitted only for the eligible confirmed participant after event completion; duplicate responses rejected.
7. Real notifications, email, CSV safety and report totals reconciled against the actual database.
8. Direct-route refreshes and HTTPS/security headers in desktop/mobile browsers; keyboard access and readable errors. Check Netlify's response headers, not just the TOML file.

**Gate:** all required positive and negative journeys pass with recorded evidence; no sample identities or business records substitute for real checks.

## 11 — Production cutover
- Complete staging gates, review institutional permission/privacy and required missing integrations, then back up production before applying migrations there.
- Set Netlify production VITE_ variables to the production Supabase project; rebuild and redeploy.
- Set production Auth URLs, SMTP, Edge secrets, private Storage, functions and scheduler independently; staging setup does not carry over automatically.
- Add the approved custom domain if needed and follow Netlify's exact DNS records. Wait for HTTPS before signup/camera tests. Do not invent DNS targets or overwrite unrelated institutional DNS records.
- Run genuine-account production smoke tests with consent, verify delivery/role isolation, and only then announce launch.
- Assign owners for monitoring, billing/usage limits, backup retention, support, sender reputation and audit review. Perform an isolated restore rehearsal before relying on backups.

**Gate:** production smoke tests and operating/rollback responsibilities signed off. A green Netlify build alone is not launch approval.

## 12 — Updates and rollback
Push reviewed frontend changes through GitHub and inspect Netlify deploy results. Preserve a known-good deploy for frontend rollback. Use backward-compatible SQL changes: rolling back a Netlify deploy does not roll back database schema, Edge Functions, Auth settings or queued email. Never delete migration history or reset a production database to repair a deployment.

## Troubleshooting
| Symptom | Check / safe action |
|---|---|
| Home works, direct /login refresh 404 | netlify.toml at the correct base directory; SPA 200 rewrite actually deployed |
| Banner says Supabase is not configured | Both exact VITE_ names supplied to the build, correct project values, and a new deploy after editing them |
| Invalid key / auth failure | URL and publishable key belong to the same project; no accidental quote/space; consult Auth logs without exposing tokens |
| RPC missing | All eight migrations applied to the project referenced by the frontend |
| Confirmation goes to localhost | Hosted Site URL/allowlist, current frontend origin and link generation; request a fresh link after correcting |
| Works on Netlify domain but not custom domain | Canonical redirect, hosted Auth allowlist and APP_BASE_URL/CORS aligned |
| Signup email never arrives | Custom SMTP, sender verification, spam filtering, provider/Auth rate limits and logs |
| Notification email stuck | Both email-function secrets and matching Vault worker secret, enabled scheduler, leases, retries and provider acceptance logs |
| Certificate fails | Actual approved template, final attendance/eligibility, caller scope, deployed font and private Storage policies; do not disable authorization |
| QR camera unavailable | HTTPS, browser camera permission, supported device and camera=(self) permissions header |
| Preview build fails on Supabase calls | Do not connect untrusted previews to production; use an authorized staging project/origin |

## Official references
- https://docs.netlify.com/build/frameworks/framework-setup-guides/vite
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/schedule-functions
