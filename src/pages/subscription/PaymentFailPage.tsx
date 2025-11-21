import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import failedImg from "@/assets/payment_failed.png";
import { refreshPayosStatus } from "@/services/payosService.js";

const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState<string>("PENDING");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const orderCode = qs.get("orderCode") ?? "";
    const paymentLinkId = qs.get("id") ?? "";
    const cancel = qs.get("cancel") === "true";

    (async () => {
      try {
        setBusy(true);
        // Hỏi backend để cập nhật DB (CANCELLED nếu user bấm Cancel ở PayOS)
        const s = await refreshPayosStatus(orderCode, paymentLinkId);
        setStatus(s || (cancel ? "CANCELLED" : "PENDING"));
      } catch (e: any) {
        setErr(e?.message || "Could not verify transaction status.");
      } finally {
        setBusy(false);
      }
    })();
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-50 via-rose-100 to-red-200 px-4">
      <img
        src={failedImg}
        alt="Payment Failed"
        className="w-[350px] sm:w-[400px] md:w-[500px] mb-8 drop-shadow-2xl"
      />
      <p className="text-lg text-gray-700 text-center mb-3 max-w-md">
        Oops! Something went wrong with your payment. Please try again or contact support for assistance.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Status: <b>{busy ? "Verifying..." : status}</b>{err ? ` — ${err}` : ""}
      </p>
      <button
        onClick={() => navigate("/subscription")}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
        disabled={busy}
      >
        TRY AGAIN
      </button>
    </div>
  );
};

export default PaymentFailed;
