import React from "react";
import { Modal, Button, Divider, Tag } from "antd";
import {
  ShoppingCart,
  Building2,
  FolderKanban,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { Subscription } from "@/interfaces/Subscription/Subscription";

interface Props {
  visible: boolean;
  onClose: () => void;
  plan?: Subscription | null;
  onConfirm: (plan: Subscription) => void;
}

const SubscriptionCheckoutModal: React.FC<Props> = ({
  visible,
  onClose,
  plan,
  onConfirm,
}) => {
  if (!plan) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={760}
      destroyOnHidden
      maskClosable={false}
      className="rounded-2xl overflow-hidden shadow-2xl"
      closeIcon={false}
    >
      {/* ===== Header Section ===== */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-10 py-7 rounded-t-2xl shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <ShoppingCart className="w-9 h-9" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {plan.name} Plan
              </h2>
              <p className="text-sm opacity-85">
                Review details before completing checkout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/75 hover:text-white transition-all text-xl font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ===== Body Section ===== */}
      <div className="bg-white p-10 grid grid-cols-1 md:grid-cols-2 gap-10 text-gray-800">
        {/* LEFT: Plan Info */}
        <div className="space-y-5">
          <p className="text-gray-600 leading-relaxed text-base">
            {plan.description ||
              "Your subscription includes access to company and project management features, analytics, and security tools."}
          </p>

          <ul className="space-y-4 text-base">
            <li className="flex items-center gap-3">
              <Building2 className="text-blue-500 w-5 h-5" />
              <span>Companies:</span>
              <strong className="ml-auto">{plan.quotaCompany}</strong>
            </li>
            <li className="flex items-center gap-3">
              <FolderKanban className="text-blue-500 w-5 h-5" />
              <span>Projects:</span>
              <strong className="ml-auto">{plan.quotaProject}</strong>
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="text-blue-500 w-5 h-5" />
              <span>Security Level:</span>
              <Tag color="blue" className="ml-auto">
                {plan.name.toLowerCase().includes("enterprise")
                  ? "Advanced"
                  : "Standard"}
              </Tag>
            </li>
          </ul>
        </div>

        {/* RIGHT: Payment Summary */}
        <div className="bg-gray-50 rounded-xl p-8 shadow-inner flex flex-col justify-between border border-gray-200">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Payment Summary
            </h3>
            <div className="flex justify-between py-2 text-gray-600">
              <span>Plan:</span>
              <strong>{plan.name}</strong>
            </div>
            <div className="flex justify-between py-2 text-gray-600">
              <span>Price per month:</span>
              <strong>${plan.price.toLocaleString()}</strong>
            </div>

            <Divider className="my-4" />
            <div className="flex justify-between text-xl font-bold text-blue-600">
              <span>Total Due Today:</span>
              <span>${plan.price.toLocaleString()}</span>
            </div>
          </div>

          <Button
            type="primary"
            className="mt-8 w-full py-3 text-lg bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={() => onConfirm(plan)}
            icon={<Zap className="w-5 h-5 mr-1" />}
          >
            Pay
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionCheckoutModal;
