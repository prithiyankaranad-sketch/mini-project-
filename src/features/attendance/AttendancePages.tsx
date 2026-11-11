import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import {
  command,
  downloadCsv,
  institutionDate,
  privateQuery,
  useRemote,
} from "../../lib/portal";
import {
  attendanceSchema,
  eventSchema,
  participantSchema,
  sessionSchema,
  anyRows,
} from "../../types/portal";
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
export function StudentAttendancePage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("attendance", { page }, z.array(attendanceSchema)),
    String(page),
  );
  return (
    <>
      <PageHeader
        title="My attendance"
        description="Only attendance actually recorded by authorized event staff appears here."
      />
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((a) => (
          <div className="card list-row" key={a.id}>
            <h2>{a.event_title}</h2>
            <p>
              {a.session_title ?? "Event-level attendance"} ·{" "}
              {a.present ? "Present" : "Corrected to absent"}
            </p>
            <p>{institutionDate(a.checked_in_at)}</p>
          </div>
        ))}
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 50}
      />
    </>
  );
}
export function AttendanceWorkspace() {
  const { eventId = "" } = useParams();
  const [page, setPage] = useState(0);
  const [participantPage, setParticipantPage] = useState(0);
  const [correctionPage, setCorrectionPage] = useState(0);
  const [session, setSession] = useState("");
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const processing = useRef(false);
  const query = useRemote(
    () =>
      privateQuery(
        "attendance",
        { event_id: eventId, page },
        z.array(attendanceSchema),
      ),
    `${eventId}-${page}`,
  );
  const sessions = useRemote(
    () =>
      privateQuery("sessions", { event_id: eventId }, z.array(sessionSchema)),
    eventId,
  );
  const participants = useRemote(
    () =>
      privateQuery(
        "participants",
        {
          event_id: eventId,
          search,
          status: "confirmed",
          page: participantPage,
        },
        z.array(participantSchema),
      ),
    `${eventId}-${search}-${participantPage}`,
  );
  const event = useRemote(
    () =>
      privateQuery(
        "managed_events",
        { event_id: eventId },
        z.array(eventSchema),
      ),
    eventId,
  );
  const corrections = useRemote(
    () =>
      privateQuery(
        "attendance_corrections",
        { event_id: eventId, page: correctionPage },
        anyRows,
      ),
    `${eventId}-${query.loading}-${correctionPage}`,
  );
  const action = useAction(() => {
    query.reload();
    corrections.reload();
  });
  useEffect(
    () => () => {
      controls.current?.stop();
    },
    [],
  );
  async function startScanner() {
    if (!video.current) return;
    setScanning(true);
    try {
      controls.current = await new BrowserQRCodeReader().decodeFromVideoDevice(
        undefined,
        video.current,
        (result, _error, scanner) => {
          if (result && !processing.current) {
            processing.current = true;
            scanner.stop();
            setScanning(false);
            void action.run(async () => {
              try {
                await command("attendance_scan", {
                  event_id: eventId,
                  token: result.getText(),
                  ...(session ? { session_id: session } : {}),
                });
              } finally {
                processing.current = false;
              }
            }, "Attendance recorded.");
          }
        },
      );
    } catch (error) {
      setScanning(false);
      throw error;
    }
  }
  return (
    <>
      <PageHeader
        title="Attendance desk"
        description="Check-ins require event authorization, a confirmed registration, the event time window and the correct session."
      />
      <WorkspaceNav eventId={eventId} />
      {action.status}
      <section className="card">
        <h2>QR check-in</h2>
        {event.data?.[0]?.attendance_mode === "session" && (
          <label className="field">
            Required event session
            <select
              className="input"
              value={session}
              disabled={scanning}
              onChange={(e) => setSession(e.target.value)}
            >
              <option value="">Select a session</option>
              {sessions.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <video
          ref={video}
          className="scanner"
          muted
          playsInline
          aria-label="QR scanner camera preview"
        />
        <div className="actions">
          <Button
            disabled={scanning || action.busy}
            onClick={() =>
              void action.run(
                startScanner,
                "Scanner started. Camera access requires browser permission.",
              )
            }
          >
            Start QR camera
          </Button>
          <Button
            variant="outline"
            disabled={!scanning}
            onClick={() => {
              controls.current?.stop();
              setScanning(false);
            }}
          >
            Stop camera
          </Button>
        </div>
        <RecordForm
          fields={[
            {
              name: "token",
              label: "Scan/paste opaque check-in token",
              required: true,
            },
          ]}
          submitLabel="Validate check-in"
          onSubmit={async (values) => {
            await command("attendance_scan", {
              event_id: eventId,
              token: String(values.token),
              ...(session ? { session_id: session } : {}),
            });
            query.reload();
          }}
        />
      </section>
      <section className="card section-gap">
        <h2>Manual check-in</h2>
        <label className="field">
          Search actual confirmed participants
          <input
            className="input"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setParticipantPage(0);
            }}
          />
        </label>
        <RemoteState {...participants} empty={participants.data?.length === 0}>
          {participants.data?.map((r) => (
            <div className="list-row actions" key={r.id}>
              <span>
                {r.full_name} · {r.rrn} · {r.reference}
              </span>
              <Button
                disabled={action.busy}
                onClick={() =>
                  void action.run(() =>
                    command("attendance_manual", {
                      event_id: eventId,
                      registration_id: r.id,
                      ...(session ? { session_id: session } : {}),
                    }),
                  )
                }
              >
                Mark present
              </Button>
            </div>
          ))}
        </RemoteState>
        <Pager
          page={participantPage}
          setPage={setParticipantPage}
          hasNext={participants.data?.length === 50}
        />
      </section>
      <section className="card section-gap">
        <h2>Attendance records and corrections</h2>
        <Button
          variant="outline"
          onClick={() =>
            void action.run(async () => {
              const all: Record<string, unknown>[] = [];
              for (let p = 0; p < 2000; p++) {
                const rows = await privateQuery(
                  "attendance",
                  { event_id: eventId, page: p },
                  z.array(attendanceSchema),
                );
                all.push(...rows);
                if (rows.length < 50) {
                  downloadCsv("attendance.csv", all);
                  return;
                }
              }
              throw new Error("Export too large; narrow the scope.");
            }, "Attendance CSV downloaded.")
          }
        >
          Export attendance CSV
        </Button>
        <RemoteState {...query} empty={query.data?.length === 0}>
          {query.data?.map((a) => (
            <article className="list-row" key={a.id}>
              <h3>
                {a.full_name} · {a.session_title ?? "Event"}
              </h3>
              <p>
                {a.present ? "Present" : "Absent"} ·{" "}
                {institutionDate(a.checked_in_at)}
              </p>
              <RecordForm
                fields={[
                  {
                    name: "reason",
                    label: "Correction reason (at least 10 characters)",
                    required: true,
                  },
                ]}
                submitLabel={
                  a.present ? "Correct to absent" : "Correct to present"
                }
                onSubmit={async (values) => {
                  await command("attendance_correct", {
                    event_id: eventId,
                    id: a.id,
                    present: !a.present,
                    reason: String(values.reason),
                  });
                  query.reload();
                  corrections.reload();
                }}
              />
            </article>
          ))}
        </RemoteState>
        <Pager
          page={page}
          setPage={setPage}
          hasNext={query.data?.length === 50}
        />
        <h3 className="section-gap">Correction history</h3>
        <RemoteState {...corrections} empty={corrections.data?.length === 0}>
          <DataTable
            rows={corrections.data ?? []}
            columns={[
              { key: "created_at", label: "When" },
              { key: "actor_id", label: "Actor" },
              { key: "previous_present", label: "Previous" },
              { key: "new_present", label: "Corrected" },
              { key: "reason", label: "Reason" },
            ]}
            caption="Audited attendance corrections"
          />
        </RemoteState>
        <Pager
          page={correctionPage}
          setPage={setCorrectionPage}
          hasNext={corrections.data?.length === 50}
        />
        <h3 className="section-gap">Finalize attendance</h3>
        <p>
          Complete the event first. Finalization locks further attendance
          changes and enables certificate eligibility evaluation.
        </p>
        <Button
          disabled={action.busy}
          onClick={() => {
            if (
              window.confirm(
                "Finalize attendance? This locks attendance records.",
              )
            )
              void action.run(() =>
                command("attendance_finalize", { event_id: eventId }),
              );
          }}
        >
          Finalize reviewed attendance
        </Button>
      </section>
    </>
  );
}
