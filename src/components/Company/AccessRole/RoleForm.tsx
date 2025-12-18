import React, { useMemo } from "react";
import type { AccessRoleFormModel, RoleOption } from "../../../types/role";
import { Label, Select, BtnPrimary, BtnGhost, BtnDanger } from "./FormControls";

export default function RoleForm({
  model,
  roleLevels,
  onChange,
  onAddNew,
  onEdit,
  onDelete,
  locked = false,
}: {
  model: AccessRoleFormModel;
  roleLevels: RoleOption[];
  onChange: (patch: Partial<AccessRoleFormModel>) => void;
  onAddNew: () => void;
  onEdit: () => void;
  onDelete: () => void;
  locked?: boolean; 
}) {
  const selectedRole = useMemo(
    () => roleLevels.find((r) => String(r.id) === String(model.roleLevelId)),
    [roleLevels, model.roleLevelId]
  );

  const desc = (selectedRole?.description ?? "").trim();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_-14px_rgba(15,23,42,0.18)]">
      {/* Header */}
      <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900">Role settings</div>
       
        </div>

        {/* Actions luôn nằm bên phải */}
        <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto">
          <BtnPrimary onClick={onAddNew}>Add new</BtnPrimary>
           <BtnGhost onClick={onEdit} disabled={locked} title={locked ? "Owner role is locked" : undefined}>
            Edit
          </BtnGhost>

          <BtnDanger onClick={onDelete} disabled={locked} title={locked ? "Owner role cannot be deleted" : undefined}>
            Delete
          </BtnDanger>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-5 md:grid-cols-2">
        <div className="min-w-0">
          <Label className="mb-2">Access Role</Label>
          <Select
            value={model.roleLevelId}
            onChange={(e) =>
              onChange({ roleLevelId: (e.target as HTMLSelectElement).value })
            }
          >
            {roleLevels.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-0">
          <Label className="mb-2">Description</Label>
          <div
            title={desc || "(No description)"}
            className={[
              "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3",
              "flex items-center text-sm",
              desc ? "text-slate-800" : "text-slate-400 italic",
            ].join(" ")}
          >
            <span className="truncate">{desc || "(No description)"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
