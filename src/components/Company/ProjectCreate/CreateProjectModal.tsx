/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { getCompanyById } from '@/services/companyService.js'; // chỉnh path đúng nơi bạn đặt file
import {
  getCompanyMembersPaged,
  getCompanyMemberOptions,
  createProject,
} from '@/services/projectService.js';
/* === Workflow preview/designer === */
import WorkflowMini from '@/components/Workflow/WorkflowMini';
import WorkflowPreviewModal from '@/components/Workflow/WorkflowPreviewModal';
import WorkflowDesigner from '@/components/Workflow/WorkflowDesigner';
import { getWorkflowPreviews, postWorkflowWithDesigner } from '@/services/workflowService.js';
import type { WorkflowPreviewVm, DesignerDto } from '@/types/workflow';
import { toast } from 'react-toastify';
/* ========= Types ========= */
export type Id = string;
type ProjectStatus = 'Planned' | 'InProgress' | 'OnHold' | 'Completed';

export type ProjectCreatePayload = {
  companyId: Id | null;
  isHired: boolean;
  companyRequestId: Id | null;
  projectRequestId: Id | null;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null; // yyyy-MM-dd
  endDate: string | null; // yyyy-MM-dd
  sprintLengthWeeks: number; // >= 1
  workflowMode: 'existing' | 'new';
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

/* ---- Lightweight picker (dùng cho members/partner) ---- */
function OptionList({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  search = true,
}: {
  value: Id | null;
  onChange: (v: Id | null) => void;
  options: Option[];
  placeholder?: string;
  search?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);
  const selected = options.find((o) => o.id === value);
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q.toLowerCase()) ||
          o.sub?.toLowerCase().includes(q.toLowerCase()),
      )
    : options;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between"
      >
        <span className={selected ? '' : 'text-slate-400'}>
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
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 && <div className="p-3 text-sm text-slate-400">No results</div>}
            {filtered.map((o) => {
              const active = o.id === value;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={[
                    'w-full rounded-lg px-3 py-2 text-left text-sm',
                    active ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50',
                  ].join(' ')}
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
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
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
const Chip = ({
  active,
  children,
  onClick,
  disabled = false,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
      disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '',
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    ].join(' ')}
  >
    {children}
  </button>
);

/* ========= Helpers ========= */
const isGuid = (s?: string | null) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

const makeInitialDto = (name = 'New Workflow'): DesignerDto => {
  const uid = () =>
    typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2);
  const s1 = {
    id: uid(),
    name: 'Start',
    isStart: true,
    isEnd: false,
    x: 200,
    y: 350,
    roles: ['Reporter'],
    color: '#10b981',
  };
  const s2 = {
    id: uid(),
    name: 'Work',
    isStart: false,
    isEnd: false,
    x: 520,
    y: 350,
    roles: ['Developer'],
    color: '#4f46e5',
  };
  const s3 = {
    id: uid(),
    name: 'Done',
    isStart: false,
    isEnd: true,
    x: 840,
    y: 350,
    roles: ['Reviewer', 'QA'],
    color: '#111827',
  };
  return {
    workflow: { id: uid(), name },
    statuses: [s1, s2, s3],
    transitions: [
      { fromStatusId: s1.id, toStatusId: s2.id, type: 'success', label: 'Go' },
      { fromStatusId: s2.id, toStatusId: s3.id, type: 'success', label: 'Complete' },
      { fromStatusId: s3.id, toStatusId: s2.id, type: 'failure', label: 'Rework' },
    ],
  };
};
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
        // lấy list preview rồi find theo id (không đổi service hiện tại)
        const list = (await getWorkflowPreviews(companyId)) as
          | WorkflowPreviewVm[]
          | null
          | undefined;
        const found = (list ?? []).find((x: WorkflowPreviewVm) => x.id === workflowId) ?? null;
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
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* header */}
      <div className="px-3 py-2 flex items-center justify-between border-b">
        <div className="font-medium truncate">{name || 'Workflow'}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenPreview(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            Preview
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm rounded-lg text-rose-600 border border-rose-200 hover:bg-rose-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* thumbnail */}
      <div className="p-2">
        {loading ? (
          <div className="h-[180px] rounded-lg bg-gray-50 animate-pulse" />
        ) : mini ? (
          <WorkflowMini data={mini} />
        ) : (
          <div className="h-[180px] rounded-lg bg-gray-50 flex items-center justify-center text-sm text-slate-500">
            No preview available
          </div>
        )}
      </div>

      {/* legend (giống list page, nhưng không có Edit/Delete) */}
      <div className="px-3 pb-2 flex items-center gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} /> Success
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} /> Fail
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: '#111827' }} /> Optional
        </span>
      </div>

      {/* modal preview lớn */}
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
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    // CHẶN gọi API nếu companyId chưa phải GUID hợp lệ
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
        setItems([]); // tránh throw gây Unhandled
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
          className="w-full max-w-[1000px] rounded-2xl bg-white border shadow-xl h-[-webkit-fill-available] overflow-auto max-h-[86vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 flex items-center justify-between border-b">
            <div className="font-semibold">Select a Workflow</div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X className="size-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search workflows…"
                className="border rounded-lg px-3 py-2 text-sm w-[260px]"
              />
              {!isGuid(companyId) && (
                <span className="text-xs text-rose-600">
                  CompanyId chưa hợp lệ — mở ở trang có URL dạng /companies/:companyId/...
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3 animate-pulse bg-white">
                    <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                    <div className="h-[160px] bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500 text-sm">No workflows found.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((w) => (
                  <div key={w.id} className="rounded-lg border bg-white overflow-hidden">
                    <div className="px-3 py-2 flex items-center justify-between border-b">
                      <div className="font-medium truncate">{w.name}</div>
                      <button
                        onClick={() => setPreviewId(w.id)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    <WorkflowMini data={w} />
                    <div className="px-3 py-2 border-t flex items-center justify-end">
                      <button
                        onClick={() => {
                          onSelect({ id: w.id, name: w.name });
                          onClose();
                        }}
                        className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
    document.body,
  );
}

/* ========= MODAL: Create Workflow (giữ nguyên; sẽ disable nếu companyId invalid) ========= */
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
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async (payload: DesignerDto) => {
    if (!isGuid(companyId)) throw new Error('Invalid companyId — cannot create workflow.');
    // CHƯA cần tạo thật thì có thể return sớm tại đây.
    const result = await postWorkflowWithDesigner(companyId as string, payload);
    const wfId = typeof result === 'string' ? result : (result as any)?.id;
    if (!wfId) throw new Error('Cannot get workflowId from POST response');
    onCreated({ id: wfId, name: payload.workflow.name });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
        <div
          className="relative w-full max-w-[1200px] h-[88vh] rounded-2xl bg-white border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-white/85 backdrop-blur">
            <div className="font-semibold">Create workflow</div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="h-full pt-[52px] overflow-auto">
            <WorkflowDesigner initialDto={dto} onSave={handleSave} title="Create workflow" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
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
  onSubmit?: (payload: ProjectCreatePayload) => Promise<void> | void; // chưa dùng tới cũng OK
  companyName?: string; // truyền từ trang CompanyDetails nếu bạn có
  defaultValues?: any;
}) {
  if (!open) return null;
  // LẤY companyId TỰ ĐỘNG TỪ URL /companies/:companyId/...
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = defaultValues?.companyId ?? routeCompanyId ?? null;
  const canUseCompany = isGuid(companyId);
  // Nhãn hiển thị ở ô Company (ưu tiên prop companyName, nếu không thì fetch theo companyId)
  const [companyLabel, setCompanyLabel] = React.useState(companyName ?? '');
  const [companyRequestProject, setCompanyRequestProject] = React.useState('');
  const fetchGetCompanyByIdFromProjectRequest = async () => {
    try {
      const result = await getCompanyById(companyId);
      setCompanyRequestProject(result?.data.name || '(Unknown Company)');
    } catch (err: any) {
      console.error('Error fetching company:', err);
      setCompanyLabel('(Error loading company)');
    }
  };
  React.useEffect(() => {
    fetchGetCompanyByIdFromProjectRequest();
  });
  // Lấy tên company khi mở modal / đổi companyId
  React.useEffect(() => {
    let alive = true;

    // nếu cha đã truyền companyName thì dùng luôn, không gọi API
    if (companyName) {
      setCompanyLabel(companyName);
      return;
    }

    (async () => {
      if (!canUseCompany) {
        setCompanyLabel('');
        return;
      }
      try {
        const res = await getCompanyById(companyId as string);
        // BE có thể trả { data: {...} } hoặc trực tiếp {...}
        const payload = res?.data ?? res;
        const name = payload?.name ?? payload?.data?.name ?? '';
        if (alive) setCompanyLabel(name || '');
      } catch {
        if (alive) setCompanyLabel('');
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

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!routeCompanyId) {
        setPeople([]);
        setMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        // lấy 1 trang đầu (tăng pageSize nếu muốn nhiều hơn)
        const res = await getCompanyMembersPaged(routeCompanyId, { pageNumber: 1, pageSize: 50 });
        if (!alive) return;
        setMembers(res.items);
        // cho dropdown chọn nhanh
        const opts: Option[] = res.items.map(
          (m: {
            memberId: string | number;
            memberName?: string | null;
            roleName?: string | null;
            email?: string | null;
          }) => ({
            id: String(m.memberId),
            label: m.memberName ?? m.email ?? '',
            sub: m.roleName ?? m.email ?? '',
          }),
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
  }, [companyId]);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [workflowSelectedName, setWorkflowSelectedName] = React.useState<string>('');
  const [form, setForm] = React.useState<ProjectCreatePayload>({
    companyId: defaultValues?.companyId ?? companyId, // gán ngay từ URL
    isHired: defaultValues?.isHire ?? false,
    companyRequestId: defaultValues?.companyRequestId ?? null,
    projectRequestId: defaultValues?.projectRequestId ?? null,
    code: defaultValues?.code ?? '',
    name: defaultValues?.name ?? '',
    description: defaultValues?.description ?? '',
    status: 'Planned',
    startDate: defaultValues?.startDate ?? null,
    endDate: defaultValues?.endDate ?? null,
    sprintLengthWeeks: 1,
    workflowMode: 'existing',
    workflowId: null,
    workflowName: '',
    memberIds: [],
  });
  const canEditType = false;
  // đồng bộ khi URL đổi công ty
  React.useEffect(() => {
    setForm((prev) => ({ ...prev, companyId }));
  }, [companyId]);

  // sprint number input
  const [weeksRaw, setWeeksRaw] = React.useState(String(1));
  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const bad = ['-', '+', 'e', 'E', '.'];
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
      setErrors((prev) => ({ ...prev, sprintLengthWeeks: 'Enter a whole number ≥ 1.' }));
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

  // picker & creator modal flags
  const [openPicker, setOpenPicker] = React.useState(false);
  const [openCreateWf, setOpenCreateWf] = React.useState(false);

  const set = <K extends keyof ProjectCreatePayload>(k: K, v: ProjectCreatePayload[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  /* ===== Validate per step (giữ nguyên) ===== */
  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.companyId) e.companyId = 'Company is required.';
    if (form.companyId && !isGuid(form.companyId)) e.companyId = 'Invalid company id.';
    if (!form.code.trim()) e.code = 'Project code is required.';
    if (!form.name.trim()) e.name = 'Project name is required.';
    // if (form.isHired && !form.companyHiredId) e.companyHiredId = 'Select hired company.';
    if (!form.startDate) e.startDate = 'Start date is required.';
    if (!form.endDate) e.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'End date must be after start date.';
    if (!Number.isInteger(form.sprintLengthWeeks) || form.sprintLengthWeeks < 1) {
      e.sprintLengthWeeks = 'Sprint length must be an integer ≥ 1.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate2 = () => {
    const e: Record<string, string> = {};
    if (form.workflowMode === 'existing' && !form.workflowId) e.workflowId = 'Choose a workflow.';
    if (form.workflowMode === 'new' && !form.workflowName.trim())
      e.workflowName = 'Enter new workflow name.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    // chưa tạo thật, cứ dừng ở validate
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    if (step < 3) setStep((s) => (s + 1) as any);
    else {
      try {
        setSaving(true);

        const payloadToPost: any = {
          ...form,
          workflowId: form.workflowId!,
        };
        delete payloadToPost.workflowMode;
        delete payloadToPost.workflowName;

        // Nếu cha truyền onSubmit thì ưu tiên dùng callback

        const res = await createProject(payloadToPost);

        // nếu cha có truyền onSubmit thì gọi thêm (không thay thế API)
        if (onSubmit) {
          await onSubmit(payloadToPost);
        }

        onClose(); // đóng modal sau khi tạo thành công
      } catch (err: any) {
        console.error('Create project failed:', err);
        toast.error(err?.response?.data?.message || err.message || 'Create project failed');
      } finally {
        setSaving(false);
      }
    }
  };
  const back = () => setStep((s) => Math.max(1, s - 1) as any);

  const StepDot = ({ n, active }: { n: number; active: boolean }) => (
    <div
      className={[
        'size-8 rounded-full flex items-center justify-center text-sm font-semibold',
        active ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-400',
      ].join(' ')}
    >
      {n}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="w-full sm:max-w-[920px] lg:max-w-[1080px] rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_-15px_rgba(30,64,175,0.35)] flex flex-col sm:min-h-[60vh] max-h-[90vh]"
          style={{
            backgroundImage:
              'radial-gradient(1000px 200px at 50% -80px, rgba(59,130,246,.08), transparent 60%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="p-6 pb-3 flex items-start justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Create New Project</div>
              <div className="text-sm text-slate-500">
                Fill details • Choose workflow • (Optional) Assign members
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
            <div className="mb-5 flex items-center gap-3">
              <StepDot n={1} active={step === 1} />
              <div className="h-px flex-1 bg-slate-200" />
              <StepDot n={2} active={step === 2} />
              <div className="h-px flex-1 bg-slate-200" />
              <StepDot n={3} active={step === 3} />
            </div>
          </div>

          {/* body */}
          <div className="px-6 pb-4 flex-1 overflow-y-auto pr-1 min-h-[320px] sm:min-h-[420px]">
            {step === 1 && (
              <div className="space-y-4">
                {/* Company — DISABLED + lấy từ URL */}
                <Field label="Company" required>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                      <Building2 className="size-4" />
                    </div>
                    <input
                      value={companyLabel}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  {!canUseCompany && (
                    <p className="mt-1 text-xs text-rose-500">CompanyId in url not guild</p>
                  )}
                </Field>

                {/* code + name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Project code" required>
                    <input
                      value={form.code}
                      onChange={(e) => set('code', e.target.value)}
                      placeholder="e.g. FUS-PMS"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code}</p>}
                  </Field>
                  <Field label="Project name" required>
                    <input
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Fusion PMS"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    placeholder="Short description…"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                {/* dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Start date" required>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                        <CalendarDays className="size-4" />
                      </div>
                      <input
                        type="date"
                        value={form.startDate ?? ''}
                        onChange={(e) => set('startDate', e.target.value || null)}
                        className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    {errors.startDate && (
                      <p className="mt-1 text-xs text-rose-500">{errors.startDate}</p>
                    )}
                  </Field>
                  <Field label="End date" required>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                        <CalendarDays className="size-4" />
                      </div>
                      <input
                        type="date"
                        value={form.endDate ?? ''}
                        onChange={(e) => set('endDate', e.target.value || null)}
                        className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    {errors.endDate && (
                      <p className="mt-1 text-xs text-rose-500">{errors.endDate}</p>
                    )}
                  </Field>
                </div>
                {/* type */}
                <Field label="Type">
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      active={!form.isHired}
                      onClick={canEditType ? () => set('isHired', false) : undefined}
                      disabled={!canEditType}
                    >
                      Internal
                    </Chip>
                    <Chip
                      active={form.isHired}
                      onClick={canEditType ? () => set('isHired', true) : undefined}
                      disabled={!canEditType}
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
                        value={companyRequestProject ?? ''}
                        onChange={() => {}}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 cursor-not-allowed"
                      />
                    ) : (
                      <OptionList
                        value={form.companyRequestId}
                        onChange={(v) => set('companyRequestId', v)}
                        options={[
                          { id: 'p1', label: 'Partner A' },
                          { id: 'p2', label: 'Partner B' },
                          { id: 'p3', label: 'Partner C' },
                        ]}
                        placeholder="Select partner company"
                      />
                    )}

                    {errors.companyRequestId && (
                      <p className="mt-1 text-xs text-rose-500">{errors.companyRequestId}</p>
                    )}
                  </Field>
                )}

                {/* sprint length */}
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
                      if (e.key === 'Enter') next();
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (!/^\d+$/.test(text)) e.preventDefault();
                    }}
                    className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.sprintLengthWeeks && (
                    <p className="mt-1 text-xs text-rose-500">{errors.sprintLengthWeeks}</p>
                  )}
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-slate-700">Workflow</div>

                {/* Existing Mode */}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="wf"
                    className="size-4 accent-blue-600"
                    checked={form.workflowMode === 'existing'}
                    onChange={() => set('workflowMode', 'existing')}
                  />
                  <span className="text-slate-800">Use existing workflow</span>
                </label>

                {form.workflowMode === 'existing' && (
                  <div className="space-y-2">
                    <div className="flow flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(true)}
                        disabled={!canUseCompany}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        <WorkflowIcon className="size-4" /> Browse workflows
                      </button>
                      {form.workflowId ? (
                        <SelectedWorkflowPreview
                          companyId={companyId}
                          workflowId={form.workflowId}
                          name={workflowSelectedName || 'Workflow'}
                          onClear={() => {
                            set('workflowId', null);
                            setWorkflowSelectedName('');
                          }}
                        />
                      ) : (
                        <div className="text-xs text-slate-500">No workflow selected.</div>
                      )}
                    </div>
                    {errors.workflowId && (
                      <p className="text-xs text-rose-500">{errors.workflowId}</p>
                    )}
                  </div>
                )}

                {/* New Mode */}
                <label className="mt-3 flex items-center gap-2">
                  <input
                    type="radio"
                    name="wf"
                    className="size-4 accent-blue-600"
                    checked={form.workflowMode === 'new'}
                    onChange={() => set('workflowMode', 'new')}
                  />
                  <span className="text-slate-800">Create new workflow</span>
                </label>

                {form.workflowMode === 'new' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <button
                        type="button"
                        onClick={() => setOpenCreateWf(true)}
                        disabled={!canUseCompany}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        <WorkflowIcon className="size-4" /> Create in Designer
                      </button>
                    </div>
                    {errors.workflowName && (
                      <p className="-mt-2 text-xs text-rose-500">{errors.workflowName}</p>
                    )}
                    <div className="text-xs text-slate-500">
                      Tip: điền tên rồi mở Designer để chỉnh sửa status/transition. Save xong sẽ tự
                      gán.
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users2 className="size-4 text-slate-500" /> Assign members (optional)
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Add people">
                    <OptionList
                      value={null}
                      onChange={(id) => {
                        if (!id) return;
                        set('memberIds', Array.from(new Set([...form.memberIds, id])));
                      }}
                      options={people}
                      placeholder="Search and select people"
                    />
                  </Field>
                  <Field label="Selected">
                    {form.memberIds.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-400">
                        No members
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.memberIds.map((id) => {
                          const p = people.find((x) => x.id === id) || {
                            id,
                            label: String(id),
                            sub: '',
                          };
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
                            >
                              <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                {p.label
                                  .split(' ')
                                  .map((s) => s[0])
                                  .slice(0, 2)
                                  .join('')}
                              </span>
                              {p.label}
                              <button
                                onClick={() =>
                                  set(
                                    'memberIds',
                                    form.memberIds.filter((m) => m !== id),
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
                {/* <div>
                  <div className="mb-2 text-sm font-medium text-slate-700">Company members</div>
                  {loadingMembers ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-3 animate-pulse bg-white">
                          <div className="h-5 w-1/2 bg-gray-200 rounded mb-2" />
                          <div className="h-4 w-1/3 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-500">
                      No members in this company.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {members.map(m => (
                        <div key={m.memberId} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 inline-flex size-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-700 font-semibold">
                              {(m.memberName ?? m.email ?? '')
                                .split(/\s+/)
                                .map((s: string) => s?.[0] ?? '')
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 truncate">{m.memberName}</div>
                              <div className="text-xs text-slate-500 truncate">{m.email}</div>
                              {m.roleName && (
                                <div className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                  {m.roleName}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <div className="truncate">{m.phone || "—"}</div>
                            <button
                              onClick={() => set("memberIds", Array.from(new Set([...form.memberIds, String(m.memberId)])))}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50">
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div> */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600">
                  You can skip assignment now and invite people later from the Project → Members
                  tab.
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="p-6 pt-3 flex items-center justify-between border-t border-slate-100">
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
                  'Next'
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

      {/* ===== Sub-modals for Step 2 ===== */}
      {openPicker && (
        <WorkflowPickerModal
          open={openPicker}
          companyId={routeCompanyId ?? null}
          onClose={() => setOpenPicker(false)}
          onSelect={(wf) => {
            set('workflowMode', 'existing');
            set('workflowId', wf.id);
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
            set('workflowMode', 'existing');
            set('workflowId', wf.id);
            setWorkflowSelectedName(wf.name);
            set('workflowName', '');
            setOpenCreateWf(false);
          }}
        />
      )}
    </div>,
    document.body,
  );
}
