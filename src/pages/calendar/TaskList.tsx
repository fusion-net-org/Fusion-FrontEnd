import React, { useEffect, useState } from 'react';
import { Table, Tag, Tooltip, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import { LoadingOutlined } from '@ant-design/icons';
import { getAllTask } from '@/services/taskService.js';

const { useBreakpoint } = Grid;

/** ====== Types ====== */
type Task = {
  id?: string | number;
  _id?: string | number;
  key?: string | number;
  title: string;
  description?: string;
  type?: 'Bug' | 'Task' | string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  point?: number;
  source?: string;
  dueDate?: string;
  status?: 'To Do' | 'In Progress' | 'Pending Review' | 'Completed' | string;
};

const statusColors: Record<string, string> = {
  'To Do': 'blue',
  'In Progress': 'gold',
  'Pending Review': 'purple',
  Completed: 'green',
};

const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : '—');

const ALL: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const MD_UP: Breakpoint[] = ['md', 'lg', 'xl', 'xxl'];
const LG_UP: Breakpoint[] = ['lg', 'xl', 'xxl'];
const SM_UP: Breakpoint[] = ['sm', 'md', 'lg', 'xl', 'xxl'];

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllTask();
        if (res?.succeeded) setTasks((res.data as Task[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<Task> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 260,
      responsive: ALL,
      render: (text: string, record) => (
        <Tooltip title={record.description || text}>
          <span className="font-medium text-gray-800">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      responsive: MD_UP,
      render: (type?: string) => (
        <Tag color={type === 'Bug' ? 'red' : 'green'}>{type || 'Task'}</Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      responsive: ALL,
      render: (priority?: string) => {
        const color = priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'blue';
        return <Tag color={color}>{priority || 'Low'}</Tag>;
      },
    },
    {
      title: 'Story Point',
      dataIndex: 'point',
      key: 'point',
      align: 'center',
      width: 110,
      responsive: MD_UP,
      render: (point?: number) => <span className="text-gray-700 font-semibold">{point ?? 0}</span>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 140,
      ellipsis: true,
      responsive: LG_UP,
      render: (source?: string) => <Tag color="geekblue">{source || 'N/A'}</Tag>,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      responsive: SM_UP,
      render: (date?: string) => <span className="text-gray-600">{formatDate(date)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      responsive: ALL,
      render: (status?: string) => (
        <Tag color={status ? statusColors[status] : undefined}>{status || 'To Do'}</Tag>
      ),
    },
  ];

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <LoadingOutlined className="text-blue-500 text-2xl animate-spin" />
          <span className="ml-2 text-gray-600">Loading task...</span>
        </div>
      ) : (
        <Table<Task>
          columns={columns}
          dataSource={tasks}
          rowKey={(r) => (r.id ?? r._id ?? r.key) as React.Key}
          className="custom-ant-table"
          size={isMobile ? 'small' : 'middle'}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            simple: isMobile,
            showSizeChanger: !isMobile,
          }}
          scroll={isMobile ? { x: 720 } : undefined}
          expandable={
            isMobile
              ? {
                  expandRowByClick: true,
                  rowExpandable: (record) =>
                    !!record?.description ||
                    !!record?.source ||
                    !!record?.dueDate ||
                    record?.point !== undefined,
                  expandedRowRender: (record) => (
                    <div className="text-sm text-gray-700 space-y-2">
                      {record?.description && (
                        <div>
                          <span className="font-medium">Description: </span>
                          <span className="text-gray-600">{record.description}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <span className="font-medium">Type: </span>
                          <Tag color={record.type === 'Bug' ? 'red' : 'green'}>
                            {record.type || 'Task'}
                          </Tag>
                        </div>
                        <div>
                          <span className="font-medium">Source: </span>
                          <Tag color="geekblue">{record.source || 'N/A'}</Tag>
                        </div>
                        <div>
                          <span className="font-medium">Due: </span>
                          <span className="text-gray-600">{formatDate(record.dueDate)}</span>
                        </div>
                        <div>
                          <span className="font-medium">SP: </span>
                          <span className="text-gray-700">{record.point ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ),
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

export default TaskList;
