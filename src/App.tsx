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
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import PaymentSuccess from './pages/subscription/PaymentSuccessPage';
import PaymentFailed from './pages/subscription/PaymentFailPage';
import Settings from './pages/setting/Setting';
import UserProfile from './pages/UserProfile/UserProfile';
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
        </Route>
       <Route element={<CompanyLayout/>}>
  <Route
    path="/companies/:companyId/access-role"
    element={<AccessRolePage />}
  />
</Route>
        <Route element={<CompanyLayout />}>
          <Route path="/company/:companyId/project" element={<ProjectsPage/>} />
          <Route path="/setting" element={<Settings />} />
        </Route>
        {/* Route ko có layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-profile" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />

        {/*Route payment-result */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* partners */}
        <Route element={<CompanyLayout />}>
          <Route path="/company/partners" element={<Partners />} />
          <Route path="/company/partners/:id" element={<PartnerDetails />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
