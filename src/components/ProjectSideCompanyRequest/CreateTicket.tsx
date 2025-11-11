/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Switch } from 'antd';
import { CreateTicket } from '@/services/TicketService.js';
import { GetWorkflowStatusByProjectId } from '@/services/WorkflowStatusService.js';
import LoadingOverlay from '@/common/LoadingOverlay';
import { toast } from 'react-toastify';
const { TextArea } = Input;
const { Option } = Select;

interface CreateTicketPopupProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

const CreateTicketPopup: React.FC<CreateTicketPopupProps> = ({
  visible,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [priority, setPriority] = useState('Medium');
  const [isHighestUrgen, setIsHighestUrgen] = useState(false);
  const [ticketName, setTicketName] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(false);
  const [budget, setBudget] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<{ id: string; name: string }[]>([]);
  const [statusId, setStatusId] = useState<string>('');

  const formatNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleBudgetChange = (e: any) => {
    const raw = e.target.value.replace(/\./g, '');
    const formatted = formatNumber(raw);
    setBudget(formatted);
  };

  const resetForm = () => {
    setPriority('Medium');
    setIsHighestUrgen(false);
    setTicketName('');
    setDescription('');
    setIsBillable(false);
    setBudget('0');
    setStatusId(workflowStatuses[0]?.id ?? '');
  };

  // Load workflow statuses from API
  useEffect(() => {
    if (!projectId) return;

    const fetchWorkflowStatuses = async () => {
      try {
        setLoading(true);
        const res = await GetWorkflowStatusByProjectId(projectId);
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
  }, [projectId]);

  const handleCreate = async () => {
    if (!ticketName.trim()) {
      toast.warning('Ticket name is required!');
      return;
    }

    const payload = {
      projectId,
      priority,
      isHighestUrgen,
      ticketName,
      description,
      statusId, // <-- đây là id
      isBillable,
      budget: Number(budget.replace(/\./g, '')),
    };

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
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Ticket Title</label>
            <Input
              placeholder="Enter ticket name..."
              value={ticketName}
              onChange={(e) => setTicketName(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Description</label>
            <TextArea
              placeholder="Enter description..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

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

            <div className="flex flex-col w-1/2">
              <label className="font-semibold mb-1">Workflow Status</label>
              <Select
                showSearch
                placeholder="Select workflow status"
                value={statusId}
                onChange={setStatusId}
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
          </div>

          <label className="flex gap-2 items-center">
            <Switch checked={isHighestUrgen} onChange={setIsHighestUrgen} />
            Highest Urgency
          </label>

          <label className="flex gap-2 items-center">
            <Switch checked={isBillable} onChange={setIsBillable} />
            Billable
          </label>

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
