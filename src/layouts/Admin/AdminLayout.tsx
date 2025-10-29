import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Building2, BadgeDollarSign, ListChecks } from "lucide-react";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean; // chỉ dùng cho Dashboard
};

export default function AdminLayout() {
  const items: Item[] = [
    { to: "/admin",              label: "Dashboard",     icon: LayoutDashboard, end: true }, // <- end
    { to: "/admin/users",        label: "Users",         icon: Users },
    { to: "/admin/companies",    label: "Companies",     icon: Building2 },
    { to: "/admin/subscriptions",label: "Subscriptions", icon: BadgeDollarSign },
    { to: "/admin/transactions", label: "Transactions",  icon: ListChecks }, // hoặc Audit Logs nếu bạn có route
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-r bg-white">
        <div className="px-4 py-4 text-lg font-semibold">Fusion Admin</div>
        <nav className="px-2 space-y-1">
          {items.map((i) => {
            const Icon = i.icon;
            return (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}                         // <<< quan trọng
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md ${
                    isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{i.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
