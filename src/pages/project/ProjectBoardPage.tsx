/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { DropResult } from "@hello-pangea/dnd";
import {
  Info,
  FileText,
  TicketIcon,
  Workflow as WorkflowIcon,
  LayoutGrid,
  Flag,
  ListChecks,
  Wrench,
  Boxes,
  Search,
  X,
  ChevronDown,
  Check,
  Building2,
  CalendarDays,
  Users2,
  Lock,
  Activity,
} from "lucide-react";

import {
  ProjectBoardProvider,
  useProjectBoard,
} from "@/context/ProjectBoardContext";

import KanbanBySprintBoard from "@/components/Company/Projects/KanbanBySprintBoard";
import SprintBoard from "@/components/Company/Projects/SprintBoard";
import ProjectTaskList from "@/components/Company/Projects/ProjectTaskList";

import WorkflowPreviewModal from "@/components/Workflow/WorkflowPreviewModal";

import type { StatusCategory, SprintVm, TaskVm, ComponentVm } from "@/types/projectBoard";
import { checkProjectAccess, GetProjectByProjectId } from "@/services/projectService.js";

import { normalizeBoardInput } from "@/mappers/projectBoardMapper";
import { fetchSprintBoard } from "@/services/projectBoardService.js";
import TicketPopup from "@/components/ProjectSideCompanyRequest/TicketPopup";
import type { JSX } from "@fullcalendar/core/preact.js";
import { getProjectMemberByProjectId } from "@/services/projectMember.js";

import {
  createTaskQuick,
  deleteTask,
  materializeDraftTask,
} from "@/services/taskService.js";
import { Can } from "@/permission/PermissionProvider";

const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s,
  );

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const toBool = (v: any) =>
  v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";

const extractComponentsFromProjectDetail = (detail: any): ComponentVm[] => {
  const list =
    detail?.maintenanceComponents ??
    detail?.components ??
    detail?.projectComponents ??
    detail?.maintenanceComponentResponses ??
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((c: any) => ({
      id: String(c?.id ?? c?.componentId ?? c?.name ?? ""),
      name: String(c?.name ?? c?.componentName ?? "Component"),
      description: c?.note ?? c?.description ?? null,
      createdAt: c?.createdAt ?? null,
      createdBy: c?.createdBy ?? null,
    }))
    .filter((x: any) => !!x.name);
};

const taskComponentId = (t: TaskVm) => String((t as any)?.componentId ?? "");
const taskComponentName = (t: TaskVm) => String((t as any)?.componentName ?? "");
type ProjectMetaVm = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;

  status?: string;
  isHired?: boolean;
  isClosed?: boolean;

  companyName?: string;
  companyHiredName?: string | null;

  workflowName?: string | null;

  startDate?: string | null;
  endDate?: string | null;
  sprintLengthWeeks?: number | null;

  createdByName?: string | null;
  createdAt?: string | null;
    memberCount?: number | null;

};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

const statusLabel = (s?: string | null) => {
  const v = String(s ?? "").trim();
  if (!v) return "—";
  if (v === "InProgress") return "In progress";
  if (v === "OnHold") return "On hold";
  return v;
};

