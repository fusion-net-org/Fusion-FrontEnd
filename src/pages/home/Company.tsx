/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Bell, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import FormCreateCompany from '@/components/Company/CreateCompany';
import {
  getPagedCompanies,
  searchCompanies,
  filterAndSortCompanies,
} from '@/services/companyService.js';
import type { CompanyResponse, Company } from '@/interfaces/Company/company';
import CardCompany from '@/components/Company/CardCompany';
import EmptyState from '@/utils/EmptyState';

const Company: React.FC = () => {
  //useState get all companies
  const [companies, setCompanies] = useState<Company[]>([]);
  //useState search
  const [searchTerm, setSearchTerm] = useState('');
  //useState pagination
  const [pagination, setPagination] = useState<
    Pick<CompanyResponse, 'pageNumber' | 'pageSize' | 'totalCount'>
  >({
    pageNumber: 1,
    pageSize: 8,
    totalCount: 0,
  });
  //use state filter sort
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDescending, setSortDescending] = useState(false);

  // Current page state
  const [currentPage, setCurrentPage] = useState(1);

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchCompanies(value);
  };
  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCompanies();
      return;
    }
    try {
      const res = await searchCompanies(searchTerm);
      const data: CompanyResponse = res.data;
      setCompanies(data.items);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
    } catch (error: any) {
      console.error('Error searching:', error.message);
    }
  };

  // Handle enter key for search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  //handing sort change
  const handleSortChange = async (column: string, descending = sortDescending) => {
    setSortColumn(column);
    setSortDescending(descending);

    try {
      const res = await filterAndSortCompanies(
        column,
        descending,
        currentPage,
        pagination.pageSize,
      );
      const data: CompanyResponse = res.data || res;

      if (!data || !data.items) return;

      setCompanies(data.items);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
    } catch (error: any) {
      console.error('Error sorting companies:', error.message);
    }
  };

  //fetch all companies
  const fetchCompanies = async (page = 1) => {
    try {
      const res = await getPagedCompanies(page, pagination.pageSize);
      const data: CompanyResponse = res.data;
      setCompanies(data.items);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
      setCurrentPage(data.pageNumber);
    } catch (error: any) {
      console.error('Error', error.message);
    }
  };

  //useEffect get all companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="p-1 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400 w-5 h-5 cursor-pointer"
              onClick={handleSearch}
            />
            <input
              type="text"
              placeholder="Input search companies...."
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 w-[600px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
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
              src={
                sessionStorage.getItem('avatar') || 'https://randomuser.me/api/portraits/men/32.jpg'
              }
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
          <FormCreateCompany onCreated={fetchCompanies} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Relationship filter */}
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-500">Relationship:</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition cursor-pointer">
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
              value={sortColumn}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="createAt">Created At</option>
              <option value="totalMember">Total Members</option>
              <option value="totalProject">Total Projects</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Nút đổi hướng tăng/giảm */}
          <button
            onClick={() => handleSortChange(sortColumn, !sortDescending)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            {sortDescending ? (
              <>
                <ArrowDown className="w-5 h-5 text-gray-600 mb-0.5" />
                <span>Des</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-5 h-5 text-gray-600 mb-0.5" />
                <span>Asc</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty / List */}
      {companies.length === 0 ? (
        <EmptyState
          title="DON'T HAVE ANY COMPANY"
          primaryAction={<FormCreateCompany />}
          imageSize="xl"
          titlePlacement="over"
          overlayStyle={{ top: '30%' }}
        />
      ) : (
        <>
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
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                variant="outlined"
                shape="rounded"
                size="medium"
                showFirstButton
                showLastButton
              />
            </Stack>
          </div>
        </>
      )}
    </div>
  );
};

export default Company;
