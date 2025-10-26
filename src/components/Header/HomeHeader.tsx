import { useState } from 'react';
import UserMenu from '../UserMenu/UserMenu';
import NotificationDropdown from '../Notification/NotificationDropDown';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
    <header className="sticky top-0 z-50 flex w-full border-b border-gray-300/60 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 sm:gap-4 lg:border-b-0 lg:px-0 lg:py-2">
          <div className="flex items-center gap-3">
            <button
              className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 dark:text-gray-400 lg:flex lg:h-11 lg:w-11 lg:border"
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
            >
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-700 capitalize">{currentTitle}</h1>
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? 'flex' : 'hidden'
          } w-full items-center justify-between gap-4 border-t border-gray-200 px-5 py-2 shadow-md lg:flex lg:justify-end lg:border-t-0 lg:px-0 lg:shadow-none`}
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
