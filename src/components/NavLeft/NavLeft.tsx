import {
  LayoutDashboard,
  BarChart2,
  Ticket,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo_fusion from '@/assets/logo_fusion.png';
import { useTranslation } from 'react-i18next';

type NavLeftProps = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
  danger?: boolean;
};

const NavLeft: React.FC<NavLeftProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Signed out successfully!');
    navigate('/');
  };

  const menuItems: MenuItem[] = [
    { name: t('menu_item.company'), icon: LayoutDashboard, path: '/company' },
    { name: t('menu_item.analytics'), icon: BarChart2, path: '/analytics' },
    { name: t('menu_item.invoice'), icon: Ticket, path: '/invoice' },
    { name: t('menu_item.schedule'), icon: FileText, path: '/schedule' },
    { name: t('menu_item.calendar'), icon: CalendarDays, path: '/calendar' },
    { name: t('menu_item.subscription'), icon: CreditCard, path: '/subscription' },
    { name: t('menu_item.setting'), icon: Settings, path: '/setting' },
    { name: t('menu_item.logout'), icon: LogOut, onClick: handleLogout, danger: true },
  ];

  const isActivePath = (path?: string) =>
    path && (location.pathname === path || location.pathname.startsWith(path + '/'));

  return (
    <aside
      className={`flex flex-col justify-between bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4">
        {/* Logo */}
        <div
          className={`flex items-center justify-between mb-6 ${
            isCollapsed ? 'flex-col space-y-3' : ''
          }`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center w-full' : 'justify-start gap-2'
            }`}
          >
            <div className="bg-blue-600 p-2 rounded-full flex items-center justify-center">
              <img src={logo_fusion} alt="Fusion logo" className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fusion</span>
            )}
          </div>
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
            const normal =
              'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100';
            const activeCls =
              'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium';
            const dangerCls =
              'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300';

            const className = [base, layout, danger ? dangerCls : active ? activeCls : normal].join(
              ' ',
            );

            const handleClick = () => {
              if (item.onClick) item.onClick();
              else if (item.path) navigate(item.path);
            };

            return (
              <button
                key={item.name}
                onClick={handleClick}
                className={className}
                title={isCollapsed ? item.name : undefined}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
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
