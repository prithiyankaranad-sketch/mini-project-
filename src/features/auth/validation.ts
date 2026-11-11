import { z } from "zod";
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const collegeEmail = z
  .string()
  .transform(normalizeEmail)
  .pipe(
    z
      .string()
      .regex(
        /^\d{12}@crescent\.education$/,
        "Use your 12-digit RRN followed by @crescent.education.",
      ),
  );
export function extractRrn(value: string): string {
  const parsed = collegeEmail.safeParse(value);
  return parsed.success ? parsed.data.slice(0, 12) : "";
}
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use at most 128 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a digit.")
  .regex(/[^A-Za-z0-9]/, "Include a symbol.");
export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  study_year: z.number().int().min(1).max(6),
});
export const signupSchema = profileSchema
  .extend({
    email: collegeEmail,
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords must match.",
  });
export const loginSchema = z.object({
  email: collegeEmail,
  password: z.string().min(1, "Enter your password."),
});
export const resetSchema = z
  .object({ password: passwordSchema, confirm_password: z.string() })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords must match.",
  });
export type SignupInput = z.input<typeof signupSchema>;
export type SignupValues = z.output<typeof signupSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
