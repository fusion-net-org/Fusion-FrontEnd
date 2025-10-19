import React from "react";
import { useNavigate } from "react-router-dom";
import failedImg from '@/assets/payment_failed.png';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-50 via-emerald-100 to-red-200 px-4">
        <img
        src={failedImg}
        alt="Payment Failed"
        className="w-[350px] sm:w-[400px] md:w-[500px] mb-8 animate-bounce drop-shadow-2xl"
      />
      <p className="text-lg text-gray-700 text-center mb-8 max-w-md">
        Oops! Something went wrong with your payment. Please try again or contact support for assistance.
      </p>
      <button
        onClick={() => navigate('/subscription')}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
      >
        TRY AGAIN
      </button>
    </div>
  );
};

export default PaymentSuccess;
