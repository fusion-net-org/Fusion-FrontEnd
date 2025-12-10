/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { DeleteRole } from '@/services/companyRoleService.js';

interface DeleteRoleModalProps {
  open: boolean;
  onClose: () => void;
  role: any;
  onSuccess: () => void;
}

const deleteReasons = ['Duplicate role', 'No longer needed', 'Incorrect data', 'Other'];

const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({ open, onClose, role, onSuccess }) => {
  const [reason, setReason] = useState('Duplicate role');
  const [otherText, setOtherText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleDelete = async () => {
    const finalReason = reason === 'Other' ? otherText : reason;

    if (reason === 'Other' && !otherText.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    try {
      setLoading(true);

      const res = await DeleteRole(role.id, finalReason);
      toast.success(res.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.log('DeleteRole error:', err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl animate-fadeIn">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">Delete Role</h2>
          <X className="w-5 h-5 cursor-pointer" onClick={onClose} />
        </div>

        <div className="flex items-center bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" />
          Are you sure you want to delete <b>{role.roleName}</b>?
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-medium text-sm text-gray-700">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            {deleteReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {reason === 'Other' && (
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Enter your reason..."
              className="border px-3 py-2 rounded-lg mt-2"
              rows={3}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="px-4 py-2 border rounded-lg" onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
