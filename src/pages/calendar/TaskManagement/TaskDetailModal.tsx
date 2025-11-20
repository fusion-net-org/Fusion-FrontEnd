import React from 'react';
import { Modal, Descriptions, Tag, Space, Button, Spin, Modal as AntModal } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FlagOutlined,
  FileTextOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

import { formatDate } from '@/pages/calendar/calendarManagement/event-utils';

interface TaskDetailModalProps {
  open: boolean;
  loading?: boolean;
  task: any | null;
  onClose: () => void;
  onDelete?: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  loading = false,
  task,
  onClose,
  onDelete,
}) => {
  if (!task && !loading) return null;

  // Map backend priority values
  const priorityMap: Record<string, string> = {
    '1': 'High',
    '2': 'Medium',
    '3': 'Low',
  };

  const priorityColor: Record<string, string> = {
    High: 'red',
    Medium: 'orange',
    Low: 'green',
  };

  const typeColor: Record<string, string> = {
    Bug: 'volcano',
    Feature: 'blue',
    Task: 'cyan',
  };

  const statusColor: Record<string, string> = {
    'To Do': 'default',
    'In Progress': 'processing',
    Done: 'success',
    Review: 'warning',
  };

  const priorityLabel = priorityMap[task?.priority] || 'Unknown';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>Close</Button>

          {onDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                AntModal.confirm({
                  title: 'Delete Task',
                  content: 'Are you sure you want to delete this task?',
                  okText: 'Delete',
                  okType: 'danger',
                  onOk: () => {
                    onDelete(task.id);
                    onClose();
                  },
                });
              }}
            >
              Delete
            </Button>
          )}
        </Space>
      }
      styles={{
        body: { paddingTop: 24 },
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : task ? (
        <div className="space-y-6">
          {/* HEADER */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-900 flex-1">{task.title}</h2>

              <Space>
                <Tag color={typeColor[task.type || 'Task']}>{task.type || 'Task'}</Tag>
                <Tag color={priorityColor[priorityLabel]}>{priorityLabel}</Tag>
              </Space>
            </div>

            {task.status && (
              <Tag
                color={statusColor[task.status]}
                icon={task.status === 'Done' ? <CheckCircleOutlined /> : undefined}
                className="text-sm"
              >
                {task.status}
              </Tag>
            )}
          </div>

          {/* DESCRIPTION */}
          {task.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <FileTextOutlined />
                <span className="font-medium">Description</span>
              </div>
              <div className="pl-6 text-gray-700 whitespace-pre-wrap">{task.description}</div>
            </div>
          )}

          {/* DETAILS SECTION */}
          <div className="space-y-4 border-t pt-4">
            <Descriptions column={1} size="small">
              {/* CODE */}
              <Descriptions.Item label="Code">{task.code || '-'}</Descriptions.Item>

              {/* PROJECT */}
              <Descriptions.Item label="Project ID">{task.projectId}</Descriptions.Item>

              {/* SPRINT */}
              <Descriptions.Item label="Sprint ID">{task.sprintId}</Descriptions.Item>

              {/* SEVERITY */}
              <Descriptions.Item label="Severity">{task.severity || '-'}</Descriptions.Item>

              {/* POINTS */}
              <Descriptions.Item
                label={
                  <span className="flex items-center gap-2">
                    <FlagOutlined /> Story Points
                  </span>
                }
              >
                <Tag color="purple">{task.point} pts</Tag>
              </Descriptions.Item>

              {/* ESTIMATE */}
              <Descriptions.Item label="Estimate Hours">
                {task.estimateHours ?? '-'}
              </Descriptions.Item>

              {/* REMAINING */}
              <Descriptions.Item label="Remaining Hours">
                {task.remainingHours ?? '-'}
              </Descriptions.Item>

              {/* ORDER */}
              <Descriptions.Item label="Order in Sprint">{task.orderInSprint}</Descriptions.Item>

              {/* STATUS ID */}
              <Descriptions.Item label="Status ID">{task.currentStatusId || '-'}</Descriptions.Item>

              {/* DUE DATE */}
              <Descriptions.Item
                label={
                  <span className="flex items-center gap-2">
                    <CalendarOutlined />
                    Due Date
                  </span>
                }
              >
                {task.dueDate ? formatDate(task.dueDate) : '-'}
              </Descriptions.Item>

              {/* BACKLOG */}
              <Descriptions.Item label="Backlog">
                {task.isBacklog ? <Tag color="default">Yes</Tag> : <Tag color="green">No</Tag>}
              </Descriptions.Item>

              {/* DELETED */}
              <Descriptions.Item label="Deleted">
                {task.isDeleted ? <Tag color="red">Deleted</Tag> : <Tag color="green">Active</Tag>}
              </Descriptions.Item>

              {/* ASSIGNEES */}
              <Descriptions.Item label="Assignees">
                {task.assigneeIds && task.assigneeIds.length > 0
                  ? task.assigneeIds.map((uid: string) => <Tag key={uid}>{uid}</Tag>)
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
            {task.createAt && <div>Created: {new Date(task.createAt).toLocaleString('vi-VN')}</div>}

            {task.updateAt && <div>Updated: {new Date(task.updateAt).toLocaleString('vi-VN')}</div>}

            {task.id && <div className="font-mono text-[10px]">ID: {task.id}</div>}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Task not found</div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
