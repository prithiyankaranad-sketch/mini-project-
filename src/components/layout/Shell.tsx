import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  Award,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { z } from "zod";
import { privateQuery, useRemote } from "../../lib/portal";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../ui/button";
import { ErrorMessage, errorMessage } from "../ui/status";
export function Shell() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const unread = useRemote(
    () =>
      auth.profile
        ? privateQuery("notification_count", {}, z.number())
        : Promise.resolve(null),
    `${auth.profile?.id ?? "anonymous"}-${location.pathname}`,
  );
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    sidebarRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
      if (e.key !== "Tab") return;
      const items =
        sidebarRef.current?.querySelectorAll<HTMLElement>("a,button");
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {open && (
        <button
          className="menu-dismiss"
          aria-label="Close navigation"
          onClick={() => {
            setOpen(false);
            menuRef.current?.focus();
          }}
        />
      )}
      <aside
        id="navigation"
        ref={sidebarRef}
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <Link className="brand" to="/">
          <GraduationCap size={32} aria-hidden="true" />
          <span>
            <strong>College Event Portal</strong>
            <small>Discover. Participate. Grow.</small>
          </span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/events">
            <CalendarDays size={20} />
            Events
          </NavLink>
          <NavLink to="/categories">
            <ClipboardList size={20} />
            Categories
          </NavLink>
          <NavLink to="/" end>
            <LayoutDashboard size={20} />
            Overview
          </NavLink>
          {auth.profile && (
            <NavLink to="/student/dashboard">
              <LayoutDashboard size={20} />
              My account
            </NavLink>
          )}
          {auth.profile && (
            <>
              <NavLink to="/student/registrations">
                <ClipboardList size={20} />
                My registrations
              </NavLink>
              <NavLink to="/student/attendance">
                <ClipboardList size={20} />
                Attendance
              </NavLink>
              <NavLink to="/student/certificates">
                <Award size={20} />
                Certificates
              </NavLink>
              <NavLink to="/student/notifications">
                <Bell size={20} />
                Notifications
              </NavLink>
              <NavLink to="/student/feedback">
                <MessageSquare size={20} />
                Feedback
              </NavLink>
              <NavLink to="/student/support">
                <MessageSquare size={20} />
                Report an issue
              </NavLink>
            </>
          )}
          {auth.profile && (
            <NavLink to="/student/profile">
              <UserRound size={20} />
              Profile
            </NavLink>
          )}
          {(auth.roles.includes("organizer") ||
            auth.roles.includes("admin")) && (
            <NavLink to="/organizer/dashboard">
              <ShieldCheck size={20} />
              Organizer account
            </NavLink>
          )}
          {auth.roles.includes("admin") && (
            <NavLink to="/admin/dashboard">
              <ShieldCheck size={20} />
              Administrator account
            </NavLink>
          )}
          {(auth.roles.includes("organizer") ||
            auth.roles.includes("admin")) && (
            <NavLink to="/organizer/events">
              <CalendarDays size={20} />
              Manage events
            </NavLink>
          )}
          {auth.roles.includes("admin") && (
            <>
              <NavLink to="/admin/users">Users & roles</NavLink>
              <NavLink to="/admin/organizers">Organizer approvals</NavLink>
              <NavLink to="/admin/categories">Manage categories</NavLink>
              <NavLink to="/admin/reports">Reports</NavLink>
              <NavLink to="/admin/audit-logs">Audit logs</NavLink>
              <NavLink to="/admin/settings">Settings</NavLink>
            </>
          )}
          {!auth.user && (
            <NavLink to="/login">
              <LogIn size={20} />
              Sign in
            </NavLink>
          )}
          {!auth.user && (
            <NavLink to="/signup">
              <UserRound size={20} />
              Create account
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          B.S. Abdur Rahman Crescent Institute of Science and Technology
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="button button-ghost mobile-menu"
            ref={menuRef}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <form
            className="global-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              navigate(
                `/events?search=${encodeURIComponent(String(d.get("search") ?? ""))}`,
              );
            }}
          >
            <label className="sr-only" htmlFor="global-event-search">
              Search published events
            </label>
            <input
              id="global-event-search"
              className="input"
              name="search"
              type="search"
              placeholder="Search events…"
            />
            <Button variant="ghost" type="submit">
              Search
            </Button>
          </form>
          <div className="topbar-account">
            {auth.profile ? (
              <>
                <Link
                  to="/student/notifications"
                  className="notification-indicator"
                  aria-label={
                    unread.data === null
                      ? "Notifications: count unavailable"
                      : `${unread.data} unread notifications`
                  }
                >
                  <Bell size={20} />
                  {unread.data !== null && <span>{unread.data}</span>}
                </Link>
                <span className="account-name">{auth.profile.full_name}</span>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await auth.signOut();
                      setError("");
                    } catch (e) {
                      setError(errorMessage(e));
                    }
                  }}
                >
                  <LogOut size={18} />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <span className="badge">College Event Portal</span>
                <Button variant="outline" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {error && <ErrorMessage message={error} />}
          <Outlet />
        </main>
        <footer className="footer">
          College Event Portal · Institutional time zone: Asia/Kolkata
        </footer>
      </div>
    </div>
  );
}
