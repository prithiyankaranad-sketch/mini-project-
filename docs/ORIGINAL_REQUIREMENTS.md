# MASTER PROMPT: Build a Full-Stack College Event Registration and Management Portal

## 1. Your Role

Act as a senior full-stack software architect, UI/UX designer, database engineer, cybersecurity engineer, QA engineer, and DevOps specialist.

Your task is to help design and implement a complete, professional, production-oriented web application called **College Event Portal** for B.S. Abdur Rahman Crescent Institute of Science and Technology.

This must not be merely a UI prototype, static dashboard, or frontend-only application. The goal is a functional full-stack system with a real database, secure authentication, role-based permissions, event registration workflows, attendance tracking, certificate generation, notifications, feedback, automated testing, and production deployment configuration.

Work systematically. Produce complete implementation artifacts rather than vague suggestions. If you have access to coding, file creation, terminal, or deployment tools, use them where available. Otherwise, generate the required code, files, configuration, commands, and documentation for implementation in a development environment.

Do not claim that code has been executed, tested, or deployed unless that action has actually succeeded.

---

## 2. Project Overview

**Project name:** College Event Portal

**Institution:** B.S. Abdur Rahman Crescent Institute of Science and Technology

**Project type:** Full-stack college event registration and management web application

**Primary objective:** Centralize the creation, discovery, registration, management, attendance tracking, and evaluation of college events through one secure, responsive web platform.

The platform should serve students, faculty members, event organizers, and administrators.

The application must be easy to use, visually polished, scalable, accessible, maintainable, and suitable for deployment on a public production domain.

### Core modules

Implement all the following modules:

1. Student Registration and Login
2. Event Creation and Management
3. Event Categories
4. Event Schedule
5. Online Registration
6. Participant Management
7. Event Notifications
8. Attendance Tracking
9. Certificate and Participation Records
10. Feedback Management

Also implement a dashboard, search and filtering, reporting, user management, role-based access control, audit logs, and production configuration.

---

## 3. Required Technology Stack

Use the following stack unless a specific technical limitation requires a documented alternative.

### Frontend

- React
- TypeScript with strict type checking
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- React Router
- React Hook Form
- Zod for validation
- Recharts for dashboard analytics
- date-fns for date formatting and manipulation

### Backend

Use Supabase as the managed backend platform.

Required services:

- Supabase Auth for authentication and email verification
- Supabase PostgreSQL for relational data
- Row Level Security (RLS) for database authorization
- Supabase Storage for event posters and protected certificate files
- Supabase Edge Functions for privileged business operations
- PostgreSQL functions and transactions for operations requiring atomicity

Do not create a separate Express backend unless there is a clearly justified requirement.

### External services

- Resend or an equivalent transactional email provider for notifications
- Vercel for frontend hosting
- GitHub for source control and CI/CD
- Supabase Cloud for the production database and backend

### Testing

- Vitest
- React Testing Library
- Playwright
- Supabase local development and migration tooling where appropriate

Use maintained, compatible versions of dependencies. Avoid deprecated packages and document the required runtime versions.

---

## 4. College Email and Student Registration Rules

This requirement is mandatory.

Crescent student email addresses follow the format:

`240071601241@crescent.education`

The number before the domain is a 12-digit Register Number (RRN).

### Signup requirements

The student signup form must collect:

- Full name
- College email
- Register Number
- Department
- Academic year or year of study
- Password
- Password confirmation, if required by the chosen form design

### Email rules

1. Accept only addresses matching the pattern of exactly 12 digits followed by `@crescent.education`.
2. Example of a valid-format address: `240071601241@crescent.education`.
3. Reject other email domains.
4. Normalize email addresses before validation.
5. Validate the format on the frontend and again in trusted backend logic.
6. Require Supabase email verification before granting normal student access.
7. Extract the RRN from the email address and automatically populate the Register Number field.
8. Make the extracted RRN read-only during ordinary signup.
9. Store the RRN as a string, not a numeric database type.
10. Enforce uniqueness for both the normalized email and the student Register Number.

The validation pattern should be equivalent to:

`^\d{12}@crescent\.education$`

### Student identity verification

Do not assume that a correctly formatted email address proves that the student is genuinely enrolled.

