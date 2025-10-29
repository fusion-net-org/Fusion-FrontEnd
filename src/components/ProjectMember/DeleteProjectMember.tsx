/* DeleteProjectMember.tsx */
import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface DeleteProjectMemberProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  memberName?: string;
  companyName?: string;
}

export default function DeleteProjectMember({
  isOpen,
  onClose,
  onConfirm,
  memberName = 'this member',
  companyName,
}: DeleteProjectMemberProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[400px] p-6 shadow-lg relative animate-scale">
        {/* Close button */}
        <button className="absolute top-3 right-3 text-gray-400 hover:text-black" onClick={onClose}>
          <X />
        </button>

        <div className="flex flex-col items-center text-center">
          <Trash2 size={36} className="text-red-500 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Remove Member</h2>
          <p className="text-gray-600 mb-4">
            Are you sure you want to remove member <span className="font-medium">{memberName}</span>{' '}
            from this company <b>{companyName}?</b>
          </p>

          {/* Input reason */}
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-300 outline-none text-sm"
          />

          <div className="flex justify-center gap-4 mt-2 w-full">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition flex-1"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onConfirm(reason || '');
              }}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex-1"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
