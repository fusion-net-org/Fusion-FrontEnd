import React, { useMemo, useState } from "react";
import { Clock, Check, MoveDown, SplitSquareHorizontal } from "lucide-react";
import type {
  TaskVm,
  StatusCategory,
  SprintVm,
  MemberRef,
} from "@/types/projectBoard";
import CreateTaskModal from "../Task/CreateTaskModal";
import { useProjectBoard } from "@/context/ProjectBoardContext";
import { useNavigate, useParams } from "react-router-dom";
import type { SimpleOption } from "./TaskFilterBar";
import TaskFilterBar from "./TaskFilterBar";
import { Can } from "@/permission/PermissionProvider";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/* === SLA đơn giản === */
const SLA: Array<{
  type: TaskVm["type"];
  priority: TaskVm["priority"];
  h: number;
}> = [
  { type: "Bug", priority: "Urgent", h: 24 },
  { type: "Bug", priority: "High", h: 48 },
  { type: "Bug", priority: "Medium", h: 72 },
  { type: "Feature", priority: "Urgent", h: 72 },
  { type: "Feature", priority: "High", h: 120 },
  { type: "Feature", priority: "Medium", h: 168 },
  { type: "Feature", priority: "Low", h: 336 },
  { type: "Chore", priority: "Low", h: 336 },
];
const slaTarget = (t: TaskVm) =>
  SLA.find((x) => x.type === t.type && x.priority === t.priority)?.h ?? null;

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

const prettyStatusCode = (code?: string | null) => {
  if (!code) return "";
  const c = code.toLowerCase();
  if (c === "inprogress") return "In progress";
  if (c === "inreview") return "In review";
  if (c === "todo") return "To do";
  if (c === "done") return "Done";
  return code;
};