Design the system to support authorized verification against an official student roster when one is available.

If no roster is available, require email verification and clearly document that this verifies control of the email account, not official enrollment status.

Never fabricate student records or claim institutional verification without a genuine source.

### Authentication security

- Use Supabase Auth rather than storing passwords directly.
- Never store plaintext passwords.
- Implement login, logout, session restoration, email verification, and password recovery.
- Configure authentication redirect URLs correctly.
- Do not allow users to grant themselves organizer or administrator privileges.
- Restrict privileged role assignment to authorized administrative operations.

---

## 5. User Roles and Permissions

Implement three primary roles.

### A. Student / Participant

Students must be able to:

- Sign up and log in.
- View and update permitted profile fields.
- Browse published events.
- Search and filter by category, department, date, and event name.
- View event details, eligibility, venue, schedule, and capacity.
- Register for individual events.
- Join team events where supported.
- View registration confirmations and references.
- Cancel registrations when cancellation is permitted.
- Join a waitlist when enabled.
- View personal attendance records.
- View and download eligible certificates.
- Receive in-app and email notifications.
- Submit event feedback.
- View personal registration and participation history.

Students must not be able to access another student's private records or modify protected fields such as their role or verified student ID.

### B. Event Organizer

Organizers must be able to:

- Create, edit, preview, publish, and cancel events.
- Manage their authorized events.
- Create and assign event categories.
- Configure event schedules and sessions.
- Configure registration opening and closing times.
- Set participant capacity and eligibility rules.
- Enable individual or team registration.
- View and search participants.
- Export authorized participant lists.
- Manage cancellations and waitlists.
- Send event notifications.
- Record attendance through QR scanning or manual check-in.
- Review attendance reports.
- Determine certificate eligibility.
- Generate and issue certificates.
- View feedback and event analytics.

Organizers should only manage events for which they have explicit authorization.

### C. Super Administrator

Administrators must be able to:

- View institution-wide dashboard statistics.
- Manage accounts and approved role assignments.
- Approve or revoke organizer access.
- View and manage all events.
- Manage event categories.
- Review platform-wide registration and attendance reports.
- View audit logs.
- Manage certificate templates and platform settings.
- Review reported issues.
- Control privileged configuration.

Implement role checks in the backend and RLS policies, not merely by hiding buttons in the frontend.

---

## 6. UI/UX and Visual Design

Create a modern, polished, premium dashboard with excellent contrast and a consistent design system.

### Design direction

Use a clean enterprise-style interface inspired by modern SaaS dashboards.

Primary colors:

- Deep navy: `#08142B`
- Sidebar navy: `#0B1530`
- Electric blue: `#1463F3`
- Cyan accent: `#16C7E8`
- Green: `#10B981`
- Violet: `#7C3AED`
- Orange: `#F97316`
- White: `#FFFFFF`
- Light background: `#F4F7FC`
- Primary text: `#172033`
- Secondary text: `#64748B`

Use blue for primary actions, green for successful states, orange for warnings and pending states, and red for destructive actions or errors.

Do not apply every accent color indiscriminately. Maintain a coherent hierarchy.

### Layout requirements

Build a responsive application shell with:

- Collapsible left sidebar
- Institution and application branding
- Top navigation bar
- Global event search
- Notification indicator
- User profile menu
- Main content area
- Breadcrumbs where appropriate
- Consistent page headings and action buttons
- Responsive mobile navigation
- Loading, empty, error, and success states

Use clear typography, consistent spacing, appropriate border radii, restrained shadows, and accessible color contrast.

Support desktop, tablet, and mobile screen sizes.

Avoid excessive gradients, unnecessary animations, crowded cards, and decorative elements that interfere with usability.

### Student dashboard

Include:

- Personalized welcome message
- Total available events
- Upcoming registrations
- Confirmed registrations
- Upcoming event schedule
- Recent notifications
- Attendance summary
- Available certificates
- Recommended or featured events
- Quick links to browse events and view registrations

### Organizer dashboard

Include:

- Total events managed
- Published and upcoming events
- Total registrations
- Available seats
- Attendance statistics
- Pending administrative tasks
- Recent registrations
- Upcoming event schedule
- Feedback summaries
- Quick actions to create an event, manage participants, scan attendance, and issue certificates

