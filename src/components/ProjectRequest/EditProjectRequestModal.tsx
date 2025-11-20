/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { EditProjectRequest } from '@/services/projectRequest.js';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/common/LoadingOverlay';

export interface ProjectRequest {
  id: string;
  requesterCompanyId?: string;
  executorCompanyId?: string;
  code?: string;
  projectName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectForm {
  RequesterCompanyId: string;
  ExecutorCompanyId: string;
  Code: string;
  Name: string;
  Description: string;
  StartDate: string;
  EndDate: string;
}

interface EditProjectRequestModalProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRequest | null;
  onSuccess: () => void;
}

const EditProjectRequestModal: React.FC<EditProjectRequestModalProps> = ({
  open,
  onClose,
  project,
  onSuccess,
}) => {
  const [form, setForm] = useState<ProjectForm>({
    RequesterCompanyId: '',
    ExecutorCompanyId: '',
    Code: '',
    Name: '',
    Description: '',
    StartDate: '',
    EndDate: '',
  });

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (project) {
      setForm({
        Code: project.code || '',
        Name: project.projectName || '',
        Description: project.description || '',
        StartDate: project.startDate ? project.startDate.split('T')[0] : '',
        EndDate: project.endDate ? project.endDate.split('T')[0] : '',
        RequesterCompanyId: project.requesterCompanyId || '',
        ExecutorCompanyId: project.executorCompanyId || '',
      });
    }
  }, [project]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      const res = await EditProjectRequest(project.id, form);
      if (res.succeeded) {
        toast.success('Project request updated successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to update request');
      }
    } catch (err) {
      toast.error('Error while updating project request');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      {loading && <LoadingOverlay loading message="Updating Project Request..." />}

      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Project Request</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Code</label>
            <input
              name="Code"
              value={form.Code}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <input
              name="Name"
              value={form.Name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-600">Description</label>
            <textarea
              name="Description"
              value={form.Description}
              onChange={handleChange}
              className="w-full p-2 border rounded-md h-[150px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Start Date</label>
            <input
              type="date"
              name="StartDate"
              value={form.StartDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">End Date</label>
            <input
              type="date"
              name="EndDate"
              value={form.EndDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectRequestModal;
