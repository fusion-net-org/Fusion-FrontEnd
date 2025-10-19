import React from "react";
import {
  Building2,
  FolderKanban,
  Headphones,
  BarChart3,
  Shield,
  Link2,
  Check,
  ShoppingBag,
} from "lucide-react";
import type { Subscription } from "@/interfaces/Subscription/Subscription";

interface Props {
  plans: Subscription[];
  onSelect?: (plan: Subscription) => void;
}

// Danh sách các tính năng hiển thị theo hàng
const features = [
  { key: "company", label: "Companies", icon: Building2 },
  { key: "project", label: "Projects", icon: FolderKanban },
  { key: "support", label: "Priority Support", icon: Headphones },
  { key: "analytics", label: "Data Analytics", icon: BarChart3 },
  { key: "security", label: "Advanced Security", icon: Shield },
  { key: "api", label: "API Access", icon: Link2 },
];

const SubscriptionTable: React.FC<Props> = ({ plans, onSelect }) => {
  const highlightIndex = 1; // Gói "Most Popular"

  return (
    <div className="relative overflow-visible w-full bg-white shadow-lg rounded-3xl border border-gray-200">
      {/* Tag "Most Popular" */}
      <div className="absolute -top-5 left-1/2 -translate-x-[16.5%] z-20">
        <span className="text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded-full px-3 py-1 shadow-sm uppercase tracking-wide">
          Most Popular
        </span>
      </div>

      <table className="w-full border-collapse text-base">
        {/* ===== HEADER ===== */}
        <thead>
          <tr>
            <th className="text-left py-8 px-8 text-xl font-semibold text-gray-700">
              Features
            </th>

            {plans.map((plan, i) => (
              <th
                key={plan.id ?? plan.name ?? i}
                className={`py-10 px-8 text-center transition-all ${
                  i === highlightIndex
                    ? "bg-gradient-to-b from-blue-50 via-white to-blue-50 border-b-4 border-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.08)] ring-1 ring-inset ring-blue-300/40"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <h3
                    className={`text-2xl font-extrabold tracking-tight ${
                      i === highlightIndex
                        ? "bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent"
                        : "text-slate-800"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 text-base mt-2">
                    {plan.price ? `$${plan.price.toLocaleString()} / month` : "Custom"}
                  </p>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ===== BODY ===== */}
        <tbody>
          {features.map((f) => (
            <tr
              key={`row-${f.key}`}
              className="border-t border-gray-200 hover:bg-blue-50/50 transition-all"
            >
              <td className="py-6 px-8 text-gray-700 font-medium flex items-center gap-3">
                <f.icon className="w-5 h-5 text-blue-500" />
                {f.label}
              </td>

              {plans.map((plan, i) => {
                const name = plan.name?.toLowerCase() ?? "";
                let value: React.ReactNode = "-";

                // Hiển thị quota hoặc dấu tick cho từng tính năng
                switch (f.key) {
                  case "company":
                    value = plan.quotaCompany ?? "∞";
                    break;
                  case "project":
                    value = plan.quotaProject ?? "∞";
                    break;
                  case "support":
                    if (name.includes("pro") || name.includes("enterprise"))
                      value = <Check className="w-5 h-5 text-blue-500 mx-auto" />;
                    break;
                  case "analytics":
                    if (name.includes("pro") || name.includes("enterprise"))
                      value = <Check className="w-5 h-5 text-blue-500 mx-auto" />;
                    break;
                  case "security":
                    if (name.includes("enterprise"))
                      value = <Check className="w-5 h-5 text-blue-500 mx-auto" />;
                    break;
                  case "api":
                    if (name.includes("enterprise"))
                      value = <Check className="w-5 h-5 text-blue-500 mx-auto" />;
                    break;
                }

                return (
                  <td
                    key={`${plan.id ?? plan.name ?? i}-${f.key}`}
                    className={`text-center py-6 text-gray-800 font-medium ${
                      i === highlightIndex ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {/* ===== FOOTER ===== */}
        <tfoot className="border-t border-gray-200">
          <tr className="align-middle">
            <td className="py-8"></td>

            {plans.map((plan, i) => (
              <td
                key={`footer-${plan.id ?? plan.name ?? i}`}
                className={`text-center py-10 ${
                  i === highlightIndex
                    ? "bg-blue-50 rounded-b-3xl"
                    : "bg-gray-50 rounded-b-3xl"
                }`}
              >
                <div className="flex justify-center">
                  <button
                    onClick={() => onSelect?.(plan)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all text-base shadow-sm ${
                      i === highlightIndex
                        ? "bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white hover:scale-[1.03] active:scale-[0.97]"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {plan.price ? "Buy Now" : "Contact Sales"}
                  </button>
                </div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SubscriptionTable;
