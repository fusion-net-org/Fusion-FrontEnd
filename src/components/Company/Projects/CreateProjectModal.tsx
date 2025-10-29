import React from "react";
import { createPortal } from "react-dom";
import {
  X, ChevronDown, Check, CalendarDays, Users2, Building2, Workflow as WorkflowIcon, Plus
} from "lucide-react";

/* ========= Types ========= */
export type Id = string;
type ProjectStatus = "Planned" | "InProgress" | "OnHold" | "Completed";

export type ProjectCreatePayload = {
  companyId: Id | null;
  isHired: boolean;
  companyHiredId: Id | null;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  workflowMode: "existing" | "new";
  workflowId: Id | null;
  workflowName: string;
  memberIds: Id[];
};

type Option = { id: Id; label: string; sub?: string };

/* ========= Small atoms ========= */
const Field = ({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <label className="block">
    <div className="mb-1.5 text-sm font-medium text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </div>
    {children}
  </label>
);

// Combobox style (popover list, no <select>)
function OptionList({
  value, onChange, options, placeholder = "Select...", search = true
}: {
  value: Id | null;
  onChange: (v: Id | null) => void;
  options: Option[];
  placeholder?: string;
  search?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find(o => o.id === value);
  const filtered = q
    ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()) || o.sub?.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between"
      >
        <span className={selected ? "" : "text-slate-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {search && (
            <div className="mb-2">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 && <div className="p-3 text-sm text-slate-400">No results</div>}
            {filtered.map(o => {
              const active = o.id === value;
              return (
                <button
                  key={o.id}
                  onClick={() => { onChange(o.id); setOpen(false); }}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-left text-sm",
                    active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{o.label}</div>
                      {o.sub && <div className="text-xs text-slate-500">{o.sub}</div>}
                    </div>
                    {active && <Check className="size-4" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Chip = ({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={[
      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition",
      active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
    ].join(" ")}
  >
    {children}
  </button>
);

/* ========= Modal ========= */
export default function CreateProjectModal({
  open, onClose, onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: ProjectCreatePayload) => Promise<void> | void;
}) {
  if (!open) return null;

  // Lock background scroll while modal open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Mock data (replace by API)
  const companies: Option[] = [
    { id: "c1", label: "Fusion Lab" },
    { id: "c2", label: "FPT Software" },
    { id: "c3", label: "Partner Co." },
  ];
  const workflows: Option[] = [
    { id: "w1", label: "Default – Software", sub: "FPT Software" },
    { id: "w2", label: "BugFix – Kanban", sub: "Fusion Lab" },
  ];
  const people: Option[] = [
    { id: "u1", label: "Nguyen Duy", sub: "PM" },
    { id: "u2", label: "Cao Van Dung", sub: "Backend" },
    { id: "u3", label: "Nguyen Kien Minh", sub: "Frontend" },
    { id: "u4", label: "Luong Cong Bang", sub: "QA" },
    { id: "u5", label: "Nguyen Tan Tuong", sub: "DevOps" },
  ];

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<ProjectCreatePayload>({
    companyId: null,
    isHired: false,
    companyHiredId: null,
    code: "",
    name: "",
    description: "",
    status: "Planned",
    startDate: null,
    endDate: null,
    workflowMode: "existing",
    workflowId: null,
    workflowName: "",
    memberIds: [],
  });

  const set = <K extends keyof ProjectCreatePayload>(k: K, v: ProjectCreatePayload[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  /* ===== Validate per step ===== */
  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.companyId) e.companyId = "Please choose a company.";
    if (!form.code.trim()) e.code = "Project code is required.";
    if (!form.name.trim()) e.name = "Project name is required.";
    if (form.isHired && !form.companyHiredId) e.companyHiredId = "Select hired company.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = "End date must be after start date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate2 = () => {
    const e: Record<string, string> = {};
    if (form.workflowMode === "existing" && !form.workflowId) e.workflowId = "Choose a workflow.";
    if (form.workflowMode === "new" && !form.workflowName.trim()) e.workflowName = "Enter new workflow name.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    if (step < 3) setStep((s) => (s + 1) as any);
    else {
      try {
        setSaving(true);
        await onSubmit?.(form);
        setSaving(false);
        onClose();
      } catch (err) {
        setSaving(false);
        alert((err as Error)?.message ?? "Failed to create project.");
      }
    }
  };
  const back = () => setStep((s) => Math.max(1, (s - 1)) as any);

  /* ===== UI helpers ===== */
  const StepDot = ({ n, active }: { n: number; active: boolean }) => (
    <div className={[
      "size-8 rounded-full flex items-center justify-center text-sm font-semibold",
      active ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "bg-slate-100 text-slate-400"
    ].join(" ")}>{n}</div>
  );

  /* ====== Render via Portal (centered, responsive, scrollable) ====== */
  return createPortal(
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      {/* overlay (click to close) */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="
            w-full
            sm:max-w-[920px] lg:max-w-[1080px]
            rounded-2xl border border-slate-200 bg-white
            shadow-[0_10px_40px_-15px_rgba(30,64,175,0.35)]
            flex flex-col
            sm:min-h-[60vh] max-h-[90vh]
          "
          style={{ backgroundImage: "radial-gradient(1000px 200px at 50% -80px, rgba(59,130,246,.08), transparent 60%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header (static) */}
          <div className="p-6 pb-3 flex items-start justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Create New Project</div>
              <div className="text-sm text-slate-500">Fill details • Choose workflow • (Optional) Assign members</div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>

          {/* stepper (static) */}
          <div className="px-6">
            <div className="mb-5 flex items-center gap-3">
              <StepDot n={1} active={step === 1} />
              <div className="h-px flex-1 bg-slate-200" />
              <StepDot n={2} active={step === 2} />
              <div className="h-px flex-1 bg-slate-200" />
              <StepDot n={3} active={step === 3} />
            </div>
          </div>

          {/* body (fills remaining height; scrolls when needed) */}
          <div className="px-6 pb-4 flex-1 overflow-y-auto pr-1 min-h-[320px] sm:min-h-[420px]">
            {step === 1 && (
              <div className="space-y-4">
                <Field label="Company" required>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                      <Building2 className="size-4" />
                    </div>
                    <OptionList
                      value={form.companyId}
                      onChange={(v) => set("companyId", v)}
                      options={companies}
                      placeholder="Choose company"
                    />
                  </div>
                  {errors.companyId && <p className="mt-1 text-xs text-rose-500">{errors.companyId}</p>}
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Project code" required>
                    <input
                      value={form.code}
                      onChange={(e) => set("code", e.target.value)}
                      placeholder="e.g. FUS-PMS"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code}</p>}
                  </Field>
                  <Field label="Project name" required>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Fusion PMS"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Short description…"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Start date">
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400"><CalendarDays className="size-4" /></div>
                      <input
                        type="date"
                        value={form.startDate ?? ""}
                        onChange={(e) => set("startDate", e.target.value || null)}
                        className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </Field>
                  <Field label="End date">
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400"><CalendarDays className="size-4" /></div>
                      <input
                        type="date"
                        value={form.endDate ?? ""}
                        onChange={(e) => set("endDate", e.target.value || null)}
                        className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    {errors.endDate && <p className="mt-1 text-xs text-rose-500">{errors.endDate}</p>}
                  </Field>
                </div>

                <Field label="Type">
                  <div className="flex flex-wrap gap-2">
                    <Chip active={!form.isHired} onClick={() => set("isHired", false)}>Internal</Chip>
                    <Chip active={form.isHired} onClick={() => set("isHired", true)}>Outsourced</Chip>
                  </div>
                </Field>

                {form.isHired && (
                  <Field label="Hired company" required>
                    <OptionList
                      value={form.companyHiredId}
                      onChange={(v) => set("companyHiredId", v)}
                      options={companies.filter(c => c.id !== form.companyId)}
                      placeholder="Select partner company"
                    />
                    {errors.companyHiredId && <p className="mt-1 text-xs text-rose-500">{errors.companyHiredId}</p>}
                  </Field>
                )}

                <Field label="Initial status">
                  <div className="flex flex-wrap gap-2">
                    {(["Planned", "InProgress", "OnHold", "Completed"] as ProjectStatus[]).map(s => (
                      <Chip key={s} active={form.status === s} onClick={() => set("status", s)}>{s}</Chip>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-slate-700">Workflow</div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="wf"
                      className="size-4 accent-blue-600"
                      checked={form.workflowMode === "existing"}
                      onChange={() => set("workflowMode", "existing")}
                    />
                    <span className="text-slate-800">Use existing workflow</span>
                  </label>

                  {form.workflowMode === "existing" && (
                    <div>
                      <OptionList
                        value={form.workflowId}
                        onChange={(v) => set("workflowId", v)}
                        options={workflows}
                        placeholder="Choose workflow"
                      />
                      {errors.workflowId && <p className="mt-1 text-xs text-rose-500">{errors.workflowId}</p>}
                    </div>
                  )}

                  <label className="mt-3 flex items-center gap-2">
                    <input
                      type="radio"
                      name="wf"
                      className="size-4 accent-blue-600"
                      checked={form.workflowMode === "new"}
                      onChange={() => set("workflowMode", "new")}
                    />
                    <span className="text-slate-800">Create new workflow</span>
                  </label>

                  {form.workflowMode === "new" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        value={form.workflowName}
                        onChange={(e) => set("workflowName", e.target.value)}
                        placeholder="Workflow name"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={() => alert("Open Workflow Designer (later)")}
                      >
                        <WorkflowIcon className="size-4" /> Open Designer
                      </button>
                      {errors.workflowName && <p className="col-span-full -mt-2 text-xs text-rose-500">{errors.workflowName}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users2 className="size-4 text-slate-500" /> Assign members (optional)
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Add people">
                    <OptionList value={null} onChange={(id) => {
                      if (!id) return;
                      set("memberIds", Array.from(new Set([...form.memberIds, id])));
                    }} options={people} placeholder="Search and select people" />
                  </Field>

                  <Field label="Selected">
                    {form.memberIds.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-400">No members</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.memberIds.map(id => {
                          const p = people.find(x => x.id === id)!;
                          return (
                            <span key={id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs">
                              <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                {p.label.split(" ").map(s => s[0]).slice(0,2).join("")}
                              </span>
                              {p.label}
                              <button onClick={() => set("memberIds", form.memberIds.filter(m => m !== id))} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                                <X className="size-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Field>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600">
                  You can skip assignment now and invite people later from the Project → Members tab.
                </div>
              </div>
            )}
          </div>

          {/* footer (static) */}
          <div className="p-6 pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={back}
              disabled={step === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Back
            </button>

            <div className="flex items-center gap-2">
              <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={next}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {step < 3 ? "Next" : (<><Plus className="size-4" /> Create</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
