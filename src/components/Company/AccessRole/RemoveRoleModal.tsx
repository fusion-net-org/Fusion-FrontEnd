/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { GetUserRolesByCompany } from '@/services/userService.js';
import { RemoveUserRolesFromCompany } from '@/services/companyMemberService.js';
import type { IRoleDto } from '@/interfaces/Role/Role';

interface RemoveRoleModalProps {
  companyId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const RemoveRoleModal: React.FC<RemoveRoleModalProps> = ({
  companyId,
  userId,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [roles, setRoles] = useState<IRoleDto[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserRoles = async () => {
    if (!companyId || !userId) return;
    try {
      setLoading(true);
      const response = await GetUserRolesByCompany(companyId, userId);
      const userRoles: IRoleDto[] = response.data || [];
      setRoles(userRoles);
      // mặc định checked tất cả role hiện có
      setSelectedRoles(userRoles.map((r) => r.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchUserRoles();
  }, [isOpen]);

  const handleToggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId],
    );
  };

  const handleConfirm = async () => {
    if (!selectedRoles.length) {
      toast.warn('Please select at least one role to remove');
      return;
    }

    try {
      setLoading(true);
      await RemoveUserRolesFromCompany(companyId, {
        userId,
        roleIds: selectedRoles,
      });
      toast.success('Roles removed successfully!');
      onConfirm?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove roles');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-96 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Remove Roles</h2>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : (
          <div className="max-h-64 overflow-y-auto mb-4">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex flex-col p-2 mb-2 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => handleToggleRole(role.id)}
                    className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <span className="font-medium text-gray-800">{role.name}</span>
                </div>
                {role.description && (
                  <p className="text-gray-500 text-sm ml-6">{role.description}</p>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveRoleModal;
