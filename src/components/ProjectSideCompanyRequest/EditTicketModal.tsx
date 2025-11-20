/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Switch, InputNumber } from 'antd';
import type { ITicket } from '@/interfaces/Ticket/Ticket';
import { UpdateTicket } from '@/services/TicketService.js';
import { GetWorkflowStatusByProjectId } from '@/services/WorkflowStatusService.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Option } = Select;

interface EditTicketModalProps {
  visible: boolean;
  ticket?: ITicket;
  projectId: string;
  onCancel: () => void;
  onUpdated: (updatedTicket: ITicket) => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({
  visible,
  ticket,
  projectId,
  onCancel,
  onUpdated,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (visible && projectId) {
      const fetchWorkflowStatuses = async () => {
        try {
          const res = await GetWorkflowStatusByProjectId(projectId);
          const items = res.data?.items ?? [];
          setWorkflowStatuses(items.map((i: any) => ({ id: i.id, name: i.name })));
        } catch (err) {
          console.error('Failed to fetch workflow statuses', err);
          toast.error('Failed to load workflow statuses');
        }
      };
      fetchWorkflowStatuses();
    }
  }, [visible, projectId]);

  useEffect(() => {
    if (visible && ticket) {
      form.setFieldsValue({
        ticketName: ticket.ticketName,
        description: ticket.description,
        projectId: projectId,
        priority: ticket.priority,
        isHighestUrgen: ticket.isHighestUrgen,
        statusId: ticket.statusId,
        budget: ticket.budget,
      });
    } else if (!visible) {
      form.resetFields();
    }
  }, [ticket, projectId, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!ticket) return;

      const payload = {
        projectId,
        ticketName: values.ticketName,
        description: values.description,
        priority: values.priority,
        isHighestUrgen: values.isHighestUrgen,
        statusId: values.statusId,
        budget: values.budget ?? 0,
      };

      setLoading(true);
      const updated = await UpdateTicket(ticket.id, payload);
      if (updated.statusCode === 200) {
        toast.success(updated.message);
        onUpdated(updated.data ?? updated);
        form.resetFields();
        onCancel();
      }
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error?.response?.data?.message || 'Update ticket failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Ticket"
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText="Save"
      cancelText="Cancel"
      confirmLoading={loading}
    >
      <Form layout="vertical" form={form} colon={false}>
        <Form.Item label="Ticket Name" name="ticketName">
          <Input size="middle" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} size="middle" />
        </Form.Item>

        <Form.Item label="Priority" name="priority">
          <Select size="middle">
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Highest Urgent" name="isHighestUrgen" valuePropName="checked">
          <Switch size="small" />
        </Form.Item>

        <Form.Item label="Workflow Status" name="statusId">
          <Select size="middle" placeholder="Select status">
            {workflowStatuses.map((status) => (
              <Option key={status.id} value={status.id}>
                {status.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Budget" name="budget">
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            size="middle"
            formatter={(value?: number | string) =>
              value !== undefined && value !== null
                ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                : ''
            }
            parser={(value?: string) => (value ? parseInt(value.replace(/\./g, ''), 10) : 0)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTicketModal;
