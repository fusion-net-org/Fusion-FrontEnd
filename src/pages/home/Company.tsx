/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Bell, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import FormCreateCompany from '@/components/Company/CreateCompany';
import { getAllCompanies } from '@/services/companyService.js';
import type { CompanyResponse, CompanyRequest } from '@/interfaces/Company/company';
import CardCompany from '@/components/Company/CardCompany';
import EmptyState from '@/utils/EmptyState';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import LoadingOverlay from '@/common/LoadingOverlay';

const Company: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<
    Pick<CompanyResponse, 'pageNumber' | 'pageSize' | 'totalCount'>
  >({
    pageNumber: 1,
    pageSize: 8,
    totalCount: 0,
  });
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDescending, setSortDescending] = useState(false);
  const [filterRelationship, setFilterRelationship] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCompanies = async (keyword = '', page = 1) => {
    try {
      setLoading(true);
      const res = await getAllCompanies(
        keyword.trim(),
        '',
        filterRelationship === 'All' ? '' : filterRelationship,
        page,
        pagination.pageSize,
        sortColumn,
        sortDescending,
      );
      const data: CompanyResponse = res.data;
      setCompanies(data.items);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
      setCurrentPage(data.pageNumber);
    } catch (error: any) {
      console.error('Error fetching companies:', error.message);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchCompanies(value, 1);
    }, 300),
    [filterRelationship, sortColumn, sortDescending, pagination.pageSize],
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return debouncedSearch.cancel;
  }, [searchTerm, debouncedSearch]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchCompanies(searchTerm, value);
  };

  const handleSortChange = async (column: string, descending = sortDescending) => {
    setSortColumn(column);
    setSortDescending(descending);
    fetchCompanies(searchTerm, 1);
  };

  const handleFilterRelationship = async (relation: string) => {
    setFilterRelationship(relation);
    fetchCompanies(searchTerm, 1);
  };

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
              onClick={() => fetchCompanies(searchTerm, 1)}
            />
            <input
              type="text"
              placeholder="Input search companies..."
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 w-[600px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mr-2">
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Company</h2>
          <p className="text-gray-500 text-sm">
            Manage all companies you belong to and their settings.
          </p>
        </div>
        <div>
          <FormCreateCompany onCreated={fetchCompanies} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="font-medium text-gray-500">Relationship:</p>
          <div className="flex gap-2">
            {['All', 'Owner', 'Member'].map((relation) => (
              <button
                key={relation}
                onClick={() => handleFilterRelationship(relation)}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition ${
                  filterRelationship === relation
                    ? 'border-blue-500 text-white bg-blue-500 shadow-sm hover:bg-blue-600'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {relation}
              </button>
            ))}
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
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Nút đổi hướng */}
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
          <div className="flex flex-wrap gap-6">
            {companies.map((company) => (
              <div key={company.id} className="w-[280px]">
                <CardCompany company={company} onClick={() => navigate(`/company/${company.id}`)} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-end mt-6 pr-3">
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
      {loading && (
        <div className="relative min-h-screen">
          <LoadingOverlay loading={loading} message="loading companies..." />
        </div>
      )}
    </div>
  );
};

export default Company;
