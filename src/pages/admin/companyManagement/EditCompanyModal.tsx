// src/pages/admin/EditCompanyModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Row, Col, Button, message } from 'antd';
import { toast } from 'react-toastify';
import type { FC } from 'react';

export type CompanyPayload = {
  name?: string;
  taxCode?: string;
  detail?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
};

interface EditCompanyModalProps {
  open: boolean;
  data: (Partial<CompanyPayload> & { [key: string]: any }) | null;
  onClose: () => void;
  onSaved: (payload: CompanyPayload) => Promise<void> | void;
}

const EditCompanyModal: FC<EditCompanyModalProps> = ({ open, data, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: data?.name ?? '',
      taxCode: data?.taxCode ?? '',
      detail: data?.detail ?? '',
      email: data?.email ?? '',
      phoneNumber: data?.phoneNumber ?? '',
      address: data?.address ?? '',
      website: data?.website ?? '',
    });
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await onSaved(values as CompanyPayload);
      toast.success('Company updated successfully');
      onClose();
    } catch (err: any) {
      if (!err?.errorFields) {
        console.error(err);
        toast.error(err?.message || 'Update failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit Company"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{}}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Name required' }]}
            >
              <Input placeholder="Company name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="taxCode" label="Tax Code">
              <Input placeholder="Tax code" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Invalid email' }]}
            >
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phoneNumber"
              label="Phone Number"
              rules={[{ pattern: /^\d{10}$/, message: 'Phone must be 10 digits' }]}
            >
              <Input maxLength={10} placeholder="10-digit phone" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="website" label="Website">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input placeholder="Address" />
        </Form.Item>

        <Form.Item name="detail" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditCompanyModal;
