import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import UserMenu from '@/components/UserMenu/UserMenu';

export default function CompanyHeader() {
  const nav = useNavigate();

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

        <div className="flex items-center gap-2 relative overflow-visible">
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <UserMenu />
        </div>
      </header>
    </>
  );
}
