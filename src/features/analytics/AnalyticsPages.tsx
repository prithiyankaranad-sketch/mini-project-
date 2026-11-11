import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  downloadCsv,
  institutionDate,
  privateQuery,
  publicQuery,
  useRemote,
} from "../../lib/portal";
import { useAuth } from "../auth/AuthProvider";
import {
  anyRows,
  eventSchema,
  notificationSchema,
  registrationSchema,
  reportsSchema,
  statsSchema,
} from "../../types/portal";
import { Button } from "../../components/ui/button";
import {
  DataTable,
  PageHeader,
  Pager,
  RemoteState,
  useAction,
  WorkspaceNav,
} from "../../components/ui/portal";
// No chart is fabricated for empty data. Exact accessible tables accompany every chart.
function AnalyticsPanels({
  report,
}: {
  report: z.infer<typeof reportsSchema>;
}) {
  return (
    <div className="analytics-grid">
      <section className="card">
        <h2>Registration trend</h2>
        <p className="muted">
          Registrations created in the last 30 days, by Asia/Kolkata calendar
          day. Historical cancellations remain included. Days with no
          observations are not synthesized.
        </p>
        {report.trends.length >= 2 && (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.trends} accessibilityLayer>
                <CartesianGrid stroke="#dfe6f1" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip />
                <Line
                  type="linear"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  dot
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <DataTable
          rows={report.trends}
          columns={[
            { key: "day", label: "Day (IST)" },
            { key: "registrations", label: "Registrations created" },
          ]}
          caption="Exact registration trend counts"
        />
      </section>
      <section className="card">
        <h2>Events by category</h2>
        <p className="muted">
          All event statuses within your authorized report scope.
        </p>
        {report.categories.length >= 2 && (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.categories} accessibilityLayer>
                <CartesianGrid stroke="#dfe6f1" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip />
                <Bar
                  dataKey="events"
                  name="Events"
                  fill="#1463F3"
                  maxBarSize={40}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <DataTable
          rows={report.categories}
          columns={[
            { key: "name", label: "Category" },
            { key: "events", label: "Event count" },
          ]}
          caption="Exact event category distribution"
        />
      </section>
    </div>
  );
}
export function DashboardPage({
  mode = "student",
}: {
  mode?: "student" | "organizer" | "admin";
}) {
  const auth = useAuth();
  const stats = useRemote(
    () => privateQuery("stats", { scope: mode }, statsSchema),
    mode,
  );
  const notifications = useRemote(
    () => privateQuery("notifications", {}, z.array(notificationSchema)),
    `dashboard-notifications-${mode}`,
  );
  const registrations = useRemote(
    () =>
      privateQuery(
        "registrations",
        { upcoming: true },
        z.array(registrationSchema),
      ),
    `dashboard-registration-${mode}`,
  );
  const events = useRemote(
    () =>
      mode === "student"
        ? publicQuery(
            "events",
            {},
            z.object({ rows: z.array(eventSchema), page: z.number() }),
          ).then((r) => r.rows)
        : privateQuery(
            "managed_events",
            { upcoming: true },
            z.array(eventSchema),
          ),
    `dashboard-events-${mode}`,
  );
  const report = useRemote(
    () =>
      mode === "student"
        ? Promise.resolve(null)
        : privateQuery("reports", {}, reportsSchema),
    mode,
  );
  const activity = useRemote(
    () =>
      mode === "admin"
        ? privateQuery("audit", {}, anyRows)
        : Promise.resolve([]),
    `activity-${mode}`,
  );
  const recent = useRemote(
    () =>
      mode !== "student"
        ? privateQuery("recent_registrations", {}, anyRows)
        : Promise.resolve([]),
    `recent-${mode}`,
  );
  const s = stats.data;
  const cards = s
    ? [
        {
          label: mode === "student" ? "Published events" : "Events managed",
          value: mode === "student" ? s.published_events : s.events,
          icon: CalendarDays,
        },
        {
          label: "Confirmed registrations",
          value: s.registrations,
          icon: Users,
        },
        {
          label: "Attendance records",
          value: s.attendance,
          icon: ClipboardCheck,
        },
        {
          label: "Certificates issued",
          value: s.certificates,
          icon: GraduationCap,
        },
      ]
    : [];
  return (
    <>
      <section className="hero">
        <p className="eyebrow">{mode} dashboard</p>
        <h1>Welcome, {auth.profile?.full_name}.</h1>
        <p>
          Discover. Register. Participate. Keep your campus experience together.
        </p>
        <div className="actions">
          <Button asChild>
            <Link to={mode === "student" ? "/events" : "/organizer/events/new"}>
              {mode === "student" ? "Browse events" : "Create event"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link
              to={
                mode === "student"
                  ? "/student/registrations"
                  : "/organizer/events"
              }
            >
              {mode === "student" ? "My registrations" : "Manage events"}
            </Link>
          </Button>
          {mode !== "student" && (
            <>
              <Button variant="outline" asChild>
                <Link to="/organizer/events">Attendance & certificates</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link
                  to={
                    mode === "admin" ? "/admin/reports" : "/organizer/reports"
                  }
                >
                  Reports
                </Link>
              </Button>
            </>
          )}
          {mode === "admin" && (
            <Button variant="outline" asChild>
              <Link to="/admin/organizers">Organizer approval queue</Link>
            </Button>
          )}
        </div>
      </section>
      <RemoteState {...stats}>
        <div className="metric-grid">
          {cards.map((c, i) => (
            <section className={`metric metric-${i}`} key={c.label}>
              <c.icon size={28} />
              <div>
                <p>{c.label}</p>
                <strong>{c.value.toLocaleString("en-IN")}</strong>
              </div>
            </section>
          ))}
        </div>
        {s && (
          <div className="card actions">
            {mode === "admin" && (
              <>
                <span>Total accounts: {s.users}</span>
                <span>Active students: {s.active_students}</span>
              </>
            )}
            {mode === "student" ? (
              <span>
                Upcoming confirmed registrations: {s.upcoming_registrations}
              </span>
            ) : (
              <>
                <span>
                  Available published-event seats: {s.available_seats}
                </span>
                <span>Pending certificate jobs: {s.pending_certificates}</span>
              </>
            )}
          </div>
        )}
      </RemoteState>
      <div className="dashboard-grid section-gap">
        <section className="card">
          <PageHeader
            level={2}
            title={
              mode === "student" ? "Upcoming registrations" : "Event schedule"
            }
          />
          <RemoteState
            loading={
              mode === "student" ? registrations.loading : events.loading
            }
            error={mode === "student" ? registrations.error : events.error}
            empty={
              mode === "student"
                ? registrations.data?.filter(
                    (r) =>
                      r.status === "confirmed" &&
                      Date.parse(r.starts_at) > Date.now(),
                  ).length === 0
                : events.data?.length === 0
            }
          >
            {mode === "student"
              ? registrations.data
                  ?.filter(
                    (r) =>
                      r.status === "confirmed" &&
                      Date.parse(r.starts_at) > Date.now(),
                  )
                  .map((r) => (
                    <article className="list-row" key={r.id}>
                      <h3>
                        <Link to={`/student/registrations/${r.id}`}>
                          {r.event_title}
                        </Link>
                      </h3>
                      <p>
                        {institutionDate(r.starts_at)} · {r.venue}
                      </p>
                    </article>
                  ))
              : events.data?.map((e) => (
                  <article className="list-row" key={e.id}>
                    <h3>
                      <Link to={`/organizer/events/${e.id}/participants`}>
                        {e.title}
                      </Link>
                    </h3>
                    <p>
                      {institutionDate(e.starts_at)} · {e.effective_status}
                    </p>
                    <p>
                      {e.registered_count} / {e.capacity} confirmed
                    </p>
                  </article>
                ))}
          </RemoteState>
        </section>
        <section className="card">
          <h2>Recent notifications</h2>
          <RemoteState
            {...notifications}
            empty={notifications.data?.length === 0}
          >
            {notifications.data?.slice(0, 5).map((n) => (
              <article className="list-row" key={n.id}>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <p className="hint">{institutionDate(n.created_at)}</p>
              </article>
            ))}
          </RemoteState>
          <Link to="/student/notifications">All notifications</Link>
        </section>
      </div>
      {mode === "student" ? (
        <section className="section-gap">
          <h2>Discover events</h2>
          <RemoteState {...events} empty={events.data?.length === 0}>
            <div className="card-grid">
              {events.data?.slice(0, 3).map((e) => (
                <article className="card" key={e.id}>
                  <h3>{e.title}</h3>
                  <p>{e.short_description}</p>
                  <Link to={`/events/${e.id}`}>View event</Link>
                </article>
              ))}
            </div>
          </RemoteState>
        </section>
      ) : (
        <RemoteState {...report}>
          {report.data && (
            <>
              <AnalyticsPanels report={report.data} />
              <section className="card section-gap">
                <h2>Department participation</h2>
                <DataTable
                  rows={report.data.departments}
                  columns={[
                    { key: "department", label: "Department" },
                    { key: "registrations", label: "Confirmed registrations" },
                  ]}
                  caption="Authorized department totals (up to 100 departments)"
                />
              </section>
            </>
          )}
        </RemoteState>
      )}
      {mode !== "student" && (
        <section className="card section-gap">
          <h2>Recent registrations</h2>
          <RemoteState {...recent} empty={recent.data?.length === 0}>
            <DataTable
              rows={recent.data ?? []}
              columns={[
                { key: "event_title", label: "Event" },
                { key: "full_name", label: "Participant" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Registered at" },
              ]}
              caption="Latest 20 registrations in your authorized scope"
            />
          </RemoteState>
        </section>
      )}
      {mode === "admin" && (
        <section className="card section-gap">
          <h2>Recent platform activity</h2>
          <RemoteState {...activity} empty={activity.data?.length === 0}>
            <DataTable
              rows={activity.data?.slice(0, 10) ?? []}
              columns={[
                { key: "created_at", label: "When" },
                { key: "action", label: "Action" },
                { key: "actor_id", label: "Actor" },
              ]}
              caption="Ten most recent audit entries"
            />
          </RemoteState>
          <Link to="/admin/audit-logs">Full audit log</Link>
        </section>
      )}
    </>
  );
}
export function ReportsPage() {
  const { eventId } = useParams();
  const [page, setPage] = useState(0);
  const query = useRemote(
    () =>
      privateQuery(
        "reports",
        { ...(eventId ? { event_id: eventId } : {}), page },
        reportsSchema,
      ),
    `${eventId ?? "all"}-${page}`,
  );
  const action = useAction();
  return (
    <>
      <PageHeader
        title="Participation reports"
        description="Server-side aggregates scoped to your assigned events. Event rows are paginated; category, department and 30-day trend summaries cover the full authorized scope."
      >
        <Button
          variant="outline"
          onClick={() =>
            void action.run(async () => {
              const all: Record<string, unknown>[] = [];
              for (let p = 0; p < 2000; p++) {
                const r = await privateQuery(
                  "reports",
                  { ...(eventId ? { event_id: eventId } : {}), page: p },
                  reportsSchema,
                );
                all.push(
                  ...r.events.map((e) => ({
                    ...e,
                    absent: e.registrations - e.present,
                    attendance_percent: e.registrations
                      ? (e.present * 100) / e.registrations
                      : null,
                  })),
                );
                if (r.events.length < 50) {
                  downloadCsv("event-reports.csv", all);
                  return;
                }
              }
              throw new Error("Report exceeds export limit.");
            }, "Report CSV downloaded.")
          }
        >
          Export event report CSV
        </Button>
      </PageHeader>
      {eventId && <WorkspaceNav eventId={eventId} />} {action.status}
      <RemoteState {...query}>
        {query.data && (
          <>
            <DataTable
              rows={query.data.events.map((e) => ({
                ...e,
                absent: e.registrations - e.present,
                attendance_percent: e.registrations
                  ? ((e.present * 100) / e.registrations).toFixed(1)
                  : null,
              }))}
              columns={[
                { key: "title", label: "Event" },
                { key: "registrations", label: "Confirmed" },
                { key: "present", label: "Present" },
                { key: "absent", label: "Absent" },
                { key: "attendance_percent", label: "Attendance %" },
                { key: "certificates", label: "Issued certificates" },
                { key: "rating", label: "Mean rating (1–5)" },
              ]}
              caption="Event participation report (current event page)"
            />
            <Pager
              page={page}
              setPage={setPage}
              hasNext={
                query.data.events.length === 50 ||
                query.data.sessions.length === 50
              }
            />
            <AnalyticsPanels report={query.data} />
            <section className="card section-gap">
              <h2>Session-wise attendance</h2>
              <DataTable
                rows={query.data.sessions.map((s) => ({
                  ...s,
                  absent: s.registrations - s.present,
                  attendance_percent: s.registrations
                    ? ((s.present * 100) / s.registrations).toFixed(1)
                    : null,
                }))}
                columns={[
                  { key: "event_title", label: "Event" },
                  { key: "title", label: "Session" },
                  { key: "registrations", label: "Registered" },
                  { key: "present", label: "Present" },
                  { key: "absent", label: "Absent" },
                  { key: "attendance_percent", label: "Attendance %" },
                ]}
                caption="Session attendance (50 sessions per report page)"
              />
            </section>
            <div className="analytics-grid">
              <section className="card">
                <h2>Department participation</h2>
                <DataTable
                  rows={query.data.departments}
                  columns={[
                    { key: "department", label: "Department" },
                    { key: "registrations", label: "Confirmed registrations" },
                  ]}
                  caption="Registrations by current profile department (up to 100 departments)"
                />
              </section>
              <section className="card">
                <h2>Feedback rating distribution</h2>
                <DataTable
                  rows={query.data.feedback}
                  columns={[
                    { key: "rating", label: "Rating (1–5)" },
                    { key: "responses", label: "Response count" },
                  ]}
                  caption="Overall feedback ratings"
                />
              </section>
            </div>
          </>
        )}
      </RemoteState>
    </>
  );
}