### Administrator dashboard

Include:

- Total registered users
- Active students
- Total events
- Published events
- Total registrations
- Attendance statistics
- Certificate statistics
- Event category distribution
- Registration trends
- Department-level participation
- Recent platform activity
- Organizer approval queue

### Dashboard data requirements

All statistics, charts, tables, and registration lists must be derived from actual database data.

Never hardcode fake production statistics or represent sample events as real institutional events.

Clearly label development seed data as sample data.

Implement proper loading indicators, error handling, empty states, pagination, and filters.

---

## 7. Event Creation and Management

Create a complete event-management workflow.

### Event form fields

- Event title
- Short description
- Full description
- Event poster
- Event category
- Organizing department
- Organizer or responsible faculty member
- Venue
- Event start date and time
- Event end date and time
- Registration opening date and time
- Registration closing date and time
- Participant capacity
- Eligibility rules
- Individual or team registration mode
- Minimum and maximum team size where applicable
- Event fee, if applicable
- Event contact information
- Certificate availability
- Attendance requirements for certificates
- Publication status

### Event lifecycle

Implement explicit and validated event statuses:

- Draft
- Published
- Registration Closed
- Ongoing
- Completed
- Cancelled

Define the permitted state transitions and whether each transition is automatic or organizer-controlled.

Do not allow an event to be published with invalid dates or incomplete required fields.

Prevent registration before the opening time, after the closing time, or after cancellation.

Use a consistent timezone strategy. Store timestamps in UTC and display them in the configured institutional timezone, with `Asia/Kolkata` as the default.

### Event categories

Support categories such as:

- Technical
- Research
- Hackathon
- Workshop
- Seminar
- Cultural
- Sports
- Entrepreneurship
- Academic
- Other

Administrators must be able to add, edit, deactivate, and manage categories.

Prevent category deletion when it would break event references. Use deactivation or reassignment where appropriate.

### Event schedules

Allow organizers to create multiple sessions for an event.

Each session should contain:

- Session title
- Description
- Start and end time
- Venue
- Speaker or responsible person, if applicable
- Display order

Validate session times and warn about overlapping sessions or venue conflicts where possible.

---

## 8. Online Registration and Participant Management

Implement a robust registration engine.

### Registration workflow

1. Student opens a published event.
2. The system verifies authentication.
3. The system checks event status.
4. The system checks registration dates.
5. The system validates student eligibility.
6. The system checks capacity.
7. The system checks for duplicate registration.
8. The server creates the registration atomically.
9. The system creates a unique registration reference.
10. The system generates a secure check-in token when appropriate.
11. The system creates a notification and queues confirmation email.
12. The student sees a confirmation screen and the registration in their dashboard.

### Business rules

- Enforce a unique registration for each student and event for individual registrations.
- Enforce capacity atomically at the database level.
- Handle simultaneous registrations safely.
- Never rely solely on frontend checks.
- Support cancellation where permitted.
- Release seats when valid cancellations occur.
- Support optional waitlists.
- Prevent registration for cancelled or unpublished events.
- Record registration timestamps and status changes.
- Use appropriate transactions and database constraints.

### Team events

Support optional team-based events.

Create dedicated team and team-membership tables.

Implement:

- Team creation
- Team name
- Team leader
- Team membership invitations or controlled member addition
- Minimum and maximum team size
- Duplicate membership prevention
- Team registration status
- Participant eligibility checks

Do not assume every event is team-based.

### Participant management

Organizers should be able to:

- View registered participants.
- Search by student name, RRN, department, or registration reference.
- Filter by registration status and attendance status.
- View permitted participant details.
- Export CSV files.
- Process authorized cancellations.
- Manage waitlists.
- Track certificate eligibility.

Protect exports and sensitive participant data through authorization checks.

---

## 9. Notifications and Email

Implement in-app notifications and transactional email.

### Notification types

- Registration confirmation
- Registration cancellation
- Waitlist status change
- Event reminder
- Schedule change
- Venue change
- Event cancellation
- Attendance confirmation where appropriate
- Certificate availability
- Feedback invitation

### Implementation

Use a database-backed notification system and a reliable server-side email workflow.

Create appropriate tables for notifications and email delivery jobs.

