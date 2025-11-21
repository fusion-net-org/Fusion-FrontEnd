/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  ChevronUp,
  ChevronDown,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";

import type { TaskVm, SprintVm, MemberRef } from "@/types/projectBoard";
import { fetchSprintBoard } from "@/services/projectBoardService.js";
import {
  getTaskById,
  putTask,
  patchTaskStatusById,
  getTaskChecklist,
  createTaskChecklistItem,
  toggleTaskChecklistItemDone,
  updateTaskChecklistItem,
  deleteTaskChecklistItem,
} from "@/services/taskService.js";
import { toast } from "react-toastify";
import { getProjectMembersWithRole } from "@/services/projectMember.js";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type CommentItem = {
  id: string;
  author: string;
  createdAt: string;
  message: string;
};
type ProjectMemberOption = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  roleName?: string | null; // role trong company
  isPartner?: boolean;
  isViewAll?: boolean;
};

type RoleAssignments = Record<string, string | null>;

type WorkflowRoleDef = {
  key: string; // role code / key
  label: string; // label hiển thị
  statuses: {
    id: string;
    name: string;
    isStart?: boolean;
    isFinal?: boolean;
  }[];
  editable: boolean; // false nếu gắn với bất kỳ status isStart
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  orderIndex?: number;
  createdAt?: string;
};

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "N/A";

const toInputDate = (iso?: string) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

const fromInputDate = (val: string): string | undefined =>
  val ? new Date(val).toISOString() : undefined;

/* =========================================
 * PARENT PAGE – TỰ LOAD BOARD, KHÔNG DÙNG CONTEXT
 * ========================================= */

export default function TaskDetailPage() {
  const { companyId, projectId, taskId } = useParams<{
    companyId: string;
    projectId: string;
    taskId: string;
  }>();
  const navigate = useNavigate();

  const [loadingBoard, setLoadingBoard] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [sprints, setSprints] = useState<SprintVm[]>([]);
  const [task, setTask] = useState<TaskVm | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!projectId || !taskId) return;
      setLoadingBoard(true);
      setBoardError(null);

      try {
        // API board trả về { sprints, tasks } đã map theo SprintVm / TaskVm
        const board: any = await fetchSprintBoard(projectId);
        const bs: SprintVm[] = Array.isArray(board?.sprints)
          ? (board.sprints as SprintVm[])
          : [];
        const ts: TaskVm[] = Array.isArray(board?.tasks)
          ? (board.tasks as TaskVm[])
          : [];

        const found = ts.find((t) => t.id === taskId) ?? null;

        if (!alive) return;

        if (!found) {
          setBoardError("Ticket not found in board for this project.");
        }

        setSprints(bs);
        setTask(found);
      } catch (err) {
        console.error("[TaskDetail] load board failed", err);
        if (alive) {
          setBoardError("Failed to load board data.");
          setSprints([]);
          setTask(null);
        }
      } finally {
        if (alive) setLoadingBoard(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId, taskId]);

  const sprintForTask: SprintVm | undefined = useMemo(() => {
    if (!task) return sprints[0];
    return (
      sprints.find((s) => s.id === (task.sprintId || "")) ??
      sprints[0] ??
      undefined
    );
  }, [sprints, task]);

  if (loadingBoard && !task) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Loading ticket and board…
      </div>
    );
  }

  if (!task || !sprintForTask) {
    return (
      <div className="p-6 text-sm text-slate-600">
        {boardError || "Ticket not found. Please go back to the board."}
        <div className="mt-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <TicketDetailLayout
      projectId={projectId}
      task={task}
      sprint={sprintForTask}
      allSprints={sprints}
      onBack={() => navigate(-1)}
    />
  );
}

/* =========================================
 * LAYOUT COMPONENT – NGHIỆP VỤ DETAIL
 * ========================================= */

