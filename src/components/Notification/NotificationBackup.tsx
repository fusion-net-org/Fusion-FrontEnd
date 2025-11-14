import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GetNotificationsByUser, MarkNotificationAsRead } from '@/services/notification.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MoreVertical, Check, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from '@/components/Notification/NotificationItem';

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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredNotifications = useMemo(
    () => (onlyUnread ? notifications.filter((x) => !x.isRead) : notifications),
    [onlyUnread, notifications],
  );

  const hasUnread = notifications.some((n) => !n.isRead);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    setIsActionOpen(false);
  };

  // mark all
  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const item of unread) {
      await MarkNotificationAsRead(item.id);
    }
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setIsActionOpen(false);
  };

  // click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }

      if (actionRef.current && !actionRef.current.contains(target)) {
        setIsActionOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center h-11 w-11 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors -mr-[18px]"
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
        <div className="absolute right-0 mt-3 w-[380px] rounded-2xl border border-gray-200 shadow-2xl bg-white p-4 z-50 ring-1 ring-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-3 border-b border-gray-100">
            <h5 className="text-xl font-semibold text-gray-900">Notifications</h5>

            <button
              onClick={() => setIsActionOpen((prev) => !prev)}
              className="text-gray-500 hover:text-gray-700"
            >
              <MoreVertical size={20} />
            </button>

            {isActionOpen && (
              <div
                ref={actionRef}
                className="absolute right-4 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50"
              >
                <button
                  onClick={markAllAsRead}
                  className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 text-gray-800"
                >
                  <Check className="w-4 h-4 mr-2 text-gray-500" />
                  Mark all as read
                </button>

                <button
                  onClick={() => navigate('/settings/notifications')}
                  className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 text-gray-800"
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-500" />
                  Notification settings
                </button>
              </div>
            )}
          </div>

          {/* Toggle unread */}
          <div className="flex items-center justify-end gap-2 mb-2 text-sm text-gray-600">
            <span>Only unread</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={onlyUnread}
                onChange={() => setOnlyUnread(!onlyUnread)}
              />
              <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all"></div>
            </label>
          </div>

          {/* List */}
          {filteredNotifications.length > 0 ? (
            <ul className="flex flex-col max-h-96 overflow-y-auto custom-scrollbar ">
              {filteredNotifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onMarkRead={() => handleNotificationClick(item)}
                  onDelete={() => console.log('Delete')}
                  onTurnOff={() => console.log('Turn Off')}
                >
                  <div
                    onClick={() => handleNotificationClick(item)}
                    className="flex items-start gap-3 rounded-lg cursor-pointer px-0 py-0 "
                  >
                    {/* Unread dot */}
                    <span
                      className={`h-2 w-2 rounded-full mt-2 ${
                        item.isRead ? 'bg-gray-300' : 'bg-red-500 animate-pulse'
                      }`}
                    ></span>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[13px] text-gray-600 mt-1 leading-snug">{item.body}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {dayjs(item.createAt).fromNow()}
                      </p>
                    </div>
                  </div>
                </NotificationItem>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center text-gray-500 text-sm">
              <p>No unread notifications</p>
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/notifications');
            }}
            className="block w-full text-center text-sm font-medium mt-4 px-4 py-2 rounded-lg 
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
