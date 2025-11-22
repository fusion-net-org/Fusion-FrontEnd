/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './utils/ScrollToTop';
import NotFound from './pages/notfound/NotFound';
import Register from './pages/register/Register';
import Company from '@/pages/home/Company';
import Landing from './pages/landing/Landing';
import HomeLayout from './layouts/HomeLayout/HomeLayout';
import CompanyLayout from './layouts/Company/CompanyLayout';
import AccessRolePage from './pages/home/AccessRolePage';
import ProjectsPage from './pages/home/ProjectsPage';
import Calendar from './pages/calendar/calendarManagement/Calendar';
import ResetPassword from './pages/resetPassword/ResetPassword';
import Partners from '@/pages/partners/Partner';
import PartnerDetails from '@/pages/partners/PartnerDetails';
import PaymentSuccess from './pages/subscription/PaymentSuccessPage';
import PaymentFailed from './pages/subscription/PaymentFailPage';
import Settings from './pages/setting/Setting';
import CompanyDetail from './pages/home/CompanyDetail';
import CompanyMember from './pages/home/CompanyMember';
import AdminLayout from './layouts/Admin/AdminLayout';
import AdminDashboardPage from './pages/admin/dashboard/Dashboard';
import AdminSubscriptionsPage from './pages/admin/Subscriptions';
import CompanyMemberDetail from './pages/home/CompanyMemberDetail';
import RequestResetPassword from './pages/resetPassword/RequestResetPassword';
import RequireAuth from './components/RequireAuth/RequireAuth';
import WorkflowPage from './pages/home/Workflow';
import WorkflowListPage from './pages/home/WorkflowListPage';
import WorkflowDesignerPage from './pages/home/WorkflowDesignerPage';
import ProjectRequest from './pages/home/ProjectRequest';
import ProjectDetailPage from './pages/project/ProjectDetailPage';
import ProjectBoardPage from './pages/project/ProjectBoardPage';
import ProjectRequestDetail from './pages/home/ProjectRequestDetail';
import NotificationPage from './pages/notification/NotificationPage';
import CompanyHeader from './layouts/Company/CompanyHeader';
import CompanyShell from './layouts/Company/CompanyShell';
import { useFCMListener } from './hook/useFCM';
import ProjectsCompanyRequest from './pages/home/ProjectsCompanyRequest';

import SubscriptionPlan from './pages/subscription/SubscriptionPlan';
import MySubscriptions from './pages/mysubscription/MySubscription';
// import CompanySubscriptionsPage from './pages/home/CompanySubscriptionPage';
import OverviewUserPage from './pages/admin/userManagement/OverviewUserPage';
import UserListPage from './pages/admin/userManagement/UserListPage';
import OverviewCompanyPage from './pages/admin/companyManagement/OverviewCompanyPage';
import CompanyListPage from './pages/admin/companyManagement/CompanyListPage';
import UserDetailPage from './pages/admin/userManagement/UserDetailPage';
import CompanyDetailPage from './pages/admin/companyManagement/CompanyDetailPage';
import SubcriptionListPage from './pages/admin/subcriptionManagement/SubscriptionListPage';
import TransactionListPage from './pages/admin/transactionManagement/TransactionListPage';
import NotificationListPage from './pages/admin/notificationManagement/NotificationListPage';
import ProjectListAdminPage from './pages/admin/projectManagement/ProjectListAdminPage';
import ProjectDetailAdminPage from './pages/admin/projectManagement/ProjectDetailAdminPage';
import FeatureListPage from './pages/admin/featureManagement/FeatureListPage';
import CompanySubscriptionPage from './pages/home/CompanySubscriptionPage';
import TransactionOverviewPage from './pages/admin/transactionManagement/TransactionOverviewPage';
import SubscriptionOverviewPage from './pages/admin/subcriptionManagement/SubscriptionOverviewPage';
import UserProfile from './pages/userProfile/UserProfile';
import RequireAdmin from './components/RequireAdmin/RequireAdmin';
import TicketDetailPage from './components/ProjectSideCompanyRequest/TicketDetailPage';
import TaskDetailPage from './pages/project/TaskDetailPage';
import InvitationPage from './components/Member/Invitations';
import CompanyProtectedRoute from './components/CompanyProtectedRoute/CompanyProtectedRoute';

