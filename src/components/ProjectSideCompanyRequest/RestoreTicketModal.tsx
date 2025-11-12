/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Modal, Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { RestoreTicket } from '@/services/TicketService.js';

const { Text } = Typography;

interface RestoreTicketModalProps {
  visible: boolean;
  ticketId?: string;
  onCancel: () => void;
  onRestored?: () => void;
}

const RestoreTicketModal: React.FC<RestoreTicketModalProps> = ({
  visible,
  ticketId,
  onCancel,
  onRestored,
}) => {
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      const response = await RestoreTicket(ticketId);
      if (response.statusCode === 200) {
        toast.success(response.message);
        onRestored?.();
        onCancel();
      }
    } catch (error: any) {
      console.error('RestoreTicket error:', error);
      toast.error(error?.response?.data?.message || 'Failed to restore ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 20 }} />
          <span className="font-semibold text-green-600">Restore Ticket</span>
        </div>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Restore"
      cancelText="Cancel"
      okButtonProps={{ type: 'primary', loading }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <Text type="success" strong>
            ✅ Are you sure you want to restore this ticket?
          </Text>
          <br />
          <Text type="secondary">This will make the ticket active again.</Text>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <Text>
          Click <b>Restore</b> to confirm, or <b>Cancel</b> to go back.
        </Text>
      </Space>
    </Modal>
  );
};

export default RestoreTicketModal;
