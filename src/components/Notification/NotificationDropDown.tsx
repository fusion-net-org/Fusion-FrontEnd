import React, { useState } from 'react';
import userImg from '../../assets/user/male_user.png';

interface Notification {
  id: number;
  name: string;
  message: string;
  project: string;
  time: string;
  image: string;
  status: 'success' | 'error';
}

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const notifications: Notification[] = [
    {
      id: 1,
      name: 'KienMinh',
      message: 'requests permission to change',
      project: 'Project - Fusion App',
      time: '5 min ago',
      image: userImg,
      status: 'success',
    },
    {
      id: 2,
      name: 'CongBang',
      message: 'requested an update for',
      project: 'Project - Dashboard UI',
      time: '8 min ago',
      image: userImg,
      status: 'error',
    },
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setNotifying(false);
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center h-11 w-11 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors"
      >
        {notifying && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex w-full h-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
          </span>
        )}
        {/* Bell icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM8 17.7085C8 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8 17.2943 8 17.7085Z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-200 bg-white shadow-lg p-3 z-50">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <h5 className="text-lg font-semibold text-gray-800">Notifications</h5>
            <button
              onClick={closeDropdown}
              className="text-gray-400 hover:text-gray-700 transition"
            >
              ✕
            </button>
          </div>

          {/* Notification List */}
          <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {notifications.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                {/* Avatar */}
                <div className="relative w-10 h-10">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      item.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></span>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{item.name}</span> {item.message}{' '}
                    <span className="font-medium text-gray-900">{item.project}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <button
            onClick={closeDropdown}
            className="block w-full text-center text-sm font-medium mt-3 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
