import React, { useMemo } from "react";
import type { SprintVm, TaskVm } from "@/types/projectBoard";

type Row = {
  sprintId: string;
  name: string;
  startMs: number;

  totalTasks: number;
  doneTasks: number;
  completionPct: number;

  totalPts: number;
  donePts: number;
  avgPtsPerTask: number;

  bugTasks: number;
  bugRatioPct: number;

  spilloverTasks: number;
};

function taskPoints(t: TaskVm) {
  return Math.max(0, Number(t.storyPoints ?? 0));
}

function isBug(t: TaskVm) {
  const raw = String((t as any).type ?? "").toLowerCase();
  return raw.includes("bug");
}

function buildRows(sprints: SprintVm[], tasks: TaskVm[]): Row[] {
  if (!sprints?.length) return [];

  const byId = new Map<
    string,
    {
      sprintId: string;
      name: string;
      startMs: number;
      totalTasks: number;
      doneTasks: number;
      totalPts: number;
      donePts: number;
      bugTasks: number;
    }
  >();

  for (const s of sprints) {
    const startMs = s.start ? new Date(s.start).getTime() : 0;
    byId.set(s.id, {
      sprintId: s.id,
      name: s.name,
      startMs,
      totalTasks: 0,
      doneTasks: 0,
      totalPts: 0,
      donePts: 0,
      bugTasks: 0,
    });
  }

  for (const t of tasks ?? []) {
    const sid = (t.sprintId ?? "") as string;
    const rec = byId.get(sid);
    if (!rec) continue;

    const pts = taskPoints(t);

    rec.totalTasks += 1;
    rec.totalPts += pts;

    if (t.statusCategory === "DONE") {
      rec.doneTasks += 1;
      rec.donePts += pts;
    }

    if (isBug(t)) rec.bugTasks += 1;
  }

  return Array.from(byId.values())
    .filter((x) => x.totalTasks > 0 || x.totalPts > 0)
    .sort((a, b) => a.startMs - b.startMs)
    .map((x) => {
      const completionPct =
        x.totalTasks > 0 ? Math.round((x.doneTasks / x.totalTasks) * 100) : 0;

      const avgPtsPerTask =
        x.totalTasks > 0 ? Math.round((x.totalPts / x.totalTasks) * 10) / 10 : 0;

      const bugRatioPct =
        x.totalTasks > 0 ? Math.round((x.bugTasks / x.totalTasks) * 100) : 0;

      const spilloverTasks = Math.max(0, x.totalTasks - x.doneTasks);

      return {
        ...x,
        completionPct,
        avgPtsPerTask,
        bugRatioPct,
        spilloverTasks,
      };
    });
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({
  value,
  tone,
}: {
  value: React.ReactNode;
  tone: "green" | "amber" | "rose" | "slate";
}) {
  const cls =
    tone === "green"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : tone === "amber"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : tone === "rose"
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs", cls)}>
      {value}
    </span>
  );
}

export default function SprintKpiTable({
  sprints,
  tasks,
  className,
  title = "Sprint KPI table",
  subtitle = "Throughput & quality per sprint (completion, bug ratio, spillover, point distribution).",
}: {
  sprints: SprintVm[];
  tasks: TaskVm[];
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  const rows = useMemo(() => buildRows(sprints, tasks), [sprints, tasks]);

  const avgCompletion =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + (r.completionPct || 0), 0) / rows.length)
      : 0;

  const avgBugRatio =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + (r.bugRatioPct || 0), 0) / rows.length)
      : 0;

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-slate-800 text-sm font-semibold">{title}</div>
        </div>

        {rows.length > 0 && (
          <div className="text-right text-[11px] text-slate-500">
            <div>
              Avg completion: <span className="font-semibold">{avgCompletion}%</span>
            </div>
            <div>
              Avg bug ratio: <span className="font-semibold">{avgBugRatio}%</span>
            </div>
          </div>
        )}
      </div>

      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[1020px] w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b">
                <th className="text-left py-2 pr-3">Sprint</th>
                <th className="text-right py-2 px-3">Tasks</th>
                <th className="text-right py-2 px-3">Done</th>
                <th className="text-right py-2 px-3">Completion</th>
                <th className="text-right py-2 px-3">Total pts</th>
                <th className="text-right py-2 px-3">Done pts</th>
                <th className="text-right py-2 px-3">Avg pts/task</th>
                <th className="text-right py-2 px-3">Bug ratio</th>
                <th className="text-right py-2 pl-3">Spillover</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const completionTone =
                  r.completionPct >= 80 ? "green" : r.completionPct >= 50 ? "amber" : "rose";

                const bugTone =
                  r.bugRatioPct >= 40 ? "rose" : r.bugRatioPct >= 20 ? "amber" : "slate";

                const spillTone = r.spilloverTasks >= 5 ? "rose" : r.spilloverTasks >= 2 ? "amber" : "slate";

                return (
                  <tr key={r.sprintId} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 font-medium text-slate-800">{r.name}</td>

                    <td className="py-2 px-3 text-right tabular-nums">{r.totalTasks}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.doneTasks}</td>

                    <td className="py-2 px-3 text-right">
                      <Pill value={`${r.completionPct}%`} tone={completionTone} />
                    </td>

                    <td className="py-2 px-3 text-right tabular-nums">{r.totalPts}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.donePts}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{r.avgPtsPerTask}</td>

                    <td className="py-2 px-3 text-right">
                      <Pill value={`${r.bugRatioPct}%`} tone={bugTone} />
                    </td>

                    <td className="py-2 pl-3 text-right">
                      <Pill value={r.spilloverTasks} tone={spillTone as any} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

     
        </div>
      ) : (
        <div className="h-[120px] flex items-center justify-center text-sm text-slate-500">
          No sprint KPI data yet.
        </div>
      )}
    </div>
  );
}
