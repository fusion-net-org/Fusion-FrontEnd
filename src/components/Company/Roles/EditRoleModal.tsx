/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { GetRoleById, UpdateRole } from '@/services/companyRoleService.js';

interface EditRoleModalProps {
  open: boolean;
  onClose: () => void;
  roleId: number | undefined;
  onSuccess: () => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({ open, onClose, roleId, onSuccess }) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Load role data
  useEffect(() => {
    if (open && roleId) {
      const fetchRole = async () => {
        try {
          const res = await GetRoleById(roleId);
          setRoleName(res.roleName);
          setDescription(res.description);
        } catch (err) {
          toast.error('Failed to load role details');
        }
      };
      fetchRole();
    }
  }, [open, roleId]);

  if (!open) return null;

  const handleSave = async () => {
    try {
      setLoading(true);

      await UpdateRole(roleId!, {
        roleName,
        description,
        status,
      });

      toast.success('Role updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('UpdateRole error:', err);

      const message = err?.response?.data?.message || err?.message || 'Failed to update role';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Role</h2>
          <X
            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-700"
            onClick={onClose}
          />
        </div>

        <div className="flex flex-col gap-4">
          {/* Role Name */}
          <div>
            <label className="font-medium text-sm text-gray-600">Role Name</label>
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-medium text-sm text-gray-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;
