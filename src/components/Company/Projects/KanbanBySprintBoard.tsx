// src/components/Company/Projects/KanbanBySprintBoard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
} from "@hello-pangea/dnd";
import { Edit3, Trash2, Plus, X } from "lucide-react";

import TaskCard from "@/components/Company/Projects/TaskCard";
import type {
  SprintVm,
  TaskVm,
  StatusCategory,
  MemberRef,
} from "@/types/projectBoard";
import ColumnHoverCreate from "../Task/ColumnHoverCreate";
import { useNavigate, useParams } from "react-router-dom";
import AiGenerateTasksModal from "@/components/AiGenerate/AiGenerateTasksModal";
import { createSprint } from "@/services/sprintService.js";
import { toast } from "react-toastify";
import Lottie from "lottie-react";
import aiLoadingAnimation from "@/assets/lottie/meta-ai-loading.json";
import QuickDraftPool, {
  type QuickDraft,
  type QuickDraftPriority,
  type QuickDraftType,
} from "@/components/Company/Projects/QuickDraftPool";
import {
  getDraftTasks,
  materializeDraftTask,
} from "@/services/taskService.js";
import TaskFilterBar, { type SimpleOption } from "./TaskFilterBar";
import { Can, usePermissions } from "@/permission/PermissionProvider";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s,
  );

const prettyStatusCategory = (cat?: string | null) => {
  if (!cat) return "";
  const u = cat.toUpperCase();
  if (u === "TODO") return "To do";
  if (u === "IN_PROGRESS") return "In progress";
  if (u === "REVIEW") return "In review";
  if (u === "DONE") return "Done";
  return cat
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const PRIORITY_OPTIONS: SimpleOption[] = [
  { value: "ALL", label: "All priority" },
  { value: "Urgent", label: "Urgent" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const formatSprintDate = (value?: string | Date | null) => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

/* ===== CSS-inject: animations & effects (mount once) ===== */
function useFuseKanbanStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("fuse-kanban-style")) return;

    const css = `
@keyframes fusePillIn {
  0% { transform: translateY(4px) scale(.96); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes fuseSheen {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes fuseDropGlow {
  0% { box-shadow: inset 0 0 0 0 rgba(46,139,255,.28); }
  100% { box-shadow: inset 0 0 0 2px rgba(46,139,255,.28); }
}
@keyframes fuseCardShrinkOut {
  0% { transform: scale(1); opacity: 1; max-height: 200px; }
  100% { transform: scale(.9); opacity: 0; max-height: 0; margin-bottom: 0; }
}

@keyframes fuseCardPopIn {
  0% {
    transform: translateY(10px) scale(.97);
    opacity: 0;
  }
  60% {
    transform: translateY(0) scale(1.02);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.fuse-pill {
  display:inline-flex; align-items:center;
  font-weight:600; font-size:12px;
  border-radius:9999px; padding:2px 8px;
  background:${brand}; color:#fff;
  animation:fusePillIn .42s cubic-bezier(.2,.8,.2,1);
  transition: background-color .35s ease, color .35s ease, transform .2s ease;
}
.fuse-pill:hover { background:#ffffff; color:${brand}; transform: translateY(-1px); }
.fuse-pill--sheen {
  position:relative; overflow:hidden; isolation:isolate;
}
.fuse-pill--sheen::after {
  content:""; position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(100deg, transparent 0%, rgba(255,255,255,.65) 12%, transparent 24%);
  transform: translateX(-120%);
}
.group:hover .fuse-pill--sheen::after {
  animation: fuseSheen 1.2s ease forwards;
}

.fuse-dropzone { transition: background-color .2s ease, box-shadow .2s ease; }
.fuse-dropzone.is-over {
  background: radial-gradient(600px 120px at center top, rgba(46,139,255,.08), transparent 70%);
  animation: fuseDropGlow .18s ease-out forwards;
}

.fuse-progress { height:6px; background:#eef2f7; border-radius:9999px; overflow:hidden; }
.fuse-progress > i { display:block; height:100%; background:${brand}; transition: width .45s cubic-bezier(.2,.8,.2,1); }

.fuse-card-removing {
  animation: fuseCardShrinkOut .18s cubic-bezier(.2,.8,.3,1) forwards;
}

.fuse-card-enter {
  animation: fuseCardPopIn .32s cubic-bezier(.2,.8,.2,1);
}
`;
    const el = document.createElement("style");
    el.id = "fuse-kanban-style";
    el.textContent = css;
    document.head.appendChild(el);
  }, []);
}


/* === helpers === */

const flattenSprintTasks = (
  s: SprintVm,
  filter: "ALL" | StatusCategory = "ALL",
): TaskVm[] => {
  const order = s.statusOrder ?? Object.keys(s.columns ?? {});
  const out: TaskVm[] = [];

  for (const stId of order) {
    const arr = (s.columns?.[stId] as TaskVm[]) ?? [];
    const withStatus = arr.map((t) => ({
      ...t,
      workflowStatusId: t.workflowStatusId ?? stId,
    }));

    out.push(
      ...(filter === "ALL"
        ? withStatus
        : withStatus.filter((t) => t.statusCategory === filter)),
    );
  }
  return out;
};

const computeSprintStatsFromTasks = (allTasks: TaskVm[]) => {
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.statusCategory === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, pct };
};

const getSprintIdFromDroppable = (id: string): string | null => {
  if (!id) return null;
  if (id.startsWith("spr:")) return id.slice(4);
  return id;
};

const normalizePriority = (raw: any): any => {
  const k = String(raw ?? "Medium").toLowerCase();
  if (k === "urgent") return "Urgent";
  if (k === "high") return "High";
  if (k === "medium") return "Medium";
  if (k === "low") return "Low";
  return "Medium";
};

/* ===== Column shell ===== */
const BoardColumn = ({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-gray-200 bg-white overflow-hidden ring-1 ring-blue-200 h-full flex flex-col group",
    )}
    style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)", background: "#f8f8f8" }}
  >
    <div className="h-2 w-full" style={{ backgroundColor: brand }} />

    <div className="p-4 pb-3 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="fuse-pill fuse-pill--sheen">{title}</span>
        {subtitle && (
          <span className="text-[11px] text-slate-600 font-medium">{subtitle}</span>
        )}
      </div>
      {right}
    </div>

    <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
  </div>
);

