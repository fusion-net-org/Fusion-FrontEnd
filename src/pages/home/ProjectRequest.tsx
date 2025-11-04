/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, CheckCircle, Eye, Inbox, Search, Send, UserPlus, X, XCircle } from 'lucide-react';
import { DatePicker } from 'antd';
import LoadingOverlay from '@/common/LoadingOverlay';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { GetProjectRequestByCompanyId } from '@/services/projectRequest.js';
import type {
  IProjectRequset,
  ProjectRequestResponse,
} from '@/interfaces/ProjectRequest/projectRequest';
import { useParams } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';
import { AcceptProjectRequest, RejectProjectRequest } from '@/services/projectRequest.js';
import RejectReasonModal from '@/components/ProjectRequest/RejectProjectRequest';
import InviteProjectRequestModal from '@/components/ProjectRequest/InviteProjectRequest';
import { useNavigate } from 'react-router-dom';
const { RangePicker } = DatePicker;

const ProjectRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [data, setData] = useState<IProjectRequset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [viewMode, setViewMode] = useState<'AsRequester' | 'AsExecutor'>('AsRequester');
  console.log(data);
  //open popup
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [modalOpenInviteProjectRequest, setModalOpenInviteProjectRequest] = useState(false);

  //handing open
  const openRejectModal = (id: string) => {
    setSelectedProjectId(id);
    setRejectModalOpen(true);
  };
  //popup invite
  const handleNewClick = () => setModalOpenInviteProjectRequest(true);

  const handleClose = () => setModalOpenInviteProjectRequest(false);

  //handing accept and reject for company executor
  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      const res = await AcceptProjectRequest(id);
      if (res.succeeded) {
        toast.success('Request accepted successfully!');
        fetchData();
      } else {
        toast.error(res.message || 'Failed to accept request');
      }
    } catch (error) {
      toast.error('Error while accepting request');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter reason:');
    if (!reason) {
      toast.info('Please enter reason!');
      return;
    }

    const res = await RejectProjectRequest(id, reason);
    if (res.succeeded) {
      toast.success('Request rejected successfully!');
      fetchData();
    } else {
      toast.error(res.message || 'Failed to reject request');
    }
  };

  const fetchData = async (
    companyIdParam = companyId,
    searchParam = searchTerm,
    statusParam = statusFilter,
    dateParam = dateRange,
    pageParam = pageNumber,
  ) => {
    if (!companyIdParam) return;
    setLoading(true);
    try {
      const startDateStr = dateParam ? dateParam[0]?.format('YYYY-MM-DD') : null;
      const endDateStr = dateParam ? dateParam[1]?.format('YYYY-MM-DD') : null;
      const res: ProjectRequestResponse = await GetProjectRequestByCompanyId(
        companyIdParam,
        searchParam || null,
        statusParam === 'All' ? null : statusParam,
        viewMode,
        'StartEndDate',
        startDateStr,
        endDateStr,
        pageParam,
        pageSize,
        'CreateAt',
        false,
      );

      setData(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useMemo(
    () =>
      debounce((text: string) => {
        fetchData(companyId, text, statusFilter, dateRange, pageNumber);
      }, 500),
    [companyId, statusFilter, dateRange, pageNumber],
  );

  useEffect(() => {
    debouncedFetch(searchTerm);
    return () => {
      debouncedFetch.cancel();
    };
  }, [searchTerm, debouncedFetch]);
  console.log('🔄 Fetching with ViewMode:', viewMode);

  useEffect(() => {
    fetchData();
  }, [companyId, statusFilter, dateRange, pageNumber, pageSize, viewMode]);

  const countStatus = (status: string) => data.filter((p) => p.status === status).length;

  const showActionColumn = useMemo(() => {
    return (
      viewMode === 'AsExecutor'
      //    &&
      //data.some((p) => p.status === 'Pending' && p.executorCompanyId === companyId)
    );
  }, [data, viewMode, companyId]);

  const getStatusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
      Pending: 'bg-yellow-50 text-yellow-700',
      Accepted: 'bg-blue-50 text-blue-700',
      Finished: 'bg-green-50 text-green-700',
      Rejected:
        'px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styleMap[status] || 'bg-gray-50 text-gray-600'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="px-5 py-5 font-inter bg-gray-50 min-h-screen">
      <LoadingOverlay loading={loading} message="Loading project requests..." />
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 rounded-2xl p-6 mb-8 text-white shadow-lg border border-blue-300/30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Project Requests</h1>
            <p className="text-blue-100 text-sm">
              Manage requests for inter-company collaborations
            </p>
          </div>
          <button
            onClick={handleNewClick}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition text-sm"
          >
            <UserPlus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      {/* STATUS SUMMARY */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-4 py-1.5 bg-blue-200 text-blue-700 font-medium rounded-full text-sm">
          Accepted: {countStatus('Accepted')}
        </span>
        <span className="px-4 py-1.5 bg-red-200 text-red-700 font-medium rounded-full text-sm">
          Rejected: {countStatus('Rejected')}
        </span>
        <span className="px-4 py-1.5 bg-yellow-200 text-yellow-700 font-medium rounded-full text-sm">
          Pending: {countStatus('Pending')}
        </span>
        <span className="px-4 py-1.5 bg-green-200 text-green-700 font-medium rounded-full text-sm">
          Finished: {countStatus('Finished')}
        </span>
        <span className="px-4 py-1.5 bg-gray-300 text-gray-600 font-medium rounded-full text-sm">
          Total: {totalCount}
        </span>
      </div>

      {/* VIEW MODE TABS */}
      <div className="flex items-center justify-start mb-5">
        <div className="flex bg-white/70 backdrop-blur-md border border-gray-200 rounded-full shadow-md overflow-hidden p-1 gap-1">
          {/* My Requests */}
          <button
            onClick={() => {
              setViewMode('AsRequester');
              setPageNumber(1);
            }}
            className={`
        relative flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full transition-all duration-300
        ${
          viewMode === 'AsRequester'
            ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg scale-105'
            : 'text-gray-600 hover:bg-gray-100'
        }
      `}
          >
            <Send className="w-4 h-4" />
            My Requests
            {viewMode === 'AsRequester' && (
              <span className="absolute inset-0 rounded-full bg-white/10 pointer-events-none"></span>
            )}
          </button>

          {/* Requests To Me */}
          <button
            onClick={() => {
              setViewMode('AsExecutor');
              setPageNumber(1);
            }}
            className={`
        relative flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full transition-all duration-300
        ${
          viewMode === 'AsExecutor'
            ? 'text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-lg scale-105'
            : 'text-gray-600 hover:bg-gray-100'
        }
      `}
          >
            <Inbox className="w-4 h-4" />
            Requests To Me
            {viewMode === 'AsExecutor' && (
              <span className="absolute inset-0 rounded-full bg-white/10 pointer-events-none"></span>
            )}
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Project/Requester/Executor..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Create Date:</span>
            <RangePicker
              format="DD/MM/YYYY"
              className="border-gray-300 rounded-lg"
              onChange={(dates) => setDateRange(dates as any)}
            />
          </div>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Finished">Finished</option>
          </select>

          {/* <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={viewMode}
            onChange={(e) => {
              const value = e.target.value as 'AsRequester' | 'AsExecutor';
              console.log('Change ViewMode:', value);
              setViewMode(value);
              setPageNumber(1);
            }}
          >
            <option value="AsRequester">My Requests</option>
            <option value="AsExecutor">Requests To Me</option>
          </select> */}

          <span className="text-sm text-gray-500">{data.length} results</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              {/* <th className="px-4 py-3 font-medium">Code</th> */}
              <th className="px-4 py-3 font-medium text-center">Name</th>
              <th className="px-4 py-3 font-medium text-center">Request Company</th>
              <th className="px-4 py-3 font-medium text-center">Executor Company</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Start Date</th>
              <th className="px-4 py-3 font-medium text-center">End Date</th>
              <th className="px-4 py-3 font-medium text-center">Have Project</th>
              {/* neu la executor company them cot action de thuc hien hanh dong */}
              {showActionColumn && <th className="px-4 py-3 font-medium text-center">Action</th>}
              <th className="px-4 py-3 font-medium text-left">Detail</th>
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition-all duration-150 cursor-pointer"
                  >
                    {/* <td className="px-4 py-3 text-gray-800 font-medium">{item.code}</td> */}
                    <td className="px-4 py-3 text-gray-800 text-center">{item.projectName}</td>
                    {/* Requester Company */}
                    <td className="px-4 py-3 text-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* {item.requesterCompanyLogoUrl ? (
                          <img
                            src={item.requesterCompanyLogoUrl}
                            alt="Requester Logo"
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            N
                          </div>
                        )} */}
                        <span>{item.requesterCompanyName}</span>
                      </div>
                    </td>

                    {/* Executor Company */}
                    <td className="px-4 py-3 text-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* {item.executorCompanyLogoUrl ? (
                          <img
                            src={item.executorCompanyLogoUrl}
                            alt="Executor Logo"
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            N
                          </div>
                        )} */}
                        <span>{item.executorCompanyName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {new Date(item.startDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {new Date(item.endDate).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {item.isHaveProject ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>

                    {showActionColumn && item.executorCompanyId === companyId && (
                      <td className="px-4 py-3 text-center">
                        {item.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAccept(item.id)}
                              disabled={acceptingId === item.id}
                              className={`flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-lg transition min-w-[90px]
                                ${
                                  acceptingId === item.id
                                    ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }
                              `}
                            >
                              {acceptingId === item.id ? (
                                <>
                                  <svg
                                    className="animate-spin h-4 w-4 text-green-700"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v8H4z"
                                    ></path>
                                  </svg>
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  Accept
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => openRejectModal(item.id)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        ) : item.status === 'Accepted' ? (
                          <div className="flex items-center justify-center">
                            <button
                              disabled
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg cursor-not-allowed"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accepted
                            </button>
                          </div>
                        ) : item.status === 'Rejected' ? (
                          <div className="flex items-center justify-center">
                            <button
                              disabled
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg cursor-not-allowed"
                            >
                              <XCircle className="h-4 w-4" />
                              Rejected
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">—</span>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-3 text-center">
                      <Eye
                        className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer"
                        onClick={() =>
                          navigate(`/company/${companyId}/project-request/${item.id}`, {
                            state: { viewMode },
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <p className="text-lg font-medium">No project requests found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Try adjusting filters or create a new request
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-6">
        <Stack spacing={2} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <Pagination
            count={Math.ceil(totalCount / pageSize) || 1}
            page={pageNumber}
            onChange={(_, value) => setPageNumber(value)}
            color="primary"
            variant="outlined"
            shape="rounded"
            size="medium"
            showFirstButton
            showLastButton
          />
        </Stack>
      </div>
      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        projectId={selectedProjectId}
        onSuccess={fetchData}
      />
      <InviteProjectRequestModal
        open={modalOpenInviteProjectRequest}
        onClose={handleClose}
        requesterCompanyId={companyId || ''}
        executorCompanyId=""
        onSuccess={() => {
          fetchData();
          setRejectModalOpen(false);
        }}
      />
    </div>
  );
};

export default ProjectRequestPage;
