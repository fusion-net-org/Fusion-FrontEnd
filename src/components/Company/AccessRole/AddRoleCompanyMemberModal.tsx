import { useEffect, useState } from 'react';
import { getRoles } from '@/services/roleService.js';
import type { Role } from '@/interfaces/Role/Role';

interface AddRoleModalProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedRoles: Role[]) => void;
}

export default function AddRoleModal({ companyId, isOpen, onClose, onConfirm }: AddRoleModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getRoles(companyId)
      .then(setRoles)
      .finally(() => setLoading(false));
  }, [isOpen, companyId]);

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleConfirm = () => {
    const selected = roles.filter((r) => selectedRoles.includes(r.id));
    onConfirm(selected);
    setSelectedRoles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Roles</h2>
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div>
                  <span className="font-medium">{role.name}</span>
                  {role.description && <p className="text-gray-500 text-xs">{role.description}</p>}
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            onClick={handleConfirm}
            disabled={selectedRoles.length === 0}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
