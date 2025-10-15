import React from "react";
import type { AccessRoleFormModel, RoleOption } from "../../../types/role";
import { Label, Input, Select, BtnPrimary, BtnGhost, BtnDanger } from "./FormControls";

export default function RoleForm({ model, roleLevels, onChange, onAddNew, onEdit, onDelete }: {
  model: AccessRoleFormModel; roleLevels: RoleOption[];
  onChange: (patch: Partial<AccessRoleFormModel>) => void;
  onAddNew: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 12, alignItems: "end" }}>
        <div>
          <Label>Access Role</Label>
          <Input value={model.roleName} placeholder="Name role"
                 onChange={e => onChange({ roleName: (e.target as HTMLInputElement).value })}/>
        </div>
        <div>
          <Label> </Label>
          <Select value={model.roleLevelId} onChange={e => onChange({ roleLevelId: (e.target as HTMLSelectElement).value })}>
            {roleLevels.map(r => <option key={r.id} value={r.id}>{r.name} - {r.levelLabel}</option>)}
          </Select>
        </div>
        <BtnPrimary onClick={onAddNew}>Add new</BtnPrimary>
        <BtnGhost onClick={onEdit}>Edit</BtnGhost>
        <BtnDanger onClick={onDelete}>Delete</BtnDanger>
      </div>
    </div>
  );
}
