import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Spin, Button, Tooltip, Empty, Modal } from 'antd';
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
};

const TaskList: React.FC<TaskListProps> = ({
  onEdit,
  onDelete,
  onViewDetail,
  sortColumn,
  sortDescending,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [sortColumn, sortDescending]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getAllTask({
        pageNumber: 1,
        pageSize: 50,
        sortColumn,
        sortDescending,
      });

      if (res?.succeeded) {
        const payload = res.data ?? res;
        const items = Array.isArray(payload) ? payload : payload.items ?? [];
        setTasks(items);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      key={task.id || task._id}
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-base">{task.title}</div>
        <Tag color={priorityColors[task.priority || 'Low']}>{task.priority}</Tag>
      </div>

      {/* Type and Story Point */}
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
        <Tooltip title={task.type}>{typeIcons[task.type || 'Task']}</Tooltip>
        <span>{task.point ?? 0} pts</span>
      </div>

      {/* Due Date */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          <ClockCircleOutlined />{' '}
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'No due date'}
        </div>
        {task.status === 'Done' ? (
          <CheckCircleOutlined style={{ color: statusColor['Done'], fontSize: 18 }} />
        ) : (
          <SyncOutlined spin style={{ color: statusColor['In Progress'], fontSize: 18 }} />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-3">
        <Tooltip title="View detail">
          <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetail?.(task)} />
        </Tooltip>
        {/* <Tooltip title="Edit task">
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit?.(task)} />
        </Tooltip> */}
        <Tooltip title="Delete task">
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(task)}
          />
        </Tooltip>
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
      <Row gutter={[24, 24]}>
        {/* In Progress Column */}
        <Col xs={24} md={12}>
          <h3 className="font-semibold text-lg mb-3 flex items-center">
            <SyncOutlined className="mr-2 text-blue-500" spin /> In Progress
          </h3>
          {inProgressTasks.length > 0 ? (
            inProgressTasks.map(renderCard)
          ) : (
            <Empty
              description="Không có task nào đang thực hiện"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Col>

        {/* Done Column */}
        <Col xs={24} md={12}>
          <h3 className="font-semibold text-lg mb-3 flex items-center">
            <CheckCircleOutlined className="mr-2 text-green-500" /> Done
          </h3>
          {doneTasks.length > 0 ? (
            doneTasks.map(renderCard)
          ) : (
            <Empty description="Chưa có task hoàn thành" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TaskList;
