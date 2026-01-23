import React from "react";
import {
  Check,
  TimerReset,
  Clock,
  Flag,
  CalendarDays,
  MoveDown,
  SplitSquareHorizontal,
  AlertTriangle,
  Link as LinkIcon,
  Boxes,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import type { TaskVm, MemberRef } from "@/types/projectBoard";
import { Can } from "@/permission/PermissionProvider";

/** ==== Local helpers ==== */
type TaskType = "Feature" | "Bug" | "Chore";

const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s,
  );

const toBool = (v: any) => {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === "number") return v === 1;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
};

const SLA_POLICIES: Array<{
  type: TaskType;
  priority: "Urgent" | "High" | "Medium" | "Low";
  targetHours: number;
}> = [
  { type: "Bug", priority: "Urgent", targetHours: 24 },
  { type: "Bug", priority: "High", targetHours: 48 },
  { type: "Bug", priority: "Medium", targetHours: 72 },
  { type: "Feature", priority: "Urgent", targetHours: 72 },
  { type: "Feature", priority: "High", targetHours: 120 },
  { type: "Feature", priority: "Medium", targetHours: 168 },
  { type: "Feature", priority: "Low", targetHours: 336 },
  { type: "Chore", priority: "Low", targetHours: 336 },
];

function getSlaTarget(type: string, priority: TaskVm["priority"]): number | null {
  const t = (["Feature", "Bug", "Chore"] as const).includes(type as any)
    ? (type as TaskType)
    : null;
  if (!t) return null;
  const p = SLA_POLICIES.find((x) => x.type === t && x.priority === priority);
  return p?.targetHours ?? null;
}

function hoursBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso);
  const b = new Date(bIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return NaN;
  return (b.getTime() - a.getTime()) / 36e5;
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "N/A");

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/** ==== Avatars ==== */
function Initials({ name }: { name: string }) {
  const parts = (name || "").trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  return <span>{initials || "?"}</span>;
}

function Avatar({ m }: { m: MemberRef }) {
  return (
    <div className="w-6 h-6 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-700">
      {m.avatarUrl ? (
        <img alt={m.name} src={m.avatarUrl} className="w-full h-full object-cover" />
      ) : (
        <Initials name={m.name} />
      )}
    </div>
  );
}

function AvatarGroup({ members }: { members: MemberRef[] }) {
  const shown = (members ?? []).slice(0, 3);
  const more = (members ?? []).length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div key={m.id} className={cn(i > 0 && "-ml-2")}>
          <Avatar m={m} />
        </div>
      ))}
      {more > 0 && (
        <div className="-ml-2 w-6 h-6 rounded-full ring-2 ring-white bg-slate-300 text-[10px] flex items-center justify-center font-semibold text-slate-700">
          +{more}
        </div>
      )}
    </div>
  );
}

/** ==== Props ==== */
type Props = {
  t: TaskVm & { isAiDraft?: boolean };
  ticketSiblingsCount?: number;
  onMarkDone: (t: TaskVm) => void;
  onNext: (t: TaskVm) => void;
  onSplit: (t: TaskVm) => void;
  onMoveNext: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
  isNew?: boolean;
  statusColorHex?: string;
  statusLabel?: string;
  isAiNew?: boolean;
  components?: { id: string; name: string }[];
  onClose?: (t: TaskVm) => void;
  mode?: "default" | "backlog" | "close";
};

