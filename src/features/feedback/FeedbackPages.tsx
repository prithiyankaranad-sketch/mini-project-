import { useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import {
  command,
  downloadCsv,
  privateQuery,
  useRemote,
} from "../../lib/portal";
import { feedbackSchema, registrationSchema } from "../../types/portal";
import { Button } from "../../components/ui/button";
import {
  DataTable,
  PageHeader,
  Pager,
  RecordForm,
  RemoteState,
  WorkspaceNav,
  useAction,
  type FieldDefinition,
} from "../../components/ui/portal";
export const feedbackInputSchema = z.object({
  overall: z.number().int().min(1).max(5),
  organization: z.number().int().min(1).max(5),
  content: z.number().int().min(1).max(5),
  venue: z.number().int().min(1).max(5),
  comments: z.string().max(3000),
  suggestions: z.string().max(3000),
});
export function FeedbackPage() {
  const [page, setPage] = useState(0);
  const registrations = useRemote(
    () => privateQuery("registrations", { page }, z.array(registrationSchema)),
    String(page),
  );
  const query = useRemote(
    () => privateQuery("feedback", { page }, z.array(feedbackSchema)),
    String(page),
  );
  const fields: FieldDefinition[] = [
    {
      name: "event_id",
      label: "Eligible completed event (current registration page)",
      type: "select",
      required: true,
      options: registrations.data
        ?.filter(
          (r) =>
            r.status === "confirmed" &&
            r.event_status === "completed" &&
            (!r.feedback_requires_attendance || r.attendance_percent > 0),
        )
        .map((r) => ({ value: r.event_id, label: r.event_title })),
    },
    ...["overall", "organization", "content", "venue"].map((name) => ({
      name,
      label: `${name} rating (1–5)`,
      type: "number" as const,
      min: 1,
      max: 5,
      required: true,
    })),
    {
      name: "comments",
      label: "Optional comments",
      type: "textarea",
      max: 3000,
    },
    {
      name: "suggestions",
      label: "Suggestions for future events",
      type: "textarea",
      max: 3000,
    },
    {
      name: "attend_future",
      label: "Would attend a future event",
      type: "checkbox",
    },
  ];
  return (
    <>
      <PageHeader
        title="Event feedback"
        description="One private response per eligible participant and event."
      />
      <RemoteState {...registrations}>
        <section className="card form-card">
          <RecordForm
            fields={fields}
            onSubmit={async (values) => {
              const valid = feedbackInputSchema.parse(values);
              await command("feedback_submit", {
                ...valid,
                event_id: String(values.event_id),
                attend_future: Boolean(values.attend_future),
              });
              query.reload();
            }}
            submitLabel="Submit feedback"
          />
        </section>
      </RemoteState>
      <h2 className="section-gap">Your submitted responses</h2>
      <RemoteState {...query} empty={query.data?.length === 0}>
        <DataTable
          rows={query.data ?? []}
          columns={[
            { key: "created_at", label: "Submitted" },
            { key: "overall", label: "Overall rating" },
            { key: "comments", label: "Comments" },
            { key: "suggestions", label: "Suggestions" },
          ]}
          caption="Your private event feedback"
        />
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 50 || registrations.data?.length === 20}
      />
    </>
  );
}
export function FeedbackWorkspace() {
  const { eventId = "" } = useParams();
  const [page, setPage] = useState(0);
  const query = useRemote(
    () =>
      privateQuery(
        "feedback",
        { event_id: eventId, page },
        z.array(feedbackSchema),
      ),
    `${eventId}-${page}`,
  );
  const action = useAction();
  return (
    <>
      <PageHeader
        title="Event feedback responses"
        description="Individual feedback is never exposed publicly."
      >
        <Button
          variant="outline"
          onClick={() =>
            void action.run(async () => {
              const all: Record<string, unknown>[] = [];
              for (let p = 0; p < 2000; p++) {
                const rows = await privateQuery(
                  "feedback",
                  { event_id: eventId, page: p },
                  z.array(feedbackSchema),
                );
                all.push(...rows);
                if (rows.length < 50) {
                  downloadCsv("event-feedback.csv", all);
                  return;
                }
              }
              throw new Error("Export too large.");
            }, "Feedback CSV downloaded.")
          }
        >
          Export feedback CSV
        </Button>
      </PageHeader>
      <WorkspaceNav eventId={eventId} />
      {action.status}
      <RemoteState {...query} empty={query.data?.length === 0}>
        <DataTable
          rows={query.data ?? []}
          columns={[
            { key: "overall", label: "Overall" },
            { key: "organization", label: "Organization" },
            { key: "content", label: "Content" },
            { key: "venue", label: "Venue" },
            { key: "comments", label: "Comments" },
            { key: "suggestions", label: "Suggestions" },
          ]}
          caption="Authorized feedback responses"
        />
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 50}
      />
    </>
  );
}
