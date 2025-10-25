import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserMenu from '@/components/UserMenu/UserMenu';
export default function CompanyHeader() {
  const nav = useNavigate();
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm transition-all duration-300">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => nav('/company')}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft size={30} strokeWidth={2.2} className="text-blue-600" />
        </button>

        <span className="font-semibold text-gray-700 text-lg tracking-tight">Home Page</span>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        {/* <button
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button> */}
        {/* User Info */}
        {/* <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
          <img
            src="https://i.ibb.co/pb0nYkB/avatar.png"
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover shadow-sm"
          />
          <span className="text-gray-800 text-sm font-medium">{userName}</span>
          <ChevronDown size={18} className="text-gray-400" />
        </div> */}

        <UserMenu />
      </div>
    </header>
  );
}
