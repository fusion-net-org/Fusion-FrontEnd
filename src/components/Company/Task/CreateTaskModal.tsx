// src/components/Task/CreateTaskModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, CalendarDays, ChevronDown, Check, Users2, Link as LinkIcon, AlertTriangle,
} from "lucide-react";
import type {
  SprintVm, StatusMeta, TaskVm, MemberRef, StatusCategory,
} from "@/types/projectBoard";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/* ====== CSS inject for blue pill + fade ====== */
function usePillStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("task-pill-style")) return;
    const el = document.createElement("style");
    el.id = "task-pill-style";
    el.textContent = `
.fuse-blue-pill{
  display:inline-flex;align-items:center;gap:.4rem;
  padding:.25rem .5rem;border-radius:9999px;
  background:${brand};color:#fff;font-weight:600;font-size:12px;
  transition:background-color .25s ease,color .25s ease,transform .15s ease;
}
.fuse-blue-pill:hover{ background:#fff;color:${brand}; }
`;
    document.head.appendChild(el);
  }, []);
}

/* ====== Types ====== */
export type CreateTaskPayload = {
  title: string;
  code?: string;
  type: "Feature" | "Bug" | "Chore" | string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  severity?: "Critical" | "High" | "Medium" | "Low";
  storyPoints?: number;
  estimateHours?: number;
  remainingHours?: number;
  dueDate?: string | null;

  sprintId: string | null;
  workflowStatusId: string;          // from chosen status
  statusCode: string;                // meta.code
  statusCategory: StatusCategory;    // meta.category
  StatusName: string;                // meta.name

  assigneeIds: string[];             // from MemberRef
  dependsOn: string[];               // task ids
  parentTaskId?: string | null;

  carryOverCount?: number;           // default 0

  sourceTicketId?: string | null;
  sourceTicketCode?: string | null;

  openedAt?: string;                 // default now
  createdAt?: string;                // default now
  updatedAt?: string;                // default now
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void> | void;

  sprints: SprintVm[];               // để chọn sprint & status động theo sprint
  members: MemberRef[];              // để chọn assignees

  defaultSprintId?: string | null;
  defaultStatusId?: string | null;
  defaults?: Partial<CreateTaskPayload>;
};

/* ====== Small atoms ====== */
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; hint?: string }> = ({ label, required, children, hint }) => (
  <label className="block">
    <div className="mb-1.5 text-sm font-medium text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </div>
    {children}
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </label>
);

const PillButton: React.FC<{
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition",
      active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
    )}
  >
    {children}
  </button>
);

function toNumberOrUndef(v: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ====== Helpers ====== */
function firstStatusIdOfSprint(s: SprintVm | undefined | null) {
  if (!s) return "";
  return s.statusOrder?.[0] || Object.keys(s.columns || {})[0] || "";
}
function statusMetaOf(s: SprintVm | null, id?: string): StatusMeta | undefined {
  if (!s || !id) return undefined;
  return s.statusMeta?.[id];
}

function MemberMulti({
  value, onChange, options,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  options: MemberRef[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    if (!q) return options;
    return options.filter(o => o.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, options]);

  const toggle = (id: string) => {
    const has = value.includes(id);
    onChange(has ? value.filter(x => x !== id) : [...value, id]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between"
      >
        <span className={value.length ? "" : "text-slate-400"}>
          {value.length ? `${value.length} selected` : "Select assignees"}
        </span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 && <div className="p-3 text-sm text-slate-400">No results</div>}
            {filtered.map((m) => {
              const active = value.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between",
                    active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                  )}
                >
                  <span className="truncate">{m.name}</span>
                  {active && <Check className="size-4" />}
                </button>
              );
            })}
          </div>
          {!!value.length && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TagInput({
  value, onChange, placeholder,
}: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
  };
  return (
    <div className="rounded-xl border border-slate-200 p-2 flex flex-wrap gap-2">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs">
          {v}
          <button className="text-slate-400 hover:text-rose-500" onClick={() => onChange(value.filter(x => x !== v))}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
            setInput("");
          }
        }}
        placeholder={placeholder || "Type and press Enter"}
        className="min-w-[160px] flex-1 outline-none text-sm px-1"
      />
    </div>
  );
}

/* ====== Status picker (from sprint workflow) ====== */
function StatusPicker({
  sprint, value, onChange,
}: { sprint: SprintVm | null; value: string; onChange: (id: string) => void }) {
  const order = sprint?.statusOrder ?? [];
  return (
    <div className="flex flex-wrap gap-2">
      {order.map((id) => {
        const m = sprint!.statusMeta[id];
        const active = value === id;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={cn("fuse-blue-pill", active ? "" : "opacity-80")}
            title={m.code}
          >
            {m.name || m.code}
          </button>
        );
      })}
      {order.length === 0 && (
        <div className="text-xs text-slate-500">No statuses in this sprint’s workflow.</div>
      )}
    </div>
  );
}

