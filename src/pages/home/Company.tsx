/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import FormCreateCompany from '@/components/Company/CreateCompany';
import { getAllCompanies } from '@/services/companyService.js';
import type { CompanyResponse, CompanyRequest } from '@/interfaces/Company/company';
import CardCompany from '@/components/Company/CardCompany';
import EmptyState from '@/utils/EmptyState';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import LoadingOverlay from '@/common/LoadingOverlay';
import { Paging } from '@/components/Paging/Paging';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

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
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchCompanies = async (
    keyword = '',
    page = 1,
    pageSize = pagination.pageSize,
    dateRangeParam = dateRange,
  ) => {
    try {
      setLoading(true);
      const dayFrom = dateRangeParam?.[0] ? dateRangeParam[0].format('YYYY-MM-DD') : '';
      const dayTo = dateRangeParam?.[1] ? dateRangeParam[1].format('YYYY-MM-DD') : '';
      const res = await getAllCompanies(
        keyword.trim(),
        '',
        filterRelationship === 'All' ? '' : filterRelationship,
        dayFrom,
        dayTo,
        page,
        pageSize,
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
    <div className="p-1 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center"></div>
      <div className="p-1 space-y-3">
        <div className="flex flex-wrap items-stretch justify-between gap-4">
          {/* Search */}
          <div className="flex flex-col flex-1 min-w-[250px]">
            <span className="text-gray-600 text-sm font-semibold mb-1">Search</span>
            <div className="relative w-full h-9">
              <Search
                className="absolute left-3 top-1.5 text-gray-400 w-4.5 h-4.5 cursor-pointer"
                onClick={() => fetchCompanies(searchTerm, 1)}
              />
              <input
                type="text"
                placeholder="Input search companies..."
                className="pl-10 pr-4 h-9 rounded-full border border-gray-400 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex flex-col w-[250px]">
            <span className="text-gray-600 text-sm font-semibold mb-1">Date Range</span>
            <DatePicker.RangePicker
              className="w-full h-9 text-sm"
              style={{ height: '2.25rem', width: '100%' }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                fetchCompanies(
                  searchTerm,
                  1,
                  pagination.pageSize,
                  dates as [dayjs.Dayjs, dayjs.Dayjs],
                );
              }}
              format="DD/MM/YYYY"
              allowClear
              placeholder={['From', 'To']}
            />
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm font-semibold mb-1">Sort by</span>
            <div className="flex items-stretch gap-2 h-9">
              <div className="relative h-9">
                <select
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={sortColumn}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="createAt">Created At</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => handleSortChange(sortColumn, !sortDescending)}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition h-9"
              >
                {sortDescending ? (
                  <>
                    <ArrowDown className="w-4.5 h-4.5 text-gray-600 mb-0.5" />
                    <span>Des</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4.5 h-4.5 text-gray-600 mb-0.5" />
                    <span>Asc</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create Company */}
          <div className="flex items-end">
            <FormCreateCompany onCreated={fetchCompanies} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            {['All', 'Owner', 'Member'].map((relation) => (
              <button
                key={relation}
                onClick={() => handleFilterRelationship(relation)}
                className={`
    relative px-5 py-1.5 rounded-full text-sm font-medium transition-all
    ${
      filterRelationship === relation
        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-300/30'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  `}
              >
                {relation}
              </button>
            ))}
          </div>
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

          {/* //paging */}
          <Paging
            page={currentPage}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchCompanies(searchTerm, page);
            }}
            onPageSizeChange={(size) => {
              setPagination((prev) => ({ ...prev, pageSize: size }));
              fetchCompanies(searchTerm, 1, size);
            }}
          />
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
