/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Eye, Ban, UserPlus, Search } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import LoadingOverlay from '@/common/LoadingOverlay';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GetMemberByCompanyId,
  GetSummaryStatusMemberByCompanyId,
  GetMembersByStatus,
} from '@/services/companyMemberService.js';
import type { CompanyMemberInterface, CompanyMemberResponse } from '@/interfaces/Company/member';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import InviteMember from '@/components/Member/InviteMember';
import { Paging } from '@/components/Paging/Paging';
const CompanyMember: React.FC = () => {
  //#region state
  const navigate = useNavigate();
  const { RangePicker } = DatePicker;
  const { companyId } = useParams();
  const [members, setMembers] = useState<CompanyMemberInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [statusCounts, setStatusCounts] = useState({
    Active: 0,
    Pending: 0,
    Inactive: 0,
  });
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  console.log(members);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });
  console.log('members:', members);
  const isMinDate = (dateString: string) => {
    return dateString === '0001-01-01T00:00:00' || dateString.startsWith('0001');
  };

  const renderJoinedAt = (joinedAt: string | null) => {
    if (!joinedAt || isMinDate(joinedAt)) return '---';
    return new Date(joinedAt).toLocaleDateString('en-GB');
  };
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Inactive: 'bg-red-100 text-red-700',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status}
      </span>
    );
  };
  //#endregion

  //#region  handle
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handlePageChange = (_: any, value: number) => {
    setCurrentPage(value);
    fetchMembers(searchTerm, value);
  };

  const handleFilterByDate = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates) {
      fetchMembers(searchTerm, 1);
      setDateRange([null, null]);
      return;
    }

    const [start, end] = dates;
    setDateRange(dates);

    const from = start ? start.format('YYYY-MM-DD') : undefined;
    const to = end ? end.format('YYYY-MM-DD') : undefined;

    fetchMembers(searchTerm, 1, from, to);
  };

  //#endregion

  //#region  fetch
  const fetchMembers = useCallback(
    async (search = '', page = 1, from?: string, to?: string) => {
      if (!companyId) return;
      try {
        setLoading(true);
        const response: CompanyMemberResponse = await GetMemberByCompanyId(
          companyId,
          search,
          from,
          to,
          page,
          pagination.pageSize,
        );
        setMembers(response.items || []);
        setPagination({
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
        });
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    },
    [companyId, pagination.pageSize],
  );

  const fetchSummaryStatusByCompanyId = useCallback(async () => {
    if (!companyId) return;

    try {
      const response = await GetSummaryStatusMemberByCompanyId(companyId);
      const data = response.data;

      setStatusCounts({
        Active: data.Active || 0,
        Inactive: data.Inactive || 0,
        Pending: data.Pending || 0,
      });
    } catch (error) {
      console.error('Error fetching summary status:', error);
    }
  }, [companyId]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchMembers(value, 1);
    }, 600),
    [fetchMembers],
  );

  //#region fetch by status
  const fetchMembersByStatus = useCallback(
    async (status: string) => {
      if (!companyId) return;

      try {
        setLoading(true);

        if (status === 'All') {
          await fetchMembers(
            searchTerm,
            1,
            dateRange[0]?.format('YYYY-MM-DD'),
            dateRange[1]?.format('YYYY-MM-DD'),
          );
        } else {
          const response = await GetMembersByStatus(companyId, status);
          setMembers(response.data || []);
          setPagination((prev) => ({
            ...prev,
            totalCount: response.data?.length || 0,
            pageNumber: 1,
          }));
        }
      } catch (error) {
        console.error('Error fetching members by status:', error);
      } finally {
        setLoading(false);
      }
    },
    [companyId, fetchMembers, searchTerm, dateRange],
  );
  //#endregion

  //#region handle status change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    fetchMembersByStatus(value);
  };
  //#endregion

  useEffect(() => {
    fetchMembers('', 1);
    fetchSummaryStatusByCompanyId();
  }, [fetchMembers, fetchSummaryStatusByCompanyId]);
  //#endregion
  return (
    <>
      <LoadingOverlay loading={loading} message="Loading members..." />

      <div className="px-5 py-5 font-inter min-h-screen">
        {/* HEADER */}

        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 rounded-2xl p-6 mb-8 text-white shadow-lg border border-blue-300/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Members</h1>
              <p className="text-blue-100 text-sm">Manage and monitor company members</p>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition text-sm"
            >
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          </div>
        </div>
        {/* STATUS SUMMARY */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-4 py-1.5 bg-green-200 text-green-700 text-sm font-medium rounded-full">
            Active: {statusCounts.Active}
          </span>
          <span className="px-4 py-1.5 bg-yellow-200 text-yellow-700 text-sm font-medium rounded-full">
            Pending: {statusCounts.Pending}
          </span>
          <span className="px-4 py-1.5 bg-red-200 text-red-700 text-sm font-medium rounded-full">
            Inactive: {statusCounts.Inactive}
          </span>
          <span className="px-4 py-1.5 bg-blue-200 text-blue-700 text-sm font-medium rounded-full">
            Total: {pagination.totalCount}
          </span>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-start justify-between gap-4 py-3 rounded-xl mb-4">
          {/* Search Input */}
          <div className="flex flex-col w-full sm:w-1/3 relative">
            <label className="font-semibold text-sm text-gray-600 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Name, email, phone..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Filters: Date + Status */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
            {/* Date Range */}
            <div className="flex flex-col">
              <label className="font-semibold text-sm text-gray-600 mb-1">Joined Date </label>
              <RangePicker
                format="DD/MM/YYYY"
                className="rounded-lg border border-gray-300 !h-[37.6px]"
                placeholder={['Date From', 'Date To']}
                value={dateRange}
                onChange={handleFilterByDate}
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="font-semibold text-sm text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Result Count */}
            <div className="font-semibold text-sm text-gray-500 flex items-center h-[37.6px] mt-6 sm:mt-0">
              {pagination.totalCount} results
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-center w-[15%]">Member</th>
                <th className="px-6 py-3 text-center">Role</th>
                <th className="px-6 py-3 text-center">Phone</th>
                <th className="px-6 py-3 text-center">Gender</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Joined Date</th>
                <th className="px-6 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Ban className="w-6 h-6 text-gray-400" />
                      {searchTerm ? `No results found for "${searchTerm}".` : 'No members found.'}
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <tr
                    key={i}
                    className={`border-b text-center border-gray-100 hover:bg-blue-50/60 transition-all duration-150 ${
                      m.status === 'Active' ? 'cursor-pointer' : 'cursor-not-allowed text-gray-300'
                    }`}
                  >
                    <td className="px-4 py-4 flex items-center gap-3 text-left">
                      <img
                        src={m.memberAvatar || 'https://via.placeholder.com/48?text=U'}
                        alt={m.memberName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{m.memberName}</p>
                        <p className="text-gray-500 text-xs">{m.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[180px] cursor-pointer" title={m.roleName}>
                      {m.roleName}
                    </td>{' '}
                    <td className="px-6 py-4 text-gray-600">{m.phone}</td>
                    <td className="px-6 py-4 text-gray-700">{m.gender}</td>
                    <td className="px-6 py-4">{getStatusBadge(m.status)}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {renderJoinedAt(m.joinedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Eye
                        className={`w-5 h-5 mx-auto transition-transform hover:scale-110 ${
                          m.status === 'Active'
                            ? 'text-gray-500 hover:text-blue-600 cursor-pointer'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (m.status === 'Active') {
                            navigate(`/company/${companyId}/members/${m.memberId}`, {
                              state: { companyId },
                            });
                          }
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="w-full mt-6">
          <Paging
            page={pagination.pageNumber}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchMembers(searchTerm, page);
            }}
            onPageSizeChange={(size) => {
              setPagination((prev) => ({ ...prev, pageSize: size }));
              fetchMembers(searchTerm, 1);
            }}
          />
        </div>
      </div>
      <InviteMember
        companyId={companyId!}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteSuccess={() => fetchMembers(searchTerm, currentPage)}
      />
    </>
  );
};

export default CompanyMember;
