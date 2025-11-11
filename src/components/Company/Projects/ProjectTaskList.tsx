import React, { useMemo, useState } from "react";
import { Search, Clock, Check, MoveRight, MoveDown, SplitSquareHorizontal } from "lucide-react";
import type { TaskVm, StatusCategory } from "@/types/projectBoard";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/* === SLA đơn giản === */
const SLA: Array<{ type: TaskVm["type"]; priority: TaskVm["priority"]; h: number }> = [
  { type: "Bug", priority: "Urgent", h: 24 }, { type: "Bug", priority: "High", h: 48 }, { type: "Bug", priority: "Medium", h: 72 },
  { type: "Feature", priority: "Urgent", h: 72 }, { type: "Feature", priority: "High", h: 120 }, { type: "Feature", priority: "Medium", h: 168 },
  { type: "Feature", priority: "Low", h: 336 }, { type: "Chore", priority: "Low", h: 336 },
];
const slaTarget = (t: TaskVm) => SLA.find(x => x.type === t.type && x.priority === t.priority)?.h ?? null;

const labelFromCode = (code: string) =>
  code === "inprogress" ? "In progress" : code === "inreview" ? "In review" : code === "todo" ? "To do" : code === "done" ? "Done" : code;

/* === main === */
export default function ProjectTaskList({
  tasks,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
}: {
  tasks: TaskVm[];
  onMarkDone?: (t: TaskVm) => void;
  onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void;
  onMoveNext?: (t: TaskVm) => void;
}) {
  // quick filter: search + category pills + pagination
  const [kw, setKw] = useState("");
  const [cats, setCats] = useState<Array<StatusCategory>>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    let list = tasks.filter(t => (!k || `${t.code} ${t.title}`.toLowerCase().includes(k)));
    if (cats.length) list = list.filter(t => cats.includes(t.statusCategory));
    // sort mặc định: updated desc
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
          active ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="px-8 mt-5 space-y-4">
      {/* toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={kw}
              onChange={(e) => { setKw(e.target.value); setPageIndex(1); }}
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

      {/* table */}
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
                  target == null ? null : Math.ceil(target - Math.max(0, (new Date().getTime() - new Date(t.openedAt).getTime()) / 36e5));
                const overdue = remain != null && remain < 0;
                const ratio = Math.max(0, Math.min(1, (t.estimateHours || 0) === 0 ? 0 : 1 - (t.remainingHours ?? 0) / (t.estimateHours || 1)));
                const isDone = t.statusCategory === "DONE";

                return (
                  <tr key={t.id} className={cn("border-b last:border-0", isDone && "opacity-70")}>
                    {/* code + sprint */}
                    <td className="px-3 py-3 align-top">
                      <div className="font-semibold text-slate-700">{t.code}</div>
                      <div className="text-[11px] text-slate-500">Sprint {t.sprintId?.split("-")[1] ?? "—"}</div>
                    </td>

                    {/* title + tags */}
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium">{t.title}</div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border",
                          t.priority === "Urgent" ? "bg-rose-50 text-rose-700 border-rose-200"
                            : t.priority === "High" ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
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
                        {(t.assignees ?? []).slice(0, 3).map((m, i) => (
                          <div key={m.id} className={i > 0 ? "-ml-2" : ""}>
                            <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-white bg-slate-200 text-[10px] font-semibold text-slate-700 flex items-center justify-center">
                              {m.avatarUrl ? (
                                <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                (m.name.split(" ").map(x => x[0]).slice(0, 2).join("") || "?").toUpperCase()
                              )}
                            </div>
                          </div>
                        ))}
                        {Math.max(0, (t.assignees?.length ?? 0) - 3) > 0 && (
                          <div className="-ml-2 w-6 h-6 rounded-full ring-2 ring-white bg-slate-300 text-[10px] flex items-center justify-center font-semibold text-slate-700">
                            +{Math.max(0, (t.assignees?.length ?? 0) - 3)}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[240px] mt-1">
                        {(t.assignees || []).map((a) => a.name).join(", ") || "Unassigned"}
                      </div>
                    </td>

                    {/* status */}
                    <td className="px-3 py-3 align-top">
                      <div className="capitalize text-sm">{labelFromCode(t.statusCode)}</div>
                      <div className="text-[11px] text-slate-500">{t.statusCategory.replaceAll("_", " ")}</div>
                    </td>

                    {/* progress */}
                    <td className="px-3 py-3 align-top">
                      <div className="h-2 w-[150px] bg-slate-100 rounded">
                        <div className="h-2 rounded" style={{ width: `${Math.round(ratio * 100)}%`, background: brand }} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {Math.max(0, (t.estimateHours ?? 0) - (t.remainingHours ?? 0))}/{t.estimateHours ?? 0}h
                      </div>
                    </td>

                    {/* due / SLA */}
                    <td className="px-3 py-3 align-top">
                      <div className="text-slate-700">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</div>
                      {target != null && !isDone && (
                        <div
                          className={cn(
                            "mt-1 text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border",
                            remain! < 0
                              ? "text-rose-700 bg-rose-50 border-rose-200"
                              : remain! <= 12
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-slate-600 bg-slate-50 border-slate-200"
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          {remain! < 0 ? `Overdue ${Math.abs(remain!)}h` : `SLA ${remain}h left`}
                        </div>
                      )}
                    </td>

                    {/* updated */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      {new Date(t.updatedAt).toLocaleString()}
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
                        {!isDone && (
                          <button
                            className="px-2 py-1 rounded-lg border text-xs hover:bg-blue-50 border-blue-300 text-blue-700"
                            onClick={() => onNext?.(t)}
                          >
                            <MoveRight className="w-3 h-3 inline mr-1" />
                            Next
                          </button>
                        )}
                        <button
                          className="px-2 py-1 rounded-lg border text-xs hover:bg-violet-50 border-violet-300 text-violet-700"
                          onClick={() => onSplit?.(t)}
                        >
                          <SplitSquareHorizontal className="w-3 h-3 inline mr-1" />
                          Split
                        </button>
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
            <b>{Math.min(pageIndex * pageSize, filtered.length)}</b> of <b>{filtered.length}</b>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(1); }}
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
                      active ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
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