Store delivery status, retry count, timestamps, and failure information.

Ensure email failures do not silently lose important notifications.

Use idempotent delivery logic where possible to prevent duplicate emails when jobs are retried.

Do not expose email-provider API keys in the frontend.

Create polished email templates that include the event title, relevant dates, venue, registration reference, and clear action links.

Support configurable reminders, such as 24 hours before an event, with duplicate-send protection.

---

## 10. Attendance Tracking

Implement QR-based and manual attendance tracking.

### QR workflow

1. Generate a unique, unpredictable check-in token for a valid registration.
2. Display the participant's QR code.
3. Allow authorized event staff to open an attendance scanner.
4. Scan the QR code.
5. Send the token to a trusted backend operation.
6. Validate the event, registration, token, and staff permissions.
7. Record attendance and the check-in timestamp.
8. Reject invalid or duplicate check-ins.
9. Display a clear success or failure message.

Do not encode confidential personal data in the QR code.

Do not treat the QR code itself as authorization.

### Manual attendance

Allow authorized staff to search for a registered participant and mark them present.

Support authorized corrections and record who made the change.

### Attendance reporting

Provide:

- Registered participant count
- Present count
- Absent count
- Attendance percentage
- Session-wise attendance when enabled
- Search and filters
- CSV export
- Attendance correction history

Ensure the data model supports events with multiple sessions without creating duplicate or contradictory attendance records.

---

## 11. Certificates and Participation Records

Implement certificate generation using an approved certificate template.

### Workflow

1. Organizer marks the event as completed.
2. Attendance records are finalized.
3. The system evaluates eligibility rules.
4. Organizer reviews eligible participants.
5. Authorized staff approve certificate issuance.
6. A certificate is generated as a PDF.
7. Each certificate receives a unique verification identifier.
8. The PDF is stored securely.
9. The student receives a notification.
10. The student can view or download the certificate.
11. A verification page checks the certificate's authenticity and current validity.

### Certificate fields

- Institution name
- Event name
- Participant name
- Certificate type
- Issue date
- Authorized signatory fields
- Unique certificate ID
- Verification QR code, if enabled

Support participation, completion, achievement, winner, and runner-up certificate types.

Do not issue certificates automatically just because a student registered.

Make certificate eligibility configurable per event.

Support certificate revocation and ensure revoked certificates fail verification.

Do not expose private certificate PDFs through unrestricted public storage URLs.

---

## 12. Feedback Management

Implement feedback forms that become available according to event configuration.

### Suggested fields

- Overall rating from 1 to 5
- Event organization rating
- Content quality rating
- Venue and facilities rating
- Optional written comments
- Suggestions for future events
- Optional question about attending future events

### Requirements

- Only eligible participants can submit feedback.
- Support one response per student per event by default.
- Allow organizers to configure whether attendance is required.
- Validate ratings and text lengths.
- Protect responses from unauthorized access.
- Display aggregate statistics and charts.
- Provide appropriate access to feedback comments.
- Do not publicly expose individual feedback.
- Support CSV export for authorized users.

---

## 13. Database Schema and Migrations

Design a normalized PostgreSQL schema with foreign keys, indexes, unique constraints, checks, and appropriate deletion rules.

Create migrations that can be applied consistently to development and production environments.

Include at least these tables:

1. `profiles`
2. `user_roles`
3. `event_categories`
4. `events`
5. `event_sessions`
6. `registrations`
7. `teams`
8. `team_members`
9. `notifications`
10. `email_outbox`
11. `attendance`
12. `certificates`
13. `event_feedback`
14. `audit_logs`

Add other tables where justified, such as event category mappings, registration status history, waitlists, notification preferences, and email delivery logs.

### Required database practices

- Use UUID primary keys where appropriate.
- Store RRN values as strings.
- Use foreign keys for relational integrity.
- Use unique constraints for duplicate prevention.
- Use check constraints for valid values.
- Index foreign keys and frequently queried columns.
- Store timestamps consistently.
- Use transactions for critical operations.
- Define safe deletion and archival rules.
- Avoid storing redundant information unnecessarily.
- Use database migrations rather than relying on manual production changes.

### Registration capacity

Implement a trusted database function or transaction that checks and allocates capacity safely under concurrent requests.

