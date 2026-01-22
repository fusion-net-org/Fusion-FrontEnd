/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useEffect, useMemo, useState, useRef } from "react";
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
  ChevronDown as ChevronDownIcon,
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
  getTaskAttachments,
  uploadTaskAttachments,
  deleteTaskAttachment,
  createTaskComment,
  getTaskComments,
} from "@/services/taskService.js";
import { toast } from "react-toastify";
import { getProjectMembersWithRole } from "@/services/projectMember.js";
import { normalizeBoardInput } from "@/mappers/projectBoardMapper";
import { Can, usePermissions } from "@/permission/PermissionProvider";
import TaskAuditLogList from "@/components/Company/Task/TaskAuditLogList";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type AttachmentItem = {
  id: string;
  fileName: string;
  url: string;
  contentType?: string | null;
  size?: number | null;
  description?: string | null;
  uploadedAt?: string | null;
  uploadedByName?: string | null;
};

type CommentItem = {
  id: string;
  author: string;
  authorId?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
  message: string;
  attachments?: AttachmentItem[];
  isSystem?: boolean;
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

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  orderIndex?: number;
  createdAt?: string;
};

/** Gom theo workflow (không tách theo role nữa) */
type WorkflowGroupDef = {
  key: string; // workflow group key (từ workflowKey / roles combination)
  label: string; // nhãn hiển thị, vd "Qa / Reviewer"
  statuses: {
    id: string;
    name: string;
    isStart?: boolean;
    isFinal?: boolean;
  }[];
  hasStart: boolean; // true nếu group này có status isStart
};

type WorkflowAssignmentMap = Record<string, string | null>;

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
       const rawBoard: any = await fetchSprintBoard(projectId);

// dùng mapper chung với board để bơm statusOrder + statusMeta từ workflow
const normalized = normalizeBoardInput(rawBoard ?? {});
const bs: SprintVm[] = normalized.sprints ?? [];
const ts: TaskVm[] = normalized.tasks ?? [];

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

//permission
 const { can, loading: permLoading } = usePermissions();

const PERM = {
  DETAIL_EDIT: "TASK_DETAIL_UPDATE",      // edit detail fields (priority/type/points/severity/dates/desc/checklist...)
  ASSIGN_EDIT: "TASK_ASSIGN_MEMBER",      // assignee + workflow owners
  SPRINT_EDIT: "TASK_MOVE_SPRINT",      // sprint
} as const;

const canEditDetail = !permLoading && can(PERM.DETAIL_EDIT);
const canEditAssign = !permLoading && can(PERM.ASSIGN_EDIT);
const canEditSprint = !permLoading && can(PERM.SPRINT_EDIT);

