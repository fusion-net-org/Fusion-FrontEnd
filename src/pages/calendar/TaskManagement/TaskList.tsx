import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Spin, Button, Tooltip, Empty, Modal, Pagination } from 'antd';
import {
  ExclamationCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  BugOutlined,
  FlagOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { getAllTask } from '@/services/taskService.js';
import type { Task } from '@/interfaces/Task/task';

const { confirm } = Modal;

const typeIcons = {
  Feature: <ThunderboltOutlined style={{ color: '#52c41a' }} />,
  Task: <FlagOutlined style={{ color: '#1890ff' }} />,
  Bug: <BugOutlined style={{ color: '#f5222d' }} />,
};

const priorityColors = {
  High: 'red',
  Medium: 'orange',
  Low: 'blue',
};

const statusColor = {
  'In Progress': '#1677ff',
  Done: '#52c41a',
};

type TaskListProps = {
  onEdit?: (task: Task) => void;
  onDelete?: (id: string | number) => Promise<void> | void;
  onViewDetail?: (task: Task) => void;
  sortColumn?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize?: number) => void;
};

const TaskList: React.FC<TaskListProps> = ({
  onEdit,
  onDelete,
  onViewDetail,
  sortColumn,
  sortDescending,
  onPageChange,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, [sortColumn, sortDescending]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getAllTask({
        pageNumber,
        pageSize,
        sortColumn,
        sortDescending,
      });

      if (res?.succeeded) {
        const payload = res.data ?? res;
        const items = Array.isArray(payload) ? payload : payload.items ?? [];
        setTasks(items);
        setTotal(payload.totalCount || items.length);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, size?: number) => {
    setPageNumber(page);
    if (size) setPageSize(size);
  };

  const handleDelete = (task: Task) => {
    confirm({
      title: 'Are you sure you want to delete this task?',
      icon: <ExclamationCircleOutlined />,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      async onOk() {
        await onDelete?.(task.id || task._id!);
      },
    });
  };

  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const doneTasks = tasks.filter((t) => t.status === 'Done');

  const renderCard = (task: Task) => (
    <Card
      key={task.id}
      style={{
        marginBottom: 8,
        borderRadius: 10,
        border: '1px solid #e5e5e5',
        padding: 0,
      }}
      bodyStyle={{ padding: '10px 14px' }}
    >
      <div className="flex items-center text-sm">
        <div className="w-[8%]">{typeIcons[task.type || 'Task']}</div>

        <div className="w-[28%] font-medium truncate">{task.title}</div>

        <div className="w-[14%]">
          <Tag
            color={
              task.status === 'Done' ? 'green' : task.status === 'In Progress' ? 'blue' : 'default'
            }
          >
            {task.status}
          </Tag>
        </div>

        <div className="w-[15%] flex items-center gap-1 text-gray-600">
          <ClockCircleOutlined />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
        </div>

        <div className="w-[10%]">
          <Tag color={priorityColors[task.priority || 'Low']}>{task.priority}</Tag>
        </div>

        <div className="w-[15%] flex justify-end gap-2">
          <Tooltip title="View detail">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetail?.(task)} />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(task)}
            />
          </Tooltip>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card
        style={{
          borderRadius: 10,
          border: '1px solid #e5e5e5',
          marginBottom: 10,
          background: '#fafafa',
        }}
        bodyStyle={{ padding: '10px 14px' }}
      >
        <div className="flex font-semibold text-gray-600">
          <div className="w-[8%]">Type</div>
          <div className="w-[28%]">Title</div>
          <div className="w-[14%]">Status</div>
          <div className="w-[15%]">Due date</div>
          <div className="w-[10%]">Priority</div>
          <div className="w-[15%] text-right">Actions</div>
        </div>
      </Card>
      {tasks.length > 0 ? (
        tasks.map(renderCard)
      ) : (
        <Empty description="Không có task nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      {total && total > pageSize && (
        <div className="flex justify-center mt-4">
          <Pagination
            current={pageNumber}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
          />
        </div>
      )}
    </div>
  );
};

export default TaskList;
