import React, { useState } from 'react';
import { Modal, Select, Input, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

interface DeleteTicketModalProps {
  visible: boolean;
  ticketId?: string;
  onCancel: () => void;
  onDelete: (ticketId: string | undefined, reason: string) => void;
}

const DeleteTicketModal: React.FC<DeleteTicketModalProps> = ({
  visible,
  ticketId,
  onCancel,
  onDelete,
}) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const handleOk = () => {
    const finalReason = reason === 'Other' ? otherReason : reason;
    onDelete(ticketId, finalReason);
  };

  return (
    <Modal
      title="Delete Ticket"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{ danger: true }}
    >
      <Text type="danger">⚠️ Are you sure you want to delete this ticket?</Text>

      <div style={{ marginTop: 12 }}>
        <Select
          placeholder="Select reason"
          style={{ width: '100%' }}
          value={reason || undefined}
          onChange={(value) => setReason(value)}
          size="middle"
        >
          <Option value="Duplicate">Duplicate</Option>
          <Option value="Invalid">Invalid</Option>
          <Option value="Other">Other</Option>
        </Select>

        {reason === 'Other' && (
          <Input
            placeholder="Enter reason"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            style={{ marginTop: 10 }}
            size="middle"
          />
        )}
      </div>
    </Modal>
  );
};

export default DeleteTicketModal;
