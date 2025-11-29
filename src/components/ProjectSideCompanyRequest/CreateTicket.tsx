/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Switch } from 'antd';
import { CreateTicket } from '@/services/TicketService.js';
import { GetWorkflowStatusByProjectId } from '@/services/WorkflowStatusService.js';
import LoadingOverlay from '@/common/LoadingOverlay';
import { toast } from 'react-toastify';
import type { IProject } from '@/interfaces/ProjectMember/projectMember';

const { TextArea } = Input;
const { Option } = Select;
interface CreateTicketPopupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects?: IProject[];
  defaultProjectId?: string;
}

const CreateTicketPopup: React.FC<CreateTicketPopupProps> = ({
  visible,
  onClose,
  onSuccess,
  projects = [],
  defaultProjectId,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || projects[0]?.id || '',
  );
  const [priority, setPriority] = useState('Medium');
  const [isHighestUrgen, setIsHighestUrgen] = useState(false);
  const [ticketName, setTicketName] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(false);
  const [budget, setBudget] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<{ id: string; name: string }[]>([]);
  const [statusId, setStatusId] = useState<string>('');

  const formatNumber = (value: string) =>
    value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const handleBudgetChange = (e: any) => {
    const raw = e.target.value.replace(/\./g, '');
    setBudget(formatNumber(raw));
  };

  const resetForm = () => {
    setSelectedProjectId(defaultProjectId || projects[0]?.id || '');
    setPriority('Medium');
    setIsHighestUrgen(false);
    setTicketName('');
    setDescription('');
    setIsBillable(false);
    setBudget('0');
    setStatusId('');
  };

  // Load workflow statuses khi project thay đổi
  useEffect(() => {
    if (!selectedProjectId) {
      setWorkflowStatuses([]);
      setStatusId('');
      return;
    }

    const fetchWorkflowStatuses = async () => {
      try {
        setLoading(true);
        const res = await GetWorkflowStatusByProjectId(selectedProjectId);
        const items = res.data?.items ?? [];
        setWorkflowStatuses(items.map((i: any) => ({ id: i.id, name: i.name })));
        setStatusId(items[0]?.id ?? '');
      } catch (err: any) {
        toast.error('Failed to load workflow statuses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowStatuses();
  }, [selectedProjectId]);

  const handleCreate = async () => {
    if (!ticketName.trim()) {
      toast.warning('Ticket name is required!');
      return;
    }

    const payload: any = {
      priority,
      isHighestUrgen,
      ticketName,
      description,
      isBillable,
      budget: Number(budget.replace(/\./g, '')),
    };

    if (selectedProjectId) payload.projectId = selectedProjectId;
    if (statusId) payload.statusId = statusId;

    try {
      setLoading(true);
      await CreateTicket(payload);
      toast.success('Ticket created successfully!');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create ticket!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingOverlay message="loading ticket..." loading={loading} />}

      <Modal
        title={<span className="font-semibold text-lg">Create Ticket</span>}
        open={visible}
        onCancel={() => {
          resetForm();
          onClose();
        }}
        onOk={handleCreate}
        okText="Create"
        confirmLoading={loading}
        okButtonProps={{ disabled: loading }}
        cancelButtonProps={{ disabled: loading }}
        width={650}
      >
        <div className="flex flex-col gap-4">
          {/* Project dropdown only if projects exist */}
          {projects.length > 0 && (
            <div className="flex flex-col w-full">
              <label className="font-semibold mb-1">Project</label>
              <Select
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                allowClear
                className="w-full"
                placeholder="Select project (optional)"
              >
                {projects.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* Ticket title */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Ticket Title</label>
            <Input
              placeholder="Enter ticket name..."
              value={ticketName}
              onChange={(e) => setTicketName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Description</label>
            <TextArea
              placeholder="Enter description..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Priority & Workflow status */}
          <div className="flex gap-3">
            <div className="flex flex-col w-1/2">
              <label className="font-semibold mb-1">Priority</label>
              <Select value={priority} onChange={setPriority} className="w-full">
                <Option value="Urgent">Urgent</Option>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </div>

            {/* {workflowStatuses.length > 0 && ( */}
            <div className="flex flex-col w-1/2">
              <label className="font-semibold mb-1">Workflow Status</label>
              <Select
                showSearch
                placeholder="Select workflow status"
                value={statusId}
                onChange={setStatusId}
                allowClear
                filterOption={(input, option: any) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
                className="w-full"
              >
                {workflowStatuses.map((status) => (
                  <Option key={status.id} value={status.id}>
                    {status.name}
                  </Option>
                ))}
              </Select>
            </div>
            {/* )} */}
          </div>

          {/* Highest Urgency */}
          <label className="flex gap-2 items-center">
            <Switch checked={isHighestUrgen} onChange={setIsHighestUrgen} />
            Highest Urgency
          </label>

          {/* Budget */}
          <div className="flex flex-col w-full">
            <label className="font-semibold mb-1">Budget (VNĐ)</label>
            <Input placeholder="0" value={budget} onChange={handleBudgetChange} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CreateTicketPopup;
