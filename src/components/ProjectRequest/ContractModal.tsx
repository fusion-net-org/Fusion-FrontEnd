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
import { Steps } from 'antd';
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
  { label: 'Appendix A - Workflow Process', value: 'Appendix A - Workflow Process' },
  { label: 'Appendix B - Information Security', value: 'Appendix B - Information Security' },
  { label: 'Appendix C - Payment Terms', value: 'Appendix C - Payment Terms' },
  { label: 'Appendix D - Human Resources Policy', value: 'Appendix D - Human Resources Policy' },
  { label: 'Appendix E - User Guide', value: 'Appendix E - User Guide' },
  { label: 'Appendix F - Financial Report', value: 'Appendix F - Financial Report' },
  {
    label: 'Appendix G - Confidentiality Regulations',
    value: 'Appendix G - Confidentiality Regulations',
  },
  { label: 'Appendix H - Quality Standards', value: 'Appendix H - Quality Standards' },
  { label: 'Appendix I - Legal Terms', value: 'Appendix I - Legal Terms' },
  { label: 'Appendix J - Supporting Agreement', value: 'Appendix J - Supporting Agreement' },
];

const ContractModal: React.FC<ContractModalProps> = ({ open, onClose, onNext }) => {
  const [form] = Form.useForm<ContractFormValues>();
  const [loading, setLoading] = useState(false);
  const { companyId } = useParams<{ companyId: string }>();
  const [companyRequester, setCompanyRequester] = useState<CompanyRequest | null>(null);
  const [companyExecutor, setCompanyExecutor] = useState<CompanyRequestV2[]>([]);
  console.log('companyExecutor', companyExecutor);
  console.log('companyRequester', companyRequester);

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
      console.log('contractResponse', contractResponse);
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
      const apiMessage = error?.response?.data?.message || error?.message;

      toast.error(apiMessage);
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
      <Steps
        current={0}
        items={[{ title: 'Create Contract' }, { title: 'Create Project Request' }]}
        style={{ marginBottom: 20 }}
      />
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

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            label="Contract Code"
            name="contractCode"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="Enter contract code" />
          </Form.Item>

          <Form.Item
            label="Contract Name"
            name="contractName"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="Enter contract name" />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            label="Effective Date"
            name="effectiveDate"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Expired Date"
            name="expiredDate"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>
        <Form.Item
          label="Budget"
          name="budget"
          rules={[
            { required: true, message: 'Please enter budget' },
            {
              validator: (_, value) => {
                if (value === undefined || value === null) {
                  return Promise.reject('Budget is required');
                }
                if (value <= 0) {
                  return Promise.reject('Budget must be greater than 0');
                }
                return Promise.resolve();
              },
            },
          ]}
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
