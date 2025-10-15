import React, { useEffect, useMemo, useState } from "react";
import PermissionGroup from "../../components/Company/AccessRole/PermissionGroup";
import RoleForm from "../../components/Company/AccessRole/RoleForm";
import type { AccessRoleFormModel, PermissionGroup as PGroup, RoleOption } from "@/types/role";
import { getRoles, getFunctions, getRolePermissionIds, saveRolePermissions } from "../../services/roleService.js";
import "@/layouts/Company/css/role/role.css";

// ---- helper: group function theo page_code -> PermissionGroup[] ----
type FnMeta = { id: number; functionCode: string; functionName: string; pageCode?: string; sortOrder?: number };

function toGroups(functions: FnMeta[], grantedSet?: Set<number>): PGroup[] {
  const byPage = new Map<string, FnMeta[]>();
  functions.forEach(f => {
    const key = f.pageCode || "GENERAL";
    const arr = byPage.get(key) || [];
    arr.push(f);
    byPage.set(key, arr);
  });

  // sort mỗi group theo sortOrder rồi name
  const groups: PGroup[] = [];
  Array.from(byPage.entries()).forEach(([page, list], idx) => {
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.functionName.localeCompare(b.functionName));
    groups.push({
      id: `grp-${page}-${idx}`,
      title: page, // có thể map ra tên tiếng Việt nếu muốn
      items: list.map(f => ({
        id: String(f.id),
        name: f.functionName,
        checked: grantedSet ? grantedSet.has(f.id) : false,
      }))
    });
  });

  // Optional: ổn định thứ tự nhóm
  groups.sort((a, b) => a.title.localeCompare(b.title));
  return groups;
}

export default function AccessRolePage() {
  // TODO: thay bằng nguồn thật của companyId (redux / route / context)
  const companyId = (window as any).__companyId || "db68da96-63f1-423a-84b1-356740164f45";

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [functions, setFunctions] = useState<FnMeta[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [model, setModel] = useState<AccessRoleFormModel>({ roleName: "", roleLevelId: "", groups: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- load roles + functions 1 lần ----
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [rolesApi, functionsApi] = await Promise.all([
          getRoles(companyId),
          getFunctions(companyId)
        ]);
        if (!alive) return;

        // map roles -> RoleOption cho RoleForm (tận dụng field sẵn có)
       const roleOpts: RoleOption[] = rolesApi
  .map((r: any) => ({
    id: String(r.id),
    name: r.name ?? r.roleName ?? `Role#${r.id}`,
    levelLabel: ""
  }))
  .sort((a: RoleOption, b: RoleOption) => a.name.localeCompare(b.name)); // <-- thêm type


        setRoles(roleOpts);
        setFunctions(functionsApi);

        const firstRoleId = roleOpts[0]?.id ?? "";
        setSelectedRoleId(firstRoleId);
        setModel(m => ({ ...m, roleLevelId: firstRoleId, groups: toGroups(functionsApi) }));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [companyId]);

  // ---- khi đổi role -> load granted ids & tick ----
  useEffect(() => {
    if (!selectedRoleId || functions.length === 0) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const ids = await getRolePermissionIds(companyId, Number(selectedRoleId));
        if (!alive) return;
        const granted = new Set<number>(ids);
        setModel(prev => ({
          ...prev,
          roleLevelId: selectedRoleId,
          groups: toGroups(functions, granted),
        }));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId, functions]);

  // ---- handlers ----
  const onPatch = (patch: Partial<AccessRoleFormModel>) => {
    // RoleForm có thể patch roleLevelId (ở đây là roleId)
    if (patch.roleLevelId && patch.roleLevelId !== selectedRoleId) {
      setSelectedRoleId(String(patch.roleLevelId));
    }
    if (patch.roleName !== undefined) {
  setModel(prev => ({ ...prev, roleName: patch.roleName ?? prev.roleName })); // <-- dùng ?? để ra string
}

  };

  const onToggle = (groupId: string, itemId?: string, value?: boolean) => {
    setModel(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id !== groupId) return g;
        if (!itemId) return { ...g, items: g.items.map(i => ({ ...i, checked: !!value })) };
        return { ...g, items: g.items.map(i => i.id === itemId ? { ...i, checked: !!value } : i) };
      })
    }));
  };

  const onSave = async () => {
    if (!selectedRoleId) return;
    const functionIds = model.groups.flatMap(g => g.items.filter(i => i.checked).map(i => Number(i.id)));
    setSaving(true);
    try {
      await saveRolePermissions(companyId, Number(selectedRoleId), functionIds);
      // sau khi save -> reload quyền để đồng bộ
      const ids = await getRolePermissionIds(companyId, Number(selectedRoleId));
      const granted = new Set<number>(ids);
      setModel(prev => ({ ...prev, groups: toGroups(functions, granted) }));
      alert("Saved!");
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const currentRoleName = useMemo(
    () => roles.find(r => r.id === selectedRoleId)?.name ?? "",
    [roles, selectedRoleId]
  );

  return (
    <>
      <h1 style={{ fontSize: 24, lineHeight: "1.25", fontWeight: 800, color: "var(--cmp-gray-800)", marginBottom: 16 }}>
        Access Role
      </h1>

      <RoleForm
        model={model}
        roleLevels={roles}          // dùng làm dropdown role
        onChange={onPatch}
        onAddNew={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      <div className="card" style={{ marginTop: 18, opacity: loading ? 0.6 : 1 }}>
        <div className="cardHeader">Grant Access for {currentRoleName}</div>
        <div className="cardBody grid">
          {model.groups.map(group => (
            <PermissionGroup key={group.id} group={group} onToggle={onToggle} />
          ))}
        </div>
      </div>

      <button className="btn btnGhost" onClick={() => selectedRoleId && setSelectedRoleId(selectedRoleId)}>
        Cancel
      </button>
      <button className="btn btnPrimary" disabled={saving || loading} onClick={onSave}>
        {saving ? "Saving..." : "Save"}
      </button>
    </>
  );
}
