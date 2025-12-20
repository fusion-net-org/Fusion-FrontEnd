import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ReopenProjectModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ReopenProjectModal: React.FC<ReopenProjectModalProps> = ({
  open,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-fadeIn">
        {/* Header */}
        <h3 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
          <RotateCcw />
          Reopen Project
        </h3>

        {/* Content */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          Are you sure you want to <b>REOPEN</b> this project?
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Confirm Reopen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReopenProjectModal;
