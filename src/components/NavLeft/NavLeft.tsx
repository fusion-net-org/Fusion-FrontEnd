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
  ArrowLeft,
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
    localStorage.setItem('nav-collapsed', isCollapsed ? '1' : '0');
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
      className={`flex flex-col justify-between bg-white transition-all duration-300 h-screen ${
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl flex items-center justify-center">
              <img src={logo_fusion} alt="Fusion" className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Fusion
              </span>
            )}
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
            {isCollapsed ? <MenuIcon size={20} /> : <ArrowLeft size={25} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.path);
            const danger = item.danger;

            const base =
              'flex items-center gap-3 px-3 py-2 rounded-md w-full text-left transition-all duration-200';
            const layout = isCollapsed ? 'justify-center' : 'justify-start';
            const normal = 'text-gray-600 hover:bg-gray-100 hover:text-gray-800';
            const activeCls = 'bg-blue-50 text-blue-700 font-medium border border-blue-100';
            const dangerCls = 'text-red-600 hover:bg-red-50 hover:text-red-700';

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
