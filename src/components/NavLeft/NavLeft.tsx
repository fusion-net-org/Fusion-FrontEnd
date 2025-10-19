import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const NavLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Company', icon: LayoutDashboard, path: '/company' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Invoice', icon: Ticket, path: '/invoice' },
    { name: 'Schedule', icon: FileText, path: '/schedule' },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Setting', icon: Settings, path: '/setting' },
    { name: 'Logout', icon: LogOut, path: '/logout' },
  ];

  return (
    <div
      className={`flex flex-col justify-between h-screen border-r bg-gray-100 transition-all duration-300 ${
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
              <img src={logo_fusion} alt="Logo" className="w-6 h-6" />
            </div>
            {!isCollapsed && <span className="text-lg font-semibold">Fusion</span>}
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`text-gray-500 hover:text-gray-700 transition ${
              isCollapsed ? '' : 'ml-auto'
            }`}
          >
            {isCollapsed ? <MenuIcon size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex flex-col space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isLogout = item.name === 'Logout';

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                } gap-3 px-3 py-2 rounded-md w-full text-left transition-colors
                  ${
                    isLogout
                      ? 'text-red-600 hover:bg-red-100 hover:text-red-700'
                      : isActive
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-300'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isLogout ? 'text-red-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                />
                {!isCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default NavLeft;
