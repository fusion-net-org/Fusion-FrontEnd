import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import { ToastContainer } from 'react-toastify';
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
import Calendar from './pages/calendar/Calendar';
import Partners from '@/pages/partners/Partner';
import PartnerDetails from '@/pages/partners/PartnerDetails';
import PaymentSuccess from './pages/subscription/PaymentSuccessPage';
import PaymentFailed from './pages/subscription/PaymentFailPage';
import UserProfile from './pages/userProfile/UserProfile';
import Settings from './pages/setting/Setting';
import CompanyDetail from './pages/home/CompanyDetail';
import Workflow from './pages/home/Workflow';
import CompanyMember from './pages/home/CompanyMember';
import Admin from './pages/admin/Admin';
import AdminLayout from './layouts/Admin/AdminLayout';
import AdminDashboardPage from './pages/admin/dashboard/Dashboard';
import AdminUsersPage from './pages/admin/userManagement/Users';
import AdminSubscriptionsPage from './pages/admin/Subscriptions';
import AdminCompaniesPage from './pages/admin/companyManagement/Companies';
import SubscriptionPag from './pages/subscription/SubscriptionPage';
import CompanyMemberDetail from './pages/home/CompanyMemberDetail';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import RequireAuth from './components/RequireAuth/RequireAuth';
import WorkflowPage from './pages/home/Workflow';
import WorkflowCreatePage from './pages/home/Workflow';
import WorkflowListPage from './pages/home/WorkflowListPage';
import WorkflowEditPage from './pages/home/WorkflowDesignerPage';
import WorkflowDesignerPage from './pages/home/WorkflowDesignerPage';
import ProjectRequest from './pages/home/ProjectRequest';
import RequestResetPassword from './pages/resetPassword/RequestResetPassword';
import ResetPassword from './pages/resetPassword/ResetPassword';
import OverviewUserPage from './pages/admin/userManagement/OverviewUserPage';
import UserListPage from './pages/admin/userManagement/UserListPage';
import OverviewCompanyPage from './pages/admin/companyManagement/OverviewCompanyPage';
import CompanyListPage from './pages/admin/companyManagement/CompanyListPage';
import UserDetailPage from './pages/admin/userManagement/UserDetailPage';
import CompanyDetailPage from './pages/admin/companyManagement/CompanyDetailPage';
import SubcriptionListPage from './pages/admin/subcriptionManagement/SubcriptionListPage';
import TransactionListPage from './pages/admin/transactionManagement/TransactionListPage';
import NotificationListPage from './pages/admin/notificationManagement/NotificationListPage';
import ProjectListPage from './pages/admin/projectManagement/ProjectListPage';
import ProjectDetailPage from './pages/admin/projectManagement/ProjectDetailPage';
function App() {
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
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/setting" element={<Settings />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Route admin layout */}

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/overview" element={<OverviewUserPage />} />
          <Route path="users/list" element={<UserListPage />} />
          <Route path="/admin/users/detail/:id" element={<UserDetailPage />} />
          <Route path="/admin/users/detail" element={<UserDetailPage />} />
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route path="/admin/companies/overview" element={<OverviewCompanyPage />} />
          <Route path="/admin/companies/list" element={<CompanyListPage />} />
          <Route path="/admin/companies/detail/:id" element={<CompanyDetailPage />} />
          <Route path="/admin/companies/detail" element={<CompanyDetailPage />} />
          <Route path="/admin/subscriptions/list" element={<SubcriptionListPage />} />
          <Route path="/admin/transactions/list" element={<TransactionListPage />} />
          <Route path="/admin/notifications/list" element={<NotificationListPage />} />
          <Route path="/admin/projects/list" element={<ProjectListPage />} />
          <Route path="/admin/projects/detail/:id" element={<ProjectDetailPage />} />
          <Route path="/admin/projects/detail" element={<ProjectDetailPage />} />
          {/* <Route path="transactions" element={<AdminTransactionsPage />} /> */}
        </Route>
        {/* route company layout */}
        <Route element={<CompanyLayout />}>
          <Route path="/companies/:companyId/access-role" element={<AccessRolePage />} />
          <Route path="/company/:companyId" element={<CompanyDetail />} />
          <Route path="/company/:companyId/partners" element={<Partners />} />
          <Route path="/company/partners/:id" element={<PartnerDetails />} />
          <Route path="/company/:companyId/members" element={<CompanyMember />} />
          <Route path="/companies/:companyId/workflow" element={<WorkflowPage />} />
          <Route path="/company/:companyId/project" element={<ProjectsPage />} />
          <Route path="/company/:companyId/project-request" element={<ProjectRequest />} />
          <Route path="/company/members/:Id" element={<CompanyMemberDetail />} />
          <Route path="/companies/:companyId/workflows/new" element={<WorkflowDesignerPage />} />
          <Route
            path="/companies/:companyId/workflows/:workflowId"
            element={<WorkflowDesignerPage />}
          />
          <Route path="/companies/:companyId/workflows" element={<WorkflowListPage />} />

          {/* Payment result */}

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
        <Route
          path="/my-profile"
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
        {/*Route payment-result */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