const statusBadgeClass = (status?: string | null) => {
  switch (String(status ?? "")) {
    case "Planned":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "InProgress":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "OnHold":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const isDoneTask = (t: any) => {
  const cat = String(t?.statusCategory ?? t?.status?.category ?? "").toUpperCase();
  const name = String(t?.statusName ?? t?.status ?? "").toLowerCase();
  return cat === "DONE" || name === "done";
};

const progressPercent = (done: number, total: number) => {
  if (!total) return 0;
  return Math.round((done / total) * 100);
};

const isSprintActive = (s: any) => {
  const st = String(s?.state ?? s?.status ?? s?.sprintState ?? "").toLowerCase();
  return st === "active" || st === "inprogress" || st === "running";
};

/* ========== Inner: logic view board ========== */
function Inner(props: { componentsFromBoard?: ComponentVm[]; memberCountFromOuter?: number }) {
  const {
    sprints,
    tasks,
    loading,
    changeStatus,
    moveToNextSprint,
    reorder,
    done,
    split,
    reloadBoard,
  } = useProjectBoard();

  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const effectiveProjectId = projectId || (window as any).__projectId;
  const { companyId } = useParams<{ companyId: string }>();

  const viewTabs: { id: "Kanban" | "Sprint" | "List"; label: string; icon: JSX.Element }[] =
    [
      { id: "Kanban", label: "Board", icon: <LayoutGrid className="size-3.5" /> },
      { id: "Sprint", label: "Sprint Insights", icon: <Flag className="size-3.5" /> },
      { id: "List", label: "List", icon: <ListChecks className="size-3.5" /> },
    ];

  const [projectRequestId, setProjectRequestId] =
    React.useState<string | null>(null);
  const hasProjectRequest = !!projectRequestId;

  const [view, setView] = React.useState<"Kanban" | "Sprint" | "List">("Sprint");
  const [query, setQuery] = React.useState("");
  const [kanbanFilter, setKanbanFilter] =
    React.useState<"ALL" | StatusCategory>("ALL");

  const [openTicketPopup, setOpenTicketPopup] = useState(false);

  const [projectTitle, setProjectTitle] = React.useState<string>("Project board");
  const [workflowId, setWorkflowId] = React.useState<string | null>(null);
  const [workflowPreviewOpen, setWorkflowPreviewOpen] = React.useState(false);
  const [projectDescription, setProjectDescription] = React.useState<string>("");
  const [meta, setMeta] = React.useState<ProjectMetaVm | null>(null);

  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [components, setComponents] = React.useState<ComponentVm[]>(props.componentsFromBoard ?? []);
  const [selectedComponents, setSelectedComponents] = React.useState<string[]>([]);

  const [componentMenuOpen, setComponentMenuOpen] = React.useState(false);
  const componentMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!componentMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      const el = componentMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setComponentMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setComponentMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [componentMenuOpen]);

  // Load meta project + maintenance components (detail)
  React.useEffect(() => {
    let alive = true;

    (async () => {
      if (!projectId) return;
      try {
        const detailRaw: any = await GetProjectByProjectId(projectId);
        const detail: any = detailRaw?.data ?? detailRaw ?? {};
        if (!alive) return;

        setProjectTitle(detail.name ?? detail.code ?? "Project board");
        setProjectDescription(detail.description ?? "");
        setWorkflowId(detail.workflowId ? String(detail.workflowId) : null);
        setProjectRequestId(detail.projectRequestId ? String(detail.projectRequestId) : null);
        setMeta({
          id: String(detail?.id ?? projectId),
          code: detail?.code ?? "",
          name: detail?.name ?? "",
          description: detail?.description ?? "",

          status: detail?.status ?? null,
          isHired: !!detail?.isHired,
          isClosed: !!detail?.isClosed,

          companyName:
            detail?.companyName ??
            detail?.companyExecutorName ??
            detail?.ownerCompany ??
            detail?.company ??
            "",
memberCount:
  detail?.memberCount ??
  detail?.totalMembers ??
  detail?.membersCount ??
  detail?.memberTotal ??
  (Array.isArray(detail?.members) ? detail.members.length : null) ??
  props.memberCountFromOuter ??
  null,

          companyHiredName: detail?.companyHiredName ?? detail?.hiredCompanyName ?? null,

          workflowName: detail?.workflowName ?? detail?.workflow ?? null,

          startDate: detail?.startDate ?? null,
          endDate: detail?.endDate ?? null,
          sprintLengthWeeks: detail?.sprintLengthWeeks ?? null,

          createdByName:
            detail?.createdByName ??
            detail?.createdByUserName ??
            detail?.createdByDisplayName ??
            null,
          createdAt: detail?.createdAt ?? detail?.createAt ?? detail?.createdOn ?? null,
          
        });

        const maint = toBool(
          detail?.isMaintenance ??
          detail?.isMaintenace ??
          detail?.is_maintenance ??
          false
        );
        setIsMaintenance(maint);

        const compsFromDetail = extractComponentsFromProjectDetail(detail);
        if (compsFromDetail.length) setComponents(compsFromDetail);
      } catch (err) {
        console.error("Load project meta failed", err);
        if (!alive) return;
        setProjectTitle("Project board");
        setProjectDescription("");
        setWorkflowId(null);
        setProjectRequestId(null);
        setIsMaintenance(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId]);

  // Nếu board load có components mà detail chưa có → fill
  React.useEffect(() => {
    const fromBoard = props.componentsFromBoard ?? [];
    if (!components.length && fromBoard.length) setComponents(fromBoard);
  }, [props.componentsFromBoard, components.length]);

  // ========= Drag handlers (giữ nguyên) =========
  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const [, sprintIdSrc, statusIdSrc] = source.droppableId.split(":");
    const [, sprintIdDst, statusIdDst] = destination.droppableId.split(":");

    if (sprintIdSrc !== sprintIdDst) return;
    if (statusIdSrc === statusIdDst && source.index === destination.index) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t)
      await reorder(
        (window as any).__projectId,
        sprintIdDst,
        t,
        statusIdDst,
        destination.index,
      );
  };

  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const [, fromSprintId] = source.droppableId.split(":");
    const [, toSprintId] = destination.droppableId.split(":");
    if (fromSprintId === toSprintId) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t && effectiveProjectId) {
      await moveToNextSprint(effectiveProjectId, t, toSprintId);
    }
  };

  // ✅ Maintenance filter helpers
  const maintenanceEnabled = isMaintenance || (components?.length ?? 0) > 0;

  const compIndex = React.useMemo(() => {
    const idToName = new Map<string, string>();
    const nameToId = new Map<string, string>();
    for (const c of components ?? []) {
      const id = String(c?.id ?? "");
      const name = String(c?.name ?? "");
      if (id) idToName.set(id, name);
      if (name && id && isGuid(id)) nameToId.set(name, id);
    }
    return { idToName, nameToId };
  }, [components]);

  const compCounts = React.useMemo(() => {
    const map = new Map<string, number>(); // key = componentId or componentName
    let unassigned = 0;

    for (const t of tasks) {
      const cid = taskComponentId(t);
      const cname = taskComponentName(t);
      if (cid) {
        map.set(cid, (map.get(cid) ?? 0) + 1);
        continue;
      }
      if (cname) {
        map.set(cname, (map.get(cname) ?? 0) + 1);
        continue;
      }
      unassigned++;
    }

    return { map, unassigned };
  }, [tasks]);

  const componentOptions = React.useMemo(() => {
    const list = (components ?? []).map((c) => {
      const rawId = String(c?.id ?? "");
      const key = rawId ? rawId : String(c?.name ?? ""); // key dùng cho filter
      const name = String(c?.name ?? "Component");
      const description = String(c?.description ?? "");
      const count =
        (rawId ? compCounts.map.get(rawId) ?? 0 : 0) +
        (name ? compCounts.map.get(name) ?? 0 : 0);

      return { key, id: rawId, name, description, count };
    });

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [components, compCounts.map]);

  const matchComponent = React.useCallback(
    (t: TaskVm) => {
      if (!maintenanceEnabled) return true;
      if (!selectedComponents.length) return true;

      const cid = taskComponentId(t);
      const cname = taskComponentName(t);

      if (!cid && !cname) return selectedComponents.includes("__UNASSIGNED__");

      for (const sel of selectedComponents) {
        if (sel === "__UNASSIGNED__") continue;

        if (cid && sel === cid) return true;
        if (cname && sel === cname) return true;

        if (!cid && cname && isGuid(sel)) {
          const nm = compIndex.idToName.get(sel);
          if (nm && nm === cname) return true;
        }

        if (cid && !cname && !isGuid(sel)) {
          const nm = compIndex.idToName.get(cid);
          if (nm && nm === sel) return true;
        }
      }

      return false;
    },
    [maintenanceEnabled, selectedComponents, compIndex.idToName],
  );

  const tasksByComponent = React.useMemo(() => {
    if (!maintenanceEnabled) return tasks;
    if (!selectedComponents.length) return tasks;
    return tasks.filter(matchComponent);
  }, [tasks, maintenanceEnabled, selectedComponents, matchComponent]);

  const sprintsForView = React.useMemo(() => {
    if (!maintenanceEnabled || !selectedComponents.length) return sprints;

    const allowed = new Set(tasksByComponent.map((t) => t.id));

    return (sprints ?? []).map((sp) => {
      const cols: any = {};
      const order = sp.statusOrder ?? [];
      for (const stId of order) {
        const arr = (sp.columns?.[stId] ?? []) as TaskVm[];
        cols[stId] = arr.filter((t) => allowed.has(t.id));
      }
      return { ...sp, columns: cols };
    });
  }, [sprints, maintenanceEnabled, selectedComponents.length, tasksByComponent]);

  const selectedInfoLabel = React.useMemo(() => {
    if (!maintenanceEnabled) return "";
    if (!selectedComponents.length) return "All components";

    const names = selectedComponents
      .map((k) => {
        if (k === "__UNASSIGNED__") return "Unassigned";
        const opt = componentOptions.find((x) => x.key === k);
        if (opt?.name) return opt.name;
        if (isGuid(k)) return compIndex.idToName.get(k) ?? k;
        return k;
      })
      .slice(0, 2);

    const more = selectedComponents.length > 2 ? ` +${selectedComponents.length - 2}` : "";
    return `${names.join(", ")}${more}`;
  }, [maintenanceEnabled, selectedComponents, componentOptions, compIndex.idToName]);

  const clearComponents = () => setSelectedComponents([]);

  // ✅ Pro UX:
  // - normal click = single select (professional, simple)
  // - Ctrl/⌘ click = multi toggle (power-user)
  const selectComponentSmart = (key: string, e?: React.MouseEvent) => {
    const multi = !!(e && (e.ctrlKey || e.metaKey));
    setSelectedComponents((prev) => {
      if (multi) {
        const set = new Set(prev);
        if (set.has(key)) set.delete(key);
        else set.add(key);
        return Array.from(set);
      }
      // single-select behavior
      if (prev.length === 1 && prev[0] === key) return [];
      return [key];
    });
  };

  const isSelected = (key: string) => selectedComponents.includes(key);

  // ✅ Auto componentId when creating tasks (if exactly 1 selected component)
  const autoComponentId = React.useMemo(() => {
    if (!maintenanceEnabled) return null;
    const chosen = selectedComponents.filter((x) => x !== "__UNASSIGNED__");
    if (chosen.length !== 1) return null;

    const k = chosen[0];
    if (isGuid(k)) return k;

    const id = compIndex.nameToId.get(k);
    return id && isGuid(id) ? id : null;
  }, [maintenanceEnabled, selectedComponents, compIndex.nameToId]);

  // ===== SAVE BOARD (Update mode) – giữ nguyên + add componentId =====
  const handleSaveBoard = async (payload: {
    moves: DropResult[];
    deletions: TaskVm[];
    draftBySprint: Record<string, TaskVm[]>;
  }) => {
    if (!effectiveProjectId) return;

    const { moves, deletions, draftBySprint } = payload;

    const newDraftTasks: { sprintId: string; task: TaskVm }[] = [];
    Object.entries(draftBySprint).forEach(([sprintId, list]) => {
      (list ?? []).forEach((t) => {
        if (!isGuid(t.id)) newDraftTasks.push({ sprintId, task: t });
      });
    });

    const localIds = new Set(newDraftTasks.map((x) => x.task.id));

    for (const { sprintId, task } of newDraftTasks) {
      if (deletions.some((d) => d.id === task.id)) continue;

      const backlogDraftId =
        (task as any).backlogDraftId ?? (task as any).backlog_draft_id ?? null;

      try {
        if (backlogDraftId) {
          await materializeDraftTask(backlogDraftId, {
            sprintId,
            workflowStatusId: task.workflowStatusId ?? null,
            statusCode: (task as any).statusCode ?? null,
            orderInSprint: null,
            assigneeIds: (task.assignees ?? []).map((a) => a.id),
            ...(autoComponentId ? { componentId: autoComponentId } : {}),
          });
        } else {
          await createTaskQuick(effectiveProjectId, {
            title: task.title,
            sprintId,
            workflowStatusId: task.workflowStatusId ?? null,
            statusCode: (task as any).statusCode ?? null,
            type: task.type ?? "Feature",
            priority: task.priority ?? "Medium",
            severity: task.severity ?? null,
            storyPoints: (task as any).storyPoints ?? null,
            estimateHours: task.estimateHours ?? null,
            dueDate: (task as any).dueDate ?? null,
            parentTaskId: task.parentTaskId ?? null,
            sourceTaskId: (task as any).sourceTicketId ?? null,
            assigneeIds: (task.assignees ?? []).map((a) => a.id),
            ...(autoComponentId ? { componentId: autoComponentId } : {}),
          });
        }
      } catch (err) {
        console.error("[ProjectBoard] create/materialize draft failed", err);
      }
    }

    for (const mv of moves) {
      if (!mv.draggableId) continue;
      if (localIds.has(mv.draggableId)) continue;
      await onDragEndKanban(mv);
    }

    for (const t of deletions) {
      if (!isGuid(t.id)) continue;
      try {
        await deleteTask(t.id);
      } catch (err) {
        console.error("[ProjectBoard] delete task failed", err);
      }
    }

    await reloadBoard();
  };

  // Nghiệp vụ theo workflow động
  const eventApi = {
    onMarkDone: async (t: TaskVm) => {
      if (!effectiveProjectId) return;
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const finalId =
        sp.statusOrder.find((id) => sp.statusMeta[id]?.isFinal) ??
        sp.statusOrder[sp.statusOrder.length - 1];
      if (t.workflowStatusId !== finalId) {
        return changeStatus(effectiveProjectId, t, finalId);
      }
      return done(effectiveProjectId, t);
    },
    onNext: async (t: TaskVm) => {
      if (!effectiveProjectId) return;
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const idx = sp.statusOrder.indexOf(t.workflowStatusId);
      const nextId =
        sp.statusOrder[Math.min(idx + 1, sp.statusOrder.length - 1)];
      if (nextId && nextId !== t.workflowStatusId) {
        return changeStatus(effectiveProjectId, t, nextId);
      }
    },
    onSplit: (t: TaskVm) => {
      if (!effectiveProjectId) return;
      return split(effectiveProjectId, t);
    },
    onMoveNext: (t: TaskVm) => {
      if (!effectiveProjectId) return;
      const idx = sprints.findIndex((s) => s.id === (t.sprintId ?? ""));
      const next = sprints[idx + 1];
      if (next) return moveToNextSprint(effectiveProjectId, t, next.id);
    },
  };

  const listTasks = React.useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return tasksByComponent;
    return tasksByComponent.filter((t) =>
      `${t.code} ${t.title}`.toLowerCase().includes(k),
    );
  }, [tasksByComponent, query]);

  return (
    <div className="w-full min-h-screen bg-50 overflow-x-hidden">
      
      {/* HEADER (giữ nguyên gradient cũ) */}
      <div className="relative mx-4 mt-4 mb-2 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 px-8 py-5 text-white border border-blue-300/40">
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.7),transparent_60%)]" />
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
<div className="space-y-2 w-full md:max-w-[760px]">
    {!!meta?.code?.trim() && meta.code?.trim() !== projectTitle?.trim() && (
      <span className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-mono font-semibold text-white/95">
        {meta.code}
      </span>
    )}
  <div className="flex flex-wrap items-center gap-2">
    <h1 className="text-2xl font-semibold leading-tight">
      {projectTitle}
    </h1>

    

    {maintenanceEnabled && (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-[11px] font-semibold">
        <Wrench className="size-3.5" />
        Maintenance
      </span>
    )}

    {loading && (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
        Loading…
      </span>
    )}
  </div>

  <p className="text-sm text-white/85 line-clamp-2">
    {projectDescription?.trim()
      ? projectDescription
      : "Connect sprints, tickets and workflows into one unified project board."}
  </p>

  {/* ✅ Minimal details (đúng yêu cầu) */}
  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/90">
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1">
      <CalendarDays className="size-4 opacity-90" />
      <span className="text-white/80">Created</span>
      <b className="text-white">{formatDate(meta?.createdAt)}</b>
    </span>

    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1">
      <CalendarDays className="size-4 opacity-90" />
      <span className="text-white/80">Due</span>
      <b className="text-white">{formatDate(meta?.endDate)}</b>
    </span>

    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1">
      <Users2 className="size-4 opacity-90" />
      <span className="text-white/80">Members</span>
      <b className="text-white">
        {typeof meta?.memberCount === "number" ? meta.memberCount : "—"}
      </b>
    </span>

    {/* Maintenance info (giữ nhưng gọn lại, cùng style chip) */}
    {maintenanceEnabled && (
      <>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1">
          <Boxes className="size-4 opacity-90" />
          <span className="text-white/80">Components</span>
          <b className="text-white">{components.length}</b>
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1">
          <span className="text-white/80">Filter</span>
          <b className="text-white">{selectedInfoLabel}</b>
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1">
          <span className="text-white/80">Showing</span>
          <b className="text-white">{tasksByComponent.length}</b>
          <span className="text-white/75">/ {tasks.length}</span>
        </span>
      </>
    )}
  </div>
