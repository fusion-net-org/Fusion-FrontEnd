import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { ToastContainer } from "react-toastify";
import ScrollToTop from "./utils/ScrollToTop";
import NotFound from "./pages/notfound/NotFound";
import Register from "./pages/register/Register";

function App() {
  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home title="Welcome Home" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
