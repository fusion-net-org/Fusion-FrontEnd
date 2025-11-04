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
import Calendar from './pages/calendar/Calendar';
import ResetPassword from './pages/resetPassword/ResetPassword';
import Partners from '@/pages/partners/Partner';
import PartnerDetails from '@/pages/partners/PartnerDetails';
import PaymentSuccess from './pages/subscription/PaymentSuccessPage';
import PaymentFailed from './pages/subscription/PaymentFailPage';
import UserProfile from './pages/UserProfile/UserProfile';
import Settings from './pages/setting/Setting';
import CompanyDetail from './pages/home/CompanyDetail';
import Workflow from './pages/home/Workflow';
import CompanyMember from './pages/home/CompanyMember';
import CompanyMemberDetail from './pages/home/CompanyMemberDetail';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import RequestResetPassword from './pages/resetPassword/RequestResetPassword';
import RequireAuth from './components/RequireAuth/RequireAuth';
import WorkflowPage from './pages/home/Workflow';
import WorkflowCreatePage from './pages/home/Workflow';
import WorkflowListPage from './pages/home/WorkflowListPage';
import WorkflowEditPage from './pages/home/WorkflowDesignerPage';
import WorkflowDesignerPage from './pages/home/WorkflowDesignerPage';
import ProjectRequest from './pages/home/ProjectRequest';
<<<<<<< HEAD
import ProjectDetailPage from './pages/project/ProjectDetailPage';
import ProjectBoardPage from './pages/project/ProjectBoardPage';
=======
import ProjectRequestDetail from './pages/home/ProjectRequestDetail';
import NotificationPage from './pages/notification/NotificationPage';
import CompanyHeader from './layouts/Company/CompanyHeader';
import CompanyShell from './layouts/Company/CompanyShell';
import { useFCMListener } from './hook/useFCM';

>>>>>>> 6042eaed227f723f5bda009e17ff0a1a8990fc69
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
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/setting" element={<Settings />} />
        </Route>
        {/* route company layout */}
        <Route element={<CompanyLayout />}>
          <Route path="/companies/:companyId/access-role" element={<AccessRolePage />} />
          <Route path="/company/:companyId" element={<CompanyDetail />} />
          <Route path="/company/:companyId/partners" element={<Partners />} />
          <Route path="/company/partners/:id" element={<PartnerDetails />} />
          <Route path="/company/:companyId/members" element={<CompanyMember />} />
          <Route path="/companies/:companyId/workflow" element={<WorkflowPage />} />
          <Route path="/companies/:companyId/project" element={<ProjectsPage />} />
          <Route path="/company/:companyId/project-request" element={<ProjectRequest />} />
          <Route
            path="/company/:companyId/project-request/:id"
            element={<ProjectRequestDetail />}
          />
          <Route path="/company/members/:Id" element={<CompanyMemberDetail />} />
<<<<<<< HEAD
<Route path="/companies/:companyId/workflows/new" element={<WorkflowDesignerPage />} />
<Route path="/companies/:companyId/workflows/:workflowId" element={<WorkflowDesignerPage />} />
<Route path="/companies/:companyId/workflows" element={<WorkflowListPage/>} />
<Route path="/companies/:companyId/project/:projectId" element={<ProjectBoardPage/>} />
=======
          <Route path="/companies/:companyId/workflows/new" element={<WorkflowDesignerPage />} />
          <Route
            path="/companies/:companyId/workflows/:workflowId"
            element={<WorkflowDesignerPage />}
          />
          <Route path="/companies/:companyId/workflows" element={<WorkflowListPage />} />

>>>>>>> 6042eaed227f723f5bda009e17ff0a1a8990fc69
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

        {/* Notification */}
        <Route element={<CompanyShell />}>
          <Route path="/notifications" element={<NotificationPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
