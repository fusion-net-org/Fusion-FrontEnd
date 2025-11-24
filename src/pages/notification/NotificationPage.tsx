/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  GetNotificationsByUser,
  MarkNotificationAsRead,
  DeleteNotification,
} from '@/services/notification.js';
import { Loader2, MoreVertical, Check, Settings } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import NotificationItem from '@/components/Notification/NotificationItem';
import { useFCMListener } from '@/hook/useFCM';
import { toast } from 'react-toastify';

dayjs.extend(relativeTime);

interface Notification {
  id: string;
  event: string;
  title: string;
  body: string;
  linkUrlWeb: string | null;
  isRead: boolean;
  createAt: string;
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await GetNotificationsByUser();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await DeleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.log(err);
    }
  };
  const handleMarkAsRead = async (id: string) => {
    try {
      await MarkNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((x) => !x.isRead);

    if (unread.length === 0) return;

    for (const item of unread) {
      await MarkNotificationAsRead(item.id);
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMenuOpen(false);
  };

  const handleNotificationClick = async (item: Notification) => {
    if (!item.isRead) await handleMarkAsRead(item.id);

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

  useFCMListener(() => {
    fetchNotifications();
  });

  const filtered = useMemo(() => {
    return activeTab === 'unread' ? notifications.filter((x) => !x.isRead) : notifications;
  }, [activeTab, notifications]);

  const visibleNotifications = filtered.slice(0, visibleCount);
  const handleLoadMore = () => setVisibleCount((prev) => prev + 5);

  const renderActionButtons = (event: string) => {
    if (event.includes('invite-group'))
      return (
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Join
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Delete
          </button>
        </div>
      );
    if (event.includes('invite-follow'))
      return (
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Accept
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Decline
          </button>
        </div>
      );
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-3">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between relative">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-gray-900">Notifications</h1>

            {/* Tabs inline next to title */}
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  activeTab === 'all'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  activeTab === 'unread'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={() => setActiveTab('unread')}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden z-20">
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  <Check className="w-4 h-4 mr-2 text-gray-500" />
                  Mark all as read
                </button>

                <button
                  onClick={() => toast('Go to notification settings')}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-500" />
                  Notification settings
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No notifications.</div>
        ) : (
          <>
            <div className="px-4 py-2 text-sm text-gray-900 font-medium">Previous</div>
            {visibleNotifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onMarkRead={handleMarkAsRead}
                onDelete={() => handleDelete(item.id)}
                onTurnOff={() => console.log('TurnOFF')}
              >
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-start gap-3 px-6 py-4 cursor-pointer transition ${
                    item.isRead ? 'hover:bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      <img
                        src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${item.title}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-gray-800 leading-snug">
                      <span className="font-semibold">{item.title}</span> {item.body}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1">
                      {dayjs(item.createAt).fromNow()}
                    </p>

                    {renderActionButtons(item.event)}
                  </div>

                  {!item.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>}
                </div>
              </NotificationItem>
            ))}

            {visibleCount < filtered.length && (
              <div className="border-t border-gray-200 py-3 flex justify-center bg-gray-50">
                <button
                  onClick={handleLoadMore}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  View previous notifications
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
