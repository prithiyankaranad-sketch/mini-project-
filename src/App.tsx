import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthProvider";
import { RequireAuth } from "./features/auth/RequireAuth";
import { Shell } from "./components/layout/Shell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loading } from "./components/ui/status";
import {
  CallbackPage,
  HomePage,
  NotFoundPage,
  SetupPage,
  UnauthorizedPage,
  VerificationPage,
} from "./pages/PublicPages";
const Signup = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.SignupPage })),
);
const Login = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.LoginPage })),
);
const Forgot = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.ForgotPasswordPage })),
);
const Reset = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.ResetPasswordPage })),
);
const Profile = lazy(() =>
  import("./pages/AccountPages").then((m) => ({ default: m.ProfilePage })),
);
const Dashboard = lazy(() =>
  import("./features/analytics/AnalyticsPages").then((m) => ({
    default: m.DashboardPage,
  })),
);
const Reports = lazy(() =>
  import("./features/analytics/AnalyticsPages").then((m) => ({
    default: m.ReportsPage,
  })),
);
const Events = lazy(() =>
  import("./features/events/EventPages").then((m) => ({
    default: m.EventsPage,
  })),
);
const EventDetail = lazy(() =>
  import("./features/events/EventPages").then((m) => ({
    default: m.EventDetailPage,
  })),
);
const Categories = lazy(() =>
  import("./features/events/EventPages").then((m) => ({
    default: m.CategoriesPage,
  })),
);
const ManagedEvents = lazy(() =>
  import("./features/events/EventPages").then((m) => ({
    default: m.ManagedEventsPage,
  })),
);
const EventEditor = lazy(() =>
  import("./features/events/EventPages").then((m) => ({
    default: m.EventEditorPage,
  })),
);
const Schedule = lazy(() =>
  import("./features/events/EventPages").then((m) => ({
    default: m.SchedulePage,
  })),
);
const Registrations = lazy(() =>
  import("./features/registrations/RegistrationPages").then((m) => ({
    default: m.RegistrationsPage,
  })),
);
const RegistrationDetail = lazy(() =>
  import("./features/registrations/RegistrationPages").then((m) => ({
    default: m.RegistrationDetailPage,
  })),
);
const Participants = lazy(() =>
  import("./features/registrations/RegistrationPages").then((m) => ({
    default: m.ParticipantsPage,
  })),
);
const Notifications = lazy(() =>
  import("./features/notifications/NotificationPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const Attendance = lazy(() =>
  import("./features/attendance/AttendancePages").then((m) => ({
    default: m.StudentAttendancePage,
  })),
);
const AttendanceDesk = lazy(() =>
  import("./features/attendance/AttendancePages").then((m) => ({
    default: m.AttendanceWorkspace,
  })),
);
const Certificates = lazy(() =>
  import("./features/certificates/CertificatePages").then((m) => ({
    default: m.CertificatesPage,
  })),
);
const CertificateDesk = lazy(() =>
  import("./features/certificates/CertificatePages").then((m) => ({
    default: m.CertificatesWorkspace,
  })),
);
const Verify = lazy(() =>
  import("./features/certificates/CertificatePages").then((m) => ({
    default: m.VerifyCertificatePage,
  })),
);
const Feedback = lazy(() =>
  import("./features/feedback/FeedbackPages").then((m) => ({
    default: m.FeedbackPage,
  })),
);
const FeedbackDesk = lazy(() =>
  import("./features/feedback/FeedbackPages").then((m) => ({
    default: m.FeedbackWorkspace,
  })),
);
const Users = lazy(() =>
  import("./features/administration/AdminPages").then((m) => ({
    default: m.UsersPage,
  })),
);
const Organizers = lazy(() =>
  import("./features/administration/AdminPages").then((m) => ({
    default: m.OrganizersPage,
  })),
);
const AdminCategories = lazy(() =>
  import("./features/administration/AdminPages").then((m) => ({
    default: m.AdminCategoriesPage,
  })),
);
const Audit = lazy(() =>
  import("./features/administration/AdminPages").then((m) => ({
    default: m.AuditLogsPage,
  })),
);
const Settings = lazy(() =>
  import("./features/administration/AdminPages").then((m) => ({
    default: m.SettingsPage,
  })),
);
const Support = lazy(() =>
  import("./features/administration/AdminPages").then((m) => ({
    default: m.SupportPage,
  })),
);
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route element={<Shell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:eventId" element={<EventDetail />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/verify/:certificateId" element={<Verify />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<Forgot />} />
                <Route path="/reset-password" element={<Reset />} />
                <Route path="/auth/callback" element={<CallbackPage />} />
                <Route
                  path="/verification-required"
                  element={<VerificationPage />}
                />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route element={<RequireAuth />}>
                  <Route path="/student/dashboard" element={<Dashboard />} />
                  <Route path="/student/profile" element={<Profile />} />
                  <Route
                    path="/student/registrations"
                    element={<Registrations />}
                  />
                  <Route
                    path="/student/registrations/:registrationId"
                    element={<RegistrationDetail />}
                  />
                  <Route
                    path="/student/notifications"
                    element={<Notifications />}
                  />
                  <Route path="/student/attendance" element={<Attendance />} />
                  <Route
                    path="/student/certificates"
                    element={<Certificates />}
                  />
                  <Route path="/student/feedback" element={<Feedback />} />
                  <Route path="/student/support" element={<Support />} />
                </Route>
                <Route element={<RequireAuth staff />}>
                  <Route
                    path="/organizer/dashboard"
                    element={<Dashboard mode="organizer" />}
                  />
                  <Route path="/organizer/events" element={<ManagedEvents />} />
                  <Route
                    path="/organizer/events/new"
                    element={<EventEditor />}
                  />
                  <Route
                    path="/organizer/events/:eventId/edit"
                    element={<EventEditor />}
                  />
                  <Route
                    path="/organizer/events/:eventId/participants"
                    element={<Participants />}
                  />
                  <Route
                    path="/organizer/events/:eventId/schedule"
                    element={<Schedule />}
                  />
                  <Route
                    path="/organizer/events/:eventId/attendance"
                    element={<AttendanceDesk />}
                  />
                  <Route
                    path="/organizer/events/:eventId/certificates"
                    element={<CertificateDesk />}
                  />
                  <Route
                    path="/organizer/events/:eventId/feedback"
                    element={<FeedbackDesk />}
                  />
                  <Route
                    path="/organizer/events/:eventId/reports"
                    element={<Reports />}
                  />
                </Route>
                <Route element={<RequireAuth role="admin" />}>
                  <Route
                    path="/admin/dashboard"
                    element={<Dashboard mode="admin" />}
                  />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/organizers" element={<Organizers />} />
                  <Route path="/admin/events" element={<ManagedEvents />} />
                  <Route
                    path="/admin/categories"
                    element={<AdminCategories />}
                  />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/audit-logs" element={<Audit />} />
                  <Route path="/admin/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