Do not implement capacity enforcement as a frontend-only check.

### Certificate integrity

Use unique certificate identifiers and enforce the relationship between a certificate and its valid registration.

### Audit logs

Record important administrative operations, including:

- Role changes
- Event publication and cancellation
- Attendance corrections
- Certificate issuance and revocation
- Important registration status changes

Do not log passwords, authentication tokens, or unnecessary sensitive information.

Deliver the schema as actual SQL migration files, not only an entity relationship description.

---

## 14. Row Level Security and Backend Authorization

Security is a mandatory acceptance criterion.

Enable and test RLS on all tables containing private or role-restricted data.

Create explicit policies for each operation:

- SELECT
- INSERT
- UPDATE
- DELETE

### Minimum authorization rules

- Anonymous visitors can read published public event details only.
- Students can read and modify only permitted fields in their own profile.
- Students can read their own registrations, notifications, attendance, certificates, and feedback submissions.
- Students cannot assign themselves roles.
- Organizers can manage only their authorized events and associated records.
- Administrators can perform authorized institution-wide operations.
- Only trusted server-side functions can execute privileged workflows.
- Public certificate verification exposes only limited verification information.
- Private storage objects are accessible only to authorized users.
- Email-provider credentials and service-role keys remain server-side.

Use trusted role assignments rather than accepting a role sent by the browser.

If RLS policies use helper functions, ensure those functions cannot accidentally bypass intended access restrictions.

Test policies with users from different roles.

Do not consider frontend route guards sufficient for security.

---

## 15. Application Architecture and Code Organization

Use a feature-oriented project structure similar to:

```text
college-event-portal/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   └── events/
│   ├── features/
│   │   ├── auth/
│   │   ├── profiles/
│   │   ├── events/
│   │   ├── categories/
│   │   ├── schedules/
│   │   ├── registrations/
│   │   ├── participants/
│   │   ├── notifications/
│   │   ├── attendance/
│   │   ├── certificates/
│   │   ├── feedback/
│   │   └── analytics/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vercel.json
```

Adjust the structure where appropriate but preserve separation of concerns.

Keep UI components, business logic, validation, database access, and privileged operations separated.

Use reusable components and typed data models.

Avoid a giant single component, duplicated logic, placeholder implementations, and unexplained hardcoded values.

---

## 16. Required Pages and Routes

Implement these route groups.

### Public routes

- `/`
- `/events`
- `/events/:eventId`
- `/categories`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify/:certificateId`

### Student routes

- `/student/dashboard`
- `/student/profile`
- `/student/registrations`
- `/student/registrations/:registrationId`
- `/student/certificates`
- `/student/notifications`
- `/student/attendance`
- `/student/feedback`

### Organizer routes

- `/organizer/dashboard`
- `/organizer/events`
- `/organizer/events/new`
- `/organizer/events/:eventId/edit`
- `/organizer/events/:eventId/participants`
- `/organizer/events/:eventId/schedule`
- `/organizer/events/:eventId/attendance`
- `/organizer/events/:eventId/certificates`
- `/organizer/events/:eventId/feedback`
- `/organizer/events/:eventId/reports`

### Administrator routes

- `/admin/dashboard`
- `/admin/users`
- `/admin/organizers`
- `/admin/events`
- `/admin/categories`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/settings`

Protect restricted routes and provide a clear unauthorized-access page.

Implement sensible navigation, loading states, error boundaries, and fallback pages.

---

## 17. Search, Filters, and Analytics

Implement useful search and filtering throughout the portal.

### Event discovery

Search by event title and description where appropriate.

Filter by:

- Category
- Department
- Event date
- Registration status
- Availability
- Event format, if supported

Use pagination for large datasets.

### Reports

Create reports for:

- Registration counts by event
- Registrations by department
- Event popularity
- Attendance percentages
- Certificate issuance
- Feedback ratings
- Registration trends over time

All analytics must use real database queries and respect user permissions.

Avoid loading the entire database into the browser to calculate basic statistics.

Use database queries, views, or authorized reporting functions as appropriate.

---

## 18. Testing and Quality Assurance

Create a practical automated test suite.

### Unit tests

Test:

- Email format validation
- RRN extraction
- Form validation
- Registration eligibility
- Event state transitions
- Capacity calculations
- Certificate eligibility
- Feedback validation

