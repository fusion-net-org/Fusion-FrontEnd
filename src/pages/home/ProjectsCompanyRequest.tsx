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
const ProjectCompanyRequest = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetailResponse>();
  const [projectMembers, setProjectMembers] = useState<IProjectMemberV2>();
  const [activeTab, setActiveTab] = useState<'members' | 'tickets' | 'sprints'>('members');
  const tasksPerSprint = {
    'Sprint 1': [
      { id: '1', title: 'Fix Login Bug', assignee: 'Tran Thi B', status: 'Done' },
      { id: '2', title: 'Update Dashboard UI', assignee: 'Nguyen Van A', status: 'In Progress' },
    ],
    'Sprint 2': [
      { id: '3', title: 'Optimize API Performance', assignee: 'Le Van C', status: 'To Do' },
      {
        id: '4',
        title: 'Refactor Notification Service',
        assignee: 'Nguyen Van A',
        status: 'In Review',
      },
    ],
    'Sprint 3': [{ id: '5', title: 'Add Export Feature', assignee: 'Tran Thi B', status: 'Done' }],
    'Sprint 4': [],
  };

  const [tickets] = useState([
    { id: 1, title: 'Fix Login Bug', assignee: 'Tran Thi B', status: 'Done', date: '2025-10-10' },
    {
      id: 2,
      title: 'Update Dashboard UI',
      assignee: 'Nguyen Van A',
      status: 'In Progress',
      date: '2025-10-15',
    },
    {
      id: 3,
      title: 'Optimize API Performance',
      assignee: 'Le Van C',
      status: 'To Do',
      date: '2025-10-20',
    },
    {
      id: 4,
      title: 'Refactor Notification Service',
      assignee: 'Nguyen Van A',
      status: 'In Review',
      date: '2025-10-22',
    },
    {
      id: 5,
      title: 'Add Export Feature',
      assignee: 'Tran Thi B',
      status: 'Done',
      date: '2025-10-25',
    },
  ]);

  const sprintData = [
    { name: 'Sprint 1', done: 10, total: 12 },
    { name: 'Sprint 2', done: 8, total: 10 },
    { name: 'Sprint 3', done: 6, total: 9 },
    { name: 'Sprint 4', done: 3, total: 10 },
  ];

  const ticketsPerSprintData = [
    { name: 'Sprint 1', created: 15, done: 10 },
    { name: 'Sprint 2', created: 12, done: 8 },
    { name: 'Sprint 3', created: 9, done: 5 },
    { name: 'Sprint 4', created: 11, done: 3 },
  ];

  const handleCreateTicket = () => {
    toast.success('New ticket created successfully!');
  };

  //#region  handling
  //#endregion

  //#region fetch
  const fetchData = async () => {
    if (!projectId) return;

    try {
      const projectRes = await GetProjectByProjectId(projectId);
      if (projectRes?.succeeded) {
        setProject(projectRes.data);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch data');
    }
  };
  useEffect(() => {
    fetchData();
  }, [projectId]);

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketRange, setTicketRange] = useState<any>(null);

  // --- PAGINATION STATES ---
  const [ticketPage, setTicketPage] = useState(1);
  const rowsPerPage = 10;

  return (
    <div className="min-h-screen bg-gray-50 py-5 px-5">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-10 space-y-10">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            icon={<Calendar />}
            label="Start Date"
            value={
              project?.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : '-'
            }
          />
          <InfoItem
            icon={<Calendar />}
            label="End Date"
            value={project?.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : '-'}
          />
          <InfoItem icon={<User />} label="Created By" value={project?.createByName || '-'} />
          <InfoItem
            icon={<Calendar />}
            label="Created At"
            value={project?.createAt ? new Date(project.createAt).toLocaleDateString('vi-VN') : '-'}
          />
          <InfoItem
            icon={<User />}
            label="Company Request"
            value={project?.companyRequestName || '-'}
          />
          <InfoItem
            icon={<User />}
            label="Company Executor"
            value={project?.companyExecutorName || '-'}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
            <ClipboardList className="text-indigo-500 w-5 h-5" />
            Description
          </h2>
          <p className="text-gray-700 leading-relaxed">{project?.description}</p>
        </div>
        {/* PROGRESS */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            Project Progress
          </h2>
          <div className="flex items-center gap-4">
            <Progress value={95} className="w-full h-4 bg-gray-200" />
            <span className="font-semibold text-gray-700">{96}%</span>
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
              {tickets.length}
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
              4
            </span>
            {activeTab === 'sprints' && (
              <div className="absolute bottom-[-9px] left-0 right-0 h-[3px] bg-indigo-500 rounded-full scale-100 transition" />
            )}
          </button>
        </div>
        {activeTab === 'members' && (
          <div>
            <MemberCharts projectId={projectId!} />
            <MembersTab
              projectId={projectId!}
              rowsPerPage={rowsPerPage}
              onMembersDataChange={(data) => setProjectMembers(data)}
            />
          </div>
        )}
        {activeTab === 'tickets' && (
          <div>
            <TicketCharts sprintData={sprintData} ticketsPerSprintData={ticketsPerSprintData} />
            <TicketsTab
              tickets={tickets}
              ticketSearch={ticketSearch}
              setTicketSearch={setTicketSearch}
              ticketRange={ticketRange}
              setTicketRange={setTicketRange}
              ticketPage={ticketPage}
              setTicketPage={setTicketPage}
              rowsPerPage={rowsPerPage}
              onCreateTicket={handleCreateTicket}
            />
          </div>
        )}

        {activeTab === 'sprints' && (
          <SprintTab tasksPerSprint={tasksPerSprint} sprintData={sprintData} />
        )}
      </div>
    </div>
  );
};

export default ProjectCompanyRequest;

const InfoItem = ({ icon, label, value }: any) => (
  <div className="bg-gradient-to-br from-gray-50 to-white border rounded-2xl p-4 hover:shadow-md transition">
    <div className="flex items-center gap-3">
      <div className="text-indigo-600 bg-indigo-50 p-2 rounded-xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);
