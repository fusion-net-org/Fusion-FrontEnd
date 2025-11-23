/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  X,
  ChevronDown,
  Check,
  CalendarDays,
  Users2,
  Building2,
  Workflow as WorkflowIcon,
  Plus,
  Eye,
  Clock,
} from "lucide-react";

import { getCompanyById } from "@/services/companyService.js";
import {
  getCompanyMembersPaged,
  createProject,
} from "@/services/projectService.js";
import { getActiveCompanySubscriptions } from "@/services/companysubscription.js";

import type { CompanySubscriptionActiveResponse } from "@/interfaces/CompanySubscription/CompanySubscription";

/* === Workflow preview/designer === */
import WorkflowMini from "@/components/Workflow/WorkflowMini";
import WorkflowPreviewModal from "@/components/Workflow/WorkflowPreviewModal";
import WorkflowDesigner from "@/components/Workflow/WorkflowDesigner";
import { getWorkflowPreviews, postWorkflowWithDesigner } from "@/services/workflowService.js";
import type { WorkflowPreviewVm, DesignerDto } from "@/types/workflow";

import { toast } from "react-toastify";

/* ========= Types ========= */
export type Id = string;
type ProjectStatus = "Planned" | "InProgress" | "OnHold" | "Completed";

export type ProjectCreatePayload = {
  companyId: Id | null;
  companySubscriptionId: Id | null;
  isHired: boolean;
  companyRequestId: Id | null;
  projectRequestId: Id | null;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null; // yyyy-MM-dd
  endDate: string | null; // yyyy-MM-dd
  sprintLengthWeeks: number;
  workflowMode: "existing" | "new";
  workflowId: Id | null;
  workflowName: string;
  memberIds: Id[];
};

type Option = { id: Id; label: string; sub?: string };

/* ========= Small atoms ========= */
const Field = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block">
    <div className="mb-1.5 text-sm font-medium text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </div>
    {children}
  </label>
);

