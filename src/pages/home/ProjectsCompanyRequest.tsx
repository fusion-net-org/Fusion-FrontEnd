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
import { closeProject, reopenProject } from '@/services/projectService.js';
import CloseProjectModal from '@/components/ProjectSideCompanyRequest/CloseProjectModal';
import ReopenProjectModal from '@/components/ProjectSideCompanyRequest/ReopenProjectModal';

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
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const res = await GetProjectByProjectId(projectId);
        setProject(res.data);
      } catch (error) {
        console.log(error);
        toast.error('Failed to fetch project');
      }
    };

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

    fetchProject();
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

              {/* Close / Reopen */}
              <button
                onClick={() => {
                  if (project.isClosed) {
                    setShowReopenModal(true);
                  } else {
                    setShowCloseModal(true);
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all
              border shadow-sm whitespace-nowrap
              ${
                project.isClosed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
              }
            `}
              >
                {project.isClosed ? (
                  <>
                    <RotateCcw size={16} />
                    Reopen Project
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Close Project
                  </>
                )}
              </button>
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
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-4">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            Project Progress
          </h2>

          {/* Horizontal Progress Bar */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-sm">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-in-out"
              style={{ width: `${96}%` }}
            ></div>
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 font-semibold text-gray-900">
              96%
            </span>
          </div>

          {/* Optional: Small info row below */}
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>
              Start:{' '}
              {project?.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : '—'}
            </span>
            <span>
              End: {project?.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : '—'}
            </span>
          </div>
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