type Props = {
  sprints: SprintVm[];
  filterCategory?: "ALL" | StatusCategory;
  onDragEnd: (r: DropResult) => void;
  onMarkDone?: (t: TaskVm) => void;
  onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void;
  onMoveNext?: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
  onDeleteTask?: (t: TaskVm) => Promise<void> | void;
  onSaveBoard?: (payload: {
    moves: DropResult[];
    deletions: TaskVm[];
    draftBySprint: Record<string, TaskVm[]>;
  }) => Promise<void> | void;
  onReloadBoard?: () => void | Promise<void>;
  onDropDraftToSprint?: (args: {
    draft: QuickDraft;
    sprintId: string;
    destinationIndex: number;
  }) => Promise<void | TaskVm> | void;
};

// type AiDraft = {
//   title: string;
//   description?: string | null;
//   type?: TaskVm["type"];
//   priority?: string | null;
//   severity?: string | null;
//   sprintId?: string | null;
//   sprintName?: string | null;
//   statusCategory?: string | null;
//   statusCode?: string | null;
//   estimateHours?: number | null;
//   storyPoints?: number | null;
//   dueDate?: string | null;
//   module?: string | null;
//   checklist?: string[] | null;
// };

const mapDraftDtoToQuickDraft = (dto: any): QuickDraft => {
  if (!dto) {
    return {
      id: "",
      title: "",
      type: "Feature",
      priority: "Medium",
      estimateHours: null,
      createdAt: new Date().toISOString(),
    };
  }

  const rawType = String(dto.type ?? dto.taskType ?? "Feature").toLowerCase();
  let type: QuickDraftType = "Feature";
  if (rawType.includes("bug")) type = "Bug";
  else if (rawType.includes("chore") || rawType.includes("task")) type = "Chore";

  const rawPrio = String(dto.priority ?? "Medium").toLowerCase();
  let priority: QuickDraftPriority = "Medium";
  if (rawPrio === "urgent") priority = "Urgent";
  else if (rawPrio === "high") priority = "High";
  else if (rawPrio === "low") priority = "Low";

  const estimate =
    typeof dto.estimateHours === "number"
      ? dto.estimateHours
      : typeof dto.estimate_hours === "number"
      ? dto.estimate_hours
      : null;

  const createdAt =
    dto.createdAt ??
    dto.created_at ??
    dto.createdDate ??
    dto.createdOn ??
    new Date().toISOString();

  const ticketId =
    dto.ticketId ?? dto.ticket_id ?? dto.sourceTicketId ?? dto.source_ticket_id ?? null;

  const ticketCode =
    dto.ticketCode ??
    dto.ticket_code ??
    dto.sourceTicketCode ??
    dto.source_ticket_code ??
    dto.ticket?.code ??
    null;

  return {
    id: String(dto.id ?? dto.taskId),
    title: dto.title ?? "",
    type,
    priority,
    estimateHours: estimate,
    createdAt,
    ticketId,
    ticketCode,
  };
};

export default function KanbanBySprintBoard({
  sprints,
  filterCategory = "ALL",
  onDragEnd,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  onOpenTicket,
  onDeleteTask,
  onSaveBoard,
  onReloadBoard,
  onDropDraftToSprint,
}: Props) {
  useFuseKanbanStyles();

  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);
  const [bumpedOrder, setBumpedOrder] = useState<Record<string, number>>({});
  const bumpSeqRef = React.useRef(0);

  const [kw, setKw] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "ALL">(
    filterCategory ?? "ALL",
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueFrom, setDueFrom] = useState<string | null>(null);
  const [dueTo, setDueTo] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
const { can, loading: permLoading } = usePermissions();
const canMoveSprint = !permLoading && can("TASK_MOVE_SPRINT");

  const hasAnyFilterActive =
    kw.trim() !== "" ||
    statusFilter !== "ALL" ||
    assigneeIds.length > 0 ||
    priorityFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    tagFilter !== "ALL" ||
    dueFrom !== null ||
    dueTo !== null;

  const bumpTask = React.useCallback((taskId?: string | null) => {
    if (!taskId) return;
    setBumpedOrder((prev) => ({
      ...prev,
      [taskId]: (bumpSeqRef.current += 1),
    }));
  }, []);

  const [updateMode, setUpdateMode] = useState(false);
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});
  const [draftTasksBySprint, setDraftTasksBySprint] = useState<
    Record<string, TaskVm[]> | null
  >(null);
  const [baseTaskIdsBySprint, setBaseTaskIdsBySprint] = useState<
  Record<string, Set<string>>
