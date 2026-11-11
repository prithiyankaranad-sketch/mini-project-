# Product specification and gated implementation plan

## Goal and users
A secure institutional event portal for Crescent students, explicitly authorized organizers, and administrators. Institutional name is supplied by the project owner; branding use, deployment, approvals, signatories, official roster, and ownership of third-party accounts have not been verified. No institutional records are invented. The supplied dashboard image is a visual reference only.

## Workflows
- Student: college-email signup → verification of email control → public discovery → eligibility and capacity checks → atomic registration → notification → authorized attendance → reviewed certificate → feedback.
- Organizer: administrative role approval → explicit event assignment → draft and sessions → publication → participants and communications → attendance finalization → reviewed issuance → reports.
- Administrator: approved role assignment/revocation, categories, institutional reporting, settings and audit review.

## Non-negotiable rules
Exactly 12 digits at crescent.education, normalized before validation. RRN is derived, string-valued, unique and not student-editable. Email verification proves control only, not enrollment. No roster records are supplied; authorized administrators can enter actual official roster evidence. No signup role input is accepted. Authorization uses trusted database assignments and verified, active users. No frontend service-role credential. UTC timestamps, Asia/Kolkata display. No sample users/events, hardcoded metrics, seed records, fake credentials, pretend signatories, or fabricated deployment URLs.

## Decisions and assumptions
- Public events are read-only without login; private data requires verified auth. Multi-role users can use each assigned role; no implied organizer ownership.
- Protected identity changes need a future administrator-led, audited process; self-service email/RRN changes are blocked.
- Self-registration is student-only. Actual faculty identity provisioning requires a separate approved workflow, not a bypass of student email rules.
- Password policy: 12–128 characters, with upper/lower case, a digit and a symbol. Configure Supabase to the same policy. Enable leaked-password protection where the subscription supports it.
- Payment processing is excluded until an authorized provider and refund policy are supplied. Nonzero fees must not be presented as collected.
- Default events are free, individual, no waitlist unless explicitly enabled. Capacity unit is seats (one per participant, including each team member). Team registration reserves all member seats atomically after all invitations are accepted and member eligibility is checked.
- No default administrator exists. A database owner bootstraps one existing verified real account through a reviewed SQL operation.
- Cancellation cutoff, eligibility departments/years, certificate attendance threshold, attendance finalization and feedback requirements are explicit per-event settings, not guessed institutional policy.

## Implementation order and gates
| Phase | Implementation | Verification required before next phase |
|---|---|---|
| 1 Foundation | repository, strict React/TS, Vite, Tailwind, shadcn-style primitives, Supabase Auth integration, profiles, roles, migrations, RLS | type/unit/browser checks; PostgreSQL migration/permissions; real Supabase signup, verified-email login, recovery, multi-user RLS and role escalation checks |
| 2 Events | categories, authorized ownership, event form/lifecycle, publication, public discovery, sessions, search/pagination | CRUD, date/state constraints, event authorization, responsive event views |
| 3 Registration | row-lock transaction, eligibility, unique seats, cancellation, FIFO waitlists, team invitations | simultaneous capacity tests, idempotency, duplicate prevention, cancellation/promotion, cross-user denial |
| 4 Communication | private notifications, transactional outbox, server-only Resend, reminders and retry worker | signed/authorized invocation, retry/idempotency, provider delivery to actual approved recipient |
| 5 Operations | opaque QR tokens, manual attendance, corrections, eligibility review, private PDF certificates, revocation/verification | scanner/manual permissions, duplicate rejection, session consistency, PDF privacy and revocation |
| 6 Feedback/analytics | participant-only feedback, server-side aggregates, reports and safe CSV | eligibility/uniqueness, privacy, query counts against real data, export authorization and formula-injection safety |
| 7 Release | security and complete journeys, performance/a11y, deployment and operational docs | CI, live smoke tests, provider identities, backups, restore and rollback drill |

Each phase must record completed work, remaining work, actual commands/results, and limitations in docs/STATUS.md. A failed or unavailable required check is a blocked gate, not a pass. After the owner requested the remaining source, all module code was implemented without representing unavailable live gates as passed. The release gate remains blocked. Full requested source, production deployment and journeys A/B/C remain acceptance requirements.

## Deliverables and acceptance tracking
A: this product/plan; B: UI specification; C: architecture/ER diagram and actual migrations; D: all ten modules and required application routes; E: local checks plus genuine-account acceptance scenarios; F: deployment configuration/instructions; G: documentation. Code implementation and live verification are separately tracked in STATUS.md. None of the blocked live checks is marked complete merely because source exists.
