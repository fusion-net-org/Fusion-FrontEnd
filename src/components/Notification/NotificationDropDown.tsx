import React, { useState, useEffect } from 'react';
import { GetNotificationsByUser, MarkNotificationAsRead } from '@/services/notification.js';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChevronRight, X } from 'lucide-react';
dayjs.extend(relativeTime);

interface Notification {
  id: string;
  event: string;
  title: string;
  body: string;
  context: string;
  linkUrl: string | null;
  linkUrlWeb: string | null;
  isRead: boolean;
  createAt: string;
  readAt: string | null;
}

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { t } = useTranslation();

  const fetchNotifications = async () => {
    try {
      const res = await GetNotificationsByUser();
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    if (!item.isRead) {
      await MarkNotificationAsRead(item.id);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    }

    if (item.linkUrlWeb) {
      const baseUrl = window.location.origin;
      const url = item.linkUrlWeb.startsWith('http')
        ? item.linkUrlWeb
        : `${baseUrl}${item.linkUrlWeb}`;
      window.location.href = url;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleDropdown = async () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => setIsOpen(false);

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="relative inline-block">
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center h-11 w-11 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors"
      >
        {hasUnread && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-400">
            <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          </span>
        )}

        {/* Bell */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 21a2 2 0 0 1-4 0" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-200 shadow-xl bg-white p-3 z-50 ring-1 ring-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <h5 className="text-lg font-semibold text-gray-800">
              {t('settings.notification_title')}
            </h5>
            <button
              onClick={closeDropdown}
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <X />
            </button>
          </div>
          {/* Notification List */}
          <ul className="flex flex-col max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.map((item) => (
              <li
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all
              ${item.isRead ? 'bg-white hover:bg-gray-50' : 'bg-orange-50 hover:bg-orange-100'}
               `}
              >
                {/* Dot */}
                <span
                  className={`h-2 w-2 rounded-full mt-2
                ${item.isRead ? 'bg-gray-300' : 'bg-red-500 animate-pulse'}
               `}
                ></span>

                {/* Text */}
                <div className="flex-1 pr-3">
                  <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-gray-900">
                    {item.title}
                  </p>

                  <p className="text-xs text-gray-500">{item.body}</p>

                  <p className="text-[11px] text-gray-400 mt-1">{dayjs(item.createAt).fromNow()}</p>
                </div>

                {/* Action Arrow */}
                <div className="opacity-0 group-hover:opacity-100 transition">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </li>
            ))}
          </ul>
          {/* Footer */}
          <button
            onClick={closeDropdown}
            className="block w-full text-center text-sm font-medium mt-3 px-4 py-2 rounded-lg 
  border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
