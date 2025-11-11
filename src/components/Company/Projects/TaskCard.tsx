// src/components/TaskCard.tsx
import React from "react";
import {
  Check,
  TimerReset,
  Clock,
  Flag,
  CalendarDays,
  MoveRight,
  MoveDown,
  SplitSquareHorizontal,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import type { TaskVm, MemberRef } from "@/types/projectBoard";

/** ==== Local helpers ==== */
type TaskType = "Feature" | "Bug" | "Chore";

const SLA_POLICIES: Array<{ type: TaskType; priority: "Urgent" | "High" | "Medium" | "Low"; targetHours: number }> = [
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
  const t = (["Feature","Bug","Chore"] as const).includes(type as any) ? (type as TaskType) : null;
  if (!t) return null;
  const p = SLA_POLICIES.find((x) => x.type === t && x.priority === priority);
  return p?.targetHours ?? null;
}

function hoursBetween(aIso: string, bIso: string): number {
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / 36e5;
}
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/** ==== Avatars ==== */
function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  return <span>{initials || "?"}</span>;
}
function Avatar({ m }: { m: MemberRef }) {
  return (
    <div className="w-6 h-6 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-700">
      {m.avatarUrl ? <img alt={m.name} src={m.avatarUrl} className="w-full h-full object-cover" /> : <Initials name={m.name} />}
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
  t: TaskVm;                               // <-- từ "@/types/projectBoard"
  ticketSiblingsCount?: number;
  onMarkDone: (t: TaskVm) => void;
  onNext: (t: TaskVm) => void;
  onSplit: (t: TaskVm) => void;
  onMoveNext: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
};

export default function TaskCard({
  t,
  ticketSiblingsCount = 0,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  onOpenTicket,
}: Props) {
  const nowIso = new Date().toISOString();
  const slaTarget = getSlaTarget(t.type, t.priority);
  const elapsed = Math.max(0, hoursBetween(t.openedAt, nowIso));
  const remaining = slaTarget != null ? Math.ceil(slaTarget - elapsed) : null;
  const overdue = remaining != null && remaining < 0;
  const urgent = t.priority === "Urgent";
  const blocked = (t.dependsOn || []).length > 0;

  const isDone = t.statusCategory === "DONE";

  const slaTone =
    overdue ? "text-rose-700 bg-rose-50 border-rose-200" :
    remaining != null && remaining <= 4 ? "text-rose-700 bg-rose-50 border-rose-200" :
    remaining != null && remaining <= 12 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm p-3 hover:shadow-md transition relative",
        urgent && "ring-1 ring-rose-200",
      )}
      style={urgent ? { boxShadow: "0 1px 2px rgba(190,18,60,0.10)" } : undefined}
    >
      {/* Urgent strip + pulse dot */}
      {urgent && (
        <>
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-rose-600" />
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
        </>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-slate-500 leading-5">{t.code}</div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {blocked && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-300 text-rose-700">Blocked</span>
          )}
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border",
              urgent
                ? "border-rose-300 text-rose-700 bg-rose-50"
                : t.priority === "High"
                ? "border-amber-300 text-amber-700 bg-amber-50"
                : "border-slate-200 text-slate-600 bg-slate-50"
            )}
          >
            {t.priority}
          </span>
          {t.carryOverCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50">
              Spillover ×{t.carryOverCount}
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 font-medium leading-6">{t.title}</div>

      {/* Ticket pill & siblings */}
      {(t.sourceTicketId || t.sourceTicketCode) && (
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
            onClick={() => t.sourceTicketId && onOpenTicket?.(t.sourceTicketId)}
            title="Mở ticket gốc"
          >
            <LinkIcon className="w-3 h-3" />
            {t.sourceTicketCode ?? "Ticket"}
          </button>
          {ticketSiblingsCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
              {ticketSiblingsCount} task cùng ticket
            </span>
          )}
        </div>
      )}

      {/* Meta rows */}
      <div className="mt-2 text-xs text-slate-600 flex items-center flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1"><Flag className="w-3 h-3" /> {t.type}</div>
        <div className="flex items-center gap-1"><TimerReset className="w-3 h-3" /> {Math.max(0, t.storyPoints ?? 0)} pts</div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {Math.max(0, t.remainingHours ?? 0)}/{t.estimateHours ?? 0}h
        </div>
        <div className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {fmtDate(t.dueDate)}</div>
      </div>

      {/* Assignees */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarGroup members={t.assignees || []} />
          <div className="text-xs text-slate-600 truncate max-w-[200px]">
            {(t.assignees || []).map((a) => a.name).join(", ") || "Unassigned"}
          </div>
        </div>

        {/* SLA badge */}
        {slaTarget != null && !isDone && (
          <span
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
              slaTone
            )}
            title={`SLA ${slaTarget}h từ lúc mở (${new Date(t.openedAt).toLocaleString()})`}
          >
            <AlertTriangle className="w-3 h-3" />
            {overdue ? `Quá hạn ${Math.abs(remaining!)}h` : `SLA còn ${remaining}h`}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        {!isDone && (
          <button
            className="text-xs px-2 py-1 rounded-lg border hover:bg-emerald-50 border-emerald-300 text-emerald-700 flex items-center gap-1"
            onClick={() => onMarkDone(t)}
          >
            <Check className="w-3 h-3" /> Mark done
          </button>
        )}
        {!isDone && (
          <button
            className="text-xs px-2 py-1 rounded-lg border hover:bg-blue-50 border-blue-300 text-blue-700 flex items-center gap-1"
            onClick={() => onNext(t)}
          >
            <MoveRight className="w-3 h-3" /> Next
          </button>
        )}
        <button
          className="text-xs px-2 py-1 rounded-lg border hover:bg-violet-50 border-violet-300 text-violet-700 flex items-center gap-1"
          onClick={() => onSplit(t)}
        >
          <SplitSquareHorizontal className="w-3 h-3" /> Split
        </button>
        <button
          className="text-xs px-2 py-1 rounded-lg border hover:bg-slate-50 border-slate-300 text-slate-600 flex items-center gap-1"
          onClick={() => onMoveNext(t)}
        >
          <MoveDown className="w-3 h-3" /> Move next
        </button>
      </div>
    </div>
  );
}
