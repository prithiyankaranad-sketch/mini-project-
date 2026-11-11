import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import {
  collegeEmail,
  extractRrn,
  loginSchema,
  resetSchema,
  signupSchema,
  type SignupInput,
  type SignupValues,
} from "../features/auth/validation";
import { useAuth } from "../features/auth/AuthProvider";
import {
  authRedirect,
  configurationReady,
  requireSupabase,
} from "../lib/supabase";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Field, fieldA11y } from "../components/ui/field";
import {
  ErrorMessage,
  SuccessMessage,
  errorMessage,
} from "../components/ui/status";
function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-grid">
      <section className="auth-story">
        <p className="eyebrow">College Event Portal</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="info-line">
          <MailCheck size={20} />
          <span>
            Your 12-digit RRN college email keeps your identity consistent.
          </span>
        </div>
        <div className="info-line">
          <ShieldCheck size={20} />
          <span>
            Email confirmation is required. Privileged access needs
            administrative approval.
          </span>
        </div>
        <div className="info-line">
          <LockKeyhole size={20} />
          <span>
            Passwords are handled by Supabase Auth, never stored in your
            profile.
          </span>
        </div>
      </section>
      <section className="card">
        {!configurationReady && (
          <div className="notice notice-info" role="status">
            <span>
              Authentication is unavailable until the real Supabase project is
              configured. <Link to="/setup">Connection requirements</Link>
            </span>
          </div>
        )}
        {children}
      </section>
    </div>
  );
}
export function SignupPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput, unknown, SignupValues>({
    resolver: zodResolver(signupSchema),
  });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const { error: failure } = await requireSupabase().auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: authRedirect("/auth/callback"),
          data: {
            full_name: values.full_name,
            department: values.department,
            study_year: values.study_year,
          },
        },
      });
      if (failure) throw failure;
      setSuccess(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <AuthLayout
      title="Start your campus journey."
      subtitle="Create your student account using your Crescent email address."
    >
      {success ? (
        <>
          <h2>Check your email</h2>
          <SuccessMessage message="If the address is eligible for signup, a confirmation email will be sent. Open the link in this browser, then sign in." />
          <Link to="/login">Go to sign in</Link>
        </>
      ) : (
        <>
          <h2>Create student account</h2>
          {error && <ErrorMessage message={error} />}
          <form className="form" noValidate onSubmit={submit}>
            <Field
              id="full_name"
              label="Full name"
              error={errors.full_name?.message}
            >
              <Input
                id="full_name"
                autoComplete="name"
                {...register("full_name")}
                {...fieldA11y("full_name", errors.full_name?.message)}
              />
            </Field>
            <Field
              id="email"
              label="College email"
              error={errors.email?.message}
              hint="Your 12-digit RRN followed by @crescent.education."
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                {...register("email")}
                {...fieldA11y("email", errors.email?.message, true)}
              />
            </Field>
            <Field
              id="rrn"
              label="Register number"
              hint="Derived from your email. This field cannot be edited."
            >
              <Input
                id="rrn"
                value={extractRrn(watch("email") || "")}
                readOnly
                aria-describedby="rrn-hint"
              />
            </Field>
            <div className="form-row">
              <Field
                id="department"
                label="Department"
                error={errors.department?.message}
              >
                <Input
                  id="department"
                  {...register("department")}
                  {...fieldA11y("department", errors.department?.message)}
                />
              </Field>
              <Field
                id="study_year"
                label="Year of study"
                error={errors.study_year?.message}
              >
                <select
                  id="study_year"
                  className="input"
                  defaultValue=""
                  {...register("study_year", { valueAsNumber: true })}
                  {...fieldA11y("study_year", errors.study_year?.message)}
                >
                  <option value="" disabled>
                    Select year
                  </option>
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              id="password"
              label="Password"
              error={errors.password?.message}
              hint="12–128 characters with uppercase, lowercase, number and symbol."
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                {...fieldA11y("password", errors.password?.message, true)}
              />
            </Field>
            <Field
              id="confirm_password"
              label="Confirm password"
              error={errors.confirm_password?.message}
            >
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...register("confirm_password")}
                {...fieldA11y(
                  "confirm_password",
                  errors.confirm_password?.message,
                )}
              />
            </Field>
            <p className="hint">
              Email verification confirms email control only. Official
              enrollment has not been checked against an institutional roster.
            </p>
            <Button
              disabled={!configurationReady || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
export function LoginPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof loginSchema>,
    unknown,
    z.output<typeof loginSchema>
  >({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const { error: failure } =
        await requireSupabase().auth.signInWithPassword(values);
      if (failure) throw failure;
      await auth.refresh();
      navigate("/student/dashboard");
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to your secure campus account."
    >
      <h2>Sign in</h2>
      {error && <ErrorMessage message={error} />}
      <form className="form" noValidate onSubmit={submit}>
        <Field id="email" label="College email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            {...register("email")}
            {...fieldA11y("email", errors.email?.message)}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            {...fieldA11y("password", errors.password?.message)}
          />
        </Field>
        <Link to="/forgot-password">Forgot password?</Link>
        <Button type="submit" disabled={!configurationReady || isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="form-footer">
        New to the portal? <Link to="/signup">Create account</Link>
      </p>
    </AuthLayout>
  );
}
const forgotSchema = z.object({ email: collegeEmail });
export function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof forgotSchema>,
    unknown,
    z.output<typeof forgotSchema>
  >({ resolver: zodResolver(forgotSchema) });
  const submit = handleSubmit(async (values) => {
    try {
      setError("");
      const { error: failure } =
        await requireSupabase().auth.resetPasswordForEmail(values.email, {
          redirectTo: authRedirect("/reset-password"),
        });
      if (failure) throw failure;
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <AuthLayout
      title="Recover your access."
      subtitle="Request a secure password reset link sent to your college email."
    >
      <h2>Forgot password</h2>
      {error && <ErrorMessage message={error} />}{" "}
      {sent ? (
        <SuccessMessage message="If an eligible account exists, a reset link will be sent. Open it in this browser." />
      ) : (
        <form className="form" noValidate onSubmit={submit}>
          <Field id="email" label="College email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              {...fieldA11y("email", errors.email?.message)}
            />
          </Field>
          <Button type="submit" disabled={!configurationReady || isSubmitting}>
            {isSubmitting ? "Requesting link…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="form-footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
export function ResetPasswordPage() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
  });
  const submit = handleSubmit(async (values) => {
    try {
      setError("");
      if (!auth.recoveryAllowed)
        throw new Error("Request a fresh recovery link.");
      const { error: failure } = await requireSupabase().auth.updateUser({
        password: values.password,
      });
      if (failure) throw failure;
      auth.finishRecovery();
      // Password changed successfully even if global session revocation then fails.
      const { error: revokeError } = await requireSupabase().auth.signOut({
        scope: "global",
      });
      if (revokeError)
        throw new Error(
          `Password changed, but other sessions could not be revoked: ${revokeError.message}. Sign out on other devices.`,
        );
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <AuthLayout
      title="Choose a new password."
      subtitle="A fresh recovery link is required to continue."
    >
      <h2>Reset password</h2>
      {error && <ErrorMessage message={error} />}{" "}
      {saved ? (
        <>
          <SuccessMessage message="Password updated. Sign in again with your new password." />
          <Link to="/login">Sign in</Link>
        </>
      ) : auth.recoveryAllowed ? (
        <form className="form" noValidate onSubmit={submit}>
          <Field
            id="password"
            label="New password"
            error={errors.password?.message}
            hint="12–128 characters with uppercase, lowercase, number and symbol."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              {...fieldA11y("password", errors.password?.message, true)}
            />
          </Field>
          <Field
            id="confirm_password"
            label="Confirm new password"
            error={errors.confirm_password?.message}
          >
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              {...register("confirm_password")}
              {...fieldA11y(
                "confirm_password",
                errors.confirm_password?.message,
              )}
            />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      ) : (
        <>
          <p>
            No active recovery link was detected. Links can expire or be used
            only once. Request a new link and open it in this browser.
          </p>
          <Button asChild>
            <Link to="/forgot-password">Request a reset link</Link>
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
