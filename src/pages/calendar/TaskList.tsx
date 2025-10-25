import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Tooltip } from 'antd';
import { getAllTask } from '@/services/taskService.js';
import { LoadingOutlined } from '@ant-design/icons';

const statusColors: Record<string, string> = {
  'To Do': 'blue',
  'In Progress': 'gold',
  'Pending Review': 'purple',
  Completed: 'green',
};

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getAllTask();
        console.log(res.data);
        if (res?.succeeded) {
          setTasks(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Tooltip title={record.description}>
          <span className="font-medium text-gray-800">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={type === 'Bug' ? 'red' : 'green'}>{type}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color = priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'blue';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Story Point',
      dataIndex: 'point',
      key: 'point',
      align: 'center' as const,
      render: (point: number) => <span className="text-gray-700 font-semibold">{point}</span>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => <Tag color="geekblue">{source}</Tag>,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => (
        <span className="text-gray-600">{new Date(date).toLocaleDateString('vi-VN')}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>,
    },
  ];

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <LoadingOutlined className="text-blue-500 text-2xl animate-spin" />
          <span className="ml-2 text-gray-600">Đang tải danh sách task...</span>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          className="custom-ant-table"
        />
      )}
    </div>
  );
};
