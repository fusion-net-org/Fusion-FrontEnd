/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Users, Check, X, Ban, Eye, Search, Inbox } from 'lucide-react';
import InvitePartners from '@/components/Partner/InvitePartner';
import {
  GetCompanyPartnersByCompanyID,
  GetStatusSumaryPartners,
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
import { useNavigate, useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import LoadingOverlay from '@/common/LoadingOverlay';
import { Paging } from '@/components/Paging/Paging';

const Partners: React.FC = () => {
  const { RangePicker } = DatePicker;
  const userIdFromLogin = getUserIdFromToken();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(false);
  //#region State
  const [partners, setPartners] = useState<any[]>([]);
  console.log('partners', partners);
  const [pagination, setPagination] = useState<
    Pick<PartnerResponse, 'pageNumber' | 'pageSize' | 'totalCount'>
  >({
    pageNumber: 1,
    pageSize: 8,
    totalCount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [summaryStatusPartner, setSummaryStatusPartner] = useState<SummaryStatusPartner>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  //#endregion

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-100">
            Pending
          </span>
        );
      case 'inactive':
        return (
          <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium border border-gray-100">
            {status}
          </span>
        );
    }
  };

  //#region API helpers (keeps your original logic)
  const enrichPartnerInfo = async (items: any[]) => {
    return Promise.all(
      items.map(async (p) => {
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

  const fetchPartners = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const response = await GetCompanyPartnersByCompanyID(
        companyId,
        null,
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
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryStatusPartners = async () => {
    try {
      const response = await GetStatusSumaryPartners(companyId);
      const data: SummaryStatusPartner = response.data;
      setSummaryStatusPartner(data);
      return data;
    } catch (err) {
      return undefined;
    }
  };
  //#endregion

  const handleSearch = useCallback(
    debounce(async (keyword: string) => {
      try {
        setLoading(true);
        if (!keyword) {
          fetchPartners();
          return;
        }

        const res = await GetCompanyPartnersByCompanyID(
          companyId,
          keyword,
          null,
          null,
          1,
          pagination.pageSize,
          null,
          null,
        );

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
      } finally {
        setLoading(false);
      }
    }, 500),
    [companyId, pagination.pageSize],
  );

  const handleFilterStatus = async (status: string) => {
    const statusLower = status.toLowerCase();
    try {
      setLoading(true);
      if (!status || statusLower === 'all') {
        fetchPartners();
        return;
      }

      const res = await FilterPartners(companyId, statusLower);
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
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByDate = async (startDate: any, endDate: any) => {
    try {
      setLoading(true);
      if (!startDate || !endDate) {
        fetchPartners();
        return;
      }

      const from = startDate.format('YYYY-MM-DD');
      const to = endDate.format('YYYY-MM-DD');

      const res = await GetCompanyPartnersByCompanyID(
        companyId,
        null,
        from,
        to,
        1,
        pagination.pageSize,
        null,
        null,
      );
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
    } finally {
      setLoading(false);
    }
  };
  const handleFilterByResponseDate = async (startDate: any, endDate: any) => {
    try {
      setLoading(true);
      if (!startDate || !endDate) {
        fetchPartners();
        return;
      }

      const from = startDate.format('YYYY-MM-DD');
      const to = endDate.format('YYYY-MM-DD');

      const res = await GetCompanyPartnersByCompanyID(
        companyId,
        null, // Keyword
        null, // FromDate
        null, // ToDate
        from, // RespondFromDate
        to, // RespondToDate
        1,
        pagination.pageSize,
        null,
        null,
      );

      const data: PartnerResponse = res.data;
      const enrichedPartners = await enrichPartnerInfo(data.items);
      setPartners(enrichedPartners);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
      });
    } catch (error: any) {
      console.error('Error filtering by response date:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      setLoading(true);
      const res = await AcceptInvitePartnert(id);
      toast.success(res.data.message || 'Accepted successfully!');
      await fetchPartners(currentPage);
      await fetchSummaryStatusPartners();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to accept!');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setLoading(true);
      const res = await CancelInvitePartner(id);
      toast.info(res.data.message || 'Invite rejected!');
      await fetchPartners(currentPage);
      await fetchSummaryStatusPartners();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject!');
    } finally {
      setLoading(false);
    }
  };
  //#endregion

  useEffect(() => {
    fetchPartners(1);
    fetchSummaryStatusPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  //#region UI (member-like style)
  return (
    <>
      <LoadingOverlay loading={loading} message="Loading Partners" />
      <div className="px-5 py-5 font-inter  min-h-screen">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 rounded-2xl p-6 mb-8 text-white shadow-lg border border-blue-300/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Partners</h1>
              <p className="text-blue-100 text-sm">
                Connect businesses to open project rights and share personnel
              </p>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition text-sm"
            >
              <UserPlus className="w-4 h-4" /> Invite Partner
            </button>
          </div>
        </div>

        {/* STATUS SUMMARY */}
        <div className="flex flex-wrap gap-3 mb-2">
          <span className="px-4 py-1.5 bg-green-200 text-green-700 text-sm font-medium rounded-full">
            Active: {summaryStatusPartner?.active ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-yellow-200 text-yellow-700 text-sm font-medium rounded-full">
            Pending: {summaryStatusPartner?.pending ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-red-200 text-red-700 text-sm font-medium rounded-full">
            Inactive: {summaryStatusPartner?.inactive ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-blue-200 text-blue-700 text-sm font-medium rounded-full">
            Total:{summaryStatusPartner?.total ?? 0}
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-start justify-between gap-4 py-3 rounded-xl mb-2">
          {/* Search (Left) */}
          <div className="flex flex-col w-full sm:w-80">
            <label className="font-semibold text-sm text-gray-600 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Company/Owner/Status..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  handleSearch(value);
                }}
              />
            </div>
          </div>

          {/* Filters (Right) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Response Date Filter */}
            <div className="flex flex-col">
              <label className="font-semibold text-sm text-gray-600 mb-1">Response Date</label>
              <RangePicker
                format="DD/MM/YYYY"
                className="rounded-lg border border-gray-300 !h-[37.6px]"
                placeholder={['From', 'To']}
                onChange={(dates) => {
                  if (!dates) {
                    fetchPartners();
                    return;
                  }
                  const [start, end] = dates;
                  handleFilterByResponseDate(start, end);
                }}
              />
            </div>

            {/* Date Range */}
            <div className="flex flex-col">
              <label className="font-semibold text-sm text-gray-600 mb-1">Create Date</label>
              <RangePicker
                format="DD/MM/YYYY"
                className="rounded-lg border border-gray-300 !h-[37.6px]"
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

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="font-semibold text-sm text-gray-600 mb-1">Status</label>
              <select
                className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]"
                value={filterStatus}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterStatus(value);
                  handleFilterStatus(value);
                }}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Result Count */}
            <div className="font-semibold text-sm text-gray-500 flex items-center h-[37.6px] mt-[25px]">
              {pagination.totalCount} results
            </div>
          </div>
        </div>

        {/* Table (member style) */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold">
              <tr className="hover:bg-blue-100/70 transition">
                <th className="px-6 py-3 text-center w-[20%]">Company</th>
                <th className="px-6 py-3 text-center w-[15%]">Owner</th>
                <th className="px-6 py-3 text-center w-[10%]">Status</th>
                <th className="px-6 py-3 text-center w-[10%]">Since</th>
                <th className="px-6 py-3 text-center w-[10%]">Response Date</th>
                <th className="px-6 py-3 text-center w-[20%]">Action</th>
                <th className="px-6 py-3 text-center w-[5%]">Details</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr className="border-b border-gray-200 hover:bg-blue-50 transition duration-200">
                  <td colSpan={8} className="py-10">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Inbox className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">
                        {searchTerm
                          ? `No partners found for "${searchTerm}".`
                          : 'No partners available.'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {searchTerm
                          ? 'Try a different keyword or adjust your filters.'
                          : 'Please choose another company or adjust your filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                partners.map((p, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-all duration-150 text-center cursor-pointer ${
                      p.companyInfo?.isDeleted || p.status?.toLowerCase() === 'inactive'
                        ? 'cursor-not-allowed hover:bg-white'
                        : ''
                    }`}
                    onClick={() => {
                      if (p.companyInfo?.isDeleted || p.status?.toLowerCase() === 'inactive')
                        return;
                      navigate(`/company/${companyId}/partners/${p.companyInfo?.id}`, {
                        state: { companyId, partnerId: p.id },
                      });
                    }}
                  >
                    <td className="px-6 py-4 flex items-center gap-3 text-left">
                      <img
                        src={
                          p.companyInfo?.avatar ||
                          p.companyInfo?.avatarCompany ||
                          `/api/companies/${p.companyInfo?.id}/logo`
                        }
                        onError={(e: any) => {
                          e.currentTarget.src = 'https://via.placeholder.com/48?text=Co';
                        }}
                        alt={p.companyInfo?.name ?? 'Company'}
                        className="w-10 h-10 rounded-md object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{p.companyInfo?.name ?? 'N/A'}</p>
                        <p className="text-gray-500 text-xs">
                          Tax Code: {p.companyInfo?.taxCode ?? 'N/A'}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {p.companyInfo?.ownerUserName ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500">{p.companyInfo?.email ?? ''}</div>
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>

                    <td className="px-6 py-4">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </td>

                    <td className="px-6 py-4">
                      {p.respondedAt ? new Date(p.respondedAt).toLocaleDateString('vi-VN') : '---'}
                    </td>

                    <td className="px-6 py-4">
                      {p.status?.toLowerCase() === 'pending' &&
                      userIdFromLogin !== p.requesterId ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(p.id);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(p.id);
                            }}
                            className="px-3 py-1 border border-gray-300 text-sm rounded-full hover:bg-gray-100 flex items-center gap-1"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : p.companyInfo?.isDeleted || p.status?.toLowerCase() === 'inactive' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-200 rounded-full text-sm text-red-600">
                          <Ban className="w-4 h-4" /> Inactive
                        </div>
                      ) : p.status?.toLowerCase() === 'active' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-blue-100 rounded-full text-sm text-blue-600">
                          <Users className="w-4 h-4" /> Friend
                        </div>
                      ) : p.status?.toLowerCase() === 'pending' &&
                        userIdFromLogin === p.requesterId ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm border border-yellow-100">
                          Waiting for response
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-gray-100 rounded-full text-sm text-gray-600">
                          {p.status}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Eye
                        className={`w-5 h-5 mx-auto transition-transform hover:scale-110 ${
                          p.companyInfo?.isDeleted || p.status?.toLowerCase() === 'inactive'
                            ? 'text-gray-300 cursor-not-allowed hover:scale-100'
                            : 'text-gray-500 hover:text-blue-600 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (p.companyInfo?.isDeleted || p.status?.toLowerCase() === 'inactive')
                            return;
                          navigate(`/company/${companyId}/partners/${p.companyInfo?.id}`, {
                            state: { companyId, partnerId: p.id },
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="w-full">
          <Paging
            page={pagination.pageNumber}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchPartners(page);
            }}
            onPageSizeChange={(size) => {
              setPagination((prev) => ({ ...prev, pageSize: size }));
              fetchPartners(1);
            }}
          />
        </div>

        <InvitePartners
          open={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onSuccess={async () => {
            await fetchPartners(currentPage);
            await fetchSummaryStatusPartners();
          }}
        />
      </div>
    </>
  );
  //#endregion
};

export default Partners;
