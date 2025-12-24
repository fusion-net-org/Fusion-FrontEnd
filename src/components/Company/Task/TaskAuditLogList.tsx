/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import actionsMeta from "@/static/taskLogActions.json";
import { getTaskLogEvents } from "@/services/taskLogService.js";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Workflow,
  ArrowLeftRight,
  CalendarDays,
  Split,
  Ticket,
  Paperclip,
  MessageSquare,
  Shield,
} from "lucide-react";

type LogVm = {
  id?: number | string;
  taskId?: string;
  actorId?: string | null;
  actor?: any; // BE include Actor
  actorName?: string | null;
  actorEmail?: string | null;

  action?: string | null;
  changedCols?: string | null;
  metadata?: any;
  oldRow?: string | null;
  newRow?: string | null;

  isView?: boolean;
  createdAt?: string;
  createAt?: string;
  createdOn?: string;
};

const ICONS: Record<string, any> = {
  Eye,
  Plus,
  Edit3,
  Trash2,
  Workflow,
  ArrowLeftRight,
  CalendarDays,
  Split,
  Ticket,
  Paperclip,
  MessageSquare,
  Shield,
};

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

function safeIso(log: LogVm) {
  return log.createdAt || (log as any).createAt || (log as any).createdOn || "";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDateTimeFull(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}


function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function tryParseMeta(meta: any) {
  if (!meta) return null;
  if (typeof meta === "object") return meta;
  if (typeof meta !== "string") return null;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

function splitChangedCols(changedCols?: string | null) {
  if (!changedCols) return [];
  return String(changedCols)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function initials(name?: string) {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0][0]?.toUpperCase() ?? "?";
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function catBadgeClasses(cat?: string) {
  const c = String(cat || "other").toLowerCase();
  if (c.includes("status") || c.includes("workflow")) return "bg-violet-50 border-violet-200 text-violet-700";
  if (c.includes("comment")) return "bg-sky-50 border-sky-200 text-sky-700";
  if (c.includes("attachment") || c.includes("file")) return "bg-amber-50 border-amber-200 text-amber-700";
  if (c.includes("create")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (c.includes("delete")) return "bg-rose-50 border-rose-200 text-rose-700";
  return "bg-slate-50 border-slate-200 text-slate-700";
}
function pickName(v: any, fallback = "—") {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);

  // object
  if (typeof v === "object") {
    // ưu tiên name/title/code/fileName
    return (
      v.name ||
      v.title ||
      v.code ||
      v.fileName ||
      v.email ||
      (v.id ? String(v.id) : fallback)
    );
  }

  return fallback;
}

function buildBusinessMessage(action: string, meta: any, changedCols: string[], log: any) {
  const m = meta || {};

  if (typeof m.message === "string" && m.message.trim()) {
    return m.message;
  }

  switch (action) {
    case "TASK_CREATED":
      return `Created task${m.code ? ` ${m.code}` : ""}${m.title ? ` • ${m.title}` : ""}`;

    case "TASK_STATUS_CHANGED": {
      const oldS = pickName(m.oldStatus ?? m.fromStatus ?? log.oldRow, "—");
      const newS = pickName(m.newStatus ?? m.toStatus ?? log.newRow, "—");
      return `Changed status: ${oldS} → ${newS}`;
    }

    case "TASK_REORDERED": {
      const fromSp = pickName(m.fromSprint, "Backlog");
      const toSp = pickName(m.toSprint, "Backlog");
      const fromSt = pickName(m.fromStatus, "—");
      const toSt = pickName(m.toStatus, "—");
      const pos = m.newOrder ?? "";
      if (m.changedSprint || m.changedStatus) {
        return `Moved: ${fromSp} (${fromSt}) → ${toSp} (${toSt})${pos ? `, position ${pos}` : ""}`;
      }
      return `Reordered in ${toSp} / ${toSt}${pos ? `, position ${pos}` : ""}`;
    }

    case "TASK_MOVED_TO_SPRINT": {
      const oldSp = pickName(m.oldSprint ?? m.fromSprint, "Backlog");
      const newSp = pickName(m.newSprint ?? m.toSprint, "Backlog");
      return `Moved sprint: ${oldSp} → ${newSp}`;
    }

    case "TASK_DRAFT_MATERIALIZED":
      return "Moved draft from backlog into a sprint";

    case "TASK_UPDATED": {
      if (changedCols.length) {
        return `Updated fields: ${changedCols.slice(0, 6).join(", ")}${changedCols.length > 6 ? " …" : ""}`;
      }
      return "Updated task fields";
    }

    case "TASK_ATTACHMENT_UPLOADED": {
      const count = m.count ?? (Array.isArray(m.files) ? m.files.length : 0) ?? 0;
      return `Uploaded ${count} file(s)`;
    }

    case "TASK_ATTACHMENT_DELETED":
      return `Deleted attachment: ${pickName(m.fileName, "file")}`;

    case "TASK_COMMENT_ADDED": {
      const filesCount = m.filesCount ?? 0;
      const hasBody = !!m.hasBody;
      if (hasBody && filesCount) return `Added a comment with ${filesCount} attachment(s)`;
      if (hasBody) return "Added a comment";
      if (filesCount) return `Added ${filesCount} attachment(s) to a comment`;
      return "Comment added";
    }

    default:
      return "Activity recorded";
  }
}


export default function TaskAuditLogList({
  taskId,
  compact = true,
}: {
  taskId: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<LogVm[]>([]);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(compact ? 15 : 25);
  const [totalCount, setTotalCount] = React.useState(0);

  const [keyword, setKeyword] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selectedCats, setSelectedCats] = React.useState<string[]>([]);
  const [showRaw, setShowRaw] = React.useState<Record<string, boolean>>({});

  const actionMetaMap = React.useMemo(() => {
    const m = new Map<string, any>();
    (actionsMeta as any[]).forEach((a) => m.set(a.code, a));
    return m;
  }, []);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (actionsMeta as any[]).forEach((x) => set.add(String(x.category || "other")));
    return Array.from(set).sort();
  }, []);
const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const load = React.useCallback(
  async (opts?: { reset?: boolean; page?: number }) => {
    if (!taskId) return;

    setLoading(true);
    try {
      const nextPage = opts?.page ?? (opts?.reset ? 1 : pageNumber);

      // category -> actions csv (lọc theo meta)
      const actions =
        selectedCats.length === 0
          ? []
          : (actionsMeta as any[])
              .filter((a) => selectedCats.includes(String(a.category || "other")))
              .map((a) => String(a.code));

      const res = await getTaskLogEvents(taskId, {
        pageNumber: nextPage,
        pageSize,
        keyword: keyword.trim(),
        actions,
        sortColumn: "CreatedAt",
        sortDescending: true, // ✅ newest first
      });

      setItems((prev) => (opts?.reset ? res.items : [...prev, ...res.items]));
      setTotalCount(res.totalCount ?? 0);
      setPageNumber(res.pageNumber ?? nextPage);

      // ✅ reset thì kéo lên đầu để thấy newest
      if (opts?.reset && scrollRef.current) scrollRef.current.scrollTop = 0;
    } catch (e) {
      console.error("[TaskAuditLogList] load failed", e);
      if (opts?.reset) setItems([]);
    } finally {
      setLoading(false);
    }
  },
  [taskId, pageNumber, pageSize, keyword, selectedCats]
);


  React.useEffect(() => {
    setItems([]);
    setPageNumber(1);
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, selectedCats]);

  // debounce keyword
  React.useEffect(() => {
    const t = setTimeout(() => {
      setItems([]);
      setPageNumber(1);
      load({ reset: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const grouped = React.useMemo(() => {
    const list = [...items]
      .map((x) => ({ ...x, __iso: safeIso(x) }))
      .filter((x: any) => !!x.__iso)
      .sort((a: any, b: any) => new Date(b.__iso).getTime() - new Date(a.__iso).getTime());

    const groups: Record<string, LogVm[]> = {};
    for (const it of list) {
      const day = formatDay((it as any).__iso);
      groups[day] = groups[day] || [];
      groups[day].push(it);
    }
    return Object.entries(groups);
  }, [items]);

  const canLoadMore = items.length < totalCount;

  const toggleCat = (c: string) => {
    setSelectedCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-900">Audit log</div>
          <div className="text-[11px] text-slate-500">
            Immutable timeline of changes (status, fields, attachments, comments, workflow…)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-3.5 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search logs…"
              className="w-44 rounded-xl border border-slate-200 bg-white pl-7 pr-2 py-1.5 text-[11px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen((x) => !x)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Filter className="size-3.5 text-slate-500" />
            Filter
            {filterOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white/70 p-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Categories</div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = selectedCats.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCat(c)}
                  className={cn(
                    "rounded-full border px-2 py-1 text-[10px] font-medium",
                    on ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {c}
                </button>
              );
            })}
            {selectedCats.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCats([])}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div
  ref={scrollRef}
  className={cn("mt-2", compact ? "max-h-64 overflow-y-auto pr-1" : "max-h-[420px] overflow-y-auto pr-1")}
>
        {loading && items.length === 0 ? (
          <div className="space-y-2 mt-2">
            <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center">
            <div className="text-xs font-semibold text-slate-800">No logs yet</div>
            <div className="mt-1 text-[11px] text-slate-500">When ticket changes happen, audit events appear here.</div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {grouped.map(([day, list]) => (
              <div key={day}>
                <div className="sticky top-0 z-10 inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm">
                  {day}
                </div>

                <div className="mt-2 space-y-2">
                  {list.map((log: any, idx: number) => {
                    const action = String(log.action ?? log.Action ?? "UNKNOWN");
                    const metaInfo = actionMetaMap.get(action);
                    const Icon = ICONS[String(metaInfo?.icon || "Eye")] || Eye;

                    const iso = safeIso(log);
const timeText = iso ? formatTime(iso) : "";
const fullTime = iso ? formatDateTimeFull(iso) : "";
                    const actorName =
                      log.actorName ||
                      log.actorUserName ||
                      log.actor?.fullName ||
                      log.actor?.userName ||
                      log.actor?.email ||
                      log.actorEmail ||
                      "Someone";

                    const parsedMeta = tryParseMeta(log.metadata ?? log.Metadata);
                    const changedCols = splitChangedCols(log.changedCols ?? log.ChangedCols);
                    const businessMsg = buildBusinessMessage(action, parsedMeta, changedCols, log);

                    const rowId = String(log.id ?? `${action}-${idx}-${iso}`);
                    const rawOpen = !!showRaw[rowId];

                    const category = String(metaInfo?.category || "other");

                    return (
                      <div
                        key={rowId}
                        className="rounded-2xl border border-slate-200 bg-white/85 p-2.5 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="shrink-0">
                            <div className="inline-flex size-8 items-center justify-center rounded-full bg-blue-600/10 text-[11px] font-semibold text-blue-700">
                              {initials(actorName)}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-xs font-semibold text-slate-900 truncate">{actorName}</div>

                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  catBadgeClasses(category)
                                )}
                                title={action}
                              >
                                <Icon className="size-3.5" />
                                {metaInfo?.label || action}
                              </span>

                              {/* visibility pill */}
                          
                             

{timeText && (
  <span className="text-[10px] text-slate-400" title={fullTime}>
    • {timeText}
  </span>
)}                            </div>

                            <div className="mt-1 text-[11px] text-slate-700">
                              {businessMsg}
                            </div>

                            {/* {changedCols.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {changedCols.slice(0, 10).map((c: string) => (
                                  <span
                                    key={c}
                                    className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100"
                                  >
                                    {c}
                                  </span>
                                ))}
                                {changedCols.length > 10 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{changedCols.length - 10} more
                                  </span>
                                )}
                              </div>
                            )} */}

                         
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {canLoadMore && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    setPageNumber((p) => p + 1);
                    await load();
                  }}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loading && (
                    <span className="size-3 animate-spin rounded-full border border-slate-400/60 border-t-transparent" />
                  )}
                  Load more ({items.length}/{totalCount})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
