import React, { useMemo } from "react";
import type { AccessRoleFormModel, RoleOption } from "../../../types/role";
import { Label, Input, Select, BtnPrimary, BtnGhost, BtnDanger } from "./FormControls";

export default function RoleForm({ model, roleLevels, onChange, onAddNew, onEdit, onDelete }: {
  model: AccessRoleFormModel; roleLevels: RoleOption[];
  onChange: (patch: Partial<AccessRoleFormModel>) => void;
  onAddNew: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const selectedRole = useMemo(
    () => roleLevels.find(r => String(r.id) === String(model.roleLevelId)),
    [roleLevels, model.roleLevelId]
  );
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 12, alignItems: "end" }}>
        <div>
          <Label>Access Role</Label>
          <Select value={model.roleLevelId} onChange={e => onChange({ roleLevelId: (e.target as HTMLSelectElement).value })}>
            {roleLevels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
        <div>
          <Label >Description: </Label>
          <div className="descDisplay items-center h-8"  title={selectedRole?.description ?? ""}>
            {selectedRole?.description || <span style={{ opacity: 0.6 }}>(No description)</span>}
          </div>
        </div>
        <BtnPrimary onClick={onAddNew}>Add new</BtnPrimary>
        <BtnGhost onClick={onEdit}>Edit</BtnGhost>
        <BtnDanger onClick={onDelete}>Delete</BtnDanger>
      </div>
    </div>
  );
}
