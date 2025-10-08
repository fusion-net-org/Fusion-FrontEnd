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
} from 'lucide-react';

const NavLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="flex flex-col justify-between h-screen p-4 border-r bg-gray-100">
      {/* Logo */}
      <div className="bg-gray-100">
        <div className="flex items-center ml-0.5 mb-5 gap-2">
          <div className="bg-blue-600 p-2 rounded-full">
            <img src={logo_fusion} alt="Logo" className="w-6 h-6" />
          </div>
          <span className="text-lg font-semibold">Fusion</span>
        </div>

        {/* Menu */}
        <nav className="flex flex-col space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isLogout = item.name === 'Logout';

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-left transition-colors
                  ${
                    isLogout
                      ? 'text-red-600 hover:bg-red-100 hover:text-red-700'
                      : isActive
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-300'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isLogout ? 'text-red-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default NavLeft;