function hexToRgba(hex?: string, a = 1) {
  if (!hex) return `rgba(148,163,184,${a})`;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim() ?? "");
  if (!m) return `rgba(148,163,184,${a})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function TaskCard({
  t,
  ticketSiblingsCount = 0,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  isNew,
  statusColorHex,
  statusLabel,
  isAiNew,
  components,
  onClose,
  mode = "default",
}: Props) {
  const navigate = useNavigate();
  const { companyId, projectId } = useParams();
const isBacklogMode = mode === "backlog";
const isCloseMode = mode === "close";
const isCompactMode = isBacklogMode || isCloseMode;

  const isAiDraft =
    (t as any).isAiDraft ||
    (t as any).source === "AI_DRAFT" ||
    ((t as any).source === "AI" && !isGuid(t.id));
const canNavigateDetail = isGuid(t.id) && !isAiDraft && !isCompactMode;

  const isPersisted = isGuid(t.id);
  const isAiPersisted = !isAiDraft && (t as any).source === "AI";

  // DONE by category (close keeps statusId)
  const isDone = t.statusCategory === "DONE";
  const isClosed = toBool(
    (t as any).isClose ?? (t as any).IsClose ?? (t as any).isclose ?? (t as any).isClosed,
  );
  const canClose = !isClosed;

  // Current status = status-before-close (because workflowStatusId doesn't change)
  const statusBeforeClose = (statusLabel ?? (t as any).StatusName ?? t.statusCode ?? "").trim();
  const closeOutcomeText = isDone
    ? "Completed"
    : `Cancelled from ${statusBeforeClose || "previous status"}`;

  const nowIso = new Date().toISOString();
  const slaTarget = getSlaTarget(t.type, t.priority);

  const usingDueDate = !!t.dueDate;
  let remaining: number | null = null;

if (!isBacklogMode && !isAiDraft) {
  if (t.dueDate) {
    const diff = hoursBetween(nowIso, t.dueDate);
    if (Number.isFinite(diff)) remaining = Math.ceil(diff);
  } else if (slaTarget != null && (t as any).openedAt) {
    const openedAt = (t as any).openedAt as string;
    const elapsed = hoursBetween(openedAt, nowIso);
    if (Number.isFinite(elapsed)) remaining = Math.ceil(slaTarget - Math.max(0, elapsed));
  }
}
const showSla = !isBacklogMode && !isDone && remaining != null;

  const overdue = remaining != null && remaining < 0;
  const urgent = t.priority === "Urgent";
  const blocked = ((t as any).dependsOn || []).length > 0;


  type SlaState = "safe" | "warn" | "overdue";
  let slaState: SlaState | null = null;

  if (showSla && remaining != null) {
    if (remaining < 0) slaState = "overdue";
    else if (remaining <= 24) slaState = "warn";
    else slaState = "safe";
  }

  const cardBorderColorClass =
    !showSla || slaState === "safe"
      ? "border-slate-200"
      : slaState === "overdue"
        ? "border-rose-500"
        : "border-amber-500";

  const slaTone =
    slaState === "overdue"
      ? "text-rose-700 bg-white border-rose-500"
      : slaState === "warn"
        ? "text-amber-700 bg-white border-amber-500"
        : "text-emerald-700 bg-white border-emerald-500";

  let slaLabel = "";
  if (showSla && remaining != null) {
    const abs = Math.abs(remaining);
    if (overdue) {
      slaLabel = usingDueDate ? `Overdue by ${abs}h` : `SLA overdue by ${abs}h`;
    } else {
      slaLabel = usingDueDate ? `Due in ${remaining}h` : `SLA in ${remaining}h`;
    }
  }

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    if (!document.getElementById("fuse-pop-style")) {
      const el = document.createElement("style");
      el.id = "fuse-pop-style";
      el.textContent = `
@keyframes fusePop { 
  0% {transform:scale(0.92);} 
  55%{transform:scale(1.08);} 
  100%{transform:scale(1);} 
}`;
      document.head.appendChild(el);
    }
    if (!document.getElementById("fuse-statusfade-style")) {
      const el = document.createElement("style");
      el.id = "fuse-statusfade-style";
      el.textContent = `
