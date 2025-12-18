/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/interfaces/Role/Role";
import { GetRolesPaged } from "@/services/companyRoleService.js";

interface AddRoleModalProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedRoles: Role[]) => void;
  userRoles?: Role[];
}

const isOwnerRole = (name?: string | null) =>
  String(name ?? "").trim().toLowerCase() === "owner";

export default function AddRoleModal({
  companyId,
  isOpen,
  onClose,
  onConfirm,
  userRoles = [],
}: AddRoleModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    GetRolesPaged(
      companyId,
      "", // Keyword
      "Active", // Status
      null,
      null,
      1,
      1000,
      null,
      null
    )
     .then((res: any) => {
  const items: Role[] = res.items || [];

  const getName = (r: Role) => String((r as any).roleName ?? (r as any).name ?? "");

  const sorted = [...items].sort((a, b) => {
    const ao = isOwnerRole(getName(a));
    const bo = isOwnerRole(getName(b));
    if (ao !== bo) return ao ? 1 : -1;            // ✅ Owner xuống cuối
    return getName(a).localeCompare(getName(b));  // (optional) sort tên
  });

  setRoles(sorted);

  // nếu trước đó lỡ select Owner thì loại ra luôn
  setSelectedRoles((prev) =>
    prev.filter((id) => !sorted.some((r) => r.id === id && isOwnerRole(getName(r))))
  );
})

      .finally(() => setLoading(false));
  }, [isOpen, companyId]);

  const userRoleIds = useMemo(() => new Set(userRoles.map((r) => r.id)), [userRoles]);

  const toggleRole = (role: Role) => {
    const name = (role as any).roleName ?? (role as any).name;
    if (isOwnerRole(name)) return; // ✅ khóa Owner
    if (userRoleIds.has(role.id)) return; // ✅ khóa role đã có

    setSelectedRoles((prev) =>
      prev.includes(role.id) ? prev.filter((id) => id !== role.id) : [...prev, role.id]
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
            {roles.map((role) => {
              const roleName = (role as any).roleName ?? (role as any).name ?? "";
              const ownerDisabled = isOwnerRole(roleName);
              const alreadyHasRole = userRoleIds.has(role.id);

              const disabled = ownerDisabled || alreadyHasRole;
              const checked = alreadyHasRole || selectedRoles.includes(role.id);

              return (
                <label
                  key={role.id}
                  className={[
                    "flex items-center mb-2 rounded px-2 py-1",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100",
                  ].join(" ")}
                  onClick={(e) => {
                    // ✅ cho click cả dòng để tick, nhưng tôn trọng disabled
                    e.preventDefault();
                    if (!disabled) toggleRole(role);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(role)}
                    className="mr-2 h-4 w-4 border-gray-300 rounded"
                    disabled={disabled}
                  />

                  <div className="min-w-0">
                    <span className="font-medium">
                      {roleName}
                      {ownerDisabled && (
                        <span className="ml-2 text-xs text-gray-500"></span>
                      )}
                    </span>
                    {(role as any).description && (
                      <p className="text-gray-500 text-xs truncate">{(role as any).description}</p>
                    )}
                  </div>
                </label>
              );
            })}
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
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