//
  // NEW: map workflow theo group (không còn roleAssignments)
  const [workflowAssignmentMap, setWorkflowAssignmentMap] =
    useState<WorkflowAssignmentMap>({});

  const [projectMembers, setProjectMembers] = useState<ProjectMemberOption[]>(
    []
  );
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // comment attachments
  const [newCommentFiles, setNewCommentFiles] = useState<File[]>([]);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);

  // trạng thái chọn trước khi apply
  const [draftStatusId, setDraftStatusId] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // trạng thái thêm / edit checklist inline
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(
    null
  );
  const [editingChecklistLabel, setEditingChecklistLabel] = useState("");

  // khi task từ board đổi (nếu sau này sync lại), update model
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

  // ===== load chi tiết task + checklist + comments + attachments + workflowAssignments =====
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

        setChecklist(checklistItems);

        // 5) Comments / activity – ưu tiên API /comments
        try {
          const cmRes = await getTaskComments(task.id);
          const payload: any = cmRes ?? [];
          let list: any[] = [];

          if (Array.isArray(payload)) {
            list = payload;
          } else if (Array.isArray(payload.items)) {
            list = payload.items;
          } else if (Array.isArray(payload.comments)) {
            list = payload.comments;
          } else if (Array.isArray(payload.data)) {
            list = payload.data;
          }

          if (list.length) {
            const mapped: CommentItem[] = list.map((c: any, idx: number) =>
              mapCommentDto(c, idx)
            );
            mapped.sort((a, b) =>
              (b.createdAt || "").localeCompare(a.createdAt || "")
            );
            setComments(mapped);
          } else {
            const cmRaw = dto.comments ?? dto.activities ?? [];
            if (Array.isArray(cmRaw) && cmRaw.length) {
              const mapped: CommentItem[] = cmRaw.map(
                (c: any, idx: number) => ({
                  id: String(c.id ?? idx),
                  author:
                    c.authorName ??
                    c.author ??
                    c.createdByName ??
                    task.assignees?.[0]?.name ??
                    "System",
                  authorId:
                    c.authorId ?? c.createdById ?? c.userId ?? null,
                  authorAvatarUrl: c.avatarUrl ?? null,
                  createdAt:
                    c.createdAt ??
                    c.time ??
                    c.created_at ??
                    new Date().toISOString(),
                  message: String(c.message ?? c.content ?? ""),
                  attachments: [],
                  isSystem: !!c.isSystem,
                })
              );
              mapped.sort((a, b) =>
                (b.createdAt || "").localeCompare(a.createdAt || "")
              );
              setComments(mapped);
            } else {
              // fallback hệ thống đơn giản
            setComments([]);
            }
          }
        } catch (err) {
          console.error("[TaskDetail] load comments failed", err);
          const cmRaw = dto.comments ?? dto.activities ?? [];
          if (Array.isArray(cmRaw) && cmRaw.length) {
            const mapped: CommentItem[] = cmRaw.map(
              (c: any, idx: number) => ({
                id: String(c.id ?? idx),
                author:
                  c.authorName ??
                  c.author ??
                  c.createdByName ??
                  task.assignees?.[0]?.name ??
                  "System",
                authorId:
                  c.authorId ?? c.createdById ?? c.userId ?? null,
                authorAvatarUrl: c.avatarUrl ?? null,
                createdAt:
                  c.createdAt ??
                  c.time ??
                  c.created_at ??
                  new Date().toISOString(),
                message: String(c.message ?? c.content ?? ""),
                attachments: [],
                isSystem: !!c.isSystem,
              })
            );
            mapped.sort((a, b) =>
              (b.createdAt || "").localeCompare(a.createdAt || "")
            );
            setComments(mapped);
          }
        }

      
               // 6) Workflow assignments:
        //    - Lấy main assignee từ bước START
        //    - Lấy owner cho các workflow group còn lại (Developer, QA / Reviewer,…)
        if (sprint && sprint.statusMeta) {
          const nextMap: WorkflowAssignmentMap = {};
          let mainAssigneeFromWorkflow: MemberRef | null = null;
          let hasStartInWorkflow = false;

          // --- BE mới: dto.workflowAssignments.items ---
          if (dto.workflowAssignments) {
            const wf = dto.workflowAssignments;
            const items: any[] = Array.isArray(wf.items) ? wf.items : wf ?? [];

            items.forEach((it: any) => {
              const statusId = String(it.workflowStatusId || it.statusId || "");
              if (!statusId) return;

              const meta: any = sprint.statusMeta[statusId];
              if (!meta) return;

              const rawUserId = it.assignUserId ?? it.userId ?? null;
              const uid = rawUserId ? String(rawUserId) : null;

              if (meta.isStart) {
                hasStartInWorkflow = true;

                // Start có user -> main assignee
                if (uid && !mainAssigneeFromWorkflow) {
                  mainAssigneeFromWorkflow = {
                    id: uid,
                    name:
                      it.assignUserName ||
                      it.assignUserEmail ||
                      "Unknown member",
                    email: it.assignUserEmail ?? undefined,
                    avatarUrl: it.assignUserAvatarUrl ?? undefined,
                  } as any;
                }

                return; // Start không map vào group
              }

              // Các bước còn lại -> owner theo group (Developer, QA / Reviewer,…)
              if (!uid) return;

              const key = deriveWorkflowGroupKey(meta);
              if (!key) return;

              // BE là nguồn sự thật → luôn dùng giá trị mới nhất
              nextMap[key] = uid;
            });
          }
          // --- BE cũ: dto.roleAssignments (legacy) ---
          else if (
            dto.roleAssignments &&
            typeof dto.roleAssignments === "object"
          ) {
            const legacy: Record<string, string | null> =
              dto.roleAssignments as any;

            (sprint.statusOrder || []).forEach((statusId) => {
              const meta: any = sprint.statusMeta[statusId];
              if (!meta) return;

              const roles: string[] = Array.isArray(meta.roles)
                ? meta.roles.filter(Boolean)
                : [];
              if (!roles.length) return;

              const roleWithUser = roles.find(
                (rk) => legacy[rk] != null && legacy[rk] !== ""
              );
              const uid = roleWithUser ? legacy[roleWithUser] : null;
              if (!uid) return;

              if (meta.isStart) {
                hasStartInWorkflow = true;

                if (!mainAssigneeFromWorkflow) {
                  mainAssigneeFromWorkflow = {
                    id: String(uid),
                    name: "Unknown member",
                  } as any;
                }
              } else {
                const key = deriveWorkflowGroupKey(meta);
                if (!key) return;
                nextMap[key] = String(uid);
              }
            });
          }

          if (!cancelled) {
            // map owner cho Developer / QA / …
            setWorkflowAssignmentMap(nextMap);

            // Nếu workflow có bước Start thì Start là nguồn sự thật cho Assignee
            if (hasStartInWorkflow) {
              setModel((prev) => {
                // Start có user -> set assignee mới
                if (mainAssigneeFromWorkflow) {
                  return {
                    ...prev,
                    assignees: [mainAssigneeFromWorkflow!] as any,
                  };
                }

                // Start tồn tại nhưng tất cả assignUserId = null -> Unassigned
                if (!prev.assignees || prev.assignees.length === 0) {
                  return prev; // đã unassigned rồi
                }

                return {
                  ...prev,
                  assignees: [] as any,
                };
              });
            }
          }
        }



        // 7) Attachments của task
        try {
          const attRaw = await getTaskAttachments(task.id);
          const list: any[] = Array.isArray(attRaw)
            ? attRaw
            : Array.isArray((attRaw as any)?.items)
            ? (attRaw as any).items
            : Array.isArray((attRaw as any)?.attachments)
            ? (attRaw as any).attachments
            : [];
          const mapped = list.map((x: any, idx: number) =>
            mapAttachmentDto(x, idx)
          );
          if (!cancelled) {
            setAttachments(mapped);
          }
        } catch (err) {
          console.error("[TaskDetail] load attachments failed", err);
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
  (sprint.statusOrder || [])
    .map((id) => sprint.statusMeta?.[id])
    .filter(Boolean) ?? [];

const activeStatusId = model.workflowStatusId;
const activeMeta = sprint.statusMeta
  ? sprint.statusMeta[activeStatusId]
  : undefined;

const draftMeta =
  draftStatusId &&
  draftStatusId !== activeStatusId &&
  sprint.statusMeta
    ? sprint.statusMeta[draftStatusId]
    : undefined;


  const primaryAssignee: MemberRef | undefined =
    (model.assignees && model.assignees[0]) || undefined;

  const checklistDone = checklist.filter((x) => x.done).length;
  const checklistTotal = checklist.length || 1;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);

  const activeStepIndex = statusList.findIndex(
    (st: any) => st.id === activeStatusId
  );
  const totalSteps = statusList.length;

  const currentIndex = statusList.findIndex(
    (st: any) => st.id === activeStatusId
  );
  const nextStatus =
    currentIndex >= 0 && currentIndex < statusList.length - 1
      ? statusList[currentIndex + 1]
      : undefined;

  // reset draft khi status đổi
  useEffect(() => {
    setDraftStatusId(null);
    setStatusPickerOpen(false);
  }, [activeStatusId]);

  // ==== gom STATUS thành các workflow group (không tách theo ROLE) ====
  const workflowGroups: WorkflowGroupDef[] = useMemo(() => {
    if (!sprint || !sprint.statusMeta) return [];

    const rawMap: Record<string, WorkflowGroupDef> = {};

    (sprint.statusOrder || []).forEach((statusId) => {
      const st: any = sprint.statusMeta[statusId];
      if (!st) return;

      // chỉ quan tâm các status có roles -> thuộc 1 workflow nào đó
      const roles: string[] = Array.isArray(st.roles)
        ? st.roles.filter(Boolean)
        : [];
      if (!roles.length) return;

      const key = deriveWorkflowGroupKey(st);
      const label = deriveWorkflowGroupLabel(st);
      if (!key) return;

      if (!rawMap[key]) {
        rawMap[key] = {
          key,
          label,
          statuses: [],
          hasStart: false,
        };
      }

      rawMap[key].statuses.push({
        id: statusId,
        name: st.name,
        isStart: !!st.isStart,
        isFinal: !!st.isFinal,
      });

      if (st.isStart) {
        rawMap[key].hasStart = true;
      }
    });

    return Object.values(rawMap).sort((a, b) => a.label.localeCompare(b.label));
  }, [sprint]);

  const startWorkflowGroups = useMemo(
    () => workflowGroups.filter((g) => g.hasStart),
    [workflowGroups]
  );

  const nonStartWorkflowGroups = useMemo(
    () => workflowGroups.filter((g) => !g.hasStart),
    [workflowGroups]
  );
