/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  ListTodo,
  Clock,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";

import { normalizeBoardInput } from "@/mappers/projectBoardMapper";
import { fetchSprintBoard } from "@/services/projectBoardService.js";
import { GetProjectByProjectId } from "@/services/projectService.js";
import type { SprintVm, TaskVm } from "@/types/projectBoard";

/* ===================== Types ===================== */
type ProjectMeta = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
};

type StatusMeta = {
  id: string;
  code?: string;
  name?: string;
  color?: string;
  isFinal?: boolean; // ONLY source of "Completed"
};

type ExportOptions = {
  exportScope: "ALL_TASKS" | "FILTERED_ONLY";
  includeSheets: {
    summary: boolean;
    filters: boolean;
    sprints: boolean;
    tasks: boolean;
    members: boolean;
    statusCatalog: boolean;
  };
};

const DEFAULT_EXPORT: ExportOptions = {
  exportScope: "FILTERED_ONLY",
  includeSheets: {
    summary: true,
    filters: true,
    sprints: true,
    tasks: true,
    members: true,
    statusCatalog: true,
  },
};

/* ===================== Utils ===================== */
const isBrowser = typeof window !== "undefined";
const isNonEmpty = (s?: string | null) => !!(s && String(s).trim());

const fmtDate = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
};

const fmtShortDate = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s).slice(0, 10);
  return d.toLocaleDateString();
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

/** Convert hex to rgba for soft background/border */
function toRgba(color: string, alpha: number) {
  const c = String(color || "").trim();
  if (!c) return "";

  let hex = c.startsWith("#") ? c.slice(1) : c;
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  if (hex.length !== 6) return "";

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "";
  return `rgba(${r},${g},${b},${alpha})`;
}

/** legacy support: statusName vs StatusName */
function getTaskStatusNameLegacy(t: TaskVm): string | undefined {
  return (t as any).statusName ?? (t as any).StatusName ?? undefined;
}

/** basic debounce */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return v;
}

function useClickOutside(ref: React.RefObject<HTMLElement>, onOutside: () => void, enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;

    const handler = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      const target = e.target as Node | null;
      if (!el || !target) return;
      if (el.contains(target)) return;
      onOutside();
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside, enabled]);
}

/* ===================== Paging + Sort ===================== */
type SortDir = "asc" | "desc";
type TaskSortKey = "updatedAt" | "code" | "title" | "priority" | "status" | "sprint";

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  return {
    total,
    totalPages,
    page: safePage,
    pageSize,
    start,
    end,
    pageItems: items.slice(start, end),
  };
}

function Paginator(props: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
}) {
  const opts = props.pageSizeOptions ?? [10, 20, 50];
  const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize));
  const canPrev = props.page > 1;
  const canNext = props.page < totalPages;

  const pageWindow = 5;
  const half = Math.floor(pageWindow / 2);
  const start = Math.max(1, props.page - half);
  const end = Math.min(totalPages, start + pageWindow - 1);
  const start2 = Math.max(1, end - pageWindow + 1);

  const pages = [];
  for (let p = start2; p <= end; p++) pages.push(p);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{props.total ? (props.page - 1) * props.pageSize + 1 : 0}</span>
        {" - "}
        <span className="font-semibold text-slate-700">{Math.min(props.total, props.page * props.pageSize)}</span>
        {" of "}
        <span className="font-semibold text-slate-700">{props.total}</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          value={props.pageSize}
          onChange={(e) => props.onPageSizeChange(Number(e.target.value))}
          title="Rows per page"
        >
          {opts.map((n) => (
            <option key={n} value={n}>
              {n}/page
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => props.onPageChange(1)}
          disabled={!canPrev}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-50"
        >
          First
        </button>

        <button
          type="button"
          onClick={() => props.onPageChange(props.page - 1)}
          disabled={!canPrev}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-50"
        >
          Prev
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => props.onPageChange(p)}
              className={`rounded-full px-3 py-1 font-semibold shadow-sm border ${
                p === props.page
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => props.onPageChange(props.page + 1)}
          disabled={!canNext}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-50"
        >
          Next
        </button>

        <button
          type="button"
          onClick={() => props.onPageChange(totalPages)}
          disabled={!canNext}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}

/* ===================== UI Components ===================== */
function StatCard(props: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
}) {
  const tone = props.tone ?? "slate";
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "red"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold opacity-80">{props.label}</div>
          <div className="text-2xl font-semibold leading-tight">{props.value}</div>
          {props.sub ? <div className="text-xs opacity-80">{props.sub}</div> : null}
        </div>
        <div className="mt-0.5 opacity-90">{props.icon}</div>
      </div>
    </div>
  );
}

/** Pill now supports dynamic status color (hex) */
function Pill(props: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "slate";
  color?: string | null;
  showDot?: boolean;
}) {
  const t = props.tone ?? "slate";
  const cls =
    t === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : t === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : t === "red"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  const hasColor = !!props.color && String(props.color).trim().length > 0;
  const bg = props.color ? toRgba(props.color, 0.12) : "";
  const bd = props.color ? toRgba(props.color, 0.35) : "";

  const style = hasColor
    ? ({
        backgroundColor: bg || undefined,
        borderColor: bd || props.color || undefined,
        color: props.color || undefined,
      } as React.CSSProperties)
    : undefined;

  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${hasColor ? "" : cls}`}
    >
      {props.showDot && props.color ? (
        <span className="inline-block size-2 rounded-full" style={{ backgroundColor: props.color }} />
      ) : null}
      {props.children}
    </span>
  );
}

