import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import { ToastContainer } from 'react-toastify';
import ScrollToTop from './utils/ScrollToTop';
import NotFound from './pages/notfound/NotFound';
import Register from './pages/register/Register';
import Company from './pages/home/Company';
import Landing from './pages/landing/Landing';
import HomeLayout from './layouts/HomeLayout/HomeLayout';
import Setting from './pages/setting/Setting';

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
          <Route path="/setting" element={<Setting />} />
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
