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
} from "lucide-react";
import type { TaskVm, MemberRef } from "@/types/projectBoard";

/** ==== Local helpers ==== */
type TaskType = "Feature" | "Bug" | "Chore";

const SLA_POLICIES: Array<{
  type: TaskType;
  priority: "Urgent" | "High" | "Medium" | "Low";
  targetHours: number;
}> = [
  { type: "Bug",     priority: "Urgent", targetHours: 24 },
  { type: "Bug",     priority: "High",   targetHours: 48 },
  { type: "Bug",     priority: "Medium", targetHours: 72 },
  { type: "Feature", priority: "Urgent", targetHours: 72 },
  { type: "Feature", priority: "High",   targetHours: 120 },
  { type: "Feature", priority: "Medium", targetHours: 168 },
  { type: "Feature", priority: "Low",    targetHours: 336 },
  { type: "Chore",   priority: "Low",    targetHours: 336 },
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
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / 36e5;
}
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/** ==== Avatars ==== */
function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
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
  t: TaskVm;
  ticketSiblingsCount?: number;
  onMarkDone: (t: TaskVm) => void;
  onNext: (t: TaskVm) => void;
  onSplit: (t: TaskVm) => void;
  onMoveNext: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
  isNew?: boolean;
  statusColorHex?: string;
  statusLabel?: string;
};