function App() {
  useFCMListener((notif: any) => {
    console.log('Realtime FCM Notification:', notif);
  });
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <ScrollToTop />

      <Routes>
        {/* Route main layout */}
        <Route path="/">
          <Route index element={<Landing />} />
        </Route>
        {/* Route home layout */}
        <Route
          element={
            <RequireAuth>
              <HomeLayout />
            </RequireAuth>
          }
        >
          <Route path="/company" element={<Company />} />
          <Route path="/invitation" element={<InvitationPage />} />
          <Route path="/calendar/calendar" element={<Calendar />} />
          <Route path="/calendar/tasks" element={<Calendar />} />
          <Route path="/setting" element={<Settings />} />
          <Route path="/subscription" element={<SubscriptionPlan />} />
          <Route path="/mysubscription" element={<MySubscriptions />} />
          {/* <Route path="/subscription" element={<SubscriptionPage />} /> */}
        </Route>

        {/* Route admin layout */}

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="/admin/users/overview" element={<OverviewUserPage />} />
          <Route path="/admin/users/list" element={<UserListPage />} />
          <Route path="/admin/users/detail/:id" element={<UserDetailPage />} />
          <Route path="/admin/users/detail" element={<UserDetailPage />} />
          <Route path="/admin/companies/overview" element={<OverviewCompanyPage />} />
          <Route path="/admin/companies/list" element={<CompanyListPage />} />
          <Route path="/admin/companies/detail/:id" element={<CompanyDetailPage />} />
          <Route path="/admin/companies/detail" element={<CompanyDetailPage />} />
          <Route path="/admin/subscriptions/list" element={<SubcriptionListPage />} />
          <Route path="/admin/subscriptions/overview" element={<SubscriptionOverviewPage />} />
          <Route path="/admin/transactions/list" element={<TransactionListPage />} />

          <Route path="/admin/notifications/list" element={<NotificationListPage />} />
          <Route path="/admin/projects/list" element={<ProjectListAdminPage />} />
          <Route path="/admin/projects/detail/:id" element={<ProjectDetailAdminPage />} />
          <Route path="/admin/projects/detail" element={<ProjectDetailAdminPage />} />

          {/* <Route path="transactions" element={<AdminTransactionsPage />} /> */}
          <Route path="/admin/transactions/overview" element={<TransactionOverviewPage />} />
          <Route path="/admin/notifications/list" element={<NotificationListPage />} />
          <Route path="/admin/features/list" element={<FeatureListPage />} />
        </Route>
        {/* route company layout */}
        <Route
          element={
            <CompanyProtectedRoute>
              <CompanyLayout />
            </CompanyProtectedRoute>
          }
        >
          <Route path="/companies/:companyId/access-role" element={<AccessRolePage />} />
          <Route path="/company/:companyId" element={<CompanyDetail />} />
          <Route path="/company/:companyId/partners" element={<Partners />} />
          <Route path="/company/partners/:id" element={<PartnerDetails />} />
          <Route path="/company/:companyId/members" element={<CompanyMember />} />
          <Route path="/companies/:companyId/workflow" element={<WorkflowPage />} />
          <Route path="/companies/:companyId/project" element={<ProjectsPage />} />
          <Route path="/company/:companyId/subscription" element={<CompanySubscriptionPage />} />
          <Route
            path="/companies/:companyId/projectRequest/:projectId"
            element={<ProjectsCompanyRequest />}
          />
          <Route path="project/:projectId/tickets/:ticketId" element={<TicketDetailPage />} />

          <Route path="/company/:companyId/project-request" element={<ProjectRequest />} />
          <Route
            path="/company/:companyId/project-request/:id"
            element={<ProjectRequestDetail />}
          />
          <Route path="/company/members/:Id" element={<CompanyMemberDetail />} />
          <Route path="/companies/:companyId/workflows/new" element={<WorkflowDesignerPage />} />
          <Route
            path="/companies/:companyId/workflows/:workflowId"
            element={<WorkflowDesignerPage />}
          />
          <Route path="/companies/:companyId/workflows" element={<WorkflowListPage />} />
          <Route path="/companies/:companyId/project/:projectId" element={<ProjectBoardPage />} />
          <Route path="/companies/:companyId/workflows/new" element={<WorkflowDesignerPage />} />
          <Route
            path="/companies/:companyId/project/:projectId/task/:taskId"
            element={<TaskDetailPage />}
          />
          <Route
            path="/companies/:companyId/project/:projectId/detail"
            element={<ProjectDetailPage />}
          />

          {/* LIST */}
          {/* <Route path="/companies/:companyId/workflows" element={<WorkflowListPage />} /> */}
          {/* CREATE */}
          {/* <Route path="/companies/:companyId/workflows/new" element={<WorkflowCreatePage />} /> */}
          {/* EDIT */}
          {/* <Route path="/companies/:companyId/workflows/:workflowId" element={<WorkflowEditPage />} /> */}
        </Route>
        {/* Route ko có layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/request-reset-password" element={<RequestResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/my-profile" element={<UserProfile />} />

        <Route path="*" element={<NotFound />} />
        {/*Route payment-result */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* Notification */}
        <Route element={<CompanyShell />}>
          <Route path="/notifications" element={<NotificationPage />} />
        </Route>
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        {/* //ticket */}
      </Routes>
    </>
  );
}

export default App;