/* ---- Lightweight picker (members / partner / subscription) ---- */
function OptionList({
  value,
  onChange,
  options,
  placeholder = "Select...",
  search = true,
  keepOpenOnSelect = false,
  disabled = false,
}: {
  value: Id | null;
  onChange: (v: Id | null) => void;
  options: Option[];
  placeholder?: string;
  search?: boolean;
  keepOpenOnSelect?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find((o) => o.id === value) ?? null;
  const filtered = q
    ? options.filter(
      (o) =>
        o.label.toLowerCase().includes(q.toLowerCase()) ||
        o.sub?.toLowerCase().includes(q.toLowerCase())
    )
    : options;

  return (
    <div className="relative" ref={ref}>
      {/* Nút mở dropdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={[
          "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="flex min-w-0 flex-col">
          <span
            className={
              selected ? "truncate" : "truncate text-slate-400"
            }
          >
            {selected ? selected.label : placeholder}
          </span>
          {selected?.sub && (
            <span className="mt-0.5 truncate text-[11px] text-slate-400">
              {selected.sub}
            </span>
          )}
        </div>
        <ChevronDown
          className={[
            "ml-2 size-4 flex-shrink-0 text-slate-400 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {search && (
            <div className="mb-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-3 text-sm text-slate-400">
                No results
              </div>
            )}
            {filtered.map((o) => {
              const active = o.id === value;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    if (!keepOpenOnSelect) {
                      setOpen(false);
                      setQ("");
                    } else {
                      setQ("");
                    }
                  }}
                  className={[
                    "flex w-full items-start justify-between rounded-lg px-3 py-2 text-left text-sm",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {o.label}
                    </span>
                    {o.sub && (
                      <span className="mt-0.5 truncate text-[11px] text-slate-500">
                        {o.sub}
                      </span>
                    )}
                  </div>
                  {active && (
                    <Check className="mt-0.5 size-4 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setQ("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Chip = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={[
      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition",
      active
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
    ].join(" ")}
  >
    {children}
  </button>
);

/* ========= Helpers ========= */
const isGuid = (s?: string | null) =>
  !!s &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    s
  );

const makeInitialDto = (name = "New Workflow"): DesignerDto => {
  const uid = () =>
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2);

  const s1 = {
    id: uid(),
    name: "Start",
    isStart: true,
    isEnd: false,
    x: 200,
    y: 350,
    roles: ["Reporter"],
    color: "#10b981",
  };
  const s2 = {
    id: uid(),
    name: "Work",
    isStart: false,
    isEnd: false,
    x: 520,
    y: 350,
    roles: ["Developer"],
    color: "#4f46e5",
  };
  const s3 = {
    id: uid(),
    name: "Done",
    isStart: false,
    isEnd: true,
    x: 840,
    y: 350,
    roles: ["Reviewer", "QA"],
    color: "#111827",
  };

  return {
    workflow: { id: uid(), name },
    statuses: [s1, s2, s3],
    transitions: [
      { fromStatusId: s1.id, toStatusId: s2.id, type: "success", label: "Go" },
      {
        fromStatusId: s2.id,
        toStatusId: s3.id,
        type: "success",
        label: "Complete",
      },
      {
        fromStatusId: s3.id,
        toStatusId: s2.id,
        type: "failure",
        label: "Rework",
      },
    ],
  };
};

/* ========= Selected Workflow Preview ========= */
function SelectedWorkflowPreview({
  companyId,
  workflowId,
  name,
  onClear,
}: {
  companyId: string | null;
  workflowId: string;
  name: string;
  onClear: () => void;
}) {
  const [mini, setMini] = React.useState<WorkflowPreviewVm | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [openPreview, setOpenPreview] = React.useState(false);

  React.useEffect(() => {
    let stop = false;
    (async () => {
      if (!companyId || !workflowId) return;
      setLoading(true);
      try {
        const list = (await getWorkflowPreviews(companyId)) as
          | WorkflowPreviewVm[]
          | null
          | undefined;
        const found =
          (list ?? []).find(
            (x: WorkflowPreviewVm) => x.id === workflowId
          ) ?? null;
        setMini(found);
      } catch {
        if (!stop) setMini(null);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [companyId, workflowId]);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="font-medium truncate">{name || "Workflow"}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenPreview(true)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Preview
          </button>
          <button
            onClick={onClear}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="h-[180px] animate-pulse rounded-lg bg-gray-50" />
        ) : mini ? (
          <WorkflowMini data={mini} />
        ) : (
          <div className="flex h-[180px] items-center justify-center rounded-lg bg-gray-50 text-sm text-slate-500">
            No preview available
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-3 pb-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: "#10b981" }}
          />{" "}
          Success
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: "#ef4444" }}
          />{" "}
          Fail
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: "#111827" }}
          />{" "}
          Optional
        </span>
      </div>

      {openPreview && (
        <WorkflowPreviewModal
          open={openPreview}
          workflowId={workflowId}
          onClose={() => setOpenPreview(false)}
        />
      )}
    </div>
  );
}

