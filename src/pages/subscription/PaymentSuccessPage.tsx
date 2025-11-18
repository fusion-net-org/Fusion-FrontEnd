import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import successImg from "@/assets/payment_success.png";
import { refreshPayosStatus } from "@/services/payosService.js";

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState<string>("PENDING");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const orderCode = qs.get("orderCode") ?? "";
    const paymentLinkId = qs.get("id") ?? "";        // PayOS trả "id" (paymentLinkId)
    (async () => {
      try {
        setBusy(true);
        const s = await refreshPayosStatus(orderCode, paymentLinkId);
        setStatus(s || "PENDING");
      } catch (e: any) {
        setErr(e?.message || "Could not verify transaction status.");
      } finally {
        setBusy(false);
      }
    })();
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 via-emerald-100 to-green-200 px-4">
      <img
        src={successImg}
        alt="Payment Success"
        className="w-[350px] sm:w-[400px] md:w-[500px] mb-8 drop-shadow-2xl"
      />
      <p className="text-lg text-gray-700 text-center mb-3 max-w-md">
        Thank you for subscribing to our service package. Enjoy great features just for you 🎉
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Status: <b>{busy ? "Verifying..." : status}</b>{err ? ` — ${err}` : ""}
      </p>
     <button
        onClick={() => navigate('/company', { replace: true })}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
           >
               GO HOME
     </button>
    </div>
  );
};

export default PaymentSuccess;