/* === main === */
export default function ProjectTaskList({
  tasks,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  onOpenTicket,
}: {
  tasks: TaskVm[];
  onMarkDone?: (t: TaskVm) => void;
  onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void;
  onMoveNext?: (t: TaskVm) => void;
  onOpenTicket?: (taskId: string) => void;
}) {
  // search + status filter + sort + pagination
  const [kw, setKw] = useState("");
  // 🔴 Filter theo workflowStatusId (string) hoặc "ALL"
  const [statusFilter, setStatusFilter] = useState<string | "ALL">("ALL");

  const [sortKey, setSortKey] = useState<
    "updatedDesc" | "dueAsc" | "dueDesc" | "priority"
  >("updatedDesc");

  const sortOptions: SimpleOption[] = [
    { value: "updatedDesc", label: "Last updated" },
    { value: "dueAsc", label: "Due date ↑" },
    { value: "dueDesc", label: "Due date ↓" },
    { value: "priority", label: "Priority" },
  ];

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [open, setOpen] = useState(false);

  // advanced filters
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueFrom, setDueFrom] = useState<string | null>(null);
  const [dueTo, setDueTo] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");

  // từ context
  const { sprints } = useProjectBoard();

  // ======= STATUS META TỪ WORKFLOW (statusMeta) =======
  const { statusFilterOptions, statusMetaById } = useMemo(() => {
    // statusId -> { label, category, order }
    const byId = new Map<
      string,
      { label: string; category: StatusCategory; order: number }
    >();

    for (const sp of (sprints ?? []) as SprintVm[]) {
      const metaObj: any = (sp as any).statusMeta ?? {};
      const orderArr: string[] =
        (sp as any).statusOrder && Array.isArray((sp as any).statusOrder)
          ? (sp as any).statusOrder
          : Object.keys(metaObj);

      orderArr.forEach((statusId, idx) => {
        const meta = metaObj[statusId];
        if (!meta) return;

        const cat = (meta.category ?? "TODO") as StatusCategory;
        const order = typeof meta.order === "number" ? meta.order : idx;
        const label: string =
          meta.name || meta.code || prettyStatusCategory(cat);

        const existing = byId.get(statusId);
        if (!existing) {
          byId.set(statusId, { label, category: cat, order });
        } else if (order < existing.order) {
          byId.set(statusId, { ...existing, order });
        }
      });
    }

    const statusFilterOptions: SimpleOption[] = Array.from(byId.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([statusId, info]) => ({
        value: statusId,
        label: info.label,
      }));

    const statusMetaById: Record<
      string,
      { label: string; category: StatusCategory; order: number }
    > = {};
    byId.forEach((v, k) => {
      statusMetaById[k] = v;
    });

    return { statusFilterOptions, statusMetaById };
  }, [sprints]);

  // helper: lấy label status cho 1 task theo workflow
  const getStatusLabel = React.useCallback(
    (t: TaskVm): string => {
      if (t.workflowStatusId && statusMetaById[t.workflowStatusId]) {
        return statusMetaById[t.workflowStatusId].label;
      }

      if (t.statusCategory) {
        return prettyStatusCategory(t.statusCategory);
      }

      if (t.statusCode) {
        return prettyStatusCode(t.statusCode);
      }

      return "";
    },
    [statusMetaById],
  );

   // helper: lấy category (TODO / IN_PROGRESS / ...) để biết DONE, v.v.
  const getStatusCategory = React.useCallback(
    (t: TaskVm): StatusCategory | null => {
      // Nếu task có workflowStatusId và meta thì lấy category từ đó
      if (t.workflowStatusId && statusMetaById[t.workflowStatusId]) {
        return statusMetaById[t.workflowStatusId].category;
      }

      return (t.statusCategory as StatusCategory | null) ?? null;
    },
    [statusMetaById],
  );


  // danh sách member (cho modal tạo task + filter)
  const members: MemberRef[] = useMemo(() => {
    const map = new Map<string, MemberRef>();
    for (const t of tasks) {
      (t.assignees ?? []).forEach((m) => {
        if (!map.has(m.id)) map.set(m.id, m);
      });
    }
    return Array.from(map.values());
  }, [tasks]);

  const assigneeOptions: SimpleOption[] = useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.name,
      })),
    [members],
  );

  const priorityOptions: SimpleOption[] = [
    { value: "ALL", label: "All priority" },
    { value: "Urgent", label: "Urgent" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const severityOptions: SimpleOption[] = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.severity) set.add(String(t.severity));
    });
    const values = Array.from(set);
    return [
      { value: "ALL", label: "All severity" },
      ...values.map((v) => ({ value: v, label: v })),
    ];
  }, [tasks]);

  const tagOptions: SimpleOption[] = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      const tags = (t as any).tags as string[] | undefined;
      if (tags) tags.forEach((tag) => set.add(tag));
    });
    const values = Array.from(set);
    return [
      { value: "ALL", label: "All tags" },
      ...values.map((v) => ({ value: v, label: v })),
    ];
  }, [tasks]);

  // lọc + sort list
  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();

    let list = tasks.filter((t) =>
      !k ? true : `${t.code} ${t.title}`.toLowerCase().includes(k),
    );

    // 🔴 Filter theo workflowStatusId
    if (statusFilter !== "ALL") {
      list = list.filter((t) => {
        // 1. Task đã gán workflowStatusId
        if (t.workflowStatusId && t.workflowStatusId === statusFilter) {
          return true;
        }

        // 2. Fallback: nếu là task cũ chưa có workflowStatusId,
        // cho phép filter theo category nếu value tình cờ là "TODO" / "IN_PROGRESS"...
        const cat = getStatusCategory(t);
        if (cat && statusFilter === cat) {
          return true;
        }

        return false;
      });
    }

    if (assigneeIds.length) {
      list = list.filter((t) =>
        (t.assignees ?? []).some((m) => assigneeIds.includes(m.id)),
      );
    }

    if (priorityFilter !== "ALL") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    if (severityFilter !== "ALL") {
      list = list.filter(
        (t) => String(t.severity ?? "") === severityFilter,
      );
    }

    if (tagFilter !== "ALL") {
      list = list.filter((t) => {
        const tags = (t as any).tags as string[] | undefined;
        if (!tags || !tags.length) return false;
        return tags.includes(tagFilter);
      });
    }

    if (dueFrom) {
      const fromMs = new Date(dueFrom).setHours(0, 0, 0, 0);
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate as any).getTime();
        return d >= fromMs;
      });
    }

    if (dueTo) {
      const toMs = new Date(dueTo).setHours(23, 59, 59, 999);
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate as any).getTime();
        return d <= toMs;
      });
    }

    const prioOrder = ["Urgent", "High", "Medium", "Low"];

    list.sort((a, b) => {
      if (sortKey === "priority") {
        const ia = prioOrder.indexOf(a.priority ?? "");
        const ib = prioOrder.indexOf(b.priority ?? "");
        const sa = ia === -1 ? 99 : ia;
        const sb = ib === -1 ? 99 : ib;
        return sa - sb;
      }

      if (sortKey === "dueAsc" || sortKey === "dueDesc") {
        const ad = a.dueDate ? new Date(a.dueDate as any).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate as any).getTime() : Infinity;
        const cmp = ad - bd;
        return sortKey === "dueAsc" ? cmp : -cmp;
      }

      // updatedDesc (mặc định)
      const au = new Date(a.updatedAt as any).getTime();
      const bu = new Date(b.updatedAt as any).getTime();
      return bu - au;
    });

    return list;
  }, [
    tasks,
    kw,
    statusFilter,
    assigneeIds,
    priorityFilter,
    severityFilter,
    tagFilter,
    dueFrom,
    dueTo,
    sortKey,
    getStatusCategory,
  ]);

  const { companyId, projectId } = useParams();
  const navigate = useNavigate();

  const handleOpenTask = React.useCallback(
    (taskId: string) => {
      if (onOpenTicket) {
        onOpenTicket(taskId);
        return;
      }

      if (!companyId || !projectId) {
        console.warn("[ProjectTaskList] missing params", {
          companyId,
          projectId,
          taskId,
        });
        return;
      }

      navigate(`/companies/${companyId}/project/${projectId}/task/${taskId}`);
    },
    [onOpenTicket, companyId, projectId, navigate],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(
    (pageIndex - 1) * pageSize,
    pageIndex * pageSize,
  );

  return (
    <div className=" mt-5 space-y-4">
      {/* TOP FILTER BAR với Filters / Assigned / Date / Priority / Severity / Tags */}
      <TaskFilterBar
        search={kw}
        onSearchChange={(val) => {
          setKw(val);
          setPageIndex(1);
        }}
        totalText={`${filtered.length} tasks`}
        sortValue={sortKey}
        sortOptions={sortOptions}
        onSortChange={(v) =>
          setSortKey(
            v as "updatedDesc" | "dueAsc" | "dueDesc" | "priority",
          )
        }
        primaryFilterLabel="Status"
        primaryFilterValue={statusFilter}
        primaryFilterOptions={[
          { value: "ALL", label: "All status" },
          ...statusFilterOptions,
        ]}
        onPrimaryFilterChange={(v) => {
          setStatusFilter(v as string | "ALL");
          setPageIndex(1);
        }}
        assigneeOptions={assigneeOptions}
        assigneeValues={assigneeIds}
        onAssigneeValuesChange={(vals) => {
          setAssigneeIds(vals);
          setPageIndex(1);
        }}
        dateFrom={dueFrom}
        dateTo={dueTo}
        onDateFromChange={(v) => {
          setDueFrom(v);
          setPageIndex(1);
        }}
        onDateToChange={(v) => {
          setDueTo(v);
          setPageIndex(1);
        }}
        priorityOptions={priorityOptions}
        priorityValue={priorityFilter}
        onPriorityChange={(v) => {
          setPriorityFilter(v);
          setPageIndex(1);
        }}
        severityOptions={severityOptions}
        severityValue={severityFilter}
        onSeverityChange={(v) => {
          setSeverityFilter(v);
          setPageIndex(1);
        }}
        tagOptions={tagOptions}
        tagValue={tagFilter}
        onTagChange={(v) => {
          setTagFilter(v);
          setPageIndex(1);
        }}
        onClearAllFilters={() => {
          setStatusFilter("ALL");
          setAssigneeIds([]);
          setPriorityFilter("ALL");
          setSeverityFilter("ALL");
          setTagFilter("ALL");
          setDueFrom(null);
          setDueTo(null);
          setPageIndex(1);
        }}
        rightExtra={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-blue-600 text-xs text-white shadow-sm hover:bg-blue-700"
          >
            + New task
          </button>
        }
      />

      {/* modal tạo task */}
      <CreateTaskModal
        open={open}
        onClose={() => setOpen(false)}
        sprints={sprints}
        members={members}
        defaultSprintId={sprints[0]?.id}
        onSubmit={async (payload) => {
          // TODO: gọi API tạo task thật
          console.log("CreateTask payload", payload);
        }}
      />

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/95 backdrop-blur border-b">
              <tr className="text-left text-[12px] text-slate-500">
                <th className="px-3 py-2 w-[120px]"># / Sprint</th>
                <th className="px-3 py-2">Title / Tags</th>
                <th className="px-3 py-2">Assigned</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-[160px]">Progress</th>
                <th className="px-3 py-2">Due / SLA</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2 w-[260px]"></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((t) => {
                const target = slaTarget(t);
                const remain =
                  target == null
                    ? null
                    : Math.ceil(
                        target -
                          Math.max(
                            0,
                            (new Date().getTime() -
                              new Date(t.openedAt).getTime()) /
                              36e5,
                          ),
                      );
                const cat = getStatusCategory(t);
                const isDone = cat === "DONE";
                const ratio = Math.max(
                  0,
                  Math.min(
                    1,
                    (t.estimateHours || 0) === 0
                      ? 0
                      : 1 -
                          (t.remainingHours ?? 0) /
                            (t.estimateHours || 1),
                  ),
                );

                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-b last:border-0",
                      isDone && "opacity-70",
                    )}
                  >
                    {/* code + sprint */}
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => handleOpenTask(t.id)}
                        className="font-semibold text-xs text-blue-600 hover:underline"
                      >
                        {t.code}
                      </button>
                      <div className="text-[11px] text-slate-500">
                        Sprint {t.sprintId?.split("-")[1] ?? "—"}
                      </div>
                    </td>

                    {/* title + tags */}
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => handleOpenTask(t.id)}
                        className={cn(
                          "text-[13px] font-semibold text-left",
                          "text-blue-600 underline decoration-blue-400 underline-offset-[3px]",
                          "hover:text-blue-700 hover:decoration-blue-600 focus:outline-none",
                        )}
                      >
                        {t.title}
                      </button>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border",
                            t.priority === "Urgent"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : t.priority === "High"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-700 border-slate-200",
                          )}
                        >
                          {t.priority}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                          {t.type}
                        </span>
                      </div>
                    </td>

                    {/* assignees */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {(t.assignees ?? [])
                          .slice(0, 3)
                          .map((m, i) => (
                            <div
                              key={m.id}
                              className={i > 0 ? "-ml-2" : ""}
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-white bg-slate-200 text-[10px] font-semibold text-slate-700 flex items-center justify-center">
                                {m.avatarUrl ? (
                                  <img
                                    src={m.avatarUrl}
                                    alt={m.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (m.name
                                    .split(" ")
                                    .map((x) => x[0])
                                    .slice(0, 2)
                                    .join("") || "?"
                                  ).toUpperCase()
                                )}
                              </div>
                            </div>
                          ))}
                        {Math.max(
                          0,
                          (t.assignees?.length ?? 0) - 3,
                        ) > 0 && (
                          <div className="-ml-2 w-6 h-6 rounded-full ring-2 ring-white bg-slate-300 text-[10px] flex items-center justify-center font-semibold text-slate-700">
                            +
                            {Math.max(
                              0,
                              (t.assignees?.length ?? 0) - 3,
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[240px] mt-1">
                        {(t.assignees || [])
                          .map((a) => a.name)
                          .join(", ") || "Unassigned"}
                      </div>
                    </td>

                    {/* status */}
                    <td className="px-3 py-3 align-top">
                      <div className="text-sm">{getStatusLabel(t)}</div>
                      <div className="text-[11px] text-slate-500">
                        {prettyStatusCategory(cat)}
                      </div>
                    </td>

                    {/* progress */}
                    <td className="px-3 py-3 align-top">
                      <div className="h-2 w-[150px] bg-slate-100 rounded">
                        <div
                          className="h-2 rounded"
                          style={{
                            width: `${Math.round(ratio * 100)}%`,
                            background: brand,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {Math.max(
                          0,
                          (t.estimateHours ?? 0) -
                            (t.remainingHours ?? 0),
                        )}
                        /{t.estimateHours ?? 0}h
                      </div>
                    </td>

                    {/* due / SLA */}
                    <td className="px-3 py-3 align-top">
                      <div className="text-slate-700">
                        {t.dueDate
                          ? new Date(
                              t.dueDate as any,
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                      {target != null && !isDone && remain != null && (
                        <div
                          className={cn(
                            "mt-1 text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border",
                            remain < 0
                              ? "text-rose-700 bg-rose-50 border-rose-200"
                              : remain <= 12
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-slate-600 bg-slate-50 border-slate-200",
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          {remain < 0
                            ? `Overdue ${Math.abs(remain)}h`
                            : `SLA ${remain}h left`}
                        </div>
                      )}
                    </td>

                    {/* updated */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      {new Date(t.updatedAt as any).toLocaleString()}
                    </td>

                    {/* actions */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {!isDone && (
                          <button
                            className="px-2 py-1 rounded-lg border text-xs hover:bg-emerald-50 border-emerald-300 text-emerald-700"
                            onClick={() => onMarkDone?.(t)}
                          >
                            <Check className="w-3 h-3 inline mr-1" />
                            Done
                          </button>
                        )}
<Can code='TASK_SPLIT'>
                        <button
                          className="px-2 py-1 rounded-lg border text-xs hover:bg-violet-50 border-violet-300 text-violet-700"
                          onClick={() => onSplit?.(t)}
                        >
                          <SplitSquareHorizontal className="w-3 h-3 inline mr-1" />
                          Split
                        </button>
                        </Can>
                        <button
                          className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50 border-slate-300 text-slate-600"
                          onClick={() => onMoveNext?.(t)}
                        >
                          <MoveDown className="w-3 h-3 inline mr-1" />
                          Move next
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {slice.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No task found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="px-4 py-3 border-t bg-white flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing{" "}
            <b>{slice.length ? (pageIndex - 1) * pageSize + 1 : 0}</b>–
            <b>{Math.min(pageIndex * pageSize, filtered.length)}</b> of{" "}
            <b>{filtered.length}</b>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(1);
              }}
              className="h-9 rounded-xl border border-slate-300 bg-white text-sm pl-3 pr-2"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                const start = Math.max(
                  1,
                  Math.min(pageIndex - 3, totalPages - 6),
                );
                const n = start + i;
                if (n > totalPages) return null;
                const active = n === pageIndex;
                return (
                  <button
                    key={n}
                    onClick={() => setPageIndex(n)}
                    className={cn(
                      "h-9 min-w-9 px-2 rounded-xl border text-sm",
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
