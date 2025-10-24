/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Modal, Checkbox } from 'antd';
import { toast } from 'react-toastify';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteCompany } from '@/services/companyService.js';
import { useNavigate } from 'react-router-dom';
interface DeleteCompanyProps {
  open: boolean;
  companyId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteCompany: React.FC<DeleteCompanyProps> = ({ open, companyId, onClose, onSuccess }) => {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm) {
      toast.warning('Please confirm before deleting the company.');
      return;
    }

    try {
      setLoading(true);
      const res = await deleteCompany(companyId);
      if (res?.succeeded) {
        toast.success(res.message || 'Company deleted successfully!');
        onSuccess?.();
        onClose();
        navigate('/company');
      } else {
        toast.error(res.message || 'Failed to delete company.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while deleting the company.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-600">
          <Trash2 className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Confirm Company Deletion</h2>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to{' '}
          <span className="font-semibold text-red-600">delete this company</span>?
        </p>
        <p className="text-gray-500 text-sm leading-relaxed">
          ⚠️ This action <span className="font-semibold text-red-500">cannot be undone</span>. All
          data related to this company (projects, partners, employees...) will be permanently
          deleted.
        </p>

        <Checkbox checked={confirm} onChange={(e) => setConfirm(e.target.checked)}>
          I understand and want to delete this company.
        </Checkbox>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirm || loading}
            className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 transition ${
              confirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete Company
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteCompany;
