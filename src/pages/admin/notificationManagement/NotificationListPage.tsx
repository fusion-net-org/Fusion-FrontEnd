import React, { useEffect, useState } from 'react';
import { Input, Select, Button, Modal, Form, message, Card, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Pagination, Stack } from '@mui/material';
import { Search, ArrowUp, ArrowDown, RefreshCw, Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getAllNotificationByAdmin,
  sendNotificationToSystem,
} from '@/services/notificationService.js';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
type SortKey = 'title' | 'event' | 'createAt';

const SORT_OPTIONS = [
  { key: 'Title', label: 'Title' },
  { key: 'Event', label: 'Event' },
  { key: 'createAt', label: 'Created At' },
];

export default function NotificationListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<SortKey>('createAt');
  const [dirDesc, setDirDesc] = useState(true);

  const [form] = Form.useForm();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAllNotificationByAdmin({
        PageNumber: pageNumber,
        PageSize: pageSize,
        SortColumn: sort,
        SortDescending: dirDesc,
      });
      setNotifications(data?.items || []);
      setTotal(data?.totalCount || 0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch notifications!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [pageNumber, pageSize, sort, dirDesc]);

  const resetFilters = () => {
    setSearchText('');
    setSort('createAt');
    setDirDesc(true);
    setPageNumber(1);
    fetchNotifications();
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await sendNotificationToSystem(values);
      toast.success('Notification sent successfully!');
      setIsModalOpen(false);
      fetchNotifications();
    } catch (error: any) {
      message.error(error.message || 'Failed to send notification!');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: 'Body',
      dataIndex: 'body',
      key: 'body',
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
      render: (text: string) => (
        <Tag color="blue" className="text-xs px-2 py-0.5">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isRead',
      key: 'isRead',
      render: (isRead: boolean) =>
        isRead ? <Tag color="green">Read</Tag> : <Tag color="red">Unread</Tag>,
    },
    {
      title: 'Created At',
      dataIndex: 'createAt',
      key: 'createAt',
      render: (text: string) => (
        <span className="text-gray-500 text-xs">{new Date(text).toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 m-0">Notification Management</h1>
                <p className="text-sm text-gray-500 m-0">
                  View, filter and manage all system notifications
                </p>
              </div>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Send Notification
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search by title..."
                allowClear
                prefix={<Search size={16} className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
              />
              <Select
                value={sort}
                onChange={(val) => setSort(val)}
                style={{ width: 180 }}
                placeholder="Sort by"
                options={SORT_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.key,
                }))}
              />
              <Button
                icon={dirDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                onClick={() => setDirDesc(!dirDesc)}
              >
                {dirDesc ? 'Descending' : 'Ascending'}
              </Button>
              <Button
                icon={<RefreshCw size={16} />}
                onClick={resetFilters}
                className="flex items-center"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{n.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{n.body}</td>
                    <td className="px-6 py-4">
                      <Tag color="blue">{n.event}</Tag>
                    </td>
                    <td className="px-6 py-4">
                      {n.isRead ? <Tag color="green">Read</Tag> : <Tag color="red">Unread</Tag>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(n.createAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center text-gray-400 py-6">
                    No notifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{notifications.length}</span>{' '}
                of <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>{' '}
                notifications
              </span>
              <label className="inline-flex items-center gap-2">
                <span className="text-gray-600">Rows per page:</span>
                <select
                  className="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                  value={pageSize}
                  onChange={(e) => {
                    const size = Math.max(1, parseInt(e.target.value || '10', 10));
                    setPageSize(size);
                    setPageNumber(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Stack spacing={2}>
              <Pagination
                count={Math.max(1, Math.ceil(total / pageSize))}
                page={pageNumber}
                onChange={(_, p) => setPageNumber(p)}
                color="primary"
                variant="outlined"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Stack>
          </div>
        </div>
      </div>

      {/* Modal gửi notification */}
      <Modal
        title="Send Notification to System"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSend}
        confirmLoading={loading}
        okText="Send"
        className="rounded-lg"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title!' }]}
          >
            <Input placeholder="Notification title" />
          </Form.Item>

          <Form.Item
            name="body"
            label="Body"
            rules={[{ required: true, message: 'Please enter the body!' }]}
          >
            <Input.TextArea placeholder="Notification content..." rows={3} />
          </Form.Item>

          <Form.Item
            name="event"
            label="Event"
            rules={[{ required: true, message: 'Please enter event type!' }]}
          >
            <Input placeholder="e.g. system_update, promotion" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
