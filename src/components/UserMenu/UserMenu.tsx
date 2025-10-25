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
  className?: string;
}

export default function UserMenu({ user, menuItems, onItemClick, className = '' }: UserMenuProps) {
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
      ? { name: userFromRedux.username || 'Unknown', email: userFromRedux.email }
      : { name: 'Unknown', email: 'user@company.com' });

  const defaultMenuItems: MenuItem[] = [
    { icon: User, label: 'My Profile', href: '/my-profile' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    {
      icon: LogOut,
      label: 'Sign Out',
      href: '/logout',
      onClick: handleLogout,
      divider: true,
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
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-2 rounded-full hover:bg-gray-100 transition-all duration-150"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {getInitials()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-gray-800">{currentUser.name}</div>
          <div className="text-xs text-gray-500">{currentUser.email}</div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-56 bg-white rounded-lg transition-all duration-200 z-50 ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="py-1">
          {currentMenuItems.map((item, index) => (
            <div key={index}>
              {item.divider && <div className="my-1 border-t border-gray-100" />}
              <button
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors duration-150 text-left group"
              >
                <item.icon className="w-5 h-5 text-gray-500 group-hover:text-gray-800" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
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
