import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import {
  command,
  privateQuery,
  publicQuery,
  useRemote,
  institutionDate,
} from "../../lib/portal";
import { requireSupabase } from "../../lib/supabase";
import {
  certificateSchema,
  participantSchema,
  templateSchema,
  eventSchema,
} from "../../types/portal";
import { Button } from "../../components/ui/button";
import {
  PageHeader,
  Pager,
  RecordForm,
  RemoteState,
  useAction,
  WorkspaceNav,
} from "../../components/ui/portal";
export function CertificatesPage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("certificates", { page }, z.array(certificateSchema)),
    String(page),
  );
  const action = useAction();
  return (
    <>
      <PageHeader
        title="My certificates"
        description="Certificates require finalized attendance, eligibility checks and explicit organizer approval."
      />
      {action.status}
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((c) => (
          <section className="card list-row" key={c.id}>
            <span className="badge">{c.status}</span>
            <h2>{c.snapshot.event}</h2>
            <p>
              {c.type.replaceAll("_", " ")} · {c.snapshot.participant}
            </p>
            {c.issued_at && <p>Issued {institutionDate(c.issued_at)}</p>}
            <div className="actions">
              <Link to={`/verify/${c.verification_id}`}>
                Verify authenticity
              </Link>
              {c.status === "issued" && c.object_path && (
                <Button
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      const { data, error } = await requireSupabase()
                        .storage.from("certificates")
                        .createSignedUrl(c.object_path!, 60);
                      if (error) throw error;
                      window.location.assign(data.signedUrl);
                    }, "Opening the time-limited private certificate link.")
                  }
                >
                  Download PDF
                </Button>
              )}
            </div>
            {c.status === "revoked" && <p>Revoked: {c.revocation_reason}</p>}
          </section>
        ))}
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 20}
      />
    </>
  );
}
const verificationSchema = z
  .object({
    verification_id: z.string(),
    status: z.string(),
    participant: z.string(),
    event: z.string(),
    institution: z.string(),
    type: z.string(),
    issued_at: z.string().nullable(),
    revoked_at: z.string().nullable(),
  })
  .nullable();
export function VerifyCertificatePage() {
  const { certificateId = "" } = useParams();
  const query = useRemote(
    () => publicQuery("verify", { id: certificateId }, verificationSchema),
    certificateId,
  );
  const c = query.data;
  return (
    <>
      <PageHeader
        title="Certificate verification"
        description="Public verification exposes limited certificate facts, never private PDF files, college email or register numbers."
      />
      <RemoteState {...query}>
        {c ? (
          <section className="card">
            <span className="badge">
              {c.status === "issued"
                ? "Valid issued certificate"
                : "REVOKED — certificate is not valid"}
            </span>
            <h2>{c.participant}</h2>
            <p>{c.event}</p>
            <p>{c.institution}</p>
            <p>{c.type.replaceAll("_", " ")}</p>
            <p className="reference">{c.verification_id}</p>
            {c.issued_at && <p>Issued: {institutionDate(c.issued_at)}</p>}
            {c.revoked_at && <p>Revoked: {institutionDate(c.revoked_at)}</p>}
          </section>
        ) : (
          <section className="card">
            <h2>No issued certificate found</h2>
            <p>
              This identifier does not match an issued or revoked certificate.
              Authenticity is not confirmed.
            </p>
          </section>
        )}
      </RemoteState>
    </>
  );
}
export function CertificatesWorkspace() {
  const { eventId = "" } = useParams();
  const [page, setPage] = useState(0);
  const [participantPage, setParticipantPage] = useState(0);
  const query = useRemote(
    () =>
      privateQuery(
        "certificates",
        { event_id: eventId, page },
        z.array(certificateSchema),
      ),
    `${eventId}-${page}`,
  );
  const participants = useRemote(
    () =>
      privateQuery(
        "participants",
        { event_id: eventId, status: "confirmed", page: participantPage },
        z.array(participantSchema),
      ),
    `${eventId}-${participantPage}`,
  );
  const templates = useRemote(
    () => privateQuery("templates", {}, z.array(templateSchema)),
    "templates",
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
  const e = event.data?.[0];
  return (
    <>
      <PageHeader
        title="Certificate issuance"
        description="Use only genuinely approved templates and signatories. Registration alone never makes a participant eligible."
      />
      <WorkspaceNav eventId={eventId} />
      <section className="card">
        <h2>Review and issue</h2>
        <p>
          {e
            ? `Attendance finalized: ${e.attendance_finalized ? "Yes" : "No"}. Required attendance: ${e.certificate_attendance_percent}%.`
            : "Loading event rules…"}
        </p>
        <RemoteState
          loading={participants.loading || templates.loading || event.loading}
          error={participants.error || templates.error || event.error}
        >
          <RecordForm
            fields={[
              {
                name: "registration_id",
                label: "Eligible participant (current participant page)",
                type: "select",
                required: true,
                options: participants.data
                  ?.filter(
                    (p) =>
                      e &&
                      p.attendance_percent >= e.certificate_attendance_percent,
                  )
                  .map((p) => ({
                    value: p.id,
                    label: `${p.full_name} — ${p.reference} (${p.attendance_percent.toFixed(1)}%)`,
                  })),
              },
              {
                name: "template_id",
                label: "Approved template",
                type: "select",
                required: true,
                options: templates.data?.map((t) => ({
                  value: t.id,
                  label: `${t.name} — ${t.signatory_name}`,
                })),
              },
              {
                name: "type",
                label: "Certificate type",
                type: "select",
                required: true,
                options: [
                  "participation",
                  "completion",
                  "achievement",
                  "winner",
                  "runner_up",
                ].map((value) => ({
                  value,
                  label: value.replaceAll("_", " "),
                })),
              },
              {
                name: "reason",
                label: "Approval reason (at least 10 characters)",
                type: "textarea",
                required: true,
              },
            ]}
            onSubmit={async (values) => {
              const { data, error } = await requireSupabase().functions.invoke(
                "issue-certificate",
                { body: values },
              );
              if (error) throw error;
              if (data?.error) throw new Error(String(data.error));
              query.reload();
            }}
            submitLabel="Approve and generate private PDF"
          />
        </RemoteState>
        <Pager
          page={participantPage}
          setPage={setParticipantPage}
          hasNext={participants.data?.length === 50}
        />
      </section>
      <section className="card section-gap">
        <h2>Issued, pending and revoked certificates</h2>
        <RemoteState {...query} empty={query.data?.length === 0}>
          {query.data?.map((c) => (
            <article className="list-row" key={c.id}>
              <h3>
                {c.snapshot.participant} · {c.type} · {c.status}
              </h3>
              <Link to={`/verify/${c.verification_id}`}>
                Verification record
              </Link>
              {c.status !== "revoked" && (
                <RecordForm
                  fields={[
                    {
                      name: "reason",
                      label: "Revocation reason (at least 10 characters)",
                      required: true,
                    },
                  ]}
                  onSubmit={async (values) => {
                    await command("certificate_revoke", {
                      id: c.id,
                      reason: String(values.reason),
                    });
                    query.reload();
                  }}
                  submitLabel="Revoke certificate"
                />
              )}
            </article>
          ))}
        </RemoteState>
        <Pager
          page={page}
          setPage={setPage}
          hasNext={query.data?.length === 20}
        />
      </section>
    </>
  );
}
