// src/components/Company/CardCompany.tsx
import React from 'react';
import { Users, Folder } from 'lucide-react';
import type { Company } from '../../interfaces/Company/company';

interface CardCompanyProps {
  company: Company;
}

const CardCompany: React.FC<CardCompanyProps> = ({ company }) => {
  return (
    <div
      key={company.id}
      className="font-inter border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white flex flex-col h-full"
    >
      <img src={company.imageCompany} alt="cover" className="w-full h-32 object-cover" />

      <div className="p-4 flex flex-col justify-between flex-1">
        {/* Nội dung chính */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={company.avatarCompany}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div>
              <h3 className="font-semibold text-gray-800 line-clamp-2">{company.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{company.detail}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Create Date: {new Date(company.createAt).toLocaleDateString('vi-VN')}
          </span>
          <div className="flex justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 mb-0.5" /> {company.totalMember} Members
            </span>
            <span className="flex items-center gap-1">
              <Folder className="w-4 h-4 mb-0.5" /> {company.totalProject} Projects
            </span>
          </div>

          <div className="flex gap-2 text-sm text-gray-600">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="owner avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <div className="flex flex-col">
              <span className="font-medium text-xs">Owner</span>
              <span className="font-semibold">{company.ownerUserName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardCompany;
