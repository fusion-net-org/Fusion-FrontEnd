import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import { ToastContainer } from 'react-toastify';
import ScrollToTop from './utils/ScrollToTop';
import NotFound from './pages/notfound/NotFound';
import Register from './pages/register/Register';
import Company from '@/pages/home/Company';
import Landing from './pages/landing/Landing';
import HomeLayout from './layouts/HomeLayout/HomeLayout';
import CompanyLayout from './layouts/Company/CompanyLayout';
import AccessRolePage from './pages/home/AccessRolePage';
import ProjectsPage from './pages/home/ProjectsPage';
import Partners from '@/pages/partners/Partner';
import PartnerDetails from '@/pages/partners/PartnerDetails';
import PaymentSuccess from './pages/subscription/PaymentSuccessPage';
import PaymentFailed from './pages/subscription/PaymentFailPage';
import UserProfile from './pages/UserProfile/UserProfile';
import Settings from './pages/setting/Setting';
import CompanyDetail from './pages/home/CompanyDetail';
import Workflow from './pages/home/Workflow';
import CompanyMember from './pages/home/CompanyMember';
import Admin from './pages/admin/Admin';

import AdminLayout from './layouts/Admin/AdminLayout';
import AdminDashboardPage from './pages/admin/Dashboard';
import AdminUsersPage from './pages/admin/Users';
import AdminSubscriptionsPage from './pages/admin/Subscriptions';
import AdminCompaniesPage from './pages/admin/Companies';
import SubscriptionPage from './pages/subscription/SubscriptionPage';


function App() {
  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <Routes>
        {/* Route main layout */}
        <Route path="/">
          <Route index element={<Landing />} />
        </Route>

        {/* Route home layout */}
        <Route element={<HomeLayout />}>
          <Route path="/company" element={<Company />} />
          <Route path="/setting" element={<Settings />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
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
        </Route>

        {/* Route admin layout */}
       <Route path="/admin" element={<AdminLayout />}>
       <Route index element={<AdminDashboardPage />} />
       <Route path="users" element={<AdminUsersPage />} />
       <Route path="companies" element={<AdminCompaniesPage />} />
       <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
  {/* <Route path="transactions" element={<AdminTransactionsPage />} /> */}
       </Route>

        {/* No layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-profile" element={<UserProfile />} />

        {/* Payment result */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
