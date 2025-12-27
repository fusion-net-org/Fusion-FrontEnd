/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { GetUserRolesByCompany } from "@/services/userService.js";
import { RemoveUserRolesFromCompany } from "@/services/companyMemberService.js";
import type { IRoleDto } from "@/interfaces/Role/Role";

interface RemoveRoleModalProps {
  companyId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const isOwnerRole = (role: any) => {
  const name = String(role?.name ?? role?.roleName ?? "").trim().toLowerCase();
  return name === "owner";
};

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

  const sortedRoles = useMemo(() => {
    const arr = [...roles];
    // Owner xuống cuối
    arr.sort((a: any, b: any) => {
      const ao = isOwnerRole(a);
      const bo = isOwnerRole(b);
      if (ao !== bo) return ao ? 1 : -1;
      return String(a?.name ?? a?.roleName ?? "").localeCompare(
        String(b?.name ?? b?.roleName ?? "")
      );
    });
    return arr;
  }, [roles]);

  const removableRoleIds = useMemo(() => {
    return sortedRoles.filter((r: any) => !isOwnerRole(r)).map((r) => r.id);
  }, [sortedRoles]);

  const fetchUserRoles = async () => {
    if (!companyId || !userId) return;
    try {
      setLoading(true);
      const response = await GetUserRolesByCompany(companyId, userId);
      const userRoles: IRoleDto[] = response.data || [];
      setRoles(userRoles);

      //  mặc định chọn TẤT CẢ role thường để remove (Owner bị loại)
      setSelectedRoles(userRoles.filter((r: any) => !isOwnerRole(r)).map((r) => r.id));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchUserRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, companyId, userId]);

  const handleToggleRole = (role: any) => {
    if (isOwnerRole(role)) return; //  Owner không toggle
    const roleId = role.id;

    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleConfirm = async () => {
    //  chỉ remove role thường
    const idsToRemove = selectedRoles.filter((id) => removableRoleIds.includes(id));

    if (!idsToRemove.length) {
      toast.warn("No removable roles selected");
      return;
    }

    try {
      setLoading(true);
      await RemoveUserRolesFromCompany(companyId, {
        userId,
        roleIds: idsToRemove,
      });

      toast.success("Roles removed successfully!");
      onConfirm?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove roles");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const disableRemoveBtn = loading || removableRoleIds.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-96 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Remove Roles</h2>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : (
          <div className="max-h-64 overflow-y-auto mb-4">
            {sortedRoles.map((role: any) => {
              const owner = isOwnerRole(role);
              const checked = owner ? true : selectedRoles.includes(role.id); // owner luôn hiện checked
              const disabled = owner;

              return (
                <label
                  key={role.id}
                  className={[
                    "flex flex-col p-2 mb-2 border rounded-lg",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => handleToggleRole(role)}
                      className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <span className="font-medium text-gray-800">
                      {role.name}
                      {owner ? " " : ""}
                    </span>
                  </div>

                  {role.description && (
                    <p className="text-gray-500 text-sm ml-6">{role.description}</p>
                  )}
                </label>
              );
            })}

            {removableRoleIds.length === 0 && (
              <div className="text-sm text-gray-500 mt-2">
                Nothing can be removed.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={disableRemoveBtn}
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveRoleModal;
