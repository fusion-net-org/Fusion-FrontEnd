/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Modal, Select, Input, Typography, Space, Divider } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { DeleteTicket } from '@/services/TicketService.js';

const { Option } = Select;
const { Text } = Typography;

interface DeleteTicketModalProps {
  visible: boolean;
  ticketId?: string;
  onCancel: () => void;
  onDeleted?: () => void;
}

const DeleteTicketModal: React.FC<DeleteTicketModalProps> = ({
  visible,
  ticketId,
  onCancel,
  onDeleted,
}) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!ticketId) return;
    const finalReason = reason === 'Other' ? otherReason.trim() : reason;
    if (!finalReason) {
      toast.warning('⚠️ Please select or enter a reason before deleting.', {
        position: 'top-right',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await DeleteTicket(ticketId, finalReason);
      if (response.statusCode === 200) {
        toast.success(response.message);
        onDeleted?.();
        onCancel();
      }
    } catch (error: any) {
      console.error('DeleteTicket error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 20 }} />
          <span className="font-semibold text-red-500">Delete Ticket</span>
        </div>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{
        danger: true,
        loading,
        disabled: !reason || (reason === 'Other' && !otherReason.trim()),
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <Text type="danger" strong>
            ⚠️ This action cannot be undone.
          </Text>
          <br />
          <Text type="secondary">Please select a reason for deleting this ticket.</Text>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>Select reason</Text>
          <Select
            placeholder="Choose a reason"
            style={{ width: '100%', marginTop: 6 }}
            value={reason || undefined}
            onChange={(value) => setReason(value)}
            size="middle"
          >
            <Option value="Duplicate">Duplicate</Option>
            <Option value="Invalid">Invalid</Option>
            <Option value="Other">Other (specify)</Option>
          </Select>
        </div>

        {reason === 'Other' && (
          <div>
            <Text strong>Other reason</Text>
            <Input.TextArea
              placeholder="Please enter the reason for deletion"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{ marginTop: 6 }}
            />
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default DeleteTicketModal;