/* ========= MODAL: Workflow Picker ========= */
function WorkflowPickerModal({
  open,
  companyId,
  onClose,
  onSelect,
}: {
  open: boolean;
  companyId: string | null;
  onClose: () => void;
  onSelect: (wf: { id: string; name: string }) => void;
}) {
  const [items, setItems] = React.useState<WorkflowPreviewVm[]>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (!isGuid(companyId)) {
      setItems([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const data = await getWorkflowPreviews(companyId as string);
        setItems(data || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, companyId]);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => i.name.toLowerCase().includes(t));
  }, [items, q]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="h-[-webkit-fill-available] max-h-[86vh] w-full max-w-[1000px] overflow-auto rounded-2xl border bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b p-4">
            <div className="font-semibold">Select a Workflow</div>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search workflows…"
                className="w-[260px] rounded-lg border px-3 py-2 text-sm"
              />
              {!isGuid(companyId) && (
                <span className="text-xs text-rose-600">
                  CompanyId chưa hợp lệ — mở ở trang có URL dạng
                  /companies/:companyId/...
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border bg-white p-3"
                  >
                    <div className="mb-3 h-5 w-2/3 rounded bg-gray-200" />
                    <div className="h-[160px] rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No workflows found.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((w) => (
                  <div
                    key={w.id}
                    className="overflow-hidden rounded-lg border bg-white"
                  >
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <div className="font-medium truncate">{w.name}</div>
                      <button
                        onClick={() => setPreviewId(w.id)}
                        className="rounded p-1 hover:bg-gray-100"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    <WorkflowMini data={w} />
                    <div className="flex items-center justify-end border-t px-3 py-2">
                      <button
                        onClick={() => {
                          onSelect({ id: w.id, name: w.name });
                          onClose();
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewId && (
            <WorkflowPreviewModal
              open={!!previewId}
              workflowId={previewId}
              onClose={() => setPreviewId(null)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ========= MODAL: Create Workflow ========= */
function CreateWorkflowModal({
  open,
  companyId,
  onClose,
  onCreated,
}: {
  open: boolean;
  companyId: string | null;
  onClose: () => void;
  onCreated: (wf: { id: string; name: string }) => void;
}) {
  const [dto] = React.useState<DesignerDto>(() => makeInitialDto());

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async (payload: DesignerDto) => {
    if (!isGuid(companyId))
      throw new Error("Invalid companyId — cannot create workflow.");
    const result = await postWorkflowWithDesigner(companyId as string, payload);
    const wfId = typeof result === "string" ? result : (result as any)?.id;
    if (!wfId) throw new Error("Cannot get workflowId from POST response");
    onCreated({ id: wfId, name: payload.workflow.name });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
        <div
          className="relative h-[88vh] w-full max-w-[1200px] overflow-hidden rounded-2xl border bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b bg-white/85 px-4 py-3 backdrop-blur">
            <div className="font-semibold">Create workflow</div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="h-full overflow-auto pt-[52px]">
            <WorkflowDesigner
              initialDto={dto}
              onSave={handleSave}
              title="Create workflow"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ========= MAIN MODAL: Create Project ========= */
export default function CreateProjectModal({
  open,
  onClose,
  onSubmit,
  companyName,
  defaultValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: ProjectCreatePayload) => Promise<void> | void;
  companyName?: string;
  defaultValues?: any;
}) {
  if (!open) return null;

  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = defaultValues?.companyId ?? routeCompanyId ?? null;
  const canUseCompany = isGuid(companyId);

  const [companyLabel, setCompanyLabel] = React.useState(companyName ?? "");
  const [companyRequestProject, setCompanyRequestProject] =
    React.useState("");

  // load company name for hired project (trường hợp tạo từ project request)
  const fetchGetCompanyByIdFromProjectRequest = async () => {
    if (!companyId) return;
    try {
      const result = await getCompanyById(companyId as string);
      setCompanyRequestProject(result?.data?.name || "(Unknown company)");
    } catch (err: any) {
      console.error("Error fetching company:", err);
    }
  };
  // React.useEffect(() => {
  //   fetchGetCompanyByIdFromProjectRequest();
  // });
  React.useEffect(() => {
    if (companyId) {
      fetchGetCompanyByIdFromProjectRequest();
    }
  }, [companyId]);

  // Lấy tên company khi mở modal / đổi companyId
  React.useEffect(() => {
    let alive = true;

    if (companyName) {
      setCompanyLabel(companyName);
      return;
    }

    (async () => {
      if (!canUseCompany || !companyId) {
        if (alive) setCompanyLabel("");
        return;
      }
      try {
        const res = await getCompanyById(companyId as string);
        const payload = res?.data ?? res;
        const name = payload?.name ?? payload?.data?.name ?? "";
        if (alive) setCompanyLabel(name || "");
      } catch {
        if (alive) setCompanyLabel("");
      }
    })();

    return () => {
      alive = false;
    };
  }, [companyId, canUseCompany, companyName]);

  // React.useEffect(() => {
  //   document.body.style.overflow = open ? 'hidden' : '';
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, [open]);

  React.useEffect(() => {
    if (defaultValues) {
      setForm((prev) => ({
        ...prev,
        companyId: defaultValues.companyId ?? prev.companyId,
        companyRequestId: defaultValues.companyRequestId ?? prev.companyRequestId,
        projectRequestId: defaultValues.projectRequestId ?? prev.projectRequestId,
        isHired: defaultValues.isHire ?? prev.isHired,
        // companyHiredId: defaultValues.companyHiredId ?? prev.companyHiredId,
        code: defaultValues.code ?? prev.code,
        name: defaultValues.name ?? prev.name,
        description: defaultValues.description ?? prev.description,
        startDate: defaultValues.startDate ?? prev.startDate,
        endDate: defaultValues.endDate ?? prev.endDate,
      }));
    }
  }, [defaultValues]);

  // mock people
  const [people, setPeople] = React.useState<Option[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);

  // company subscriptions (active)
  const [companySubs, setCompanySubs] =
    React.useState<CompanySubscriptionActiveResponse[]>([]);
  const [companySubsLoading, setCompanySubsLoading] = React.useState(false);

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [workflowSelectedName, setWorkflowSelectedName] =
    React.useState<string>("");

  const [form, setForm] = React.useState<ProjectCreatePayload>({
    companyId: defaultValues?.companyId ?? companyId,
    companySubscriptionId: defaultValues?.companySubscriptionId ?? null,
    isHired: defaultValues?.isHire ?? false,
    companyRequestId: defaultValues?.companyRequestId ?? null,
    projectRequestId: defaultValues?.projectRequestId ?? null,
    code: defaultValues?.code ?? "",
    name: defaultValues?.name ?? "",
    description: defaultValues?.description ?? "",
    status: "Planned",
    startDate: defaultValues?.startDate ?? null,
    endDate: defaultValues?.endDate ?? null,
    sprintLengthWeeks: 1,
    workflowMode: "existing",
    workflowId: null,
    workflowName: "",
    memberIds: [],
  });

  // sync defaultValues khi props đổi
  React.useEffect(() => {
    if (!defaultValues) return;
    setForm((prev) => ({
      ...prev,
      companyId: defaultValues.companyId ?? prev.companyId,
      companySubscriptionId:
        defaultValues.companySubscriptionId ?? prev.companySubscriptionId,
      companyRequestId:
        defaultValues.companyRequestId ?? prev.companyRequestId,
      projectRequestId:
        defaultValues.projectRequestId ?? prev.projectRequestId,
      code: defaultValues.code ?? prev.code,
      name: defaultValues.name ?? prev.name,
      description: defaultValues.description ?? prev.description,
      startDate: defaultValues.startDate ?? prev.startDate,
      endDate: defaultValues.endDate ?? prev.endDate,
    }));
  }, [defaultValues]);

  // load members theo company
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!routeCompanyId) {
        if (alive) {
          setPeople([]);
          setMembers([]);
        }
        return;
      }
      setLoadingMembers(true);
      try {
        const res = await getCompanyMembersPaged(routeCompanyId, {
          pageNumber: 1,
          pageSize: 50,
        });
        if (!alive) return;
        setMembers(res.items);
        const opts: Option[] = res.items.map(
          (m: {
            memberId: string | number;
            memberName?: string | null;
            roleName?: string | null;
            email?: string | null;
          }) => ({
            id: String(m.memberId),
            label: m.memberName ?? m.email ?? "",
            sub: m.roleName ?? m.email ?? "",
          })
        );
        setPeople(opts);
      } catch {
        if (alive) {
          setPeople([]);
          setMembers([]);
        }
      } finally {
        if (alive) setLoadingMembers(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [companyId, routeCompanyId]);

  // load active company subscriptions
  React.useEffect(() => {
    let alive = true;

    (async () => {
      if (!canUseCompany || !companyId) {
        if (alive) setCompanySubs([]);
        return;
      }

      setCompanySubsLoading(true);
      try {
        const data = await getActiveCompanySubscriptions(companyId as string);
        if (!alive) return;
        setCompanySubs(data ?? []);

        // nếu chỉ có 1 subscription thì auto select
        if (!form.companySubscriptionId && data && data.length === 1) {
          setForm((prev) => ({
            ...prev,
            companySubscriptionId: String(data[0].id),
          }));
        }
      } catch (err) {
        if (alive) {
          console.error("Failed to load company subscriptions", err);
          setCompanySubs([]);
        }
      } finally {
        if (alive) setCompanySubsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, canUseCompany]);

  // subscription đang được chọn
  const selectedCompanySub = React.useMemo<
    CompanySubscriptionActiveResponse | null
  >(() => {
    if (!form.companySubscriptionId) return null;
    return (
      companySubs.find(
        (s) => String(s.id) === String(form.companySubscriptionId)
      ) ?? null
    );
  }, [companySubs, form.companySubscriptionId]);

  // options cho dropdown subscription
  const subscriptionOptions: Option[] = React.useMemo(
    () =>
      companySubs.map((sub, idx) => ({
        id: String(sub.id),
        label: sub.nameSubscription || `Subscription ${idx + 1}`,
        sub:
          sub.seatsLimitSnapshot != null
            ? `${sub.seatsLimitSnapshot} seats`
            : "Unlimited seats",
      })),
    [companySubs]
  );

  // đồng bộ companyId khi URL đổi
  React.useEffect(() => {
    setForm((prev) => ({ ...prev, companyId }));
  }, [companyId]);

  // sprint length input
  const [weeksRaw, setWeeksRaw] = React.useState(String(1));
  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const bad = ["-", "+", "e", "E", "."];
    if (bad.includes(e.key)) e.preventDefault();
  };
  const handleWeeksChange = (v: string) => {
    setWeeksRaw(v);
    const n = Math.floor(Number(v));
    if (Number.isFinite(n) && n >= 1) {
      setForm((prev) => ({ ...prev, sprintLengthWeeks: n }));
      setErrors((prev) => {
        const { sprintLengthWeeks, ...rest } = prev;
        return rest;
      });
    } else {
      setErrors((prev) => ({
        ...prev,
        sprintLengthWeeks: "Enter a whole number ≥ 1.",
      }));
    }
  };
  const handleWeeksBlur = () => {
    const n = Math.floor(Number(weeksRaw));
    const fixed = Number.isFinite(n) && n >= 1 ? n : 1;
    setWeeksRaw(String(fixed));
    setForm((prev) => ({ ...prev, sprintLengthWeeks: fixed }));
    setErrors((prev) => {
      const { sprintLengthWeeks, ...rest } = prev;
      return rest;
    });
  };

  const [openPicker, setOpenPicker] = React.useState(false);
  const [openCreateWf, setOpenCreateWf] = React.useState(false);

  const set = <K extends keyof ProjectCreatePayload>(
    k: K,
    v: ProjectCreatePayload[K]
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  /* ===== Validate per step ===== */
  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.companyId) e.companyId = "Company is required.";
    if (form.companyId && !isGuid(form.companyId))
      e.companyId = "Invalid company id.";
    if (!form.code.trim()) e.code = "Project code is required.";
    if (!form.name.trim()) e.name = "Project name is required.";

    if (!form.companySubscriptionId) {
      e.companySubscriptionId = "Subscription is required.";
    }

    if (!form.startDate) e.startDate = "Start date is required.";
    if (!form.endDate) e.endDate = "End date is required.";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = "End date must be after start date.";
    if (
      !Number.isInteger(form.sprintLengthWeeks) ||
      form.sprintLengthWeeks < 1
    ) {
      e.sprintLengthWeeks = "Sprint length must be an integer ≥ 1.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: Record<string, string> = {};
    if (form.workflowMode === "existing" && !form.workflowId)
      e.workflowId = "Choose a workflow.";
    if (form.workflowMode === "new" && !form.workflowName.trim())
      e.workflowName = "Enter new workflow name.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;

    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
    } else {
      try {
        setSaving(true);

        const payloadToPost: any = {
          ...form,
          workflowId: form.workflowId!,
        };
        delete payloadToPost.workflowMode;
        delete payloadToPost.workflowName;

        // Nếu cha truyền onSubmit thì ưu tiên dùng callback

        // const res = await createProject(payloadToPost);

        // nếu cha có truyền onSubmit thì gọi thêm (không thay thế API)
        if (onSubmit) {
          await onSubmit(payloadToPost);
        }

        onClose();
      } catch (err: any) {
        console.error('Create project failed:', err);
        toast.error(err?.response?.data?.message || err.message || 'Create project failed');
      } finally {
        setSaving(false);
      }
    }
  };

  const back = () =>
    setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);

  // Stepper dot với label
  const StepDot = ({
    n,
    label,
    active,
  }: {
    n: number;
    label: string;
    active: boolean;
  }) => (
    <div className="flex items-center gap-2">
      <div
        className={[
          "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-slate-100 text-slate-400",
        ].join(" ")}
      >
        {n}
      </div>
      <span
        className={[
          "hidden text-xs sm:inline",
          active ? "font-medium text-slate-900" : "text-slate-400",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );

  const stepsMeta = [
    { n: 1, label: "Basics" },
    { n: 2, label: "Workflow" },
    { n: 3, label: "Members" },
  ] as const;

  const projectTypeLabel = form.isHired ? "Outsourced" : "Internal";

  return createPortal(
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="flex max-h-[90vh] w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_-15px_rgba(30,64,175,0.35)] sm:min-h-[60vh] sm:max-w-[920px] lg:max-w-[1080px]"
          style={{
            backgroundImage:
              "radial-gradient(1000px 200px at 50% -80px, rgba(59,130,246,.06), transparent 60%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-start justify-between p-6 pb-3">
            <div>
              <div className="text-xl font-semibold text-slate-800">
                Create New Project
              </div>
              <div className="text-sm text-slate-500">
                Step {step} of 3 • Fill details, choose workflow, assign members
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* stepper */}
          <div className="px-6">
            <div className="mb-5 flex items-center justify-between gap-2 text-xs sm:text-sm">
              {stepsMeta.map((s, idx) => (
                <React.Fragment key={s.n}>
                  <StepDot
                    n={s.n}
                    label={s.label}
                    active={step === (s.n as 1 | 2 | 3)}
                  />
                  {idx < stepsMeta.length - 1 && (
                    <div className="hidden flex-1 items-center justify-center sm:flex">
                      <div className="h-px w-full bg-slate-200" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* body */}
          <div className="min-h-[320px] flex-1 overflow-y-auto px-6 pb-4 pr-1 sm:min-h-[420px]">
            {step === 1 && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1.15fr)]">
                {/* LEFT: form fields */}
                <div className="space-y-4">
                  {/* Project basics */}
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Project basics
                      </div>
                      <div className="text-xs text-slate-500">
                        Choose the subscription and company for this project.
                      </div>
                    </div>

                    <Field label="Subscription" required>
                      <OptionList
                        value={form.companySubscriptionId}
                        onChange={(v) => set("companySubscriptionId", v)}
                        options={subscriptionOptions}
                        placeholder={
                          companySubsLoading
                            ? "Loading subscriptions…"
                            : "Select active subscription"
                        }
                      />

                      {errors.companySubscriptionId && (
                        <p className="mt-1 text-xs text-rose-500">
                          {errors.companySubscriptionId}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] text-slate-400">
                        Only active subscriptions of this company are listed
                        here.
                      </p>

                      {/* Feature chips nhỏ, ngay bên dưới */}
                      {selectedCompanySub && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {selectedCompanySub.companySubscriptionEntitlements &&
                            selectedCompanySub.companySubscriptionEntitlements
                              .length > 0 ? (
                            selectedCompanySub.companySubscriptionEntitlements.map(
                              (f) => (
                                <span
                                  key={f.id}
                                  className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                                >
                                  {f.featureName}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              This subscription has no feature entitlements.
                            </span>
                          )}
                        </div>
                      )}
                    </Field>

                    <Field label="Company" required>
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                          <Building2 className="size-4" />
                        </div>
                        <input
                          value={companyLabel}
                          disabled
                          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-700"
                        />
                      </div>
                      {!canUseCompany && (
                        <p className="mt-1 text-xs text-rose-500">
                          CompanyId in url not guid
                        </p>
                      )}
                    </Field>

                    <Field label="Type">
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          active={!form.isHired}
                          onClick={() => set("isHired", false)}
                        >
                          Internal
                        </Chip>
                        <Chip
                          active={form.isHired}
                          onClick={() => set("isHired", true)}
                        >
                          Outsourced
                        </Chip>
                      </div>
                    </Field>

                    {form.isHired && (
                      <Field label="Hired company" required>
                        {defaultValues?.companyId ? (
                          <input
                            type="text"
                            disabled
                            value={companyRequestProject ?? ""}
                            onChange={() => { }}
                            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          />
                        ) : (
                          <OptionList
                            value={form.companyRequestId}
                            onChange={(v) => set("companyRequestId", v)}
                            options={[
                              { id: "p1", label: "Partner A" },
                              { id: "p2", label: "Partner B" },
                              { id: "p3", label: "Partner C" },
                            ]}
                            placeholder="Select partner company"
                          />
                        )}

                        {errors.companyRequestId && (
                          <p className="mt-1 text-xs text-rose-500">
                            {errors.companyRequestId}
                          </p>
                        )}
                      </Field>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Project details
                      </div>
                      <div className="text-xs text-slate-500">
                        Name, code and short description.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Project code" required>
                        <input
                          value={form.code}
                          onChange={(e) => set("code", e.target.value)}
                          placeholder="e.g. FUS-PMS"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.code && (
                          <p className="mt-1 text-xs text-rose-500">
                            {errors.code}
                          </p>
                        )}
                      </Field>
                      <Field label="Project name" required>
                        <input
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="e.g. Fusion PMS"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-rose-500">
                            {errors.name}
                          </p>
                        )}
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
                  </div>

                  {/* Schedule */}
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Schedule & sprint
                      </div>
                      <div className="text-xs text-slate-500">
                        Define project duration and sprint length.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Start date" required>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                            <CalendarDays className="size-4" />
                          </div>
                          <input
                            type="date"
                            value={form.startDate ?? ""}
                            onChange={(e) =>
                              set("startDate", e.target.value || null)
                            }
                            className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        {errors.startDate && (
                          <p className="mt-1 text-xs text-rose-500">
                            {errors.startDate}
                          </p>
                        )}
                      </Field>
                      <Field label="End date" required>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                            <CalendarDays className="size-4" />
                          </div>
                          <input
                            type="date"
                            value={form.endDate ?? ""}
                            onChange={(e) =>
                              set("endDate", e.target.value || null)
                            }
                            className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        {errors.endDate && (
                          <p className="mt-1 text-xs text-rose-500">
                            {errors.endDate}
                          </p>
                        )}
                      </Field>
                    </div>

                    <Field label="Sprint length (weeks)" required>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={1}
                        step={1}
                        value={weeksRaw}
                        onChange={(e) => handleWeeksChange(e.target.value)}
                        onBlur={handleWeeksBlur}
                        onKeyDown={(e) => {
                          blockNonNumericKeys(e);
                          if (e.key === "Enter") next();
                        }}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData("text");
                          if (!/^\d+$/.test(text)) e.preventDefault();
                        }}
                        className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      {errors.sprintLengthWeeks && (
                        <p className="mt-1 text-xs text-rose-500">
                          {errors.sprintLengthWeeks}
                        </p>
                      )}
                    </Field>
                  </div>
                </div>

                {/* RIGHT: preview card */}
                <div className="hidden lg:block">
                  <div className="sticky top-4 space-y-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Project preview
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          Step 1 of 3
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {form.name || "Project name"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {(form.code || "Code").toUpperCase()} •{" "}
                          {projectTypeLabel}
                        </div>
                        {companyLabel && (
                          <div className="mt-1 text-xs text-slate-500">
                            {companyLabel}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="size-3.5 text-slate-400" />
                            Dates
                          </span>
                          <span className="font-medium">
                            {(form.startDate || "Start") +
                              " → " +
                              (form.endDate || "End")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-slate-400" />
                            Sprint length
                          </span>
                          <span className="font-medium">
                            {form.sprintLengthWeeks || 1} week
                            {form.sprintLengthWeeks > 1 ? "s" : ""}
                          </span>
                        </div>
                        {selectedCompanySub && (
                          <div className="flex items-start justify-between gap-2">
                            <span className="mt-0.5 text-xs text-slate-500">
                              Subscription
                            </span>
                            <div className="text-right">
                              <div className="text-xs font-medium text-slate-800">
                                {selectedCompanySub.nameSubscription ||
                                  "Subscription"}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {selectedCompanySub.seatsLimitSnapshot != null
                                  ? `${selectedCompanySub.seatsLimitSnapshot} seats`
                                  : "Unlimited seats"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-sm font-semibold text-slate-800">
                    Workflow
                  </div>
                  <div className="text-xs text-slate-500">
                    Define how tasks move between statuses in this project.
                  </div>
                </div>

                {/* Existing Mode */}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="wf"
                    className="size-4 accent-blue-600"
                    checked={form.workflowMode === "existing"}
                    onChange={() => set("workflowMode", "existing")}
                  />
                  <span className="text-slate-800">
                    Use existing workflow
                  </span>
                </label>

                {form.workflowMode === "existing" && (
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(true)}
                        disabled={!canUseCompany}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        <WorkflowIcon className="size-4" /> Browse workflows
                      </button>
                      {form.workflowId ? (
                        <span className="text-xs text-slate-500">
                          Selected:{" "}
                          <span className="font-medium">
                            {workflowSelectedName || "Workflow"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          No workflow selected.
                        </span>
                      )}
                    </div>
                    {errors.workflowId && (
                      <p className="text-xs text-rose-500">
                        {errors.workflowId}
                      </p>
                    )}
                    {form.workflowId && (
                      <SelectedWorkflowPreview
                        companyId={companyId}
                        workflowId={form.workflowId}
                        name={workflowSelectedName || "Workflow"}
                        onClear={() => {
                          set("workflowId", null);
                          setWorkflowSelectedName("");
                        }}
                      />
                    )}
                  </div>
                )}

                {/* New Mode */}
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
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <Field label="Workflow name" required>
                        <input
                          value={form.workflowName}
                          onChange={(e) =>
                            set("workflowName", e.target.value)
                          }
                          placeholder="e.g. Default product workflow"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </Field>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => setOpenCreateWf(true)}
                          disabled={!canUseCompany}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                          <WorkflowIcon className="size-4" /> Create in
                          Designer
                        </button>
                      </div>
                    </div>
                    {errors.workflowName && (
                      <p className="-mt-2 text-xs text-rose-500">
                        {errors.workflowName}
                      </p>
                    )}
                    <div className="text-xs text-slate-500">
                      Tip: enter a name, then open the Designer to adjust
                      statuses and transitions. After saving, the new workflow
                      will be selected automatically.
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Users2 className="size-4 text-slate-500" /> Assign members
                    (optional)
                  </div>
                  <div className="text-xs text-slate-500">
                    You can assign people now or invite them later from the
                    project Members tab.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Add people">
                    <OptionList
                      value={null}
                      onChange={(id) => {
                        if (!id) return;
                        set(
                          "memberIds",
                          Array.from(new Set([...form.memberIds, id]))
                        );
                      }}
                      options={people}
                      placeholder={
                        loadingMembers
                          ? "Loading members…"
                          : "Search and select people"
                      }
                      keepOpenOnSelect
                    />
                  </Field>
                  <Field label="Selected">
                    {form.memberIds.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-400">
                        No members selected
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.memberIds.map((id) => {
                          const p =
                            people.find((x) => x.id === id) || {
                              id,
                              label: String(id),
                              sub: "",
                            };
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
                            >
                              <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                {p.label
                                  .split(" ")
                                  .map((s) => s[0])
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .join("")}
                              </span>
                              <span className="max-w-[120px] truncate sm:max-w-[180px]">
                                {p.label}
                              </span>
                              <button
                                onClick={() =>
                                  set(
                                    "memberIds",
                                    form.memberIds.filter((m) => m !== id)
                                  )
                                }
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                              >
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
                  You can skip this step. Members and roles can be adjusted at
                  any time inside the project.
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex items-center justify-between border-t border-slate-100 p-6 pt-3">
            <button
              onClick={back}
              disabled={step === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={next}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {step < 3 ? (
                  "Next"
                ) : (
                  <>
                    <Plus className="size-4" /> Done
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* sub-modals step 2 */}
      {openPicker && (
        <WorkflowPickerModal
          open={openPicker}
          companyId={routeCompanyId ?? null}
          onClose={() => setOpenPicker(false)}
          onSelect={(wf) => {
            set("workflowMode", "existing");
            set("workflowId", wf.id);
            setWorkflowSelectedName(wf.name);
          }}
        />
      )}
      {openCreateWf && (
        <CreateWorkflowModal
          open={openCreateWf}
          companyId={routeCompanyId ?? null}
          onClose={() => setOpenCreateWf(false)}
          onCreated={(wf) => {
            set("workflowMode", "existing");
            set("workflowId", wf.id);
            setWorkflowSelectedName(wf.name);
            set("workflowName", "");
            setOpenCreateWf(false);
          }}
        />
      )}
    </div>,
    document.body
  );
}