function TicketDetailLayout({
  projectId,
  task,
  sprint,
  allSprints,
  onBack,
}: {
  projectId?: string;
  task: TaskVm;
  sprint: SprintVm;
  allSprints: SprintVm[];
  onBack: () => void;
}) {
  const [model, setModel] = useState<TaskVm>(task);
  const [description, setDescription] = useState<string>(
    ((task as any)?.description as string) ||
      "Describe the goal, scope and acceptance criteria of this ticket."
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({});
  const [projectMembers, setProjectMembers] = useState<ProjectMemberOption[]>(
    []
  );
  const [loadingMembers, setLoadingMembers] = useState(false);

  // trạng thái chọn trước khi apply
  const [draftStatusId, setDraftStatusId] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // trạng thái thêm / edit checklist inline
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(
    null
  );
  const [editingChecklistLabel, setEditingChecklistLabel] = useState("");

  // khi task từ board đổi (nếu sau này bạn sync lại), update model
  useEffect(() => {
    setModel(task);
    const desc = (task as any)?.description;
    if (typeof desc === "string" && desc.length) {
      setDescription(desc);
    }
  }, [task]);

  // ===== load tất cả members của project (để assign) =====
  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    async function loadMembers() {
      try {
        setLoadingMembers(true);
        const res = await getProjectMembersWithRole(projectId);
        const payload: any = res?.data ?? res ?? [];
        let list: any[] = [];

        if (Array.isArray(payload)) {
          list = payload;
        } else if (Array.isArray(payload.items)) {
          list = payload.items;
        } else if (Array.isArray(payload.data)) {
          list = payload.data;
        }

        const mapped: ProjectMemberOption[] = list.map((x: any) => ({
          id: String(x.userId ?? x.id),
          name:
            x.userName ??
            x.fullName ??
            x.name ??
            x.email ??
            "Unknown member",
          email: x.email ?? null,
          avatarUrl: x.avatarUrl ?? null,
          roleName: x.companyRoleName ?? x.roleName ?? null,
          isPartner: !!x.isPartner,
          isViewAll: !!x.isViewAll,
        }));

        if (!cancelled) {
          setProjectMembers(mapped);
        }
      } catch (err) {
        console.error("[TaskDetail] load project members failed", err);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      try {
        setLoadingDetail(true);

        // 1) Lấy chi tiết task
        const raw = await getTaskById(task.id);
        const dto: any = raw?.data ?? raw ?? {};

        if (cancelled) return;

        // 2) Lấy checklist thực tế
        let checklistItems: ChecklistItem[] = [];
        try {
          const res = await getTaskChecklist(task.id);

          const payload: any = res?.data ?? res ?? [];
          let list: any[] = [];

          if (Array.isArray(payload)) {
            list = payload;
          } else if (Array.isArray(payload.items)) {
            list = payload.items;
          } else if (Array.isArray(payload.checklist)) {
            list = payload.checklist;
          } else if (Array.isArray(payload.data)) {
            // phòng trường hợp BE lồng thêm 1 lớp data nữa
            list = payload.data;
          }

          checklistItems = list.map((x: any, idx: number) => ({
            id: String(x.id ?? x.checklistItemId ?? idx),
            label: String(
              x.label ?? x.title ?? x.name ?? x.req ?? `Item ${idx + 1}`
            ),
            done: !!(x.done ?? x.completed ?? x.isDone),
            orderIndex: x.orderIndex ?? idx,
            createdAt: x.createdAt ?? null,
          }));
        } catch (err) {
          console.warn(
            "[TaskDetail] getTaskChecklist failed – fallback sang dto.checklist",
            err
          );
        }

        // 3) Description
        if (typeof dto.description === "string") {
          setDescription(dto.description);
        } else if (typeof dto.detail === "string") {
          setDescription(dto.detail);
        }

        // 4) Nếu checklistItems vẫn rỗng, fallback sang dto.checklist cũ
        if (!checklistItems.length) {
          const clRaw = dto.checklistItems ?? dto.checklist ?? [];
          if (Array.isArray(clRaw) && clRaw.length) {
            checklistItems = clRaw.map((x: any, idx: number) => ({
              id: String(x.id ?? x.checklistItemId ?? idx),
              label: String(
                x.label ?? x.title ?? x.name ?? x.req ?? `Item ${idx + 1}`
              ),
              done: !!(x.done ?? x.completed ?? x.isDone),
              orderIndex: x.orderIndex ?? idx,
              createdAt: x.createdAt ?? null,
            }));
          }
        }

        // không còn demo cứng, nếu không có thì để rỗng luôn
        setChecklist(checklistItems);

        // 5) Comments / activity
        const cmRaw = dto.comments ?? dto.activities ?? [];
        if (Array.isArray(cmRaw) && cmRaw.length) {
          setComments(
            cmRaw.map((c: any, idx: number) => ({
              id: String(c.id ?? idx),
              author:
                c.authorName ??
                c.author ??
                c.createdByName ??
                task.assignees[0]?.name ??
                "System",
              createdAt:
                c.createdAt ??
                c.time ??
                c.created_at ??
                new Date().toISOString(),
              message: String(c.message ?? c.content ?? ""),
            }))
          );
        } else {
          setComments([
            {
              id: "c1",
              author: task.assignees[0]?.name || "System",
              createdAt: task.createdAt,
              message: `Ticket created with status "${
                (task as any).StatusName || task.statusCode
              }"`,
            },
            {
              id: "c2",
              author: task.assignees[0]?.name || "System",
              createdAt: task.updatedAt,
              message: `Last updated – status "${
                (task as any).StatusName || task.statusCode
              }"`,
            },
          ]);
        }

        // 6) Workflow assignments -> RoleAssignments
        if (dto.workflowAssignments && sprint && sprint.statusMeta) {
          const wf = dto.workflowAssignments;
          const items: any[] = Array.isArray(wf.items) ? wf.items : [];
          const map: RoleAssignments = {};

          items.forEach((it: any) => {
            const statusId = String(
              it.workflowStatusId || it.statusId || ""
            );
            if (!statusId) return;

            const meta: any = sprint.statusMeta[statusId];
            if (!meta) return;

            const roles: string[] = Array.isArray(meta.roles)
              ? meta.roles
              : [];
            if (!roles.length) return;

            const uid = it.assignUserId ? String(it.assignUserId) : null;
            if (!uid) return;

            roles.forEach((rk) => {
              if (!rk) return;
              // role nào chưa có thì gán user đầu tiên gặp
              if (!map[rk]) {
                map[rk] = uid;
              }
            });
          });

          setRoleAssignments(map);
        } else if (
          dto.roleAssignments &&
          typeof dto.roleAssignments === "object"
        ) {
          // fallback cho dữ liệu cũ nếu BE vẫn còn trả roleAssignments
          setRoleAssignments(dto.roleAssignments as RoleAssignments);
        }
      } catch (err) {
        console.error("[TaskDetail] load detail failed", err);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [task.id, task.assignees, task.createdAt, task.updatedAt, sprint]);

  /* ===== derived data ===== */

  const statusList =
    sprint.statusOrder.map((id) => sprint.statusMeta[id]).filter(Boolean) ??
    [];

  const activeStatusId = model.workflowStatusId;
  const activeMeta = sprint.statusMeta[activeStatusId];
  const draftMeta =
    draftStatusId && draftStatusId !== activeStatusId
      ? sprint.statusMeta[draftStatusId]
      : undefined;

  const primaryAssignee: MemberRef | undefined = model.assignees[0];

  const checklistDone = checklist.filter((x) => x.done).length;
  const checklistTotal = checklist.length || 1;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);

  const activeStepIndex = statusList.findIndex(
    (st) => st.id === activeStatusId
  );
  const totalSteps = statusList.length;

  const currentIndex = statusList.findIndex((st) => st.id === activeStatusId);
  const nextStatus =
    currentIndex >= 0 && currentIndex < statusList.length - 1
      ? statusList[currentIndex + 1]
      : undefined;

  // reset draft khi status đổi
  useEffect(() => {
    setDraftStatusId(null);
    setStatusPickerOpen(false);
  }, [activeStatusId]);

  // ==== gom tất cả roles của workflow, đánh dấu role nào là fixed (có xuất hiện ở status isStart) ====
  const workflowRoles: WorkflowRoleDef[] = useMemo(() => {
    const map: Record<string, WorkflowRoleDef> = {};

    (sprint.statusOrder || []).forEach((statusId) => {
      const st: any = sprint.statusMeta[statusId];
      if (!st) return;
      const roles: string[] = (st.roles as string[]) ?? [];
      roles.forEach((roleKey) => {
        if (!map[roleKey]) {
          const label =
            roleKey
              ?.replace(/_/g, " ")
              ?.replace(/\b\w/g, (c) => c.toUpperCase()) || roleKey;
          map[roleKey] = {
            key: roleKey,
            label,
            statuses: [],
            editable: true,
          };
        }
        map[roleKey].statuses.push({
          id: statusId,
          name: st.name,
          isStart: st.isStart,
          isFinal: st.isFinal,
        });
        // nếu role gắn với bất kỳ status isStart => coi là fixed/auto-assign
        if (st.isStart) {
          map[roleKey].editable = false;
        }
      });
    });

    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [sprint]);

  /* ===== handlers ===== */

  function updateField<K extends keyof TaskVm>(key: K, value: TaskVm[K]) {
    setModel((prev) => ({ ...prev, [key]: value }));
  }

  // click chọn status trong panel (chưa apply)
  function handleStatusClick(statusId: string) {
    if (statusId === activeStatusId) {
      setDraftStatusId(null);
      return;
    }
    setDraftStatusId(statusId);
  }

  async function commitStatusChange(statusId: string) {
    if (!statusId || statusId === activeStatusId) return;
    const meta = sprint.statusMeta[statusId];
    if (!meta) return;

    const now = new Date().toISOString();
    const prev = model;
    const next: TaskVm = {
      ...prev,
      workflowStatusId: statusId,
      statusCode: meta.code,
      statusCategory: meta.category,
      StatusName: meta.name,
      updatedAt: now,
    };

    setChangingStatus(true);
    setModel(next);

    try {
      await patchTaskStatusById(prev.id, statusId, {
        flashColorHex: meta.color,
      });
      setDraftStatusId(null);
      setStatusPickerOpen(false);
    } catch (err) {
      console.error("[TaskDetail] change status failed", err);
      setModel(prev); // rollback
    } finally {
      setChangingStatus(false);
    }
  }

  async function applyStatusChange() {
    if (!draftStatusId || draftStatusId === activeStatusId) return;
    await commitStatusChange(draftStatusId);
  }

  async function handleQuickNext() {
    if (!nextStatus || nextStatus.id === activeStatusId) return;
    await commitStatusChange(nextStatus.id);
  }

  // ===== CHECKLIST HANDLERS =====

  // bấm Add item -> thêm 1 dòng checklist mới (local) ở TOP và mở ô input ngay đó
  function startAddChecklistItem() {
    if (editingChecklistId) return; // đang edit rồi thì không thêm cái mới
    const tempId = `local-${Math.random().toString(36).slice(2)}`;
    const tempItem: ChecklistItem = {
      id: tempId,
      label: "",
      done: false,
    };
    setChecklist((prev) => [tempItem, ...prev]);
    setEditingChecklistId(tempId);
    setEditingChecklistLabel("");
  }

  function handleChecklistLabelChange(val: string) {
    setEditingChecklistLabel(val);
  }

  function handleChecklistCancel(id: string) {
    setEditingChecklistId(null);
    setEditingChecklistLabel("");
    // nếu là item local mới tạo mà cancel thì xoá luôn
    if (id.startsWith("local-")) {
      setChecklist((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function handleChecklistSave(id: string) {
    const label = editingChecklistLabel.trim();
    if (!label) {
      handleChecklistCancel(id);
      return;
    }

    // cập nhật label local trước cho mượt
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, label } : i))
    );
    setEditingChecklistId(null);
    setEditingChecklistLabel("");

    try {
      if (id.startsWith("local-")) {
        // item mới -> gọi create
        const res = await createTaskChecklistItem(model.id, label);
        const dto: any = res?.data ?? res ?? {};
        const realId =
          dto.id ?? dto.checklistId ?? dto.itemId ?? dto.checklistItemId;
        if (realId) {
          setChecklist((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, id: String(realId) } : i
            )
          );
        }
      } else {
        // nếu sau này cho edit item cũ -> dùng update
        await updateTaskChecklistItem(model.id, id, { label });
      }
    } catch (err) {
      console.error("[TaskDetail] save checklist item failed", err);
      // optional: reload checklist từ BE nếu muốn chắc chắn
      // const res = await getTaskChecklist(model.id);
      // ...
    }
  }

  // toggle done: update local + gọi API toggle
  async function toggleChecklist(id: string) {
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
    try {
      // item mới local chưa save thì không gọi API
      if (!id.startsWith("local-")) {
        await toggleTaskChecklistItemDone(model.id, id);
      }
    } catch (err) {
      console.error("[TaskDetail] toggle checklist failed", err);
      // rollback nếu cần
      setChecklist((prev) =>
        prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
      );
    }
  }

  function moveChecklist(id: string, dir: "up" | "down") {
    setChecklist((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  }

  async function handleDeleteChecklist(id: string) {
    const prev = checklist;
    setChecklist((curr) => curr.filter((i) => i.id !== id));
    try {
      if (!id.startsWith("local-")) {
        await deleteTaskChecklistItem(model.id, id);
      }
    } catch (err) {
      console.error("[TaskDetail] delete checklist failed", err);
      // thất bại thì rollback lại
      setChecklist(prev);
    }
  }

  function addComment() {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        author: primaryAssignee?.name || "You",
        createdAt: new Date().toISOString(),
        message: newComment.trim(),
      },
    ]);
    setNewComment("");
  }

  async function handleSave() {
    try {
      // build workflowAssignments từ roleAssignments + sprint.statusMeta
      let workflowAssignments: any[] | undefined = undefined;

      if (sprint && sprint.statusOrder && sprint.statusMeta) {
        const items: any[] = [];

        (sprint.statusOrder || []).forEach((statusId) => {
          const meta: any = sprint.statusMeta[statusId];
          if (!meta) return;

          const roles: string[] = Array.isArray(meta.roles)
            ? meta.roles
            : [];

          // tìm user đầu tiên được gán cho bất kỳ role nào của status này
          let assignUserId: string | null = null;
          for (const rk of roles) {
            const uid = roleAssignments[rk];
            if (uid) {
              assignUserId = uid;
              break;
            }
          }

          // chỉ quan tâm các status có roles
          if (roles.length > 0) {
            items.push({
              workflowStatusId: statusId,
              assignUserId, // null => unassign trên BE
            });
          }
        });

        workflowAssignments = items;
      }

      const payload: any = {
        title: model.title?.trim(),
        type: model.type,
        priority: model.priority,
        severity: model.severity,
        point: model.storyPoints,
        estimateHours: model.estimateHours,
        remainingHours: model.remainingHours,
        dueDate: model.dueDate,
        sprintId: model.sprintId,
        workflowStatusId: model.workflowStatusId,
        statusCode: model.statusCode,
        parentTaskId: model.parentTaskId,
        sourceTaskId:
          (model as any).sourceTaskId ?? model.sourceTicketId ?? null,
        description,
      };

      if (workflowAssignments && workflowAssignments.length) {
        payload.workflowAssignments = workflowAssignments;
      }

      const raw = await putTask(model.id, payload);
      const dto: any = raw?.data ?? raw ?? {};
      if (dto && dto.id) {
        // optional: sync lại model nếu cần
      }
      console.log(payload)
      toast.success("Ticket saved successfully.");
    } catch (err: any) {
      console.error("[TaskDetail] save failed", err);
      toast.error(err?.message || "Save failed");
    }
  }

  /* ===== UI ===== */

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {loadingDetail && (
        <div className="text-xs text-slate-500 mb-1">
          Loading ticket detail…
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">{model.code}</div>
          <div className="text-xl md:text-2xl font-semibold text-slate-900">
            {model.title}
          </div>

          {/* meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white">
              Internal
            </span>
            {model.type && (
              <Badge
                label="Type"
                value={model.type}
                colorClass="border-slate-300"
              />
            )}
            {model.priority && (
              <Badge
                label="Priority"
                value={model.priority}
                colorClass="border-amber-400"
              />
            )}
            {typeof model.storyPoints === "number" && (
              <Badge
                label="Points"
                value={String(model.storyPoints ?? 0)}
                colorClass="border-emerald-400"
              />
            )}
            {sprint && (
              <Badge
                label="Sprint"
                value={sprint.name}
                colorClass="border-slate-300"
              />
            )}
            <span className="ml-1">
              Created&nbsp;
              <strong>{fmtDateTime(model.createdAt)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1 px-4 h-9 rounded-full border border-[var(--brand,theme(colors.blue.600))] bg-[var(--brand,theme(colors.blue.600))] text-sm text-white hover:bg-blue-700"
            style={{ ["--brand" as any]: brand }}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* ===== Main layout: LEFT big, RIGHT small ===== */}
      <div className="mt-2 flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDE */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* STATUS AREA – summary + quick next + dropdown panel */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-slate-600">
                Workflow{" "}
                {totalSteps > 0 && activeStepIndex >= 0 && (
                  <>
                    • Step{" "}
                    <span className="font-semibold text-slate-800">
                      {activeStepIndex + 1}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {totalSteps}
                    </span>
                  </>
                )}
              </div>

              {activeMeta && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-medium shadow-sm">
                    {activeMeta.name}
                  </span>

                  {nextStatus && !activeMeta.isFinal && (
                    <button
                      type="button"
                      onClick={handleQuickNext}
                      disabled={changingStatus}
                      className={cn(
                        "h-8 px-3 rounded-full border text-[11px] font-medium inline-flex items-center gap-1 bg-blue-50/80 border-blue-300 text-blue-700 hover:bg-blue-100",
                        changingStatus && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      Next: {nextStatus.name}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStatusPickerOpen((prev) => !prev)}
                    className="h-8 px-3 rounded-full border border-slate-300 bg-white/80 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {statusPickerOpen ? "Hide steps" : "View all steps"}
                  </button>
                </div>
              )}
            </div>

            {activeMeta && (
              <div className="mt-2 text-[11px] text-slate-600">
                Current status:{" "}
                <span className="font-medium text-slate-900">
                  {activeMeta.name}
                </span>
                {activeMeta.isStart && " • Start step"}
                {activeMeta.isFinal && " • Final step"}
              </div>
            )}

            {/* Panel chọn status – dạng dọc, nhiều status vẫn ổn */}
            {statusPickerOpen && statusList.length > 0 && (
              <div className="mt-3 rounded-2xl border border-slate-100 bg-white/80 p-3 max-h-64 overflow-y-auto space-y-1.5">
                {statusList.map((st, idx) => {
                  const isCurrent = st.id === activeStatusId;
                  const isTarget =
                    !!draftStatusId && draftStatusId === st.id && !isCurrent;

                  const category = (st.category || "").toUpperCase();

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusClick(st.id)}
                      className={cn(
                        "w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 border transition",
                        isCurrent
                          ? "bg-slate-900 text-white border-slate-900"
                          : isTarget
                          ? "bg-blue-50 text-slate-900 border-blue-300 shadow-sm"
                          : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                      )}
                    >
                      {/* step number */}
                      <div
                        className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold",
                          isCurrent
                            ? "bg-slate-800 text-white"
                            : "bg-white/80 text-slate-800"
                        )}
                      >
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">
                            {st.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-slate-300">
                              (current)
                            </span>
                          )}
                          {isTarget && (
                            <span className="text-[10px] font-medium text-blue-700">
                              (next)
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px]">
                          {st.isStart && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Start
                            </span>
                          )}
                          {st.isFinal && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Final
                            </span>
                          )}
                          {st.category && (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded-full border",
                                categoryChipClasses(category)
                              )}
                            >
                              {category.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* radio / indicator */}
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white/60">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            isCurrent
                              ? "bg-slate-900"
                              : isTarget
                              ? "bg-blue-600"
                              : "bg-transparent"
                          )}
                        />
                      </div>
                    </button>
                  );
                })}

                {/* Thanh confirm đổi status */}
                {draftMeta && (
                  <div className="pt-2 mt-1 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span>
                      Change to{" "}
                      <span className="font-semibold text-slate-900">
                        {draftMeta.name}
                      </span>
                      ?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftStatusId(null)}
                        className="h-7 px-2 rounded-full border border-slate-300 text-[11px] text-slate-600 hover:bg-slate-50"
                        disabled={changingStatus}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={applyStatusChange}
                        disabled={changingStatus}
                        className={cn(
                          "h-7 px-3 rounded-full text-[11px] text-white bg-slate-900 hover:bg-slate-800",
                          changingStatus && "opacity-70 cursor-not-allowed"
                        )}
                      >
                        {changingStatus ? "Updating…" : "Update status"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-2">
              Description
            </div>
            <textarea
              className="w-full min-h-[140px] resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="Describe the goal, scope and context of this ticket..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* CHECKLIST */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-900">
                Checklist
              </div>
              <button
                type="button"
                onClick={startAddChecklistItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Plus className="w-3 h-3" />
                Add item
              </button>
            </div>
            <div className="text-xs text-slate-500 mb-2">
              {checklistDone}/{checklistTotal} items completed
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${checklistPct}%` }}
              />
            </div>

            <div className="space-y-1.5">
              {checklist.map((item) => {
                const isEditing = editingChecklistId === item.id;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        checked={item.done}
                        disabled={isEditing}
                        onChange={() => toggleChecklist(item.id)}
                      />
                      {isEditing ? (
                        <input
                          autoFocus
                          className="flex-1 min-w-0 h-8 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          placeholder="Checklist item title…"
                          value={editingChecklistLabel}
                          onChange={(e) =>
                            handleChecklistLabelChange(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleChecklistSave(item.id);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              handleChecklistCancel(item.id);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className={cn(
                            "truncate",
                            item.done && "line-through text-slate-400"
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 ml-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleChecklistSave(item.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChecklistCancel(item.id)}
                            className="text-xs text-slate-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => moveChecklist(item.id, "up")}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveChecklist(item.id, "down")}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklist(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-900">
                Attachments
              </div>
              <div className="text-[11px] text-slate-500">
                Images, documents, video…
              </div>
            </div>
            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-500">
              <Paperclip className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              Drag & drop files here or{" "}
              <span className="text-blue-600 font-medium cursor-pointer">
                browse
              </span>
              .
            </div>
          </div>

          {/* COMMENTS & ACTIVITY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-2">
              Comments & activity
            </div>
            <div className="mb-3 flex items-center gap-2">
              <textarea
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                placeholder="Write a comment or update…"
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="button"
                onClick={addComment}
                className="self-stretch mt-auto px-3 rounded-xl border border-blue-600 bg-blue-600 text-white text-sm inline-flex items-center justify-center hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-auto space-y-2 text-sm">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-100 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">
                      {c.author}
                    </span>
                    <span>{fmtDateTime(c.createdAt)}</span>
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-line">
                    {c.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – PROPERTIES */}
        <aside className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 lg:sticky lg:top-20 self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-1">
              Properties
            </div>
            <div className="text-xs text-slate-500 mb-3">
              In production only project owner / PM can change these.
            </div>

            {/* Assignee */}
            <Field label="Assignee">
              <UserAssignDropdown
                users={projectMembers}
                value={primaryAssignee?.id ?? null}
                onChange={(id) => {
                  if (!id) {
                    updateField("assignees", []);
                    return;
                  }
                  const u = projectMembers.find((m) => m.id === id);
                  if (!u) return;

                  const mem: MemberRef = {
                    id: u.id,
                    name: u.name,
                    // 2 field dưới tuỳ định nghĩa MemberRef của bạn, có thể bỏ nếu không có
                    avatarUrl: u.avatarUrl,
                    email: u.email,
                  } as any;

                  updateField("assignees", [mem]);
                }}
                placeholder={
                  loadingMembers ? "Loading members…" : "Unassigned"
                }
              />
            </Field>

            {/* Workflow roles – show TẤT CẢ roles của workflow */}
            {workflowRoles.length > 0 && (
              <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
                <div className="text-[11px] text-slate-500 mb-2">
                  Workflow roles for this ticket
                </div>
                <div className="space-y-2">
                  {workflowRoles.map((role) => {
                    const assignedId = roleAssignments[role.key] ?? null;
                    const assignedMember = assignedId
                      ? projectMembers.find((m) => m.id === assignedId)
                      : undefined;

                    return (
                      <div
                        key={role.key}
                        className="rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-700">
                              {role.label}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {role.statuses.map((st) => (
                                <span
                                  key={st.id}
                                  className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px]",
                                    st.isStart
                                      ? "bg-slate-50 border-slate-300 text-slate-600"
                                      : "bg-blue-50 border-blue-200 text-blue-700"
                                  )}
                                >
                                  {st.name}
                                  {st.isStart && (
                                    <span className="ml-1 text-[9px] uppercase text-slate-400">
                                      START
                                    </span>
                                  )}
                                  {st.isFinal && (
                                    <span className="ml-1 text-[9px] uppercase text-emerald-500">
                                      FINAL
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="w-[180px] shrink-0 text-right">
                            {role.editable ? (
                              <UserAssignDropdown
                                users={projectMembers}
                                value={assignedId}
                                onChange={(val) => {
                                  setRoleAssignments((prev) => ({
                                    ...prev,
                                    [role.key]: val,
                                  }));
                                }}
                                placeholder={
                                  loadingMembers
                                    ? "Loading members…"
                                    : "Unassigned"
                                }
                              />
                            ) : (
                              <div className="text-[11px] text-slate-500 text-left">
                                <div className="font-medium text-slate-700 truncate">
                                  {assignedMember?.name ||
                                    "Auto-assigned at start"}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Fixed on start step
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Priority */}
            <Field label="Priority">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.priority}
                onChange={(e) =>
                  updateField("priority", e.target.value as TaskVm["priority"])
                }
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </Field>

            {/* Type */}
            <Field label="Type">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Chore">Chore</option>
                {["Feature", "Bug", "Chore"].includes(model.type) ? null : (
                  <option value={model.type}>{model.type}</option>
                )}
              </select>
            </Field>

            {/* Story points & estimate */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Story points">
                <input
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.storyPoints ?? 0}
                  onChange={(e) =>
                    updateField("storyPoints", Number(e.target.value) || 0)
                  }
                />
              </Field>
              <Field label="Estimate (h)">
                <input
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.estimateHours ?? 0}
                  onChange={(e) =>
                    updateField("estimateHours", Number(e.target.value) || 0)
                  }
                />
              </Field>
            </div>

            {/* Remaining & severity */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Remaining (h)">
                <input
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.remainingHours ?? 0}
                  onChange={(e) =>
                    updateField("remainingHours", Number(e.target.value) || 0)
                  }
                />
              </Field>
              <Field label="Severity">
                <select
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  value={model.severity ?? "Medium"}
                  onChange={(e) =>
                    updateField(
                      "severity",
                      e.target.value as TaskVm["severity"]
                    )
                  }
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </Field>
            </div>

            {/* Dates */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Start date">
                <input
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={toInputDate(model.openedAt)}
                  onChange={(e) =>
                    updateField("openedAt", fromInputDate(e.target.value)!)
                  }
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={toInputDate(model.dueDate)}
                  onChange={(e) =>
                    updateField("dueDate", fromInputDate(e.target.value))
                  }
                />
              </Field>
            </div>

            {/* Sprint */}
            <Field label="Sprint" className="mt-3">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.sprintId ?? ""}
                onChange={(e) =>
                  updateField("sprintId", e.target.value || null)
                }
              >
                <option value="">Backlog / no sprint</option>
                {allSprints.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* technical info */}
            <div className="mt-4 text-[11px] text-slate-500 space-y-1">
              <div>
                Last updated:{" "}
                <span className="font-medium">
                  {fmtDateTime(model.updatedAt)}
                </span>
              </div>
              <div>
                Status key:{" "}
                <span className="font-mono text-xs">{model.statusCode}</span>
              </div>
              {model.carryOverCount > 0 && (
                <div>Spillover count: {model.carryOverCount}</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ===== Tiny helpers ===== */

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2", className)}>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Badge({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white",
        colorClass || "border-slate-300"
      )}
    >
      <span className="uppercase tracking-wide text-[10px] text-slate-400">
        {label}
      </span>
      <span className="text-[11px] text-slate-700 font-medium">{value}</span>
    </span>
  );
}

/** chip màu theo category (TODO/IN_PROGRESS/REVIEW/DONE/...) */
function categoryChipClasses(category?: string) {
  const c = (category || "").toUpperCase();
  if (c === "TODO") return "bg-slate-100 border-slate-200 text-slate-700";
  if (c === "IN_PROGRESS")
    return "bg-blue-50 border-blue-200 text-blue-700";
  if (c === "REVIEW")
    return "bg-violet-50 border-violet-200 text-violet-700";
  if (c === "DONE")
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  return "bg-slate-50 border-slate-200 text-slate-600";
}

function UserAssignDropdown({
  users,
  value,
  onChange,
  placeholder = "Unassigned",
}: {
  users: ProjectMemberOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => users.find((u) => u.id === value) || null,
    [users, value]
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) => {
      const haystack =
        (u.name || "") + " " + (u.email || "") + " " + (u.roleName || "");
      return haystack.toLowerCase().includes(kw);
    });
  }, [users, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-9 w-full rounded-xl border border-slate-300 px-3 text-sm bg-white flex items-center justify-between gap-2",
          "hover:border-blue-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-600 overflow-hidden">
            {selected?.avatarUrl ? (
              <img
                src={selected.avatarUrl}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
            ) : (
              (selected?.name?.[0] || "?").toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-medium text-slate-800 truncate">
              {selected?.name || placeholder}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {selected?.roleName || selected?.email || ""}
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              className="w-full h-8 rounded-xl border border-slate-200 px-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Search member by name, email, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left text-xs",
                !value
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[11px]">
                —
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Unassigned</div>
                <div className="text-[10px] text-slate-400 truncate">
                  No primary owner
                </div>
              </div>
            </button>

            {filtered.map((u) => {
              const isActive = value === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onChange(u.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-600 overflow-hidden">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (u.name[0] || "?").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {u.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {u.roleName || u.email || "Member"}
                    </div>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-2 py-2 text-[11px] text-slate-400">
                No members found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
