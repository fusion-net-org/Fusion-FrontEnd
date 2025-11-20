/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import UserMenu from '../UserMenu/UserMenu';
import NotificationDropdown from '../Notification/NotificationDropDown';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type HomeHeaderProps = {
  toggleSidebar: () => void;
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ toggleSidebar }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const handleToggle = () => {
    toggleSidebar();
    setIsMobileOpen((prev) => !prev);
  };

  const getPageTitle = (path: string): string => {
    const routes: Record<string, string> = {
      '/company': 'Company',
      '/analytics': 'Analytics',
      '/invitation': 'Invitation',
      '/invoice': 'Invoice',
      '/schedule': 'Schedule',
      '/calendar/calendar': 'Calendar',
      '/calendar/tasks': 'My tasks',
      '/setting': 'Settings',
    };
    return routes[path] || 'Company';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-50 flex w-full border-l-[2px] border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-sm transition-colors duration-500">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:pr-6">
        <div className="flex w-full items-center gap-4 border-b border-gray-200 dark:border-gray-700 px-4 py-1 lg:border-b-0 lg:px-0 lg:py-1">
          {/* LEFT: Toggle + Title + Breadcrumb + Search (all in one row) */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Toggle */}
            <button
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              {isMobileOpen ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </button>

            {/* Title + Breadcrumb */}
            <div className="flex flex-col gap-0.5 leading-tight min-w-0 flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize m-0 truncate">
                {currentTitle}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors">
                  Home
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300 font-bold truncate">
                  {currentTitle}
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative ml-auto hidden lg:block w-full max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? 'flex' : 'hidden'
          } w-full items-center justify-between gap-5 border-t border-gray-200 dark:border-gray-700 px-5 py-1 bg-gray-50/50 dark:bg-gray-800/50 lg:flex lg:justify-end lg:border-t-0 lg:px-0 lg:bg-transparent lg:shadow-none`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown />
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
