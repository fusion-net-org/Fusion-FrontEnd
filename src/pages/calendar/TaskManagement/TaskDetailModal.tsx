import React from 'react';
import { Modal, Descriptions, Tag, Space, Button, Spin } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FlagOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { formatDate } from '@/pages/calendar/event-utils';

interface TaskDetailModalProps {
  open: boolean;
  loading?: boolean;
  task: any | null;
  onClose: () => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  loading = false,
  task,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!task && !loading) return null;

  // Priority colors
  const priorityColor: Record<string, string> = {
    High: 'red',
    Medium: 'orange',
    Low: 'green',
  };

  // Type colors
  const typeColor: Record<string, string> = {
    Bug: 'volcano',
    Feature: 'blue',
    Task: 'cyan',
  };

  // Status colors
  const statusColor: Record<string, string> = {
    'To Do': 'default',
    'In Progress': 'processing',
    Done: 'success',
    Review: 'warning',
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>Close</Button>
          {/* {onEdit && (
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => {
                onEdit(task);
                onClose();
              }}
            >
              Edit
            </Button>
          )} */}
          {onDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
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
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-900 flex-1">{task.title}</h2>
              <Space>
                <Tag color={typeColor[task.type || 'Task']}>{task.type || 'Task'}</Tag>
                <Tag color={priorityColor[task.priority || 'Low']}>{task.priority || 'Low'}</Tag>
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

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <FileTextOutlined />
                <span className="font-medium">Description</span>
              </div>
              <div className="pl-6 text-gray-700 whitespace-pre-wrap">{task.description}</div>
            </div>
          )}

          {/* Details */}
          <div className="space-y-4 border-t pt-4">
            <Descriptions column={1} size="small">
              {/* Due Date */}
              {task.dueDate && (
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2 text-gray-600">
                      <CalendarOutlined />
                      <span>Due Date</span>
                    </span>
                  }
                >
                  <span className="font-medium">{formatDate(task.dueDate)}</span>
                </Descriptions.Item>
              )}

              {/* Start Date */}
              {task.startDate && (
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2 text-gray-600">
                      <ClockCircleOutlined />
                      <span>Start Date</span>
                    </span>
                  }
                >
                  {formatDate(task.startDate)}
                </Descriptions.Item>
              )}

              {/* End Date */}
              {task.endDate && (
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2 text-gray-600">
                      <ClockCircleOutlined />
                      <span>End Date</span>
                    </span>
                  }
                >
                  {formatDate(task.endDate)}
                </Descriptions.Item>
              )}

              {/* Assigned To */}
              {task.assignedTo && (
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2 text-gray-600">
                      <UserOutlined />
                      <span>Assigned To</span>
                    </span>
                  }
                >
                  <Tag color="blue">{task.assignedTo}</Tag>
                </Descriptions.Item>
              )}

              {/* Point */}
              {task.point !== undefined && task.point !== null && (
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2 text-gray-600">
                      <FlagOutlined />
                      <span>Story Points</span>
                    </span>
                  }
                >
                  <Tag color="purple">{task.point} pts</Tag>
                </Descriptions.Item>
              )}

              {/* Source */}
              {task.source && <Descriptions.Item label="Source">{task.source}</Descriptions.Item>}

              {/* Is Backlog */}
              {task.isBacklog !== undefined && (
                <Descriptions.Item label="Backlog">
                  {task.isBacklog ? <Tag color="default">Yes</Tag> : <Tag color="success">No</Tag>}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          {/* Footer Info */}
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
