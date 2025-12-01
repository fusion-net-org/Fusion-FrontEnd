/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Spin, Input, Select, Tooltip, Modal } from 'antd';
import { Layers, Plus, Trash2, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTicketTasks, createTicketTask, deleteTask } from '@/services/taskService.js';
import { toast } from 'react-toastify';

const { Option } = Select;
const { confirm } = Modal;

type Props = {
  ticketId: string;
  projectId?: string | null;
};

type TaskType = 'Feature' | 'Bug' | 'Chore';
type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

const TicketTasksSection: React.FC<Props> = ({ ticketId, projectId }) => {
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
        sortColumn: 'CreateAt', // match backend property
        sortDescending: true, // newest first
      });

      const items = paged?.items ?? paged?.data?.items ?? [];
      setTasks(items);
    } catch (err: any) {
      console.error('[TicketTasksSection] load error', err);
      // toast.error(err?.message || "Error loading ticket tasks");
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

    try {
      setCreating(true);

      const newTask = await createTicketTask(ticketId, {
        projectId: effectiveProjectId,
        title,
        type: form.type,
        priority: form.priority,
        estimateHours:
          Number.isFinite(estimateVal as number) && estimateVal !== null ? estimateVal : null,
      });

      // Backend returns ProjectTaskResponse – prepend to the list
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

  // 👉 mở Task Detail khi task đã được materialize (không còn backlog)
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

  return (
    <Card className="shadow-sm rounded-xl border border-gray-100">
      {/* Header */}
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

      {/* Quick create form (luôn là backlog) */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-gray-900 text-sm font-semibold mb-1 block">Task title</label>
          <Input
            placeholder="e.g. Implement API for ticket detail"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            disabled={!effectiveProjectId}
          />
        </div>
        <div>
          <label className="text-gray-900 text-sm font-semibold mb-1 block">Type</label>
          <Select
            value={form.type}
            onChange={(v) => setForm((prev) => ({ ...prev, type: v as TaskType }))}
            className="w-full"
            disabled={!effectiveProjectId}
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
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  priority: v as TaskPriority,
                }))
              }
              className="w-24"
              disabled={!effectiveProjectId}
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
              disabled={!effectiveProjectId}
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
            effectiveProjectId
              ? ''
              : 'This ticket is not linked to any project, so tasks cannot be created.'
          }
        >
          <span>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              disabled={!effectiveProjectId || !form.title.trim() || creating}
              loading={creating}
              onClick={handleCreate}
            >
              Add task
            </Button>
          </span>
        </Tooltip>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No tasks have been created from this ticket yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-auto">
          {tasks.map((t: any) => {
            const estimate = t.estimateHours ?? t.estimate_hours ?? null;

            // ⭐ xác định backlog hay không
            const isBacklog = typeof t.isBacklog === 'boolean' ? t.isBacklog : !t.sprintId; // fallback: sprintId null => backlog

            // sprint & status label cho task đã ra khỏi backlog
            const sprintLabel =
              t.sprintName ??
              t.sprintCode ??
              (t.sprintIndex != null ? `Sprint ${t.sprintIndex}` : t.sprintId ? t.sprintId : null);

            const statusCategory = t.statusCategory || t.status_category;
            const statusLabel =
              t.statusName ?? t.workflowStatusName ?? t.statusCode ?? t.workflowStatusCode ?? '—';

            if (isBacklog) {
              // ✅ BACKLOG: giữ UI đơn giản
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-white hover:bg-gray-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500">{t.code || '—'}</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{t.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Tag className="rounded-full px-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 text-slate-600">
                        Backlog
                      </Tag>
                      {t.type && (
                        <Tag className="rounded-full px-2 py-0.5 text-[11px]">{t.type}</Tag>
                      )}
                      {t.priority && (
                        <Tag
                          color={getPriorityColor(t.priority)}
                          className="rounded-full px-2 py-0.5 text-[11px]"
                        >
                          {t.priority}
                        </Tag>
                      )}
                      {estimate != null && estimate !== 0 && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={12} />
                          {estimate}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="text"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(t.id)}
                    />
                  </div>
                </div>
              );
            }

            // ✅ KHÔNG CÒN BACKLOG: show full info + clickable + "On sprint"
            return (
              <div
                key={t.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-white hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  {/* Code + Title clickable */}
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleOpenTaskDetail(t.id)}
                      className="text-xs font-mono text-blue-600 hover:underline"
                    >
                      {t.code || '—'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTaskDetail(t.id)}
                      className="text-sm font-medium text-gray-900 truncate text-left hover:underline"
                    >
                      {t.title}
                    </button>
                  </div>

                  {/* Tags: type, priority, On sprint, Status */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {t.type && <Tag className="rounded-full px-2 py-0.5 text-[11px]">{t.type}</Tag>}
                    {t.priority && (
                      <Tag
                        color={getPriorityColor(t.priority)}
                        className="rounded-full px-2 py-0.5 text-[11px]"
                      >
                        {t.priority}
                      </Tag>
                    )}

                    {/* On sprint ... */}
                    {sprintLabel && (
                      <Tag
                        color="green-inverse"
                        className="rounded-full px-2 py-0.5 text-[11px] border border-blue-100 bg-blue-50 text-blue-700"
                      >
                        <span className="opacity-75 mr-1">On sprint</span>
                      </Tag>
                    )}

                    {/* Status hiện tại */}
                    <Tag
                      color={getStatusColor(statusCategory)}
                      className="rounded-full px-2 py-0.5 text-[11px]"
                    >
                      {statusLabel}
                    </Tag>
                  </div>

                  {/* Meta: due, est, remain */}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                    <span>
                      <b>Due:</b> {formatDate(t.dueDate || t.due_date)}
                    </span>
                    {estimate != null && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <b>Est:</b> {estimate}h
                      </span>
                    )}
                    {t.remainingHours != null && (
                      <span>
                        <b>Remain:</b> {t.remainingHours}h
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDelete(t.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default TicketTasksSection;