// ===== Workflow transitions (giống Sprint board) =====
type SprintTransition = {
  id: string;
  fromStatusId: string;
  toStatusId: string;
  type: string; // success | failure | optional | ...
  label?: string | null;
  enforceTransitions?: boolean;
};

type HighlightKind = "success" | "optional" | "failure";
type TransitionHint = { kind: HighlightKind; labels: string[] };

const sprintTransitions: SprintTransition[] = useMemo(() => {
  const raw =
    (sprint as any)?.transitions ??
    (sprint as any)?.workflowTransitions ??
    [];

  return (Array.isArray(raw) ? raw : [])
    .map((x: any): SprintTransition => ({
      id: String(x.id ?? `${x.fromStatusId ?? x.from}-${x.toStatusId ?? x.to}`),
      fromStatusId: String(
        x.fromStatusId ?? x.fromStatus ?? x.sourceStatusId ?? x.sourceId ?? x.from ?? ""
      ),
      toStatusId: String(
        x.toStatusId ?? x.toStatus ?? x.targetStatusId ?? x.targetId ?? x.to ?? ""
      ),
      type: String(x.type ?? x.transitionType ?? "success").toLowerCase(),
      label: x.label ?? x.name ?? null,
      enforceTransitions: !!x.enforceTransitions,
    }))
    .filter((tr) => tr.fromStatusId && tr.toStatusId);
}, [sprint]);

const hasAnyTransitions = sprintTransitions.length > 0;

// transitions đi ra từ status hiện tại
const outgoingTransitions = useMemo(
  () => sprintTransitions.filter((tr) => tr.fromStatusId === activeStatusId),
  [sprintTransitions, activeStatusId]
);

// Tập statusId hợp lệ trong sprint (để lọc các transition rác)
const validStatusIdSet = useMemo(() => {
  const ids = (statusList as any[]).map((x) => String(x.id));
  return new Set(ids);
}, [statusList]);

// Allowed targets theo đúng policy ở Sprint board
const allowedTargets = useMemo(() => {
  // Legacy workflow không có transitions -> fallback cho phép chọn theo statusOrder (giữ behavior cũ)
  if (!hasAnyTransitions) {
    return (statusList as any[]).map((x) => String(x.id)).filter(Boolean);
  }

  // Có transitions nhưng status hiện tại không có outgoing -> không cho nhảy (tránh đi vào đường không transition)
  if (!outgoingTransitions.length) return [];

  const enforcedNonFail = Array.from(
    new Set(
      outgoingTransitions
        .filter((tr) => tr.enforceTransitions && tr.type !== "failure")
        .map((tr) => tr.toStatusId)
    )
  );

  const failureTargets = Array.from(
    new Set(outgoingTransitions.filter((tr) => tr.type === "failure").map((tr) => tr.toStatusId))
  );

  // Nếu có enforceTransitions (non-failure) -> chỉ cho phép enforced + failure (y như board)
  const rawAllowed = enforcedNonFail.length
    ? Array.from(new Set([...enforcedNonFail, ...failureTargets]))
    : Array.from(new Set(outgoingTransitions.map((tr) => tr.toStatusId)));

  // lọc chỉ những status tồn tại trong sprint
  return rawAllowed.filter((id) => validStatusIdSet.has(id));
}, [hasAnyTransitions, outgoingTransitions, statusList, validStatusIdSet]);

