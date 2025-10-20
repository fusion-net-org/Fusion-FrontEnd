/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Check, X, Ban } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import InvitePartners from '@/components/Partner/InvitePartner';
import {
  GetCompanyPartners,
  GetStatusSumaryPartners,
  SearchPartners,
  FilterPartners,
  CancelInvitePartner,
  AcceptInvitePartnert,
} from '@/services/partnerService.js';
import { getCompanyById } from '@/services/companyService.js';
import type { PartnerResponse, SummaryStatusPartner } from '@/interfaces/Partner/partner';
import type { CompanyRequest } from '@/interfaces/Company/company';
import { DatePicker } from 'antd';
import { getUserIdFromToken } from '@/utils/token';
import { toast } from 'react-toastify';

const { RangePicker } = DatePicker;

const userIdFromLogin = getUserIdFromToken();

const Partners: React.FC = () => {
  //#region State

  //state partner
  const [partners, setPartners] = useState<any[]>([]);
  //state pagination
  const [pagination, setPagination] = useState<
    Pick<PartnerResponse, 'pageNumber' | 'pageSize' | 'totalCount'>
  >({
    pageNumber: 1,
    pageSize: 8,
    totalCount: 0,
  });
  //state current page
  const [currentPage, setCurrentPage] = useState(1);
  //state open invite popup
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  //state summary status partners
  const [summaryStatusPartner, setSummaryStatusPartner] = useState<SummaryStatusPartner>();
  //state search
  const [searchTerm, setSearchTerm] = useState('');
  //state filter status
  const [filterStatus, setFilterStatus] = useState('');
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-400';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-400';
      case 'Inactive':
        return 'bg-red-100 text-red-700 border-red-400';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  //#endregion

  //#region  handle
  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchPartners(value);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPartners();
      return;
    }
    try {
      const res = await SearchPartners(searchTerm);
      const data: PartnerResponse = res.data;
      const enrichedPartners = await enrichPartnerInfo(data.items);
      setPartners(enrichedPartners);
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
  // Handle filter status partner
  const handleFilterStatus = async (status: string) => {
    try {
      if (!status || status === 'All') {
        fetchPartners();
        return;
      }

      const res = await FilterPartners(status);
      const data: PartnerResponse = res.data;
      const enrichedPartners = await enrichPartnerInfo(data.items);

      setPartners(enrichedPartners);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
    } catch (error: any) {
      console.error('Error filter:', error.message);
    }
  };
  // handle filter by date
  const handleFilterByDate = async (startDate: any, endDate: any) => {
    try {
      if (!startDate || !endDate) {
        fetchPartners();
        return;
      }

      const from = startDate.format('YYYY-MM-DD');
      const to = endDate.format('YYYY-MM-DD');

      const res = await GetCompanyPartners(from, to);
      const data: PartnerResponse = res.data;
      const enrichedPartners = await enrichPartnerInfo(data.items);
      setPartners(enrichedPartners);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
    } catch (error: any) {
      console.error('Error filtering by date:', error.message);
    }
  };
  //handle accept
  const handleAccept = async (id: number) => {
    try {
      const res = await AcceptInvitePartnert(id);
      console.log(res);
      toast.success(res.data.message || 'Accepted successfully!');
      fetchPartners(currentPage);
    } catch (error: any) {
      toast.error(error.data.message || 'Failed to accept!');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await CancelInvitePartner(id);
      toast.info(res.data.message || 'Invite rejected!');
      fetchPartners(currentPage);
    } catch (error: any) {
      toast.error(error.data.message || 'Failed to reject!');
    }
  };
  const handleInviteSuccess = async () => {
    await fetchPartners(currentPage);
    await fetchSummaryStatusPartners();
  };
  //#endregion;

  //#region Call API
  //promise partners with compani
  const enrichPartnerInfo = async (partners: any[]) => {
    return Promise.all(
      partners.map(async (p) => {
        try {
          const targetCompanyId = userIdFromLogin === p.requesterId ? p.companyBId : p.companyAId;

          const companyRes = await getCompanyById(targetCompanyId);
          const company: CompanyRequest = companyRes.data;
          return { ...p, companyInfo: company };
        } catch {
          return { ...p, companyInfo: null };
        }
      }),
    );
  };
  //call api to get partners data
  const fetchPartners = async (pageNumber = 1) => {
    try {
      const response = await GetCompanyPartners(
        null,
        null,
        pageNumber,
        pagination.pageSize,
        null,
        null,
      );
      const data: PartnerResponse = response.data;
      const enrichedPartners = await enrichPartnerInfo(data.items);
      setPartners(enrichedPartners);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };
  //call api sumary status partners
  const fetchSummaryStatusPartners = async () => {
    const response = await GetStatusSumaryPartners();
    const data: SummaryStatusPartner = response.data;
    setSummaryStatusPartner(data);
    return data;
  };

  useEffect(() => {
    fetchPartners(1);
    fetchSummaryStatusPartners();
  }, []);
  //#endregion

  //#region  logic
  return (
    <div className="px-6 font-inter">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Partners</h1>
          <p className="text-gray-500 text-sm">
            Connect businesses to open project rights and share personnel
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite Partner
        </button>
        <InvitePartners
          open={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      </div>

      {/* Status summary */}
      <div className="flex gap-3 mb-4">
        <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
          Active: {summaryStatusPartner?.active}
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
          Pending: {summaryStatusPartner?.pending}
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700">
          Inactive: {summaryStatusPartner?.inactive}
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">
          Total: {summaryStatusPartner?.total}
        </span>
      </div>

      {/* Search + filter */}
      <div className="flex justify-between items-center bg-gray-50 p-1 rounded-md mb-3">
        <input
          type="text"
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search Company/Owner/Status"
          className="w-1/3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-100"
        />

        {/* filter range date */}
        <div>
          <span>Create Date: </span>
          <RangePicker
            className="border border-gray-300 rounded-md  text-sm"
            format="DD/MM/YYYY"
            placeholder={['Date From', 'Date To']}
            onChange={(dates) => {
              if (!dates) {
                fetchPartners();
                return;
              }
              const [start, end] = dates;
              handleFilterByDate(start, end);
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <select
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none"
            value={filterStatus}
            onChange={(e) => {
              const value = e.target.value;
              setFilterStatus(value);
              handleFilterStatus(value);
            }}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          {/* //result filter */}
          <span>{pagination.totalCount} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Projects</th>
              <th className="px-4 py-3 text-left">Members</th>
              <th className="px-4 py-3 text-left">Option</th>
            </tr>
          </thead>

          <tbody>
            {partners.map((p, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {p.companyInfo?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Tax Code: {p.companyInfo?.taxCode || 'N/A'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">
                    {p.companyInfo?.ownerUserName || '—'}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 border rounded-full text-xs font-medium ${getStatusColor(
                      p.status,
                    )}`}
                  >
                    {p.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div>
                    <div>
                      <span className="font-medium text-gray-800">Since:</span>{' '}
                      {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Responded:{' '}
                      {p.respondedAt ? new Date(p.respondedAt).toLocaleDateString('vi-VN') : '-'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800">{p.totalProject}</span> Projects
                </td>

                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800">{p.totalMember}</span> Members
                </td>

                <td className="px-4 py-3">
                  {p.status === 'Pending' && userIdFromLogin !== p.requesterId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(p.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        className="px-3 py-1 border border-gray-300 text-sm rounded-full hover:bg-gray-100 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}

                  {p.status === 'Pending' && userIdFromLogin === p.requesterId && (
                    <span className="px-3 py-1 border rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border-yellow-400">
                      Waiting for response
                    </span>
                  )}
                  {p.status === 'Active' && (
                    <button className="px-3 py-1 border border-blue-400 text-blue-500 rounded-full text-sm  cursor-default hover:bg-blue-50 flex items-center gap-1">
                      <Users className="w-4 h-4" /> Friend
                    </button>
                  )}
                  {p.status === 'Inactive' && (
                    <button className="px-3 py-1 border border-red-400 text-red-500 rounded-md text-sm hover:bg-red-50  cursor-default flex items-center gap-1">
                      <Ban className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4">
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
  );
  //#endregion
};

export default Partners;
