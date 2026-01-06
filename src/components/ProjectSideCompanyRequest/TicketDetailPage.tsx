/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Progress,
  Tag,
  Divider,
  Tooltip,
  Spin,
  Avatar,
  Input,
  Modal,
  DatePicker,
  Select,
} from 'antd';
import {
  MessageSquare,
  Layers,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Mail,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import dayjs from 'dayjs';

//call api
import { GetTicketById } from '@/services/TicketService.js';
import { GetProjectByProjectId } from '@/services/projectService.js';
import { getUserById } from '@/services/userService.js';
import {
  GetCommentsByTicketId,
  CreateComment,
  DeleteComment,
} from '@/services/ticketCommentService.js';
import { AcceptTicket } from '@/services/TicketService.js';

//modal
import EditTicketModal from '@/components/ProjectSideCompanyRequest/EditTicketModal';
import DeleteTicketModal from '@/components/ProjectSideCompanyRequest/DeleteTicketModal';
import EditTicketComment from '@/components/ProjectSideCompanyRequest/EditTicketComment';
import RejectTicketModal from '@/components/Ticket/RejectTicketModal';
import RestoreTicketModal from './RestoreTicketModal';

//inter face and react
import { useParams } from 'react-router-dom';
import type { ITicket } from '@/interfaces/Ticket/Ticket';
import type { ProjectDetailResponse } from '@/interfaces/Project/project';
import type { User as IUser } from '@/interfaces/User/User';
import type {
  TicketCommentApiResponse,
  TicketCommentResponse,
} from '@/interfaces/TicketComment/ticketComment';
import { toast } from 'react-toastify';
import { useDebounce } from '@/hook/Debounce';
import { useLocation } from 'react-router-dom';
import TicketTasksSection from '@/components/Ticket/TicketTasksSection';
import { Can } from '@/permission/PermissionProvider';

const { confirm } = Modal;

const TICKET_TYPE_COLOR_MAP: Record<string, string> = {
  Bug: 'red',
  Enhancement: 'blue',
  NewFeature: 'green',
  Task: 'default',
  Hotfix: 'volcano',
  Improvement: 'cyan',
  Spike: 'purple',
};

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<ITicket>();
  const [projects, setProject] = useState<ProjectDetailResponse>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUser>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [comments, setComment] = useState<TicketCommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [editingComment, setEditingComment] = useState<TicketCommentResponse | null>(null);
  const [searchKey, setSearchKey] = useState('');
  const debouncedSearchKey = useDebounce(searchKey, 500);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const fromDate = dateRange?.[0]?.format('YYYY-MM-DD') ?? '';
  const toDate = dateRange?.[1]?.format('YYYY-MM-DD') ?? '';
  const [loadingComments, setLoadingComments] = useState(false);
  const [sortOrder, setSortOrder] = useState<true | false>(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTicketId, setRejectTicketId] = useState<string | null>(null);
  const location = useLocation();
  const { viewMode } =
    (location.state as { viewMode?: 'AsRequester' | 'AsExecutor' } | undefined) ?? {};
  // const viewMode = vw ?? 'AsRequester';
  console.log('viewMode Ticketdetail:', viewMode);
  const handleAcceptTicket = async (ticketId: string) => {
    try {
      const res = await AcceptTicket(ticketId);
      if (res.succeeded) {
        toast.success(res.message || 'Ticket accepted successfully!');
        setTicket((prev) => (prev ? { ...prev, status: 'Accepted' } : prev));
      } else {
        toast.error(res.message || 'Failed to accept ticket');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error accepting ticket');
    }
  };
  const handleOpenRejectModal = (ticketId: string) => {
    setRejectTicketId(ticketId);
    setIsRejectModalOpen(true);
  };
  console.log('ticket ', ticket);
  useEffect(() => {
    if (!ticketId) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const data = await GetTicketById(ticketId);
        setTicket(data.data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;

    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response: TicketCommentApiResponse = await GetCommentsByTicketId(
          ticketId,
          debouncedSearchKey,
          fromDate,
          toDate,
          '',
          1,
          1000,
          'createAt',
          sortOrder,
        );
        if (response.statusCode === 200) {
          setComment(response.data?.items ?? []);
        }
      } catch (error) {
        console.error('Error fetching ticket comments:', error);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [ticketId, debouncedSearchKey, dateRange, sortOrder]);

  useEffect(() => {
    if (!ticket?.projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await GetProjectByProjectId(ticket?.projectId ?? undefined);
        setProject(data.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [ticket?.projectId]);

  useEffect(() => {
    if (!ticket?.projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await getUserById(ticket?.submittedBy ?? undefined);
        setUser(data.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [ticket?.submittedBy]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      const requestBody = {
        ticketId: ticketId!,
        body: newComment,
      };

      const response = await CreateComment(requestBody);
      if (response.succeeded) {
        setNewComment('');
        toast.success(response.message);

        const refreshed: TicketCommentApiResponse = await GetCommentsByTicketId(ticketId!);
        if (refreshed.statusCode === 200) {
          setComment(refreshed.data?.items ?? []);
        }
      } else {
        toast.error(response.message || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Error creating comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center mt-20 text-gray-500">Ticket not found</div>;
  }
  // ===== Ticket process summary (tự tính theo nghiệp vụ) =====
  const process = ticket.process;

  // BE trả về danh sách item chi tiết
  const items = process?.items ?? [];

  // Tổng task non-backlog của ticket
  const totalNonBacklog =
    process?.totalNonBacklogTasks && process.totalNonBacklogTasks > 0
      ? process.totalNonBacklogTasks
      : items.length;

  // Đã bắt đầu: có startedAt
  const startedCount = items.filter((x: any) => !!x.startedAt).length;

  // Hoàn thành: status hiện tại IsEnd => isDone = true
  const doneCount = items.filter((x: any) => x.isDone).length;

  // Đang xử lý: đã start nhưng chưa done
  const activeCount = items.filter((x: any) => !!x.startedAt && !x.isDone).length;

  // Có process khi có ít nhất 1 task non-backlog
  const hasProcess = !!process && totalNonBacklog > 0;

  // Progress = done / totalNonBacklog
  const progressPercent =
    hasProcess && totalNonBacklog > 0
      ? Math.max(0, Math.min(100, (doneCount * 100) / totalNonBacklog))
      : 0;

  // Thời gian bắt đầu / kết thúc (dùng luôn field BE trả về)
  const firstStartedAt = process?.firstStartedAt ? dayjs(process.firstStartedAt) : null;

  const lastDoneAt = process?.lastDoneAt ? dayjs(process.lastDoneAt) : null;

  const priorityColor =
    ticket.priority === 'High' ? 'red' : ticket.priority === 'Medium' ? 'orange' : 'blue';

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'DONE':
        return 'green';
      case 'ONGOING':
        return 'orange';
      case 'CLOSED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getTicketStatusColor = (status?: string) => {
    switch (status) {
      case 'Pending':
        return 'gray';
      case 'Accepted':
        return 'blue';
      case 'Rejected':
        return 'red';
      case 'Finished':
        return 'green';
      default:
        return 'default';
    }
  };
  const getTicketTypeColor = (type?: string) => {
    if (!type) return 'default';
    return TICKET_TYPE_COLOR_MAP[type] ?? 'default';
  };

  const handleDeleteComment = (commentId: number) => {
    confirm({
      title: 'Are you sure you want to delete this comment?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const res = await DeleteComment(commentId);
          if (res.succeeded) {
            toast.success(res.message);
            setComment((prev) => prev.filter((c) => c.id !== commentId));
          } else {
            toast.error(res.message || 'Failed to delete comment');
          }
        } catch (error) {
          console.error(error);
          toast.error('Error deleting comment');
        }
      },
    });
  };
  return (
    <div className="p-4 mx-auto space-y-3 max-w-6xl rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-[-7px]">
        <MessageSquare className="text-indigo-500 w-6 h-6 mb-2" />
        <h1 className="text-2xl font-semibold text-gray-800">Ticket Detail</h1>
      </div>

      {/* Ticket Info */}
      <Card className="shadow-md rounded-xl border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex items-center gap-1 mb-1">
            <h2 className="text-xl font-semibold text-gray-900">{ticket.ticketName}</h2>
            <div className="flex items-start lg:items-center gap-2">
              {/* <Tag
                color={priorityColor}
                className="text-sm font-medium px-3 py-1 rounded-md mb-2 ml-1"
              >
                {ticket.priority}
              </Tag>
              <Tag
                color={getTicketTypeColor(ticket.ticketType)}
                className={`text-sm font-semibold px-3 py-1 rounded-md mb-2 ${
                  ticket.ticketType === 'Bug' || ticket.ticketType === 'Hotfix' ? 'uppercase' : ''
                }`}
              >
                {ticket.ticketType}
              </Tag> */}
              <Tag
                color={getTicketStatusColor(ticket.status)}
                className="text-sm font-medium px-2 py-1 rounded-md mb-2"
              >
                {ticket.status}
              </Tag>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-start lg:items-center">
            {/* Edit button (Requester) */}
            {ticket.status === 'Pending' && !ticket.isDeleted && viewMode === 'AsRequester' && (
              <Can code="TICKET_UPDATE">
                <Button
                  type="primary"
                  icon={<Edit size={16} />}
                  className="flex items-center gap-1"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit
                </Button>
              </Can>
            )}

            {/* Accept / Reject buttons (Executor) */}
            {ticket.status === 'Pending' && !ticket.isDeleted && viewMode === 'AsExecutor' && (
              <div className="flex gap-2">
                <Button
                  type="primary"
                  icon={<CheckCircle size={16} />}
                  style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
                  className="flex items-center gap-1"
                  onClick={() => handleAcceptTicket(ticket.id)}
                >
                  Accept
                </Button>
                <Button
                  danger
                  icon={<XCircle size={16} />}
                  className="flex items-center gap-1"
                  onClick={() => handleOpenRejectModal(ticket.id)}
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Delete / Restore button */}
            {ticket.isDeleted ? (
              <Button
                icon={<CheckCircle size={16} />}
                style={{ backgroundColor: '#22c55e', borderColor: '#22c55e', color: 'white' }}
                className="flex items-center gap-1"
                onClick={() => setIsRestoreModalOpen(true)}
              >
                Restore
              </Button>
            ) : (
              <Can code="TICKET_DELETE">
                <Button
                  danger
                  icon={<Trash2 size={16} />}
                  className="flex items-center gap-1"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete
                </Button>
              </Can>
            )}
          </div>
        </div>
        <div className="mt-2 rounded-lg">
          <p className="text-gray-800 text-sm font-semibold mb-1 flex items-center gap-1">
            <MessageSquare size={14} className="text-indigo-500" /> Description
          </p>
          <p className="text-gray-700 leading-relaxed line-clamp-3">
            {ticket.description || 'No description provided.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 text-sm">
          <span className="flex items-center gap-2 text-gray-700">
            <DollarSign size={14} /> <b>Budget:</b> {ticket.budget ?? '-'}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} /> <b>Created:</b> {dayjs(ticket.createdAt).format('DD/MM/YYYY')}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} /> <b>Resolved:</b>{' '}
            {ticket.resolvedAt ? dayjs(ticket.resolvedAt).format('DD/MM/YYYY') : '---'}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} /> <b>Closed:</b>{' '}
            {ticket.closedAt ? dayjs(ticket.closedAt).format('DD/MM/YYYY') : '---'}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} />
            <b>Is Highest Urgent:</b>
            <span
              className={`mt-0.5 px-2 rounded-full text-white font-semibold ${
                ticket.isHighestUrgen ? 'bg-red-500' : 'bg-gray-400'
              }`}
            >
              {ticket.isHighestUrgen ? 'YES' : 'NO'}
            </span>
          </span>

          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} /> <b>Update Date:</b>{' '}
            {ticket.updatedAt ? dayjs(ticket.updatedAt).format('DD/MM/YYYY') : '-'}
          </span>
          {/* Priority */}
          <span className="flex items-center gap-2 text-gray-700">
            <AlertCircle size={14} />
            <b>Priority:</b>
            <Tag color={priorityColor} className="font-medium">
              {ticket.priority}
            </Tag>
          </span>

          {/* Ticket Type */}
          <span className="flex items-center gap-2 text-gray-700">
            <ClipboardList size={14} />
            <b>Type:</b>
            <Tag
              color={getTicketTypeColor(ticket.ticketType)}
              className={`font-medium ${
                ticket.ticketType === 'Bug' || ticket.ticketType === 'Hotfix' ? 'uppercase' : ''
              }`}
            >
              {ticket.ticketType}
            </Tag>
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Layers size={14} /> <b>Ticket Status:</b>
            <Tag color={getTicketStatusColor(ticket.status)} className="font-medium">
              {ticket.status}
            </Tag>
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <AlertTriangle size={14} /> <b>Reason:</b> {ticket.reason || '---'}
          </span>
        </div>

        <Divider className="my-4" />

        <div>
          <p className="text-sm mb-1 text-gray-600 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers size={14} className="text-indigo-500" />
              Ticket execution progress
            </span>

            {hasProcess && (
              <span className="text-gray-700 font-medium">
                {doneCount}/{totalNonBacklog} tasks done
              </span>
            )}
          </p>

          <Progress
            percent={progressPercent}
            status={
              !hasProcess
                ? 'normal'
                : doneCount === totalNonBacklog && totalNonBacklog > 0
                ? 'success'
                : 'active'
            }
            format={(percent) =>
              hasProcess ? `${Math.round(percent ?? 0)}%` : 'No sprint execution yet'
            }
            strokeColor={{
              '0%': '#e5e7eb',
              '30%': '#f97316',
              '60%': '#3b82f6',
              '100%': '#22c55e',
            }}
          />

          {hasProcess ? (
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
              <span>
                <b>Started:</b> {startedCount}/{totalNonBacklog}
              </span>
              <span>
                <b>In progress:</b> {activeCount}
              </span>
              <span>
                <b>Done:</b> {doneCount}
              </span>
              {firstStartedAt && (
                <span>
                  <b>First started:</b> {firstStartedAt.format('DD/MM/YYYY HH:mm')}
                </span>
              )}
              {lastDoneAt && (
                <span>
                  <b>Last done:</b> {lastDoneAt.format('DD/MM/YYYY HH:mm')}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Info size={14} className="text-gray-400" />
              This ticket has no sprint execution yet. Tasks are still in backlog or not created.
            </p>
          )}
        </div>
      </Card>
      {ticket.component && (
        <Card className="shadow-sm rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Layers size={18} className="text-indigo-500" />
            Component Project Maintence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-700">
            <span>
              <b>Name:</b> {ticket.component.name}
            </span>

            <span>
              <b>Created At:</b> {dayjs(ticket.component.createdAt).format('DD/MM/YYYY')}
            </span>

            <span className="md:col-span-2">
              <b>Description:</b> {ticket.component.description || '---'}
            </span>
          </div>
        </Card>
      )}

      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="shadow-sm rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Layers size={18} className="text-indigo-500" /> Project Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-700">
            <span>
              <b>Name:</b> {projects?.name}
            </span>
            <span>
              <b>Code:</b> {projects?.code}
            </span>
            <span>
              <b>Created By:</b> {projects?.createByName}
            </span>
            <span className="flex items-center gap-1">
              <b>Status:</b>{' '}
              <Tag color={getStatusColor(projects?.status ?? undefined)} className="font-medium">
                {projects?.status ?? '-'}
              </Tag>
            </span>
            <span>
              <b>Requester:</b> {projects?.companyRequestName}
            </span>
            <span>
              <b>Executor:</b> {projects?.companyExecutorName}
            </span>
            <span>
              <b>Start:</b> {projects?.startDate && dayjs(projects.startDate).format('DD/MM/YYYY')}
            </span>
            <span>
              <b>End:</b> {projects?.endDate && dayjs(projects.endDate).format('DD/MM/YYYY')}
            </span>
            <span>
              <b>Created:</b> {projects?.createAt && dayjs(projects.createAt).format('DD/MM/YYYY')}
            </span>
            <span>
              <b>Project Type:</b> {projects?.isMaintenance ? 'Maintenance' : 'Development'}
            </span>
            <span className="col-span-2 mt-2 leading-relaxed">
              <b>Description:</b>{' '}
              <Tooltip title={projects?.description}>
                <span className="text-gray-600 line-clamp-2 cursor-pointer">
                  {projects?.description}
                </span>
              </Tooltip>
            </span>
          </div>
        </Card>
        {/* Submitted By */}
        <Card className="shadow-md rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <User size={20} className="text-indigo-500 mb-2.5" />
            <h3 className="text-lg font-semibold text-gray-800">Submitted By</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                size={110}
                src={user?.avatar || undefined}
                className="bg-indigo-500 text-white text-4xl border-4 border-white shadow-lg"
              >
                {user?.userName?.[0]}
              </Avatar>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <h4 className="text-xl font-semibold text-gray-800 mb-1">{user?.userName}</h4>
              <p className="text-gray-500 text-sm mb-4">Ticket Submitter</p>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="text-gray-500 w-4 h-4" />
                  <span className="font-medium text-gray-600 w-20">Phone:</span>
                  <span className="text-gray-900">{user?.phone ?? '-'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-orange-500 w-4 h-4" />
                  <span className="font-medium text-gray-600 w-20">Address:</span>
                  <span className="text-gray-900">{user?.address ?? '-'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-blue-500 w-4 h-4" />
                  <span className="font-medium text-gray-600 w-20">Email:</span>
                  <a href={`mailto:${user?.address}`} className="text-indigo-600 hover:underline">
                    {user?.email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <User className="text-purple-500 w-4 h-4" />
                  <span className="font-medium text-gray-600 w-20">Gender:</span>
                  <span className="text-gray-900">{user?.gender ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {ticket && viewMode === 'AsExecutor' && (
        <TicketTasksSection ticketId={ticket.id} projectId={ticket.projectId} />
      )}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-500" /> Comments
        </h3>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start">
          <div className="flex-1 flex flex-col">
            <label className="text-gray-900 text-sm font-semibold mb-1">Search Comments</label>
            <Input
              placeholder="Search comments..."
              className="rounded-xl"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-gray-900 text-sm font-semibold mb-1">Filter by Date</label>
            <DatePicker.RangePicker
              className="w-full rounded-xl"
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-gray-900 text-sm font-semibold mb-1">Sort Comments</label>
            <Select
              placeholder="Sort by Created At"
              className="w-full rounded-xl"
              value={sortOrder}
              onChange={(value: true | false) => setSortOrder(value)}
            >
              <Select.Option value={true}>Newest First</Select.Option>
              <Select.Option value={false}>Oldest First</Select.Option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {loadingComments && (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 z-10 rounded-xl">
              <Spin size="large" />
            </div>
          )}
          {comments.slice(0, visibleCount).map((c) => (
            <div
              key={c.id}
              className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 relative"
            >
              <Avatar size={40} src={c.authorUserAvatar} className="flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{c.authorUserName}</span>
                  {c.isOwner && !ticket.isDeleted && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-gray-500 text-sm ml-2 whitespace-nowrap">
                    <Calendar size={14} className="" />
                    <span className="ml-1">{dayjs(c.createAt).format('DD/MM/YYYY HH:mm')}</span>
                  </span>
                </div>
                <p className="text-gray-700 break-words">{c.body}</p>

                {/* Action buttons for owner's comment */}
                {c.isOwner && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-100">
                    <Button
                      disabled={
                        ticket.isDeleted ||
                        ticket.status.toLocaleLowerCase() === 'Rejected'.toLocaleLowerCase()
                      }
                      type="text"
                      icon={<Edit size={16} />}
                      className="text-blue-500 hover:text-blue-600 p-0"
                      onClick={() => setEditingComment(c)}
                    />
                    <Button
                      disabled={
                        ticket.isDeleted ||
                        ticket.status.toLocaleLowerCase() === 'Rejected'.toLocaleLowerCase()
                      }
                      type="text"
                      icon={<Trash2 size={16} />}
                      className="text-red-500"
                      onClick={() => handleDeleteComment(c.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {visibleCount < comments.length && (
            <div className="flex justify-center mt-2">
              <Button
                type="default"
                className="rounded-full border-gray-500 text-gray-700 px-6 py-1.5 hover:bg-indigo-50 shadow-sm transition duration-200"
                onClick={() => setVisibleCount((prev) => prev + 5)}
              >
                Load More ({Math.min(5, comments.length - visibleCount)} remaining)
              </Button>
            </div>
          )}
          {/* Comment Form */}
          <div className="flex gap-3 items-start p-3 bg-white rounded-xl shadow-sm border border-gray-200">
            <Avatar size={40} src={user?.avatar} className="flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Input.TextArea
                rows={3}
                placeholder={
                  ticket.isDeleted
                    ? 'This ticket is deleted. Comments are disabled.'
                    : 'Write a comment...'
                }
                value={newComment}
                disabled={
                  ticket.isDeleted ||
                  ticket.status.toLocaleLowerCase() === 'Rejected'.toLocaleLowerCase()
                }
                onChange={(e) => setNewComment(e.target.value)}
                className="border rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 resize-none p-3 text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="primary"
                  disabled={
                    ticket.isDeleted ||
                    ticket.status.toLocaleLowerCase() === 'Rejected'.toLocaleLowerCase()
                  }
                  className="px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md"
                  onClick={handleCreateComment}
                >
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <EditTicketModal
        visible={isEditModalOpen}
        ticket={ticket}
        projectId={ticket.projectId}
        onCancel={() => setIsEditModalOpen(false)}
        onUpdated={async (updatedTicket) => {
          setTicket(updatedTicket);
          setIsEditModalOpen(false);
        }}
      />

      <DeleteTicketModal
        visible={isDeleteModalOpen}
        ticketId={ticket?.id}
        onCancel={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          setIsDeleteModalOpen(false);
          setTicket({ ...ticket!, isDeleted: true });
        }}
      />
      <RestoreTicketModal
        visible={isRestoreModalOpen}
        ticketId={ticket?.id}
        onCancel={() => setIsRestoreModalOpen(false)}
        onRestored={() => {
          setIsRestoreModalOpen(false);
          setTicket({ ...ticket!, isDeleted: false });
        }}
      />
      {editingComment && (
        <EditTicketComment
          comment={editingComment}
          visible={!!editingComment}
          onCancel={() => setEditingComment(null)}
          onUpdated={(updatedBody) => {
            setComment((prev) =>
              prev.map((c) => (c.id === editingComment.id ? { ...c, body: updatedBody } : c)),
            );
          }}
        />
      )}
      <RejectTicketModal
        open={isRejectModalOpen}
        ticketId={rejectTicketId}
        onClose={() => setIsRejectModalOpen(false)}
        onSuccess={(reason: string) => {
          setTicket((prev) => (prev ? { ...prev, status: 'Rejected', reason: reason } : prev));
        }}
      />
    </div>
  );
};

export default TicketDetailPage;
