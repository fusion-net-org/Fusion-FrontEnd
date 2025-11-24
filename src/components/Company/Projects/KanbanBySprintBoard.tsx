// src/components/KanbanBySprintBoard.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Edit3, Trash2, Plus, X } from "lucide-react";

import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm, StatusCategory } from "@/types/projectBoard";
import ColumnHoverCreate from "../Task/ColumnHoverCreate";
import { useNavigate, useParams } from "react-router-dom";
import AiGenerateTasksModal from "@/components/AiGenerate/AiGenerateTasksModal";
import { createSprint } from "@/services/sprintService.js";
import { toast } from "react-toastify";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");
const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s,
  );

// format ngày sprint: 11/16/2025
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

/* ==== card xuất hiện mượt, pop-in ==== */
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

/* card mới sinh ra */
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

// Lấy toàn bộ task trong sprint theo thứ tự statusOrder + filter category
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

const computeSprintStatsFromTasks = (
  allTasks: TaskVm[],
  filter: "ALL" | StatusCategory,
) => {
  const visible =
    filter === "ALL"
      ? allTasks
      : allTasks.filter((t) => t.statusCategory === filter);
  const total = visible.length;
  const done = allTasks.filter((t) => t.statusCategory === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, pct };
};

const getSprintIdFromDroppable = (id: string): string | null => {
  if (!id) return null;
  if (id.startsWith("spr:")) return id.slice(4);
  return id;
};

// chuẩn hoá priority từ AI về 4 mức chuẩn
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
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white overflow-hidden ring-1 ring-blue-200 h-full flex flex-col group",
      )}
      style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}
    >
      {/* top bar 1 màu xanh */}
      <div className="h-2 w-full" style={{ backgroundColor: brand }} />

      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="fuse-pill fuse-pill--sheen">{title}</span>
          {subtitle && (
            <span className="text-[11px] text-slate-600 font-medium">
              {subtitle}
            </span>
          )}
        </div>
        {right}
      </div>

      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
};

type Props = {
  sprints: SprintVm[];
  filterCategory?: "ALL" | StatusCategory;
  onDragEnd: (r: DropResult) => void;
  onMarkDone?: (t: TaskVm) => void;
  onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void;
  onMoveNext?: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
  // parent xử lý gọi API delete + reload board
  onDeleteTask?: (t: TaskVm) => Promise<void> | void;
  // optional: nếu muốn BE nhận 1 payload tổng, dùng cái này thay vì replay onDragEnd
  onSaveBoard?: (payload: {
    moves: DropResult[];
    deletions: TaskVm[];
    draftBySprint: Record<string, TaskVm[]>;
  }) => Promise<void> | void;
  // khi tạo sprint xong thì refetch board
  onReloadBoard?: () => void;
};

