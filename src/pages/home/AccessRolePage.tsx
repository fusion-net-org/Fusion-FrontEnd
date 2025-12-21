import React, { useEffect, useMemo, useState } from "react";
import PermissionGroup from "../../components/Company/AccessRole/PermissionGroup";
import RoleForm from "../../components/Company/AccessRole/RoleForm";
import type { AccessRoleFormModel, PermissionGroup as PGroup, RoleOption } from "@/types/role";
import {
  getRoles,
  getRolePermissionIds,
  saveRolePermissions,
  deleteRole,
  getRole,
} from "../../services/roleService.js";
import RoleUpsertModal from "@/components/Company/AccessRole/RoleUpsertModal.js";
import ConfirmModal from "@/common/ConfirmModal.js";
import "@/layouts/Company/css/role/role.css";
import functionsMeta from "@/static/functions.json";
import { Can } from "@/permission/PermissionProvider";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

type FnMeta = {
  id: number;
  functionCode: string;
  functionName: string;
  pageCode?: string;
  sortOrder?: number;
};

function toGroups(functions: FnMeta[], grantedSet?: Set<number>): PGroup[] {
  const byPage = new Map<string, FnMeta[]>();
  functions.forEach((f) => {
    const key = f.pageCode || "GENERAL";
    const arr = byPage.get(key) || [];
    arr.push(f);
    byPage.set(key, arr);
  });

  const groups: PGroup[] = [];
  Array.from(byPage.entries()).forEach(([page, list], idx) => {
    list.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.functionName.localeCompare(b.functionName)
    );
    groups.push({
      id: `grp-${page}-${idx}`,
      title: page,
      items: list.map((f) => ({
        id: String(f.id),
        name: f.functionName,
        checked: grantedSet ? grantedSet.has(f.id) : false,
      })),
    });
  });

  groups.sort((a, b) => a.title.localeCompare(b.title));
  return groups;
}

