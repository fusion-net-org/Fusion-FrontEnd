/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { Search, Clock, Check, MoveDown, SplitSquareHorizontal } from "lucide-react";
import { toast } from "react-toastify";
import { getMyTasks } from "@/services/taskService.js";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

type StatusCategory = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

type TaskListProps = {
  onEdit?: (task: any) => void;
  onDelete?: (id: string | number) => Promise<void> | void;
  onViewDetail?: (task: any) => void;
  sortColumn?: string;
  sortDescending?: boolean;
};

/* ===== SLA config đơn giản (giống bên ProjectTaskList) ===== */
const SLA: Array<{ type: string; priority: string; h: number }> = [
  { type: "Bug",     priority: "Urgent", h: 24 },
  { type: "Bug",     priority: "High",   h: 48 },
  { type: "Bug",     priority: "Medium", h: 72 },
  { type: "Feature", priority: "Urgent", h: 72 },
  { type: "Feature", priority: "High",   h: 120 },
  { type: "Feature", priority: "Medium", h: 168 },
  { type: "Feature", priority: "Low",    h: 336 },
  { type: "Chore",   priority: "Low",    h: 336 },
];

const slaTarget = (type?: string, priority?: string) =>
  SLA.find((x) => x.type === (type || "Feature") && x.priority === (priority || "Medium"))?.h ?? null;

const labelFromCode = (code: string) => {
  const c = (code || "").toLowerCase();
  if (c === "inprogress") return "In progress";
  if (c === "inreview") return "In review";
  if (c === "todo") return "To do";
  if (c === "done") return "Done";
  return code || "Unknown";
};

const inferStatusCategory = (statusCode: string): StatusCategory => {
  const c = (statusCode || "").toLowerCase();
  if (["todo", "backlog", "new", "open"].includes(c)) return "TODO";
  if (["inprogress", "doing", "active", "wip"].includes(c)) return "IN_PROGRESS";
  if (["inreview", "review", "qa", "testing"].includes(c)) return "REVIEW";
  if (["done", "completed", "resolved", "closed"].includes(c)) return "DONE";
  return "TODO";
};