>({});
  const [aiNewIds, setAiNewIds] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const keys = Object.keys(aiNewIds);
    if (!keys.length) return;

    const timer = setTimeout(() => {
      setAiNewIds({});
    }, 8000); // sau 8s thì tắt highlight AI

    return () => clearTimeout(timer);
  }, [aiNewIds]);
  const [stagedMoves, setStagedMoves] = useState<DropResult[]>([]);
  const [stagedDeletes, setStagedDeletes] = useState<TaskVm[]>([]);
  const [saving, setSaving] = useState(false);

  const hasAiDrafts =
    draftTasksBySprint != null &&
    Object.values(draftTasksBySprint).some((list) =>
      (list ?? []).some((t) => !isGuid(t.id) || (t as any).isAiDraft),
    );

  const hasStagedChanges =
    stagedMoves.length > 0 || stagedDeletes.length > 0 || hasAiDrafts;

  useEffect(() => {
    if (!updateMode) {
      setStatusFilter(filterCategory ?? "ALL");
    }
  }, [filterCategory, updateMode]);

  const [enteringIds, setEnteringIds] = useState<Record<string, number>>({});
  const prevTaskIdsRef = React.useRef<Set<string>>(new Set());
  const firstRenderRef = React.useRef(true);

  useEffect(() => {
    if (!flashTaskId) return;
    const t = setTimeout(() => setFlashTaskId(null), 900);
    return () => clearTimeout(t);
  }, [flashTaskId]);

  useEffect(() => {
    setBumpedOrder((prev) => {
      if (!Object.keys(prev).length) return prev;

      const existing = new Set<string>();

      if (updateMode && draftTasksBySprint) {
        Object.values(draftTasksBySprint).forEach((list) => {
          (list ?? []).forEach((t) => {
            if (t?.id) existing.add(t.id);
          });
        });
      } else {
        sprints.forEach((sp) => {
          flattenSprintTasks(sp, "ALL").forEach((t) => {
            if (t?.id) existing.add(t.id);
          });
        });
      }

      let changed = false;
      const next: Record<string, number> = {};
      for (const [id, val] of Object.entries(prev)) {
        if (existing.has(id)) {
          next[id] = val;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sprints, updateMode, draftTasksBySprint]);

  useEffect(() => {
    const current = new Set<string>();

    if (updateMode && draftTasksBySprint) {
      Object.values(draftTasksBySprint).forEach((list) => {
        (list ?? []).forEach((t) => {
          if (t?.id) current.add(t.id);
        });
      });
    } else {
      for (const sp of sprints) {
        const order = sp.statusOrder ?? Object.keys(sp.columns ?? {});
        for (const stId of order) {
          const arr = (sp.columns?.[stId] as TaskVm[]) ?? [];
          arr.forEach((t) => {
            if (t?.id) current.add(t.id);
          });
        }
      }
    }

    const prevSet = prevTaskIdsRef.current;

    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      prevSet.clear();
      current.forEach((id) => prevSet.add(id));
      return;
    }

    const newIds: string[] = [];
    current.forEach((id) => {
      if (!prevSet.has(id)) newIds.push(id);
    });

    prevTaskIdsRef.current = current;

    if (!newIds.length) return;

    setEnteringIds((prev) => {
      const next: Record<string, number> = { ...prev };
      newIds.forEach((id, idx) => {
        if (next[id] == null) {
          next[id] = idx;
        }
      });
      return next;
    });

    const timeout = setTimeout(() => {
      setEnteringIds((prev) => {
        const copy: Record<string, number> = { ...prev };
        newIds.forEach((id) => {
          delete copy[id];
        });
        return copy;
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [sprints, draftTasksBySprint, updateMode]);

  const isRemoving = (id: string) => !!removingIds[id];

  const TOP_OFFSET = 220;
  const BOARD_H = `calc(100vh - ${TOP_OFFSET}px)`;
  const COL_W =
    "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
  const noop = () => {};
  const _onMarkDone = onMarkDone ?? noop;
  const _onNext = onNext ?? noop;
  const _onSplit = onSplit ?? noop;
  const _onMoveNext = onMoveNext ?? noop;

  const { companyId, projectId } = useParams();
  const navigate = useNavigate();

  const handleOpenTicket = React.useCallback(
    (taskId: string) => {
      if (onOpenTicket) {
        onOpenTicket(taskId);
        return;
      }
      if (!companyId || !projectId) return;
      navigate(`/companies/${companyId}/project/${projectId}/task/${taskId}`);
    },
    [onOpenTicket, navigate, companyId, projectId],
  );

  const handleOpenBacklogTicket = React.useCallback(
    (ticketId: string) => {
      if (onOpenTicket) {
        onOpenTicket(ticketId);
        return;
      }
      if (!companyId || !projectId) return;
      navigate(`/companies/${companyId}/project/${projectId}/tickets/${ticketId}`);
    },
    [onOpenTicket, navigate, companyId, projectId],
  );

  const [aiOpen, setAiOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

    const [deleteTask, setDeleteTask] = useState<TaskVm | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const openCreateSprintModal = () => {
    const defaultName = `Sprint ${sprints.length + 1}`;
    setNewSprintName(defaultName);
    setCreateError(null);
    setCreateSprintOpen(true);
  };
  const [optimisticAiBySprint, setOptimisticAiBySprint] = React.useState<
    Record<string, TaskVm[]>
  >({});
  const aiTimersRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    return () => {
      aiTimersRef.current.forEach((id) => window.clearTimeout(id));
      aiTimersRef.current = [];
    };
  }, []);

  const viewSprints = React.useMemo(() => {
    if (!Object.keys(optimisticAiBySprint).length) return sprints;

    return sprints.map((sp) => {
      const extra = optimisticAiBySprint[sp.id] ?? [];
      if (!extra.length) return sp;

      const cols: Record<string, TaskVm[]> = { ...(sp.columns ?? {}) };

      for (const t of extra) {
        const stId =
          t.workflowStatusId ??
          sp.statusOrder?.[0] ??
          Object.keys(cols)[0];

        if (!stId) continue;

        const arr = Array.isArray(cols[stId]) ? [...cols[stId]] : [];
        if (!arr.some((x) => x.id === t.id)) arr.unshift(t);
        cols[stId] = arr;
      }

      return { ...sp, columns: cols };
    });
  }, [sprints, optimisticAiBySprint]);
  const closeCreateSprintModal = () => {
    if (creatingSprint) return;
    setCreateSprintOpen(false);
    setCreateError(null);
  };
const enqueueAiTasks = React.useCallback(
  (tasks: TaskVm[], sprintOrder?: string[]) => {
    const list = (tasks ?? []).filter((t) => t?.id && t?.sprintId);

    if (sprintOrder?.length) {
      const idxMap = new Map(sprintOrder.map((id, i) => [id, i]));
      list.sort((a, b) => (idxMap.get(a.sprintId!) ?? 9999) - (idxMap.get(b.sprintId!) ?? 9999));
    }

    aiTimersRef.current.forEach((id) => window.clearTimeout(id));
    aiTimersRef.current = [];

    const STEP_MS = 450; 

    list.forEach((t, i) => {
      const timerId = window.setTimeout(() => {
        // add optimistic
        setOptimisticAiBySprint((prev) => {
          const sid = t.sprintId!;
          const curr = prev[sid] ?? [];
          if (curr.some((x) => x.id === t.id)) return prev;
          return { ...prev, [sid]: [t, ...curr] };
        });

        // highlight AI + pop like new task
        setAiNewIds((prev) => ({ ...prev, [t.id]: true }));
        setFlashTaskId(t.id);
        bumpTask(t.id);
      }, i * STEP_MS);

      aiTimersRef.current.push(timerId);
    });
  },
  [bumpTask],
);

  const handleSubmitCreateSprint = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!projectId) return;

    const name = newSprintName.trim();
    if (!name) {
      setCreateError("Sprint name is required.");
      return;
    }

    try {
      setCreatingSprint(true);
      setCreateError(null);

      await createSprint({
        projectId,
        name,
      });

      toast.success("Created sprint successfully.");
      setCreateSprintOpen(false);

      if (onReloadBoard) {
        await onReloadBoard();
      }
    } catch (err: any) {
      console.error("[Kanban] create sprint failed", err);
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to create sprint!";
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreatingSprint(false);
    }
  };

  const allTasksFlat = React.useMemo(() => {
    const acc: TaskVm[] = [];
    for (const sp of sprints) {
      acc.push(...flattenSprintTasks(sp, "ALL"));
    }
    return acc;
  }, [sprints]);

  const workflowMetaBySprint = React.useMemo(() => {
    const result: Record<
      string,
      {
        id: string;
        code: string;
        name: string;
        category: string;
        isDone: boolean;
        order: number;
      }[]
    > = {};

    for (const sp of sprints) {
      const metaObj = (sp as any).statusMeta ?? {};
      const arr = Object.values(metaObj) as any[];

      result[sp.id] = arr
        .map((st, idx) => ({
          id: st.id,
          code: st.code,
          name: st.name,
          category: st.category,
          isDone: !!st.isFinal,
          order: typeof st.order === "number" ? st.order : idx,
        }))
        .sort((a, b) => a.order - b.order);
    }

    return result;
  }, [sprints]);

  const matchesFilters = React.useCallback(
    (t: TaskVm): boolean => {
      if (updateMode) return true;

      const k = kw.trim().toLowerCase();
      if (k) {
        const haystack = `${t.code ?? ""} ${t.title ?? ""}`.toLowerCase();
        if (!haystack.includes(k)) return false;
      }

      if (statusFilter !== "ALL") {
        let matched = false;

        if (t.workflowStatusId && t.workflowStatusId === statusFilter) {
          matched = true;
        } else {
          let cat = t.statusCategory as StatusCategory | null;

          if (t.workflowStatusId && t.sprintId) {
            const metaList = workflowMetaBySprint[t.sprintId] ?? [];
            const meta = metaList.find((st) => st.id === t.workflowStatusId);
            if (meta?.category) {
              cat = meta.category as StatusCategory;
            }
          }

          if (cat && cat === statusFilter) {
            matched = true;
          }
        }

        if (!matched) return false;
      }

      if (assigneeIds.length) {
        const has = (t.assignees ?? []).some((m) => assigneeIds.includes(m.id));
        if (!has) return false;
      }

      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
        return false;
      }

      if (severityFilter !== "ALL") {
        const sev = t.severity != null ? String(t.severity) : "";
        if (sev !== severityFilter) return false;
      }

      if (tagFilter !== "ALL") {
        const tags = (t as any).tags as string[] | undefined;
        if (!tags || !tags.includes(tagFilter)) return false;
      }

      if (dueFrom) {
        const fromMs = new Date(dueFrom).setHours(0, 0, 0, 0);
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate as any).getTime();
        if (d < fromMs) return false;
      }

      if (dueTo) {
        const toMs = new Date(dueTo).setHours(23, 59, 59, 999);
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate as any).getTime();
        if (d > toMs) return false;
      }

      return true;
    },
    [
      updateMode,
      kw,
      statusFilter,
      assigneeIds,
      priorityFilter,
      severityFilter,
      tagFilter,
      dueFrom,
      dueTo,
      workflowMetaBySprint,
    ],
  );

  const statusFilterOptions: SimpleOption[] = React.useMemo(() => {
    const byId = new Map<string, { label: string; order: number }>();

    Object.values(workflowMetaBySprint).forEach((list) => {
      list.forEach((st, idx) => {
        const id = st.id;
        if (!id) return;

        const order = typeof st.order === "number" ? st.order : idx;
        const label =
          st.name || st.code || prettyStatusCategory(st.category);

        const existing = byId.get(id);
        if (!existing || order < existing.order) {
          byId.set(id, { label, order });
        }
      });
    });

    return Array.from(byId.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, info]) => ({
        value: id,
        label: info.label,
      }));
  }, [workflowMetaBySprint]);

  const members: MemberRef[] = React.useMemo(() => {
    const map = new Map<string, MemberRef>();
    allTasksFlat.forEach((t) => {
      (t.assignees ?? []).forEach((m) => {
        if (!map.has(m.id)) map.set(m.id, m);
      });
    });
    return Array.from(map.values());
  }, [allTasksFlat]);

  const assigneeOptions: SimpleOption[] = React.useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.name,
      })),
    [members],
  );

  const severityOptions: SimpleOption[] = React.useMemo(() => {
    const set = new Set<string>();
    allTasksFlat.forEach((t) => {
      if (t.severity != null) set.add(String(t.severity));
    });
    const values = Array.from(set);
    return [
      { value: "ALL", label: "All severity" },
      ...values.map((v) => ({ value: v, label: v })),
    ];
  }, [allTasksFlat]);

  const tagOptions: SimpleOption[] = React.useMemo(() => {
    const set = new Set<string>();
    allTasksFlat.forEach((t) => {
      const tags = (t as any).tags as string[] | undefined;
      if (tags) tags.forEach((tg) => set.add(tg));
    });
    const values = Array.from(set);
    return [
      { value: "ALL", label: "All tags" },
      ...values.map((v) => ({ value: v, label: v })),
    ];
  }, [allTasksFlat]);

  const filteredGlobalCount = React.useMemo(() => {
    if (updateMode) return allTasksFlat.length;
    return allTasksFlat.filter(matchesFilters).length;
  }, [allTasksFlat, updateMode, matchesFilters]);

  // const resolveStatusForAiDraft = React.useCallback(
  //   (
  //     sprintId: string,
  //     draft: any,
  //   ): { statusCategory: StatusCategory; workflowStatusId?: string } => {
  //     const list = workflowMetaBySprint[sprintId] ?? [];

  //     if (!list.length) {
  //       return { statusCategory: "TODO", workflowStatusId: undefined };
  //     }

  //     const rawCode = String(draft.statusCode ?? draft.status_code ?? "").trim();
  //     const rawCat = String(
  //       draft.statusCategory ?? draft.status_category ?? "",
  //     )
  //       .trim()
  //       .toUpperCase();

  //     const statusMeta =
  //       (rawCode &&
  //         list.find(
  //           (st) =>
  //             st.code && st.code.toLowerCase() === rawCode.toLowerCase(),
  //         )) ||
  //       (rawCat &&
  //         list.find(
  //           (st) => st.category && st.category.toUpperCase() === rawCat,
  //         )) ||
  //       list.find((st) => !st.isDone) ||
  //       list[0];

  //     const statusCategory = (statusMeta?.category || "TODO") as StatusCategory;
  //     const workflowStatusId = statusMeta?.id;

  //     return { statusCategory, workflowStatusId };
  //   },
  //   [workflowMetaBySprint],
  // );

  /* ====== Update mode controls ====== */

  const enterUpdateMode = () => {
    if (hasAnyFilterActive) return;
    const draft: Record<string, TaskVm[]> = {};
    
    for (const sp of sprints) {
      draft[sp.id] = flattenSprintTasks(sp, "ALL");
    }
    setDraftTasksBySprint(draft);
    setStagedMoves([]);
    setStagedDeletes([]);
    setRemovingIds({});
    setUpdateMode(true);
  };

  const resetStaging = () => {
    setDraftTasksBySprint(null);
    setStagedMoves([]);
    setStagedDeletes([]);
    setRemovingIds({});
  };

  const cancelUpdateMode = () => {
    if (saving) return;
    resetStaging();
    setUpdateMode(false);
  };

  const handleSaveChanges = async () => {
    if (!updateMode || !hasStagedChanges) {
      cancelUpdateMode();
      return;
    }
    setSaving(true);
    try {
      if (onSaveBoard && draftTasksBySprint) {
        await onSaveBoard({
          moves: stagedMoves,
          deletions: stagedDeletes,
          draftBySprint: draftTasksBySprint,
        });
      } else {
        for (const mv of stagedMoves) {
          await onDragEnd(mv);
        }
        if (onDeleteTask) {
          for (const t of stagedDeletes) {
            await onDeleteTask(t);
          }
        }
      }
    } catch (err) {
      console.error("[Kanban] save board changes failed", err);
    } finally {
      setSaving(false);
      cancelUpdateMode();
    }
  };

  /* ====== Quick draft pool state ====== */

  const [quickDraftOpen, setQuickDraftOpen] = useState(false);
  const [quickDrafts, setQuickDrafts] = useState<QuickDraft[]>([]);
  const [draggingFromDraftPool, setDraggingFromDraftPool] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftsInitialized, setDraftsInitialized] = useState(false);

  const loadDraftTasks = React.useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingDrafts(true);

      const apiResult: any = await getDraftTasks(projectId, {
        pageSize: 100,
        sortColumn: "CreatedAt",
        sortDescending: true,
      });

      let items: any[] = [];
      if (Array.isArray(apiResult)) {
        items = apiResult;
      } else if (Array.isArray(apiResult.items)) {
        items = apiResult.items;
      } else if (Array.isArray(apiResult.data?.items)) {
        items = apiResult.data.items;
      }

      const mapped = items.map(mapDraftDtoToQuickDraft);
      setQuickDrafts(mapped);
      setDraftsInitialized(true);
    } catch (err) {
      console.error("[Kanban] load draft tasks failed", err);
      toast.error("Failed to load backlog tasks.");
    } finally {
      setLoadingDrafts(false);
    }
  }, [projectId]);

  const ensureDraftsLoaded = React.useCallback(() => {
    if (!draftsInitialized && !loadingDrafts) {
      void loadDraftTasks();
    }
  }, [draftsInitialized, loadingDrafts, loadDraftTasks]);

  useEffect(() => {
    if (quickDraftOpen) {
      ensureDraftsLoaded();
    }
  }, [quickDraftOpen, ensureDraftsLoaded]);

  /* ====== Helper: lấy tasks của 1 sprint ====== */

