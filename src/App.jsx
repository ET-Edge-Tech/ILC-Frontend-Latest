import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import RequireAuth from './guards/RequireAuth.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import { useAuthStore } from './store/auth-store.js';
import { gateFor, homeFor } from './features/auth/routing.js';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage.jsx';
import SetPasswordPage from './features/auth/pages/SetPasswordPage.jsx';
import ExpiredPage from './features/auth/pages/ExpiredPage.jsx';
import PendingApprovalPage from './features/auth/pages/PendingApprovalPage.jsx';
import SpocOverview from './features/ops/SpocOverview.jsx';
import SignalFeedPage from './features/ops/SignalFeedPage.jsx';
import OpsMembersPage from './features/ops/OpsMembersPage.jsx';
import SpocCalendarPage from './features/ops/SpocCalendarPage.jsx';
import MemberPage from './features/ops/MemberPage.jsx';
import JourneyPage from './features/ops/JourneyPage.jsx';
import LeadershipDashboard from './features/ops/LeadershipDashboard.jsx';
import OpsSettingsPage from './features/ops/OpsSettingsPage.jsx';
import AdminStoragePage from './features/content/AdminStoragePage.jsx';
import MemberDashboard from './features/dashboard/MemberDashboard.jsx';
import AdminOverview from './features/admin/AdminOverview.jsx';
import MemberAdminPage from './features/members/MemberAdminPage.jsx';
import MembersPage from './features/members/MembersPage.jsx';
import AddMemberPage from './features/members/AddMemberPage.jsx';
import BulkUploadPage from './features/members/BulkUploadPage.jsx';
import PendingInvitesPage from './features/members/PendingInvitesPage.jsx';
import IndustriesPage from './features/industries/IndustriesPage.jsx';
import PhotoApprovalsPage from './features/events/PhotoApprovalsPage.jsx';
import EtEdgeRequestsPage from './features/events/EtEdgeRequestsPage.jsx';
import AccessPage from './features/access/AccessPage.jsx';
import AccessDetailPage from './features/access/AccessDetailPage.jsx';
import SpocBulkUploadPage from './features/spocs/SpocBulkUploadPage.jsx';
import SpocsPage from './features/spocs/SpocsPage.jsx';
import ProfilePage from './features/profile/ProfilePage.jsx';
import SocketProvider from './features/chat/SocketProvider.jsx';
import OnboardingPage from './features/onboarding/OnboardingPage.jsx';
// The flip book reader is large (PDF reader and page-turn effect), so it loads only when someone opens an issue.
const MagazineReaderPage = lazy(() => import('./features/magazine/MagazineReaderPage.jsx'));
import MagazinePage from './features/magazine/MagazinePage.jsx';
import AdminMagazinePage from './features/magazine/AdminMagazinePage.jsx';
import NewsPage from './features/news/NewsPage.jsx';
import ArticlePage from './features/news/ArticlePage.jsx';
import AdminNewsPage from './features/news/AdminNewsPage.jsx';
import AfterEventPage from './features/ops/AfterEventPage.jsx';
import CateringPage from './features/events/CateringPage.jsx';
import MyDayPage from './features/ops/MyDayPage.jsx';
import MySchedulePage from './features/meetings/MySchedulePage.jsx';
import EventsPage from './features/events/EventsPage.jsx';
import EventDetailPage from './features/events/EventDetailPage.jsx';
import AdminEventsPage from './features/events/AdminEventsPage.jsx';
import EventFormPage from './features/events/EventFormPage.jsx';
import CouncilPage from './features/chat/CouncilPage.jsx';
import ResourcesPage from './features/content/ResourcesPage.jsx';
import AnnouncementsPage from './features/content/AnnouncementsPage.jsx';
import AdminResourcesPage from './features/content/AdminResourcesPage.jsx';
import AdminGlimpsesPage from './features/content/AdminGlimpsesPage.jsx';
import AdminAnnouncementsPage from './features/content/AdminAnnouncementsPage.jsx';
import AdminBroadcastPage from './features/oversight/AdminBroadcastPage.jsx';
import AuditLogsPage from './features/oversight/AuditLogsPage.jsx';
import AdminFormProgressPage from './features/oversight/AdminFormProgressPage.jsx';

