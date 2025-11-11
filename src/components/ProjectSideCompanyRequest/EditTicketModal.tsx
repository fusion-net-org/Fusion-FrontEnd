/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, InputNumber } from 'antd';
import type { ITicket } from '@/interfaces/Ticket/Ticket';

const { Option } = Select;

interface EditTicketModalProps {
  visible: boolean;
  ticket?: ITicket;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({
  visible,
  ticket,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (ticket) {
      form.setFieldsValue({
        ticketName: ticket.ticketName,
        description: ticket.description,
        projectId: ticket.projectId,
        priority: ticket.priority,
        isHighestUrgen: ticket.isHighestUrgen,
        statusId: ticket.statusId,
        isBillable: ticket.isBillable,
        budget: ticket.budget,
      });
    }
  }, [ticket]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Edit Ticket"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Save"
      cancelText="Cancel"
    >
      <Form layout="vertical" form={form} colon={false}>
        <Form.Item label="Ticket Name" name="ticketName" rules={[{ required: true }]}>
          <Input size="middle" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} size="middle" />
        </Form.Item>
        <Form.Item label="Project ID" name="projectId">
          <Input size="middle" />
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
        <Form.Item label="Billable" name="isBillable" valuePropName="checked">
          <Switch size="small" />
        </Form.Item>
        <Form.Item label="Status ID" name="statusId">
          <Input size="middle" />
        </Form.Item>

        <Form.Item label="Budget" name="budget">
          <InputNumber min={0} style={{ width: '100%' }} size="middle" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTicketModal;
