# Operational guide, recovery and known limitations

## Configuration and failures
- Missing configuration is an explicit unavailable state. Fill real frontend variables and restart Vite; production requires rebuild to change VITE_ variables.
- Signup database error: inspect Supabase Auth/database logs privately for the trigger validation error. Only normalized 12-digit college email, genuine name, department and year 1–6 are supported. Metadata role/RRN is ignored.
- No email: check actual SMTP/provider configuration, verified sender, quota and Auth logs; never turn off email verification to work around delivery.
- Expired/used or different-browser PKCE link: request a new link and open in the requesting browser. If already confirmed, sign in normally.
- Password recovery refreshed away from the PASSWORD_RECOVERY event fails closed: request a fresh link. Gate is memory-only, 15 minutes, not persisted as a forgeable flag.
- Profile unavailable after login: verify email confirmation, active flag, RLS migration, real role rows and JWT freshness. Do not use a service key in the frontend to bypass denial.
- Role change: refresh session/account details, confirm DB assignment. Frontend role navigation is not a substitute for backend checks.
- Browser tests expect no .env.local connection and test unconfigured behavior only. Install matching Playwright Chromium or set CHROMIUM_PATH to an actual installed executable.
- Docker unavailable: the full Supabase CLI local stack cannot start. This environment used a real PostgreSQL server and official GoTrue schema/runtime; this does not prove API gateway/storage or Cloud readiness.

## Backups / restore (procedure, not executed)
Owner first verifies actual Supabase plan, retention, PITR and storage backup coverage. Establish institution-approved RPO/RTO; no institutional recovery targets have been invented. Store encrypted logical backups off-provider with least-privilege access. Keep Auth, application data, role/configuration state and Storage objects in the recovery inventory; a database backup alone does not back up actual Storage file contents.

Rehearse restore into an isolated project without sending production email: restore supported Auth/public schema/data using Supabase's documented process for the project's version; reapply grants, extensions and migration history as needed; verify constraints, RLS and ownership. Never assume a generic pg_dump restores all managed Supabase services. Verify actual counts/checksums privately, real approved account access, certificate object references and application behavior before cutover. Rotate credentials and allowlist only the new owned environment. Record operator, backup timestamps, restore result and exceptions.

## Rollback
Stop deployment promotion if any gate fails. Keep the previous Vercel deployment; switch back only after confirming database compatibility. Migrations are append-only: do not run an automatic DROP rollback against production profiles/Auth users. Prefer a reviewed forward correction for schema/policy defects. If destructive corruption requires restore, pause writes, preserve forensic evidence, restore to a separately verified point/project and perform approved cutover. Revoke exposed credentials immediately rather than merely reverting source. No recovery/rollback drill has run yet.

## Logging/monitoring
Role mutations are logged without credentials. Application ErrorBoundary logs error category, not raw tokens or payloads. Production structured error monitoring, retention, administrator alerts, incident owner must be configured and tested before release; account deactivation controls are implemented but need real-account testing. Local Auth uses no SMTP transport; a health check is not an email-delivery test.

## Security boundaries and limits
- Profile access: self and active verified admins. Organizers cannot browse all profiles. Event participant access is explicit and event-scoped.
- SQL owner privileges necessarily bypass RLS. The operator is a trusted privileged boundary; no browser has those credentials.
- No actual official roster, faculty provisioning, CAPTCHA, mail-provider connection, business data, approved templates or production Storage has been supplied. Admin workflows and minute-window operation limits are implemented but not live-accepted.
- Default Supabase Auth rate limits/password policy must be checked against the actual cloud configuration. config.toml is local configuration, not proof cloud settings were applied.
- npm audit is a dependency advisory check, not a penetration test or proof of no vulnerabilities.
- No full authenticated test passed, no production endpoint exists, and the full requested acceptance criteria are not yet met.

## Event operations troubleshooting
- Registration denied: inspect actual effective status, UTC registration bounds, eligibility, roster requirement, accepted team membership, capacity and queue state. Paid events intentionally remain blocked. Do not change capacity or student identity to force a test through.
- Duplicate scan: inspect the actual event/session attendance record. Use a reasoned audited correction, not deleting history. Camera access requires HTTPS or localhost and browser permission.
- Certificate pending after an error: inspect function/storage logs privately, correct font/template/environment faults, then retry after the five-minute generation lease. Same registration/type retries do not create another certificate. Revoked records cannot be retried into validity. Do not delete/reissue to conceal an approval error.
- Outbox errors: inspect job status/attempt/error, provider quota/sender, scheduler authentication and lease expiry. An HTTP acceptance identifier is not proof the recipient received the email. Retain actual inbox/provider evidence for acceptance.
- Failed jobs after eight attempts or 23 hours require privileged operator review. Before any manual retry, reconcile the actual provider record to avoid duplication outside its idempotency window. There is no one-click blind replay.
- Storage absent notice during migration means release is blocked. Apply on the full authorized Supabase project and check buckets/policies; never create a mock storage schema to suppress it.