/* ====== MAIN ====== */
export default function CreateTaskModal({
  open, onClose, onSubmit, sprints, members, defaultSprintId, defaultStatusId, defaults,
}: Props) {
  usePillStyles();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sprintMap = useMemo(() => {
    const m: Record<string, SprintVm> = {};
    for (const s of sprints) m[s.id] = s;
    return m;
  }, [sprints]);

  const initialSprint = defaultSprintId && sprintMap[defaultSprintId] ? sprintMap[defaultSprintId] : (sprints[0] ?? null);
  const [sprintId, setSprintId] = useState<string | null>(initialSprint?.id ?? null);
  const activeSprint: SprintVm | null = sprintId ? (sprintMap[sprintId] ?? null) : null;

  const initialStatusId =
    (defaultStatusId && activeSprint?.statusMeta[defaultStatusId] ? defaultStatusId : undefined) ||
    firstStatusIdOfSprint(activeSprint);

  const [statusId, setStatusId] = useState<string>(initialStatusId);

  // form state
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [code, setCode] = useState(defaults?.code ?? "");
  const [type, setType] = useState<CreateTaskPayload["type"]>(defaults?.type ?? "Feature");
  const [priority, setPriority] = useState<CreateTaskPayload["priority"]>(defaults?.priority ?? "Medium");
  const [severity, setSeverity] = useState<CreateTaskPayload["severity"]>(defaults?.severity);
  const [storyPoints, setStoryPoints] = useState<number | undefined>(defaults?.storyPoints);
  const [estimateHours, setEstimateHours] = useState<number | undefined>(defaults?.estimateHours);
  const [remainingHours, setRemainingHours] = useState<number | undefined>(defaults?.remainingHours);
  const [dueDate, setDueDate] = useState<string | null>(defaults?.dueDate ?? null);

  const [assigneeIds, setAssigneeIds] = useState<string[]>(defaults?.assigneeIds ?? []);
  const [dependsOn, setDependsOn] = useState<string[]>(defaults?.dependsOn ?? []);
  const [parentTaskId, setParentTaskId] = useState<string | null | undefined>(defaults?.parentTaskId ?? null);
  const [sourceTicketId, setSourceTicketId] = useState<string | null | undefined>(defaults?.sourceTicketId ?? null);
  const [sourceTicketCode, setSourceTicketCode] = useState<string | null | undefined>(defaults?.sourceTicketCode ?? null);

  useEffect(() => {
    // auto-sync remaining = estimate if empty
    if ((remainingHours == null || Number.isNaN(remainingHours)) && estimateHours != null) {
      setRemainingHours(estimateHours);
    }
  }, [estimateHours]); // eslint-disable-line

  useEffect(() => {
    // đổi sprint -> reset status về status đầu
    setStatusId(firstStatusIdOfSprint(activeSprint));
  }, [sprintId]); // eslint-disable-line

  if (!open) return null;

  /* ====== validation per step ====== */
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!sprintId) e.sprintId = "Sprint is required.";
    if (!statusId) e.statusId = "Status is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    const ok = validateStep1();
    if (!ok) {
      setStep(1);
      return;
    }
    const meta = statusMetaOf(activeSprint, statusId);
    const now = new Date().toISOString();
    const payload: CreateTaskPayload = {
      title,
      code: code || undefined,
      type,
      priority,
      severity: severity || undefined,
      storyPoints,
      estimateHours,
      remainingHours,
      dueDate: dueDate || null,

      sprintId,
      workflowStatusId: statusId,
      statusCode: meta?.code || "",
      statusCategory: (meta?.category || "TODO") as StatusCategory,
      StatusName: meta?.name || meta?.code || "",

      assigneeIds,
      dependsOn,
      parentTaskId: parentTaskId || null,
      carryOverCount: 0,

      sourceTicketId: sourceTicketId || null,
      sourceTicketCode: sourceTicketCode || null,

      openedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  /* ====== UI bits ====== */
  const StepDot = ({ n, active }: { n: number; active: boolean }) => (
    <div className={cn(
      "size-8 rounded-full flex items-center justify-center text-sm font-semibold",
      active ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "bg-slate-100 text-slate-400"
    )}>{n}</div>
  );

  /* ====== Render ====== */
  return createPortal(
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-[980px] rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_-15px_rgba(30,64,175,0.35)] flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundImage: "radial-gradient(900px 180px at 50% -70px, rgba(59,130,246,.08), transparent 60%)" }}
        >
          {/* header */}
          <div className="p-6 pb-3 flex items-start justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Create Task</div>
              <div className="text-sm text-slate-500">Details • People & Relations</div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>

          {/* stepper */}
          <div className="px-6">
            <div className="mb-5 flex items-center gap-3">
              <StepDot n={1} active={step === 1} />
              <div className="h-px flex-1 bg-slate-200" />
              <StepDot n={2} active={step === 2} />
            </div>
          </div>

          {/* body */}
          <div className="px-6 pb-4 flex-1 overflow-y-auto pr-1">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title" required>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short, clear summary"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                </Field>

                <Field label="Code">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Auto or custom (e.g. FUS-123)"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Type" required>
                  <div className="flex flex-wrap gap-2">
                    {["Feature", "Bug", "Chore"].map((t) => (
                      <PillButton key={t} active={type === t} onClick={() => setType(t as any)}>{t}</PillButton>
                    ))}
                  </div>
                </Field>

                <Field label="Priority" required>
                  <div className="flex flex-wrap gap-2">
                    {(["Urgent", "High", "Medium", "Low"] as const).map((p) => (
                      <PillButton key={p} active={priority === p} onClick={() => setPriority(p)}>{p}</PillButton>
                    ))}
                  </div>
                </Field>

                <Field label="Severity">
                  <div className="flex flex-wrap gap-2">
                    {(["Critical", "High", "Medium", "Low"] as const).map((s) => (
                      <PillButton key={s} active={severity === s} onClick={() => setSeverity(severity === s ? undefined : s)}>{s}</PillButton>
                    ))}
                  </div>
                </Field>

                <Field label="Story points">
                  <input
                    inputMode="numeric"
                    value={storyPoints ?? ""}
                    onChange={(e) => setStoryPoints(toNumberOrUndef(e.target.value))}
                    placeholder="e.g. 3"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Estimate hours">
                  <input
                    inputMode="numeric"
                    value={estimateHours ?? ""}
                    onChange={(e) => setEstimateHours(toNumberOrUndef(e.target.value))}
                    placeholder="e.g. 8"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Remaining hours">
                  <input
                    inputMode="numeric"
                    value={remainingHours ?? ""}
                    onChange={(e) => setRemainingHours(toNumberOrUndef(e.target.value))}
                    placeholder="auto = estimate"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Due date">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                      <CalendarDays className="size-4" />
                    </div>
                    <input
                      type="date"
                      value={dueDate ?? ""}
                      onChange={(e) => setDueDate(e.target.value || null)}
                      className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </Field>

                {/* Sprint + Status */}
                <Field label="Sprint" required>
                  <div className="relative">
                    <select
                      value={sprintId ?? ""}
                      onChange={(e) => setSprintId(e.target.value || null)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.sprintId && <p className="mt-1 text-xs text-rose-500">{errors.sprintId}</p>}
                </Field>

                <Field label="Status" required hint="Theo workflow của sprint đã chọn">
                  <StatusPicker sprint={activeSprint} value={statusId} onChange={setStatusId} />
                  {errors.statusId && <p className="mt-1 text-xs text-rose-500">{errors.statusId}</p>}
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Assignees">
                  <MemberMulti value={assigneeIds} onChange={setAssigneeIds} options={members} />
                </Field>

                <Field label="Parent task ID">
                  <input
                    value={parentTaskId ?? ""}
                    onChange={(e) => setParentTaskId(e.target.value || null)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Depends on (task IDs)">
                  <TagInput value={dependsOn} onChange={setDependsOn} placeholder="Type id, press Enter" />
                </Field>

                <Field label="Source ticket">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={sourceTicketId ?? ""}
                      onChange={(e) => setSourceTicketId(e.target.value || null)}
                      placeholder="Ticket ID"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={sourceTicketCode ?? ""}
                      onChange={(e) => setSourceTicketCode(e.target.value || null)}
                      placeholder="Ticket Code"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
                    <LinkIcon className="size-3.5" />
                    Liên kết task này với ticket bên ngoài (nếu có).
                  </div>
                </Field>

                {/* Hints */}
                <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4" />
                  <div>
                    <div><b>Note:</b> Status Category, Code, Name sẽ tự lấy theo Status đã chọn của Sprint.</div>
                    <div>Nếu không chọn Remaining Hours, hệ thống sẽ lấy bằng Estimate.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="p-6 pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => setStep(step === 1 ? 1 : 1)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Close
              </button>
              {step === 1 ? (
                <button
                  onClick={() => (validateStep1() ? setStep(2) : null)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create task"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
