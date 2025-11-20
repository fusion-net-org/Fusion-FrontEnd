import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, Avatar, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { AdminUser } from '@/interfaces/User/User';
import { putSelfUserByAdmin } from '@/services/userService.js';
import { toast } from 'react-toastify';

const { Option } = Select;

interface EditUserModalProps {
  open: boolean;
  selected: AdminUser | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditUserModal({ open, selected, onClose, onUpdated }: EditUserModalProps) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selected) {
      form.setFieldsValue({
        userName: selected.userName ?? '',
        email: selected.email ?? '',
        phone: selected.phone ?? '',
        address: selected.address ?? '',
        gender: selected.gender ?? '',
      });
      setFile(null);
    }
  }, [selected, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(values.phone)) {
        toast.error('Phone number must be exactly 10 digits and contain only numbers.');
        return;
      }

      setSaving(true);
      const fd = new FormData();
      fd.append('phone', values.phone);
      fd.append('address', values.address || '');
      fd.append('gender', values.gender || '');
      if (file) fd.append('avatar', file);

      const res = await putSelfUserByAdmin(selected!.id, fd);

      toast.success('User updated successfully!');
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.message ?? 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = (info: any) => {
    const newFile = info.file.originFileObj as File;
    setFile(newFile);
    return false;
  };

  return (
    <Modal open={open} title="Edit User" onCancel={onClose} footer={null} centered destroyOnClose>
      <Form layout="vertical" form={form} initialValues={{ gender: '' }} style={{ marginTop: 12 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="User Name" name="userName">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[
            { required: true, message: 'Phone number is required.' },
            {
              validator: (_, value) => {
                if (typeof value !== 'string') {
                  return Promise.reject('Phone number must be a string.');
                }
                if (!/^\d{10}$/.test(value)) {
                  return Promise.reject('Phone number must contain exactly 10 digits.');
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Enter 10-digit phone number" maxLength={10} />
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input placeholder="Enter address" />
        </Form.Item>

        <Form.Item label="Gender" name="gender">
          <Select placeholder="Select gender">
            <Option value="">—</Option>
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Avatar">
          <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
            <Button icon={<UploadOutlined />}>Upload Avatar</Button>
          </Upload>
          {file && <Avatar src={URL.createObjectURL(file)} size={64} style={{ marginTop: 10 }} />}
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
