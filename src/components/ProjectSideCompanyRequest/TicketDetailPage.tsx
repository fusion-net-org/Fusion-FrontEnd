/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, Button, Progress, Tag, Divider, Tooltip, Spin, Avatar, Input } from 'antd';
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
} from 'lucide-react';
import dayjs from 'dayjs';
import { GetTicketById } from '@/services/TicketService.js';
import { GetProjectByProjectId } from '@/services/projectService.js';
import { useParams } from 'react-router-dom';
import type { ITicket } from '@/interfaces/Ticket/Ticket';
import type { ProjectDetailResponse } from '@/interfaces/Project/project';
import { getUserById } from '@/services/userService.js';
import type { User as IUser } from '@/interfaces/User/User';
import EditTicketModal from '@/components/ProjectSideCompanyRequest/EditTicketModal';
import DeleteTicketModal from '@/components/ProjectSideCompanyRequest/DeleteTicketModal';

interface Comment {
  id: number;
  author: { userName: string };
  createAt: string;
  body: string;
}

const fakeComments: Comment[] = [
  {
    id: 1,
    author: { userName: 'Alice' },
    createAt: new Date().toISOString(),
    body: 'This is a sample comment!',
  },
  {
    id: 2,
    author: { userName: 'Bob' },
    createAt: new Date().toISOString(),
    body: 'Another comment to test the UI.',
  },
];

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<ITicket>();
  const [projects, setProject] = useState<ProjectDetailResponse>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUser>();
  const [progressValue, setProgressValue] = useState<number>();
  const progressPercent = 65;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  return (
    <div className="p-4 mx-auto space-y-3 max-w-6xl rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="text-indigo-500 w-6 h-6" />
        <h1 className="text-2xl font-semibold text-gray-800">Ticket Detail</h1>
      </div>

      {/* Ticket Info */}
      <Card className="shadow-md rounded-xl border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{ticket.ticketName}</h2>
            <p className="text-gray-600 mt-1">{ticket.description}</p>
          </div>

          <div className="flex items-start lg:items-center gap-2">
            <Tag color={priorityColor} className="text-sm font-medium px-3 py-1 rounded-md">
              {ticket.priority}
            </Tag>
          </div>

          <div className="flex gap-2">
            <Tooltip title="Edit Ticket">
              <Button
                type="default"
                shape="circle"
                icon={
                  <Edit
                    className="text-blue-500 w-4 h-4"
                    onClick={() => setIsEditModalOpen(true)}
                  />
                }
              />
            </Tooltip>
            <Tooltip title="Delete Ticket">
              <Button
                danger
                shape="circle"
                icon={
                  <Trash2
                    className="text-red-500 w-4 h-4"
                    onClick={() => setIsDeleteModalOpen(true)}
                  />
                }
              />
            </Tooltip>
          </div>
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
            {ticket.resolvedAt ? dayjs(ticket.resolvedAt).format('DD/MM/YYYY') : '-'}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} /> <b>Closed:</b>{' '}
            {ticket.closedAt ? dayjs(ticket.closedAt).format('DD/MM/YYYY') : '-'}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} />
            <b>Is Highest Urgent:</b>
            {ticket.isHighestUrgen ? (
              <CheckCircle className="ml-2 text-red-500" size={16} />
            ) : (
              <XCircle className="ml-2 text-gray-400" size={16} />
            )}
          </span>
          <span className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} /> <b>Update Date:</b>{' '}
            {ticket.updatedAt ? dayjs(ticket.updatedAt).format('DD/MM/YYYY') : '-'}
          </span>
        </div>

        <Divider className="my-4" />

        <div>
          <p className="text-sm mb-1 text-gray-600 font-medium flex items-center justify-between">
            <span>Workflow Progress (Workflow name hard code)</span>
            <span className="text-gray-700 font-medium">{progressPercent}%</span>
          </p>

          <Progress
            percent={progressPercent}
            format={(percent) => `${percent}/100`}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      </Card>

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
            <User size={20} className="text-indigo-500" />
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

      <Card className="shadow-sm rounded-xl border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-500" /> Comments
        </h3>

        <div className="flex flex-col gap-3 mb-4">
          {fakeComments.map((c) => (
            <div
              key={c.id}
              className="border-l-4 border-indigo-500 pl-4 bg-gray-50 py-2 rounded-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-800">{c.author.userName}</span>
                <span className="text-gray-400 text-xs">
                  {dayjs(c.createAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
              <p className="text-gray-700">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Input.TextArea
            rows={3}
            placeholder="Write a comment..."
            className="border-none focus:ring-0 focus:outline-none p-3 text-sm resize-none"
          />
          <div className="flex justify-end bg-gray-50 px-3 py-2 border-t border-gray-100">
            <Button type="primary" className="px-6 rounded-md">
              Comment
            </Button>
          </div>
        </div>
      </Card>

      <EditTicketModal
        visible={isEditModalOpen}
        ticket={ticket}
        onCancel={() => setIsEditModalOpen(false)}
        onSubmit={(values) => {
          console.log('Updated ticket:', values);
          setIsEditModalOpen(false);
        }}
      />

      <DeleteTicketModal
        visible={isDeleteModalOpen}
        ticketId={ticket?.id}
        onCancel={() => setIsDeleteModalOpen(false)}
        onDelete={(ticketId, reason) => {
          console.log('Delete ticket:', ticketId, 'Reason:', reason);
          setIsDeleteModalOpen(false);
        }}
      />
    </div>
  );
};

export default TicketDetailPage;