@keyframes fuseStatusFade {
  0%   { background-color: var(--status-bg); }
  100% { background-color: #ffffff; }
}`;
      document.head.appendChild(el);
    }
  }, []);

  const statusSoftBg = "#F9FAFB";
  const statusBorder = hexToRgba(statusColorHex, 0.6);
  const statusTextColor = statusColorHex || "#0f172a";
  const statusText = (statusLabel ?? t.statusCode ?? "").trim();

  const points = (t as any).point ?? (t as any).storyPoints ?? 0;

  const ticketIdRaw = (t as any).sourceTicketId ?? (t as any).ticketId ?? null;
  const ticketCodeRaw = (t as any).sourceTicketCode ?? (t as any).ticketName ?? null;

  const ticketId = ticketIdRaw && String(ticketIdRaw).trim() !== "" ? String(ticketIdRaw) : null;
  const ticketCode = ticketCodeRaw && String(ticketCodeRaw).trim() !== "" ? String(ticketCodeRaw) : null;

  const isTicketTask = !!ticketId;

  const componentIdRaw =
    (t as any).componentId ?? (t as any).projectComponentId ?? (t as any).maintenanceComponentId ?? null;
  const componentNameRaw =
    (t as any).componentName ?? (t as any).component?.name ?? (t as any).projectComponentName ?? null;

  const componentId = componentIdRaw && String(componentIdRaw).trim() !== "" ? String(componentIdRaw) : null;

  const componentName =
    (componentNameRaw && String(componentNameRaw).trim() !== "" ? String(componentNameRaw) : null) ??
    (componentId ? components?.find((c) => c.id === componentId)?.name : null) ??
    null;

  const isComponentTask = !!componentId;
  const isHybridTask = isTicketTask && isComponentTask;

  const cardBorderClass = !isNew
    ? isHybridTask
      ? "border-2 border-fuchsia-500 shadow-[0_0_0_1px_rgba(217,70,239,0.30)]"
      : isTicketTask
        ? "border-2 border-sky-500 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]"
        : isComponentTask
          ? "border-2 border-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]"
          : `border ${cardBorderColorClass}`
    : "";

const handleOpenTaskDetail = () => {
  if (!canNavigateDetail) return;
  if (!companyId || !projectId) return;
  navigate(`/companies/${companyId}/project/${projectId}/task/${t.id}`);
};

  const handleOpenTicketDetail = () => {
    if (!ticketId) return;
    if (!companyId || !projectId) return;
    navigate(`/companies/${companyId}/project/${projectId}/tickets/${ticketId}`);
  };

  return (
    <div
      data-task-id={t.id}
      className={cn(
        "rounded-xl bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.06)] p-3",
        "transition-all duration-300 relative hover:shadow-md hover:-translate-y-[1px]",
        "border border-slate-200 shadow-[0_2px_0_rgba(195,212,234,1),0_6px_12px_rgba(148,163,184,0.16)]",
        cardBorderClass,
        !isNew && urgent && "ring-1 ring-rose-200",
        isClosed && "opacity-90",
      )}
      style={{
        ...(isNew
          ? {
              animation:
                "fusePop 420ms cubic-bezier(0.2,0.8,0.2,1), fuseStatusFade 1400ms ease-out forwards",
              backgroundColor: "var(--status-bg)",
              // @ts-ignore
              "--status-bg": statusSoftBg,
              willChange: "transform, background-color",
            }
          : {}),
        ...(urgent && !isNew ? { boxShadow: "0 1px 2px rgba(190,18,60,0.10)" } : {}),
        ...(isHybridTask
          ? { backgroundImage: "linear-gradient(to bottom, #fdf4ff, #ffffff)" }
          : isTicketTask
            ? { backgroundImage: "linear-gradient(to bottom, #f0f9ff, #ffffff)" }
            : isComponentTask
              ? { backgroundImage: "linear-gradient(to bottom, #fff7ed, #ffffff)" }
              : {}),
        transformOrigin: "center",
      }}
    >
      {urgent && (
        <>
          <div className="absolute inset-y-1 left-1 w-[3px] rounded-full bg-rose-600" />
          <span className="absolute -top-1 left-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
        </>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] text-slate-500 leading-5">{t.code}</div>

        <div className="flex items-center gap-1 flex-wrap justify-end">
          {statusText && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: statusSoftBg,
                borderColor: statusBorder,
                color: statusTextColor,
              }}
            >
              {statusText}
            </span>
          )}

          {blocked && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500 bg-white text-rose-700">
              Blocked
            </span>
          )}

          {isAiDraft && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-400 bg-sky-50 text-sky-700">
              AI draft
            </span>
          )}

          {isAiPersisted && (
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide",
                isAiNew
                  ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                  : "border-sky-400 bg-sky-50 text-sky-700",
              )}
            >
              AI
            </span>
          )}

          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border bg-white",
              urgent
                ? "border-rose-500 text-rose-700"
                : t.priority === "High"
                  ? "border-amber-500 text-amber-700"
                  : t.priority === "Medium"
                    ? "border-sky-500 text-sky-700"
                    : "border-slate-300 text-slate-700",
            )}
          >
            {t.priority}
          </span>

          {t.carryOverCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white border-violet-500 text-violet-700">
              Spillover ×{t.carryOverCount}
            </span>
          )}
        </div>
      </div>

      {/* Close outcome (LEFT aligned) */}
      {isClosed && (
        <div className="mt-2 flex justify-start">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              isDone
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
            title={isDone ? "Closed from an end status" : `Cancelled from ${statusBeforeClose || "previous status"}`}
          >
            {isDone ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {closeOutcomeText}
          </span>
        </div>
      )}

      {/* Title */}
    <button
  type="button"
  disabled={!canNavigateDetail}
  className={cn(
    "mt-2 text-[13px] font-semibold leading-6 text-left focus:outline-none",
    canNavigateDetail
      ? "text-blue-600 underline decoration-blue-400 underline-offset-[3px] hover:text-blue-700 hover:decoration-blue-600"
      : "text-slate-800 cursor-default",
    // ✅ Close: gạch ngang tên
    (isCloseMode || isClosed) && "line-through decoration-slate-400 text-slate-500",
    !canNavigateDetail && "disabled:opacity-100"
  )}
  onClick={handleOpenTaskDetail}
>
  {t.title}
</button>


      {/* Ticket / Component pill */}
      {(ticketId || componentId) && (
        <div className="mt-2 flex items-center gap-2">
          {isHybridTask ? (
            <button
              type="button"
              onClick={handleOpenTicketDetail}
              className="text-[11px] inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border bg-white border-fuchsia-500 text-fuchsia-700 hover:bg-fuchsia-50"
              title="Open ticket (linked to both ticket & component)"
            >
              <span className="inline-flex items-center gap-1 min-w-0">
                <Boxes className="w-3 h-3" />
                <span className="truncate max-w-[170px]">
                  {componentName ? `Component: ${componentName}` : "Component: —"}
                </span>
              </span>

              <span className="opacity-40">|</span>

              <span className="inline-flex items-center gap-1 min-w-0">
                <LinkIcon className="w-3 h-3" />
                <span className="truncate max-w-[170px]">
                  {ticketCode ? `Ticket: ${ticketCode}` : "Ticket: —"}
                </span>
              </span>
            </button>
          ) : ticketId ? (
            <button
              type="button"
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white border-sky-500 text-sky-700 hover:bg-slate-50"
              onClick={handleOpenTicketDetail}
              title="Open source ticket"
            >
              <LinkIcon className="w-3 h-3" />
              <span className="truncate max-w-[200px]">Ticket: {ticketCode ?? "—"}</span>
            </button>
          ) : (
            <span
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white border-amber-700 text-amber-800"
              title={componentName ?? "Component"}
            >
              <Boxes className="w-3 h-3" />
              <span className="truncate max-w-[200px]">Component: {componentName ?? "—"}</span>
            </span>
          )}
        </div>
      )}

      {/* Meta */}
   <div className="mt-2 text-[11px] text-slate-600 flex items-center flex-wrap gap-x-4 gap-y-1">
  <div className="flex items-center gap-1">
    <Flag className="w-3 h-3" /> {t.type}
  </div>

  {!isBacklogMode && (
    <>
      <div className="flex items-center gap-1">
        <TimerReset className="w-3 h-3" /> {Math.max(0, points ?? 0)} pts
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" /> {t.estimateHours ?? 0}h
      </div>
      <div className="flex items-center gap-1">
        <CalendarDays className="w-3 h-3" />
        <span>Due: {fmtDate(t.dueDate as any)}</span>
      </div>
    </>
  )}
</div>

      {/* Assignees + SLA */}
      {!isBacklogMode && (
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AvatarGroup members={(t.assignees as any) || []} />
          <div className="text-[11px] text-slate-600 truncate max-w-[200px]">
            {((t.assignees as any[]) || []).map((a) => a.name).join(", ") || "Unassigned"}
          </div>
        </div>

        {showSla && (
          <span
            className={cn("text-[11px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1", slaTone)}
            title={
              usingDueDate && t.dueDate
                ? `Due date: ${new Date(t.dueDate).toLocaleString()}`
                : slaTarget != null && (t as any).openedAt
                  ? `SLA: ${slaTarget}h from opened (${new Date((t as any).openedAt).toLocaleString()})`
                  : undefined
            }
          >
            <AlertTriangle className="w-3 h-3" />
            {slaLabel}
          </span>
        )}
      </div>
)}
      {/* Actions (LEFT aligned) */}
      {!isBacklogMode && (
      <div className="mt-3 flex items-center justify-start gap-2 flex-wrap">
        {isAiDraft || !isPersisted ? (
          <span className="text-[11px] text-slate-500 italic">AI Draft</span>
        ) : (
          <>
            {typeof onClose === "function" && (
              <Can code='TASK_CANCEL'>
              <button
                type="button"
                disabled={!canClose}
                title={!canClose ? "Task is already closed" : isDone ? "Close task" : "Cancel task (not done yet)"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canClose) return;
                  onClose(t);
                }}
                className={cn(
                  "text-[11px] px-2 py-1 rounded-lg border inline-flex items-center gap-1 whitespace-nowrap",
                  canClose
                    ? isDone
                      ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      : "border-rose-300 text-rose-700 hover:bg-rose-50"
                    : "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50",
                )}
              >
                {isDone ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {isDone ? "Close" : "Cancel"}
              </button>
              </Can>
            )}

            <Can code="TASK_SPLIT">
              <button
                className="text-[11px] px-2 py-1 rounded-lg border hover:bg-violet-50 border-violet-300 text-violet-700 flex items-center gap-1"
                onClick={() => onSplit(t)}
              >
                <SplitSquareHorizontal className="w-3 h-3" /> Split
              </button>
            </Can>

            <Can code="TASK_MOVE_SPRINT">
              <button
                className="text-[11px] px-2 py-1 rounded-lg border hover:bg-slate-50 border-slate-300 text-slate-600 flex items-center gap-1"
                onClick={() => onMoveNext(t)}
              >
                <MoveDown className="w-3 h-3" /> Move next
              </button>
            </Can>
          </>
        )}
      </div>
      )}
    </div>
  );
}