const getSprintTasks = React.useCallback(
  (s: SprintVm): { allTasks: TaskVm[]; tasks: TaskVm[] } => {
    const baseAll =
      updateMode && draftTasksBySprint
        ? draftTasksBySprint[s.id] ?? []
        : flattenSprintTasks(s, "ALL");

    // ✅ thêm optimistic tasks vào đầu list (unique theo id)
    const optimistic = optimisticAiBySprint[s.id] ?? [];
    const mergedAll = (() => {
      if (!optimistic.length) return baseAll;
      const seen = new Set<string>();
      const out: TaskVm[] = [];
      for (const t of [...optimistic, ...baseAll]) {
        if (!t?.id) continue;
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        out.push(t);
      }
      return out;
    })();

    let tasks = mergedAll;
    if (!updateMode) tasks = mergedAll.filter(matchesFilters);

    // ... giữ nguyên phần decorated sort của bạn
    // (bumpTask sẽ đẩy lên trên + giữ thứ tự ổn)
    if (tasks.length) {
      const decorated = tasks.map((t, idx) => {
        const isDraft =
          updateMode &&
          ((t as any).isLocalDraft ||
            (t as any).isAiDraft ||
            (t as any).backlogDraftId);

        return {
          t,
          idx,
          bump: bumpedOrder[t.id] ?? 0,
          isDraft,
        };
      });

      decorated.sort((a, b) => {
        if (a.isDraft !== b.isDraft) return a.isDraft ? -1 : 1;
        if (a.bump !== b.bump) return b.bump - a.bump;
        return a.idx - b.idx;
      });

      tasks = decorated.map((d) => d.t);
    }

    return { allTasks: mergedAll, tasks };
  },
  [updateMode, draftTasksBySprint, matchesFilters, bumpedOrder, optimisticAiBySprint],
);



  /* ====== Drag handlers ====== */

  const handleDragStartInternal = (start: DragStart) => {
    if (start.source.droppableId === "draftPool") {
      setDraggingFromDraftPool(true);
      setQuickDraftOpen(false);
    }
  };

  const handleDragEndInternal = (result: DropResult) => {
    setDraggingFromDraftPool(false);

    const { source, destination } = result;
    if (!destination) return;

    // 1) Kéo từ QuickDraftPool (BACKLOG)
    if (source.droppableId === "draftPool") {
      const sprintId = getSprintIdFromDroppable(destination.droppableId);
      if (!sprintId) return;

      const movedDraft = quickDrafts[source.index];
      if (!movedDraft) return;

      // ===== A. Trong UPDATE MODE: chỉ stage local, không gọi API =====
      if (updateMode) {
        const metaList = workflowMetaBySprint[sprintId] ?? [];
        const defaultStatus =
          metaList.find((st) => !st.isDone) || metaList[0] || null;
        const now = new Date().toISOString();

        const localId = `BL-${movedDraft.id}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`;

        const localTask: TaskVm & {
          isLocalDraft?: boolean;
          backlogDraftId?: string;
        } = {
          id: localId,
          code: movedDraft.ticketCode ?? "BACKLOG",
          title: movedDraft.title,
          type: movedDraft.type as any,
          priority: movedDraft.priority as any,
          storyPoints: 0,
          estimateHours: movedDraft.estimateHours ?? 0,
          remainingHours: movedDraft.estimateHours ?? 0,
          sprintId,
          workflowStatusId: defaultStatus?.id,
          statusCode: defaultStatus?.code ?? "todo",
          statusCategory: (defaultStatus?.category as any) ?? "TODO",
          StatusName: defaultStatus?.name ?? "",
          assignees: [],
          dependsOn: [],
          parentTaskId: null,
          carryOverCount: 0,
          openedAt: movedDraft.createdAt ?? now,
          createdAt: movedDraft.createdAt ?? now,
          updatedAt: now,
          sourceTicketId: movedDraft.ticketId ?? null,
          sourceTicketCode: movedDraft.ticketCode ?? "",
        };

        (localTask as any).isLocalDraft = true;
        (localTask as any).backlogDraftId = movedDraft.id;

        setDraftTasksBySprint((prev) => {
          const base = prev ?? {};
          const current = base[sprintId] ?? [];
          const nextList = [...current];
          const insertAt = Math.min(
            Math.max(destination.index, 0),
            nextList.length,
          );
          nextList.splice(insertAt, 0, localTask);
          return { ...base, [sprintId]: nextList };
        });

        setFlashTaskId(localTask.id);
        bumpTask(localTask.id);
        // backlog pool vẫn giữ nguyên, đến khi Save xong sẽ reload lại
        return;
      }

      // ===== B. Bình thường: materialize ngay (logic cũ) =====
      setQuickDrafts((prev) => prev.filter((_, idx) => idx !== source.index));

      void (async () => {
        let createdVm: TaskVm | null = null;

        try {
          if (onDropDraftToSprint) {
            const resultVm: any = await onDropDraftToSprint({
              draft: movedDraft,
              sprintId,
              destinationIndex: destination.index,
            });

            if (resultVm && resultVm.id) {
              createdVm = resultVm as TaskVm;
            }
          } else if (projectId) {
            const metaList = workflowMetaBySprint[sprintId] ?? [];
            const defaultStatus =
              metaList.find((st) => !st.isDone) || metaList[0] || null;

            createdVm = await materializeDraftTask(movedDraft.id, {
              sprintId,
              workflowStatusId: defaultStatus?.id ?? null,
              statusCode: defaultStatus?.code ?? null,
              orderInSprint: destination.index,
            });

            if (onReloadBoard) {
              await onReloadBoard();
            }
            await loadDraftTasks();
          } else {
            toast.error("Missing projectId – cannot materialize backlog task.");
            setQuickDrafts((prev) => {
              const clone = [...prev];
              clone.splice(source.index, 0, movedDraft);
              return clone;
            });
            return;
          }

          if (createdVm) {
            setFlashTaskId(createdVm.id);
            bumpTask(createdVm.id);

            if (updateMode && draftTasksBySprint) {
              setDraftTasksBySprint((prev) => {
                if (!prev) return prev;
                const current = prev[sprintId] ?? [];
                if (current.some((t) => t.id === createdVm!.id)) return prev;
                return { ...prev, [sprintId]: [...current, createdVm!] };
              });
            }

            toast.success("Moved backlog task into sprint.");
          }
        } catch (err: any) {
          console.error("[Kanban] materialize backlog task failed", err);
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to move backlog task into sprint.",
          );

          setQuickDrafts((prev) => {
            const clone = [...prev];
            clone.splice(source.index, 0, movedDraft);
            return clone;
          });
        }
      })();

      return;
    }

    // 2) Drag task trên board
    const fromSprintId = getSprintIdFromDroppable(source.droppableId);
    const toSprintId = getSprintIdFromDroppable(destination.droppableId);
    if (!fromSprintId || !toSprintId) return;
