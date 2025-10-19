import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Settings, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { logoutUser } from '@/redux/userSlice';

export interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color?: string;
  divider?: boolean;
  onClick?: () => void;
}

export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
}

interface UserMenuProps {
  user?: UserInfo;
  menuItems?: MenuItem[];
  onItemClick?: (href: string) => void;
  navigationMode?: 'router' | 'window' | 'custom';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export default function UserMenu({
  user,
  menuItems,
  onItemClick,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userFromRedux = useAppSelector((state) => state.user.user);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Signed out successfully!');
    navigate('/');
  };

  const currentUser: UserInfo =
    user ||
    (userFromRedux
      ? {
          name: userFromRedux.username || 'Unknown',
          email: userFromRedux.email,
        }
      : { name: 'Unknown', email: 'user@company.com' });

  // Default menu items
  const defaultMenuItems: MenuItem[] = [
    { icon: User, label: 'My profile', href: '/my-profile', color: 'text-blue-600' },
    { icon: Bell, label: 'Notifications', href: '/notifications', color: 'text-yellow-600' },
    { icon: Settings, label: 'Settings', href: '/settings', color: 'text-gray-600' },
    {
      icon: LogOut,
      label: 'Logout',
      href: '/logout',
      color: 'text-red-600',
      divider: true,
      onClick: handleLogout,
    },
  ];

  const currentMenuItems = menuItems || defaultMenuItems;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) item.onClick();
    else if (onItemClick) onItemClick(item.href);
    else if (item.href && item.href !== '/logout') navigate(item.href);

    setIsOpen(false);
  };

  const getInitials = () =>
    currentUser.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Nút toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 ${buttonClassName}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {getInitials()}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-800">{currentUser.name}</div>
            <div className="text-xs text-gray-500">{currentUser.email}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 origin-top z-50 ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        } ${menuClassName}`}
      >
        <div className="py-2">
          {currentMenuItems.map((item, index) => (
            <div key={index}>
              {item.divider && <div className="my-2 border-t border-gray-200" />}
              <button
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left group"
              >
                <item.icon
                  className={`w-5 h-5 ${
                    item.color || 'text-gray-600'
                  } group-hover:scale-110 transition-transform duration-200`}
                />
                <span className="text-gray-700 font-medium group-hover:text-gray-900">
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
