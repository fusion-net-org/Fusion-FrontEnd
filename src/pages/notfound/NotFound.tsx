import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Oops! NotFound</h2>
      <p className="text-gray-600 mb-6">The page you are looking for is unavailable or has been deleted.</p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        Return Home Page
      </button>
    </div>
  );
};

export default NotFound;
