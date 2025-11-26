/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import UserMenu from '../UserMenu/UserMenu';
import NotificationDropdown from '../Notification/NotificationDropDown';

type HomeHeaderProps = {
  toggleSidebar: () => void;
};

type SearchItem = {
  id: string;
  title: string;
  description: string;
  path: string;
  keywords: string[];
};

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'company',
    title: 'Go to Company overview',
    description: 'Main company page',
    path: '/company',
    keywords: ['company', 'companies'],
  },
  {
    id: 'analytics',
    title: 'Open Analytics',
    description: 'Reports & analytics',
    path: '/analytics',
    keywords: ['analytics', 'report'],
  },
  {
    id: 'invitation',
    title: 'Manage Invitations',
    description: 'Partner & member invitations',
    path: '/invitation',
    keywords: ['invitation', 'invite'],
  },
  {
    id: 'invoice',
    title: 'Open Invoices',
    description: 'Billing & payments',
    path: '/invoice',
    keywords: ['invoice', 'billing', 'payment', 'bill'],
  },
  {
    id: 'schedule',
    title: 'Open Schedule',
    description: 'Schedule overview',
    path: '/schedule',
    keywords: ['schedule', 'timeline', 'plan'],
  },
  {
    id: 'calendar',
    title: 'Go to Calendar',
    description: 'Calendar',
    path: '/calendar/calendar',
    keywords: ['calendar', 'event', 'meeting'],
  },
  {
    id: 'my-tasks',
    title: 'View My tasks',
    description: 'Personal task list & calendar',
    path: '/calendar/tasks',
    keywords: ['task', 'my tasks', 'personal', 'todo', 'tasks'],
  },
  {
    id: 'settings',
    title: 'Open Company Settings',
    description: 'Settings',
    path: '/setting',
    keywords: ['setting', 'settings', 'config', 'configuration'],
  },
];

const SUGGESTED_QUERIES = ['Open company settings', 'My tasks', 'Company'];

const HomeHeader: React.FC<HomeHeaderProps> = ({ toggleSidebar }) => {
  const [isApplicationMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement | null>(null);

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

  // Search
  const filterSearchItems = (query: string): SearchItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ITEMS;

    return SEARCH_ITEMS.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.description.toLowerCase().includes(q)) return true;
      if (item.path.toLowerCase().includes(q)) return true;
      if (item.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  };

  const filteredItems = useMemo(() => filterSearchItems(searchQuery), [searchQuery]);

  const handleNavigate = (path: string) => {
    setIsSearchOpen(false);
    navigate(path);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = filteredItems[0];
      if (first) {
        handleNavigate(first.path);
      }
    }
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-50 flex w-full border-l-[2px] border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-sm transition-colors duration-500">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:pr-6">
        <div className="flex w-full items-center gap-4 border-b border-gray-200 dark:border-gray-700 px-4 py-1 lg:border-b-0 lg:px-0 lg:py-1">
          {/* LEFT: Toggle + Title + Breadcrumb + Search */}
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
          </div>
        </div>

        {/* Search + dropdown */}
        <div className="relative ml-auto hidden lg:block w-full max-w-md" ref={searchRef}>
          {/* search */}
          <div className="flex items-center">
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
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search...."
              className="pl-10 pr-16 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              Enter
            </span>
          </div>

          {/* dropdown hint */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Try:{' '}
                  {SUGGESTED_QUERIES.map((q, idx) => (
                    <button
                      key={q}
                      type="button"
                      className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline"
                      onClick={() => {
                        setSearchQuery(q);
                      }}
                    >
                      {idx > 0 && ', '}
                      &quot;{q}&quot;
                    </button>
                  ))}
                </p>
                <span className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Enter to open first result
                </span>
              </div>

              {/* danh sách shortcut / trang */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className="text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 px-3 py-2 hover:border-blue-500 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Shortcut · {item.description}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-1 py-2 text-xs text-gray-500 dark:text-gray-400">
                  No results for &quot;{searchQuery}&quot;. Try another keyword.
                </div>
              )}
            </div>
          )}
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
