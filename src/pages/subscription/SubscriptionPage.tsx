import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import { getAllSubscriptions } from "@/services/subscriptionService.js";
import { createTransaction, getLatestTransaction } from "@/services/transactionService.js";
import { createPaymentLink } from "@/services/payosService.js";
import SubscriptionTable from "@/components/Subscription/SubscriptionTable";
import SubscriptionCheckoutModal from "@/components/Subscription/SubscriptionCheckoutModal";
import type { Subscription } from "@/interfaces/Subscription/Subscription";
export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  //  Fetch all subscriptions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAllSubscriptions();
        setSubscriptions(res.data || []);
      } catch (error) {
        message.error("Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  //  When user selects a plan
  const handleSelectPlan = (plan: Subscription) => {
    setSelectedPlan(plan);
    setIsModalVisible(true);
  };

  //  When user confirms payment
  const handlePayment = async (plan: Subscription) => {
    console.log("Plan:", plan);

    if(!plan) return;

    try {
      // 1. transaction
      const transaction = await createTransaction({planId: plan.id});
      console.log("Transaction:", transaction);

      // 2.Get latest transaction
      const latestTransaction = await getLatestTransaction();
      console.log("Latest Transaction:", latestTransaction);

      // 3. Create payment link
       const response = await createPaymentLink(latestTransaction);
      console.log("PayOS Response:", response);

      // 4. Get url from response
      const checkoutUrl = response;
      if (!checkoutUrl)  throw new Error("Cannot get PayOS checkout URL");

     message.success({
      content: "Redirecting to payment gateway...",
      key: "pay",
      duration: 1.5,
    });

      setIsModalVisible(false);
      
   // 5️⃣ Redirect to PayOS checkout
    window.location.href = checkoutUrl;

 } catch (err: any) {
    console.error("Payment error:", err);
    message.error({
      content: err.message || "Payment failed!",
      key: "pay",
    });
  }
};

  //  Loading spinner
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-700">
        <Spin size="large" />
      </div>
    );

  //  Main render
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800 font-[Inter] flex flex-col items-center">
      {/* HERO */}
      <section className="relative w-full text-center py-24 overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center -z-10">
          <div className="w-[800px] h-[800px] bg-gradient-to-r from-blue-200/20 via-purple-300/20 to-indigo-200/10 blur-3xl rounded-full"></div>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm mb-6 px-6">
          Empower Your Next Digital Era
        </h1>
        <div className="w-24 h-[3px] mx-auto mt-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-80"></div>
      </section>

      {/* TABLE */}
      <section className="w-full max-w-7xl px-6 md:px-10 mb-24">
        <SubscriptionTable plans={subscriptions} onSelect={handleSelectPlan} />
      </section>

      {/* CHECKOUT MODAL */}
      <SubscriptionCheckoutModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        plan={selectedPlan}
        onConfirm={handlePayment}
      />
    </div>
  );
}
