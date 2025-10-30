import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, BadgeDollarSign, ListChecks } from 'lucide-react';
import logo_fusion from '@/assets/logo_fusion.png';

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

type AdminNavProps = {
  collapsed: boolean;
};

export default function AdminNav({ collapsed }: AdminNavProps) {
  const items: Item[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: BadgeDollarSign },
    { to: '/admin/transactions', label: 'Transactions', icon: ListChecks },
  ];

  return (
    <aside
      className={`${
        collapsed ? '' : ''
      } h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300`}
    >
      <div className="flex items-center gap-3 px-4 h-[64px] border-b border-gray-800">
        <div className="p-2 rounded-lg bg-blue-600/20">
          <img src={logo_fusion} className="h-5 w-5" alt="Fusion" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg text-white tracking-wide">Fusion Admin</span>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700/50">
        {items.map((i) => {
          const Icon = i.icon;
          return (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-blue-600/20 text-white ring-1 ring-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full" />
                  )}
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{i.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4 text-center text-xs text-gray-500">
        {!collapsed && <>© {new Date().getFullYear()} Fusion</>}
      </div>
    </aside>
  );
}
