/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserMenu from '@/components/UserMenu/UserMenu';
import NotificationDropdown from '@/components/Notification/NotificationDropDown';
import type { INotification } from '@/interfaces/Notification/Notification';
import { GetNotificationsByUser } from '@/services/notification.js';

export default function CompanyHeader() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const nav = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await GetNotificationsByUser();
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-300/60 bg-white/80 backdrop-blur-md px-3 py-1 flex items-center justify-between shadow-sm">
        {/* LEFT: Back + title */}
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            onClick={() => nav('/company')}
            aria-label="Back"
          >
            <ArrowLeft size={30} strokeWidth={2.2} />
          </button>

          <span className="font-semibold text-gray-700 text-lg tracking-tight">Home Page</span>
        </div>

        {/* CENTER: Search UI ONLY */}
        <div className="hidden md:block w-full max-w-md relative mx-4">
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
            className="pl-10 pr-16 py-2 w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            Enter
          </span>
        </div>

        {/* RIGHT: Notifications + UserMenu */}
        <div className="flex items-center gap-5 relative overflow-visible">
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown />
          </div>
          <UserMenu />
        </div>
      </header>
    </>
  );
}