### Integration tests

Test:

- Signup and login
- Database access permissions
- Event creation and publishing
- Registration transactions
- Duplicate registration prevention
- Capacity limits
- Attendance recording
- Certificate issuance
- Feedback submission
- Notification delivery workflows

### End-to-end tests

Test the following complete journeys.

**Journey A: Student**

1. Sign up using a valid-format Crescent email.
2. Verify the email.
3. Log in.
4. Browse events.
5. Register for an available event.
6. View the registration confirmation.
7. View the event in My Registrations.
8. Receive the configured notification.
9. Check in at the event.
10. Access the certificate when eligible.
11. Submit feedback.

**Journey B: Organizer**

1. Log in using an authorized organizer account.
2. Create an event.
3. Add sessions and venue information.
4. Publish the event.
5. View registrations.
6. Send an event update.
7. Record attendance.
8. Finalize certificate eligibility.
9. Issue certificates.
10. Review feedback and analytics.

**Journey C: Security**

1. Attempt to access admin routes as a student.
2. Attempt to read another student's registration.
3. Attempt to modify a user role.
4. Attempt to register twice.
5. Attempt to exceed event capacity concurrently.
6. Attempt to scan an invalid or previously used QR token.
7. Attempt to access another user's private certificate.
8. Attempt to issue a certificate to an ineligible participant.

Each unauthorized operation must be rejected by the backend.

Document test results honestly. Never claim tests passed without running them.

---

## 19. Performance, Accessibility, and Reliability

Implement the following:

- Responsive layouts
- Keyboard navigation
- Visible focus states
- Semantic HTML
- Accessible labels
- Appropriate contrast
- Form error messages
- Loading indicators
- Empty states
- Error boundaries
- Optimized images
- Lazy loading where appropriate
- Pagination for large tables
- Database indexes
- Sensible request handling
- Rate limiting or abuse protection where necessary
- Safe retry logic for asynchronous operations
- Database backups and recovery documentation
- Appropriate logging and error monitoring

Target good Core Web Vitals and avoid unnecessary dependencies.

Do not sacrifice security for convenience.

---

## 20. Deployment and Production Configuration

Prepare the application for deployment on Vercel with Supabase Cloud.

### Required deliverables

1. A complete React application.
2. All necessary frontend pages and components.
3. PostgreSQL schema and migrations.
4. RLS policies.
5. Supabase Edge Functions for privileged operations.
6. Email templates and provider integration.
7. Certificate generation workflow.
8. Attendance QR workflow.
9. Automated tests.
10. `.env.example`.
11. `.gitignore`.
12. `README.md`.
13. Deployment instructions.
14. Database migration instructions.
15. Production security checklist.
16. Backup and recovery documentation.
17. CI/CD configuration where appropriate.

### Environment variables

