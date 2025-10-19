import React from "react";
import { useNavigate } from "react-router-dom";
import successImg from '@/assets/payment_success.png';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-emerald-100 to-green-200 px-4">
        <img
        src={successImg}
        alt="Payment Success"
        className="w-[350px] sm:w-[400px] md:w-[500px] mb-8 animate-bounce drop-shadow-2xl"
      />
      <p className="text-lg text-gray-700 text-center mb-8 max-w-md">
        Thanh you for subscribing to our service package. Enjoy greate features just for you 🎉
      </p>
      <button
        onClick={() => navigate('/')}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
      >
        GO HOME
      </button>
    </div>
  );
};

export default PaymentSuccess;