const TaskList: React.FC<TaskListProps> = ({
  onEdit,
  onDelete,
  onViewDetail,
  sortColumn = "DueDate",
  sortDescending = false,
}) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // local filter + pagination (giống bên ProjectTaskList)
  const [kw, setKw] = useState("");
  const [cats, setCats] = useState<Array<StatusCategory>>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ====== load tasks từ API /tasks/user ======
  useEffect(() => {
    let dead = false;

    (async () => {
      setLoading(true);
      try {
        const res = await getMyTasks({
          pageNumber: 1,
          pageSize: 200,        // lấy dư rồi filter/paging ở FE
          sortColumn,
          sortDescending,
        });

        const payload = res?.data ?? res;
        let items: any[] = [];

        if (Array.isArray(payload)) {
          items = payload;
        } else if (Array.isArray(payload.items)) {
          items = payload.items;
        } else if (Array.isArray(payload.tasks)) {
          items = payload.tasks;
        }

        // map thêm field id = taskId cho tiện xài chung
        const withId = items.map((x) => ({
          ...x,
          id: x.id || x.taskId,
        }));

        if (!dead) {
          setTasks(withId);
        }
      } catch (err: any) {
        console.error("Error load my tasks:", err);
        if (!dead) {
          toast.error(err?.message || "Failed to load tasks");
          setTasks([]);
        }
      } finally {
        if (!dead) setLoading(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, [sortColumn, sortDescending]);

  // ====== filter + sort + paging (FE) ======
  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();

    let list = tasks.map((t) => {
      const statusCode =
        (t.workflowStatus?.name as string) ||
        (t.status as string) ||
        "";

      const statusCategory = inferStatusCategory(statusCode);
      const updatedAt = t.updatedAt || t.updateAt || t.createAt || t.dueDate || null;

      return {
        ...t,
        statusCode,
        statusCategory,
        updatedAt,
      };
    });

    if (k) {
      list = list.filter((t) =>
        `${t.code} ${t.title}`.toLowerCase().includes(k),
      );
    }

    if (cats.length > 0) {
      list = list.filter((t) => cats.includes(t.statusCategory));
    }

    // sort mặc định theo updatedAt desc để giống board
    list.sort((a, b) => {
      const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return db - da;
    });

    return list;
  }, [tasks, kw, cats]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const CatBtn = ({ v, label }: { v: StatusCategory; label: string }) => {
    const active = cats.includes(v);
    return (
      <button
        onClick={() =>
          setCats((s) => (active ? s.filter((x) => x !== v) : [...s, v]))
        }
        className={cn(
          "px-2.5 h-7 rounded-full text-xs border",
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "border-slate-300 text-slate-700 hover:bg-slate-50",
        )}
      >
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center text-sm text-slate-500">
        Loading tasks…
      </div>
    );
  }

  return (
    <div className="px-0 mt-2 space-y-4">
      {/* ===== Toolbar (search + filter) ===== */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={kw}
              onChange={(e) => {
                setKw(e.target.value);
                setPageIndex(1);
              }}
              className="h-9 pl-9 pr-3 rounded-full border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-[260px]"
              placeholder="Search code/title…"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <CatBtn v="TODO"        label="To do" />
            <CatBtn v="IN_PROGRESS" label="In progress" />
            <CatBtn v="REVIEW"      label="In review" />
            <CatBtn v="DONE"        label="Done" />
          </div>
        </div>
        <div className="text-sm text-slate-600">{filtered.length} tasks</div>
      </div>

      {/* ===== Table ===== */}
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
              {slice.map((t, idx) => {
                const key = `${t.id ?? t.taskId ?? idx}-${idx}`; // <<< fix trùng key
                const statusCategory: StatusCategory = t.statusCategory;
                const statusCode: string = t.statusCode;

                const sla = slaTarget(t.type, t.priority);
                const openedAt = t.openedAt || t.createAt;
                const estimate = t.estimateHours ?? 0;
                const remaining = t.remainingHours ?? estimate;
                const ratio =
                  estimate <= 0 ? 0 : Math.max(0, Math.min(1, 1 - remaining / (estimate || 1)));
                const isDone = statusCategory === "DONE";

                let remain: number | null = null;
                if (sla != null && openedAt) {
                  const diffHours =
                    (Date.now() - new Date(openedAt).getTime()) / 36e5;
                  remain = Math.ceil(sla - Math.max(0, diffHours));
                }

                return (
                  <tr key={key} className={cn("border-b last:border-0", isDone && "opacity-70")}>
                    {/* code + sprint */}
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onViewDetail?.(t)}
                        className="font-semibold text-xs text-blue-600 hover:underline"
                      >
                        {t.code}
                      </button>
                      <div className="text-[11px] text-slate-500">
                        {t.sprint?.name
                          ? t.sprint.name
                          : t.sprintId
                          ? `Sprint ${String(t.sprintId).slice(0, 4)}`
                          : "—"}
                      </div>
                    </td>

                    {/* title + tags */}
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onViewDetail?.(t)}
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
                          {t.priority || "Medium"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                          {t.type || "Task"}
                        </span>
                      </div>
                    </td>

                    {/* assignees */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {(t.members ?? []).slice(0, 3).map((m: any, i: number) => (
                          <div key={`${m.memberId || m.id || i}`} className={i > 0 ? "-ml-2" : ""}>
                            <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-white bg-slate-200 text-[10px] font-semibold text-slate-700 flex items-center justify-center">
                              {m.avatar ? (
                                <img
                                  src={m.avatar}
                                  alt={m.memberName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (m.memberName || "")
                                  .split(" ")
                                  .map((x: string) => x[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase() || "?"
                              )}
                            </div>
                          </div>
                        ))}
                        {Math.max(0, (t.members?.length ?? 0) - 3) > 0 && (
                          <div className="-ml-2 w-6 h-6 rounded-full ring-2 ring-white bg-slate-300 text-[10px] flex items-center justify-center font-semibold text-slate-700">
                            +{Math.max(0, (t.members?.length ?? 0) - 3)}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[240px] mt-1">
                        {(t.members || []).map((a: any) => a.memberName).join(", ") || "Unassigned"}
                      </div>
                    </td>

                    {/* status */}
                    <td className="px-3 py-3 align-top">
                      <div className="capitalize text-sm">
                        {labelFromCode(statusCode || t.status || "")}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {statusCategory.replaceAll("_", " ")}
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
                        {Math.max(0, estimate - remaining)}/{estimate}h
                      </div>
                    </td>

                    {/* due / SLA */}
                    <td className="px-3 py-3 align-top">
                      <div className="text-slate-700">
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </div>
                      {sla != null && !isDone && openedAt && (
                        <div
                          className={cn(
                            "mt-1 text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border",
                            remain! < 0
                              ? "text-rose-700 bg-rose-50 border-rose-200"
                              : remain! <= 12
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-slate-600 bg-slate-50 border-slate-200",
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          {remain! < 0
                            ? `Overdue ${Math.abs(remain!)}h`
                            : `SLA ${remain}h left`}
                        </div>
                      )}
                    </td>

                    {/* updated */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      {t.updatedAt
                        ? new Date(t.updatedAt).toLocaleString("vi-VN")
                        : t.createAt
                        ? new Date(t.createAt).toLocaleString("vi-VN")
                        : "—"}
                    </td>

                    {/* actions (tạm thời chỉ để chỗ, tuỳ bạn nối thêm) */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {!isDone && onEdit && (
                          <button
                            className="px-2 py-1 rounded-lg border text-xs hover:bg-emerald-50 border-emerald-300 text-emerald-700"
                            onClick={() => onEdit(t)}
                          >
                            <Check className="w-3 h-3 inline mr-1" />
                            Done
                          </button>
                        )}

                        {onDelete && (
                          <button
                            className="px-2 py-1 rounded-lg border text-xs hover:bg-violet-50 border-violet-300 text-violet-700"
                            onClick={() => onDelete(t.id)}
                          >
                            <SplitSquareHorizontal className="w-3 h-3 inline mr-1" />
                            Delete
                          </button>
                        )}

                        <button
                          className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50 border-slate-300 text-slate-600"
                          onClick={() => onViewDetail?.(t)}
                        >
                          <MoveDown className="w-3 h-3 inline mr-1" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {slice.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
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
            Showing <b>{slice.length ? (pageIndex - 1) * pageSize + 1 : 0}</b>–
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
                const start = Math.max(1, Math.min(pageIndex - 3, totalPages - 6));
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
};

export default TaskList;
