/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Folder,
  Star,
  Clock,
  Search,
  Mars,
  Venus,
  User,
  Calendar,
  Eye,
  Trash,
  UserPlus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Pie,
  Cell,
  Line,
  LineChart,
  Tooltip,
  PieChart,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { getUserById } from '@/services/userService.js';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { User as IUser } from '@/interfaces/User/User';
import {
  GetCompanyMemberByCompanyIdAndUserId,
  FireMemberFromCompany,
  AddUserRolesToCompany,
} from '@/services/companyMemberService.js';
import type { CompanyMemberInterface } from '@/interfaces/Company/member';
import LoadingOverlay from '@/common/LoadingOverlay';
import { getProjectMemberByCompanyIdAndUserId } from '@/services/projectMember.js';
import type { IProjectMember } from '@/interfaces/ProjectMember/projectMember';
import DeleteProjectMember from '@/components/ProjectMember/DeleteProjectMember';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDebounce } from '@/hook/Debounce';
import { Paging } from '@/components/Paging/Paging';
import AddRoleModal from '@/components/Company/AccessRole/AddRoleCompanyMemberModal';

export default function CompanyMemberDetail() {
  const navigate = useNavigate();
  //state open delete popup
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  //state open add role popup
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);

  // pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalProjectCount, setTotalProjectCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 5,
    totalCount: 0,
  });

  //get companyid by use location of state
  const { state } = useLocation();
  const companyId = state?.companyId;

  //state loading
  const [loadingProject, setLoadingProject] = useState(false);
  const [loading, setLoading] = useState(false);

  //state loading delete
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [reasonDelete, setReasonDelete] = useState('');
  //state project membert
  const [listProjectMember, setListProjectMember] = useState<IProjectMember | undefined>();

  //state performance
  const [performance, setPerformance] = useState<any>({
    productivity: 0,
    communication: 0,
    teamwork: 0,
    problemSolving: 0,

    efficiency: {
      onTimePercent: 0,
      latePercent: 0,
      pendingPercent: 0,
    },

    priorityDistribution: {
      segments: [],
    },

    scoreTrendChart: {
      data: [],
    },
  });

  //state user
  const [user, setUser] = useState<IUser | undefined>();

  //state member
  const [member, setMember] = useState<CompanyMemberInterface | undefined>();

  //state search filter
  const [searchProjectName, setSearchProjectName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  //get userId from url
  const { Id } = useParams<{ Id: string }>();
  const debouncedSearch = useDebounce(searchProjectName, 300);
  const debouncedFilter = useDebounce(statusFilter, 300);

  const data = [
    { name: 'Productivity', value: performance?.productivity || 75 },
    { name: 'Communication', value: performance?.communication || 60 },
    { name: 'Teamwork', value: performance?.teamwork || 85 },
    { name: 'Problem Solving', value: performance?.problemSolving || 65 },
  ];

  //handle remove member
  const handleRemoveMember = async (memberId: string, reason: string) => {
    if (!member || !memberId) return;

    try {
      setLoadingDelete(true);

      const response = await FireMemberFromCompany(member.email, reasonDelete, member.companyId);
      setIsDeleteOpen(false);

      toast.success(response.message || 'Removed successfully');

      navigate(-1);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to remove member.');
    } finally {
      setLoadingDelete(false);
    }
  };
  //handle backto list
  const handleBackToList = () => {
    navigate(-1);
  };

  const GenderIcon = () => {
    if (user?.gender === 'Male') return <Mars size={16} className="text-blue-500" />;
    if (user?.gender === 'Female') return <Venus size={16} className="text-pink-500" />;
    return <User size={16} className="text-gray-500" />;
  };
  //fetch api getProjectMemberByCompanyIdAndUserId
  const fetchGetProjectMemberByCompanyIdAndUserId = async () => {
    try {
      setLoadingProject(true);

      const response = await getProjectMemberByCompanyIdAndUserId(
        companyId,
        Id,
        searchProjectName ?? '',
        statusFilter ?? '',
        null,
        null,
        pagination.pageNumber,
        pagination.pageSize,
        null,
        null,
      );
      setListProjectMember(response.data.items[0]);

      setPagination((prev) => ({
        ...prev,
        totalCount: response.data.totalCount ?? 0,
      }));
    } catch (error: any) {
      console.log(error);
      setListProjectMember(undefined);
    } finally {
      setTimeout(() => setLoadingProject(false), 250);
    }
  };
  //fetch api get user by id
  const fetchGetUserById = async () => {
    try {
      setLoading(true);
      if (!Id) return;
      const response = await getUserById(Id);
      const data = response.data;
      setUser(data);
    } catch (error: any) {
      console.log(error);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };
  //fetch api get company member by company id and userid
  const fetchCompanyMemberByCompanyIdAndUserId = async () => {
    try {
      const response = await GetCompanyMemberByCompanyIdAndUserId(companyId, Id);
      const data = response.data;
      const perf = {
        productivity: data.productivity ?? 0,
        communication: data.communication ?? 0,
        teamwork: data.teamwork ?? 0,
        problemSolving: data.problemSolving ?? 0,

        efficiency: {
          onTimePercent: data.efficiency.onTimePercent ?? 0,
          latePercent: data.efficiency.latePercent ?? 0,
          pendingPercent: data.efficiency.pendingPercent ?? 0,
        },
        priorityDistribution: {
          segments: data.priorityDistribution?.segments ?? [],
        },
        scoreTrendChart: {
          data: data.scoreTrendChart?.data ?? [],
        },
      };

      setPerformance(perf);
      setMember(response.data);
    } catch (error: any) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchGetUserById();
    fetchGetProjectMemberByCompanyIdAndUserId();
    fetchCompanyMemberByCompanyIdAndUserId();
  }, [Id]);

  // debounce
  useEffect(() => {
    fetchGetProjectMemberByCompanyIdAndUserId();
  }, [debouncedSearch, debouncedFilter]);

  //paging
  useEffect(() => {
    fetchGetProjectMemberByCompanyIdAndUserId();
  }, [pagination.pageNumber, pagination.pageSize]);

  return (
    <div className="relative">
      <LoadingOverlay loading={loadingProject} message="Loading..." />
      <LoadingOverlay loading={loading} message="Loading..." />

      <div className={`${loading ? 'pointer-events-none opacity-40' : ''}`}>
        <div className="p-8 bg-white-50 min-h-screen text-gray-800">
          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="col-span-1 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div>
                  <img
                    src={user?.avatar}
                    className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-white text-3xl font-bold shadow"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user?.userName}</h2>
                  <p className="text-gray-500">Product Manager</p>
                </div>

                <div className="text-sm space-y-2 text-gray-600 -mt-[5px]">
                  <p className="flex items-center gap-2 justify-center">
                    <Mail size={16} /> {user?.email}
                  </p>
                  <p className="flex items-center gap-2 justify-center">
                    <GenderIcon /> {user?.gender}
                  </p>
                  <p className="flex items-center gap-2 justify-center">
                    <Phone size={16} /> {user?.phone}
                  </p>
                  <p className="flex items-center gap-2 justify-center">
                    <Calendar size={16} />{' '}
                    {member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString('vi-VN') : '—'}
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-4">
                  <button className="flex-1 py-2 rounded-lg border bg-gray-300 border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm font-medium">
                    <MessageSquare size={16} /> Message
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="flex-1 py-2 rounded-lg border border-red-300 bg-red-500 text-white hover:bg-red-600 hover:shadow-md transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Trash size={16} /> Remove Member
                  </button>
                  <button
                    onClick={() => setIsAddRoleOpen(true)}
                    className="flex-1 py-2 rounded-lg border border-green-300 bg-green-500 text-white hover:bg-green-600 hover:shadow-md transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <UserPlus size={16} /> Add Role
                  </button>
                </div>

                <div className="flex justify-around w-full py-4 mt-3 border-t border-gray-100">
                  <div className="flex flex-col items-center">
                    <Folder size={20} className="text-blue-500 mb-1" />
                    <span className="text-sm font-semibold">{listProjectMember?.totalProject}</span>
                    <p className="text-xs text-gray-500">Projects</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Star size={20} className="text-yellow-500 mb-1" />
                    <span className="text-sm font-semibold">{member?.score}</span>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock size={20} className="text-purple-500 mb-1" />
                    <span className="text-sm font-semibold">{member?.hoursPerWeek}</span>
                    <p className="text-xs text-gray-500">hr/week</p>
                  </div>
                </div>

                <button
                  className="w-full py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                  onClick={handleBackToList}
                >
                  Back to Members List
                </button>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
              <div className="h-full">
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={data}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-2 space-y-6">
              {/* Three Chart */}
              <div className="flex flex-col md:flex-row gap-6 w-full">
                {/* Efficiency Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1">
                  <h4 className="font-semibold mb-2">Efficiency</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[
                        { name: 'On Time', value: performance?.efficiency?.onTimePercent ?? 0 },
                        { name: 'Late', value: performance?.efficiency?.latePercent ?? 0 },
                        { name: 'Pending', value: performance?.efficiency?.pendingPercent ?? 0 },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1 flex flex-col items-center">
                  <h4 className="font-semibold mb-2">Priority Distribution</h4>

                  {/* PieChart */}
                  <div className="w-full flex justify-center">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={performance?.priorityDistribution?.segments ?? []}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          cx="50%"
                          cy="50%"
                        >
                          {(performance?.priorityDistribution?.segments ?? []).map(
                            (seg: any, i: number) => (
                              <Cell key={i} fill={seg.color || '#8884d8'} />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                    {(performance?.priorityDistribution?.segments ?? []).map(
                      (seg: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: seg.color || '#8884d8' }}
                          ></span>
                          {seg.name}: {seg.value}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Score Trend */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1">
                  <h4 className="font-semibold mb-2">Score Trend</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={performance?.scoreTrendChart?.data ?? []}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="userScore"
                        stroke="#3b82f6"
                        fill="url(#colorScore)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6"></div>

              {/* Projects Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                  {/* Search */}
                  <div className="relative w-1/3 ">
                    <Search size={18} className="absolute left-2 top-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search project..."
                      className="pl-8 pr-3 py-2 border-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-300 outline-none"
                      onChange={(e) => setSearchProjectName(e.target.value)}
                    />
                  </div>

                  {/* Filter */}
                  <select
                    className="px-3 py-2 border-2 rounded-lg text-sm text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-300"
                    onChange={(e) =>
                      setStatusFilter(e.target.value === 'All' ? '' : e.target.value)
                    }
                  >
                    <option>All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-gray-600 border-b bg-gray-50">
                      <th className="p-3 font-medium">Project Code</th>
                      <th className="p-3 font-medium">Project name</th>
                      <th className="p-3 font-medium ">isHire</th>
                      <th className="p-3 font-medium text-center">Start Date</th>
                      <th className="p-3 font-medium text-center">End Date</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(listProjectMember?.projects) &&
                    listProjectMember.projects.length > 0 ? (
                      listProjectMember.projects.map((proj) => (
                        <tr
                          key={proj.id}
                          className="border-b hover:bg-blue-50 transition cursor-pointer"
                          onClick={() => navigate(`/project-detail/${proj.id}`)}
                        >
                          <td className="p-3 font-medium text-gray-800">{proj.code}</td>
                          <td className="p-3 text-gray-800">{proj.name}</td>
                          <td className="p-3 text-gray-800">{proj.isHired ? 'Yes' : 'No'}</td>

                          <td className="p-3 text-center">
                            {proj.startDate
                              ? new Date(proj.startDate).toLocaleDateString('vi-VN')
                              : '--'}
                          </td>
                          <td className="p-3 text-center">
                            {proj.endDate
                              ? new Date(proj.endDate).toLocaleDateString('vi-VN')
                              : '--'}
                          </td>

                          <td className="p-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                proj.status === 'Active'
                                  ? 'bg-green-100 text-green-600'
                                  : proj.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {proj.status ?? '--'}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 text-sm mx-auto"
                              onClick={() => navigate(`/project-detail/${proj.id}`)}
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-gray-500">
                          Don't have project for members with company
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="w-full mt-3">
                  <Paging
                    page={pagination.pageNumber}
                    pageSize={pagination.pageSize}
                    totalCount={pagination.totalCount}
                    onPageChange={(page) => {
                      setPagination((prev) => ({ ...prev, pageNumber: page }));
                      fetchGetProjectMemberByCompanyIdAndUserId();
                    }}
                    onPageSizeChange={(size) => {
                      setPagination((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }));
                      fetchGetProjectMemberByCompanyIdAndUserId();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeleteProjectMember
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => handleRemoveMember(member?.memberId || '', reasonDelete)}
        memberName={member?.memberName}
        companyName={member?.companyName}
      />
      <AddRoleModal
        companyId={companyId}
        isOpen={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        onConfirm={async (selectedRoles) => {
          try {
            await AddUserRolesToCompany(companyId, {
              userId: Id || '',
              roleIds: selectedRoles.map((role) => role.id),
            });
            toast.success('Roles added successfully!');
          } catch (error: any) {
            toast.error(error.message || 'Failed to add roles');
          } finally {
            setIsAddRoleOpen(false);
          }
        }}
      />
      <LoadingOverlay loading={loadingDelete} message="Removing member..." />
    </div>
  );
}