const isCrossSprint = fromSprintId !== toSprintId;
if (isCrossSprint && !canMoveSprint) {
  toast.error("You don't have permission to move tasks across sprints.");
  return; // không update state => task tự snap về chỗ cũ
}
    const fromSprint = sprints.find((sp) => sp.id === fromSprintId);
    if (fromSprint) {
      const { tasks: visibleTasks } = getSprintTasks(fromSprint);
      const moved = visibleTasks[source.index];
      if (moved) {
        bumpTask(moved.id);
      }
    }

    if (!updateMode || !draftTasksBySprint) {
      onDragEnd(result);
      return;
    }

    setDraftTasksBySprint((prev) => {
      if (!prev) return prev;
      const srcList = [...(prev[fromSprintId] ?? [])];
      if (!srcList.length) return prev;

      const [movedTask] = srcList.splice(source.index, 1);
      const destList =
        fromSprintId === toSprintId
          ? srcList
          : [...(prev[toSprintId] ?? [])];

      destList.splice(destination.index, 0, movedTask);

      return {
        ...prev,
        [fromSprintId]: fromSprintId === toSprintId ? destList : srcList,
        [toSprintId]: destList,
      };
    });

    setStagedMoves((prev) => [...prev, result]);
  };

   const handleRequestDelete = (task: TaskVm) => {
    if (!updateMode) return;
    setDeleteTask(task);
  };
  const confirmDeleteTask = () => {
    if (!updateMode || !deleteTask) {
      setDeleteTask(null);
      return;
    }

    const task = deleteTask;
    setDeleteBusy(true);
    setRemovingIds((prev) => ({ ...prev, [task.id]: true }));

    setTimeout(() => {
      setDraftTasksBySprint((prev) => {
        if (!prev) return prev;
        const next: Record<string, TaskVm[]> = { ...prev };

        for (const spId of Object.keys(next)) {
          const list = next[spId];
          const idx = list.findIndex((t) => t.id === task.id);
          if (idx >= 0) {
            const copy = [...list];
            copy.splice(idx, 1);
            next[spId] = copy;
            break;
          }
        }

        return next;
      });

      setStagedDeletes((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task],
      );

      setRemovingIds((prev) => {
        const clone = { ...prev };
        delete clone[task.id];
        return clone;
      });

      setDeleteBusy(false);
      setDeleteTask(null);
    }, 180);
  };

  const overlay =
    updateMode && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-30 pointer-events-none bg-slate-900/20 backdrop-blur-[2px] transition-opacity" />,
          document.body,
        )
      : null;

  const aiLoadingOverlay =
    aiGenerating && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48">
                <Lottie animationData={aiLoadingAnimation} loop autoplay />
              </div>
              <p className="text-sm font-medium text-white/90">
                AI is generating tasks…
              </p>
            </div>
          </div>,
          document.body,
        )
      : null;

  const handleAiGenerated = async (
    generatedTasks: TaskVm[],
    meta: { defaultSprintId: string; selectedSprintIds?: string[] },
  ) => {
    if (!Array.isArray(generatedTasks) || generatedTasks.length === 0) return;

    // Đánh dấu id để TaskCard show badge AI to hơn lần đầu
    setAiNewIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const t of generatedTasks) {
        if (t.id && isGuid(t.id)) {
          next[t.id] = true;
        }
      }
      return next;
    });

    resetStaging();
    setUpdateMode(false);
  enqueueAiTasks(generatedTasks, meta.selectedSprintIds);