/* ====== Kiểu draft từ AI ====== */
type AiDraft = {
  title: string;
  description?: string | null;
  type?: TaskVm["type"];
  priority?: string | null;
  severity?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
  statusCategory?: string | null;
  statusCode?: string | null;
  estimateHours?: number | null;
  storyPoints?: number | null;
  dueDate?: string | null;
  module?: string | null;
  checklist?: string[] | null;
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
}: Props) {
  useFuseKanbanStyles();

  // flash card mới tạo (animate "isNew")
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);

  // update / cleanup mode
  const [updateMode, setUpdateMode] = useState(false);
  // track card đang animate remove
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});

  // draft: sprintId -> list TaskVm theo thứ tự (bao gồm tất cả status)
  const [draftTasksBySprint, setDraftTasksBySprint] = useState<
    Record<string, TaskVm[]> | null
  >(null);

  // các lần drag trong phiên update (để Save replay / gửi BE)
  const [stagedMoves, setStagedMoves] = useState<DropResult[]>([]);
  // các task bị đánh dấu xoá trong phiên update
  const [stagedDeletes, setStagedDeletes] = useState<TaskVm[]>([]);
  const [saving, setSaving] = useState(false);

  // Có task AI draft (id không phải GUID hoặc isAiDraft) thì cũng coi như có thay đổi
  const hasAiDrafts =
    draftTasksBySprint != null &&
    Object.values(draftTasksBySprint).some((list) =>
      (list ?? []).some(
        (t) => !isGuid(t.id) || (t as any).isAiDraft,
      ),
    );

  const hasStagedChanges =
    stagedMoves.length > 0 || stagedDeletes.length > 0 || hasAiDrafts;

  // ==== track card mới sinh ra để animate pop-in ====
  const [enteringIds, setEnteringIds] = useState<Record<string, number>>({});
  const prevTaskIdsRef = React.useRef<Set<string>>(new Set());
  const firstRenderRef = React.useRef(true);

  useEffect(() => {
    if (!flashTaskId) return;
    const t = setTimeout(() => setFlashTaskId(null), 900);
    return () => clearTimeout(t);
  }, [flashTaskId]);

  // detect các task mới xuất hiện (từ AI create, Quick create, refetch board...)
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

    // lần render đầu tiên: không animate
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

    // set delay index để stagger từng card
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
    }, 400); // lâu hơn tí so với .32s animation

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

  const [aiOpen, setAiOpen] = useState(false);

  // ====== Tạo sprint: modal popup ======
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const openCreateSprintModal = () => {
    const defaultName = `Sprint ${sprints.length + 1}`;
    setNewSprintName(defaultName);
    setCreateError(null);
    setCreateSprintOpen(true);
  };

  const closeCreateSprintModal = () => {
    if (creatingSprint) return;
    setCreateSprintOpen(false);
    setCreateError(null);
  };

  const handleSubmitCreateSprint = async (
    e?: React.FormEvent<HTMLFormElement>,
  ) => {
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

      // BE tự tính StartDate / EndDate theo logic (sau sprint cuối cùng)
      await createSprint({
        projectId,
        name,
      });

      toast.success("Created sprint successfully.");
      setCreateSprintOpen(false);

      if (onReloadBoard) {
        // cho parent refetch board, không reload full page
        onReloadBoard();
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

  // Tất cả task trên board (mọi sprint, mọi status) – dùng cho AI tránh trùng
  const allTasksFlat = React.useMemo(() => {
    const acc: TaskVm[] = [];
    for (const sp of sprints) {
      acc.push(...flattenSprintTasks(sp, "ALL"));
    }
    return acc;
  }, [sprints]);

  // Map sprintId -> list status meta (cho AI)
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

  // helper: map status từ draft AI -> status thực trong workflow của sprint
  const resolveStatusForAiDraft = React.useCallback(
    (
      sprintId: string,
      draft: any,
    ): { statusCategory: StatusCategory; workflowStatusId?: string } => {
      const list = workflowMetaBySprint[sprintId] ?? [];

      if (!list.length) {
        return { statusCategory: "TODO", workflowStatusId: undefined };
      }

      const rawCode = String(
        draft.statusCode ?? draft.status_code ?? "",
      ).trim();
      const rawCat = String(
        draft.statusCategory ?? draft.status_category ?? "",
      )
        .trim()
        .toUpperCase();

      const statusMeta =
        (rawCode &&
          list.find(
            (st) =>
              st.code &&
              st.code.toLowerCase() === rawCode.toLowerCase(),
          )) ||
        (rawCat &&
          list.find(
            (st) =>
              st.category &&
              st.category.toUpperCase() === rawCat,
          )) ||
        list.find((st) => !st.isDone) ||
        list[0];

      const statusCategory = (statusMeta?.category || "TODO") as StatusCategory;
      const workflowStatusId = statusMeta?.id;

      return { statusCategory, workflowStatusId };
    },
    [workflowMetaBySprint],
  );

  /* ====== Update mode controls ====== */

  const enterUpdateMode = () => {
    // để tránh bug index khi filter != ALL
    if (filterCategory !== "ALL") {
      return;
    }

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
        // mode chuẩn: BE tự xử lý bulk theo layout
        await onSaveBoard({
          moves: stagedMoves,
          deletions: stagedDeletes,
          draftBySprint: draftTasksBySprint,
        });
      } else {
        // fallback: replay onDragEnd + onDeleteTask như hiện tại
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

  /* ====== Drag handler: live vs draft ====== */

  const handleDragEndInternal = (result: DropResult) => {
    const { destination } = result;
    if (!destination) return;

    // Không ở update mode: hành vi cũ – bắn thẳng ra ngoài
    if (!updateMode || !draftTasksBySprint) {
      onDragEnd(result);
      return;
    }

    const fromSprintId = getSprintIdFromDroppable(result.source.droppableId);
    const toSprintId = getSprintIdFromDroppable(destination.droppableId);
    if (!fromSprintId || !toSprintId) {
      return;
    }

    setDraftTasksBySprint((prev) => {
      if (!prev) return prev;
      const srcList = [...(prev[fromSprintId] ?? [])];
      if (!srcList.length) return prev;

      const [movedTask] = srcList.splice(result.source.index, 1);
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

    // lưu move để lúc Save mới gọi API
    setStagedMoves((prev) => [...prev, result]);
  };

  // xoá 1 ticket trong update mode (draft delete)
  const handleRequestDelete = async (task: TaskVm) => {
    if (!updateMode) return;

    const label = (task as any).code || task.title || "this ticket";
    const ok = window.confirm(
      `Delete "${label}"?\nThis action cannot be undone and will remove the ticket from this board.`,
    );
    if (!ok) return;

    // animate thu nhỏ
    setRemovingIds((prev) => ({ ...prev, [task.id]: true }));

    setTimeout(() => {
      // cập nhật draft: remove task khỏi sprint chứa nó
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

      // flag delete để Save sau này bắn API
      setStagedDeletes((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task],
      );

      setRemovingIds((prev) => {
        const clone = { ...prev };
        delete clone[task.id];
        return clone;
      });
    }, 180);
  };

  // full-screen overlay khi bật update mode (để nền mờ, board nổi bật)
  const overlay =
    updateMode && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-30 pointer-events-none bg-slate-900/20 backdrop-blur-[2px] transition-opacity" />,
          document.body,
        )
      : null;

  /* ====== NHẬN TASK TỪ AI & ĐƯA VÀO TỪNG SPRINT (DRAFT, KHÔNG LƯU DB) ====== */

  const handleAiGenerated = React.useCallback(
    (aiDrafts: AiDraft[], meta: { defaultSprintId: string }) => {
      if (!Array.isArray(aiDrafts) || aiDrafts.length === 0) return;

      // Bật update mode nếu chưa bật
      setUpdateMode(true);

      setDraftTasksBySprint((prev) => {
        // base = board hiện tại nếu chưa có draft
        const base: Record<string, TaskVm[]> =
          prev ??
          sprints.reduce<Record<string, TaskVm[]>>((acc, sp) => {
            acc[sp.id] = flattenSprintTasks(sp, "ALL");
            return acc;
          }, {});

        const next: Record<string, TaskVm[]> = { ...base };
        const now = Date.now();

        aiDrafts.forEach((draft, idx) => {
          // 1. Chọn sprint target
          const aiSprintId = draft.sprintId ?? meta?.defaultSprintId ?? null;
          const sprintId =
            (aiSprintId && sprints.some((sp) => sp.id === aiSprintId)
              ? aiSprintId
              : meta?.defaultSprintId) || sprints[0]?.id;

          if (!sprintId) return;

          // 2. Map status từ draft -> workflow thật
          const { statusCategory, workflowStatusId } = resolveStatusForAiDraft(
            sprintId,
            draft,
          );

          // 3. Tạo id giả + gán cờ draft
          const fakeId = `AI-${now}-${idx}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

          const vm: TaskVm & { isAiDraft?: boolean } = {
            // bắt buộc
            id: fakeId,
            sprintId,
            title: draft.title,
            description: draft.description ?? "",
            type: (draft.type as any) ?? "Feature",
            priority: normalizePriority(draft.priority),
            severity: (draft.severity as any) ?? null,
            statusCategory,
            workflowStatusId,

            // các field khác để TaskCard không bị lỗi
            projectId: (sprints[0] as any)?.projectId ?? "",
            statusCode: draft.statusCode ?? undefined,
            sourceTicketId: undefined,
            source: "AI_DRAFT",
            code: "AI generate",
            estimateHours: draft.estimateHours ?? null,
            remainingHours: draft.estimateHours ?? null,
            point:
              (draft as any).storyPoints ??
              draft.storyPoints ??
              null,
            dueDate: draft.dueDate ?? null,
            module: (draft as any).module ?? null,

            // cho UI checklist (nếu có)
            checklist:
              draft.checklist && Array.isArray(draft.checklist)
                ? draft.checklist
                : [],

            // flag để TaskCard biết là task giả
            isAiDraft: true,
          } as any;

          const list = next[sprintId] ?? [];
          next[sprintId] = [...list, vm];
        });

        return next;
      });
    },
    [resolveStatusForAiDraft, sprints],
  );

  // ===== Modal tạo sprint (portal) =====
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
    <DragDropContext onDragEnd={handleDragEndInternal}>
      {overlay}
      {createSprintModal}

      <div
        className={cn(
          "px-8 mt-5 pb-4 min-w-0 max-w-[100vw]",
          updateMode && "relative z-40",
        )}
      >
        {/* thanh action phía trên bên phải */}
        <div className="mb-2 flex items-center justify-end gap-3">
          {/* New sprint */}
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

          {/* Nút AI */}
          {updateMode && (
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
              disabled={filterCategory !== "ALL"}
              title={
                filterCategory !== "ALL"
                  ? "Update board Only All."
                  : ""
              }
              className={cn(
                "inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium shadow-sm border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
                filterCategory !== "ALL" && "opacity-60 cursor-not-allowed",
              )}
            >
              <Edit3 className="w-3 h-3" />
              Update board
            </button>
          )}
        </div>

        {/* không dùng overflow-x-clip để không bị cắt khi drag */}
        <div className="relative w-full min-w-0 max-w-[100vw]">
          <div
            className={cn(
              "overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw] bg-white/80",
              updateMode &&
                "ring-2 ring-blue-500/70 shadow-[0_0_0_1px_rgba(37,99,235,0.25)]",
            )}
            style={{ height: BOARD_H }}
          >
            <div className="inline-flex gap-4 h-full pr-8 min-w-max pb-5 ">
              {sprints.map((s) => {
                // allTasks luôn ALL status (dùng cho stats + filter phía dưới)
                const allTasks =
                  updateMode && draftTasksBySprint
                    ? draftTasksBySprint[s.id] ?? []
                    : flattenSprintTasks(s, "ALL");

                const tasks =
                  filterCategory === "ALL"
                    ? allTasks
                    : allTasks.filter(
                        (t) => t.statusCategory === filterCategory,
                      );

                const stats = computeSprintStatsFromTasks(
                  allTasks,
                  filterCategory,
                );

                const dateLabel =
                  (s as any).start && (s as any).end
                    ? `${formatSprintDate(
                        (s as any).start,
                      )} - ${formatSprintDate((s as any).end)}`
                    : (s as any).start
                      ? formatSprintDate((s as any).start)
                      : "";

                return (
                  <div
                    key={s.id}
                    className={`shrink-0 h-full ${COL_W} relative`}
                  >
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
                      {/* prefix spr: để khớp onDragEndKanban */}
                      <Droppable
                        droppableId={`spr:${s.id}`}
                        type="task"
                        renderClone={(provided, snapshot, rubric) => {
                          const t = tasks[rubric.source.index];
                          const meta =
                            s.statusMeta?.[t.workflowStatusId ?? ""];

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
                            {/* progress bar (animated width) */}
                            <div className="fuse-progress mb-2">
                              <i style={{ width: `${stats.pct}%` }} />
                            </div>

                            {/* Quick create – luôn hiện trên mỗi cột */}
                            <ColumnHoverCreate
                              sprint={s}
                              statusId={
                                s.statusOrder?.[0] ??
                                Object.keys(s.columns ?? {})[0]
                              }
                              allowStatusPicker
                              onCreatedVM={(vm) => {
                                setFlashTaskId(vm.id);
                                // nếu đang update mode thì push vào draft để layout nhất quán
                                if (updateMode && draftTasksBySprint) {
                                  setDraftTasksBySprint((prev) => {
                                    if (!prev) return prev;
                                    const curr = prev[s.id] ?? [];
                                    // tránh double-append nếu refetch
                                    if (curr.some((t) => t.id === vm.id))
                                      return prev;
                                    return {
                                      ...prev,
                                      [s.id]: [...curr, vm],
                                    };
                                  });
                                }
                              }}
                            />

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

                                const meta = s.statusMeta?.[
                                  task.workflowStatusId ?? ""
                                ];

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
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRequestDelete(task)
                                              }
                                              className="absolute -top-2 -right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 shadow-sm opacity-0 transition group-hover:opacity-100"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
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

      {aiOpen && (
        <AiGenerateTasksModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          projectId={projectId!}
          projectName={"FUSION - Project Board"}
          sprints={sprints}
          existingTasks={allTasksFlat}
          workflowMetaBySprint={workflowMetaBySprint}
          onGenerated={handleAiGenerated} // nhận AiDraft[], meta.defaultSprintId
        />
      )}
    </DragDropContext>
  );
}
