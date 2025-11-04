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
      <header className="sticky top-0 z-50 w-full border-b border-gray-300/60 bg-white/80 backdrop-blur-md px-3 py-3 flex items-center justify-between shadow-sm">
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
