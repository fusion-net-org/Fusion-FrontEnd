/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Users, Check, X, Ban, Eye } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
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

const Partners: React.FC = () => {
  const { RangePicker } = DatePicker;
  const userIdFromLogin = getUserIdFromToken();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(false);

  //#region State
  const [partners, setPartners] = useState<any[]>([]);
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
    switch (status) {
      case 'Active':
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
            Active
          </span>
        );
      case 'Pending':
        return (
          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-100">
            Pending
          </span>
        );
      case 'Inactive':
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

  //#region Events (unchanged)
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchPartners(value);
  };

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
    try {
      setLoading(true);
      if (!status || status === 'All') {
        fetchPartners();
        return;
      }

      const res = await FilterPartners(companyId, status);
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

  const handleAccept = async (id: number) => {
    try {
      const res = await AcceptInvitePartnert(id);
      toast.success(res.data.message || 'Accepted successfully!');
      fetchPartners(currentPage);
      fetchSummaryStatusPartners();
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to accept!');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await CancelInvitePartner(id);
      toast.info(res.data.message || 'Invite rejected!');
      fetchPartners(currentPage);
      fetchSummaryStatusPartners();
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to reject!');
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
      <div className="px-8 py-6 font-inter bg-gray-50 min-h-screen">
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
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            Active: {summaryStatusPartner?.active ?? 0}
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            Pending: {summaryStatusPartner?.pending ?? 0}
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
            Inactive: {summaryStatusPartner?.inactive ?? 0}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            Total:{summaryStatusPartner?.total ?? 0}
          </span>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-xl shadow-md mb-6 gap-3 border border-gray-200">
          <input
            type="text"
            placeholder="Search Company/Owner/Status..."
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              handleSearch(value);
            }}
            className="w-full sm:w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Create Date:</span>
              <RangePicker
                className="border border-gray-200 rounded-lg px-2 py-1"
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

            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
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
            <div className="text-sm text-gray-500">{pagination.totalCount} results</div>
          </div>
        </div>

        {/* Table (member style) */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold">
              <tr className="hover:bg-blue-100/70 transition">
                <th className="px-6 py-3 text-left w-[30%]">Company</th>
                <th className="px-6 py-3 text-center w-[15%]">Owner</th>
                <th className="px-6 py-3 text-center w-[10%]">Status</th>
                <th className="px-6 py-3 text-center w-[10%]">Since</th>
                <th className="px-6 py-3 text-center w-[5%]">Projects</th>
                <th className="px-6 py-3 text-center w-[5%]">Members</th>
                <th className="px-6 py-3 text-center w-[20%]">Action</th>
                <th className="px-6 py-3 text-center w-[5%]">Details</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr className="border-b border-gray-200 hover:bg-blue-50 transition duration-200">
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Ban className="w-6 h-6 text-gray-400" />
                      {searchTerm
                        ? `No partners found for "${searchTerm}".`
                        : 'No partners available.'}
                    </div>
                  </td>
                </tr>
              ) : (
                partners.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-all duration-150 text-center"
                  >
                    {/* Cột Company vẫn giữ text-left để hình và tên công ty hiển thị đẹp */}
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
                      <div className="text-sm text-gray-800">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Responded:{' '}
                        {p.respondedAt ? new Date(p.respondedAt).toLocaleDateString('vi-VN') : '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{p.totalProject ?? 0}</span>{' '}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{p.totalMember ?? 0}</span>{' '}
                    </td>

                    <td className="px-6 py-4">
                      {p.status === 'Pending' && userIdFromLogin !== p.requesterId ? (
                        <div className="flex justify-center gap-2">
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
                      ) : p.companyInfo?.isDeleted ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-200 rounded-full text-sm text-red-600">
                          <Ban className="w-4 h-4" /> Inactive
                        </div>
                      ) : p.status === 'Active' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-blue-100 rounded-full text-sm text-blue-600">
                          <Users className="w-4 h-4" /> Friend
                        </div>
                      ) : p.status === 'Pending' && userIdFromLogin === p.requesterId ? (
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
                        className="w-5 h-5 mx-auto text-gray-500 hover:text-blue-600 cursor-pointer transition-transform hover:scale-110"
                        onClick={() =>
                          navigate(`/company/partners/${p.companyInfo?.id}`, {
                            state: { companyId, partnerId: p.id },
                          })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-6">
          <Stack spacing={2} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <Pagination
              count={Math.ceil(pagination.totalCount / pagination.pageSize) || 1}
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