Document required variables, such as:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
APP_BASE_URL=
```

The list is illustrative; place server-only variables in the appropriate server-side or Supabase Edge Function environment, never in frontend environment variables.

The `.env.example` file should contain empty placeholders, not actual credentials.

### Production requirements

- Configure production authentication URLs.
- Configure the institutional timezone.
- Configure email sender identity and provider verification.
- Configure CORS and redirect settings where applicable.
- Deploy database migrations.
- Deploy Edge Functions.
- Configure storage policies.
- Configure environment variables.
- Run smoke tests.
- Test signup, registration, attendance, certificates, and authorization in production.
- Configure backups and recovery procedures.
- Provide a documented rollback procedure.

If a custom domain is not available, document the deployment URL provided by the hosting platform.

Do not invent a production URL or claim a deployment is live when it has not been deployed.

---

## 21. Development Workflow

Implement the application in the following order.

### Phase 1: Foundation

- Initialize the repository.
- Configure React, TypeScript, Tailwind CSS, and shadcn/ui.
- Set up Supabase.
- Create migrations.
- Implement profiles, authentication, and roles.
- Configure and test RLS.

### Phase 2: Event system

- Build categories.
- Build event creation and management.
- Build schedules and sessions.
- Build public event discovery.
- Implement event status transitions.

### Phase 3: Registration

- Implement registration transactions.
- Add capacity enforcement.
- Prevent duplicate registrations.
- Build student registration history.
- Build organizer participant management.
- Add optional team registration and waitlists.

### Phase 4: Communication

- Implement in-app notifications.
- Implement confirmation emails.
- Add reminders and event updates.
- Add retry handling and delivery tracking.

### Phase 5: Event operations

- Implement QR and manual attendance.
- Build attendance reports.
- Implement certificate eligibility.
- Implement PDF generation.
- Add certificate verification.

### Phase 6: Feedback and analytics

- Build feedback forms.
- Build feedback summaries.
- Implement analytics.
- Add CSV exports.
- Build administrative reports.

### Phase 7: Production readiness

- Complete security testing.
- Complete integration and end-to-end tests.
- Optimize performance.
- Check accessibility.
- Configure deployment.
- Write documentation.
- Deploy and perform smoke tests.

At the end of each phase, provide a clear summary of completed work, remaining work, tests performed, and known limitations.

---

## 22. Implementation Rules

Follow these rules throughout the project.

1. Do not deliver a static mockup as the final application.
2. Do not leave core features as nonfunctional buttons.
3. Do not use fake production data.
4. Do not hardcode dashboard statistics.
5. Do not store passwords directly.
6. Do not expose service-role keys or provider secrets.
7. Do not trust frontend authorization checks.
8. Do not allow students to grant themselves privileged roles.
9. Do not implement registration capacity using frontend checks alone.
10. Do not generate certificates without validating eligibility.
11. Do not expose private participant data or certificate files publicly.
12. Do not omit database migrations or RLS policies.
13. Do not silently ignore errors.
14. Do not claim that external services are connected without verifying the connection.
15. Do not claim the application is deployed unless deployment succeeds.
16. Use real database-backed functionality for every core module.
17. Prefer maintainable, typed, reusable code.
18. Explain technical assumptions and document necessary manual configuration.
19. Ask for clarification only when an essential decision cannot reasonably be made with a safe default.
20. Never invent official institutional records, credentials, signatories, or approvals.

---

## 23. Final Acceptance Criteria

The application is considered ready for release only when all the following are satisfied.

- Students can register using the required 12-digit RRN email format.
- Email verification works.
- Authentication and role assignment are secure.
- Organizers can create, edit, publish, and cancel events.
- Students can browse events and register.
- Duplicate registrations are prevented.
- Capacity is enforced safely.
- Categories and schedules work.
- Organizers can manage participants.
- In-app notifications and email workflows function.
- QR and manual attendance work.
- Certificate eligibility is validated.
- Certificates can be generated and verified.
- Feedback can be submitted and analyzed.
- Dashboards use actual database data.
- RLS policies prevent unauthorized access.
- Automated tests cover the critical workflows.
- Environment variables and secrets are handled correctly.
- Deployment documentation is complete.
- Production configuration and smoke tests are verified.
- No critical known security vulnerability remains unaddressed.

---

## 24. Required Final Deliverables

Produce the project in the following order:

**Deliverable A — Product specification**
- Goals, users, workflows, business rules, and assumptions.

**Deliverable B — UI/UX specification**
- Design system, responsive layouts, dashboards, page structure, and navigation.

**Deliverable C — Database architecture**
- Entity relationship diagram, SQL schema, constraints, indexes, migrations, and RLS policies.

**Deliverable D — Full-stack source code**
- Frontend pages, reusable components, typed data models, database integration, authentication, server-side functions, and all ten modules.

**Deliverable E — Testing**
- Unit tests, integration tests, security tests, and end-to-end test scenarios.

**Deliverable F — Deployment**
- Environment configuration, migrations, Vercel deployment instructions, Supabase setup, CI/CD, and production checklist.

**Deliverable G — Documentation**
- README, setup instructions, architecture explanation, operational guide, troubleshooting, and known limitations.

Begin by creating the complete project plan and architecture. Then proceed through the implementation phases in order. If the environment supports file creation and code execution, generate and validate the actual project files. If the environment only supports text generation, produce the implementation artifacts in clearly labeled files or code blocks, along with the exact commands required to assemble and deploy them.

The final goal is a secure, polished, genuinely functional College Event Registration and Management Portal that Crescent students and authorized event organizers can use—not merely a design concept or presentation.
