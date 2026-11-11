# College Event Portal

Full-stack source for Crescent’s student, organizer and administrator event workflows. **Not deployed and not yet release-accepted.** All ten core modules have source implementations; live backend, real-account, Storage, certificate, camera and email acceptance checks remain blocked by missing authorized service configuration. See [verification status](docs/STATUS.md).

No mock accounts, sample events, dashboard statistics, seeded categories, invented signatories or default administrator are included. The supplied dashboard is a visual reference, not institutional event data.

## Deliverables
- [A — Product specification and workflow gates](docs/01-PRODUCT-AND-PLAN.md)
- [B — UI/UX specification](docs/02-UI-SPECIFICATION.md)
- [C — Architecture, ER diagram and authorization](docs/03-ARCHITECTURE.md)
- D — React/TypeScript source in `src/`; append-only SQL in `supabase/migrations/`; privileged PDF/email handlers in `supabase/functions/`.
- [E — Tests and genuine-account acceptance scenarios](tests/README.md)
- [F — Deployment, configuration and first administrator](docs/04-DEPLOYMENT.md)
- [Netlify deployment map — frontend, Supabase, email and release gates](docs/06-NETLIFY-DEPLOYMENT.md)
- [G — Operations, recovery and limitations](docs/05-OPERATIONS.md)
- [Original complete requirements](docs/ORIGINAL_REQUIREMENTS.md)

## Implemented source
1. Verified college-email signup, login/logout, PKCE confirmation/recovery, session restoration and protected profile editing.
2. Assigned-organizer event forms, poster upload, eligibility configuration, validated lifecycle and cancellation.
3. Administrator-managed categories: create, rename and deactivate without deleting historical references.
4. Event sessions, time bounds, venue-conflict warning and scheduling freeze after attendance begins.
5. Atomic individual/team registration, invitation acceptance, eligibility/capacity checks, duplicate protection, cancellation and FIFO waitlists.
6. Scoped participant search, attendance/status filters and formula-safe CSV exports.
7. Private notifications, actual unread indicator, transactional email outbox, reminder deduplication, leased delivery and retry/dead-letter state.
8. Opaque hashed check-in tokens, camera QR scanner, manual attendance, correction audit, event/session reporting and finalization.
9. Reviewed eligibility, approved-template PDF generation, private signed downloads, random verification identifiers, public minimal verification and revocation.
10. Completed-event participant feedback, rating constraints, one-response uniqueness and authorized summaries.

Also: real SQL dashboard aggregates/Recharts with exact accessible tables; global event search; department, event and session reports; organizer approval requests; user activation and role administration; settings, approved templates, genuine roster entry and issue reporting. **Source presence is not a claim that these journeys passed against real accounts.**

## Run locally
Use Node 24 LTS (validated Node 24.22.1, npm 11.19.1). Dependencies are exact-pinned. Frontend uses React, strict TypeScript, Vite, Tailwind, locally owned shadcn-pattern primitives, Lucide, React Router, RHF/Zod, Recharts and date-fns. Backend uses Supabase Auth/Postgres/RLS/Storage and Deno Edge Functions; no Express service.

```sh
npm ci
cp .env.example .env.local
# Set the real VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
npm run dev
```

Without configuration the app reports unavailable services, disables authentication and shows no substitute records. Production requires HTTPS. No service-role/provider key belongs in Vite variables or browser code.

### Authorized Supabase setup
```sh
npx --no-install supabase login
npx --no-install supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx --no-install supabase db push --dry-run
# Review the actual target, backup and SQL before applying.
npx --no-install supabase db push
npx --no-install supabase secrets set --env-file "$EDGE_SECRETS_FILE"
npx --no-install supabase functions deploy issue-certificate
npx --no-install supabase functions deploy deliver-email
```
Supply actual operator-owned project reference and a private server-only secrets file. Configure required email confirmation, approved Auth SMTP, exact callback/recovery URLs, Resend’s verified sender and an authenticated scheduler. See deployment guide; none are connected automatically.

On a Docker-capable development machine, `supabase start` then `supabase db reset` provisions the full local stack. Docker was unavailable here. Verification instead used genuine PostgreSQL 17.11 and official Supabase Auth v2.197.0 schema/runtime—not a mock Auth table. Storage/API gateway were not emulated. The SQL explicitly reports absent Storage rather than silently creating a fake replacement.

## Checks
```sh
npm run check
# Install matching Playwright Chromium, or set CHROMIUM_PATH to your installed executable.
npm run test:e2e
# Set TEST_DATABASE_URL privately to an actual disposable migrated database.
npm run db:test
# With Deno installed:
deno check --config supabase/functions/deno.json supabase/functions/issue-certificate/index.ts supabase/functions/deliver-email/index.ts
```
Two pure identity tests skip unless `TEST_STUDENT_EMAIL` is the genuine owner-controlled student email. No test creates fictitious business records. The browser suite covers **unconfigured** rendering/security states, not signed-in journeys. Optional existing-account probes and full acceptance scenarios are in the testing guide.

## Important limits
- No deployment, cloud project, real signup, inbox confirmation, multi-user business acceptance or institutional approval has been verified.
- Nonzero event fees are displayed but registration is deliberately blocked until a genuine payment/refund integration is authorized.
- Self-registration is student-only. Faculty/nonstudent identity provisioning requires institution-approved policy and a separate reviewed implementation; no invented faculty identities or bypasses are provided.
- No roster or approved certificate template is supplied. Administrators must enter genuine authorized information. Email control alone does not prove enrollment.
- PDF names are never substituted. Unsupported font characters or overlong unrenderable text fail explicitly; approve an appropriate font/layout before issuance.
- No Auth CAPTCHA integration, load test, recovery drill or monitoring service is configured. Source rate limits and advisory audits are not a penetration test.
