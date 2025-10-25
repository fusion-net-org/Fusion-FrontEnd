import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo_fusion from '@/assets/logo_fusion.png';
import {
  LayoutDashboard,
  BarChart2,
  Ticket,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Menu as MenuIcon,
  ChevronLeft,
} from 'lucide-react';

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
  danger?: boolean;
};

const NavLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nav-collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nav-collapsed', isCollapsed ? '1' : '0');
    } catch {}
  }, [isCollapsed]);

  // === LOGOUT ===
  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Signed out successfully!');
    navigate('/');
  };

  const menuItems: MenuItem[] = [
    { name: 'Company', icon: LayoutDashboard, path: '/company' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Invoice', icon: Ticket, path: '/invoice' },
    { name: 'Schedule', icon: FileText, path: '/schedule' },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Setting', icon: Settings, path: '/setting' },
    { name: 'Logout', icon: LogOut, onClick: handleLogout, danger: true },
  ];

  const isActivePath = (path?: string) => {
    if (!path) return false;
    if (location.pathname === path) return true;
    return location.pathname.startsWith(path + '/');
  };

  return (
    <aside
      className={`flex flex-col justify-between h-screen border-r bg-gray-50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header: Logo + Toggle */}
      <div className="p-4">
        <div
          className={`flex items-center justify-between mb-6 ${
            isCollapsed ? 'flex-col space-y-3' : ''
          }`}
        >
          {/* Logo */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center w-full' : 'justify-start gap-2'
            }`}
          >
            <div className="bg-blue-600 p-2 rounded-full flex items-center justify-center">
              <img src={logo_fusion} alt="Fusion logo" className="w-6 h-6" />
            </div>
            {!isCollapsed && <span className="text-lg font-semibold">Fusion</span>}
          </div>

          {/* Toggle */}
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className={`text-gray-500 hover:text-gray-700 transition ${
              isCollapsed ? '' : 'ml-auto'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <MenuIcon size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.path);
            const danger = item.danger;

            const base =
              'flex items-center gap-3 px-3 py-2 rounded-md w-full text-left transition-colors';
            const layout = isCollapsed ? 'justify-center' : 'justify-start';
            const normal = 'text-gray-600 hover:bg-gray-200 hover:text-gray-800';
            const activeCls = 'bg-blue-100 text-blue-700 font-medium';
            const dangerCls = 'text-red-600 hover:bg-red-100 hover:text-red-700';

            const className = [base, layout, danger ? dangerCls : active ? activeCls : normal].join(
              ' ',
            );

            const iconColor = danger ? 'text-red-600' : active ? 'text-blue-600' : 'text-gray-500';

            const handleClick = () => {
              if (item.onClick) {
                item.onClick();
              } else if (item.path) {
                navigate(item.path);
              }
            };

            return (
              <button
                key={item.name}
                onClick={handleClick}
                className={className}
                title={isCollapsed ? item.name : undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default NavLeft;
