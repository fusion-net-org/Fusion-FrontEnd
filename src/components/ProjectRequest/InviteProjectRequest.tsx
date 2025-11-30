/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Input, DatePicker } from 'antd';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import LoadingOverlay from '@/common/LoadingOverlay';
import { CreateProjectRequest } from '@/services/projectRequest.js';
import { getCompanyById, getAllCompanies } from '@/services/companyService.js';
import type { CompanyRequest } from '@/interfaces/Company/company';
import { AutoComplete } from 'antd';
import { debounce } from 'lodash';
import { Steps } from 'antd';

const { TextArea } = Input;

interface InviteProjectRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requesterCompanyId: string;
  executorCompanyId?: string;
  contractId?: string;
  effectiveDate?: string;
  expiredDate?: string;
}

const InviteProjectRequestModal: React.FC<InviteProjectRequestModalProps> = ({
  open,
  onClose,
  onSuccess,
  requesterCompanyId,
  executorCompanyId,
  contractId,
  effectiveDate,
  expiredDate,
}) => {
  const [formData, setFormData] = useState({
    requesterCompanyId: requesterCompanyId ?? null,
    executorCompanyId: executorCompanyId ?? null,
    contractId: contractId ?? null,
    name: '',
    description: '',
    startDate: effectiveDate ? dayjs(effectiveDate) : null,
    endDate: expiredDate ? dayjs(expiredDate) : null,
  });
  console.log('requesterCompanyId', requesterCompanyId);
  console.log('executorCompanyId', executorCompanyId);
  console.log('contractId', contractId);
  //state executor company
  const [executorSearch, setExecutorSearch] = useState('');
  const [executorOptions, setExecutorOptions] = useState<{ label: string; value: string }[]>([]);

  //state loading
  const [loading, setLoading] = useState(false);

  //state company
  const [company, setCompany] = useState<CompanyRequest | null>(null);

  const [executorValue, setExecutorValue] = useState('');
  const [executorCompany, setExecutorCompany] = useState<CompanyRequest | null>(null);

  // fetch company by id
  const fetchCompanyById = async () => {
    if (!requesterCompanyId) return;

    try {
      setLoading(true);
      const response = await getCompanyById(requesterCompanyId);
      console.log(response.data);
      setCompany(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error fetching company details');
    } finally {
      setLoading(false);
    }
  };
  const fetchExecutorCompany = async () => {
    if (!executorCompanyId) return;

    try {
      setLoading(true);
      const response = await getCompanyById(executorCompanyId);
      setExecutorCompany(response.data);
      setExecutorValue(response.data.name);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error fetching executor company details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCompanyById();
    }
  }, [open, requesterCompanyId]);

  useEffect(() => {
    if (open && executorCompanyId) {
      fetchExecutorCompany();
    }
  }, [open, executorCompanyId]);

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        requesterCompanyId: requesterCompanyId ?? prev.requesterCompanyId,
        executorCompanyId: executorCompanyId ?? prev.executorCompanyId,
        contractId: contractId ?? prev.contractId,
        startDate: effectiveDate ? dayjs(effectiveDate) : prev.startDate,
        endDate: expiredDate ? dayjs(expiredDate) : prev.endDate,
      }));
    }
  }, [open, requesterCompanyId, executorCompanyId, contractId, effectiveDate, expiredDate]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formatDate = (date: dayjs.Dayjs | null) =>
        date ? dayjs(date).format('YYYY-MM-DD') : null;

      const payload = {
        RequesterCompanyId: formData.requesterCompanyId,
        ExecutorCompanyId: formData.executorCompanyId,
        ContractId: formData.contractId, // dùng formData.contractId
        Name: formData.name,
        Description: formData.description || null,
        StartDate: formatDate(formData.startDate), // dùng formData.startDate
        EndDate: formatDate(formData.endDate), // dùng formData.endDate
      };

      const res = await CreateProjectRequest(payload);

      if (res?.succeeded) {
        toast.success(res.message || 'Project request created successfully!');
        onSuccess?.();
        onClose();
        setFormData({
          requesterCompanyId: requesterCompanyId ?? null,
          executorCompanyId: executorCompanyId ?? null,
          contractId: contractId ?? null,
          name: '',
          description: '',
          startDate: effectiveDate ? dayjs(effectiveDate) : null,
          endDate: expiredDate ? dayjs(expiredDate) : null,
        });
      } else {
        toast.error(res?.message || 'Failed to create project request');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating project request');
    } finally {
      setLoading(false);
    }
  };

  const searchExecutorCompany = async (keyword: string) => {
    setExecutorValue(keyword);
    if (!keyword) {
      setExecutorOptions([]);
      return;
    }
    try {
      const res = await getAllCompanies(keyword, '', '', null, null, 1, 50);
      const options = res.data.items.map((c: CompanyRequest) => ({
        label: c.name,
        value: c.id,
      }));
      setExecutorOptions(options);
    } catch (error: any) {
      toast.error(error.message || 'Error searching companies');
    }
  };

  const debounceSearch = useCallback(debounce(searchExecutorCompany, 800), []);
  useEffect(() => {
    return () => {
      debounceSearch.cancel();
    };
  }, []);

  //use effect open clsoe
  useEffect(() => {
    if (!open) {
      setFormData((prev) => ({
        ...prev,
        executorCompanyId: executorCompanyId ?? null,
        name: '',
        description: '',
        startDate: null,
        endDate: null,
      }));
      setExecutorValue('');
      setExecutorOptions([]);
    }
  }, [open, executorCompanyId]);

  return (
    <Modal
      title={<h2 className="text-lg font-semibold text-gray-800">New Project Request</h2>}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
    >
      <Steps
        current={1}
        items={[{ title: 'Create Contract' }, { title: 'Create Project Request' }]}
        style={{ marginBottom: 20 }}
      />
      <LoadingOverlay loading={loading} message="Creating project..." />

      <div className="flex flex-col gap-4 mt-2">
        {/* Request Company */}
        <div>
          <label className="text-sm font-medium text-gray-700 pb-1 inline-block">
            Request Company
          </label>
          <Input value={company?.name} readOnly className="bg-gray-100 cursor-not-allowed" />
        </div>

        {/* Execute Company */}
        <div>
          <label className="text-sm font-medium text-gray-700 pb-1 inline-block">
            Execute Company
          </label>
          {executorCompanyId ? (
            <Input
              value={executorCompany?.name}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
          ) : (
            <AutoComplete
              className="w-full"
              placeholder="Search Executor Company"
              options={executorOptions}
              value={executorValue}
              onSearch={searchExecutorCompany}
              onSelect={(value, option) => {
                handleChange('executorCompanyId', value);
                setExecutorValue(option.label);
              }}
              filterOption={false}
              allowClear
            />
          )}
        </div>

        {/* Project Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 pb-1 inline-block">
            Project Name
          </label>
          <Input
            placeholder="Enter project name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 pb-1 inline-block">Description</label>
          <TextArea
            placeholder="Enter project description (optional)"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Dates */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 pb-1 inline-block">
              Start Date
            </label>
            <DatePicker
              className="w-full"
              value={formData.startDate}
              onChange={(value) => handleChange('startDate', value)}
              format="DD/MM/YYYY"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 pb-1 inline-block">End Date</label>
            <DatePicker
              className="w-full"
              value={formData.endDate}
              onChange={(value) => handleChange('endDate', value)}
              format="DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => {
              onClose();
              setExecutorValue('');
              setExecutorOptions([]);
              setFormData((prev) => ({
                ...prev,
                executorCompanyId: executorCompanyId ?? null,
                name: '',
                description: '',
                startDate: null,
                endDate: null,
              }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Create Request
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InviteProjectRequestModal;
