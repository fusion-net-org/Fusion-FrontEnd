import React, { useEffect } from "react";
import { Modal, Form, Input, Switch } from "antd";
import type {
  FeatureResponse,
  FeatureCreateRequest,
  FeatureUpdateRequest,
} from "@/interfaces/Feature/FeatureCatalog";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: FeatureResponse | null;
  onSubmit: (payload: FeatureCreateRequest | FeatureUpdateRequest) => void;
};

const DEFAULT: FeatureCreateRequest = {
  code: "",
  name: "",
  description: "",
  category: "",
  isActive: true,
};

export default function FeatureModal({ open, onClose, initial, onSubmit }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!initial;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      form.setFieldsValue({
        code: initial.code,
        name: initial.name,
        description: (initial as any).description ?? "",
        category: (initial as any).category ?? "",
        isActive: initial.isActive,
      });
    } else {
      form.setFieldsValue(DEFAULT);
    }
  }, [open, initial, form]);

  const submit = async () => {
    const v = await form.validateFields();
    const payload: FeatureCreateRequest | FeatureUpdateRequest = isEdit
      ? { id: (initial as FeatureResponse).id, ...v }
      : v;
    onSubmit(payload as any);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      centered
      width={560}
      okText={isEdit ? "Update" : "Create"}
      title={isEdit ? "Edit feature" : "New feature"}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Code" name="code" rules={[{ required: true }]}>
          <Input placeholder="ax001…" />
        </Form.Item>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input placeholder="Project, Share…" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Optional" />
        </Form.Item>
        <Form.Item label="Category" name="category">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item label="Active" name="isActive" valuePropName="checked" initialValue>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
