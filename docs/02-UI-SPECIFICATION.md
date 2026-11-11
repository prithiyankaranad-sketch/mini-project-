# UI/UX specification

## Design system
Requested palette: deep navy #08142B; sidebar #0B1530; primary #1463F3; cyan #16C7E8; green #10B981; violet #7C3AED; orange #F97316; canvas #F4F7FC; ink #172033; secondary #64748B. Dark navy with light typography is the navigation region; blue is the single primary action color. Cyan/green/orange are accents, not small white text surfaces. Use explicit status text, never color alone. On the light canvas use accessible secondary text #5D6D82 instead of #64748B, and input borders #8391A5 instead of #94A3B8; these adjustments meet contrast checks. System sans, 16px body, 1.5 line height; 4/8px spacing; 8–12px radii; borders and restrained shadows.

## Layout and navigation
Desktop 248px left navigation, 72px header, main 24–32px gutters. Collapsible sidebar and actual active-route highlighting. At tablet/mobile show a 44px menu target and dismissible navigation, single-column forms and content. Keyboard focus is visible; labels and errors are associated; loading updates are announced; password fields use appropriate autofill. No institutional photograph or logo is invented. Text branding is used until official assets are approved.

The dashboard image informs hierarchy and layout only. Its names, numbers, charts, notifications, 2025 events, dates and profile data must never be copied as real data.

## Public and identity pages
- Root: concise portal introduction, actual readiness information and links to sign in/signup; not a pretend event dashboard.
- Signup: full name, college email, derived readonly RRN, department, study year, password/confirmation; verification outcome without disclosing account existence; no role chooser.
- Login, email callback, forgot/reset password: real Supabase operations with returned-error handling, expiration handling and correct continuation route. Reset form requires a PASSWORD_RECOVERY auth event in the current tab; an ordinary login session cannot masquerade as a recovery flow.
- Profile: protected email/RRN displayed; only full name, department and study year are writable.
- Role dashboards: actual scoped SQL statistics, upcoming registrations/managed schedule, notifications, reports and quick actions. Admin adds recent audit activity and organizer approvals. Empty/unavailable data never renders sample statistics.
- Unauthorized, missing route, runtime error and missing configuration states are explicit.

## Application page structure
Public events: accessible filter bar, paginated list, detail with eligibility/schedule/capacity, real register status. Students: personal registrations, QR detail, attendance, private certificate download, feedback and notifications. Organizers: assigned-event list, validated editing, sessions, participants/export, attendance scanning and corrections, eligibility review, feedback and reports. Administrators: user/organizer approvals, categories, all-event management, reports, audit and settings. Refer to original requirements section 16 for exact routes.

## Data states and dashboards
No metric is rendered until it has a database query; zero means a successful query returned zero, not unknown or failed. Empty state is distinct from loading, denied and query error. Student dashboard scope is self; organizer scope is explicit event assignments; admin institution-wide. Trends, category distribution and department participation use authorized SQL aggregates rather than downloading all rows.

## Review procedure
Check desktop and 390px mobile, keyboard flow, long validation/error strings, password recovery expired state, unconfigured state, signup form and restricted routes. Unconfigured browser validation without credentials verifies rendering and fail-closed navigation only; authenticated screenshots require a real configured account. Do not claim the reference dashboard has been delivered as a working full-stack app.

## Implemented event/operations screens
Public event filters and details; team creation/invitations; registration references and private check-in QR; assigned event editor/sessions/participants; attendance scanner/manual desk/corrections; reviewed certificate issuance and student private downloads; minimal public verification; eligible feedback; reports with exact tables and optional real-data charts; administrator users/approvals/categories/settings/outbox/issues.

The public shell has an actual discovery search and private unread count when available. Forms use unique accessible IDs, explicit database errors and loading/empty states. Tables scroll within the viewport; controls and grids collapse on mobile. Protected populated screens have not been visually verified with real accounts and must not be described as such.
