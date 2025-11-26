import React, { useState } from 'react';
import { Input, Modal } from 'antd';
import { toast } from 'react-toastify';
import { UpdateComment } from '@/services/ticketCommentService.js';
import type { TicketCommentResponse } from '@/interfaces/TicketComment/ticketComment';

interface EditTicketCommentProps {
  comment: TicketCommentResponse;
  visible: boolean;
  onCancel: () => void;
  onUpdated: (updatedBody: string) => void;
}

const EditTicketComment: React.FC<EditTicketCommentProps> = ({
  comment,
  visible,
  onCancel,
  onUpdated,
}) => {
  const [body, setBody] = useState(comment.body);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await UpdateComment(comment.id, { body });
      if (res.succeeded) {
        toast.success(res.message);
        onUpdated(body);
        onCancel();
      } else {
        toast.error(res.message || 'Failed to update comment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Comment"
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      okText="Save"
      confirmLoading={loading}
    >
      <Input.TextArea
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Edit your comment"
      />
    </Modal>
  );
};

export default EditTicketComment;
