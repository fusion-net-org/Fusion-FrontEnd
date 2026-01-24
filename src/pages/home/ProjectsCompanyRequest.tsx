/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Layers,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Users,
  RotateCcw,
  XCircle,
  Lock,
  FileSpreadsheet,
  Wrench,
  Code2,
} from 'lucide-react';
import { Progress } from '@/components/Project/progress';
import { toast } from 'react-toastify';
import MembersTab from '@/components/ProjectSideCompanyRequest/MembersTab';
import MemberCharts from '@/components/ProjectSideCompanyRequest/MemberCharts';
import TicketCharts from '@/components/ProjectSideCompanyRequest/TicketCharts';
import TicketsTab from '@/components/ProjectSideCompanyRequest/TicketsTab';
import SprintTab from '@/components/ProjectSideCompanyRequest/SprintTab';
import { GetProjectByProjectId } from '@/services/projectService.js';
import { useParams } from 'react-router-dom';
import type { ProjectDetailResponse } from '@/interfaces/Project/project';
import type { IProjectMemberV2 } from '@/interfaces/ProjectMember/projectMember';
import type { ITicket } from '@/interfaces/Ticket/Ticket';
import { getProjectMemberByProjectId } from '@/services/projectMember.js';
import { GetTicketByProjectId } from '@/services/TicketService.js';
import { getSprintByProjectId } from '@/services/sprintService.js';
import type { ISprintResponse } from '@/interfaces/Sprint/sprint';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { closeProject, reopenProject, GetProjectProcess } from '@/services/projectService.js';
import CloseProjectModal from '@/components/ProjectSideCompanyRequest/CloseProjectModal';
import ReopenProjectModal from '@/components/ProjectSideCompanyRequest/ReopenProjectModal';
import { GetCloseProjectSummaryById } from '@/services/projectService.js';
import { ReviewCloseProjectRequest } from '@/services/projectRequest.js';
import { ProjectRequestClosedRejectReasons } from '@/interfaces/ProjectRequest/projectRequest';

type TicketExcelRow = {
  No: number | string;
  Title: string;
  Assignee?: string | number;
  Priority?: string;
  Budget?: string;
  CreatedDate?: string;
  CloseDate?: string;
  ResolveDate?: string;
  Deleted?: boolean;
  Status?: string | number;
};

