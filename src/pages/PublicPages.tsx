import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MailCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect } from "react";
import { configurationReady } from "../lib/supabase";
import { useAuth } from "../features/auth/AuthProvider";
import { Button } from "../components/ui/button";
import { Loading } from "../components/ui/status";
export function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Your campus. Your community.</p>
        <h1>
          Make more of
          <br />
          your college experience.
        </h1>
        <p>
          A shared home for discovering events, connecting with your campus and
          keeping your participation records together.
        </p>
        <div className="actions">
          <Button asChild>
            <Link to="/signup">
              Create your account
              <ArrowRight size={18} />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>
      {!configurationReady && (
        <div className="notice notice-info" role="status">
          The portal has not been connected to Supabase. Authentication and
          private account data are unavailable until configuration is completed.
          No sample records are displayed.
        </div>
      )}
      <div className="card-grid">
        <section className="card">
          <UserRound className="card-icon" size={26} />
          <h2>Your campus identity</h2>
          <p>
            Use your Crescent student email. Your register number is derived
            securely from the address.
          </p>
        </section>
        <section className="card">
          <MailCheck className="card-icon" size={26} />
          <h2>Verified email access</h2>
          <p>
            Confirm control of your email before accessing your account. Email
            verification does not verify official enrollment.
          </p>
        </section>
        <section className="card">
          <ShieldCheck className="card-icon" size={26} />
          <h2>Privacy by design</h2>
          <p>
            Protected profiles and role-based access enforced in the database,
            not just in navigation.
          </p>
        </section>
      </div>
      <section className="card">
        <div className="actions">
          <CalendarDays size={24} className="card-icon" />
          <h2>Discover what’s happening</h2>
        </div>
        <p className="muted">
          Explore published events, accepted team registrations, attendance
          records and approved certificates. Real account access and event
          records require the configured Supabase backend. No sample statistics
          or registrations are shown.
        </p>
        <Button variant="outline" asChild>
          <Link to="/setup">View connection requirements</Link>
        </Button>
      </section>
    </>
  );
}
export function SetupPage() {
  return (
    <section className="card" style={{ maxWidth: 720 }}>
      <p className="eyebrow">Connection requirements</p>
      <h1>
        {configurationReady ? "Project configured" : "Connect the real backend"}
      </h1>
      <p>
        Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY using your
        actual Supabase project, apply all migrations and deploy the certificate
        and email functions, enable email confirmation, and allow the
        authentication redirect URLs documented in the README.
      </p>
      <p className="muted">
        Configuration alone does not prove connectivity. Verified real signup,
        login, recovery, role isolation, registration, attendance, certificate
        and email checks are required before release. Never use a service-role
        key in the browser.
      </p>
      <Button asChild>
        <Link to="/">Back to overview</Link>
      </Button>
    </section>
  );
}
export function UnauthorizedPage() {
  return (
    <section className="card">
      <p className="eyebrow">Access restricted</p>
      <h1>You do not have access.</h1>
      <p>
        Your account needs an active profile and the appropriate approved role.
        Roles cannot be requested or assigned through signup.
      </p>
      <Button asChild>
        <Link to="/">Return to overview</Link>
      </Button>
    </section>
  );
}
export function NotFoundPage() {
  return (
    <section className="card">
      <h1>Page not found</h1>
      <p>
        This route does not exist. Use the navigation to find events or return
        to your account.
      </p>
      <Button asChild>
        <Link to="/">Return to overview</Link>
      </Button>
    </section>
  );
}
export function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.loading && auth.user?.email_confirmed_at && auth.profile)
      navigate("/student/dashboard", { replace: true });
  }, [auth.loading, auth.user, auth.profile, navigate]);
  if (auth.loading) return <Loading text="Verifying your email link…" />;
  if (auth.user && !auth.user.email_confirmed_at) return <VerificationPage />;
  return (
    <section className="card">
      <h1>Complete your sign-in</h1>
      <p>
        {auth.error ||
          "The email link may have expired, already been used, or been opened in a different browser. PKCE verification links must be opened in the browser that requested them. Sign in if verification is already complete."}
      </p>
      <Button asChild>
        <Link to="/login">Go to sign in</Link>
      </Button>
    </section>
  );
}
export function VerificationPage() {
  return (
    <section className="card">
      <MailCheck size={32} className="card-icon" />
      <h1>Check your college email</h1>
      <p>
        Open the confirmation link from Supabase in the same browser used to
        sign up. Account access requires email confirmation.
      </p>
      <p className="muted">
        Confirmation proves control of the email account. It is not an official
        enrollment check.
      </p>
      <Button asChild>
        <Link to="/login">Return to sign in</Link>
      </Button>
    </section>
  );
}
