import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/common/Modal";
import { Label, Input, Select } from "./FormControls";
import type { RoleOption } from "@/types/role";
import { createRole, getRolePermissionIds, saveRolePermissions, updateRole } from "@/services/roleService.js";

type Mode = "create" | "edit";
type Props = {
  mode: Mode;
  isOpen: boolean;
  companyId: string;
  roles: RoleOption[]; // để chọn clone khi create
  initial?: { id: number; name: string; description?: string | null }; // cho edit
  onClose: () => void;
  onCreated?: (newRoleId: number) => void;
  onUpdated?: (roleId: number) => void;
};

export default function RoleUpsertModal({ mode, isOpen, companyId, roles, initial, onClose, onCreated, onUpdated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cloneFrom, setCloneFrom] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initial) {
      setName(initial.name || "");
      setDescription(initial.description || "");
      setCloneFrom(""); // edit không clone
    } else {
      setName("");
      setDescription("");
      setCloneFrom("");
    }
  }, [isOpen, mode, initial]);

  const canSave = name.trim().length > 0 && !saving;
  const cloneOptions = useMemo(
    () => roles.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [roles]
  );

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createRole(companyId, { name: name.trim(), description: description.trim() || null });
        const newRoleId: number = typeof created?.id === "number" ? created.id : Number(created?.id);
        if (cloneFrom) {
          const fnIds: number[] = await getRolePermissionIds(companyId, Number(cloneFrom));
          if (fnIds?.length) await saveRolePermissions(companyId, newRoleId, fnIds);
        }
        onCreated?.(newRoleId);
      } else {
        // EDIT: chỉ lưu name/description, không clone
        if (!initial) return;
        await updateRole(companyId, initial.id, { name: name.trim(), description: description.trim() || null });
        onUpdated?.(initial.id);
      }
    } catch (e) {
      console.error(e);
      alert(mode === "create" ? "Create role failed" : "Update role failed");
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <>
      <button className="btn btnGhost" onClick={onClose}>Cancel</button>
      <button className="btn btnPrimary" disabled={!canSave} onClick={onSave}>{saving ? "Saving..." : "Save"}</button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Add new access role" : "Edit access role"} width={720} footer={footer}>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "1 / span 2" }}>
          <Label>Role name <span style={{ color: "#ef4444" }}>*</span></Label>
          <Input placeholder="Role name" value={name} onChange={e => setName((e.target as HTMLInputElement).value)} />
        </div>

        <div>
          <Label>Clone permissions from</Label>
          <Select
            value={cloneFrom}
            onChange={e => setCloneFrom((e.target as HTMLSelectElement).value)}
            disabled={mode === "edit"}      // UI y chang create nhưng edit thì disable
            title={mode === "edit" ? "Clone is only for creating new role" : undefined}
          >
            <option value="">— None —</option>
            {cloneOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>

        <div style={{ gridColumn: "1 / span 2" }}>
          <Label>Description</Label>
          <textarea
            className="input"
            rows={4}
            placeholder="Description"
            value={description}
            onChange={e => setDescription((e.target as HTMLTextAreaElement).value)}
            style={{ resize: "vertical", paddingTop: 8 }}
          />
        </div>
      </div>
    </Modal>
  );
}
