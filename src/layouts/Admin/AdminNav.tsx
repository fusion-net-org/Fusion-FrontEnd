import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  BadgeDollarSign,
  ListChecks,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Bell,
} from 'lucide-react';
import logo_fusion from '@/assets/logo_fusion.png';

type Item = {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  end?: boolean;
  children?: { to: string; label: string; enabled?: boolean }[];
};

type AdminNavProps = {
  collapsed: boolean;
};

export default function AdminNav({ collapsed }: AdminNavProps) {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [userDetailEnabled, setUserDetailEnabled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const enabled = localStorage.getItem('userDetailEnabled') === 'true';
    setUserDetailEnabled(enabled);
  }, [location.pathname]);

  const items: Item[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    {
      to: '/admin/users',
      label: 'User management',
      icon: Users,
      children: [
        { to: '/admin/users/overview', label: 'Overview' },
        { to: '/admin/users/list', label: 'User list' },
        {
          to: '/admin/users/detail',
          label: 'User detail',
          enabled: userDetailEnabled,
        },
      ],
    },
    {
      to: '/admin/companies',
      label: 'Companies',
      icon: Building2,
      children: [
        { to: '/admin/companies/overview', label: 'Overview' },
        { to: '/admin/companies/list', label: 'Company list' },
        { to: '/admin/companies/detail', label: 'Company detail' },
      ],
    },
    {
      to: '/admin/projects',
      label: 'Project management',
      icon: FolderKanban,
      children: [
        { to: '/admin/projects/overview', label: 'Overview' },
        { to: '/admin/projects/list', label: 'Project list' },
        { to: '/admin/projects/detail', label: 'Project detail' },
      ],
    },
    {
      to: '/admin/notifications',
      label: 'Notification management',
      icon: Bell,
      children: [
        { to: '/admin/notifications/overview', label: 'Overview' },
        { to: '/admin/notifications/list', label: 'Notification list' },
      ],
    },
    {
      to: '/admin/subscriptions',
      label: 'Subscriptions',
      icon: BadgeDollarSign,
      children: [
        { to: '/admin/subscriptions/overview', label: 'Overview' },
        { to: '/admin/subscriptions/list', label: 'Subscriptions list' },
      ],
    },
    {
      to: '/admin/transactions',
      label: 'Transactions',
      icon: ListChecks,
      children: [
        { to: '/admin/transactions/overview', label: 'Overview' },
        { to: '/admin/transactions/list', label: 'Transactions list' },
      ],
    },
  ];

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-[70px]' : 'w-[240px]'
      } h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[64px] border-b border-gray-800">
        <div className="p-2 rounded-lg bg-blue-600/20">
          <img src={logo_fusion} className="h-5 w-5" alt="Fusion" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg text-white tracking-wide">Fusion Admin</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700/50">
        {items.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openMenus.has(item.to);
          const isParentActive = location.pathname.startsWith(item.to);

          if (hasChildren) {
            return (
              <div key={item.to} className="space-y-1">
                {/* Menu cha */}
                <button
                  onClick={() => toggleMenu(item.to)}
                  className={`relative flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isParentActive
                        ? 'bg-blue-600/20 text-white ring-1 ring-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-blue-500/10'
                    }`}
                >
                  {isParentActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full" />
                  )}
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  {!collapsed && (
                    <>
                      <span className="w-[150px] text-left break-words">{item.label}</span>

                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {isOpen && !collapsed && (
                  <div className="ml-6 mt-1 pl-3 border-l border-gray-700 space-y-1 animate-fade-in">
                    {item.children?.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.enabled === false ? '#' : sub.to}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-md text-sm transition-colors w-[140px] ${
                            sub.enabled === false
                              ? 'text-gray-600 cursor-not-allowed'
                              : isActive
                              ? 'text-blue-400 bg-blue-600/10'
                              : 'text-gray-400 hover:text-white hover:bg-blue-600/20'
                          }`
                        }
                        onClick={(e) => {
                          if (sub.enabled === false) e.preventDefault();
                        }}
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-blue-600/20 text-white ring-1 ring-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-blue-500/10'
                  }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full" />
                  )}
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  {!collapsed && <span>{item.label}</span>}
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
