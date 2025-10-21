/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Phone, Globe, MapPin, Edit, Trash2 } from 'lucide-react';
import type { CompanyRequest } from '@/interfaces/Company/company';
import { getCompanyById } from '@/services/companyService.js';
import { getOwnerUser } from '@/services/userService.js';
import type { User } from '@/interfaces/User/User';
const CompanyDetails: React.FC = () => {
  const [company, setCompany] = useState<CompanyRequest>();
  const [infoUser, setInfoUser] = useState<User>();
  const { companyId } = useParams<{ companyId: string }>();
  const companyV2 = {
    status: 'Active',
    phone: '+84 89 77 56 52',
    website: 'fuision@gmail.com',
    address: '143 Nguyen Dinh Chieu, Da Kao Ward, D.1, HCMC',
    stats: {
      total: 5,
      submitted: 1,
      review: 3,
      approved: 1,
    },
  };
  //call api
  const fetchGetCompanyById = async () => {
    try {
      const response = await getCompanyById(companyId);
      const data: CompanyRequest = response.data;
      setCompany(data);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const fetchGetInfoUserByCompanyId = async () => {
    try {
      const response = await getOwnerUser(companyId);
      const data: User = response.data;
      setInfoUser(data);
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchGetCompanyById();
    fetchGetInfoUserByCompanyId();
  }, []);
  return (
    <div className="min-h-screen font-sans pb-10">
      {/* Banner */}
      <div
        className="relative h-64 w-full bg-cover bg-center rounded-b-3xl shadow-sm"
        style={{ backgroundImage: `url(${company?.avatarCompany})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative -mt-5 px-8 flex flex-col sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Avatar + Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
          <img
            src={company?.imageCompany}
            alt="avatar"
            className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
          />
          <div className="mt-4 sm:mt-0">
            <h1 className="text-3xl font-bold text-gray-800">{company?.name}</h1>

            <p className="text-gray-500">
              Code: <span className="font-medium">{company?.taxCode}</span> — Since{' '}
              {company?.createAt && new Date(company.createAt).toLocaleDateString('vi-VN')}
            </p>

            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full mt-2">
              Owner
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="sm:mt-0 flex items-center gap-2">
          <button className="mt-[35px] flex items-center gap-1 px-3 py-1.5 text-sm bg-red-200 text-red-600 hover:bg-red-100 rounded-md transition">
            <Trash2 className="w-4 h-4" />
            Inactive Company
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview */}
        <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Overview</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition">
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Description</p>
            <p className="font-medium text-gray-800">{company?.detail}</p>

            <p className="text-gray-500 text-sm mt-4">Company Name</p>
            <p className="font-medium text-gray-800">{company?.name}</p>

            <p className="text-gray-500 text-sm mt-4">ID Company</p>
            <p className="font-medium text-gray-800">{company?.id}</p>

            <p className="text-gray-500 text-sm mt-4">Owner Name</p>
            <div className="flex items-center space-x-2">
              <img
                src={infoUser?.avatar}
                alt="Owner Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              />
              <span className="font-medium text-gray-800">{infoUser?.userName}</span>
              <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                {companyV2.status}
              </span>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Image Company</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition">
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div className="flex flex-col items-center">
              <p className="text-gray-500 text-sm mb-2 self-start">Banner</p>
              <img
                src={company?.imageCompany}
                className="rounded-xl w-full h-44 object-cover border shadow-sm"
                alt="banner"
              />
            </div>

            <div className="flex flex-col items-center">
              <p className="text-gray-500 text-sm mb-2 self-start">Avatar</p>
              <img
                src={company?.avatarCompany}
                className="rounded-xl w-full h-44 object-contain border shadow-sm"
                alt="avatar"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition">
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{company?.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{companyV2.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Globe className="w-4 h-4 text-gray-400" />
              <span>{companyV2.website}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{companyV2.address}</span>
            </div>
          </div>
        </div>

        {/* Projects Info */}
        <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6">
          <h2 className="text-lg font-semibold mb-4">Projects Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Member', value: companyV2.stats.total },
              { label: 'Total Project', value: companyV2.stats.submitted },
              { label: 'Total Partner', value: companyV2.stats.review },
              { label: 'Approved', value: companyV2.stats.approved },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 text-center transition"
              >
                <p className="text-gray-500 text-sm">{item.label}</p>
                <p className="text-2xl font-bold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
