/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateRole } from '@/services/companyRoleService.js';
import { getCompanyById } from '@/services/companyService.js';
import { toast } from 'react-toastify';

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  open,
  onClose,
  companyId,
  onSuccess,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Load company name when modal opens
  useEffect(() => {
    if (open && companyId) {
      const fetchCompany = async () => {
        try {
          const res = await getCompanyById(companyId);
          setCompanyName(res.data.name ?? '');
        } catch (err) {
          console.error(err);
        }
      };
      fetchCompany();
    }
  }, [open, companyId]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setLoading(true);

      await CreateRole({
        companyId: companyId,
        roleName,
        description,
      });

      toast.success('Role created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('CreateRole error:', err);

      const message = err?.response?.data?.message || err?.message || 'Failed to create role';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Create Role</h2>
          <X
            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-700"
            onClick={onClose}
          />
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {/* Company Name */}
          <div>
            <label className="font-medium text-sm text-gray-600">Company</label>
            <input
              value={companyName || 'Loading...'}
              disabled
              className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm cursor-not-allowed"
            />
          </div>

          {/* Role Name */}
          <div>
            <label className="font-medium text-sm text-gray-600">Role Name</label>
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-medium text-sm text-gray-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;
