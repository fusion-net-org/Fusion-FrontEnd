import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Bell } from 'lucide-react';
import UserMenu from '@/components/UserMenu/UserMenu';

export default function CompanyHeader({
  companyName = 'Company Name',
  userName = 'Nguyen Duy',
}: {
  companyName?: string;
  userName?: string;
}) {
  const nav = useNavigate();
  const goBack = () => nav(-1);

  return (
    <header className=" sticky top-0 z-50 w-full border-b border-gray-300/60 bg-white/80 backdrop-blur-md px-3 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <button
          className="p-1 rounded hover:bg-gray-100 transition"
          onClick={goBack}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" width="25" height="25" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#1e6fde"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Logo */}
        <img
          src="https://i.ibb.co/XzKJx7F/company-logo.png"
          alt="Company Logo"
          className="w-8 h-8 rounded-full object-cover"
        />

        {/* Company Name */}
        <span className="text-blue-600 font-medium text-sm hover:underline cursor-pointer">
          {companyName}
        </span>

        {/* Owner Badge */}
        <div className="flex items-center gap-1 border border-yellow-400 text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-full text-xs font-medium">
          <Crown size={14} strokeWidth={2} />
          <span>Owner</span>
        </div>
      </div>

      {/* RIGHT SIDE */}
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
  );
}