const ProjectCompanyRequest = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetailResponse>();
  const [progress, setProgress] = useState<number>();
  const [progressClose, setProgressClose] = useState<any>();
  const [sprints, setSprints] = useState<ISprintResponse>();
  const [projectMembers, setProjectMembers] = useState<IProjectMemberV2>();
  const [projectTickets, setProjectTickets] = useState<{ items: ITicket[]; totalCount: number }>({
    items: [],
    totalCount: 0,
  });
  const [activeTab, setActiveTab] = useState<'members' | 'tickets' | 'sprints'>('members');
  const [refreshChartKey, setRefreshChartKey] = useState(0);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  //Close Project Declare
  const [closeSummary, setCloseSummary] = useState<any>(null);
  const [reviewingClose, setReviewingClose] = useState(false);
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);

  //Accept close
  const [acceptCloseModalOpen, setAcceptCloseModalOpen] = useState(false);

  //Reject close
  const [rejectCloseModalOpen, setRejectCloseModalOpen] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>('');
  const [otherRejectReason, setOtherRejectReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('vi-VN');
  };

  const handleAcceptCloseProject = async () => {
    if (closeSummary?.projectPercent < 100 && !confirmIncomplete) {
      toast.warning('Please confirm closing an incomplete project');
      return;
    }

    try {
      setReviewingClose(true);

      const res = await ReviewCloseProjectRequest(project?.projectRequestId, {
        isApproved: true,
        reasonReject: null,
      });

      if (res.succeeded) {
        toast.success('Close project approved');
        setAcceptCloseModalOpen(false);
        setConfirmIncomplete(false);

        await fetchProjectData();
      }
    } catch {
      toast.error('Approve close failed');
    } finally {
      setReviewingClose(false);
    }
  };

  const handleRejectCloseProject = async () => {
    if (!selectedRejectReason) {
      toast.error('Please select reject reason');
      return;
    }

    const reason =
      selectedRejectReason === 'OTHER'
        ? otherRejectReason.trim()
        : ProjectRequestClosedRejectReasons.find((r) => r.value === selectedRejectReason)?.label;

    if (!reason) {
      toast.error('Reject reason is required');
      return;
    }

    setReviewingClose(true);
    try {
      await ReviewCloseProjectRequest(project?.projectRequestId, {
        isApproved: false,
        reasonReject: reason,
      });

      toast.success('Close project request rejected');
      setRejectCloseModalOpen(false);

      await fetchProjectData();
    } finally {
      setReviewingClose(false);
    }
  };

  const handleCloseProject = async () => {
    if (!projectId) return;

    try {
      setLoadingAction(true);
      await closeProject(projectId);
      toast.success('Project closed successfully');
      setShowCloseModal(false);

      const res = await GetProjectByProjectId(projectId);
      setProject(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to close project');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReopenProject = async () => {
    if (!projectId) return;

    try {
      setLoadingAction(true);
      await reopenProject(projectId);
      toast.success('Project reopened successfully');
      setShowReopenModal(false);

      const res = await GetProjectByProjectId(projectId);
      setProject(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to close project');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTicketCreated = () => {
    setRefreshChartKey((prev) => prev + 1);
  };

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      const [projectRes, progressRes] = await Promise.all([
        GetProjectByProjectId(projectId),
        GetCloseProjectSummaryById(projectId),
      ]);

      setProject(projectRes.data);
      setProgressClose(progressRes);
      setProgress(progressRes.projectPercent || 0);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch project data');
    }
  };

  useEffect(() => {
    if (!projectId) return;

    fetchProjectData();

    // const fetchProject = async () => {
    //   try {
    //     const res = await GetProjectByProjectId(projectId);
    //     console.log('Project', res.data);
    //     setProject(res.data);
    //   } catch (error) {
    //     console.log(error);
    //     toast.error('Failed to fetch project');
    //   }
    // };
    // const fetchProgressProject = async () => {
    //   try {
    //     const res = await GetCloseProjectSummaryById(projectId);
    //     setProgressClose(res);
    //     setProgress(res.projectPercent || 0);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // };
    const fetchMembersCount = async () => {
      try {
        const res = await getProjectMemberByProjectId(projectId, '', '', '', 1, 1000);

        if (res?.succeeded) setProjectMembers(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchTicketsCount = async () => {
      try {
        const res = await GetTicketByProjectId(
          projectId,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          1,
          1000,
          '',
          null,
        );
        if (res?.succeeded) setProjectTickets(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    const fetchSprints = async () => {
      if (!projectId) return;
      try {
        const response = await getSprintByProjectId(projectId);
        setSprints(response.data);
      } catch (error) {
        console.error('Failed to fetch sprints:', error);
      }
    };

    // fetchProject();
    // fetchProgressProject();
    fetchSprints();
    fetchMembersCount();
    fetchTicketsCount();
  }, [projectId]);

  const formatNumber = (value: number | null | undefined) =>
    value !== null && value !== undefined ? value.toLocaleString('vi-VN') : '';

  const handleExportExcelFE = () => {
    if (!project) return;

    /* ================= PROJECT OVERVIEW ================= */
    const projectSheet = [
      { Field: 'Project Name', Value: project.name },
      { Field: 'Project Code', Value: project.code },
      { Field: 'Status', Value: project.status },
      { Field: 'Closed', Value: project.isClosed ? 'Yes' : 'No' },
      {
        Field: 'Start Date',
        Value: project.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : '',
      },
      {
        Field: 'End Date',
        Value: project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : '',
      },
      { Field: 'Progress', Value: '96%' },
      {
        Field: 'Budget Contract',
        Value: formatCurrency(project.contractBudget),
      },
      {
        Field: 'Total Budget Ticket',
        Value: formatCurrency(project.ticketTotalBudget),
      },

      { Field: 'Company Request', Value: project.companyRequestName },
      { Field: 'Company Executor', Value: project.companyExecutorName },
    ];

    /* ================= MEMBERS ================= */
    const memberSheet =
      projectMembers?.items?.map((m: any, index: number) => ({
        No: index + 1,
        Name: m.userName,
        Email: m.email,
        Phone: m.phone,
        Gender: m.gender,
        Status: m.status,
        JoinedDate: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('vi-VN') : '',
      })) || [];

    /* ================= TICKETS ================= */
    const totalTickets = projectTickets.items.length;

    const totalPending = projectTickets.items.filter(
      (t) => t.status?.toUpperCase() === 'PENDING',
    ).length;

    const totalRejected = projectTickets.items.filter(
      (t) => t.status?.toUpperCase() === 'REJECTED',
    ).length;

    const totalAccepted = projectTickets.items.filter(
      (t) => t.status?.toUpperCase() === 'ACCEPTED',
    ).length;
    const totalBudget = projectTickets.items.reduce((sum, t) => sum + (t.budget || 0), 0);

    const ticketSheet: TicketExcelRow[] =
      projectTickets.items.map((t: any, index: number) => ({
        No: index + 1,
        Title: t.ticketName,
        Assignee: t.submittedByName,
        Priority: t.priority,
        Budget: formatNumber(t.budget),
        CreatedDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '',
        CloseDate: t.closedAt ? new Date(t.closedAt).toLocaleDateString('vi-VN') : '',
        ResolveDate: t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('vi-VN') : '',
        Deleted: t.isDeleted,
        Status: t.status,
      })) || [];

    ticketSheet.push(
      {
        No: '',
        Title: 'TOTAL TICKETS',
        Assignee: totalTickets,
      },
      {
        No: '',
        Title: 'TOTAL PENDING',
        Assignee: totalPending,
      },
      {
        No: '',
        Title: 'TOTAL REJECTED',
        Assignee: totalRejected,
      },
      {
        No: '',
        Title: 'TOTAL ACCEPTED',
        Assignee: totalAccepted,
      },
      {
        No: '',
        Title: 'TOTAL BUDGET',
        Assignee: formatNumber(totalBudget),
      },
    );

    /* ================= CREATE WORKBOOK ================= */
    const wb = XLSX.utils.book_new();

    const wsProject = XLSX.utils.json_to_sheet(projectSheet);
    wsProject['!cols'] = [{ wch: 28 }, { wch: 45 }];

    const wsMembers = XLSX.utils.json_to_sheet(memberSheet);
    wsMembers['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 28 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
    ];
    const wsTickets = XLSX.utils.json_to_sheet(ticketSheet);
    wsTickets['!cols'] = [
      { wch: 6 }, // No
      { wch: 32 }, // Title
      { wch: 22 }, // Assignee
      { wch: 14 }, // Priority
      { wch: 16 }, // Budget
      { wch: 18 }, // Created Date
      { wch: 18 }, // Close Date
      { wch: 18 }, // Resolve Date
      { wch: 12 }, // Deleted
      { wch: 16 }, // Status
    ];

    const totalStartRow = ticketSheet.length - 5;

    ['B', 'E'].forEach((col) => {
      for (let i = totalStartRow; i < ticketSheet.length; i++) {
        const cell = wsTickets[`${col}${i + 2}`];
        if (cell) {
          cell.s = { font: { bold: true } };
        }
      }
    });
    XLSX.utils.book_append_sheet(wb, wsProject, 'Project Overview');
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Members');
    XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets');

    /* ================= EXPORT FILE ================= */
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `${project.code}_report.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-5 px-5">
      <div className="mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-10 space-y-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* LEFT: Project name + status */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-3 flex-wrap">
              <Layers className="text-indigo-600 w-6 h-6" />
              <span className={`${project?.isClosed ? 'line-through text-gray-400' : ''}`}>
                {project?.name}
              </span>

              {/* Project Status */}
              {project?.status && (
                <span
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full
            ${
              project?.status?.toUpperCase() === 'ONGOING'
                ? 'bg-yellow-100 text-yellow-700'
                : project?.status?.toUpperCase() === 'DONE'
                  ? 'bg-green-100 text-green-700'
                  : project?.status?.toUpperCase() === 'CLOSED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-600'
            }
          `}
                >
                  {project.status}
                </span>
              )}
              {/* Project Type */}
              {project && (
                <span
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full border ${
                    project.isMaintenance
                      ? 'bg-orange-50 text-orange-600 border-orange-300'
                      : 'bg-blue-50 text-blue-600 border-blue-300'
                  }
      `}
                >
                  {project.isMaintenance ? (
                    <>
                      <Wrench size={14} />
                      Maintenance
                    </>
                  ) : (
                    <>
                      <Code2 size={14} />
                      Development
                    </>
                  )}
                </span>
              )}
              {/* Closed Badge */}
              {project?.isClosed && (
                <span className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                  <Lock size={14} />
                  Closed Project
                </span>
              )}
            </h1>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-sm font-medium shadow-sm">
              <ClipboardList size={14} className="text-indigo-600" />
              <span className="tracking-wider">{project?.code}</span>
            </div>
          </div>

          {/* RIGHT: Actions */}
          {project && (
            <div className="flex items-center gap-3">
              {/* Export Excel */}
              <button
                onClick={handleExportExcelFE}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold
      bg-emerald-600 text-white hover:bg-emerald-700 transition whitespace-nowrap"
              >
                <FileSpreadsheet size={16} />
                Export Excel
              </button>

              {/* REVIEW CLOSE PROJECT */}
              {project?.status === 'CLOSEDPENDING' && (
                <>
                  <ActionButton
                    color="green"
                    label="Accept Close"
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => {
                      setConfirmIncomplete(false);
                      setAcceptCloseModalOpen(true);
                    }}
                  />

                  <ActionButton
                    color="red"
                    label="Reject Close"
                    icon={<XCircle size={16} />}
                    onClick={() => setRejectCloseModalOpen(true)}
                  />
                </>
              )}

              {progressClose?.requestStatus === 'Accepted' && (
                <span
                  className="flex items-center gap-2 px-4 py-2 rounded-full
        bg-green-100 text-green-700 border border-green-300 text-sm font-semibold"
                >
                  <CheckCircle2 size={14} />
                  Accepted Close
                </span>
              )}

              {progressClose?.requestStatus === 'Rejected' && (
                <span
                  className="flex items-center gap-2 px-4 py-2 rounded-full
        bg-red-100 text-red-700 border border-red-300 text-sm font-semibold"
                >
                  <XCircle size={14} />
                  Rejected Closed
                </span>
              )}
            </div>
          )}
        </div>

        {/* PROJECT INFO */}
        <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition relative">
          {/* Overview Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Project Overview
            </h3>
          </div>

          {/* Overview Content */}
          <p className="text-gray-700 font-semibold leading-relaxed mb-6">
            {project?.description || '—'}
          </p>

          {/* Compact Info List */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm font-semibold">
            <InfoRow label="Project Code" value={project?.code} />
            <InfoRow label="Created By" value={project?.createByName} />
            <InfoRow
              label="Start Date"
              value={
                project?.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : '—'
              }
            />
            <InfoRow
              label="End Date"
              value={project?.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : '—'}
            />
            <InfoRow label="Company Request" value={project?.companyRequestName} />
            <InfoRow label="Company Executor" value={project?.companyExecutorName} />
            <InfoRow
              label="Budget Contract"
              value={formatCurrency(project?.contractBudget) + ' VND'}
            />
            <InfoRow
              label="Total Budget Ticket"
              value={formatCurrency(project?.ticketTotalBudget) + ' VND'}
            />
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-4">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            Project Progress
          </h2>

          {/* MAIN PROGRESS BAR */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-sm">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-in-out"
              style={{ width: `${progressClose?.projectPercent ?? 0}%` }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-gray-900">
              {progressClose?.projectPercent ?? 0}%
            </span>
          </div>

          {/* INFO ROW */}
          <div className="mt-4 bg-gray-50 rounded-xl p-4 border">
            <div className="flex items-center justify-between gap-4 text-sm">
              {/* TICKETS */}
              <div className="flex-1 bg-white rounded-lg p-3 border shadow-sm text-center">
                <p className="text-gray-500 text-base">Tickets</p>
                <p className="font-bold text-blue-600 text-lg">
                  {progressClose?.ticketPercent ?? 0}%
                </p>
                <p className="text-xs text-gray-400">Total: {progressClose?.totalTickets ?? 0}</p>
              </div>

              {/* TASKS */}
              <div className="flex-1 bg-white rounded-lg p-3 border shadow-sm text-center">
                <p className="text-gray-500 text-base">Tasks</p>
                <p className="font-bold text-green-600 text-lg">
                  {progressClose?.components?.reduce(
                    (sum: number, c: any) => sum + c.closedTasks,
                    0,
                  ) ?? 0}
                </p>
                <p className="text-xs text-gray-400">Closed</p>
              </div>

              {/* COMPONENTS */}
              <div className="flex-1 bg-white rounded-lg p-3 border shadow-sm text-center">
                <p className="text-gray-500 text-base">Components</p>
                <p className="font-bold text-orange-600 text-lg">
                  {progressClose?.components?.length ?? 0}
                </p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
            </div>
          </div>

          {progressClose?.components?.length > 0 && (
            <div className="mt-6 space-y-3">
              {progressClose.components.map((c: any) => (
                <div key={c.componentId}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-base">{c.componentName}</span>
                    <span>{c.percent}%</span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-orange-500 transition-all"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/*  TABS */}
        {/* ================= PROJECT CONTENT ================= */}
        <>
          {/* ================= TABS ================= */}
          <div className="flex items-center gap-4 border-b pb-3 mb-8">
            {/* MEMBERS TAB */}
            <button
              onClick={() => setActiveTab('members')}
              className={`group relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all
          ${
            activeTab === 'members'
              ? 'text-indigo-700 bg-indigo-50 shadow-md shadow-indigo-100 border border-indigo-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }
        `}
            >
              <Users size={18} className={activeTab === 'members' ? 'text-indigo-600' : ''} />
              Members
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full
            ${
              activeTab === 'members'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-200 text-gray-600'
            }
          `}
              >
                {projectMembers?.totalCount}
              </span>
              {activeTab === 'members' && (
                <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full" />
              )}
            </button>

            {/* TICKETS TAB */}
            <button
              onClick={() => setActiveTab('tickets')}
              className={`group relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all
          ${
            activeTab === 'tickets'
              ? 'text-indigo-700 bg-indigo-50 shadow-md shadow-indigo-100 border border-indigo-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }
        `}
            >
              <MessageSquare
                size={18}
                className={activeTab === 'tickets' ? 'text-indigo-600' : ''}
              />
              Tickets
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full
            ${
              activeTab === 'tickets'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-200 text-gray-600'
            }
          `}
              >
                {projectTickets.totalCount}
              </span>
              {activeTab === 'tickets' && (
                <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full" />
              )}
            </button>

            {/* SPRINT TAB */}
            {!project?.isClosed && (
              <button
                onClick={() => setActiveTab('sprints')}
                className={`group relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all
                  ${
                    activeTab === 'sprints'
                      ? 'text-indigo-700 bg-indigo-50 shadow-md shadow-indigo-100 border border-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <BarChart3 size={18} className={activeTab === 'sprints' ? 'text-indigo-600' : ''} />
                Sprints
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full
                    ${
                      activeTab === 'sprints'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {sprints?.totalCount}
                </span>
                {activeTab === 'sprints' && (
                  <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full" />
                )}
              </button>
            )}
          </div>

          {/* ================= TAB CONTENT ================= */}
          {activeTab === 'members' && (
            <div>
              <MemberCharts projectId={projectId!} />
              <MembersTab projectId={projectId!} />
            </div>
          )}

          {activeTab === 'tickets' && (
            <div>
              <TicketCharts projectId={projectId!} refreshKey={refreshChartKey} />
              <TicketsTab
                isClose={project?.isClosed || false}
                projectId={projectId!}
                onTicketCreated={handleTicketCreated}
              />
            </div>
          )}

          {activeTab === 'sprints' && !project?.isClosed && <SprintTab />}
        </>

        {/* {activeTab === 'sprints' && <SprintTab />} */}
      </div>
      <CloseProjectModal
        open={showCloseModal}
        loading={loadingAction}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseProject}
      />

      <ReopenProjectModal
        open={showReopenModal}
        loading={loadingAction}
        onClose={() => setShowReopenModal(false)}
        onConfirm={handleReopenProject}
      />

      {/* Accept Close Modal */}
      {acceptCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Approve Close Project</h3>

            {closeSummary?.projectPercent < 100 && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  checked={confirmIncomplete}
                  onChange={(e) => setConfirmIncomplete(e.target.checked)}
                  className="mt-1"
                />
                <p className="text-sm text-red-700 font-medium">
                  I understand that this project is not 100% completed and still want to approve
                  closing.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAcceptCloseModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleAcceptCloseProject}
                disabled={reviewingClose}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                {reviewingClose ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Close Modal */}
      {rejectCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Close Project</h3>

            {/* Reason select */}
            <select
              value={selectedRejectReason}
              onChange={(e) => {
                setSelectedRejectReason(e.target.value);
                if (e.target.value !== 'OTHER') {
                  setOtherRejectReason('');
                }
              }}
              className="w-full border rounded-lg p-3 mb-4"
            >
              <option value="">-- Select reject reason --</option>
              {ProjectRequestClosedRejectReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Other reason */}
            {selectedRejectReason === 'OTHER' && (
              <textarea
                value={otherRejectReason}
                onChange={(e) => setOtherRejectReason(e.target.value)}
                placeholder="Enter other reject reason..."
                className="w-full min-h-[100px] border rounded-lg p-3 mb-4"
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectCloseModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleRejectCloseProject}
                disabled={reviewingClose}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                {reviewingClose ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCompanyRequest;

const InfoRow = ({ label, value }: any) => (
  <p className="flex items-center text-gray-700 gap-2 border-b pb-2">
    <span className="font-medium w-32">{label}:</span>
    <span className="text-gray-900">{value || '—'}</span>
  </p>
);

const ActionButton = ({ color, label, icon, onClick, disabled }: any) => {
  const colorClasses: any = {
    green: 'text-green-700 border-green-400 bg-green-50 hover:bg-green-100',
    red: 'text-red-700 border-red-400 bg-red-50 hover:bg-red-100',
    blue: 'text-blue-700 border-blue-400 bg-blue-50 hover:bg-blue-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors
        ${colorClasses[color]} ${
          disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''
        }`}
    >
      {icon}
      {label}
    </button>
  );
};
