/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Search, Users, Folder, ChevronDown, Bell, SlidersHorizontal } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import FormCreateCompany from '@/components/Company/CreateCompany';
import { getPagedCompanies } from '@/services/companyService.js';
import type { CompanyResponse, Company } from '@/interfaces/Company/company';
import CardCompany from '@/components/Company/CardCompany';

const Company: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<
    Pick<CompanyResponse, 'pageNumber' | 'pageSize' | 'totalCount'>
  >({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await getPagedCompanies();
        const data: CompanyResponse = res.data;

        console.log('Response', data);

        setCompanies(data.items);
        setPagination({
          pageNumber: data.pageNumber,
          pageSize: data.pageSize,
          totalCount: data.totalCount,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Error', error.message);
      }
    };

    fetchCompanies();
  }, []);
  return (
    <div className="p-1 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Input search"
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 w-[600px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* avatar */}
        <div className="flex items-center gap-4 mr-2">
          {/* Notification icon */}
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-600 hover:text-blue-600 transition" />
            <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <div className="text-sm">
              <p className="font-medium text-gray-800">Nguyen Tuong</p>
              <p className="text-gray-500 text-xs">Admin</p>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-600 mb-3" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Company</h2>
          <p className="text-gray-500 text-sm">
            Manage all companies you belong to and their settings.
          </p>
        </div>
        {/* Button Create Company */}
        <div>
          <FormCreateCompany />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Relationship filter */}
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-500">Relationship:</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition">
              All
            </button>
            <button className="px-3 py-1.5 border border-blue-500 rounded-lg text-sm text-white bg-blue-500 font-medium shadow-sm hover:bg-blue-600 transition">
              Owner
            </button>
            <button className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition">
              Member
            </button>
          </div>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-500">Role:</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-orange-200 rounded-lg text-sm text-orange-500 hover:bg-orange-100 transition">
              Product Manager
            </button>
            <button className="px-3 py-1.5 border border-orange-500 rounded-lg text-sm text-white bg-orange-500 font-medium shadow-sm hover:bg-orange-600 transition">
              Team Lead
            </button>
            <button className="px-3 py-1.5 border border-orange-200 rounded-lg text-sm text-orange-500 hover:bg-orange-100 transition">
              Dev
            </button>
          </div>
        </div>

        {/* Sort filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          <span className="text-gray-500 font-medium text-sm">Sort by:</span>
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              defaultValue="A-Z"
            >
              <option value="A-Z">A - Z</option>
              <option value="Z-A">Z - A</option>
              <option value="Newest">Newest</option>
              <option value="Oldest">Oldest</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Company Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {companies.map((company: Company) => (
          <CardCompany key={company.id} company={company} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-6 pr-2">
        <Stack spacing={2}>
          <Pagination
            count={Math.ceil(pagination.totalCount / pagination.pageSize)}
            color="primary"
            variant="outlined"
            shape="rounded"
            size="medium"
            showFirstButton
            showLastButton
          />
        </Stack>
      </div>
    </div>
  );
};

export default Company;