const isAllowedStatus = (id: string) => id === activeStatusId || allowedTargets.includes(id);

// Hint UI giống highlightTargets của board (để show chip Success/Optional/Rework)
const transitionHints: Record<string, TransitionHint> = useMemo(() => {
  const next: Record<string, TransitionHint> = {};
  const priority: Record<HighlightKind, number> = {
    success: 3,
    failure: 2,
    optional: 1,
  };

  outgoingTransitions.forEach((tr) => {
    // CHỈ hint các target đang được phép (match allowedTargets)
    if (!allowedTargets.includes(tr.toStatusId)) return;

    const kind: HighlightKind =
      tr.type === "success"
        ? "success"
        : tr.type === "failure"
        ? "failure"
        : "optional";

    const rawLabel = (tr.label || "").trim();
    const label =
      rawLabel ||
      (kind === "success"
        ? "Success"
        : kind === "failure"
        ? "Rework"
        : "Optional");

    const prev = next[tr.toStatusId];
    if (!prev) next[tr.toStatusId] = { kind, labels: [label] };
    else {
      const bestKind = priority[kind] > priority[prev.kind] ? kind : prev.kind;
      const labels = prev.labels.includes(label) ? prev.labels : [...prev.labels, label];
      next[tr.toStatusId] = { kind: bestKind, labels };
    }
  });

  return next;
}, [outgoingTransitions, allowedTargets]);


// “Next” theo flow transition (ưu tiên success)
const nextStatusIdByFlow = useMemo(() => {
  if (!activeStatusId) return null;
  if (!hasAnyTransitions) {
    // legacy fallback: next theo statusOrder cũ
    const idx = (statusList as any[]).findIndex((s) => s.id === activeStatusId);
    const next = idx >= 0 ? (statusList as any[])[idx + 1] : null;
    return next?.id ?? null;
  }

  if (!outgoingTransitions.length) return null;

  const pick =
    outgoingTransitions.find((tr) => tr.type === "success") ??
    outgoingTransitions.find((tr) => tr.type !== "failure") ??
    outgoingTransitions[0];

  const id = pick?.toStatusId ?? null;
  return id && validStatusIdSet.has(id) ? id : null;
}, [activeStatusId, hasAnyTransitions, outgoingTransitions, statusList, validStatusIdSet]);

const nextMetaByFlow =
  nextStatusIdByFlow && sprint.statusMeta ? (sprint.statusMeta as any)[nextStatusIdByFlow] : null;

  /* ===== handlers ===== */

  function updateField<K extends keyof TaskVm>(key: K, value: TaskVm[K]) {
    setModel((prev) => ({ ...prev, [key]: value }));
  }

