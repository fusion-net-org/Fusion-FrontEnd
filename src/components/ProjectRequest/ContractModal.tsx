/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Form, DatePicker, InputNumber, Upload, Select } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { createContract } from '@/services/contractService.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { uploadContractFile } from '@/services/contractService.js';
import { useParams } from 'react-router-dom';
import { getCompanyById } from '@/services/companyService.js';
import type { CompanyRequest, CompanyRequestV2 } from '@/interfaces/Company/company';
import { GetAllPartnersOfCompany } from '@/services/partnerService.js';
interface ContractFormValues {
  executorCompanyId: string;
  requesterCompanyId: string;
  contractCode: string;
  contractName: string;
  effectiveDate: string;
  expiredDate: string;
  budget: number;
  appendices: { type?: string; custom?: string }[];
  contractFile: UploadFile[];
}
interface ContractNextData {
  contractId: string;
  effectiveDate: string;
  expiredDate: string;
  executorCompanyId: string;
}
interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  onNext: (values: ContractNextData) => void;
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

const ContractModal: React.FC<ContractModalProps> = ({ open, onClose, onNext }) => {
  const [form] = Form.useForm<ContractFormValues>();
  const [loading, setLoading] = useState(false);
  const { companyId } = useParams<{ companyId: string }>();
  const [companyRequester, setCompanyRequester] = useState<CompanyRequest | null>(null);
  const [companyExecutor, setCompanyExecutor] = useState<CompanyRequestV2[]>([]);

  const fetchCompanyRequestById = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const response = await getCompanyById(companyId);
      setCompanyRequester(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error fetching company details');
    } finally {
      setLoading(false);
    }
  };
  const fetchCompanyExecutorById = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const response = await GetAllPartnersOfCompany(companyId);
      console.log('response', response.data);
      setCompanyExecutor(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error fetching company details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyRequestById();
    fetchCompanyExecutorById();
  }, [companyId]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };
  const handleNext = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();

      const effectiveDate = values.effectiveDate
        ? dayjs(values.effectiveDate).format('YYYY-MM-DD')
        : null;
      const expiredDate = values.expiredDate
        ? dayjs(values.expiredDate).format('YYYY-MM-DD')
        : null;

      if (!effectiveDate || !expiredDate) {
        toast.error('EffectiveDate and ExpiredDate are required');
        setLoading(false);
        return;
      }

      const appendicesData =
        values.appendices?.map((a: any) => ({
          title: a.type,
          description: a.custom || '',
        })) || [];

      const payload = {
        ExecutorCompanyId: values.executorCompanyId,
        RequesterCompanyId: values.requesterCompanyId,
        ContractCode: values.contractCode,
        ContractName: values.contractName,
        EffectiveDate: effectiveDate,
        ExpiredDate: expiredDate,
        Budget: values.budget,
        Appendices: appendicesData,
      };

      const contractResponse = await createContract(payload);

      const contractData = contractResponse.data;

      const fileList = values.contractFile;
      if (fileList && fileList.length > 0) {
        const file = fileList[0].originFileObj as File;
        await uploadContractFile(contractData.id, file);
      }

      form.resetFields();
      onNext({
        contractId: contractData.id,
        effectiveDate: contractData.effectiveDate,
        expiredDate: contractData.expiredDate,
        executorCompanyId: values.executorCompanyId,
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="Create Contract"
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button key="next" type="primary" loading={loading} onClick={handleNext}>
          Next
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          budget: 0,
          appendices: [],
        }}
      >
        <Form.Item label="Requester Company">
          <Input value={companyRequester?.name} disabled />
        </Form.Item>

        <Form.Item name="requesterCompanyId" initialValue={companyRequester?.id} hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="Executor Company"
          name="executorCompanyId"
          rules={[{ required: true, message: 'Executor Company is required' }]}
        >
          <Select
            placeholder="Select executor company"
            showSearch
            optionFilterProp="label"
            options={companyExecutor.map((p) => ({
              label: p.name,
              value: p.id,
            }))}
          />
        </Form.Item>

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
                          options={[...DEFAULT_APPENDICES, { label: 'Other', value: 'OTHER' }]}
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
                      <Input placeholder="Enter custom appendix (optional)" />
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

        <Form.Item
          label="Upload Contract File"
          name="contractFile"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
          rules={[{ required: true, message: 'Please upload contract file' }]}
          className="mt-3"
        >
          <Upload beforeUpload={() => false} maxCount={1}>
            <Button>Upload Contract</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContractModal;
