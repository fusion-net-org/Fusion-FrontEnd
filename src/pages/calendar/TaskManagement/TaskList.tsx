import React, { useEffect, useState } from 'react';
import { Table, Tag, Tooltip, Grid, Button, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { getAllTask } from '@/services/taskService.js';
import type { TablePaginationConfig, FilterValue, SorterResult } from 'antd/es/table/interface';
import type { Task } from '@/interfaces/Task/task';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;
const { confirm } = Modal;

type TaskListProps = {
  onEdit?: (task: Task) => void;
  onDelete?: (id: string | number) => Promise<void> | void;
  onViewDetail?: (task: Task) => void;
  sortColumn?: string;
  sortDescending?: boolean;
};

const typeColors: Record<string, string> = { Feature: 'blue', Task: 'geekblue', Bug: 'red' };
const priorityColors: Record<string, string> = { High: 'red', Medium: 'orange', Low: 'blue' };
const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : '—');

const ALL: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const MD_UP: Breakpoint[] = ['md', 'lg', 'xl', 'xxl'];
const LG_UP: Breakpoint[] = ['lg', 'xl', 'xxl'];
const SM_UP: Breakpoint[] = ['sm', 'md', 'lg', 'xl', 'xxl'];

const pickItemsAndTotal = (res: any) => {
  const payload = res?.data ?? res;
  const items = Array.isArray(payload) ? payload : payload?.items ?? [];
  const total = Array.isArray(payload) ? items.length : payload?.totalCount ?? 0;
  return { items, total };
};

const normalizeTasks = (items: any[]): Task[] =>
  items.map((t: any) => ({
    ...t,
    status: ['In Progress', 'Done'].includes(t?.status || '') ? t.status : 'In Progress',
    type: ['Feature', 'Task', 'Bug'].includes(t?.type || '') ? t.type : 'Task',
    priority: ['Low', 'Medium', 'High'].includes(t?.priority || '') ? t.priority : 'Low',
  }));

const TaskList: React.FC<TaskListProps> = ({
  onEdit,
  onDelete,
  onViewDetail,
  sortColumn,
  sortDescending,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [filters, setFilters] = useState<Record<string, FilterValue | null>>({});

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [sorter, setSorter] = useState<{ field: string; order: 'ascend' | 'descend' }>({
    field: 'title',
    order: 'ascend',
  });

  useEffect(() => {
    fetchTasks();
  }, [pagination.current, pagination.pageSize, sortColumn, sortDescending]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getAllTask({
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        sortColumn,
        sortDescending,
      });

      if (res?.succeeded) {
        const { items, total } = pickItemsAndTotal(res);
        setTasks(normalizeTasks(items));
        setPagination((p) => ({ ...p, total }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load task list');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filtersConfig: Record<string, FilterValue | null>,
    sorterConfig: SorterResult<Task> | SorterResult<Task>[],
  ) => {
    setPagination((p) => ({
      ...p,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 10,
    }));

    setFilters(filtersConfig);

    const s = Array.isArray(sorterConfig) ? sorterConfig[0] : sorterConfig;
    if (s && s.field) {
      const field = s.field as string;
      const order = (s.order as 'ascend' | 'descend' | undefined) ?? undefined;

      setSorter({ field, order: order || 'ascend' });
    } else {
      setSorter({ field: 'title', order: 'ascend' });
    }
  };

  const columns: ColumnsType<Task> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string) => (
        <span
          className="block truncate"
          style={{
            maxWidth: 200,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      responsive: MD_UP,
      sortOrder: sorter.field === 'title' ? sorter.order : undefined,
      render: (type?: string) => <Tag color={typeColors[type || 'Task']}>{type || 'Task'}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      responsive: ALL,
      render: (priority?: string) => (
        <Tag color={priorityColors[priority || 'Low']}>{priority || 'Low'}</Tag>
      ),
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
      sortOrder: sortColumn === 'dueDate' ? (sortDescending ? 'descend' : 'ascend') : undefined,
      width: 140,
      responsive: SM_UP,
      render: (date?: string) => <span className="text-gray-600">{formatDate(date)}</span>,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker
            value={selectedKeys[0] ? dayjs(selectedKeys[0] as string) : null}
            onChange={(date) => setSelectedKeys(date ? [date.format('YYYY-MM-DD')] : [])}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <div className="flex gap-2">
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filter
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value || !record.dueDate) return true;
        return record.dueDate.startsWith(value as string);
      },
      filteredValue: filters.dueDate || null,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => onViewDetail?.(record)}>
            View
          </Button>
          <Button size="small" onClick={() => onEdit?.(record)}>
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => {
              confirm({
                title: 'Are you sure you want to delete this task?',
                icon: <ExclamationCircleOutlined />,
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                centered: true,
                async onOk() {
                  await onDelete?.(record.id || record._id!);
                },
              });
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <LoadingOutlined className="text-blue-500 text-2xl animate-spin" />
          <span className="ml-2 text-gray-600">Loading task list...</span>
        </div>
      ) : (
        <Table<Task>
          columns={columns}
          dataSource={tasks}
          rowKey={(r) => (r.id ?? r._id ?? r.key) as React.Key}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} tasks`,
          }}
          scroll={isMobile ? { x: 720 } : undefined}
        />
      )}
    </div>
  );
};

export default TaskList;
