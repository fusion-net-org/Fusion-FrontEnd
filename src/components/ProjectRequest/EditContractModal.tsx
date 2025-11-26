/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Form, DatePicker, InputNumber, Select, Spin } from 'antd';
import dayjs from 'dayjs';
import { getContractById, updateContract } from '@/services/contractService.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ContractFormValues {
  contractCode: string;
  contractName: string;
  effectiveDate?: dayjs.Dayjs;
  expiredDate?: dayjs.Dayjs;
  budget: number;
  appendices: { id?: string; type?: string; custom?: string }[];
}

interface EditContractModalProps {
  open: boolean;
  contractId: string;
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_APPENDICES = [
  { label: 'Phụ lục A - Quy trình làm việc', value: 'Phụ lục A - Quy trình làm việc' },
  { label: 'Phụ lục B - Bảo mật thông tin', value: 'Phụ lục B - Bảo mật thông tin' },
  { label: 'Phụ lục C - Điều khoản thanh toán', value: 'Phụ lục C - Điều khoản thanh toán' },
  { label: 'Phụ lục D - Chính sách nhân sự', value: 'Phụ lục D - Chính sách nhân sự' },
  { label: 'Phụ lục E - Hướng dẫn sử dụng', value: 'Phụ lục E - Hướng dẫn sử dụng' },
  { label: 'Phụ lục F - Báo cáo tài chính', value: 'Phụ lục F - Báo cáo tài chính' },
  { label: 'Phụ lục G - Quy định bảo mật', value: 'Phụ lục G - Quy định bảo mật' },
  { label: 'Phụ lục H - Tiêu chuẩn chất lượng', value: 'Phụ lục H - Tiêu chuẩn chất lượng' },
  { label: 'Phụ lục I - Điều khoản pháp lý', value: 'Phụ lục I - Điều khoản pháp lý' },
  { label: 'Phụ lục J - Hợp đồng phụ trợ', value: 'Phụ lục J - Hợp đồng phụ trợ' },
];

const EditContractModal: React.FC<EditContractModalProps> = ({
  open,
  contractId,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm<ContractFormValues>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [dynamicAppendices, setDynamicAppendices] = useState<any[]>([]);

  useEffect(() => {
    if (open && contractId) {
      setInitialLoading(true);
      getContractById(contractId)
        .then((res: any) => {
          const data = res.data;

          // Build dynamic appendices options
          const dyn =
            data.appendices?.map((a: any) => ({
              label: a.appendixName,
              value: a.appendixName,
            })) || [];
          setDynamicAppendices(dyn);

          form.setFieldsValue({
            contractCode: data.contractCode,
            contractName: data.contractName,
            effectiveDate: data.effectiveDate ? dayjs(data.effectiveDate) : undefined,
            expiredDate: data.expiredDate ? dayjs(data.expiredDate) : undefined,
            budget: data.budget,
            appendices: data.appendices?.map((a: any) => ({
              id: a.id, // giữ id để update đúng
              type: a.appendixName,
              custom: a.appendixDescription || '',
            })),
          });
        })
        .catch((err: any) => {
          console.error(err);
          toast.error('Failed to load contract data');
        })
        .finally(() => setInitialLoading(false));
    }
  }, [open, contractId, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();

      const effectiveDate = values.effectiveDate
        ? dayjs(values.effectiveDate).format('YYYY-MM-DD')
        : undefined;

      const expiredDate = values.expiredDate
        ? dayjs(values.expiredDate).format('YYYY-MM-DD')
        : undefined;

      if (!effectiveDate || !expiredDate) {
        toast.error('EffectiveDate and ExpiredDate are required');
        setLoading(false);
        return;
      }

      const appendicesData =
        values.appendices?.map((a: any) => ({
          id: a.id || null, // giữ id nếu có
          title: a.type,
          description: a.custom || '',
        })) || [];

      const payload = {
        contractCode: values.contractCode,
        contractName: values.contractName,
        effectiveDate,
        expiredDate,
        budget: values.budget,
        appendices: appendicesData,
      };

      await updateContract(contractId, payload);

      toast.success('Contract updated successfully');
      form.resetFields();
      onSave();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to update contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="Edit Contract"
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      {initialLoading ? (
        <div className="text-center py-10">
          <Spin />
        </div>
      ) : (
        <Form form={form} layout="vertical" initialValues={{ budget: 0, appendices: [] }}>
          <Form.Item label="Contract Code" name="contractCode" rules={[{ required: true }]}>
            <Input placeholder="Enter contract code" />
          </Form.Item>

          <Form.Item label="Contract Name" name="contractName" rules={[{ required: true }]}>
            <Input placeholder="Enter contract name" />
          </Form.Item>

          <Form.Item label="Effective Date" name="effectiveDate" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Expired Date" name="expiredDate" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Budget"
            name="budget"
            rules={[{ required: true, message: 'Please enter budget' }]}
          >
            <InputNumber<number>
              className="w-full"
              placeholder="Enter budget"
              min={0}
              defaultValue={0}
              formatter={(value) =>
                value !== undefined && value !== null
                  ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                  : ''
              }
              parser={(value) => (value ? Number(value.replace(/\./g, '')) : 0)}
            />
          </Form.Item>

          <Form.List name="appendices">
            {(fields, { add, remove }) => (
              <div>
                <label>Appendices (Optional)</label>

                {fields.map((field) => {
                  const value = form.getFieldValue(['appendices', field.name, 'type']);
                  const isOther = value === 'OTHER';

                  return (
                    <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      {isOther ? (
                        <Form.Item
                          name={[field.name, 'type']}
                          style={{ flex: 1 }}
                          rules={[{ required: true, message: 'Enter appendix name' }]}
                        >
                          <Input placeholder="Enter appendix name" />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          name={[field.name, 'type']}
                          style={{ flex: 1 }}
                          rules={[{ required: true, message: 'Select appendix or Other' }]}
                        >
                          <Select
                            placeholder="Select appendix"
                            options={[
                              ...dynamicAppendices,
                              ...DEFAULT_APPENDICES,
                              { label: 'Other', value: 'OTHER' },
                            ]}
                            onChange={(val) => {
                              if (val === 'OTHER') {
                                form.setFieldsValue({
                                  appendices: form
                                    .getFieldValue('appendices')
                                    .map((item: any, idx: number) =>
                                      idx === field.name ? { ...item, type: 'OTHER' } : item,
                                    ),
                                });
                              }
                            }}
                          />
                        </Form.Item>
                      )}

                      <Form.Item name={[field.name, 'custom']} style={{ flex: 1 }}>
                        <Input placeholder="Enter appendix description (optional)" />
                      </Form.Item>

                      <Button danger onClick={() => remove(field.name)}>
                        X
                      </Button>
                    </div>
                  );
                })}

                <Button type="dashed" onClick={() => add()} block>
                  + Add Appendix
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      )}
    </Modal>
  );
};

export default EditContractModal;