function hexToRgba(hex?: string, a = 1) {
  if (!hex) return `rgba(148,163,184,${a})`; // slate-400 fallback
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex?.trim() ?? "");
  if (!m) return `rgba(148,163,184,${a})`;
  const r = parseInt(m[1], 16),
    g = parseInt(m[2], 16),
    b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function TaskCard({
  t,
  ticketSiblingsCount = 0,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  onOpenTicket,
  isNew,
  statusColorHex,
  statusLabel,
}: Props) {
  const nowIso = new Date().toISOString();
  const slaTarget = getSlaTarget(t.type, t.priority);

  // ===== SLA / Due logic =====
  const usingDueDate = !!t.dueDate;
  let remaining: number | null = null;

  if (t.dueDate) {
    // hours until due date (negative => overdue)
    remaining = Math.ceil(hoursBetween(nowIso, t.dueDate));
  } else if (slaTarget != null) {
    const elapsed = Math.max(0, hoursBetween(t.openedAt, nowIso));
    remaining = Math.ceil(slaTarget - elapsed);
  }

  const isDone = t.statusCategory === "DONE";
  const overdue = remaining != null && remaining < 0;
  const urgent = t.priority === "Urgent";
  const blocked = (t.dependsOn || []).length > 0;

  const showSla = !isDone && remaining != null;

  type SlaState = "safe" | "warn" | "overdue";
  let slaState: SlaState | null = null;

  if (showSla && remaining != null) {
    if (remaining < 0) slaState = "overdue";
    else if (remaining <= 24) slaState = "warn";
    else slaState = "safe";
  }

  // Card border color theo alert; safe => xám, warn/overdue => vàng/đỏ
  const cardBorderColorClass =
    !showSla || slaState === "safe"
      ? "border-slate-200"
      : slaState === "overdue"
      ? "border-rose-500"
      : "border-amber-500";

  // Badge color
  const slaTone =
    slaState === "overdue"
      ? "text-rose-700 bg-white border-rose-500"
      : slaState === "warn"
      ? "text-amber-700 bg-white border-amber-500"
      : "text-emerald-700 bg-white border-emerald-500";

  // Badge text
  let slaLabel = "";
  if (showSla && remaining != null) {
    if (overdue) {
      const lateHours = Math.abs(remaining);
      slaLabel = usingDueDate
        ? `Overdue by ${lateHours}h`
        : `SLA overdue by ${lateHours}h`;
    } else {
      slaLabel = usingDueDate
        ? `Due in ${remaining}h`
        : `SLA in ${remaining}h`;
    }
  }

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    if (!document.getElementById("fuse-pop-style")) {
      const el = document.createElement("style");
      el.id = "fuse-pop-style";
      el.textContent = `
@keyframes fusePop { 0% {transform:scale(0.92);} 55%{transform:scale(1.08);} 100%{transform:scale(1);} }
`;
      document.head.appendChild(el);
    }
    if (!document.getElementById("fuse-statusfade-style")) {
      const el = document.createElement("style");
      el.id = "fuse-statusfade-style";
      el.textContent = `
@keyframes fuseStatusFade {
  0%   { background-color: var(--status-bg); }
  100% { background-color: #ffffff; }
}
`;
      document.head.appendChild(el);
    }
  }, []);

  // status pill style
  const statusSoftBg = "#F9FAFB";
  const statusBorder = hexToRgba(statusColorHex, 0.6);
  const statusTextColor = statusColorHex || "#0f172a";
  const statusText = (statusLabel ?? t.statusCode ?? "").trim();

  return (
    <div
      data-task-id={t.id}
      className={cn(
        "rounded-xl bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.06)] p-3",
        "transition-all duration-300 relative hover:shadow-md hover:-translate-y-[1px]",
        !isNew && "border",
        !isNew && cardBorderColorClass,
        !isNew && urgent && "ring-1 ring-rose-200"
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
        ...(urgent && !isNew
          ? { boxShadow: "0 1px 2px rgba(190,18,60,0.10)" }
          : {}),
        transformOrigin: "center",
      }}
    >
      {/* Urgent strip + pulse dot */}
      {urgent && (
        <>
          <div className="absolute inset-y-1 left-1 w-[3px] rounded-full bg-rose-600" />
          <span className="absolute -top-1 left-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
        </>
      )}

      {/* Header: code + status + priority + spillover */}
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
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border bg-white",
              urgent
                ? "border-rose-500 text-rose-700"
                : t.priority === "High"
                ? "border-amber-500 text-amber-700"
                : t.priority === "Medium"
                ? "border-sky-500 text-sky-700"
                : "border-slate-300 text-slate-700"
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

      {/* Title: blue + underline (clickable) */}
      <button
        type="button"
        className={cn(
          "mt-1 text-[13px] font-semibold leading-6 text-left",
          "text-blue-600 underline decoration-blue-400 underline-offset-[3px]",
          "hover:text-blue-700 hover:decoration-blue-600 focus:outline-none"
        )}
        onClick={() => {
          onOpenTicket?.(t.id)}}
      >
        {t.title}
      </button>

      {/* Ticket pill & siblings */}
      {(t.sourceTicketId || t.sourceTicketCode) && (
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white border-sky-500 text-sky-700 hover:bg-slate-50"
            onClick={() => t.sourceTicketId && onOpenTicket?.(t.sourceTicketId)}
            title="Open source ticket"
          >
            <LinkIcon className="w-3 h-3" />
            {t.sourceTicketCode ?? "Ticket"}
          </button>
          {ticketSiblingsCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white border-violet-500 text-violet-700">
              {ticketSiblingsCount} tasks in same ticket
            </span>
          )}
        </div>
      )}

      {/* Meta rows */}
      <div className="mt-2 text-[11px] text-slate-600 flex items-center flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1">
          <Flag className="w-3 h-3" /> {t.type}
        </div>
        <div className="flex items-center gap-1">
          <TimerReset className="w-3 h-3" /> {Math.max(0, t.storyPoints ?? 0)} pts
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {Math.max(0, t.remainingHours ?? 0)}/
          {t.estimateHours ?? 0}h
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          <span>Due: {fmtDate(t.dueDate)}</span>
        </div>
      </div>

      {/* Assignees + SLA */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AvatarGroup members={t.assignees || []} />
          <div className="text-[11px] text-slate-600 truncate max-w-[200px]">
            {(t.assignees || []).map((a) => a.name).join(", ") || "Unassigned"}
          </div>
        </div>

        {showSla && (
          <span
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
              slaTone
            )}
            title={
              usingDueDate && t.dueDate
                ? `Due date: ${new Date(t.dueDate).toLocaleString()}`
                : slaTarget != null
                ? `SLA: ${slaTarget}h from opened (${new Date(
                    t.openedAt
                  ).toLocaleString()})`
                : undefined
            }
          >
            <AlertTriangle className="w-3 h-3" />
            {slaLabel}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {!isDone && (
          <button
            className="text-[11px] px-2 py-1 rounded-lg border hover:bg-emerald-50 border-emerald-300 text-emerald-700 flex items-center gap-1"
            onClick={() => onMarkDone(t)}
          >
            <Check className="w-3 h-3" /> Mark done
          </button>
        )}

        <button
          className="text-[11px] px-2 py-1 rounded-lg border hover:bg-violet-50 border-violet-300 text-violet-700 flex items-center gap-1"
          onClick={() => onSplit(t)}
        >
          <SplitSquareHorizontal className="w-3 h-3" /> Split
        </button>
        <button
          className="text-[11px] px-2 py-1 rounded-lg border hover:bg-slate-50 border-slate-300 text-slate-600 flex items-center gap-1"
          onClick={() => onMoveNext(t)}
        >
          <MoveDown className="w-3 h-3" /> Move next
        </button>
      </div>
    </div>
  );
}