function handleStatusClick(statusId: string) {
  if (statusId === activeStatusId) {
    setDraftStatusId(null);
    return;
  }

  if (!isAllowedStatus(statusId)) {
    toast.info("Workflow does not allow moving to this status (no transition).");
    return;
  }

  setDraftStatusId(statusId);
}


  async function commitStatusChange(statusId: string) {
    if (!statusId || statusId === activeStatusId) return;
    const meta: any = sprint.statusMeta[statusId];
    if (!meta) return;
  if (!isAllowedStatus(statusId)) {
    toast.info("This move is not allowed by workflow transitions.");
    return;
  }
    const now = new Date().toISOString();
    const prev = model;
    const next: TaskVm = {
      ...prev,
      workflowStatusId: statusId,
      statusCode: meta.code,
      statusCategory: meta.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      StatusName: meta.name,
      updatedAt: now,
    } as any;

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
  if (!nextStatusIdByFlow) return;
  if (nextStatusIdByFlow === activeStatusId) return;
  await commitStatusChange(nextStatusIdByFlow);
}


  // ===== CHECKLIST HANDLERS =====

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

    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, label } : i))
    );
    setEditingChecklistId(null);
    setEditingChecklistLabel("");

    try {
      if (id.startsWith("local-")) {
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
        await updateTaskChecklistItem(model.id, { id, label });
      }
    } catch (err) {
      console.error("[TaskDetail] save checklist item failed", err);
    }
  }

  // toggle done: update local + gọi API toggle
  async function toggleChecklist(id: string) {
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
    try {
      if (!id.startsWith("local-")) {
        await toggleTaskChecklistItemDone(model.id, id);
      }
    } catch (err) {
      console.error("[TaskDetail] toggle checklist failed", err);
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
      setChecklist(prev);
    }
  }

  // ===== COMMENT HANDLERS =====

  function handleCommentFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setNewCommentFiles((prev) => [...prev, ...Array.from(files)]);
    e.target.value = "";
  }

  function handleRemoveCommentFile(idx: number) {
    setNewCommentFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleCommentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmitComment();
    }
  }

  async function handleSubmitComment() {
    const body = newComment.trim();
    if (!body && newCommentFiles.length === 0) return;

    try {
      setIsSendingComment(true);

      // service FE nên support (taskId, body, files)
      await createTaskComment(model.id, body, newCommentFiles);

      setNewComment("");
      setNewCommentFiles([]);
      if (commentFileInputRef.current) {
        commentFileInputRef.current.value = "";
      }

      // reload comments để lấy đúng dữ liệu + file từ BE
      try {
        const cmRes = await getTaskComments(model.id);
        const payload: any = cmRes ?? [];
        let list: any[] = [];

        if (Array.isArray(payload)) {
          list = payload;
        } else if (Array.isArray(payload.items)) {
          list = payload.items;
        } else if (Array.isArray(payload.comments)) {
          list = payload.comments;
        } else if (Array.isArray(payload.data)) {
          list = payload.data;
        }

        if (list.length) {
          const mapped = list.map((c: any, idx: number) =>
            mapCommentDto(c, idx)
          );
          mapped.sort((a, b) =>
            (b.createdAt || "").localeCompare(a.createdAt || "")
          );
          setComments(mapped);
        }
      } catch (err) {
        console.error("[TaskDetail] reload comments failed", err);
      }

      toast.success("Comment added.");
    } catch (err: any) {
      console.error("[TaskDetail] create comment failed", err);
      toast.error(err?.message || "Failed to add comment");
    } finally {
      setIsSendingComment(false);
    }
  }

  // ===== ATTACHMENT HANDLERS (TASK LEVEL) =====

  async function handleUploadFiles(filesList: FileList | null) {
    if (!filesList || filesList.length === 0) return;

    try {
      setUploadingAttachments(true);

      const res = await uploadTaskAttachments(model.id, filesList, "");
      const payload: any = res ?? [];
      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.attachments)
        ? payload.attachments
        : [];

      const mapped = list.map((x: any, idx: number) =>
        mapAttachmentDto(x, idx)
      );

      setAttachments((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const merged = [...prev];
        mapped.forEach((m) => {
          if (!ids.has(m.id)) merged.push(m);
        });
        return merged;
      });

      toast.success("Attachments uploaded.");
    } catch (err: any) {
      console.error("[TaskDetail] upload attachments failed", err);
      toast.error(err?.message || "Upload attachments failed");
    } finally {
      setUploadingAttachments(false);
    }
  }

  async function handleFileInputChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const filesList = e.target.files;
    await handleUploadFiles(filesList);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    await handleUploadFiles(e.dataTransfer?.files ?? null);
  }

  async function handleDeleteAttachmentClick(id: string) {
    const prev = attachments;
    setAttachments((curr) => curr.filter((a) => a.id !== id));
    try {
      await deleteTaskAttachment(model.id, id);
      toast.success("Attachment removed.");
    } catch (err: any) {
      console.error("[TaskDetail] delete attachment failed", err);
      toast.error(err?.message || "Delete attachment failed");
      setAttachments(prev);
    }
  }

  async function handleSave() {
    try {
      // build workflowAssignments từ workflowAssignmentMap + sprint.statusMeta
      let workflowAssignmentsPayload: any[] | undefined = undefined;

      if (sprint && sprint.statusOrder && sprint.statusMeta) {
        const items: any[] = [];
        const mainAssigneeId: string | null =
          (model.assignees && model.assignees[0]?.id) || null;

        (sprint.statusOrder || []).forEach((statusId) => {
          const meta: any = sprint.statusMeta[statusId];
          if (!meta) return;

          const roles: string[] = Array.isArray(meta.roles)
            ? meta.roles.filter(Boolean)
            : [];
          if (!roles.length) return;

          let assignUserId: string | null = null;

          if (meta.isStart) {
            // start step: dùng main assignee
            assignUserId = mainAssigneeId;
          } else {
            const key = deriveWorkflowGroupKey(meta);
            if (key && workflowAssignmentMap[key]) {
              assignUserId = workflowAssignmentMap[key]!;
            }
          }

          items.push({
            name: meta.name,
            workflowStatusId: statusId,
            assignUserId,
          });
        });

        workflowAssignmentsPayload = items;
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
          (model as any).sourceTaskId  ?? null,
        description,
      };

      if (workflowAssignmentsPayload && workflowAssignmentsPayload.length) {
        payload.workflowAssignments = workflowAssignmentsPayload;
      }

      const raw = await putTask(model.id, payload);
      const dto: any = raw?.data ?? raw ?? {};
      if (dto && dto.id) {
        // nếu muốn sync lại model từ BE thì có thể merge ở đây
        // setModel((prev) => ({ ...prev, ...dto }));
      }
      console.log(payload);
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
          {/* STATUS AREA */}
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

                {nextStatusIdByFlow && !activeMeta.isFinal && nextMetaByFlow && (
  <button
    type="button"
    onClick={handleQuickNext}
    disabled={changingStatus || !isAllowedStatus(nextStatusIdByFlow)}
    className={cn(
      "h-8 px-3 rounded-full border text-[11px] font-medium inline-flex items-center gap-1 bg-blue-50/80 border-blue-300 text-blue-700 hover:bg-blue-100",
      (changingStatus || !isAllowedStatus(nextStatusIdByFlow)) && "opacity-60 cursor-not-allowed"
    )}
  >
    Next: {nextMetaByFlow.name ?? "Next"}
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

            {/* Panel chọn status */}
            {statusPickerOpen && statusList.length > 0 && (
              <div className="mt-3 rounded-2xl border border-slate-100 bg-white/80 p-3 max-h-64 overflow-y-auto space-y-1.5">
             {statusList.map((st: any, idx: number) => {
  const isCurrent = st.id === activeStatusId;
  const isTarget = !!draftStatusId && draftStatusId === st.id && !isCurrent;

  const allowed = isAllowedStatus(st.id);
  const disabled = !allowed || changingStatus;
  const hint = transitionHints[st.id]; // chỉ có nếu allowedTargets chứa st.id

  const category = (st.category || "").toUpperCase();

  // highlight row giống sprint: xanh = success, đỏ = failure, optional = xanh nhạt (dashed)
  const hintRowClass =
    !isCurrent && !isTarget && !disabled && hint?.kind === "success"
      ? "border-emerald-300 bg-emerald-50/70"
      : !isCurrent && !isTarget && !disabled && hint?.kind === "failure"
      ? "border-rose-300 bg-rose-50/70"
      : !isCurrent && !isTarget && !disabled && hint?.kind === "optional"
      ? "border-emerald-200 bg-emerald-50/40 border-dashed"
      : "";

  const hintChipClass =
    hint?.kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : hint?.kind === "failure"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : hint?.kind === "optional"
      ? "border-emerald-200 bg-emerald-50/40 text-emerald-700"
      : "";

  return (
    <button
      key={st.id}
      type="button"
      disabled={disabled} // ✅ disable thật
      onClick={() => handleStatusClick(st.id)}
      className={cn(
        "w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 border transition",
        // disabled state
        disabled && !isCurrent
          ? "bg-slate-50 text-slate-400 border-slate-200 opacity-70 cursor-not-allowed"
          : isCurrent
          ? "bg-slate-900 text-white border-slate-900"
          : isTarget
          ? "bg-blue-50 text-slate-900 border-blue-300 shadow-sm"
          : hintRowClass
          ? hintRowClass
          : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
      )}
      title={
        disabled && !isCurrent
          ? "Not allowed by workflow transitions"
          : undefined
      }
    >
      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold",
          isCurrent
            ? "bg-slate-800 text-white"
            : disabled
            ? "bg-white/70 text-slate-400"
            : "bg-white/80 text-slate-800"
        )}
      >
        {idx + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold truncate">{st.name}</span>

          {isCurrent && (
            <span className="text-[10px] text-slate-300">(current)</span>
          )}

          {isTarget && (
            <span className="text-[10px] font-medium text-blue-700">(next)</span>
          )}

          {/* ✅ chip highlight (xanh/đỏ) giống sprint */}
          {!isCurrent && !disabled && hint && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium",
                hintChipClass
              )}
            >
              {hint.labels?.[0] ?? (hint.kind === "success" ? "Success" : "Rework")}
            </span>
          )}

          {/* (optional) show Not allowed */}
          {disabled && !isCurrent && (
            <span className="text-[10px] text-slate-400">(disabled)</span>
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

      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white/60">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            isCurrent
              ? "bg-slate-900"
              : isTarget
              ? "bg-blue-600"
              : !disabled && hint?.kind === "success"
              ? "bg-emerald-600"
              : !disabled && hint?.kind === "failure"
              ? "bg-rose-600"
              : "bg-transparent"
          )}
        />
      </div>
    </button>
  );
})}


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
              className={cn(
    "w-full min-h-[140px] resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
    !canEditDetail && "bg-slate-50 text-slate-400 cursor-not-allowed"
  )}
  readOnly={!canEditDetail}
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
              <Can code='TASK_CHECKLIST_ADD'>
              <button
                type="button"
                onClick={startAddChecklistItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Plus className="w-3 h-3" />
                Add item
              </button>
              </Can>
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
                          <Can code='TASK_CHECKLIST_DELETE'>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklist(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          </Can>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ATTACHMENTS (TASK LEVEL) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-900">
                Attachments
              </div>
              <div className="text-[11px] text-slate-500">
                Images, documents, video…
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
<Can code='TASK_ADD_ATTACHMENT'>
            <div
              className={cn(
                "border border-dashed rounded-xl p-4 text-center text-sm text-slate-500 transition-colors",
                "border-slate-300 bg-slate-50/40",
                isDragging && "bg-blue-50 border-blue-400"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Paperclip className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              Drag & drop files here or{" "}
              <button
                type="button"
                className="text-blue-600 font-medium underline-offset-2 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
              .
              {uploadingAttachments && (
                <div className="mt-1 text-[11px] text-slate-400">
                  Uploading…
                </div>
              )}
            </div>
</Can>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] font-medium text-blue-700 hover:underline truncate"
                        >
                          {a.fileName}
                        </a>
                        <div className="text-[10px] text-slate-500 truncate">
                          {formatBytes(a.size)}{" "}
                          {a.contentType ? `• ${a.contentType}` : ""}
                          {a.uploadedByName
                            ? ` • by ${a.uploadedByName}`
                            : ""}
                          {a.uploadedAt
                            ? ` • ${fmtDateTime(a.uploadedAt)}`
                            : ""}
                        </div>
                        {a.description && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {a.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 ml-2">
                      <button
                        type="button"
                        onClick={() => window.open(a.url, "_blank")}
                        className="text-[11px] hover:text-blue-700"
                      >
                        Open
                      </button>
                      <Can code='TASK_DELETE_ATTACHMENT'>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachmentClick(a.id)}
                        className="p-1 rounded-full hover:bg-red-50 hover:text-red-600"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMMENTS & ACTIVITY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-2">
              Comments & activity
            </div>

            {/* hidden input cho file comment */}
            <input
              ref={commentFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleCommentFileChange}
            />

            {/* Composer */}
            <div className="mb-3 space-y-2">
              <div className="flex items-start gap-2">
                <textarea
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  placeholder="Write a comment or update… (Ctrl+Enter to send)"
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => commentFileInputRef.current?.click()}
                    className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    title="Attach files"
                  >
                    <Paperclip className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={isSendingComment}
                    className={cn(
                      "h-9 w-9 rounded-xl border border-blue-600 bg-blue-600 text-white text-sm inline-flex items-center justify-center hover:bg-blue-700",
                      isSendingComment && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* preview file đang chuẩn bị gửi */}
              {newCommentFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-1">
                  {newCommentFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-600"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span className="max-w-[160px] truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCommentFile(idx)}
                        className="ml-1 text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List comments */}
            <div className="max-h-60 overflow-auto space-y-2 text-sm">
              {comments.map((c) => {
                const member = c.authorId
                  ? projectMembers.find((m) => m.id === c.authorId)
                  : null;
                const avatarUrl = member?.avatarUrl ?? c.authorAvatarUrl ?? null;
                const displayName = member?.name ?? c.author;
                const subtitle =
                  member?.roleName ?? member?.email ?? undefined;

                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      {/* avatar */}
                      <div className="mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-600 overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (displayName?.[0] || "?").toUpperCase()
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-700 truncate">
                              {displayName}
                            </div>
                            {subtitle && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {subtitle}
                              </div>
                            )}
                          </div>
                          <span className="ml-2 shrink-0">
                            {fmtDateTime(c.createdAt)}
                          </span>
                        </div>

                        <div className="text-sm text-slate-700 whitespace-pre-line mt-1">
                          {c.message}
                        </div>

                        {c.attachments && c.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {c.attachments.map((a, idx) => {
                              const isImage =
                                (a.contentType ?? "").startsWith("image/") ||
                                /\.(png|jpe?g|gif|webp|svg)$/i.test(
                                  a.fileName ?? ""
                                );
                              return (
                                <a
                                  key={`${a.id}-${idx}`}
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    "group inline-flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50",
                                    isImage
                                      ? "max-h-32"
                                      : "px-2 py-1 items-center"
                                  )}
                                >
                                  {isImage ? (
                                    <img
                                      src={a.url}
                                      alt={a.fileName}
                                      className="max-h-32 w-auto object-cover block"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                      <Paperclip className="w-3 h-3" />
                                      <span className="max-w-[160px] truncate">
                                        {a.fileName}
                                      </span>
                                    </div>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <div className="text-[11px] text-slate-400">
                  No comments yet. Be the first to comment on this ticket.
                </div>
              )}
            </div>
            <div className="mt-4">
  <TaskAuditLogList taskId={model.id} compact />
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

            {/* Assignee = main owner at start */}
            <Field label="Assignee">
              <div className="space-y-1">
                <UserAssignDropdown
  users={projectMembers}
  value={primaryAssignee?.id ?? null}
  disabled={!canEditAssign}   
  onChange={(id) => {
    if (!canEditAssign) return; 
    if (!id) {
      updateField("assignees", [] as any);
      return;
    }
    const u = projectMembers.find((m) => m.id === id);
    if (!u) return;

    const mem: MemberRef = {
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl ?? undefined,
      email: u.email ?? undefined,
    } as any;

    updateField("assignees", [mem] as any);
  }}
  placeholder={loadingMembers ? "Loading members…" : "Unassigned"}
/>

                {startWorkflowGroups.length > 0 && (
                  <div className="text-[10px] text-slate-400">
                    Main assignee is used for start workflow
                    {startWorkflowGroups.length > 1 ? "s" : ""}:{" "}
                    <span className="font-medium">
                      {startWorkflowGroups.map((g) => g.label).join(", ")}
                    </span>
                    .
                  </div>
                )}
              </div>
            </Field>

            {/* Workflow assignments – gom theo workflow, KHÔNG tách theo role */}
            {nonStartWorkflowGroups.length > 0 && (
              <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
                <div className="text-[11px] text-slate-500 mb-2">
                  Workflow owners for this ticket
                </div>
                <div className="space-y-2">
                  {nonStartWorkflowGroups.map((group) => {
                    const assignedId = workflowAssignmentMap[group.key] ?? null;

                    return (
                      <div
                        key={group.key}
                        className="rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-700">
                              {group.label}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {group.statuses.map((st) => (
                                <span
                                  key={st.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] bg-blue-50 border-blue-200 text-blue-700"
                                >
                                  {st.name}
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
                           <UserAssignDropdown
  users={projectMembers}
  value={assignedId}
  disabled={!canEditAssign}  
  onChange={(val) => {
    if (!canEditAssign) return; 
    setWorkflowAssignmentMap((prev) => ({
      ...prev,
      [group.key]: val,
    }));
  }}
  placeholder={loadingMembers ? "Loading members…" : "Unassigned"}
/>

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
              <select  disabled={!canEditDetail} 
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
              <select  disabled={!canEditDetail} 
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.type}
                onChange={(e) => updateField("type", e.target.value as any)}
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
                <input  disabled={!canEditDetail} 
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.storyPoints ?? 0}
                  onChange={(e) =>
                    updateField(
                      "storyPoints",
                      (Number(e.target.value) || 0) as any
                    )
                  }
                />
              </Field>
              <Field label="Estimate (h)">
                <input  disabled={!canEditDetail} 
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.estimateHours ?? 0}
                  onChange={(e) =>
                    updateField(
                      "estimateHours",
                      (Number(e.target.value) || 0) as any
                    )
                  }
                />
              </Field>
            </div>

            {/* Remaining & severity */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field className="hidden" label="Remaining (h)">
                <input  disabled={!canEditDetail} 
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.remainingHours ?? 0}
                  onChange={(e) =>
                    updateField(
                      "remainingHours",
                      (Number(e.target.value) || 0) as any
                    )
                  }
                />
              </Field>
              <Field label="Severity">
                <select  disabled={!canEditDetail} 
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  value={(model.severity as any) ?? "Medium"}
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
                <input disabled={!canEditDetail} 
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={toInputDate(model.openedAt as any)}
                  onChange={(e) =>
                    updateField(
                      "openedAt",
                      fromInputDate(e.target.value) as any
                    )
                  }
                />
              </Field>
              <Field label="Due date">
                <input disabled={!canEditDetail} 
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={toInputDate(model.dueDate as any)}
                  onChange={(e) =>
                    updateField(
                      "dueDate",
                      fromInputDate(e.target.value) as any
                    )
                  }
                />
              </Field>
            </div>

            {/* Sprint */}
            <Field label="Sprint" className="mt-3">
              <select disabled={!canEditSprint}
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.sprintId ?? ""}
                onChange={(e) =>
                  updateField("sprintId", (e.target.value || null) as any)
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
  disabled = false,
}: {
  users: ProjectMemberOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

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

  // nếu bị disabled thì đóng dropdown luôn
  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  // click outside để đóng
  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        className={cn(
          "h-9 w-full rounded-xl border border-slate-300 px-3 text-sm bg-white flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
          !disabled && "hover:border-blue-400 hover:bg-slate-50",
          disabled && "bg-slate-50 text-slate-400 cursor-not-allowed opacity-70"
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

        <ChevronDownIcon
          className={cn(
            "w-4 h-4 shrink-0",
            disabled ? "text-slate-300" : "text-slate-400"
          )}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              className="w-full h-8 rounded-xl border border-slate-200 px-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Search member by name, email, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch("");
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
                      (u.name?.[0] || "?").toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{u.name}</div>
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


function mapAttachmentDto(x: any, idx: number = 0): AttachmentItem {
  return {
    id: String(
      x.id ?? x.attachmentId ?? x.taskAttachmentId ?? x.key ?? `att-${idx + 1}`
    ),
    fileName: x.fileName ?? x.name ?? `Attachment-${idx + 1}`,
    url: x.url ?? x.link ?? "#",
    contentType: x.contentType ?? x.mimeType ?? null,
    size: x.size ?? x.sizeBytes ?? null,
    description: x.description ?? null,
    uploadedAt: x.uploadedAt ?? x.createdAt ?? x.created_at ?? null,
    uploadedByName:
      x.uploadedByName ?? x.createdByName ?? x.uploaderName ?? null,
  };
}

function mapCommentDto(x: any, idx: number = 0): CommentItem {
  const rawAtt =
    x.attachments ?? x.files ?? x.fileResponses ?? x.commentAttachments ?? [];

  const atts: AttachmentItem[] = Array.isArray(rawAtt)
    ? rawAtt.map((a: any, i: number) => mapAttachmentDto(a, i))
    : [];

  const createdAt =
    x.createAt ??
    x.createdAt ??
    x.time ??
    x.created_at ??
    x.updatedAt ??
    new Date().toISOString();

  return {
    id: String(x.id ?? x.commentId ?? x.activityId ?? idx),
    author:
      x.authorName ??
      x.createdByName ??
      x.userName ??
      x.author ??
      "System",
    authorId: x.authorId ?? x.createdById ?? x.userId ?? null,
    authorAvatarUrl: x.authorAvatar ?? x.authorAvatarUrl ?? x.avatarUrl ?? null,
    createdAt,
    message: String(x.body ?? x.message ?? x.content ?? x.note ?? ""),
    attachments: atts,
    isSystem: !!x.isSystem,
  };
}

function formatBytes(bytes?: number | null): string {
  const n = typeof bytes === "number" ? bytes : 0;
  if (!n) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  const val = n / Math.pow(k, i);
  const fixed = val >= 100 ? 0 : val >= 10 ? 1 : 2;
  return `${val.toFixed(fixed)} ${sizes[i]}`;
}

/** Lấy key workflow group: ưu tiên key của workflow, fallback theo combination roles */
function deriveWorkflowGroupKey(meta: any): string {
  if (!meta) return "";
  const roles: string[] = Array.isArray(meta.roles)
    ? meta.roles.filter(Boolean)
    : [];

  const rolesKey =
    roles.length > 0
      ? `roles:${roles
          .slice()
          .sort()
          .join("|")}`
      : "";

  const directKey =
    meta.workflowKey ||
    meta.workflowCode ||
    meta.workflowGroupKey ||
    meta.groupKey ||
    meta.laneKey ||
    meta.groupId;

  const fallback =
    meta.id || meta.code || (meta.name ? `status:${meta.name}` : "");

  return String(directKey || rolesKey || fallback || "");
}

/** Label hiển thị cho workflow group: ưu tiên workflowName, nếu không thì join roles -> "Qa / Reviewer" */
function deriveWorkflowGroupLabel(meta: any): string {
  if (!meta) return "Workflow";

  const roles: string[] = Array.isArray(meta.roles)
    ? meta.roles.filter(Boolean)
    : [];

  const directLabel =
    meta.workflowName ||
    meta.workflowLabel ||
    meta.groupName ||
    meta.laneName;

  if (directLabel) return String(directLabel);

  if (roles.length) {
    return roles
      .slice()
      .sort()
      .map((rk) =>
        String(rk)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      )
      .join(" / ");
  }

  return String(meta.name || "Workflow");
}
