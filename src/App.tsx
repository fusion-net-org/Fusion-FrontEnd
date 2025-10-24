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
        <Route element={<HomeLayout />}>
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
          <Route path="/companies/:companyId/workflow" element={<Workflow />} />
          <Route path="/company/:companyId/project" element={<ProjectsPage />} />
          <Route path="/company/members/:Id" element={<CompanyMemberDetail />} />
        </Route>

        {/* Route ko có layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/my-profile" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />

        {/*Route payment-result */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
      </Routes>
    </>
  );
}

export default App;
