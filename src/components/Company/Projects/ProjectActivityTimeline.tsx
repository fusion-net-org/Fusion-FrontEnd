/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import actionsMeta from "@/static/taskLogActions.json";
import { getProjectActivities } from "@/services/taskLogService.js";
import { getUserById } from "@/services/userService.js";

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
} from "lucide-react";

type LogVm = {
  id?: string;
  taskId?: string;
  taskCode?: string;
  taskTitle?: string;

  actorId?: string;
  actorName?: string;
  actorAvatar?: string | null;

  action?: string;
  changedCols?: string | null;
  metadata?: any; // string JSON or object
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
};

const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s || ""
  );

function safeIso(log: LogVm) {
  return log.createdAt || log.createAt || log.createdOn || "";
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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
function pickName(v: any, fallback = "—") {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);

  if (typeof v === "object") {
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

    case "TASK_SPLIT":
      return `Split task • created: ${pickName(m.createdPartTitle, "New part")}`;

    case "TASK_SPLIT_PART_CREATED":
      return `New split part: ${pickName(m.title, "Part")}`;

    case "TASK_CREATED_FROM_TICKET":
      return `Created from ticket: ${pickName(m.ticketName, "Ticket")}`;

    case "TASK_UPDATED": {
      if (changedCols.length) {
        return `Updated fields: ${changedCols.slice(0, 6).join(", ")}${changedCols.length > 6 ? " …" : ""}`;
      }
      return "Updated task fields";
    }

    case "TASK_DELETED":
      return "Deleted task";

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

    case "TASK_DRAFT_CREATED":
      return "Created draft in backlog";

    case "TASK_DRAFT_UPDATED":
      return "Updated draft";

    default:
      return "Activity recorded";
  }
}


/** tone -> badge/dot/icon background */
function pickTone(category?: string, action?: string) {
  const c = String(category || "").toLowerCase();
  const a = String(action || "").toUpperCase();

  // category-based first
  if (c.includes("workflow") || c.includes("status") || c.includes("board")) return "indigo";
  if (c.includes("ticket")) return "fuchsia";
  if (c.includes("comment") || c.includes("chat")) return "sky";
  if (c.includes("attachment") || c.includes("file")) return "emerald";
  if (c.includes("delete") || c.includes("remove")) return "rose";
  if (c.includes("create") || c.includes("add")) return "green";
  if (c.includes("update") || c.includes("edit")) return "amber";

  // action-based fallback
  if (a.includes("DELETED") || a.includes("REMOVED")) return "rose";
  if (a.includes("CREATED") || a.includes("UPLOADED") || a.includes("ADDED")) return "green";
  if (a.includes("UPDATED") || a.includes("EDIT")) return "amber";
  if (a.includes("STATUS") || a.includes("WORKFLOW") || a.includes("MOVED") || a.includes("REORDER"))
    return "indigo";
  if (a.includes("COMMENT")) return "sky";
  if (a.includes("ATTACHMENT") || a.includes("FILE")) return "emerald";

  return "slate";
}

function toneClasses(tone: string) {
  // keep it Tailwind-safe (no dynamic class generation)
  switch (tone) {
    case "indigo":
      return {
        dot: "bg-indigo-500",
        badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
        icon: "bg-indigo-600/10 text-indigo-700",
        avatar: "bg-indigo-600/10 text-indigo-700",
      };
    case "emerald":
      return {
        dot: "bg-emerald-500",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: "bg-emerald-600/10 text-emerald-700",
        avatar: "bg-emerald-600/10 text-emerald-700",
      };
    case "sky":
      return {
        dot: "bg-sky-500",
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        icon: "bg-sky-600/10 text-sky-700",
        avatar: "bg-sky-600/10 text-sky-700",
      };
    case "fuchsia":
      return {
        dot: "bg-fuchsia-500",
        badge: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        icon: "bg-fuchsia-600/10 text-fuchsia-700",
        avatar: "bg-fuchsia-600/10 text-fuchsia-700",
      };
    case "rose":
      return {
        dot: "bg-rose-500",
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        icon: "bg-rose-600/10 text-rose-700",
        avatar: "bg-rose-600/10 text-rose-700",
      };
    case "amber":
      return {
        dot: "bg-amber-500",
        badge: "border-amber-200 bg-amber-50 text-amber-800",
        icon: "bg-amber-600/10 text-amber-800",
        avatar: "bg-amber-600/10 text-amber-800",
      };
    case "green":
      return {
        dot: "bg-green-500",
        badge: "border-green-200 bg-green-50 text-green-700",
        icon: "bg-green-600/10 text-green-700",
        avatar: "bg-green-600/10 text-green-700",
      };
    default:
      return {
        dot: "bg-slate-400",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        icon: "bg-slate-500/10 text-slate-700",
        avatar: "bg-slate-500/10 text-slate-700",
      };
  }
}

