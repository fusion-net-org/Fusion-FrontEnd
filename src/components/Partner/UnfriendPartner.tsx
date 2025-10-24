/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Modal, Checkbox } from 'antd';
import { toast } from 'react-toastify';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { DeletePartner } from '@/services/partnerService.js';
import { useNavigate } from 'react-router-dom';

interface UnfriendPartnersProps {
  open: boolean;
  partnerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const UnfriendPartner: React.FC<UnfriendPartnersProps> = ({
  open,
  partnerId,
  onClose,
  onSuccess,
}) => {
  console.log(partnerId);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm) {
      toast.warning('Please confirm before deleting the partner.');
      return;
    }

    try {
      setLoading(true);

      const res = await DeletePartner(partnerId);
      console.log('Response:', res);
      const result = res?.data ?? res;

      if (result?.succeeded) {
        toast.success(result.message || 'Partner deleted successfully!');
        onSuccess?.();
        onClose();

        setTimeout(() => navigate(-1), 800);
      } else {
        toast.error(result.message || 'Failed to delete partner.');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'An error occurred while deleting the partner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      closeIcon={<span className="text-gray-400 hover:text-gray-600 transition">✕</span>}
    >
      <div className="p-1">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Confirm Partner Deletion</h2>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4">
          <p className="text-gray-700">
            Are you sure you want to{' '}
            <span className="font-semibold text-red-600">delete this partner</span>?
          </p>

          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              This action <span className="font-semibold text-red-600">cannot be undone</span>. All
              data related to this partner (projects, employees, collaborations…) will be
              <span className="font-semibold"> permanently deleted</span>.
            </p>
          </div>

          <Checkbox
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="text-sm text-gray-700"
          >
            I understand the consequences and want to delete this partner.
          </Checkbox>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirm || loading}
            className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 transition ${
              confirm
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:scale-[1.03]'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete Partner
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UnfriendPartner;
