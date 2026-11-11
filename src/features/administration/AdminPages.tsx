import { useState } from "react";
import { z } from "zod";
import { command, privateQuery, useRemote } from "../../lib/portal";
import { anyRows, categorySchema, userSchema } from "../../types/portal";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../../components/ui/button";
import {
  DataTable,
  PageHeader,
  Pager,
  RecordForm,
  RemoteState,
  useAction,
} from "../../components/ui/portal";
export function UsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const query = useRemote(
    () => privateQuery("users", { page, search }, z.array(userSchema)),
    `${page}-${search}`,
  );
  const action = useAction(query.reload);
  return (
    <>
      <PageHeader
        title="User and role administration"
        description="Only approved active administrators can assign roles or deactivate accounts. Self-elevation and self-deactivation are rejected."
      />
      {action.status}
      <label className="field">
        Search real users
        <input
          className="input"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </label>
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((u) => (
          <section className="card list-row" key={u.id}>
            <h2>{u.full_name}</h2>
            <p>
              {u.email} · {u.department} ·{" "}
              {u.email_verified ? "Email verified" : "Unverified"} ·{" "}
              {u.is_active ? "Active" : "Inactive"}
            </p>
            <p className="reference">Account ID: {u.id}</p>
            <p>Approved roles: {u.roles?.join(", ") ?? "None"}</p>
            <div className="actions">
              {["organizer", "admin"].map((role) => (
                <Button
                  key={role}
                  variant="outline"
                  disabled={action.busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `${u.roles?.includes(role) ? "Revoke" : "Grant"} ${role} access for ${u.full_name}?`,
                      )
                    )
                      void action.run(() =>
                        command("role_set", {
                          user_id: u.id,
                          role,
                          enabled: !u.roles?.includes(role),
                        }),
                      );
                  }}
                >
                  {u.roles?.includes(role) ? "Revoke" : "Grant"} {role}
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={action.busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `${u.is_active ? "Deactivate" : "Reactivate"} ${u.full_name}?`,
                    )
                  )
                    void action.run(() =>
                      command("account_set_active", {
                        user_id: u.id,
                        active: !u.is_active,
                      }),
                    );
                }}
              >
                {u.is_active ? "Deactivate" : "Reactivate"} account
              </Button>
            </div>
          </section>
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
export function OrganizersPage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("organizer_requests", { page }, anyRows),
    String(page),
  );
  return (
    <>
      <PageHeader
        title="Organizer approval queue"
        description="Review genuine institutional authorization before approving access. A submitted request is not an approval."
      />
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((r) => (
          <article key={String(r.id)} className="card list-row">
            <h2>{String(r.full_name)}</h2>
            <p>{String(r.email)}</p>
            <p>{String(r.reason)}</p>
            <span className="badge">{String(r.status)}</span>
            {r.status === "pending" && (
              <RecordForm
                fields={[
                  {
                    name: "approve",
                    label: "Approve organizer access",
                    type: "checkbox",
                  },
                  {
                    name: "note",
                    label:
                      "Authorization review note / reference (at least 10 characters)",
                    required: true,
                    type: "textarea",
                  },
                ]}
                onSubmit={async (values) => {
                  await command("review_organizer", {
                    id: String(r.id),
                    approve: Boolean(values.approve),
                    note: String(values.note),
                  });
                  query.reload();
                }}
                submitLabel="Record decision"
              />
            )}
          </article>
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
export function AdminCategoriesPage() {
  const query = useRemote(
    () => privateQuery("categories", {}, z.array(categorySchema)),
    "admin-categories",
  );
  const action = useAction(query.reload);
  return (
    <>
      <PageHeader
        title="Manage categories"
        description="No categories are seeded. Add only categories you intend to use. Deactivation preserves historical event references."
      />
      {action.status}
      <section className="card">
        <RecordForm
          fields={[
            { name: "name", label: "New category name", required: true },
          ]}
          onSubmit={async (values) => {
            await command("category_save", { name: String(values.name) });
            query.reload();
          }}
          submitLabel="Add category"
        />
      </section>
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((c) => (
          <article className="card list-row" key={c.id}>
            <h2>
              {c.name} · {c.active ? "Active" : "Inactive"}
            </h2>
            <RecordForm
              fields={[
                { name: "name", label: "Category name", required: true },
                { name: "active", label: "Active", type: "checkbox" },
              ]}
              initial={c}
              onSubmit={async (values) => {
                await command("category_save", {
                  id: c.id,
                  name: String(values.name),
                  active: Boolean(values.active),
                });
                query.reload();
              }}
            />
          </article>
        ))}
      </RemoteState>
    </>
  );
}
export function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("audit", { page }, anyRows),
    String(page),
  );
  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Immutable administrative and workflow records. Authentication secrets and QR tokens are never logged."
      />
      <RemoteState {...query} empty={query.data?.length === 0}>
        <DataTable
          rows={query.data ?? []}
          columns={[
            { key: "created_at", label: "When" },
            { key: "actor_id", label: "Actor" },
            { key: "action", label: "Action" },
            { key: "subject_id", label: "Subject" },
            { key: "details", label: "Details" },
          ]}
          caption="Platform audit log"
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
export function SettingsPage() {
  const [outboxPage, setOutboxPage] = useState(0);
  const [issuePage, setIssuePage] = useState(0);
  const templates = useRemote(
    () => privateQuery("templates", {}, anyRows),
    "templates",
  );
  const action = useAction(templates.reload);
  const settings = useRemote(
    () => privateQuery("settings", {}, anyRows),
    "settings",
  );
  const outbox = useRemote(
    () => privateQuery("outbox", { page: outboxPage }, anyRows),
    `outbox-${outboxPage}`,
  );
  const issues = useRemote(
    () => privateQuery("support_issues", { page: issuePage }, anyRows),
    `issues-${issuePage}`,
  );
  return (
    <>
      <PageHeader
        title="Platform settings and operations"
        description="Never enter secrets here. Credentials belong in the hosting platform's secret store."
      />
      <div className="analytics-grid">
        <section className="card">
          <h2>Runtime preferences</h2>
          <RecordForm
            fields={[
              {
                name: "key",
                label: "Setting",
                type: "select",
                required: true,
                options: [
                  { value: "support_email", label: "Support email" },
                  {
                    value: "institution_timezone",
                    label: "Institution time zone (Asia/Kolkata)",
                  },
                  {
                    value: "reminder_hours",
                    label: "Reminder lead time (hours, 1–168)",
                  },
                ],
              },
              { name: "value", label: "Actual setting value", required: true },
            ]}
            onSubmit={async (values) => {
              await command("settings_save", {
                key: String(values.key),
                value: String(values.value),
              });
              settings.reload();
            }}
          />
          <RemoteState {...settings}>
            <DataTable
              rows={settings.data ?? []}
              columns={[
                { key: "key", label: "Setting" },
                { key: "value", label: "Value" },
              ]}
              caption="Configured platform preferences"
            />
          </RemoteState>
        </section>
        <section className="card">
          <h2>Create approved certificate template</h2>
          <p>
            Supply real institution-approved signatory details and wording. No
            signature image, signatory or approval is invented.
          </p>
          <RecordForm
            fields={[
              { name: "name", label: "Template name", required: true },
              {
                name: "institution",
                label: "Approved institution name",
                required: true,
              },
              {
                name: "signatory_name",
                label: "Authorized signatory name",
                required: true,
              },
              {
                name: "signatory_title",
                label: "Authorized signatory title",
                required: true,
              },
              {
                name: "body",
                label: "Approved certificate wording",
                type: "textarea",
                required: true,
                max: 2000,
              },
            ]}
            onSubmit={async (values) => {
              await command("template_save", {
                name: String(values.name),
                institution: String(values.institution),
                signatory_name: String(values.signatory_name),
                signatory_title: String(values.signatory_title),
                body: String(values.body),
              });
              templates.reload();
            }}
            submitLabel="Approve and save template"
          />
          {action.status}
          <RemoteState {...templates}>
            {templates.data?.map((t) => (
              <article className="list-row" key={String(t.id)}>
                <h3>{String(t.name)}</h3>
                <p>{String(t.signatory_name)}</p>
                <Button
                  variant="outline"
                  disabled={action.busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Deactivate this template for future issuance? Existing certificates remain unchanged.",
                      )
                    )
                      void action.run(() =>
                        command("template_deactivate", { id: String(t.id) }),
                      );
                  }}
                >
                  Deactivate template
                </Button>
              </article>
            ))}
          </RemoteState>
        </section>
      </div>
      <section className="card section-gap">
        <h2>Official roster verification</h2>
        <p>
          Use only a genuine authorized roster source. Saving a self-declared
          profile is not enrollment verification. Maintain the institution's
          authorization for this data import.
        </p>
        <RecordForm
          fields={[
            {
              name: "rrn",
              label: "Actual 12-digit register number",
              required: true,
            },
            {
              name: "department",
              label: "Department from official roster",
              required: true,
            },
            {
              name: "study_year",
              label: "Study year from official roster",
              type: "number",
              min: 1,
              max: 6,
              required: true,
            },
            {
              name: "active",
              label: "Roster lists student as currently enrolled",
              type: "checkbox",
            },
            {
              name: "source_authority",
              label: "Genuine roster source and authorization reference",
              required: true,
            },
          ]}
          onSubmit={async (values) => {
            await command("roster_upsert", {
              rrn: String(values.rrn),
              department: String(values.department),
              study_year: Number(values.study_year),
              active: Boolean(values.active),
              source_authority: String(values.source_authority),
            });
          }}
          submitLabel="Save authorized roster entry"
        />
      </section>
      <section className="card section-gap">
        <h2>Email delivery jobs</h2>
        <RemoteState {...outbox} empty={outbox.data?.length === 0}>
          <DataTable
            rows={outbox.data ?? []}
            columns={[
              { key: "status", label: "Status" },
              { key: "retry_count", label: "Attempts" },
              { key: "last_error", label: "Failure" },
              { key: "created_at", label: "Queued" },
              { key: "delivered_at", label: "Delivered" },
            ]}
            caption="Private email delivery state"
          />
        </RemoteState>
        <Pager
          page={outboxPage}
          setPage={setOutboxPage}
          hasNext={outbox.data?.length === 50}
        />
      </section>
      <section className="card section-gap">
        <h2>Reported issues</h2>
        <RemoteState {...issues} empty={issues.data?.length === 0}>
          {issues.data?.map((i) => (
            <article className="list-row" key={String(i.id)}>
              <h3>
                {String(i.subject)} · {String(i.status)}
              </h3>
              <p>{String(i.description)}</p>
              {i.status !== "resolved" && (
                <RecordForm
                  fields={[
                    {
                      name: "resolution",
                      label: "Resolution note (at least 10 characters)",
                      type: "textarea",
                      required: true,
                    },
                  ]}
                  onSubmit={async (values) => {
                    await command("support_resolve", {
                      id: String(i.id),
                      resolution: String(values.resolution),
                    });
                    issues.reload();
                  }}
                  submitLabel="Resolve issue"
                />
              )}
            </article>
          ))}
        </RemoteState>
        <Pager
          page={issuePage}
          setPage={setIssuePage}
          hasNext={issues.data?.length === 50}
        />
      </section>
    </>
  );
}
export function SupportPage() {
  const query = useRemote(
    () => privateQuery("support_issues", {}, anyRows),
    "my-issues",
  );
  return (
    <>
      <PageHeader
        title="Report a portal issue"
        description="Describe the actual problem. Do not include passwords, tokens or confidential certificate links."
      />
      <section className="card form-card">
        <RecordForm
          fields={[
            {
              name: "subject",
              label: "Issue subject",
              required: true,
              max: 160,
            },
            {
              name: "description",
              label: "Problem, affected workflow and reproduction steps",
              type: "textarea",
              required: true,
              max: 5000,
            },
          ]}
          onSubmit={async (values) => {
            await command("support_report", {
              subject: String(values.subject),
              description: String(values.description),
            });
            query.reload();
          }}
          submitLabel="Submit report"
        />
      </section>
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((i) => (
          <article className="card list-row" key={String(i.id)}>
            <h2>{String(i.subject)}</h2>
            <p>{String(i.status)}</p>
            <p>{String(i.resolution ?? "Awaiting review")}</p>
          </article>
        ))}
      </RemoteState>
    </>
  );
}
export function OrganizerRequestPanel() {
  const auth = useAuth();
  return (
    <section className="card section-gap">
      <h2>Request organizer access</h2>
      {auth.roles.includes("organizer") ? (
        <p>Your account already has approved organizer access.</p>
      ) : (
        <RecordForm
          fields={[
            {
              name: "reason",
              label:
                "Real responsibilities and institutional authorization reference (20–3000 characters)",
              type: "textarea",
              required: true,
              max: 3000,
            },
          ]}
          onSubmit={async (values) => {
            await command("request_organizer", {
              reason: String(values.reason),
            });
          }}
          submitLabel="Submit for administrator review"
        />
      )}
    </section>
  );
}
