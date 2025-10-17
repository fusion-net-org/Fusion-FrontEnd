import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import { ToastContainer } from 'react-toastify';
import ScrollToTop from './utils/ScrollToTop';
import NotFound from './pages/notfound/NotFound';
import Register from './pages/register/Register';
import Company from './pages/home/Company';
import MainLayout from './layouts/MainLayout/MainLayout';
import Landing from './pages/landing/Landing';
import HomeLayout from './layouts/HomeLayout/HomeLayout';
import CompanyLayout from './layouts/Company/CompanyLayout';
import AccessRolePage from './pages/home/AccessRolePage';
import ProjectsPage from './pages/home/ProjectsPage';

function App() {
  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <Routes>
        {/* Route main layout */}
        <Route path="/" >
          <Route index element={<Landing />} />
        </Route>

        {/* Route home layout */}
        <Route element={<HomeLayout />}>
          <Route path="/company" element={<Company />} />
        </Route>
        <Route element={<CompanyLayout />}>
          <Route path="/company/access-role" element={<AccessRolePage/>} />
        </Route>
        <Route element={<CompanyLayout />}>
          <Route path="/company/project" element={<ProjectsPage/>} />
        </Route>
        {/* Route ko có layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
