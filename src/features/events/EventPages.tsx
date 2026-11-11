import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { z } from "zod";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import {
  command,
  institutionDate,
  institutionInput,
  institutionToUtc,
  privateQuery,
  publicQuery,
  useRemote,
} from "../../lib/portal";
import { requireSupabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import {
  categorySchema,
  eventSchema,
  sessionSchema,
  type EventRecord,
} from "../../types/portal";
import { Button } from "../../components/ui/button";
import {
  PageHeader,
  Pager,
  RecordForm,
  RemoteState,
  useAction,
  uuidResult,
  WorkspaceNav,
  type FieldDefinition,
} from "../../components/ui/portal";
import { eventInputSchema } from "./validation";
import { TeamPanel } from "../teams/TeamPanel";
const eventPageSchema = z.object({
  rows: z.array(eventSchema),
  page: z.number(),
});
function EventPoster({ path, title }: { path: string | null; title: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setUrl("");
    setError("");
    if (path)
      void requireSupabase()
        .storage.from("event-posters")
        .createSignedUrl(path, 3600)
        .then(({ data, error }) => {
          if (alive) {
            if (error) setError("The event poster could not be loaded.");
            else setUrl(data?.signedUrl ?? "");
          }
        });
    return () => {
      alive = false;
    };
  }, [path]);
  return url ? (
    <img
      className="event-poster"
      src={url}
      alt={`Poster for ${title}`}
      loading="lazy"
    />
  ) : error ? (
    <p role="status">{error}</p>
  ) : null;
}
export function EventsPage() {
  const [params] = useSearchParams();
  const search = params.get("search") ?? "";
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search,
    category_id: "",
    department: "",
    date: "",
    status: "",
    mode: "",
    available: false,
  });
  const categories = useRemote(
    () => publicQuery("categories", {}, z.array(categorySchema)),
    "categories",
  );
  const query = useRemote(
    () => publicQuery("events", { ...filters, page }, eventPageSchema),
    JSON.stringify([filters, page]),
  );
  useEffect(() => {
    setFilters((f) => ({ ...f, search }));
    setPage(0);
  }, [search]);
  return (
    <>
      <PageHeader
        eyebrow="Discover your campus"
        title="Events"
        description="Browse published events and register using your verified college account."
      />
      <form
        className="filter-grid card"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          setFilters({
            search: String(d.get("search")),
            category_id: String(d.get("category_id")),
            department: String(d.get("department")),
            date: String(d.get("date")),
            status: String(d.get("status")),
            mode: String(d.get("mode")),
            available: d.has("available"),
          });
          setPage(0);
        }}
      >
        <label>
          Search events
          <input
            className="input"
            name="search"
            type="search"
            key={search}
            defaultValue={search}
          />
        </label>
        <label>
          Category
          <select className="input" name="category_id">
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Department
          <input className="input" name="department" />
        </label>
        <label>
          Event date (IST)
          <input className="input" name="date" type="date" />
        </label>
        <label>
          Registration status
          <select className="input" name="status">
            <option value="">All statuses</option>
            {[
              "published",
              "registration_closed",
              "ongoing",
              "completed",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Registration mode
          <select className="input" name="mode">
            <option value="">All formats</option>
            <option value="individual">Individual</option>
            <option value="team">Team</option>
          </select>
        </label>
        <label className="check-label">
          <input name="available" type="checkbox" />
          Seats available
        </label>
        <Button type="submit">Apply filters</Button>
      </form>
      <RemoteState {...query} empty={query.data?.rows.length === 0}>
        <div className="event-grid">
          {query.data?.rows.map((e) => (
            <article className="card event-card" key={e.id}>
              <EventPoster path={e.poster_path} title={e.title} />
              <span className="badge">
                {e.effective_status.replaceAll("_", " ")}
              </span>
              <h2>
                <Link to={`/events/${e.id}`}>{e.title}</Link>
              </h2>
              <p>{e.short_description}</p>
              <p>
                <CalendarDays size={18} />
                {institutionDate(e.starts_at)}
              </p>
              <p>
                <MapPin size={18} />
                {e.venue}
              </p>
              <p>
                <Users size={18} />
                {e.registered_count} / {e.capacity} seats
              </p>
              <Button asChild>
                <Link to={`/events/${e.id}`}>
                  View details
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.rows.length === 20}
      />
    </>
  );
}
export function CategoriesPage() {
  const query = useRemote(
    () => publicQuery("categories", {}, z.array(categorySchema)),
    "categories",
  );
  return (
    <>
      <PageHeader
        title="Event categories"
        description="Categories configured by authorized administrators."
      />
      <RemoteState {...query} empty={query.data?.length === 0}>
        <div className="card-grid">
          {query.data?.map((c) => (
            <div className="card" key={c.id}>
              <h2>{c.name}</h2>
              <Button asChild variant="outline">
                <Link to="/events">Browse events</Link>
              </Button>
            </div>
          ))}
        </div>
      </RemoteState>
    </>
  );
}
export function EventDetailPage() {
  const { eventId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState("");
  const query = useRemote(
    () => publicQuery("events", { id: eventId }, eventPageSchema),
    eventId,
  );
  const sessions = useRemote(
    () =>
      publicQuery("sessions", { event_id: eventId }, z.array(sessionSchema)),
    eventId,
  );
  const action = useAction();
  const e = query.data?.rows[0];
  return (
    <>
      <PageHeader
        title={e?.title ?? "Event details"}
        description={e?.short_description}
      />
      <RemoteState {...query} empty={query.data?.rows.length === 0}>
        {e && (
          <>
            <section className="card">
              <EventPoster path={e.poster_path} title={e.title} />
              <div className="actions">
                <span className="badge">
                  {e.effective_status.replaceAll("_", " ")}
                </span>
                <span>{e.department}</span>
              </div>
              <p className="description-text">{e.description}</p>
              <dl className="definition-list">
                <dt>Starts (IST)</dt>
                <dd>{institutionDate(e.starts_at)}</dd>
                <dt>Ends (IST)</dt>
                <dd>{institutionDate(e.ends_at)}</dd>
                <dt>Venue</dt>
                <dd>{e.venue}</dd>
                <dt>Contact</dt>
                <dd>{e.contact}</dd>
                <dt>Seats allocated</dt>
                <dd>
                  {e.registered_count} of {e.capacity}
                </dd>
                <dt>Registration opens</dt>
                <dd>{institutionDate(e.registration_opens_at)}</dd>
                <dt>Registration closes</dt>
                <dd>{institutionDate(e.registration_closes_at)}</dd>
                <dt>Eligible departments</dt>
                <dd>
                  {e.eligible_departments.length
                    ? e.eligible_departments.join(", ")
                    : "All departments"}
                </dd>
                <dt>Eligible study years</dt>
                <dd>
                  {e.eligible_years.length
                    ? e.eligible_years.join(", ")
                    : "All study years"}
                </dd>
                <dt>Identity requirement</dt>
                <dd>
                  {e.require_roster
                    ? "Official roster match required"
                    : "Verified email; enrollment not roster-verified"}
                </dd>
                <dt>Fee</dt>
                <dd>
                  {e.fee === 0
                    ? "Free"
                    : `₹${e.fee} — payment collection not configured; registration disabled`}
                </dd>
                <dt>Waitlist</dt>
                <dd>{e.waitlist_enabled ? "Enabled" : "Not enabled"}</dd>
                <dt>Certificate rule</dt>
                <dd>
                  {e.certificate_enabled
                    ? `${e.certificate_attendance_percent}% attendance, finalized attendance and organizer approval required`
                    : "No certificate offered"}
                </dd>
              </dl>
              {action.status}
              {auth.user ? (
                <Button
                  disabled={
                    action.busy ||
                    e.effective_status !== "published" ||
                    e.fee > 0 ||
                    (e.mode === "team" && !selectedTeam)
                  }
                  onClick={() =>
                    void action.run(async () => {
                      const result = await command(
                        "register",
                        {
                          event_id: eventId,
                          ...(selectedTeam ? { team_id: selectedTeam } : {}),
                        },
                        uuidResult,
                      );
                      navigate(`/student/registrations/${result.id}`);
                    }, "Registration saved.")
                  }
                >
                  {e.mode === "team"
                    ? "Register accepted team"
                    : "Register for event"}
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/login">Sign in to register</Link>
                </Button>
              )}
            </section>
            {e.mode === "team" && auth.user && (
              <TeamPanel eventId={eventId} onSelect={setSelectedTeam} />
            )}
            <section className="card section-gap">
              <h2>Event schedule</h2>
              <RemoteState {...sessions} empty={sessions.data?.length === 0}>
                {sessions.data?.map((s) => (
                  <article key={s.id} className="list-row">
                    <h3>{s.title}</h3>
                    <p>
                      {institutionDate(s.starts_at)} –{" "}
                      {institutionDate(s.ends_at)}
                    </p>
                    <p>
                      {s.venue}
                      {s.speaker ? ` · ${s.speaker}` : ""}
                    </p>
                    <p>{s.description}</p>
                  </article>
                ))}
              </RemoteState>
            </section>
          </>
        )}
      </RemoteState>
    </>
  );
}
export function ManagedEventsPage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("managed_events", { page }, z.array(eventSchema)),
    `managed-${page}`,
  );
  return (
    <>
      <PageHeader
        title="Manage events"
        description="Only events explicitly assigned to you are available here."
      >
        <Button asChild>
          <Link to="/organizer/events/new">Create event</Link>
        </Button>
      </PageHeader>
      <RemoteState {...query} empty={query.data?.length === 0}>
        <div className="event-grid">
          {query.data?.map((e) => (
            <article className="card" key={e.id}>
              <span className="badge">{e.effective_status}</span>
              <h2>{e.title}</h2>
              <p>{institutionDate(e.starts_at)}</p>
              <p>
                {e.registered_count} confirmed / {e.capacity} seats
              </p>
              <Button asChild>
                <Link to={`/organizer/events/${e.id}/edit`}>Manage event</Link>
              </Button>
            </article>
          ))}
        </div>
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 20}
      />
    </>
  );
}
const dates = [
  "starts_at",
  "ends_at",
  "registration_opens_at",
  "registration_closes_at",
  "cancellation_closes_at",
];
export function EventEditorPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const categories = useRemote(
    () => publicQuery("categories", {}, z.array(categorySchema)),
    "categories",
  );
  const query = useRemote(
    () =>
      eventId
        ? privateQuery(
            "managed_events",
            { event_id: eventId },
            z.array(eventSchema),
          )
        : Promise.resolve([]),
    eventId ?? "new",
  );
  const action = useAction(query.reload);
  const e = query.data?.[0];
  const fields: FieldDefinition[] = [
    { name: "title", label: "Event title", required: true, max: 160 },
    {
      name: "short_description",
      label: "Short description",
      type: "textarea",
      max: 500,
    },
    {
      name: "description",
      label: "Full description",
      type: "textarea",
      required: true,
      max: 20000,
    },
    {
      name: "category_id",
      label: "Event category",
      type: "select",
      required: true,
      options: categories.data?.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "department", label: "Organizing department", required: true },
    { name: "venue", label: "Venue", required: true },
    { name: "contact", label: "Event contact information", required: true },
    ...dates.map((name) => ({
      name,
      label: `${name.replaceAll("_", " ")} (Asia/Kolkata)`,
      type: "datetime-local" as const,
      required: true,
    })),
    {
      name: "capacity",
      label: "Participant seat capacity",
      type: "number",
      min: 1,
      max: 100000,
      required: true,
    },
    {
      name: "mode",
      label: "Registration mode",
      type: "select",
      required: true,
      options: [
        { value: "individual", label: "Individual" },
        { value: "team", label: "Team" },
      ],
    },
    {
      name: "min_team_size",
      label: "Minimum team size",
      type: "number",
      min: 2,
      max: 50,
      required: true,
    },
    {
      name: "max_team_size",
      label: "Maximum team size",
      type: "number",
      min: 2,
      max: 50,
      required: true,
    },
    {
      name: "fee",
      label: "Event fee (INR)",
      type: "number",
      min: 0,
      step: 0.01,
      hint: "Paid registrations remain blocked until an authorized payment integration is configured.",
    },
    {
      name: "eligible_departments",
      label: "Eligible departments (comma-separated; blank means all)",
    },
    {
      name: "eligible_years",
      label: "Eligible study years (comma-separated; blank means all)",
    },
    {
      name: "require_roster",
      label: "Require matching official roster entry",
      type: "checkbox",
    },
    { name: "waitlist_enabled", label: "Enable waitlist", type: "checkbox" },
    {
      name: "certificate_enabled",
      label: "Offer reviewed certificates",
      type: "checkbox",
    },
    {
      name: "certificate_attendance_percent",
      label: "Certificate attendance threshold (%)",
      type: "number",
      min: 1,
      max: 100,
      required: true,
    },
    {
      name: "attendance_mode",
      label: "Attendance scope",
      type: "select",
      required: true,
      options: [
        { value: "event", label: "Event-level" },
        { value: "session", label: "Every scheduled session" },
      ],
    },
    {
      name: "feedback_requires_attendance",
      label: "Require attendance for feedback",
      type: "checkbox",
    },
  ];
  const initial: Record<string, unknown> = e
    ? {
        ...e,
        eligible_departments: e.eligible_departments.join(", "),
        eligible_years: e.eligible_years.join(", "),
      }
    : {
        mode: "individual",
        min_team_size: 2,
        max_team_size: 5,
        fee: 0,
        certificate_attendance_percent: 100,
        attendance_mode: "event",
        feedback_requires_attendance: true,
      };
  if (e)
    for (const key of dates)
      initial[key] = institutionInput(String(e[key as keyof EventRecord]));
  return (
    <>
      <PageHeader
        title={eventId ? "Edit event" : "Create event"}
        description="All date/time inputs are in Asia/Kolkata. New events are saved as drafts."
      />
      {eventId && <WorkspaceNav eventId={eventId} />}
      <RemoteState
        loading={query.loading || categories.loading}
        error={query.error || categories.error}
        empty={Boolean(eventId && query.data?.length === 0)}
      >
        <section className="card form-card">
          <RecordForm
            key={`${eventId}-${e?.id}`}
            fields={fields}
            initial={initial}
            onSubmit={async (values) => {
              for (const key of dates)
                values[key] = institutionToUtc(String(values[key]));
              values.eligible_departments = String(
                values.eligible_departments ?? "",
              )
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);
              values.eligible_years = String(values.eligible_years ?? "")
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
                .map(Number);
              const valid = eventInputSchema.parse(values);
              const result = await command(
                "event_save",
                { ...valid, ...(eventId ? { event_id: eventId } : {}) },
                uuidResult,
              );
              if (!eventId) navigate(`/organizer/events/${result.id}/edit`);
              else query.reload();
            }}
            submitLabel="Save event"
          />
        </section>
        {e && (
          <section className="card section-gap">
            <h2>Publication and operations</h2>
            <p>
              Stored status: {e.status}. Effective status: {e.effective_status}.
            </p>
            {action.status}
            <RecordForm
              fields={[
                {
                  name: "status",
                  label: "New lifecycle status",
                  type: "select",
                  required: true,
                  options: [
                    "published",
                    "registration_closed",
                    "ongoing",
                    "completed",
                    "cancelled",
                  ].map((value) => ({
                    value,
                    label: value.replaceAll("_", " "),
                  })),
                },
                {
                  name: "reason",
                  label: "Reason (required for cancellation)",
                  type: "textarea",
                },
              ]}
              onSubmit={async (values) => {
                await command("event_transition", {
                  event_id: e.id,
                  status: String(values.status),
                  reason: String(values.reason),
                });
                query.reload();
              }}
              submitLabel="Apply lifecycle change"
            />
            <h2 className="section-gap">Event poster</h2>
            <label className="field">
              Upload an approved poster (JPEG, PNG or WebP; maximum 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void action.run(async () => {
                    if (file.size > 5 * 1024 * 1024)
                      throw new Error("Maximum poster size is 5 MB.");
                    const extension = {
                      "image/jpeg": "jpg",
                      "image/png": "png",
                      "image/webp": "webp",
                    }[file.type];
                    if (!extension) throw new Error("Unsupported image type.");
                    const path = `${e.id}/${crypto.randomUUID()}.${extension}`;
                    const { error } = await requireSupabase()
                      .storage.from("event-posters")
                      .upload(path, file);
                    if (error) throw error;
                    await command("poster_set", { event_id: e.id, path });
                  });
                }}
              />
            </label>
            <h2 className="section-gap">Assign approved event staff</h2>
            <RecordForm
              fields={[
                {
                  name: "user_id",
                  label: "Approved organizer account UUID",
                  required: true,
                },
              ]}
              onSubmit={async (values) => {
                await command("assign_organizer", {
                  event_id: e.id,
                  user_id: String(values.user_id),
                });
              }}
              submitLabel="Assign organizer"
            />
          </section>
        )}
      </RemoteState>
    </>
  );
}
export function SchedulePage() {
  const { eventId = "" } = useParams();
  const [editing, setEditing] = useState<z.infer<typeof sessionSchema> | null>(
    null,
  );
  const query = useRemote(
    () =>
      privateQuery("sessions", { event_id: eventId }, z.array(sessionSchema)),
    eventId,
  );
  const action = useAction(query.reload);
  return (
    <>
      <PageHeader
        title="Event schedule"
        description="Sessions must stay within event times. Overlapping venue reservations are reported."
      />
      <WorkspaceNav eventId={eventId} />
      {action.status}
      <RemoteState {...query}>
        {query.data?.map((s) => (
          <section className="card list-row" key={s.id}>
            <h2>{s.title}</h2>
            <p>
              {institutionDate(s.starts_at)} · {s.venue}
            </p>
            <div className="actions">
              <Button variant="outline" onClick={() => setEditing(s)}>
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void action.run(() =>
                    command("session_delete", { event_id: eventId, id: s.id }),
                  )
                }
              >
                Delete session
              </Button>
            </div>
          </section>
        ))}
      </RemoteState>
      <section className="card section-gap">
        <h2>{editing ? "Edit session" : "Add session"}</h2>
        <RecordForm
          key={editing?.id ?? "new"}
          fields={[
            { name: "title", label: "Session title", required: true },
            { name: "description", label: "Description", type: "textarea" },
            {
              name: "starts_at",
              label: "Starts (Asia/Kolkata)",
              type: "datetime-local",
              required: true,
            },
            {
              name: "ends_at",
              label: "Ends (Asia/Kolkata)",
              type: "datetime-local",
              required: true,
            },
            { name: "venue", label: "Venue", required: true },
            { name: "speaker", label: "Speaker / responsible person" },
            {
              name: "display_order",
              label: "Display order",
              type: "number",
              required: true,
            },
          ]}
          initial={
            editing
              ? {
                  ...editing,
                  starts_at: institutionInput(editing.starts_at),
                  ends_at: institutionInput(editing.ends_at),
                }
              : { display_order: 0 }
          }
          onSubmit={async (values) => {
            const result = await command(
              "session_save",
              {
                event_id: eventId,
                ...(editing ? { id: editing.id } : {}),
                title: String(values.title),
                description: String(values.description),
                starts_at: institutionToUtc(String(values.starts_at)),
                ends_at: institutionToUtc(String(values.ends_at)),
                venue: String(values.venue),
                speaker: String(values.speaker),
                display_order: Number(values.display_order),
              },
              z.object({ id: z.string(), overlap_warning: z.boolean() }),
            );
            query.reload();
            setEditing(null);
            if (result.overlap_warning)
              throw new Error(
                "Session saved. Warning: this venue overlaps another session. Review the schedule.",
              );
          }}
        />
      </section>
    </>
  );
}
