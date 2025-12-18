import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart2,
  Ticket,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  UserPlus,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Folder,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo_fusion from '@/assets/logo_fusion.png';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/redux/hooks';
import { logoutUser } from '@/redux/userSlice';

type NavLeftProps = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

type SubItem = {
  name: string;
  path: string;
  enabled?: boolean;
};

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: SubItem[];
  onClick?: () => void;
  danger?: boolean;
};

type PresetIcon =
  | 'dashboard'
  | 'invitation'
  | 'analytics'
  | 'invoice'
  | 'schedule'
  | 'calendar'
  | 'subscription'
  | 'mysubscription'
  | 'logout';

const Preset: Record<PresetIcon, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  ),
  invitation: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M4 19h16M7 15v4M12 11v8M17 7v12" />
    </svg>
  ),
  invoice: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M7 4h10v16H7z" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M4 6h16v14H4z" />
    </svg>
  ),
  subscription: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <circle cx="12" cy="12" r="8" />
    </svg>
  ),
  mysubscription: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M4 4h16v16H4z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" className="cmp-nav__svg">
      <path d="M10 6H4v12h6M14 16l4-4-4-4" />
    </svg>
  ),
};

const NavLeft: React.FC<NavLeftProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Signed out successfully!');
    navigate('/');
  };

  const menuItems: MenuItem[] = [
    {
      name: t('menu_item.company'),
      icon: LayoutDashboard,
      path: '/company',
      children: [{ name: 'All company', path: '/company' }],
    },
    {
      name: t('menu_item.invitation'),
      icon: UserPlus,
      path: '/invitation',
      children: [{ name: 'Invitation', path: '/invitation' }],
    },
    // { name: t('menu_item.analytics'), icon: BarChart2, path: '/analytics' },
    // {
    //   name: t('menu_item.invoice'),
    //   icon: Ticket,
    //   path: '/invoice',
    //   children: [{ name: 'Invoice', path: '/invoice' }],
    // },
    { name: t('menu_item.schedule'), icon: FileText, path: '/schedule' },
    {
      name: t('menu_item.calendar'),
      icon: CalendarDays,
      path: '/calendar',
      children: [
        { name: 'Calendar', path: '/calendar/calendar' },
        { name: 'My task', path: '/calendar/tasks' },
      ],
    },
    { name: t('menu_item.subscription'), icon: CreditCard, path: '/subscription' },
    { name: t('menu_item.mySubscription'), icon: Folder, path: '/mysubscription' },
    { name: t('menu_item.setting'), icon: Settings, path: '/setting' },
    { name: t('menu_item.exit'), icon: ArrowLeft, path: '/' },
    { name: t('menu_item.logout'), icon: LogOut, onClick: handleLogout, danger: true },
  ];

  const isActivePath = (path?: string) =>
    path && (location.pathname === path || location.pathname.startsWith(path + '/'));

  return (
    <>
      <aside
        className={`flex flex-col justify-between bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div
            className={`flex items-center mb-2 pb-4 border-b border-gray-200 dark:border-gray-700 ${
              isCollapsed ? 'flex-col space-y-3' : ''
            }`}
          >
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center w-full' : 'justify-start gap-3'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Logo bự hơn, không nền, giữ tỉ lệ */}
                <img
                  src={logo_fusion}
                  alt="Fusion logo"
                  className="
      w-24 h-24    
      sm:w-14 sm:h-14  
      object-contain
    "
                />
              </div>

              {!isCollapsed && (
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Fusion
                </span>
              )}
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 flex flex-col space-y-1">
            <div
              style={{
                padding: '10px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#6b7280',
                textTransform: 'uppercase',
              }}
            >
              Menu
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = !!item.children?.length;
              const active = isActivePath(item.path);
              const isOpen = openMenus.has(item.name);

              const base =
                'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm transition-all duration-200 select-none relative';
              const layout = isCollapsed ? 'justify-center' : 'justify-start';
              const normal =
                'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100';
              const activeCls =
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:rounded-r-full';
              const exitCls =
                'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20';
              const dangerCls =
                'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300';

              const className = [
                base,
                layout,
                item.danger ? dangerCls : item.path === '/' ? exitCls : active ? activeCls : normal,
              ].join(' ');

              const handleClick = () => {
                if (item.onClick) item.onClick();
                else if (hasChildren) toggleMenu(item.name);
                else if (item.path) navigate(item.path);
              };

              return (
                <div key={item.name}>
                  {/* Parent row */}
                  <button
                    className={`
    relative flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium 
    transition-all duration-200
    ${
      active
        ? 'bg-blue-600/10 text-blue-700 ring-1 ring-blue-500'
        : item.danger
        ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300'
        : item.path === '/'
        ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }
  `}
                    onClick={handleClick}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        active
                          ? 'text-blue-600'
                          : item.danger
                          ? 'text-red-600 dark:text-red-400'
                          : item.path === '/'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-300'
                      }`}
                    />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>

                        {hasChildren &&
                          (isOpen ? (
                            <ChevronDown className="w-4 h-4 opacity-70 transition-transform duration-200 rotate-180" />
                          ) : (
                            <ChevronRight className="w-4 h-4 opacity-70 transition-transform duration-200" />
                          ))}
                      </>
                    )}
                  </button>

                  {/* Submenu */}
                  {!isCollapsed && hasChildren && isOpen && (
                    <div className="ml-6 mt-1 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
                      {item.children?.map((sub) => (
                        <button
                          key={sub.path}
                          onClick={() => navigate(sub.path)}
                          disabled={sub.enabled === false}
                          className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200
                      ${
                        location.pathname.startsWith(sub.path)
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-medium'
                          : sub.enabled === false
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default NavLeft;