const STEP_MS = 450;
const totalMs = Math.max(0, generatedTasks.length - 1) * STEP_MS + 600;

window.setTimeout(async () => {
  if (onReloadBoard) await onReloadBoard();
  setOptimisticAiBySprint({}); 
}, totalMs);
  };


const deleteConfirmModal =
    deleteTask && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[998] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Delete task
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    This will remove the task from this board in the current update session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !deleteBusy && setDeleteTask(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                  disabled={deleteBusy}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-600">
                  Are you sure you want to delete&nbsp;
                  <span className="font-semibold text-slate-900">
                    “{(deleteTask as any).code || deleteTask.title || "this task"}”
                  </span>
                  ?
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTask(null)}
                  disabled={deleteBusy}
                  className={cn(
                    "inline-flex items-center px-3 h-8 rounded-full border text-xs font-medium",
                    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                    deleteBusy && "opacity-60 cursor-not-allowed",
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTask}
                  disabled={deleteBusy}
                  className={cn(
                    "inline-flex items-center px-4 h-8 rounded-full border text-xs font-medium shadow-sm",
                    "border-red-600 bg-red-600 text-white hover:bg-red-700",
                    deleteBusy && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {deleteBusy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const createSprintModal =
    createSprintOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Create sprint
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Start / end dates will be auto-calculated based on the last
                    sprint in this project.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateSprintModal}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitCreateSprint} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sprint name
                  </label>
                  <input
                    type="text"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    placeholder="Sprint name"
                  />
                </div>

                {createError && (
                  <p className="text-xs text-red-500">{createError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateSprintModal}
                    disabled={creatingSprint}
                    className={cn(
                      "inline-flex items-center px-3 h-8 rounded-full border text-xs font-medium",
                      "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                      creatingSprint && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingSprint}
                    className={cn(
                      "inline-flex items-center px-4 h-8 rounded-full border text-xs font-medium shadow-sm",
                      "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
                      creatingSprint && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    {creatingSprint ? "Creating…" : "Create sprint"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <DragDropContext
      onDragEnd={handleDragEndInternal}
      onDragStart={handleDragStartInternal}
    >
      {overlay}
      {createSprintModal}
      {aiLoadingOverlay}
{deleteConfirmModal}
      <div
        className={cn(
          "pb-4 min-w-0 max-w-[100vw]",
          updateMode && "relative z-40",
        )}
      >
        <TaskFilterBar
          search={kw}
          onSearchChange={(val) => setKw(val)}
          totalText={`${filteredGlobalCount} tasks`}
          primaryFilterLabel="Status"
          primaryFilterValue={statusFilter}
          primaryFilterOptions={[
            { value: "ALL", label: "All status" },
            ...statusFilterOptions,
          ]}
          onPrimaryFilterChange={(v) =>
            setStatusFilter(v as string | "ALL")
          }
          assigneeOptions={assigneeOptions}
          assigneeValues={assigneeIds}
          onAssigneeValuesChange={(vals) => setAssigneeIds(vals)}
          dateFrom={dueFrom}
          dateTo={dueTo}
          onDateFromChange={setDueFrom}
          onDateToChange={setDueTo}
          priorityOptions={PRIORITY_OPTIONS}
          priorityValue={priorityFilter}
          onPriorityChange={setPriorityFilter}
          severityOptions={severityOptions}
          severityValue={severityFilter}
          onSeverityChange={setSeverityFilter}
          tagOptions={tagOptions}
          tagValue={tagFilter}
          onTagChange={setTagFilter}
          onClearAllFilters={
            hasAnyFilterActive
              ? () => {
                  setKw("");
                  setStatusFilter("ALL");
                  setAssigneeIds([]);
                  setDueFrom(null);
                  setDueTo(null);
                  setPriorityFilter("ALL");
                  setSeverityFilter("ALL");
                  setTagFilter("ALL");
                }
              : undefined
          }
          rightExtra={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setQuickDraftOpen((open) => {
                    const next = !open;
                    if (next) ensureDraftsLoaded();
                    return next;
                  })
                }
                className={cn(
                  "inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm",
                  "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                )}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                  QD
                </span>
                Draft pool
              </button>
<Can code='SPRINT_CREATE'>
              <button
                type="button"
                onClick={openCreateSprintModal}
                disabled={creatingSprint}
                className={cn(
                  "inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm",
                  "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                  creatingSprint && "opacity-60 cursor-not-allowed",
                )}
              >
                <Plus className="w-3 h-3" />
                New sprint
              </button>
</Can>
              {updateMode && (
                <Can code='SPRINT_AI_GENERATE'>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                >
                  <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-600">
                    AI
                  </span>
                  Generate tasks
                </button>
                </Can>
              )}

              {updateMode && (
                <div className="hidden md:flex items-center text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                  <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="mr-1 font-medium">Update mode</span>
                  <span className="text-amber-600">
                    Drag drop, create delete to edit.
                  </span>
                </div>
              )}

              {updateMode ? (
                <>
                  <button
                    type="button"
                    onClick={cancelUpdateMode}
                    disabled={saving}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm",
                      "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                      saving && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving || !hasStagedChanges}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm",
                      "border-blue-600 bg-blue-600 text-white",
                      (saving || !hasStagedChanges) &&
                        "opacity-60 cursor-not-allowed",
                    )}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={enterUpdateMode}
                  disabled={hasAnyFilterActive}
                  title={
                    hasAnyFilterActive
                      ? "Clear search & filters to update board."
                      : ""
                  }
                  className={cn(
                    "inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
                    hasAnyFilterActive && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Edit3 className="w-3 h-3" />
                  Update board
                </button>
              )}
            </div>
          }
        />

        {/* BOARD */}
        <div className="relative w-full min-w-0 max-w-[100vw] mt-3">
          <div
            className={cn(
              "overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw] bg-white/80 overflow-y-hidden",
              updateMode &&
                "ring-2 ring-blue-500/70 shadow-[0_0_0_1px_rgba(37,99,235,0.25)]",
            )}
            style={{ height: BOARD_H }}
          >
            <div className="inline-flex gap-4 h-full pr-8 min-w-max pb-5">
              {sprints.map((s) => {
                const { allTasks, tasks } = getSprintTasks(s);
                const stats = computeSprintStatsFromTasks(allTasks);
                const dateLabel =
                  (s as any).start && (s as any).end
                    ? `${formatSprintDate((s as any).start)} - ${formatSprintDate(
                        (s as any).end,
                      )}`
                    : (s as any).start
                    ? formatSprintDate((s as any).start)
                    : "";

                return (
                  <div key={s.id} className={`shrink-0 h-full ${COL_W} relative`}>
                    <BoardColumn
                      title={s.name}
                      subtitle={dateLabel}
                      right={
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="text-gray-600">
                            {stats.total} tasks
                          </span>
                          <span className="font-semibold text-green-700">
                            {stats.pct}%
                          </span>
                        </div>
                      }
                    >
                      <Droppable
                        droppableId={`spr:${s.id}`}
                        type="task"
                     renderClone={(provided, snapshot, rubric) => {
  const t = tasks[rubric.source.index];
  const meta = s.statusMeta?.[t.workflowStatusId ?? ""];

  return createPortal(
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <TaskCard
        t={t}
        ticketSiblingsCount={
          t.sourceTicketId
            ? tasks.filter(
                (x) =>
                  x.id !== t.id &&
                  x.sourceTicketId ===
                    t.sourceTicketId,
              ).length
            : 0
        }
        onMarkDone={_onMarkDone}
        onNext={_onNext}
        onSplit={_onSplit}
        onMoveNext={_onMoveNext}
        onOpenTicket={handleOpenTicket}
        isNew={t.id === flashTaskId}
        statusColorHex={meta?.color}
        statusLabel={meta?.name ?? meta?.code ?? ""}
        // ✅ thêm dòng này
        isAiNew={!!aiNewIds[t.id]}
      />
    </div>,
    document.body,
  );
}}

                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "h-full overflow-y-auto overscroll-contain pr-1 fuse-dropzone",
                              snapshot.isDraggingOver && "is-over rounded-xl",
                            )}
                            style={{ scrollbarWidth: "thin" }}
                          >
                            <div className="fuse-progress mb-2">
                              <i style={{ width: `${stats.pct}%` }} />
                            </div>

                            {/* QUICK CREATE – khi updateMode thì chỉ tạo draft local */}
                            <Can code='TASK_CREATE'>
                            <ColumnHoverCreate
                              sprint={s}
                              statusId={
                                s.statusOrder?.[0] ??
                                Object.keys(s.columns ?? {})[0]
                              }
                              allowStatusPicker
                              createAsDraft={updateMode}
                              onCreatedVM={(vm) => {
                                setFlashTaskId(vm.id);
                                bumpTask(vm.id);
                                if (updateMode && draftTasksBySprint) {
                                  setDraftTasksBySprint((prev) => {
                                    if (!prev) return prev;
                                    const curr = prev[s.id] ?? [];
                                    if (curr.some((t) => t.id === vm.id))
                                      return prev;
                                   return { ...prev, [s.id]: [vm, ...curr] };
                                  });
                                }
                              }}
                            />
</Can>
                            <div className="space-y-4">
                              {tasks.map((task, idx, arr) => {
                                const sibs = task.sourceTicketId
                                  ? arr.filter(
                                      (x) =>
                                        x.id !== task.id &&
                                        x.sourceTicketId ===
                                          task.sourceTicketId,
                                    ).length
                                  : 0;

                                const meta =
                                  s.statusMeta?.[task.workflowStatusId ?? ""];
                                const delayIndex = enteringIds[task.id];
                                const isEntering =
                                  typeof delayIndex === "number";

                                return (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={idx}
                                  >
                                    {(drag, snap) => (
                                      <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        {...drag.dragHandleProps}
                                        style={{
                                          ...drag.draggableProps.style,
                                          zIndex: snap.isDragging
                                            ? 9999
                                            : undefined,
                                          animationDelay:
                                            !snap.isDragging && isEntering
                                              ? `${delayIndex * 60}ms`
                                              : undefined,
                                        }}
                                        className={cn(
                                          "group",
                                          snap.isDragging &&
                                            "rotate-[0.5deg]",
                                          isRemoving(task.id) &&
                                            "fuse-card-removing",
                                          !snap.isDragging &&
                                            isEntering &&
                                            "fuse-card-enter",
                                        )}
                                      >
                                        <div className="relative">
                                          {updateMode && (
                                            <Can code='TASK_DELETE'>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRequestDelete(task)
                                              }
                                              className="absolute -top-2 -right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 shadow-sm opacity-0 transition group-hover:opacity-100"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                            </Can>
                                          )}

                                          <TaskCard
                                            t={task}
                                            ticketSiblingsCount={sibs}
                                            onMarkDone={_onMarkDone}
                                            onNext={_onNext}
                                            onSplit={_onSplit}
                                            onMoveNext={_onMoveNext}
                                            onOpenTicket={handleOpenTicket}
                                            isNew={task.id === flashTaskId}
                                            statusColorHex={meta?.color}
                                            statusLabel={
                                              meta?.name ?? meta?.code ?? ""
                                            }
                                              isAiNew={!!aiNewIds[task.id]}

                                          />
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>

                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </BoardColumn>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <QuickDraftPool
        open={quickDraftOpen}
        setOpen={setQuickDraftOpen}
        drafts={quickDrafts}
        setDrafts={setQuickDrafts}
        draggingFromPool={draggingFromDraftPool}
        projectId={projectId ?? undefined}
        loading={loadingDrafts}
        onReloadDrafts={loadDraftTasks}
        onOpenTicket={handleOpenBacklogTicket}
      />

      {aiOpen && (
        <AiGenerateTasksModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          projectId={projectId!}
          projectName="FUSION - Project Board"
          sprints={sprints}
          existingTasks={allTasksFlat}
          workflowMetaBySprint={workflowMetaBySprint}
          onGenerated={handleAiGenerated}
          onGeneratingChange={setAiGenerating}
        />
      )}
    </DragDropContext>
  );
}
