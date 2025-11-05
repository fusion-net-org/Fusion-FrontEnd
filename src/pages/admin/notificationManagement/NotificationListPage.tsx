import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { sendNotificationToSystem } from '@/services/notificationService.js';

export default function NotificationListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 1,
      title: 'Server Maintenance',
      body: 'The system will be down at 10 PM for maintenance.',
      event: 'system_maintenance',
      createdAt: '2025-11-06 10:00',
    },
  ]);

  const [form] = Form.useForm();

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await sendNotificationToSystem(values);
      toast.success('Notification sent successfully!');
      setIsModalOpen(false);

      setNotifications((prev) => [
        {
          id: Date.now(),
          ...values,
          createdAt: new Date().toLocaleString(),
        },
        ...prev,
      ]);
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
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{text}</span>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => <span className="text-gray-500 text-xs">{text}</span>,
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={<h2 className="text-lg font-semibold text-gray-800">Notification Management</h2>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Send Notification
          </Button>
        }
        className="shadow-sm rounded-xl"
      >
        <Table
          rowKey="id"
          dataSource={notifications}
          columns={columns}
          pagination={{ pageSize: 5 }}
        />
      </Card>

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
