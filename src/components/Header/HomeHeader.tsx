/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import UserMenu from '../UserMenu/UserMenu';
import NotificationDropdown from '../Notification/NotificationDropDown';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type HomeHeaderProps = {
  toggleSidebar: () => void;
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ toggleSidebar }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const handleToggle = () => {
    toggleSidebar();
    setIsMobileOpen((prev) => !prev);
  };

  const getPageTitle = (path: string): string => {
    const routes: Record<string, string> = {
      '/company': t('menu_item.company'),
      '/analytics': t('menu_item.analytics'),
      '/invoice': t('menu_item.invoice'),
      '/schedule': t('menu_item.schedule'),
      '/calendar': t('menu_item.calendar'),
      '/setting': t('menu_item.setting'),
    };
    return routes[path] || t('menu_item.company');
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-50 flex w-full border-l-[2px] border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm transition-colors duration-500">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:pr-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2 sm:gap-4 lg:border-b-0 lg:px-0 lg:py-2">
          <div className="flex items-center">
            <button
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isMobileOpen ? (
                <ArrowRight className="w-6 h-6" />
              ) : (
                <ArrowLeft className="w-6 h-6" />
              )}
            </button>

            <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-100 capitalize ml-2">
              {currentTitle}
            </h1>
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? 'flex' : 'hidden'
          } w-full items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 px-5 py-2 shadow-md dark:shadow-none lg:flex lg:justify-end lg:border-t-0 lg:px-0`}
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
