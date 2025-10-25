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
    {
      icon: User,
      label: 'My profile',
      href: '/my-profile',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      color: 'text-gray-600 dark:text-gray-400',
    },
    {
      icon: LogOut,
      label: 'Logout',
      href: '/logout',
      color: 'text-red-600 dark:text-red-400',
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
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${buttonClassName}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
            {getInitials()}
          </div>
          <div className="hidden text-left lg:block">
            <div className="text-sm font-medium text-gray-800 dark:text-white">
              {currentUser.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 z-[9999] ${menuClassName}`}
        >
          <div className="py-2 mx-5">
            {currentMenuItems.map((item, index) => (
              <div key={index}>
                {item.divider && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
                )}
                <button
                  onClick={() => handleItemClick(item)}
                  className="group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      item.color || 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {item.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