export default function AccessRolePage() {
  const { companyId = "" } = useParams();

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [functions] = useState<FnMeta[]>((functionsMeta as unknown as FnMeta[]) ?? []);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const [model, setModel] = useState<AccessRoleFormModel>({
    roleName: "",
    roleLevelId: "",
    groups: [],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [editInitial, setEditInitial] = useState<
    | { id: number; name: string; description?: string | null }
    | undefined
  >(undefined);

  const [deleting, setDeleting] = useState(false);
  const selectedRole = useMemo(
    () => roles.find((r: any) => String(r.id) === String(selectedRoleId)),
    [roles, selectedRoleId]
  );

  const isOwnerSelected =
    ((selectedRole?.name ?? "").trim().toLowerCase() === "owner");



  async function openEditModal() {
    if (!selectedRoleId) return;

    const r = roles.find((r) => r.id === selectedRoleId);
    setEditInitial({
      id: Number(selectedRoleId),
      name: r?.name ?? "",
      description: (r as any)?.description ?? "",
    });
    setOpenEdit(true);

    try {
      const detail: any = await getRole(companyId, Number(selectedRoleId));
      if (detail) {
        setEditInitial({
          id: Number(detail.id ?? selectedRoleId),
          name: detail.name ?? r?.name ?? "",
          description: detail.description ?? (r as any)?.description ?? "",
        });
      }
    } catch (e) {
      console.warn("getRole failed → using cached role list", e);
    }
  }

  async function confirmDelete() {
    if (!selectedRoleId) return;
    setDeleting(true);
    try {
      await deleteRole(companyId, Number(selectedRoleId));
      setOpenDelete(false);
      await reloadRolesAndSelect();
      toast.success("Role deleted");
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function reloadRolesAndSelect(selectId?: string) {
    const rolesApi = await getRoles(companyId);
    const roleOpts: RoleOption[] = rolesApi
      .map((r: any) => ({
        id: String(r.id),
        name: r.name ?? r.roleName ?? `Role#${r.id}`,
        description: r.description ?? "",
      }))
      .sort((a: RoleOption, b: RoleOption) => a.name.localeCompare(b.name));

    setRoles(roleOpts);

    const newId = selectId ?? roleOpts[0]?.id ?? "";
    setSelectedRoleId(newId);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const rolesApi = await getRoles(companyId);
        if (!alive) return;

        const roleOpts: RoleOption[] = rolesApi
          .map((r: any) => ({
            id: String(r.id),
            name: r.name ?? r.roleName ?? `Role#${r.id}`,
            description: r.description ?? "",
          }))
          .sort((a: RoleOption, b: RoleOption) => a.name.localeCompare(b.name));

        setRoles(roleOpts);

        const firstRoleId = roleOpts[0]?.id ?? "";
        setSelectedRoleId(firstRoleId);

        setModel((m) => ({
          ...m,
          roleLevelId: firstRoleId,
          groups: toGroups(functions),
        }));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [companyId, functions]);

  useEffect(() => {
    if (!selectedRoleId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const ids = await getRolePermissionIds(companyId, Number(selectedRoleId));
        if (!alive) return;

        const granted = new Set<number>((ids ?? []).map(Number));
        setModel((prev) => ({
          ...prev,
          roleLevelId: selectedRoleId,
          groups: toGroups(functions, granted),
        }));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedRoleId, companyId, functions]);

  const onPatch = (patch: Partial<AccessRoleFormModel>) => {
    if (patch.roleLevelId && patch.roleLevelId !== selectedRoleId) {
      setSelectedRoleId(String(patch.roleLevelId));
    }
    if (patch.roleName !== undefined) {
      setModel((prev) => ({ ...prev, roleName: patch.roleName ?? prev.roleName }));
    }
  };

  const onToggle = (groupId: string, itemId?: string, value?: boolean) => {
    setModel((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => {
        if (g.id !== groupId) return g;
        if (!itemId) return { ...g, items: g.items.map((i) => ({ ...i, checked: !!value })) };
        return {
          ...g,
          items: g.items.map((i) => (i.id === itemId ? { ...i, checked: !!value } : i)),
        };
      }),
    }));
  };

  const onSave = async () => {
    if (!selectedRoleId) return;
    if (!selectedRoleId || isOwnerSelected) return; 

    const functionIds = model.groups.flatMap((g) =>
      g.items.filter((i) => i.checked).map((i) => Number(i.id))
    );

    setSaving(true);
    try {
      await saveRolePermissions(companyId, Number(selectedRoleId), functionIds);

      const ids = await getRolePermissionIds(companyId, Number(selectedRoleId));
      const granted = new Set<number>((ids ?? []).map(Number));
      setModel((prev) => ({ ...prev, groups: toGroups(functions, granted) }));
      toast.success("Saved!");
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const currentRoleName = useMemo(
    () => roles.find((r) => r.id === selectedRoleId)?.name ?? "",
    [roles, selectedRoleId]
  );

  return (
    <div className="w-full">
      <Can code="WORKFLOW_DELETE">
        <h1 className="text-[24px] leading-[1.25] font-extrabold text-[#1f2937] mb-4">
          Access Role
        </h1>
      </Can>

      <RoleForm
        model={model}
        roleLevels={roles}
        onChange={onPatch}
        onAddNew={() => setOpenCreate(true)}
        onEdit={openEditModal}
        onDelete={() => {
          if (!selectedRoleId) return;
          setOpenDelete(true);
        }}
        locked={isOwnerSelected}    
      />

      <div
        className="mt-[18px] border border-[#e5e7eb] bg-white rounded-2xl shadow-[0_1px_2px_rgba(17,24,39,0.06)]"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        <div className="px-[18px] pt-4 pb-3 font-bold text-[#1757b1] text-[14px]">
          Grant Access for {currentRoleName}
        </div>

        <div className="px-[18px] pb-[18px] grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
          {model.groups.map((group) => (
            <PermissionGroup key={group.id} group={group} onToggle={onToggle} disabled={isOwnerSelected} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Can code='ROLE_PERMISSION_EDIT'>
        <button
          className="h-10 px-[14px] rounded-full font-semibold bg-[#2e8bff] text-white hover:bg-[#1e6fde]
                     disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={saving || loading || isOwnerSelected} 
          onClick={onSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        </Can>
      </div>

      <RoleUpsertModal
        mode="create"
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        companyId={companyId}
        roles={roles}
        onCreated={async (newRoleId) => {
          setOpenCreate(false);
          await reloadRolesAndSelect(String(newRoleId));
          toast.success("Role created!");
        }}
      />

      <RoleUpsertModal
        mode="edit"
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        companyId={companyId}
        roles={roles}
        initial={editInitial}
        onUpdated={async () => {
          setOpenEdit(false);
          await reloadRolesAndSelect(selectedRoleId);
          toast.success("Role updated!");
        }}
      />

      <ConfirmModal
        isOpen={openDelete}
        title="Delete role?"
        message={`This will remove the role "${roles.find((r) => r.id === selectedRoleId)?.name ?? ""}". You cannot undo this.`}
        busy={deleting}
        onCancel={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