// "/" sends each person to the first screen they are allowed to use.
function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={gateFor(user) ?? homeFor(user)} replace />;
}

// WhatsApp buttons can only carry a plain path, so /council/chat/<member id> opens that conversation.
function OpenChat() {
  const { id } = useParams();
  return <Navigate to={`/council?tab=inbox&chat=${encodeURIComponent(id)}`} replace />;
}

export default function App() {
  return (
    <>
      {/* One live line for every signed-in screen (also set-password, onboarding), so a deleted account is signed out at once. */}
      <SocketProvider />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<RequireAuth />}>
          {/* Screens people must finish first: no sidebar. */}
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/expired" element={<ExpiredPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Everything else sits inside the layout once. */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/members" element={<MembersPage />} />
            <Route path="/admin/members/new" element={<AddMemberPage />} />
            <Route path="/admin/members/:id" element={<MemberAdminPage />} />
            <Route path="/admin/members/bulk" element={<BulkUploadPage />} />
            <Route path="/admin/pending-invites" element={<PendingInvitesPage />} />
            <Route path="/admin/spocs" element={<SpocsPage />} />
            <Route path="/admin/spocs/bulk" element={<SpocBulkUploadPage />} />
          <Route path="/admin/industries" element={<IndustriesPage />} />
          <Route path="/admin/access" element={<AccessPage />} />
          <Route path="/admin/et-edge" element={<EtEdgeRequestsPage />} />
          <Route path="/spoc/et-edge" element={<EtEdgeRequestsPage />} />
          <Route path="/spoc/photos" element={<PhotoApprovalsPage />} />
          <Route path="/admin/photos" element={<PhotoApprovalsPage />} />
          <Route path="/admin/access/:kind/:id" element={<AccessDetailPage />} />
            <Route path="/spoc" element={<SpocOverview />} />
            <Route path="/spoc/signals" element={<SignalFeedPage />} />
            <Route path="/spoc/today" element={<MyDayPage />} />
            <Route path="/spoc/calendar" element={<SpocCalendarPage />} />
            <Route path="/spoc/after-event" element={<AfterEventPage />} />
            <Route path="/events/:id/catering" element={<CateringPage />} />
            <Route path="/spoc/members" element={<OpsMembersPage />} />
            <Route path="/spoc/members/:id" element={<MemberPage />} />
            <Route path="/spoc/journey" element={<JourneyPage />} />
            <Route path="/admin/ops" element={<LeadershipDashboard />} />
            <Route path="/admin/ops/signals" element={<SignalFeedPage />} />
            <Route path="/admin/ops/members" element={<OpsMembersPage />} />
            <Route path="/admin/ops/members/:id" element={<MemberPage />} />
            <Route path="/admin/ops/journey" element={<JourneyPage />} />
            <Route path="/admin/ops/settings" element={<OpsSettingsPage />} />
            <Route path="/admin/storage" element={<AdminStoragePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/council" element={<CouncilPage />} />
            <Route path="/council/chat/:id" element={<OpenChat />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/admin/resources" element={<AdminResourcesPage />} />
            <Route path="/admin/glimpses" element={<AdminGlimpsesPage />} />
            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/form-progress" element={<AdminFormProgressPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/meetings" element={<MySchedulePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/magazine" element={<MagazinePage />} />
            <Route path="/magazine/:id" element={<Suspense fallback={null}><MagazineReaderPage /></Suspense>} />
            <Route path="/admin/magazine" element={<AdminMagazinePage />} />
            <Route path="/news/:id" element={<ArticlePage />} />
            <Route path="/admin/news" element={<AdminNewsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/admin/events/new" element={<EventFormPage />} />
            <Route path="/admin/events/:id" element={<EventDetailPage />} />
            <Route path="/admin/events/:id/edit" element={<EventFormPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
