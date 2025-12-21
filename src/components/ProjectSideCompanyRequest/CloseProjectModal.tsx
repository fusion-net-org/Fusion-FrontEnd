import React from 'react';
import { XCircle } from 'lucide-react';

interface CloseProjectModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CloseProjectModal: React.FC<CloseProjectModalProps> = ({
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
        <h3 className="text-xl font-bold text-red-700 mb-3 flex items-center gap-2">
          <XCircle />
          Close Project
        </h3>

        {/* Content */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          Are you sure you want to <b>CLOSE</b> this project?
        </p>

        <ul className="text-sm text-gray-600 mb-6 list-disc list-inside">
          <li>You will not be able to create new tickets</li>
          <li>You will not be able to create new sprints</li>
          <li>
            The project status will be changed to <b>Closed</b>
          </li>
        </ul>

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
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseProjectModal;
