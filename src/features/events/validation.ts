import { z } from "zod";
const iso = z.string().datetime({ offset: true });
export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    short_description: z.string().max(500),
    description: z.string().max(20000),
    category_id: z.string(),
    department: z.string().trim().min(2).max(120),
    venue: z.string().trim().min(2).max(160),
    contact: z.string().trim().min(3).max(250),
    starts_at: iso,
    ends_at: iso,
    registration_opens_at: iso,
    registration_closes_at: iso,
    cancellation_closes_at: iso,
    capacity: z.number().int().min(1).max(100000),
    mode: z.enum(["individual", "team"]),
    min_team_size: z.number().int().min(2).max(50),
    max_team_size: z.number().int().min(2).max(50),
    fee: z.number().min(0),
    waitlist_enabled: z.boolean(),
    require_roster: z.boolean(),
    certificate_enabled: z.boolean(),
    certificate_attendance_percent: z.number().int().min(1).max(100),
    attendance_mode: z.enum(["event", "session"]),
    feedback_requires_attendance: z.boolean(),
    eligible_departments: z.array(z.string()),
    eligible_years: z.array(z.number().int().min(1).max(6)),
  })
  .refine(
    (x) => Date.parse(x.ends_at) > Date.parse(x.starts_at),
    "End must be after start.",
  )
  .refine(
    (x) =>
      Date.parse(x.registration_opens_at) <=
        Date.parse(x.registration_closes_at) &&
      Date.parse(x.registration_closes_at) <= Date.parse(x.starts_at),
    "Registration dates must end on or before event start.",
  )
  .refine(
    (x) => Date.parse(x.cancellation_closes_at) <= Date.parse(x.starts_at),
    "Cancellation deadline must be on or before event start.",
  )
  .refine(
    (x) => x.max_team_size >= x.min_team_size,
    "Maximum team size must be at least minimum.",
  );
export function canTransition(
  from: string,
  to: string,
  now: Date,
  starts: string,
  ends: string,
): boolean {
  return (
    (to === "published" && from === "draft") ||
    (to === "registration_closed" && from === "published") ||
    (to === "ongoing" &&
      ["published", "registration_closed"].includes(from) &&
      now.getTime() >= Date.parse(starts)) ||
    (to === "completed" &&
      !["draft", "completed", "cancelled"].includes(from) &&
      now.getTime() >= Date.parse(ends)) ||
    (to === "cancelled" && !["completed", "cancelled"].includes(from))
  );
}
