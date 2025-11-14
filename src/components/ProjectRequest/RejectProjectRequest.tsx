/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Modal, Input, Select } from 'antd';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/common/LoadingOverlay';
import { RejectProjectRequest } from '@/services/projectRequest.js';

interface RejectReasonModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  onSuccess?: () => void;
}

const defaultReasons = [
  'Out of contractual scope',
  'Budget not available',
  'Insufficient staffing resources',
  'Failure to meet technical specifications',
  'Infeasible schedule',
  'Other',
];

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  open,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!projectId) return;

    const finalReason = reasons.includes('Other')
      ? [...reasons.filter((r) => r !== 'Other'), customReason].join(', ')
      : reasons.join(', ');

    try {
      setLoading(true);

      const res = await RejectProjectRequest(projectId, finalReason);

      if (res.succeeded) {
        toast.success(res.message || 'Request rejected successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.message || 'Failed to reject request');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error rejecting request');
    } finally {
      setLoading(false);
      setReasons([]);
      setCustomReason('');
    }
  };

  const handleClose = () => {
    setReasons([]);
    setCustomReason('');
    onClose();
  };

  return (
    <Modal
      title={
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Reject Project Request</h2>
          <p className="text-sm text-gray-500">Select one or more reasons for rejection</p>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={480}
    >
      <LoadingOverlay loading={loading} message="Processing rejection..." />

      <div className="flex flex-col gap-4">
        {/* Reason Select */}
        <div>
          <label className="text-sm font-medium text-gray-700">Reason(s)</label>
          <Select
            mode="multiple"
            placeholder="Select rejection reasons"
            value={reasons}
            onChange={setReasons}
            className="mt-1 w-full"
            options={defaultReasons.map((r) => ({ value: r, label: r }))}
            maxTagCount="responsive"
          />
        </div>

        {/* Custom Reason */}
        {reasons.includes('Other') && (
          <div>
            <label className="text-sm font-medium text-gray-700">Other reason</label>
            <Input.TextArea
              placeholder="Enter custom reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 transition"
          >
            Reject
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectReasonModal;
