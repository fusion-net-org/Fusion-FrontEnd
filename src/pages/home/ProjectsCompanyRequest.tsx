/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ClipboardList,
  User,
  Layers,
  PlusCircle,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Progress } from '@/components/Project/progress';
import { toast } from 'react-toastify';
import { DatePicker, Input } from 'antd';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

const ProjectCompanyRequest = () => {
  const [project] = useState({
    code: 'PRJ-001',
    name: 'CRM Development System',
    description:
      'Phát triển hệ thống CRM cho doanh nghiệp giúp quản lý khách hàng, bán hàng và chăm sóc hậu mãi.',
    status: 'In Progress',
    startDate: '2025-09-10',
    endDate: '2025-12-25',
    createdAt: '2025-09-01',
    createdBy: 'Nguyễn Văn A',
    progress: 72,
  });

  const [members] = useState([
    {
      id: '1',
      name: 'Nguyen Van A',
      email: 'a@example.com',
      role: 'Project Manager',
      joinedDate: '2025-10-01',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Tran Thi B',
      email: 'b@example.com',
      role: 'Frontend Developer',
      joinedDate: '2025-10-05',
      status: 'Pending',
    },
    {
      id: '3',
      name: 'Le Van C',
      email: 'c@example.com',
      role: 'Backend Developer',
      joinedDate: '2025-10-07',
      status: 'Active',
    },
    {
      id: '4',
      name: 'Pham Thi D',
      email: 'd@example.com',
      role: 'Tester',
      joinedDate: '2025-10-10',
      status: 'Active',
    },
    {
      id: '5',
      name: 'Tran Van E',
      email: 'e@example.com',
      role: 'UI Designer',
      joinedDate: '2025-10-11',
      status: 'Pending',
    },
  ]);

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

  // --- STATE FOR FILTERS ---
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRange, setMemberRange] = useState<any>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketRange, setTicketRange] = useState<any>(null);

  // --- PAGINATION STATES ---
  const [memberPage, setMemberPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const rowsPerPage = 3;

  // --- FILTERED MEMBERS ---
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchName = m.name.toLowerCase().includes(memberSearch.toLowerCase());
      const matchDate =
        !memberRange ||
        (dayjs(m.joinedDate).isAfter(memberRange[0], 'day') &&
          dayjs(m.joinedDate).isBefore(memberRange[1], 'day'));
      return matchName && matchDate;
    });
  }, [members, memberSearch, memberRange]);

  // --- FILTERED TICKETS ---
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchTitle = t.title.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchDate =
        !ticketRange ||
        (dayjs(t.date).isAfter(ticketRange[0], 'day') &&
          dayjs(t.date).isBefore(ticketRange[1], 'day'));
      return matchTitle && matchDate;
    });
  }, [tickets, ticketSearch, ticketRange]);

  // --- PAGINATED DATA ---
  const pagedMembers = useMemo(() => {
    const start = (memberPage - 1) * rowsPerPage;
    return filteredMembers.slice(start, start + rowsPerPage);
  }, [filteredMembers, memberPage]);

  const pagedTickets = useMemo(() => {
    const start = (ticketPage - 1) * rowsPerPage;
    return filteredTickets.slice(start, start + rowsPerPage);
  }, [filteredTickets, ticketPage]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-10 space-y-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Layers className="text-indigo-600 w-6 h-6" />
              {project.name}
            </h1>
            <p className="text-gray-500 text-sm">Code: {project.code}</p>
          </div>
          <span
            className={`mt-3 md:mt-0 px-4 py-1.5 text-sm font-semibold rounded-full ${
              project.status === 'In Progress'
                ? 'bg-yellow-100 text-yellow-700'
                : project.status === 'Done'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {project.status}
          </span>
        </div>

        {/* PROJECT INFO */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem
            icon={<Calendar />}
            label="Start Date"
            value={new Date(project.startDate).toLocaleDateString('vi-VN')}
          />
          <InfoItem
            icon={<Calendar />}
            label="End Date"
            value={new Date(project.endDate).toLocaleDateString('vi-VN')}
          />
          <InfoItem icon={<User />} label="Created By" value={project.createdBy} />
          <InfoItem
            icon={<Calendar />}
            label="Created At"
            value={new Date(project.createdAt).toLocaleDateString('vi-VN')}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
            <ClipboardList className="text-indigo-500 w-5 h-5" />
            Description
          </h2>
          <p className="text-gray-700 leading-relaxed">{project.description}</p>
        </div>

        {/* PROGRESS */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            Project Progress
          </h2>
          <div className="flex items-center gap-4">
            <Progress value={project.progress} className="w-full h-4 bg-gray-200" />
            <span className="font-semibold text-gray-700">{project.progress}%</span>
          </div>
        </div>

        {/* MEMBERS TABLE */}
        <div>
          <div className="flex flex-col mb-3 gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
              <Users className="text-indigo-500 w-5 h-5" />
              Project Members
            </h2>

            <div className="flex flex-wrap justify-between items-center gap-3">
              <Input
                prefix={<Search size={20} />}
                placeholder="Search by member name..."
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberPage(1); // reset page
                }}
                className="flex-1 min-w-[280px] max-w-[400px]"
              />

              <RangePicker
                onChange={(val) => {
                  setMemberRange(val);
                  setMemberPage(1);
                }}
                placeholder={['Start date', 'End date']}
                className="min-w-[220px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Joined Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pagedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-6 py-3 text-gray-600">{m.email}</td>
                    <td className="px-6 py-3 text-gray-700">{m.role}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(m.joinedDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          m.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Stack spacing={2}>
              <Pagination
                count={Math.ceil(filteredMembers.length / rowsPerPage)}
                page={memberPage}
                onChange={(_, value) => setMemberPage(value)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          </div>
        </div>

        {/* TICKETS TABLE */}
        <div>
          <div className="flex flex-col mb-3 gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
              <MessageSquare className="text-indigo-500 w-5 h-5" />
              Project Tickets
            </h2>

            <div className="flex flex-wrap justify-between items-center gap-3">
              <Input
                prefix={<Search size={20} />}
                placeholder="Search by ticket title..."
                value={ticketSearch}
                onChange={(e) => {
                  setTicketSearch(e.target.value);
                  setTicketPage(1);
                }}
                className="flex-1 min-w-[280px] max-w-[400px]"
              />

              <div className="flex items-center gap-2">
                <RangePicker
                  onChange={(val) => {
                    setTicketRange(val);
                    setTicketPage(1);
                  }}
                  placeholder={['Start date', 'End date']}
                  className="min-w-[220px]"
                />
                <button
                  onClick={handleCreateTicket}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-full shadow-md transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Ticket
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pagedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-800">#{t.id}</td>
                    <td className="px-6 py-3 text-gray-700">{t.title}</td>
                    <td className="px-6 py-3 text-gray-600">{t.assignee}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          t.status === 'Done'
                            ? 'bg-green-100 text-green-700'
                            : t.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : t.status === 'In Review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Stack spacing={2} alignItems="center">
              <Pagination
                count={Math.ceil(filteredTickets.length / rowsPerPage)}
                page={ticketPage}
                onChange={(_, value) => setTicketPage(value)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          </div>
        </div>
        {/* CHART 1: Sprint Task Overview */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
            <BarChart3 className="text-indigo-500 w-5 h-5" />
            Sprint Task Overview
          </h2>
          <div className="bg-white border rounded-2xl shadow-inner p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sprintData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#CBD5E1" name="Total Tasks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" fill="#6366F1" name="Completed Tasks" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>
                🟦 <strong>{sprintData.reduce((a, b) => a + b.done, 0)}</strong> done tasks
              </span>
              <span>
                📊 Total: <strong>{sprintData.reduce((a, b) => a + b.total, 0)}</strong> tasks
              </span>
            </div>
          </div>
        </div>

        {/* CHART 2: Tickets per Sprint */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
            <ClipboardList className="text-indigo-500 w-5 h-5" />
            Tickets per Sprint
          </h2>
          <div className="bg-white border rounded-2xl shadow-inner p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ticketsPerSprintData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'created') return [`${value}`, 'Created Tickets'];
                    if (name === 'done') return [`${value}`, 'Processed Tickets'];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="created"
                  fill="#93C5FD"
                  name="Created Tickets"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="done" fill="#4F46E5" name="Processed Tickets" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>
                🟦 Created:{' '}
                <strong>{ticketsPerSprintData.reduce((a, b) => a + b.created, 0)}</strong>
              </span>
              <span>
                ✅ Processed:{' '}
                <strong>{ticketsPerSprintData.reduce((a, b) => a + b.done, 0)}</strong>
              </span>
            </div>
          </div>
        </div>
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
