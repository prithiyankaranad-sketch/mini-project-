import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import QRCode from "qrcode";
import {
  command,
  downloadCsv,
  institutionDate,
  privateQuery,
  useRemote,
} from "../../lib/portal";
import { participantSchema, registrationSchema } from "../../types/portal";
import { Button } from "../../components/ui/button";
import {
  DataTable,
  PageHeader,
  Pager,
  RecordForm,
  RemoteState,
  useAction,
  WorkspaceNav,
} from "../../components/ui/portal";
export function RegistrationsPage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("registrations", { page }, z.array(registrationSchema)),
    String(page),
  );
  return (
    <>
      <PageHeader
        title="My registrations"
        description="Your confirmed, waitlisted and cancelled registrations."
      />
      <RemoteState {...query} empty={query.data?.length === 0}>
        <div className="event-grid">
          {query.data?.map((r) => (
            <article className="card" key={r.id}>
              <span className="badge">{r.status}</span>
              <h2>{r.event_title}</h2>
              <p>
                {institutionDate(r.starts_at)} · {r.venue}
              </p>
              <p className="reference">{r.reference}</p>
              <Button asChild>
                <Link to={`/student/registrations/${r.id}`}>
                  Registration details
                </Link>
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
export function RegistrationDetailPage() {
  const { registrationId = "" } = useParams();
  const query = useRemote(
    () =>
      privateQuery(
        "registrations",
        { id: registrationId },
        z.array(registrationSchema),
      ),
    registrationId,
  );
  const action = useAction(query.reload);
  const [token, setToken] = useState("");
  const [image, setImage] = useState("");
  const [qrError, setQrError] = useState("");
  const r = query.data?.[0];
  useEffect(() => {
    let alive = true;
    setImage("");
    setQrError("");
    if (token)
      void QRCode.toDataURL(token, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((result) => {
          if (alive) setImage(result);
        })
        .catch(() => {
          if (alive)
            setQrError(
              "QR rendering failed. Generate a new code or ask authorized event staff for manual attendance.",
            );
        });
    return () => {
      alive = false;
    };
  }, [token]);
  return (
    <>
      <PageHeader title="Registration details" />
      <RemoteState {...query} empty={query.data?.length === 0}>
        {r && (
          <section className="card">
            <h2>{r.event_title}</h2>
            <span className="badge">{r.status}</span>
            <dl className="definition-list">
              <dt>Reference</dt>
              <dd>{r.reference}</dd>
              <dt>Event time</dt>
              <dd>{institutionDate(r.starts_at)}</dd>
              <dt>Venue</dt>
              <dd>{r.venue}</dd>
              <dt>Attendance</dt>
              <dd>{r.attendance_percent.toFixed(1)}%</dd>
              <dt>Cancellation cutoff</dt>
              <dd>{institutionDate(r.cancellation_closes_at)}</dd>
            </dl>
            {action.status}
            <div className="actions">
              <Button asChild variant="outline">
                <Link to={`/events/${r.event_id}`}>Open event</Link>
              </Button>
              {r.status === "confirmed" && (
                <Button
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      const result = await command(
                        "qr_token",
                        { registration_id: r.id },
                        z.object({ token: z.string(), event_id: z.string() }),
                      );
                      setToken(result.token);
                    }, "A fresh check-in QR was generated. Previous QR codes are invalid.")
                  }
                >
                  Generate check-in QR
                </Button>
              )}
              {r.status !== "cancelled" && (
                <Button
                  variant="outline"
                  disabled={action.busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Cancel this registration? A team cancellation affects every member.",
                      )
                    )
                      void action.run(() =>
                        command("cancel_registration", {
                          registration_id: r.id,
                        }),
                      );
                  }}
                >
                  Cancel registration
                </Button>
              )}
            </div>
            {qrError && <p role="alert">{qrError}</p>}
            {image && (
              <figure className="qr-panel">
                <img
                  src={image}
                  width={256}
                  height={256}
                  alt="Private check-in token QR code"
                />
                <figcaption>
                  Show this code only to authorized event staff. It contains no
                  personal information.
                </figcaption>
              </figure>
            )}
          </section>
        )}
      </RemoteState>
    </>
  );
}
export function ParticipantsPage() {
  const { eventId = "" } = useParams();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState({
    search: "",
    status: "",
    attendance: "",
  });
  const query = useRemote(
    () =>
      privateQuery(
        "participants",
        { event_id: eventId, page, ...filter },
        z.array(participantSchema),
      ),
    JSON.stringify([eventId, page, filter]),
  );
  const action = useAction(query.reload);
  async function exportAll() {
    const rows: Record<string, unknown>[] = [];
    for (let p = 0; p < 2000; p++) {
      const batch = await privateQuery(
        "participants",
        { event_id: eventId, page: p, ...filter },
        z.array(participantSchema),
      );
      rows.push(...batch);
      if (batch.length < 50) {
        downloadCsv("participants.csv", rows);
        return;
      }
    }
    throw new Error("Export exceeds 100,000 records. Narrow the filters.");
  }
  return (
    <>
      <PageHeader
        title="Event participants"
        description="Private participant access is restricted to explicitly assigned event staff."
      >
        <Button
          variant="outline"
          disabled={action.busy}
          onClick={() =>
            void action.run(exportAll, "Authorized export downloaded.")
          }
        >
          Export filtered CSV
        </Button>
      </PageHeader>
      <WorkspaceNav eventId={eventId} />
      {action.status}
      <RecordForm
        fields={[
          {
            name: "search",
            label: "Search name, RRN, department or reference",
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "", label: "All" },
              { value: "confirmed", label: "Confirmed" },
              { value: "waitlisted", label: "Waitlisted" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
          {
            name: "attendance",
            label: "Attendance",
            type: "select",
            options: [
              { value: "", label: "All" },
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
            ],
          },
        ]}
        initial={filter}
        submitLabel="Apply filters"
        onSubmit={async (values) => {
          setFilter({
            search: String(values.search),
            status: String(values.status),
            attendance: String(values.attendance),
          });
          setPage(0);
        }}
      />
      <RemoteState {...query} empty={query.data?.length === 0}>
        <DataTable
          rows={query.data ?? []}
          columns={[
            { key: "full_name", label: "Name" },
            { key: "rrn", label: "RRN" },
            { key: "department", label: "Department" },
            { key: "reference", label: "Reference" },
            { key: "status", label: "Status" },
            { key: "attendance_percent", label: "Attendance %" },
          ]}
          caption="Authorized participant records"
        />
        {query.data
          ?.filter((r) => r.status !== "cancelled")
          .map((r) => (
            <div key={r.id} className="list-row actions">
              <span>
                {r.full_name} · {r.reference}
              </span>
              <Button
                variant="outline"
                disabled={action.busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `Cancel the registration for ${r.full_name}?`,
                    )
                  )
                    void action.run(() =>
                      command("cancel_registration", { registration_id: r.id }),
                    );
                }}
              >
                Cancel participation
              </Button>
            </div>
          ))}
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 50}
      />
      <section className="card section-gap">
        <h2>Waitlist management</h2>
        <p>
          FIFO promotion rechecks eligibility and allocates all team seats
          atomically. Cancelling an allocated registration also attempts
          promotion.
        </p>
        <Button
          disabled={action.busy}
          onClick={() =>
            void action.run(() =>
              command("promote_waitlist", { event_id: eventId }),
            )
          }
        >
          Promote eligible waitlist
        </Button>
        <h2 className="section-gap">Send event update</h2>
        <RecordForm
          fields={[
            {
              name: "message",
              label: "Message to active registrants",
              type: "textarea",
              required: true,
              max: 5000,
            },
          ]}
          onSubmit={async (values) => {
            await command("event_message", {
              event_id: eventId,
              message: String(values.message),
            });
          }}
          submitLabel="Queue in-app and email update"
        />
      </section>
    </>
  );
}