</div>


          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
            {hasProjectRequest && (
              <Can code="PROJECT_TICKET_LIST_REQUESTER">
                <button
                  type="button"
                  onClick={() => setOpenTicketPopup(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-white/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <TicketIcon className="size-4" />
                  <span>Tickets</span>
                </button>
              </Can>
            )}

            {workflowId && (
              <button
                type="button"
                onClick={() => setWorkflowPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                title="View workflow"
              >
                <WorkflowIcon className="size-3.5" />
                <span className="hidden sm:inline">Workflow</span>
              </button>
            )}

            {hasProjectRequest && companyId && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => {
                  navigate(
                    `/company/${companyId}/project-request/${projectRequestId}`,
                    { state: { viewMode: "AsExecutor" } },
                  );
                }}
              >
                <FileText className="size-3.5" />
                <span className="hidden sm:inline">Project Request</span>
              </button>
            )}

            {companyId && projectId && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() =>
                  navigate(`/companies/${companyId}/project/${projectId}/detail`)
                }
              >
                <Info className="size-3.5" />
                <span className="hidden sm:inline">Detail</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB BAR (giữ nguyên, chỉ thêm dropdown filter component bên phải) */}
      <div className="border-b border-slate-200 bg-white/90 flex justify-between">
        <nav className="flex gap-6 px-8 text-sm font-medium">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`inline-flex items-center gap-1 pb-2 pt-3 border-b-2 transition-colors ${
                view === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="self-center flex items-center gap-2 pr-4">
          {maintenanceEnabled && (
            <div className="relative" ref={componentMenuRef}>
              <button
                type="button"
                onClick={() => setComponentMenuOpen((p) => !p)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                  componentMenuOpen
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                title="Filter by component"
              >
                <Boxes className="size-4" />
                <span className="max-w-[220px] truncate">
                  Component: {selectedInfoLabel}
                </span>
                <ChevronDown className="size-4 opacity-70" />
              </button>

              {componentMenuOpen && (
                <div className="absolute right-0 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-900">
                      Filter by component
                    </div>
              
                  </div>

                  <div className="max-h-[320px] overflow-auto py-1">
                    {/* All */}
                    <button
                      type="button"
                      onClick={() => setSelectedComponents([])}
                      className={cn(
                        "w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50",
                        selectedComponents.length === 0 ? "bg-slate-50" : "",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center justify-center size-5 rounded-md border",
                          selectedComponents.length === 0 ? "border-blue-300 bg-blue-50" : "border-slate-200"
                        )}>
                          {selectedComponents.length === 0 && <Check className="size-3 text-blue-600" />}
                        </span>
                        <div className="text-sm font-medium text-slate-800">All components</div>
                      </div>
                      <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                        {tasks.length}
                      </span>
                    </button>

                    {/* Unassigned */}
                    <button
                      type="button"
                      onClick={(e) => selectComponentSmart("__UNASSIGNED__", e)}
                      className={cn(
                        "w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50",
                        isSelected("__UNASSIGNED__") ? "bg-slate-50" : "",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center justify-center size-5 rounded-md border",
                          isSelected("__UNASSIGNED__") ? "border-blue-300 bg-blue-50" : "border-slate-200"
                        )}>
                          {isSelected("__UNASSIGNED__") && <Check className="size-3 text-blue-600" />}
                        </span>
                        <div className="text-sm font-medium text-slate-800">Unassigned</div>
                      </div>
                      <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                        {compCounts.unassigned}
                      </span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Components list */}
                    {componentOptions.map((c) => {
                      const active = isSelected(c.key);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={(e) => selectComponentSmart(c.key, e)}
                          className={cn(
                            "w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50",
                            active ? "bg-slate-50" : "",
                            c.count === 0 && !active ? "opacity-60" : "",
                          )}
                          title={c.description || c.name}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "inline-flex items-center justify-center size-5 rounded-md border flex-none",
                              active ? "border-blue-300 bg-blue-50" : "border-slate-200"
                            )}>
                              {active && <Check className="size-3 text-blue-600" />}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {c.name}
                              </div>
                              {!!c.description?.trim() && (
                                <div className="text-[11px] text-slate-500 truncate">
                                  {c.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            {c.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      Showing <b className="text-slate-700">{tasksByComponent.length}</b> / {tasks.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={clearComponents}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <X className="size-4" />
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setComponentMenuOpen(false)}
                        className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-800"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SLA tooltip icon (giữ nguyên) */}
          <span className="relative inline-flex group">
            <button
              type="button"
              className="inline-flex items-center justify-center w-5 h-5 rounded-full
                         border border-slate-300 bg-slate-100 text-slate-700 text-[11px] font-extrabold leading-none
                         hover:bg-slate-200 hover:border-slate-400 hover:text-slate-800 transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              aria-label="SLA policies"
            >
              !
            </button>

            <div
              className="
                pointer-events-none absolute right-0 top-7 z-50
                w-[330px] rounded-xl border border-slate-200 bg-white text-slate-800
                shadow-[0_18px_45px_rgba(15,23,42,0.18)]
                p-3 text-[11px] leading-5
                opacity-0 translate-y-1
                group-hover:opacity-100 group-hover:translate-y-0
                transition duration-150
              "
            >
              <div className="font-semibold text-[12px] mb-1">SLA policies</div>
              <div className="space-y-1">
                <div><span className="font-semibold">Bug</span> — Urgent: 24h · High: 48h · Medium: 72h</div>
                <div><span className="font-semibold">Feature</span> — Urgent: 72h · High: 120h · Medium: 168h · Low: 336h</div>
                <div><span className="font-semibold">Chore</span> — Low: 336h</div>
              </div>
            </div>
          </span>
        </div>
      </div>

      {/* WRAPPER */}
      <section>
        <div className="rounded-3xl border border-slate-200/80 bg-50/90 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          {/* List header with search (giữ nguyên) */}
          {view === "List" && (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="h-10 w-[320px] rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                {query && (
                  <button
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => setQuery("")}
                  >
                    <X className="size-4" />
                    Clear
                  </button>
                )}
              </div>

              {maintenanceEnabled && (
                <div className="text-sm text-slate-600">
                  Component filter: <b>{selectedInfoLabel}</b> · Showing{" "}
                  <b>{listTasks.length}</b> task(s)
                </div>
              )}
            </div>
          )}

          <div className="mt-1">
            {view === "Kanban" && (
              <KanbanBySprintBoard
                sprints={sprintsForView}
                filterCategory={kanbanFilter}
                onDragEnd={onDragEndKanban}
                onSaveBoard={handleSaveBoard}
                onReloadBoard={reloadBoard}
                 maintenanceEnabled={maintenanceEnabled}
    components={components}                 
    defaultComponentId={autoComponentId} 
                {...eventApi}
              />
            )}

          {view === "Sprint" && (
  <SprintBoard
    sprints={sprintsForView}
    tasks={tasksByComponent}
    onDragEnd={onDragEndSprint}
    maintenanceEnabled={maintenanceEnabled}
    components={components}
    defaultComponentId={autoComponentId}
    {...eventApi}
  />
)}
            {view === "List" && (
              <ProjectTaskList tasks={listTasks} {...eventApi} />
            )}
          </div>
        </div>
      </section>

      {hasProjectRequest && (
        <TicketPopup
          visible={openTicketPopup}
          projectId={projectId}
          onClose={() => setOpenTicketPopup(false)}
        />
      )}

      {workflowPreviewOpen && workflowId && (
        <WorkflowPreviewModal
          open={workflowPreviewOpen}
          workflowId={workflowId}
          onClose={() => setWorkflowPreviewOpen(false)}
        />
      )}
    </div>
  );
}

/* ========== Page: load từ BE ========== */
export default function ProjectBoardPage() {
  const { projectId = "project-1", companyId } = useParams<{ projectId: string; companyId?: string }>();
  (window as any).__projectId = projectId;

  const [init, setInit] = React.useState<{ sprints: SprintVm[]; tasks: TaskVm[]; components: ComponentVm[];  memberCount?: number | null;} | null>(null);

  React.useEffect(() => {
    let dead = false;

    const qs = new URLSearchParams(window.location.search);
    const rawReturn = qs.get("return");

    const returnUrl =
      rawReturn && rawReturn.startsWith("/")
        ? rawReturn
        : companyId
          ? `/companies/${companyId}/project`
          : `/`;

    const detailUrl =
      companyId
        ? `/companies/${companyId}/project/${projectId}/closue`
        : returnUrl;

    const toastError = (msg: string) => {
      const t: any = (globalThis as any).toast || (window as any).toast;
      if (t?.error) t.error(msg);
      else console.warn("[toast missing]", msg);
    };

    const go = (url: string) => {
      window.location.replace(url);
    };

    const kickOutWithToast = (msg: string) => {
      toastError(msg);
      setTimeout(() => go(returnUrl), 600);
    };

    (async () => {
      try {
        const access: any = await checkProjectAccess(projectId);

        const isCreator = !!(
          access?.isCreator ??
          access?.isOwner ??
          access?.isProjectOwner ??
          access?.isCreatedByMe ??
          access?.isProjectCreator
        );

        const isClosed = !!access?.isClosed;
        const notMember = access?.isMember === false || access?.canAccess === false;

        if (isClosed) {
          if (isCreator) return go(detailUrl);
          return kickOutWithToast("Project đã đóng.");
        }

        if (notMember) {
          if (isCreator) return go(detailUrl);
          return kickOutWithToast("You not in project.");
        }

          const [boardRes, detailRaw, memberPaged] = await Promise.all([
      fetchSprintBoard(projectId),
      GetProjectByProjectId(projectId).catch(() => null),
        getProjectMemberByProjectId(projectId, "", "", "", 1, 1).catch(() => null), 

    ]);

    const normalized: any = normalizeBoardInput(boardRes ?? {});
    const detail: any = (detailRaw as any)?.data ?? detailRaw ?? {};

    const compsFromDetail = extractComponentsFromProjectDetail(detail);
    const compsFromBoard = Array.isArray(normalized?.components) ? normalized.components : [];
    const mergedComponents = compsFromDetail.length ? compsFromDetail : compsFromBoard;

    const maint = toBool(
      detail?.isMaintenance ??
        detail?.isMaintenace ??
        detail?.is_maintenance ??
        normalized?.isMaintenance ??
        normalized?.project?.isMaintenance ??
        false,
    );
const mp: any = (memberPaged as any)?.data ?? memberPaged ?? {};
const memberCount =
  mp?.totalCount ??
  mp?.total ??
  mp?.totalItems ??
  mp?.totalRecords ??
  mp?.pagination?.totalCount ??
  mp?.pageInfo?.totalItems ??
  (Array.isArray(mp?.items) ? mp.items.length : null) ??
  null;
    const maintenanceEnabled = maint || mergedComponents.length > 0;

    const sprintsWithIsMain = (normalized?.sprints ?? []).map((sp: any) => ({
      ...sp,
      isMain: maintenanceEnabled,
    }));

    if (!dead) {
      setInit({
        sprints: sprintsWithIsMain,
        tasks: normalized?.tasks ?? [],
        components: mergedComponents,
        memberCount,
      });
    }
      } catch (err) {
        console.error("Failed to check access/load sprint board", err);
        if (!dead) setInit({ sprints: [], tasks: [], components: [] });
      }
    })();

    return () => {
      dead = true;
    };
  }, [projectId, companyId]);

  if (!init) {
    return <div className="p-8 text-sm text-gray-600">Loading board…</div>;
  }

  return (
    <ProjectBoardProvider key={projectId} projectId={projectId} initialData={init as any}>
<Inner componentsFromBoard={init.components} memberCountFromOuter={init.memberCount} />
    </ProjectBoardProvider>
  );
}