/** Small, professional modal */
function Modal(props: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; widthClass?: string }) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35" onClick={props.onClose} />
      <div className={`relative w-full ${props.widthClass ?? "max-w-2xl"} rounded-3xl bg-white shadow-xl ring-1 ring-black/5`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-sm font-semibold text-slate-800">{props.title}</div>
          <button type="button" onClick={props.onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{props.children}</div>
      </div>
    </div>
  );
}

/** Searchable select (no external libs) */
function SearchSelect(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; meta?: string }[];
  placeholder?: string;
  widthClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const qd = useDebouncedValue(q, 150);

  const rootRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(rootRef, () => setOpen(false), open);

  const selected = props.options.find((o) => o.value === props.value);
  const filtered = React.useMemo(() => {
    const k = qd.trim().toLowerCase();
    if (!k) return props.options;
    return props.options.filter((o) => `${o.label} ${o.meta ?? ""}`.toLowerCase().includes(k));
  }, [props.options, qd]);

  return (
    <div ref={rootRef} className={props.widthClass ?? ""}>
      <div className="text-xs font-semibold text-slate-600 mb-1">{props.label}</div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        >
          <span className={`truncate ${selected?.label ? "text-slate-800" : "text-slate-400"}`}>
            {selected?.label ?? props.placeholder ?? "Select..."}
          </span>
          {open ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="p-2 border-b border-slate-100">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Search..."
                autoFocus
              />
            </div>

            <div className="max-h-[260px] overflow-auto p-1">
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    props.onChange(o.value);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    o.value === props.value ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">{o.label}</div>
                    {o.meta ? <div className="truncate text-xs text-slate-500">{o.meta}</div> : null}
                  </div>
                  {o.value === props.value ? <Check className="size-4 text-blue-600" /> : <span className="w-4" />}
                </button>
              ))}

              {filtered.length === 0 && <div className="px-3 py-4 text-sm text-slate-500">No options.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== Data Helpers ===================== */
function dedupeAssignees(task: TaskVm) {
  const map = new Map<string, { id: string; name: string; avatarUrl?: string | null }>();
  (task as any).assignees?.forEach((a: any) => {
    if (!a?.id) return;
    map.set(String(a.id), { id: String(a.id), name: a.name ?? "Unknown", avatarUrl: a.avatarUrl ?? null });
  });
  return [...map.values()];
}

function hasAssignee(task: TaskVm, userId: string) {
  return dedupeAssignees(task).some((a) => String(a.id) === String(userId));
}

/** Build unified workflow statuses across sprints */
function buildStatusById(sprints: SprintVm[]) {
  const m = new Map<string, StatusMeta>();
  for (const sp of sprints ?? []) {
    const order = ((sp as any).statusOrder ?? []) as string[];
    const metaMap = ((sp as any).statusMeta ?? {}) as Record<string, StatusMeta>;

    for (const id of order) {
      const meta = metaMap?.[id];
      if (!m.has(id)) {
        m.set(id, {
          id,
          code: meta?.code,
          name: meta?.name,
          color: meta?.color,
          isFinal: meta?.isFinal,
        });
      }
    }

    for (const [id, meta] of Object.entries(metaMap)) {
      if (!m.has(id)) {
        m.set(id, {
          id,
          code: meta?.code,
          name: meta?.name,
          color: meta?.color,
          isFinal: meta?.isFinal,
        });
      }
    }
  }
  return m;
}

function getStatusLabel(t: TaskVm, statusById: Map<string, StatusMeta>) {
  const sid = (t as any).workflowStatusId as string | undefined;
  const meta = sid ? statusById.get(sid) : undefined;
  return meta?.name ?? meta?.code ?? getTaskStatusNameLegacy(t) ?? (t as any).statusCode ?? sid ?? "";
}

function getStatusColor(t: TaskVm, statusById: Map<string, StatusMeta>) {
  const sid = (t as any).workflowStatusId as string | undefined;
  const meta = sid ? statusById.get(sid) : undefined;
  return meta?.color;
}

function isFinalTask(t: TaskVm, statusById: Map<string, StatusMeta>) {
  const sid = (t as any).workflowStatusId as string | undefined;
  const meta = sid ? statusById.get(sid) : undefined;
  return meta?.isFinal === true; // no TODO/DONE category fallback
}

function compareNullable(a: any, b: any) {
  const ax = a ?? "";
  const bx = b ?? "";
  if (ax < bx) return -1;
  if (ax > bx) return 1;
  return 0;
}

function sortTasks(items: TaskVm[], key: TaskSortKey, dir: SortDir, sprintNameById: Map<string, string>, statusById: Map<string, StatusMeta>) {
  const mul = dir === "asc" ? 1 : -1;
  const copy = [...items];
  copy.sort((ta, tb) => {
    const a: any = ta as any;
    const b: any = tb as any;

    if (key === "updatedAt") return mul * compareNullable(String(a.updatedAt ?? ""), String(b.updatedAt ?? ""));
    if (key === "code") return mul * compareNullable(String(a.code ?? ""), String(b.code ?? ""));
    if (key === "title") return mul * compareNullable(String(a.title ?? ""), String(b.title ?? ""));
    if (key === "priority") return mul * compareNullable(String(a.priority ?? ""), String(b.priority ?? ""));
    if (key === "status") return mul * compareNullable(getStatusLabel(ta, statusById), getStatusLabel(tb, statusById));
    if (key === "sprint")
      return (
        mul *
        compareNullable(
          sprintNameById.get(String(a.sprintId ?? "")) ?? "",
          sprintNameById.get(String(b.sprintId ?? "")) ?? ""
        )
      );

    return 0;
  });
  return copy;
}

/* ===================== Excel Export ===================== */
let _xlsx: typeof import("xlsx") | null = null;
async function getXlsx() {
  if (_xlsx) return _xlsx;
  _xlsx = await import("xlsx");
  return _xlsx;
}

function applyCommonSheetSetup(ws: any, colWidths?: number[]) {
  if (colWidths?.length) ws["!cols"] = colWidths.map((wch) => ({ wch }));
  try {
    const range = ws["!ref"];
    if (range) ws["!autofilter"] = { ref: range };
  } catch {
    // ignore
  }
}

function taskColumns() {
  return [
    { label: "Code", get: (t: TaskVm) => (t as any).code ?? "" },
    { label: "Title", get: (t: TaskVm) => (t as any).title ?? "" },
    { label: "Sprint", get: (t: TaskVm) => (t as any).__sprintName ?? "" },
    { label: "Workflow Status", get: (t: TaskVm) => (t as any).__statusLabel ?? "" },
    { label: "IsFinal", get: (t: TaskVm) => ((t as any).__isFinal ? "Yes" : "No") },
    { label: "Assignees", get: (t: TaskVm) => (t as any).__assignees ?? "" },
    { label: "Type", get: (t: TaskVm) => (t as any).type ?? "" },
    { label: "Priority", get: (t: TaskVm) => (t as any).priority ?? "" },
    { label: "Due", get: (t: TaskVm) => fmtShortDate((t as any).dueDate ?? "") },
    { label: "Est(H)", get: (t: TaskVm) => Number((t as any).estimateHours) || 0 },
    { label: "Rem(H)", get: (t: TaskVm) => Number((t as any).remainingHours) || 0 },
    { label: "Updated", get: (t: TaskVm) => fmtDate((t as any).updatedAt ?? "") },
    { label: "CarryOver", get: (t: TaskVm) => (t as any).carryOverCount ?? 0 },
  ] as const;
}

async function exportReportExcel(args: {
  project: { id: string; code?: string; name?: string; description?: string };
  workflowName?: string | null;
  sprints: SprintVm[];
  tasksAll: TaskVm[];
  tasksFiltered: TaskVm[];
  statusById: Map<string, StatusMeta>;
  exportOptions: ExportOptions;
  filtersSnapshot: Record<string, any>;
}) {
  let XLSX: typeof import("xlsx");
  try {
    XLSX = await getXlsx();
  } catch {
    alert('Missing dependency "xlsx". Please install: npm i xlsx');
    return;
  }

  const { project, workflowName, sprints, statusById } = args;
  const selectedTasks = args.exportOptions.exportScope === "FILTERED_ONLY" ? args.tasksFiltered : args.tasksAll;

  const sprintNameById = new Map(sprints.map((s) => [String((s as any).id), String((s as any).name ?? "")]));

  // enrich tasks
  const enriched = selectedTasks.map((t) => {
    const spName = sprintNameById.get(String((t as any).sprintId ?? "")) ?? "";
    const stLabel = getStatusLabel(t, statusById);
    const isFinal = isFinalTask(t, statusById);
    const ass = dedupeAssignees(t).map((a) => a.name).join(", ");
    return Object.assign({}, t, {
      __sprintName: spName,
      __statusLabel: stLabel,
      __isFinal: isFinal,
      __assignees: ass,
    });
  });

  const total = selectedTasks.length;
  const completed = selectedTasks.filter((t) => isFinalTask(t, statusById)).length;
  const completion = total ? Math.round((completed / total) * 100) : 0;

  const sumEst = selectedTasks.reduce((acc, t) => acc + (Number((t as any).estimateHours) || 0), 0);
  const sumRem = selectedTasks.reduce((acc, t) => acc + (Number((t as any).remainingHours) || 0), 0);

  // participants
  const peopleMap = new Map<string, { id: string; name: string; taskCount: number; completedCount: number; est: number; rem: number }>();
  selectedTasks.forEach((t) => {
    dedupeAssignees(t).forEach((a) => {
      const cur = peopleMap.get(a.id) ?? { id: a.id, name: a.name, taskCount: 0, completedCount: 0, est: 0, rem: 0 };
      cur.taskCount += 1;
      if (isFinalTask(t, statusById)) cur.completedCount += 1;
      cur.est += Number((t as any).estimateHours) || 0;
      cur.rem += Number((t as any).remainingHours) || 0;
      peopleMap.set(a.id, cur);
    });
  });
  const participants = [...peopleMap.values()].sort((a, b) => b.taskCount - a.taskCount);

  // status breakdown
  const statusCount = new Map<string, { label: string; count: number; isFinal: boolean }>();
  selectedTasks.forEach((t) => {
    const sid = String((t as any).workflowStatusId ?? "");
    const meta = sid ? statusById.get(sid) : undefined;
    const label = meta?.name ?? meta?.code ?? getTaskStatusNameLegacy(t) ?? (t as any).statusCode ?? sid ?? "—";
    const key = label || "—";
    const cur = statusCount.get(key) ?? { label: key, count: 0, isFinal: meta?.isFinal === true };
    cur.count += 1;
    cur.isFinal = cur.isFinal || meta?.isFinal === true;
    statusCount.set(key, cur);
  });
  const statusRows = [...statusCount.values()].sort((a, b) => b.count - a.count);

  const wb = XLSX.utils.book_new();
  const opt = args.exportOptions.includeSheets;

  // 01 Summary
  if (opt.summary) {
    const sp0 = sprints[0];
    const spN = sprints[sprints.length - 1];

    const highOpen = selectedTasks
      .filter((t) => !isFinalTask(t, statusById))
      .filter((t) => safeStr((t as any).priority).toUpperCase() === "HIGH").length;

    const summaryAOA: any[][] = [
      ["PROJECT REPORT (Dashboard)"],
      [
        `Generated at: ${new Date().toLocaleString()} | Workflow: ${workflowName ?? ""} | Scope: ${
          args.exportOptions.exportScope === "FILTERED_ONLY" ? "Filtered only" : "All tasks"
        }`,
      ],
      [],
      ["Project name", project.name ?? ""],
      ["Project code", project.code ?? project.id],
      ["Timeline", `${fmtShortDate((sp0 as any)?.start ?? "")} → ${fmtShortDate((spN as any)?.end ?? "")}`],
      ["Sprint count", sprints.length],
      ["Total tasks", total],
      ["Completed (final status)", `${completed} (${completion}%)`],
      ["Estimated hours", sumEst],
      ["Remaining hours", sumRem],
      ["Participants", participants.length],
      ["Open HIGH priority", highOpen],
      [],
      ["WORKFLOW STATUS BREAKDOWN"],
      ["Status", "Count", "Rate", "IsFinal"],
      ...statusRows.map((r) => [r.label, r.count, total ? `${Math.round((r.count / total) * 100)}%` : "0%", r.isFinal ? "Yes" : "No"]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryAOA);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      ...Array.from({ length: 10 }, (_, i) => ({ s: { r: 3 + i, c: 1 }, e: { r: 3 + i, c: 7 } })),
      { s: { r: 14, c: 0 }, e: { r: 14, c: 7 } },
    ];
    applyCommonSheetSetup(ws, [28, 46, 14, 14, 14, 14, 14, 14]);
    XLSX.utils.book_append_sheet(wb, ws, "01_Summary");
  }

  // 02 Filters snapshot
  if (opt.filters) {
    const rows = Object.entries(args.filtersSnapshot).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]);
    const ws = XLSX.utils.aoa_to_sheet([["Filters snapshot"], [], ["Key", "Value"], ...rows]);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    applyCommonSheetSetup(ws, [26, 70, 14, 14]);
    XLSX.utils.book_append_sheet(wb, ws, "02_Filters");
  }

  // 03 Sprints
  if (opt.sprints) {
    const sprintRows = sprints.map((sp) => {
      const spTasks = selectedTasks.filter((t) => String((t as any).sprintId ?? "") === String((sp as any).id ?? ""));
      const spCompleted = spTasks.filter((t) => isFinalTask(t, statusById)).length;
      const spEst = spTasks.reduce((acc, t) => acc + (Number((t as any).estimateHours) || 0), 0);
      const spRem = spTasks.reduce((acc, t) => acc + (Number((t as any).remainingHours) || 0), 0);
      const spRate = spTasks.length ? Math.round((spCompleted / spTasks.length) * 100) : 0;

      return {
        Sprint: (sp as any).name ?? "",
        Start: fmtShortDate((sp as any).start ?? ""),
        End: fmtShortDate((sp as any).end ?? ""),
        Tasks: spTasks.length,
        Completed: spCompleted,
        "Completion%": spRate,
        "Est(H)": spEst,
        "Rem(H)": spRem,
      };
    });

    const ws = XLSX.utils.json_to_sheet(sprintRows);
    applyCommonSheetSetup(ws, [22, 12, 12, 10, 12, 12, 12, 12]);
    XLSX.utils.book_append_sheet(wb, ws, "03_Sprints");
  }

  // 04 Tasks
  if (opt.tasks) {
    const cols = taskColumns();
    const rows = enriched.map((t) => {
      const obj: Record<string, any> = {};
      cols.forEach((c) => (obj[c.label] = c.get(t)));
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    applyCommonSheetSetup(ws, cols.map((c) => (c.label.length > 18 ? 24 : Math.max(12, c.label.length + 6))));
    XLSX.utils.book_append_sheet(wb, ws, "04_Tasks");
  }

  // 05 Members
  if (opt.members && participants.length) {
    const peopleRows = participants.map((p) => ({
      Name: p.name,
      "Task count": p.taskCount,
      Completed: p.completedCount,
      "Completion rate": p.taskCount ? `${Math.round((p.completedCount / p.taskCount) * 100)}%` : "0%",
      "Est(H)": p.est,
      "Rem(H)": p.rem,
    }));
    const ws = XLSX.utils.json_to_sheet(peopleRows);
    applyCommonSheetSetup(ws, [26, 12, 12, 16, 12, 12]);
    XLSX.utils.book_append_sheet(wb, ws, "05_Members");
  }

  // 06 Status catalog
  if (opt.statusCatalog) {
    const rows = [...statusById.values()]
      .map((s) => ({
        Id: s.id,
        Code: s.code ?? "",
        Name: s.name ?? "",
        IsFinal: s.isFinal === true ? "Yes" : "No",
        Color: s.color ?? "",
      }))
      .sort((a, b) => a.Name.localeCompare(b.Name));

    const ws = XLSX.utils.json_to_sheet(rows);
    applyCommonSheetSetup(ws, [36, 18, 30, 10, 16]);
    XLSX.utils.book_append_sheet(wb, ws, "06_StatusCatalog");
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const safeName = (project.code ?? project.id).replace(/[^\w\-]+/g, "_");
  a.download = `ProjectReport_${safeName}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ===================== Page ===================== */
export default function ProjectClosureReportPage() {
  const navigate = useNavigate();
  const { projectId = "project-1", companyId } = useParams<{ projectId: string; companyId: string }>();

  const [loading, setLoading] = React.useState(true);
  const [projectMeta, setProjectMeta] = React.useState<ProjectMeta | null>(null);
  const [sprints, setSprints] = React.useState<SprintVm[]>([]);
  const [tasks, setTasks] = React.useState<TaskVm[]>([]);
  const [workflowName, setWorkflowName] = React.useState<string | null>(null);

  // Filters
  const [query, setQuery] = React.useState("");
  const qDebounced = useDebouncedValue(query, 250);

  const [sprintFilter, setSprintFilter] = React.useState<string>("ALL");
  const [statusIdFilter, setStatusIdFilter] = React.useState<string>("ALL"); // workflowStatusId
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("ALL"); // ALL / UNASSIGNED / userId
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  // Sorting
  const [sortKey, setSortKey] = React.useState<TaskSortKey>("updatedAt");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // paging
  const [completedPage, setCompletedPage] = React.useState(1);
  const [completedPageSize, setCompletedPageSize] = React.useState(10);

  const [listPage, setListPage] = React.useState(1);
  const [listPageSize, setListPageSize] = React.useState(20);

  const [memberPage, setMemberPage] = React.useState(1);
  const [memberPageSize, setMemberPageSize] = React.useState(10);

  // Export UX
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportOptions, setExportOptions] = React.useState<ExportOptions>(DEFAULT_EXPORT);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [boardRaw, projRaw] = await Promise.all([fetchSprintBoard(projectId), GetProjectByProjectId(projectId)]);
        const normalized = normalizeBoardInput(boardRaw ?? {});
        if (!alive) return;

        setSprints(normalized.sprints ?? []);
        setTasks(normalized.tasks ?? []);
        setWorkflowName((boardRaw as any)?.workflow?.name ?? null);

        const p = ((projRaw as any)?.data ?? projRaw ?? {}) as ProjectMeta;
        setProjectMeta(p);
      } catch (e) {
        console.error("Failed to load report:", e);
        if (!alive) return;
        setSprints([]);
        setTasks([]);
        setWorkflowName(null);
        setProjectMeta(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  const statusById = React.useMemo(() => buildStatusById(sprints), [sprints]);
  const sprintNameById = React.useMemo(() => new Map(sprints.map((s) => [String((s as any).id), String((s as any).name ?? "")])), [sprints]);

  const sprintOptions = React.useMemo(
    () => [
      { value: "ALL", label: "All sprints" },
      ...sprints.map((sp) => ({ value: String((sp as any).id), label: String((sp as any).name ?? "Sprint") })),
    ],
    [sprints]
  );

  const statusOptions = React.useMemo(() => {
    const base = [{ value: "ALL", label: "All workflow statuses" }];
    const rest = [...statusById.values()]
      .map((s) => ({
        value: s.id,
        label: s.name ?? s.code ?? s.id,
        meta: s.isFinal === true ? "final" : "",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [...base, ...rest];
  }, [statusById]);

  const assigneeOptions = React.useMemo(() => {
    const m = new Map<string, string>();
    (tasks ?? []).forEach((t) => {
      dedupeAssignees(t).forEach((a) => m.set(String(a.id), a.name));
    });
    const people = [...m.entries()].map(([id, name]) => ({ value: id, label: name })).sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: "ALL", label: "All assignees" }, { value: "UNASSIGNED", label: "Unassigned" }, ...people];
  }, [tasks]);

  const typeOptions = React.useMemo(() => {
    const set = new Set<string>();
    (tasks ?? []).forEach((t) => {
      const v = safeStr((t as any).type);
      if (v) set.add(v);
    });
    const arr = [...set.values()].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));
    return [{ value: "ALL", label: "All types" }, ...arr];
  }, [tasks]);

  const priorityOptions = React.useMemo(() => {
    const set = new Set<string>();
    (tasks ?? []).forEach((t) => {
      const v = safeStr((t as any).priority);
      if (v) set.add(v);
    });
    const arr = [...set.values()].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));
    return [{ value: "ALL", label: "All priorities" }, ...arr];
  }, [tasks]);

  // computed lists
  const filteredTasks = React.useMemo(() => {
    const k = qDebounced.trim().toLowerCase();

    const base = (tasks ?? []).filter((t) => {
      const code = String((t as any).code ?? "");
      const title = String((t as any).title ?? "");
      const sid = String((t as any).sprintId ?? "");
      const wsid = String((t as any).workflowStatusId ?? "");
      const pr = String((t as any).priority ?? "");
      const ty = String((t as any).type ?? "");

      const okQuery = !k || `${code} ${title}`.toLowerCase().includes(k);
      const okSprint = sprintFilter === "ALL" || sid === sprintFilter;
      const okStatus = statusIdFilter === "ALL" || wsid === statusIdFilter;

      const okPriority = priorityFilter === "ALL" || safeStr(pr).toUpperCase() === safeStr(priorityFilter).toUpperCase();
      const okType = typeFilter === "ALL" || ty === typeFilter;

      const okAssignee =
        assigneeFilter === "ALL"
          ? true
          : assigneeFilter === "UNASSIGNED"
          ? dedupeAssignees(t).length === 0
          : hasAssignee(t, assigneeFilter);

      return okQuery && okSprint && okStatus && okAssignee && okPriority && okType;
    });

    return sortTasks(base, sortKey, sortDir, sprintNameById, statusById);
  }, [tasks, qDebounced, sprintFilter, statusIdFilter, assigneeFilter, priorityFilter, typeFilter, sortKey, sortDir, sprintNameById, statusById]);

  // reset paging when filter changes
  React.useEffect(() => {
    setListPage(1);
  }, [qDebounced, sprintFilter, statusIdFilter, assigneeFilter, priorityFilter, typeFilter, sortKey, sortDir]);

  React.useEffect(() => {
    setCompletedPage(1);
    setMemberPage(1);
  }, [tasks, sprints]);

  // KPI (ALL tasks)
  const total = tasks.length;
  const completed = tasks.filter((t) => isFinalTask(t, statusById)).length;
  const completion = total ? Math.round((completed / total) * 100) : 0;

  const estHours = tasks.reduce((acc, t) => acc + (Number((t as any).estimateHours) || 0), 0);
  const remHours = tasks.reduce((acc, t) => acc + (Number((t as any).remainingHours) || 0), 0);

  const participants = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; taskCount: number; completedCount: number; est: number; rem: number }>();
    (tasks ?? []).forEach((t) => {
      dedupeAssignees(t).forEach((a) => {
        const cur = map.get(a.id) ?? { id: a.id, name: a.name, taskCount: 0, completedCount: 0, est: 0, rem: 0 };
        cur.taskCount += 1;
        if (isFinalTask(t, statusById)) cur.completedCount += 1;
        cur.est += Number((t as any).estimateHours) || 0;
        cur.rem += Number((t as any).remainingHours) || 0;
        map.set(a.id, cur);
      });
    });
    return [...map.values()].sort((a, b) => b.taskCount - a.taskCount);
  }, [tasks, statusById]);

  const completedTasks = React.useMemo(() => tasks.filter((t) => isFinalTask(t, statusById)), [tasks, statusById]);

  const openHighPriority = React.useMemo(
    () =>
      tasks
        .filter((t) => !isFinalTask(t, statusById))
        .filter((t) => safeStr((t as any).priority).toUpperCase() === "HIGH")
        .slice(0, 10),
    [tasks, statusById]
  );

  const statusBreakdown = React.useMemo(() => {
    const map = new Map<string, { id?: string; label: string; count: number; isFinal: boolean; color?: string }>();

    tasks.forEach((t) => {
      const sid = String((t as any).workflowStatusId ?? "");
      const meta = sid ? statusById.get(sid) : undefined;

      const label = meta?.name ?? meta?.code ?? getTaskStatusNameLegacy(t) ?? (t as any).statusCode ?? sid ?? "—";
      const key = sid || label || "—";

      const cur = map.get(key) ?? { id: sid || undefined, label: label || "—", count: 0, isFinal: meta?.isFinal === true, color: meta?.color };
      cur.count += 1;
      cur.isFinal = cur.isFinal || meta?.isFinal === true;
      if (!cur.color && meta?.color) cur.color = meta.color;

      map.set(key, cur);
    });

    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [tasks, statusById]);

  // paging views
  const completedPaged = React.useMemo(() => paginate(completedTasks, completedPage, completedPageSize), [completedTasks, completedPage, completedPageSize]);
  const listPaged = React.useMemo(() => paginate(filteredTasks, listPage, listPageSize), [filteredTasks, listPage, listPageSize]);
  const memberPaged = React.useMemo(() => paginate(participants, memberPage, memberPageSize), [participants, memberPage, memberPageSize]);

  if (loading) return <div className="p-8 text-sm text-slate-600">Loading report…</div>;

  const projectName = projectMeta?.name ?? projectMeta?.code ?? "Project Report";
  const projectDesc = projectMeta?.description ?? "";
  const projectCode = projectMeta?.code ?? projectId;

  const filtersSnapshot = {
    query: qDebounced,
    sprintFilter,
    statusIdFilter,
    assigneeFilter,
    priorityFilter,
    typeFilter,
    sortKey,
    sortDir,
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden">
      {/* HEADER */}
      <div className="relative mx-4 mt-4 mb-3 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 px-8 py-6 text-white border border-blue-300/40">
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.7),transparent_60%)]" />
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-[56%]">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/90">
              <ClipboardCheck className="size-4" />
              <span>Project Report</span>
              <span className="opacity-80">•</span>
              <span className="opacity-90">Workflow: {workflowName ?? "—"}</span>
            </div>

            <h1 className="text-2xl font-semibold leading-tight">{projectName}</h1>
            <p className="text-sm text-white/85 line-clamp-2">
              {isNonEmpty(projectDesc) ? projectDesc : "Dashboard-like overview based on sprints/tasks."}
            </p>

          
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
        


            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white text-blue-700 px-4 py-2 text-xs font-semibold shadow-md transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <FileSpreadsheet className="size-4" />
              <span>Export Excel</span>
              <Download className="size-4 opacity-80" />
            </button>

            {companyId && projectId && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-3 py-2 text-[11px] font-medium text-white/95 backdrop-blur-sm transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => navigate(`/companies/${companyId}/project/${projectId}/detail`)}
              >
                <BarChart3 className="size-3.5" />
                <span>Detail</span>
              </button>
            )}
          </div>
        </div>

        {/* progress bar */}
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs text-white/85 mb-1">
            <span>Completion</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white/85" style={{ width: `${clamp(completion, 0, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="mx-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<ListTodo className="size-5" />} label="Total tasks" value={total} sub={`Sprints: ${sprints.length}`} tone="blue" />
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Completed (final)" value={completed} sub={`${completion}%`} tone="green" />
        <StatCard icon={<Clock className="size-5" />} label="Estimated (hours)" value={estHours.toFixed(1)} sub={`Remaining: ${remHours.toFixed(1)}h`} tone="amber" />
        <StatCard icon={<Users className="size-5" />} label="Participants" value={participants.length} sub="From task assignees" tone="slate" />
        <StatCard icon={<AlertTriangle className="size-5" />} label="Open HIGH priority" value={openHighPriority.length} sub="Top 10 list below" tone="red" />
      </div>

      <section className="mx-4 mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-slate-600" />
                <div className="text-sm font-semibold text-slate-800">Filters</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSprintFilter("ALL");
                  setStatusIdFilter("ALL");
                  setAssigneeFilter("ALL");
                  setPriorityFilter("ALL");
                  setTypeFilter("ALL");
                  setSortKey("updatedAt");
                  setSortDir("desc");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-slate-600 mb-1">Search</div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Search by code/title…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <SearchSelect label="Sprint" value={sprintFilter} onChange={setSprintFilter} options={sprintOptions} placeholder="All sprints" />

              <SearchSelect label="Workflow status" value={statusIdFilter} onChange={setStatusIdFilter} options={statusOptions} placeholder="All workflow statuses" />

              <SearchSelect label="Assignee" value={assigneeFilter} onChange={setAssigneeFilter} options={assigneeOptions} placeholder="All assignees" />

              <SearchSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} placeholder="All priorities" />

              <SearchSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={typeOptions} placeholder="All types" widthClass="md:col-span-2" />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                Matching: <span className="font-semibold text-slate-700">{filteredTasks.length}</span> tasks
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-slate-600">Sort</div>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as TaskSortKey)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="updatedAt">Updated</option>
                  <option value="code">Code</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="sprint">Sprint</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {sortDir === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
            </div>
          </div>

          {/* Completed Tasks (paged) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Completed tasks (final statuses)</div>
              <div className="text-xs text-slate-500">{completedTasks.length} tasks</div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Sprint</th>
                    <th className="py-2 pr-3">Workflow status</th>
                    <th className="py-2 pr-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {completedPaged.pageItems.map((t) => {
                    const label = getStatusLabel(t, statusById) || "—";
                    const color = getStatusColor(t, statusById);
                    return (
                      <tr key={String((t as any).id)} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 font-semibold text-slate-700">{String((t as any).code ?? "")}</td>
                        <td className="py-2 pr-3 text-slate-800">{String((t as any).title ?? "")}</td>
                        <td className="py-2 pr-3 text-slate-600">{sprintNameById.get(String((t as any).sprintId ?? "")) ?? "—"}</td>
                        <td className="py-2 pr-3">
                          <Pill tone="green" color={color} showDot>
                            {label}
                          </Pill>
                        </td>
                        <td className="py-2 pr-3 text-slate-500">{fmtDate((t as any).updatedAt ?? "")}</td>
                      </tr>
                    );
                  })}
                  {completedTasks.length === 0 && (
                    <tr>
                      <td className="py-3 text-slate-500" colSpan={5}>
                        No final-status tasks found (isFinal=true).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Paginator
                total={completedPaged.total}
                page={completedPaged.page}
                pageSize={completedPaged.pageSize}
                onPageChange={setCompletedPage}
                onPageSizeChange={(s) => {
                  setCompletedPageSize(s);
                  setCompletedPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </div>

          {/* Tasks (filtered) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Tasks (filtered)</div>
              <div className="text-xs text-slate-500">{filteredTasks.length} tasks</div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Sprint</th>
                    <th className="py-2 pr-3">Workflow status</th>
                    <th className="py-2 pr-3">Assignees</th>
                    <th className="py-2 pr-3">Priority</th>
                    <th className="py-2 pr-3">Est</th>
                    <th className="py-2 pr-3">Rem</th>
                  </tr>
                </thead>
                <tbody>
                  {listPaged.pageItems.map((t) => {
                    const ass = dedupeAssignees(t);
                    const final = isFinalTask(t, statusById);
                    const statusLabel = getStatusLabel(t, statusById) ?? "—";
                    const color = getStatusColor(t, statusById);

                    return (
                      <tr key={String((t as any).id)} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 font-semibold text-slate-700">{String((t as any).code ?? "")}</td>
                        <td className="py-2 pr-3 text-slate-800">{String((t as any).title ?? "")}</td>
                        <td className="py-2 pr-3 text-slate-600">{sprintNameById.get(String((t as any).sprintId ?? "")) ?? "—"}</td>
                        <td className="py-2 pr-3">
                          <Pill tone={final ? "green" : "slate"} color={color} showDot>
                            {statusLabel}
                          </Pill>
                        </td>
                        <td className="py-2 pr-3 text-slate-700">
                          {ass.length ? ass.map((a) => a.name).join(", ") : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-2 pr-3 text-slate-700">{String((t as any).priority ?? "—")}</td>
                        <td className="py-2 pr-3 text-slate-700">{Number((t as any).estimateHours) || 0}</td>
                        <td className="py-2 pr-3 text-slate-700">{Number((t as any).remainingHours) || 0}</td>
                      </tr>
                    );
                  })}

                  {filteredTasks.length === 0 && (
                    <tr>
                      <td className="py-3 text-slate-500" colSpan={8}>
                        No tasks match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Paginator
                total={listPaged.total}
                page={listPaged.page}
                pageSize={listPaged.pageSize}
                onPageChange={setListPage}
                onPageSizeChange={(s) => {
                  setListPageSize(s);
                  setListPage(1);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>

          {/* High Priority Open */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              <div className="text-sm font-semibold text-slate-800">High priority tasks not completed</div>
              <div className="text-xs text-slate-500">(Top 10)</div>
            </div>

            <div className="mt-3 space-y-2">
              {openHighPriority.length ? (
                openHighPriority.map((t) => {
                  const label = getStatusLabel(t, statusById) || "—";
                  const color = getStatusColor(t, statusById);

                  return (
                    <div key={String((t as any).id)} className="rounded-2xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {String((t as any).code ?? "")} • {String((t as any).title ?? "")}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Sprint: {sprintNameById.get(String((t as any).sprintId ?? "")) ?? "—"}</span>
                            <span className="opacity-60">•</span>
                            <span>Status:</span>
                            <Pill color={color} showDot>
                              {label}
                            </Pill>
                          </div>
                        </div>

                        <Pill tone="red">HIGH</Pill>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500">No open HIGH priority tasks.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Status Breakdown */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Workflow status breakdown</div>
              <div className="text-xs text-slate-500">{statusBreakdown.length} statuses</div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b">
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Count</th>
                    <th className="py-2 pr-3">Rate</th>
                    <th className="py-2 pr-3">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {statusBreakdown.slice(0, 12).map((s) => (
                    <tr key={s.id ?? s.label} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        <Pill color={s.color} showDot>
                          {s.label}
                        </Pill>
                      </td>
                      <td className="py-2 pr-3 text-slate-700">{s.count}</td>
                      <td className="py-2 pr-3 text-slate-700">{total ? `${Math.round((s.count / total) * 100)}%` : "0%"}</td>
                      <td className="py-2 pr-3">{s.isFinal ? <Pill tone="green">Yes</Pill> : <Pill tone="slate">No</Pill>}</td>
                    </tr>
                  ))}
                  {statusBreakdown.length === 0 && (
                    <tr>
                      <td className="py-3 text-slate-500" colSpan={4}>
                        No statuses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Participants (paged) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Participants</div>
              <div className="text-xs text-slate-500">{participants.length} people</div>
            </div>

            <div className="mt-3 space-y-2">
              {memberPaged.pageItems.map((p) => {
                const rate = p.taskCount ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
                return (
                  <div key={p.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          Tasks: {p.taskCount} • Completed: {p.completedCount} • Rate: {rate}%
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {p.est.toFixed(0)}h / {p.rem.toFixed(0)}h
                      </div>
                    </div>
                  </div>
                );
              })}

              {participants.length === 0 && <div className="text-sm text-slate-500">No assignees found in tasks.</div>}

              <Paginator
                total={memberPaged.total}
                page={memberPaged.page}
                pageSize={memberPaged.pageSize}
                onPageChange={setMemberPage}
                onPageSizeChange={(s) => {
                  setMemberPageSize(s);
                  setMemberPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="h-10" />

      {/* Export modal */}
      <Modal open={exportOpen} title="Export Excel" onClose={() => setExportOpen(false)} widthClass="max-w-3xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-800 mb-2">Scope</div>
            <select
              value={exportOptions.exportScope}
              onChange={(e) => setExportOptions((s) => ({ ...s, exportScope: e.target.value as any }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="FILTERED_ONLY">Filtered tasks only</option>
              <option value="ALL_TASKS">All tasks</option>
            </select>

            <div className="mt-2 text-xs text-slate-500">
              Export includes dashboard sheets (no role / no acceptance / no quick actions).
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-800 mb-2">Include sheets</div>

            {(
              [
                ["summary", "01_Summary"],
                ["filters", "02_Filters"],
                ["sprints", "03_Sprints"],
                ["tasks", "04_Tasks"],
                ["members", "05_Members"],
                ["statusCatalog", "06_StatusCatalog"],
              ] as const
            ).map(([k, label]) => {
              const checked = (exportOptions.includeSheets as any)[k] as boolean;
              return (
                <label key={k} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                  <span className="font-medium text-slate-800">{label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setExportOptions((s) => ({ ...s, includeSheets: { ...s.includeSheets, [k]: e.target.checked } }))}
                    className="size-4"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(false)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={async () => {
              await exportReportExcel({
                project: { id: projectId, code: projectCode, name: projectName, description: projectDesc },
                workflowName,
                sprints,
                tasksAll: tasks,
                tasksFiltered: filteredTasks,
                statusById,
                exportOptions,
                filtersSnapshot,
              });
              setExportOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Download className="size-4" />
            Export now
          </button>
        </div>
      </Modal>
    </div>
  );
}
