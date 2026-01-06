/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Switch } from 'antd';
import { CreateTicket } from '@/services/TicketService.js';
import { GetWorkflowStatusByProjectId } from '@/services/workflowstatusService.js';
import LoadingOverlay from '@/common/LoadingOverlay';
import { toast } from 'react-toastify';
import type { IProject } from '@/interfaces/ProjectMember/projectMember';
import { CircleDot, Wrench } from 'lucide-react';
import { getProjectComponentsByProjectId } from '@/services/projectComponentService.js';
const { TextArea } = Input;
const { Option } = Select;
interface CreateTicketPopupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects?: IProject[];
  defaultProjectId?: string;
}
const TICKET_TYPES = [
  { label: 'Bug', value: 'Bug' },
  { label: 'Enhancement', value: 'Enhancement' },
  { label: 'New Feature', value: 'NewFeature' },
  { label: 'Task', value: 'Task' },
  { label: 'Hotfix', value: 'Hotfix' },
  { label: 'Improvement', value: 'Improvement' },
  { label: 'Spike', value: 'Spike' },
];

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
  const [companyRequestName, setCompanyRequestName] = useState('');
  const [companyExecutorName, setCompanyExecutorName] = useState('');
  const [ticketType, setTicketType] = useState<string>('Bug');
  const [isMaintenanceProject, setIsMaintenanceProject] = useState(false);
  const [projectComponents, setProjectComponents] = useState<any[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>('');

  console.log(
    'isMaintenance values:',
    projects.map((p) => p.isMaintenance),
  );
  console.log('selectedProjectId', selectedProjectId);
  console.log("'isMaintenanceProject'", isMaintenanceProject);

  const formatNumber = (value: string) =>
    value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const handleBudgetChange = (e: any) => {
    const raw = e.target.value.replace(/\./g, '');
    setBudget(formatNumber(raw));
  };
  const resetForm = () => {
    setSelectedProjectId(defaultProjectId || projects[0]?.id || '');
    setPriority('Medium');
    setTicketType('Bug');
    setIsHighestUrgen(false);
    setTicketName('');
    setDescription('');
    setIsBillable(false);
    setBudget('0');
  };

  const handleCreate = async () => {
    if (!selectedProjectId) {
      toast.warning('Please Choose Project');
      return;
    }

    if (!ticketName.trim()) {
      toast.warning('Ticket name is required!');
      return;
    }
    if (isMaintenanceProject && !selectedComponentId) {
      toast.warning('Please choose a maintenance component');
      return;
    }
    const payload: any = {
      priority,
      isHighestUrgen,
      ticketName,
      ticketType,
      description,
      isBillable,
      budget: Number(budget.replace(/\./g, '')),
    };

    if (selectedProjectId) payload.projectId = selectedProjectId;

    if (isMaintenanceProject && selectedComponentId) {
      payload.componentId = selectedComponentId;
    }
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

  useEffect(() => {
    if (defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const selected = projects.find((p) => p.id === selectedProjectId);
      setCompanyRequestName(selected?.companyRequestName || '');
      setCompanyExecutorName(selected?.companyExecutorName || '');
    }
  }, [selectedProjectId, projects]);

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
          <div className="flex flex-col w-full">
            <label className="font-semibold mb-1">Project</label>
            <Select
              value={selectedProjectId || undefined}
              onChange={async (value) => {
                setSelectedProjectId(value);
                const selected = projects.find((p) => p.id === value);
                setCompanyRequestName(selected?.companyRequestName || '');
                setCompanyExecutorName(selected?.companyExecutorName || '');
                const isMaintenance = !!selected?.isMaintenance;
                setIsMaintenanceProject(isMaintenance);

                setProjectComponents([]);
                setSelectedComponentId('');

                if (isMaintenance && value) {
                  try {
                    const res = await getProjectComponentsByProjectId(value);
                    setProjectComponents(res?.data || []);
                  } catch (err) {
                    toast.error('Failed to load project components');
                    console.error(err);
                  }
                }
              }}
              className="w-full"
              placeholder="Select project"
              disabled={projects.length === 0}
            >
              {projects.map((p) => (
                <Option key={p.id} value={p.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{p.name}</span>

                    {p.isMaintenance ? (
                      <span className="flex items-center gap-1 text-orange-500 shrink-0">
                        <Wrench size={14} />
                        <span className="text-sm">(Maintenance)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 shrink-0">
                        <CircleDot size={12} />
                        <span className="text-sm">(Development)</span>
                      </span>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
            {projects.length === 0 && (
              <span className="text-sm text-gray-700 mt-1">
                No project available. Please create or join a project first.
              </span>
            )}
          </div>

          {selectedProjectId && (
            <div className="flex gap-3 mt-2">
              <div className="flex flex-col w-1/2">
                <label className="font-semibold mb-1">Company Request Name</label>
                <Input value={companyRequestName} disabled />
              </div>

              <div className="flex flex-col w-1/2">
                <label className="font-semibold mb-1">Company Executor Name</label>
                <Input value={companyExecutorName} disabled />
              </div>
            </div>
          )}
          {isMaintenanceProject && (
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Project Maintence Component</label>
              <Select
                value={selectedComponentId || undefined}
                onChange={setSelectedComponentId}
                className="w-full"
                placeholder="Select component"
                loading={loading && projectComponents.length === 0}
                allowClear
              >
                {projectComponents.map((c: any) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>

              {projectComponents.length === 0 && (
                <span className="text-sm text-gray-500 mt-1">
                  No component available for this maintenance project
                </span>
              )}
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
          {/* Ticket Type */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Ticket Type</label>
            <Select
              value={ticketType}
              onChange={setTicketType}
              className="w-full"
              placeholder="Select ticket type"
            >
              {TICKET_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
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

          {/* Budget, Priority & Highest Urgency */}
          <div className="flex gap-3 items-end">
            {/* Budget */}
            <div className="flex flex-col w-1/3">
              <label className="font-semibold mb-1">Budget (VNĐ)</label>
              <Input placeholder="0" value={budget} onChange={handleBudgetChange} />
            </div>

            {/* Priority */}
            <div className="flex flex-col w-1/3">
              <label className="font-semibold mb-1">Priority</label>
              <Select value={priority} onChange={setPriority} className="w-full">
                <Option value="Urgent">Urgent</Option>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </div>

            {/* Highest Urgency */}
            <div className="flex items-center w-1/3 gap-2 mb-1.5 ml-1">
              <Switch checked={isHighestUrgen} onChange={setIsHighestUrgen} />
              <label className="font-semibold mb-0">Highest Urgency</label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CreateTicketPopup;
