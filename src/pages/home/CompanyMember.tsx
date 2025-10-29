/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Eye, Ban, UserPlus } from 'lucide-react';
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

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });

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

      <div className="px-5 py-5 font-inter bg-gray-50 min-h-screen">
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
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            Active: {statusCounts.Active}
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            Pending: {statusCounts.Pending}
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
            Inactive: {statusCounts.Inactive}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            Total: {pagination.totalCount}
          </span>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search name, email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:w-1/3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          {/* Filters: Date + Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Create Date:</span>
              <RangePicker
                className="border border-gray-200 rounded-lg px-2 py-1"
                format="DD/MM/YYYY"
                placeholder={['Date From', 'Date To']}
                value={dateRange}
                onChange={handleFilterByDate}
              />
            </div>

            {/* Status select */}
            <div className="flex items-center gap-2 text-sm">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>

              <span className="text-gray-500">{pagination.totalCount} results</span>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Member</th>
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
                    className="border-b text-center border-gray-100 hover:bg-blue-50/60 transition-all duration-150"
                  >
                    <td className="px-6 py-4 flex items-center gap-3 text-left">
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
                    <td className="px-6 py-4">Owner</td>
                    <td className="px-6 py-4 text-gray-600">{m.phone}</td>
                    <td className="px-6 py-4 text-gray-700">{m.gender}</td>
                    <td className="px-6 py-4">{getStatusBadge(m.status)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(m.joinedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <Eye
                        className="w-5 h-5 mx-auto text-gray-500 hover:text-blue-600 cursor-pointer transition-transform hover:scale-110"
                        onClick={() => navigate(`/company/members/${m.memberId}`)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-end mt-6">
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