export default function ProjectActivityTimeline({ projectId }: { projectId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<LogVm[]>([]);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(25);
  const [totalCount, setTotalCount] = React.useState(0);

  const [search, setSearch] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [showRaw, setShowRaw] = React.useState<Record<string, boolean>>({});

  // actor name cache
  const userCache = React.useRef<Map<string, string>>(new Map());

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (actionsMeta as any[]).forEach((x) => set.add(String(x.category || "other")));
    return Array.from(set).sort();
  }, []);

  const actionMetaMap = React.useMemo(() => {
    const m = new Map<string, any>();
    (actionsMeta as any[]).forEach((a) => m.set(a.code, a));
    return m;
  }, []);

  const load = React.useCallback(
    async (opts?: { reset?: boolean; page?: number }) => {
      if (!projectId) return;

      setLoading(true);
      try {
        const nextPage = opts?.reset ? 1 : opts?.page ?? pageNumber;

        const res = await getProjectActivities(projectId, {
          pageNumber: nextPage,
          pageSize,
          search: search.trim(),
          categories: selectedCategories,
        });

        setItems((prev) => (opts?.reset ? res.items : [...prev, ...res.items]));
        setTotalCount(res.totalCount ?? 0);
        setPageNumber(res.pageNumber ?? nextPage);
      } catch (e: any) {
        console.error("Load activity failed", e);
        if (opts?.reset) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [projectId, pageNumber, pageSize, search, selectedCategories]
  );

  React.useEffect(() => {
    setItems([]);
    setPageNumber(1);
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedCategories]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setItems([]);
      setPageNumber(1);
      load({ reset: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const need = items
        .filter((x) => !x.actorName && x.actorId && isGuid(x.actorId))
        .slice(0, 15);

      for (const it of need) {
        if (!alive) return;
        const id = String(it.actorId);
        if (userCache.current.has(id)) continue;

        try {
          const res: any = await getUserById(id);
          const u: any = res?.data ?? res ?? {};
          const name =
            u.fullName ??
            u.name ??
            u.userName ??
            u.email ??
            u.user?.fullName ??
            u.user?.userName ??
            "";
          if (name) userCache.current.set(id, name);
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [items]);

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

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-blue-500" />
            <div className="text-sm font-semibold text-slate-900">Activity Log</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Audit trail
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Timeline of task changes, workflow actions, comments & attachments.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 size-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-60 rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-1.5 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen((x) => !x)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Filter className="size-4 text-slate-500" />
            Filters
            {filterOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      {filterOpen && (
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Categories
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = selectedCategories.includes(c);
              const tone = pickTone(c, "");
              const t = toneClasses(tone);

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition " +
                    (on
                      ? `${t.badge} shadow-sm`
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                  }
                >
                  {c}
                </button>
              );
            })}

            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* List (scrollable) */}
      <div className="px-4 py-3">
        <div className="max-h-[520px] overflow-auto pr-1">
          {loading && items.length === 0 ? (
            <div className="space-y-2">
              <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
              <div className="text-sm font-semibold text-slate-800">No activity yet</div>
              <div className="mt-1 text-xs text-slate-500">
                When tasks are created/updated/moved, logs will appear here.
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([day, list]) => (
                <div key={day}>
                  <div className="sticky top-0 z-10 mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                    <span className="inline-flex size-1.5 rounded-full bg-slate-400" />
                    {day}
                  </div>

                  {/* timeline rail */}
                  <div className="relative pl-5">
                    <div className="absolute left-2 top-0 h-full w-px bg-slate-200" />

                    <div className="space-y-2">
                      {list.map((log: any, idx: number) => {
                        const action = String(log.action ?? log.Action ?? "UNKNOWN");
                        const metaInfo = actionMetaMap.get(action);
                        const Icon = ICONS[String(metaInfo?.icon || "Eye")] || Eye;

                        const iso = safeIso(log);
                        const timeText = iso ? formatTime(iso) : "";

                        const actorId = String(log.actorId ?? log.actorUserId ?? "");
                        const actorName =
                          log.actorName ||
                          log.actorUserName ||
                          (actorId && userCache.current.get(actorId)) ||
                          "Someone";

                        const parsedMeta = tryParseMeta(log.metadata ?? log.Metadata);
                        const changedCols = splitChangedCols(log.changedCols ?? log.ChangedCols);
const businessMsg = buildBusinessMessage(action, parsedMeta, changedCols, log);

                        const rowId = String(log.id ?? `${action}-${idx}-${iso}`);
                        const rawOpen = !!showRaw[rowId];

                        const tone = pickTone(metaInfo?.category, action);
                        const t = toneClasses(tone);

                        return (
                          <div
                            key={rowId}
                            className="group relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                          >
                            {/* dot on rail */}
                            <span
                              className={`absolute -left-[3px] top-4 size-2.5 rounded-full ${t.dot} ring-4 ring-white`}
                            />

                            <div className="flex items-start gap-2.5">
                              {/* mini avatar */}
                              <div
                                className={`shrink-0 inline-flex size-7 items-center justify-center rounded-full text-[11px] font-bold ${t.avatar}`}
                                title={actorName}
                              >
                                {initials(actorName)}
                              </div>

                              <div className="min-w-0 flex-1">
                                {/* top row */}
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="truncate text-[12px] font-semibold text-slate-900">
                                        {actorName}
                                      </div>

                                      <span
                                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${t.badge}`}
                                        title={action}
                                      >
                                        <span
                                          className={`inline-flex size-5 items-center justify-center rounded-full ${t.icon}`}
                                        >
                                          <Icon className="size-3.5" />
                                        </span>
                                        {metaInfo?.label || action}
                                      </span>

                                      {log.isView ? (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                          Public
                                        </span>
                                      ) : (
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                          Internal
                                        </span>
                                      )}
                                    </div>

                                    {/* message (small + ellipsis) */}
                                    <div className="mt-0.5 truncate text-[12px] text-slate-600">
                                      {businessMsg}
                                    </div>
                                  </div>

                                  <div className="shrink-0 text-[11px] text-slate-400">
                                    {timeText}
                                  </div>
                                </div>

                                {/* changed cols chips (compact + overflow) */}
                                {/* {changedCols.length > 0 && (
                                  <div className="mt-1.5 flex max-w-full flex-wrap gap-1 overflow-hidden">
                                    {changedCols.slice(0, 6).map((c: string) => (
                                      <span
                                        key={c}
                                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-medium text-slate-700"
                                        title={c}
                                      >
                                        {c}
                                      </span>
                                    ))}
                                    {changedCols.length > 6 && (
                                      <span className="text-[10.5px] font-medium text-slate-400">
                                        +{changedCols.length - 6}
                                      </span>
                                    )}
                                  </div>
                                )} */}

                                {/* details toggle */}
                                <div className="mt-1.5 flex items-center gap-2">
                                

                                  {/* optional task hint */}
                                  {(log.taskCode || log.taskTitle) && (
                                    <span className="truncate text-[11px] text-slate-400">
                                      • {log.taskCode ? `${log.taskCode}` : "TASK"}
                                      {log.taskTitle ? ` — ${log.taskTitle}` : ""}
                                    </span>
                                  )}
                                </div>

                                {rawOpen && (
                                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50">
                                    <div className="flex items-center justify-between px-2.5 py-2">
                                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        Raw payload
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {action}
                                      </div>
                                    </div>
                                    <pre className="max-h-44 overflow-auto border-t border-slate-200 p-2.5 text-[11px] text-slate-700">
{JSON.stringify(
  {
    action,
    changedCols,
    metadata: parsedMeta ?? log.metadata ?? log.Metadata,
    raw: log,
  },
  null,
  2
)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {canLoadMore && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = pageNumber + 1;
                      load({ page: next });
                    }}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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

        {/* footer hint */}
        <div className="mt-2 text-[10.5px] text-slate-400">
          Tip: list is scrollable • details panel has its own scroll.
        </div>
      </div>
    </div>
  );
}
