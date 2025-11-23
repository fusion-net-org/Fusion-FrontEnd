/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ClipboardList,
  User,
  Layers,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Users,
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

  const handleTicketCreated = () => {
    setRefreshChartKey((prev) => prev + 1);
  };
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const res = await GetProjectByProjectId(projectId);
        console.log(res.data);
        setProject(res.data);
      } catch (error) {
        console.log(error);
        toast.error('Failed to fetch project');
      }
    };
    console.log('project dâta', project);

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

  return (
    <div className="min-h-screen bg-gray-50 py-5 px-5">
      <div className="mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-10 space-y-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Layers className="text-indigo-600 w-6 h-6" />
              {project?.name}
            </h1>
            <p className="text-gray-500 text-sm">Code: {project?.code}</p>
          </div>
          <span
            className={`mt-3 md:mt-0 px-4 py-1.5 text-sm font-semibold rounded-full ${
              project?.status?.toUpperCase() === 'ONGOING'
                ? 'bg-yellow-100 text-yellow-700'
                : project?.status?.toUpperCase() === 'DONE'
                ? 'bg-green-100 text-green-700'
                : project?.status?.toUpperCase() === 'CLOSED'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {project?.status}
          </span>
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
        <div className="flex items-center gap-4 border-b pb-3 mb-8">
          {/* MEMBERS TAB */}
          <button
            onClick={() => setActiveTab('members')}
            className={`
      group relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all
      ${
        activeTab === 'members'
          ? 'text-indigo-700 bg-indigo-50 shadow-md shadow-indigo-100 border border-indigo-200'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }
    `}
          >
            <Users size={18} className={`${activeTab === 'members' ? 'text-indigo-600' : ''}`} />
            Members
            {/* badge */}
            <span
              className={`
      ml-2 text-xs px-2 py-0.5 rounded-full backdrop-blur
      ${activeTab === 'members' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}
    `}
            >
              {projectMembers?.totalCount}
            </span>
            {/* underline animation */}
            {activeTab === 'members' && (
              <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full scale-100 transition" />
            )}
          </button>

          {/* TICKETS TAB */}
          <button
            onClick={() => setActiveTab('tickets')}
            className={`
      group relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all
      ${
        activeTab === 'tickets'
          ? 'text-indigo-700 bg-indigo-50 shadow-md shadow-indigo-100 border border-indigo-200'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }
    `}
          >
            <MessageSquare
              size={18}
              className={`${activeTab === 'tickets' ? 'text-indigo-600' : ''}`}
            />
            Tickets
            {/* badge */}
            <span
              className={`
      ml-2 text-xs px-2 py-0.5 rounded-full backdrop-blur
      ${activeTab === 'tickets' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}
    `}
            >
              {projectTickets.totalCount}
            </span>
            {/* underline */}
            {activeTab === 'tickets' && (
              <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full scale-100 transition" />
            )}
          </button>

          {/* SPRINT TAB */}
          <button
            onClick={() => setActiveTab('sprints')}
            className={`
                group relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all
                ${
                  activeTab === 'sprints'
                    ? 'text-indigo-700 bg-indigo-50 shadow-md shadow-indigo-100 border border-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
          >
            <BarChart3
              size={18}
              className={`${activeTab === 'sprints' ? 'text-indigo-600' : ''}`}
            />
            Sprints
            <span
              className={`
      ml-2 text-xs px-2 py-0.5 rounded-full backdrop-blur
      ${activeTab === 'sprints' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}
    `}
            >
              {sprints?.totalCount}
            </span>
            {activeTab === 'sprints' && (
              <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full scale-100 transition" />
            )}
          </button>
        </div>
        {activeTab === 'members' && (
          <div>
            <MemberCharts projectId={projectId!} />
            <MembersTab projectId={projectId!} />
          </div>
        )}
        {activeTab === 'tickets' && (
          <div>
            <TicketCharts projectId={projectId!} refreshKey={refreshChartKey} />
            <TicketsTab projectId={projectId!} onTicketCreated={handleTicketCreated} />
          </div>
        )}

        {activeTab === 'sprints' && <SprintTab />}
      </div>
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
