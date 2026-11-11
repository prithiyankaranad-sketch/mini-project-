import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  environment,
  headers,
  json,
  escapeHtml as esc,
} from "../_shared/http.ts";
Deno.serve(async (request) => {
  let h: Record<string, string>;
  try {
    h = headers(request);
  } catch {
    return new Response("Origin denied", { status: 403 });
  }
  if (request.method !== "POST")
    return json({ error: "POST required" }, 405, h);
  const supplied =
    request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  const expected = environment("OUTBOX_WORKER_SECRET");
  // Hash both values before constant-time equality; no secret enters logs or responses.
  const digest = async (x: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)),
    );
  const a = await digest(supplied),
    b = await digest(expected);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return json({ error: "Unauthorized scheduler" }, 401, h);
  try {
    const db = createClient(
      environment("SUPABASE_URL"),
      environment("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } },
    );
    const { error: reminderError } = await db.rpc("queue_event_reminders");
    if (reminderError) throw reminderError;
    const { data: jobs, error } = await db.rpc("claim_email_jobs");
    if (error) throw error;
    let delivered = 0,
      failed = 0;
    await Promise.all(
      jobs.map(
        async (job: {
          id: string;
          recipient: string;
          lease_token: string;
          payload: Record<string, string>;
        }) => {
          let failure: string | null = null;
          let provider: string | null = null;
          try {
            const p = job.payload;
            const eventUrl = p.event_id
              ? `${environment("APP_BASE_URL").replace(/\/$/, "")}/events/${encodeURIComponent(p.event_id)}`
              : environment("APP_BASE_URL");
            const when = p.starts_at
              ? new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(new Date(p.starts_at))
              : "";
            const html = `<main style="font-family:Arial,sans-serif;color:#172033;max-width:600px;margin:auto;padding:32px"><p>College Event Portal</p><h1>${esc(p.title)}</h1><p>${esc(p.message)}</p><h2>${esc(p.event_title)}</h2><p>${esc(when)}</p><p>${esc(p.venue)}</p>${p.reference ? `<p>Registration reference: <strong>${esc(p.reference)}</strong></p>` : ""}<p><a href="${esc(eventUrl)}">Open event details</a></p></main>`;
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${environment("RESEND_API_KEY")}`,
                "Content-Type": "application/json",
                "Idempotency-Key": job.id,
              },
              body: JSON.stringify({
                from: environment("RESEND_FROM_EMAIL"),
                to: [job.recipient],
                subject: p.title,
                html,
                text: [
                  p.title,
                  p.message,
                  p.event_title,
                  when,
                  p.venue,
                  p.reference,
                  eventUrl,
                ]
                  .filter(Boolean)
                  .join("\n"),
              }),
              signal: AbortSignal.timeout(20000),
            });
            if (!response.ok)
              throw new Error(`Provider HTTP ${response.status}`);
            provider = (await response.json()).id;
            if (typeof provider !== "string" || !provider)
              throw new Error("Provider returned no acceptance identifier");
            delivered++;
          } catch (err) {
            failure =
              err instanceof Error ? err.message : "Email delivery failed";
            failed++;
          }
          const { error: recordError } = await db.rpc("finish_email_job", {
            job_id: job.id,
            lease: job.lease_token,
            provider,
            failure,
          });
          if (recordError) throw recordError;
        },
      ),
    );
    return json({ claimed: jobs.length, delivered, failed }, 200, h);
  } catch (error) {
    console.error(
      "Email worker failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      { error: "Email worker failed; inspect delivery state before retrying." },
      500,
      h,
    );
  }
});
