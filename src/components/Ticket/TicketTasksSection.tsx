/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Spin, Input, Select, Tooltip, Modal, Table } from 'antd';
import { Layers, Plus, Trash2, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTicketTasks, createTicketTask, deleteTask } from '@/services/taskService.js';
import { toast } from 'react-toastify';
import { Can } from '@/permission/PermissionProvider';

const { Option } = Select;
const { confirm } = Modal;

type Props = {
  ticketId: string;
  projectId?: string | null;
  componentId?: string | null;
  canCreateTask: boolean;
};

type TaskType = 'Feature' | 'Bug' | 'Chore';
type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

const TicketTasksSection: React.FC<Props> = ({
  ticketId,
  projectId,
  componentId,
  canCreateTask,
}) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    type: TaskType;
    priority: TaskPriority;
    estimate: string;
  }>({
    title: '',
    type: 'Feature',
    priority: 'Medium',
    estimate: '',
  });

  const navigate = useNavigate();
  const { companyId, projectId: projectIdFromRoute } = useParams();
  const effectiveProjectId = projectId || projectIdFromRoute || undefined;

  const load = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const paged = await getTicketTasks(ticketId, {
        pageNumber: 1,
        pageSize: 100,
        sortColumn: 'CreateAt',
        sortDescending: true,
      });

      const items = paged?.items ?? paged?.data?.items ?? [];
      setTasks(items);
    } catch (err: any) {
      console.error('[TicketTasksSection] load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleCreate = async () => {
    const title = form.title.trim();
    if (!title || !effectiveProjectId) return;
    if (creating) return;

    const estimateRaw = form.estimate.trim();
    const estimateVal = estimateRaw ? Number(estimateRaw) : null;

    const cid = typeof componentId === 'string' ? componentId.trim() : componentId;

    try {
      setCreating(true);

      const newTask = await createTicketTask(ticketId, {
        projectId: effectiveProjectId,
        title,
        type: form.type,
        priority: form.priority,
        estimateHours:
          Number.isFinite(estimateVal as number) && estimateVal !== null ? estimateVal : null,
        componentId: cid || null, // ✅ ADD
      });
      console.log(newTask);
      setTasks((prev) => [newTask, ...prev]);

      setForm({
        title: '',
        type: 'Feature',
        priority: 'Medium',
        estimate: '',
      });

      toast.success('Backlog task created for this ticket.');
    } catch (err: any) {
      console.error('[TicketTasksSection] create error', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error creating ticket task');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (taskId: string) => {
    if (!taskId) return;

    confirm({
      title: 'Remove this task from the ticket?',
      content: 'The task will be soft-deleted from the project and unlinked from this ticket.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteTask(taskId);
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
          toast.success('Task has been deleted.');
        } catch (err: any) {
          console.error('[TicketTasksSection] delete error', err);
          toast.error(err?.response?.data?.message || err?.message || 'Error deleting ticket task');
        }
      },
    });
  };

  const handleOpenTaskDetail = (taskId: string) => {
    if (!companyId || !effectiveProjectId) {
      console.warn('[TicketTasksSection] Missing companyId/projectId for navigation', {
        companyId,
        effectiveProjectId,
        taskId,
      });
      return;
    }

    navigate(`/companies/${companyId}/project/${effectiveProjectId}/task/${taskId}`);
  };

  const getPriorityColor = (p?: string) => {
    switch (p) {
      case 'Urgent':
        return 'red';
      case 'High':
        return 'orange';
      case 'Medium':
        return 'blue';
      case 'Low':
      default:
        return 'default';
    }
  };

  const getStatusColor = (category?: string) => {
    switch (category) {
      case 'DONE':
        return 'green';
      case 'IN_PROGRESS':
        return 'blue';
      case 'REVIEW':
        return 'gold';
      case 'TODO':
      default:
        return 'default';
    }
  };

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');
  const rows = React.useMemo(() => {
    return (tasks ?? []).map((t: any) => {
      const estimate = t.estimateHours ?? t.estimate_hours ?? null;
      const isBacklog = typeof t.isBacklog === 'boolean' ? t.isBacklog : !t.sprintId;

      const sprintLabel =
        t.sprintName ??
        t.sprintCode ??
        (t.sprintIndex != null ? `Sprint ${t.sprintIndex}` : t.sprintId ? t.sprintId : null);

      const statusCategory = t.statusCategory || t.status_category;
      const statusText =
        t.statusName ?? t.workflowStatusName ?? t.statusCode ?? t.workflowStatusCode ?? '—';

      return {
        key: t.id,
        id: t.id,
        code: t.code || '—',
        title: t.title || '—',
        type: t.type || null,
        priority: t.priority || null,
        estimate,
        dueDate: t.dueDate || t.due_date || null,
        sprintLabel,
        isBacklog,
        statusCategory,
        statusText,
      };
    });
  }, [tasks]);

  const columns = React.useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        width: 120,
        render: (_: any, r: any) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenTaskDetail(r.id);
            }}
            className="text-xs font-mono text-blue-600 hover:underline"
          >
            {r.code}
          </button>
        ),
      },
      {
        title: 'Title',
        dataIndex: 'title',
        ellipsis: true,
        render: (_: any, r: any) => (
          <Tooltip title={r.title}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenTaskDetail(r.id);
              }}
              className="text-sm font-medium text-gray-900 text-left hover:underline truncate"
            >
              {r.title}
            </button>
          </Tooltip>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        width: 110,
        render: (v: any) =>
          v ? <Tag className="rounded-full px-2 py-0.5 text-[11px]">{v}</Tag> : '—',
      },
      {
        title: 'Priority',
        dataIndex: 'priority',
        width: 120,
        render: (v: any) =>
          v ? (
            <Tag color={getPriorityColor(v)} className="rounded-full px-2 py-0.5 text-[11px]">
              {v}
            </Tag>
          ) : (
            '—'
          ),
      },
      {
        title: 'Sprint',
        dataIndex: 'sprintLabel',
        width: 140,
        render: (_: any, r: any) =>
          r.isBacklog ? (
            <Tag className="rounded-full px-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 text-slate-600">
              Backlog
            </Tag>
          ) : (
            <Tag className="rounded-full px-2 py-0.5 text-[11px] border border-blue-100 bg-blue-50 text-blue-700">
              'On sprint'
            </Tag>
          ),
      },
      {
        title: 'Status',
        dataIndex: 'statusText',
        width: 130,
        render: (_: any, r: any) => (
          <Tag
            color={getStatusColor(r.statusCategory)}
            className="rounded-full px-2 py-0.5 text-[11px]"
          >
            {r.statusText}
          </Tag>
        ),
      },
      {
        title: 'Est',
        dataIndex: 'estimate',
        width: 90,
        align: 'right' as const,
        render: (v: any) =>
          v != null && v !== 0 ? (
            <span className="inline-flex items-center gap-1 text-gray-600">
              <Clock size={12} />
              {v}h
            </span>
          ) : (
            '—'
          ),
      },
      {
        title: 'Due',
        dataIndex: 'dueDate',
        width: 120,
        render: (v: any) => <span className="text-gray-600">{formatDate(v)}</span>,
      },
      {
        title: '',
        dataIndex: 'actions',
        width: 56,
        fixed: 'right' as const,
        render: (_: any, r: any) => (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <Can code="TICKET_TASK_DELETE">
              <Button
                type="text"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => handleDelete(r.id)}
              />
            </Can>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, effectiveProjectId, tasks],
  );

  return (
    <Card className="shadow-sm rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-indigo-500" />
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">Ticket tasks</h3>
            <span className="text-xs text-gray-500">
              Tasks created from this ticket (backlog or already on sprint).
            </span>
          </div>
        </div>
        <Tag color="blue" className="px-2 py-0.5 rounded-full text-xs">
          {tasks.length} task(s)
        </Tag>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-gray-900 text-sm font-semibold mb-1 block">Task title</label>
          <Input
            placeholder="e.g. Implement API for ticket detail"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            disabled={!effectiveProjectId || !canCreateTask}
          />
        </div>
        <div>
          <label className="text-gray-900 text-sm font-semibold mb-1 block">Type</label>
          <Select
            value={form.type}
            onChange={(v) => setForm((prev) => ({ ...prev, type: v as TaskType }))}
            className="w-full"
            disabled={!effectiveProjectId || !canCreateTask}
          >
            <Option value="Feature">Feature</Option>
            <Option value="Bug">Bug</Option>
            <Option value="Chore">Chore</Option>
          </Select>
        </div>
        <div>
          <label className="text-gray-900 text-sm font-semibold mb-1 block">
            Priority / Est (h)
          </label>
          <div className="flex gap-2">
            <Select
              value={form.priority}
              onChange={(v) => setForm((prev) => ({ ...prev, priority: v as TaskPriority }))}
              className="w-24"
              disabled={!effectiveProjectId || !canCreateTask}
            >
              <Option value="Urgent">Urgent</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="h"
              value={form.estimate}
              onChange={(e) => setForm((prev) => ({ ...prev, estimate: e.target.value }))}
              disabled={!effectiveProjectId || !canCreateTask}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-500">
          New tasks are created under the ticket&apos;s project, with sprint = null (backlog), and
          automatically linked to this ticket.
        </span>
        <Tooltip
          title={
            !effectiveProjectId
              ? 'This ticket is not linked to any project, so tasks cannot be created.'
              : !canCreateTask
                ? 'Tasks can only be created when ticket status is Accepted.'
                : ''
          }
        >
          <span>
            <Can code="TICKET_TASK_CREATE">
              <Button
                type="primary"
                icon={<Plus size={14} />}
                disabled={!effectiveProjectId || !canCreateTask || !form.title.trim() || creating}
                loading={creating}
                onClick={handleCreate}
              >
                Add task
              </Button>
            </Can>
          </span>
        </Tooltip>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No tasks have been created from this ticket yet.
        </div>
      ) : (
        <Table
          size="middle"
          columns={columns as any}
          dataSource={rows as any}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ y: 360, x: 980 }}
          rowClassName={(r: any) => (r.isBacklog ? 'bg-slate-50' : '')}
          onRow={(r: any) => ({
            onClick: () => handleOpenTaskDetail(r.id),
          })}
          className="rounded-xl overflow-hidden"
        />
      )}
    </Card>
  );
};

export default TicketTasksSection;
