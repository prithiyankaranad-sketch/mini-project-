import { useId, useState, type ReactNode } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "./button";
import { ErrorMessage, Loading, SuccessMessage, errorMessage } from "./status";
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  level = 1,
}: {
  level?: 1 | 2;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {level === 1 ? <h1>{title}</h1> : <h2>{title}</h2>}
        {description && <p className="page-lead">{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function RemoteState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading) return <Loading text="Loading database records…" />;
  if (error) return <ErrorMessage message={error} />;
  if (empty)
    return (
      <div className="card empty-state">
        <h2>No records found</h2>
        <p>
          There are no records matching this view. No sample data is displayed.
        </p>
      </div>
    );
  return <>{children}</>;
}
export function Pager({
  page,
  setPage,
  hasNext,
}: {
  page: number;
  setPage: (page: number) => void;
  hasNext: boolean;
}) {
  return (
    <div className="actions pagination">
      <Button
        variant="outline"
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <span>Page {page + 1}</span>
      <Button
        variant="outline"
        disabled={!hasNext}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
export function useAction(onSuccess?: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return {
    busy,
    run: async (
      action: () => Promise<unknown>,
      message = "Saved successfully.",
    ) => {
      try {
        setBusy(true);
        setError("");
        setSuccess("");
        await action();
        setSuccess(message);
        onSuccess?.();
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    status: (
      <>
        {error && <ErrorMessage message={error} />}{" "}
        {success && <SuccessMessage message={success} />}
      </>
    ),
  };
}
export type FieldDefinition = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "datetime-local"
    | "textarea"
    | "checkbox"
    | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  hint?: string;
};
export function RecordForm({
  fields,
  initial = {},
  onSubmit,
  submitLabel = "Save",
  children,
}: {
  fields: FieldDefinition[];
  initial?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<unknown>;
  submitLabel?: string;
  children?: ReactNode;
}) {
  const prefix = useId();
  const action = useAction();
  const [formKey, setFormKey] = useState(0);
  return (
    <>
      {action.status}
      <form
        key={formKey}
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const values: Record<string, unknown> = {};
          for (const f of fields)
            values[f.name] =
              f.type === "checkbox"
                ? data.has(f.name)
                : f.type === "number"
                  ? Number(data.get(f.name))
                  : String(data.get(f.name) ?? "");
          void action.run(async () => {
            await onSubmit(values);
            if (Object.keys(initial).length === 0) setFormKey((k) => k + 1);
          });
        }}
      >
        {fields.map((f) => (
          <div
            className={`field ${f.type === "checkbox" ? "checkbox-field" : ""}`}
            key={f.name}
          >
            <label htmlFor={`${prefix}-${f.name}`}>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                className="input"
                id={`${prefix}-${f.name}`}
                name={f.name}
                required={f.required}
                maxLength={f.max}
                rows={5}
                defaultValue={String(initial[f.name] ?? "")}
              />
            ) : f.type === "select" ? (
              <select
                className="input"
                id={`${prefix}-${f.name}`}
                name={f.name}
                required={f.required}
                defaultValue={String(initial[f.name] ?? "")}
              >
                <option value="" disabled>
                  Select…
                </option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={f.type === "checkbox" ? "" : "input"}
                id={`${prefix}-${f.name}`}
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                min={f.min}
                max={f.max}
                step={f.step}
                defaultChecked={
                  f.type === "checkbox" ? Boolean(initial[f.name]) : undefined
                }
                defaultValue={
                  f.type === "checkbox"
                    ? undefined
                    : String(initial[f.name] ?? "")
                }
              />
            )}
            {f.hint && <p className="hint">{f.hint}</p>}
          </div>
        ))}
        {children}
        <Button type="submit" disabled={action.busy}>
          {action.busy ? "Saving…" : submitLabel}
        </Button>
      </form>
    </>
  );
}
export function DataTable({
  rows,
  columns,
  caption,
}: {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  caption: string;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row.id ?? i)}>
              {columns.map((c) => (
                <td key={c.key}>
                  {row[c.key] === null || row[c.key] === undefined
                    ? "Not available"
                    : typeof row[c.key] === "object"
                      ? JSON.stringify(row[c.key])
                      : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function WorkspaceNav({ eventId }: { eventId: string }) {
  return (
    <nav className="workspace-tabs" aria-label="Event management">
      {[
        "edit",
        "participants",
        "schedule",
        "attendance",
        "certificates",
        "feedback",
        "reports",
      ].map((tab) => (
        <Link key={tab} to={`/organizer/events/${eventId}/${tab}`}>
          {tab.replaceAll("_", " ")}
        </Link>
      ))}
    </nav>
  );
}
export const uuidResult = z.object({ id: z.string() });
