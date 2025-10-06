import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { ToastContainer } from "react-toastify";
import ScrollToTop from "./utils/ScrollToTop";
import NotFound from "./pages/notfound/NotFound";
import Register from "./pages/register/Register";
import Company from "./pages/company/Company";
import MainLayout from "./layouts/MainLayout/MainLayout";

function App() {
  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <Routes>
        {/* Route có layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/company" element={<Company />} />
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
