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

import { Can } from '@/permission/PermissionProvider';
export type Id = string;
type ProjectStatus = 'Planned' | 'InProgress' | 'OnHold' | 'Completed';

export type MaintenanceComponentDraft = {
  clientId: string; // FE-only id để render ổn định
  name: string; // component name
  note?: string; // optional scope note
};

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

  // ✅ Maintenance (chỉ thêm phần cần thiết)
  isMaintenance: boolean;
  maintenanceForProjectId: Id | null; // base project
  maintenanceComponents: MaintenanceComponentDraft[]; // components scope
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
  <div className="block">
    <div className="mb-1.5 text-sm font-medium text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </div>
    {children}
  </div>
);


/* ---- Lightweight picker (dùng cho members/partner) ---- */
// Types used:
// type Id = string;
// type Option = { id: Id; label: string; sub?: string };

function OptionList({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  search = true,
  disabled = false,
  emptyText = 'No results',
  clearText = 'Clear selection',
}: {
  value: Id | null;
  onChange: (v: Id | null) => void;
  options: Option[];
  placeholder?: string;
  search?: boolean;
  disabled?: boolean;
  emptyText?: string;
  clearText?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selected = React.useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => {
      const a = o.label.toLowerCase().includes(t);
      const b = o.sub ? o.sub.toLowerCase().includes(t) : false;
      return a || b;
    });
  }, [options, q]);

  // close on outside click
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  // when open, focus search; reset highlight
  React.useEffect(() => {
    if (!open) return;
    setActive(0);
    if (search) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, search]);

  // reset active when query changes
  React.useEffect(() => {
    if (!open) return;
    setActive(0);
  }, [q, open]);

  const close = () => {
    setOpen(false);
    setQ('');
    requestAnimationFrame(() => btnRef.current?.focus());
  };

  const selectByIndex = (idx: number) => {
    const item = filtered[idx];
    if (!item) return;
    onChange(item.id);
    close();
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === 'Backspace' && value) {
      // quick clear
      e.preventDefault();
      onChange(null);
      return;
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length) selectByIndex(active);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      setOpen(false);
      setQ('');
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm',
          'flex items-center justify-between gap-3 transition',
          disabled
            ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
            : 'border-slate-200 text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400',
        ].join(' ')}
      >
        <div className="min-w-0">
          <div className={selected ? 'truncate' : 'truncate text-slate-400'}>
            {selected ? selected.label : placeholder}
          </div>
          {!!selected?.sub && <div className="text-xs text-slate-500 truncate">{selected.sub}</div>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* quick clear without needing extra icon imports */}
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={clearText}
              title={clearText}
            >
              <span aria-hidden>×</span>
            </button>
          )}
          <ChevronDown className={['size-4', disabled ? 'text-slate-300' : 'text-slate-400'].join(' ')} />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {search && (
            <div className="p-2 border-b border-slate-100">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <div className="max-h-56 overflow-auto p-1" role="listbox">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">{emptyText}</div>
            ) : (
              filtered.map((o, idx) => {
                const isSelected = o.id === value;
                const isActive = idx === active;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(idx)}
                    onMouseDown={(e) => e.preventDefault()} // keep focus in input
                    onClick={() => selectByIndex(idx)}
                    className={[
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition',
                      isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{o.label}</div>
                        {o.sub && <div className="text-xs text-slate-500 truncate">{o.sub}</div>}
                      </div>
                      {isSelected && <Check className="size-4 mt-0.5 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 p-2 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                close();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-white"
            >
              {clearText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComponentAdder({
  options,
  onAdd,
  placeholder = 'Search or type a work area…',
  disabled = false,
  maxSuggestions = 8,
}: {
  options: Option[];
  onAdd: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // close on outside click
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const query = q.trim();

  const filtered = React.useMemo(() => {
    const t = query.toLowerCase();
    const list = t
      ? options.filter((o) => {
          const a = o.label.toLowerCase().includes(t);
          const b = o.sub ? o.sub.toLowerCase().includes(t) : false;
          return a || b;
        })
      : options;

    return list.slice(0, maxSuggestions);
  }, [options, query, maxSuggestions]);

  const exact = React.useMemo(() => {
    const t = query.toLowerCase();
    return options.find((o) => o.label.toLowerCase() === t) || null;
  }, [options, query]);

  type Item = {
    key: string;
    label: string;
    sub?: string;
    value: string;
    kind: 'custom' | 'suggestion';
  };

  const items: Item[] = React.useMemo(() => {
    const list: Item[] = [];
    if (query && !exact) {
      list.push({
        key: '__custom__',
        label: query,
        sub: 'Custom entry',
        value: query,
        kind: 'custom',
      });
    }
    for (const o of filtered) {
      list.push({
        key: o.id,
        label: o.label,
        sub: o.sub,
        value: o.label,
        kind: 'suggestion',
      });
    }
    return list;
  }, [filtered, query, exact]);

  React.useEffect(() => {
    if (!open) return;
    setActive(0);
  }, [open, q]);

  const commit = (value: string) => {
    const name = value.trim().replace(/\s+/g, ' ');
    if (!name) return;

    onAdd(name);

    // ✅ đóng dropdown + clear input
    setQ('');
    setOpen(false);
    setActive(0);

    // ✅ focus lại input nhưng KHÔNG tự mở dropdown (vì open chỉ mở khi click input)
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // ✅ click suggestion = fill input only (không add)
  const fillOnly = (value: string) => {
    setQ(value);
    setOpen(false);
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true); // cho phép mở bằng phím
      setActive((i) => Math.min(items.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (open && items[active]) {
        commit(items[active].value);
        return;
      }

      if (query) commit(exact ? exact.label : query);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={q}
          disabled={disabled}
          // ✅ CHỈ mở khi user click/pointer vào input
          onPointerDown={() => {
            if (disabled) return;
            setOpen(true);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            // ❌ không tự mở ở đây
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
        />

        <button
          type="button"
          disabled={disabled || !query}
          // ❌ bỏ preventDefault để click Add không “giữ focus” gây cảm giác dropdown còn mở
          onClick={() => commit(exact ? exact.label : query)}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="mt-1 text-xs text-slate-500">
        Click a suggestion to fill, then press <span className="font-semibold">Add</span> (or Enter).
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {items.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">No suggestions.</div>
          ) : (
            <div className="max-h-56 overflow-auto" role="listbox">
              {items.map((it, idx) => {
                const isActive = idx === active;
                return (
                  <button
                    key={it.key}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(e) => e.preventDefault()} // giữ focus trong input để fill nhanh
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => fillOnly(it.value)} // ✅ fill only
                    className={[
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition',
                      isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{it.label}</div>
                        {it.sub && <div className="text-xs text-slate-500 truncate">{it.sub}</div>}
                      </div>

                      {it.kind === 'custom' ? (
                        <span className="text-[11px] rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                          Custom
                        </span>
                      ) : (
                        <span className="text-[11px] rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
                          Suggested
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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

const uid = () =>
  typeof crypto !== 'undefined' && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2);

const norm = (s: string) => s.trim().replace(/\s+/g, ' ');

// ✅ Catalog gợi ý component (có thể thay đổi theo domain)
const DEFAULT_MAINT_COMPONENTS: Option[] = [
  { id: 'ui', label: 'UI / Frontend', sub: 'Layout, pages, UX fixes' },
  { id: 'api', label: 'Backend API', sub: 'Endpoints, business rules' },
  { id: 'db', label: 'Database', sub: 'Schema, migration, data fix' },
  { id: 'auth', label: 'Auth / Permission', sub: 'RBAC, policies' },
  { id: 'notify', label: 'Notification / Realtime', sub: 'Email, SignalR, webhook' },
  { id: 'payment', label: 'Payment / Billing', sub: 'PayOS, invoices, plans' },
  { id: 'report', label: 'Report / Analytics', sub: 'Charts, dashboards' },
  { id: 'perf', label: 'Performance', sub: 'Caching, optimize queries' },
];

const makeInitialDto = (name = 'New Workflow'): DesignerDto => {
  const uidLocal = () =>
    typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2);

   const s1 = {
    id: uid(),
    name: "To Do",
    isStart: true,
    isEnd: false,
    x: 200,
    y: 350,
    roles: ["Developer"],
    color: "#6b7280",
  };

  const s2 = {

    id: uid(),
    name: "In Review",
    isStart: false,
    isEnd: false,
    x: 520,
    y: 350,
    roles: ["Reviewer"],
    color: "#4f46e5",
  };

  const s3 = {

    id: uid(),
    name: "Done",
    isStart: false,
    isEnd: true,
    x: 840,
    y: 350,
    roles: ["QA"],
    color: "#16a34a",
  };
  return {
    workflow: { id: uidLocal(), name },
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
        const list = (await getWorkflowPreviews(companyId)) as WorkflowPreviewVm[] | null | undefined;
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
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async (payload: DesignerDto) => {
    if (!isGuid(companyId)) throw new Error('Invalid companyId — cannot create workflow.');
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
  onSubmit?: (payload: ProjectCreatePayload) => Promise<void> | void;
  companyName?: string;
  defaultValues?: any;
}) {
  if (!open) return null;

  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = defaultValues?.companyId ?? routeCompanyId ?? null;
  const canUseCompany = isGuid(companyId);

  const [companyLabel, setCompanyLabel] = React.useState(companyName ?? '');
const [companyRequestProject, setCompanyRequestProject] = React.useState('');

// ✅ hired company phải lấy theo companyRequestId (từ project request)
const hiredCompanyId: string | null = defaultValues?.companyRequestId ?? null;
const canUseHiredCompany = isGuid(hiredCompanyId);

const fetchHiredCompanyName = async () => {
  try {
    if (!canUseHiredCompany || !hiredCompanyId) {
      setCompanyRequestProject('');
      return;
    }
    const result = await getCompanyById(hiredCompanyId);
    setCompanyRequestProject(result?.data?.name || '(Unknown Company)');
  } catch (err: any) {
    console.error('Error fetching hired company:', err);
    setCompanyRequestProject('(Error loading company)');
  }
};

React.useEffect(() => {
  fetchHiredCompanyName();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [hiredCompanyId, canUseHiredCompany]);


  // Lấy tên company khi mở modal / đổi companyId
  React.useEffect(() => {
    let alive = true;

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
        const res = await getCompanyMembersPaged(routeCompanyId, { pageNumber: 1, pageSize: 50 });
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
    // ✅ FIX: deps đúng biến đang dùng
  }, [routeCompanyId]);

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [workflowSelectedName, setWorkflowSelectedName] = React.useState<string>('');

  const [form, setForm] = React.useState<ProjectCreatePayload>({
    companyId: defaultValues?.companyId ?? companyId,
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

    isMaintenance: defaultValues?.isMaintenance ?? false,
    maintenanceForProjectId: defaultValues?.maintenanceForProjectId ?? null,
    maintenanceComponents: defaultValues?.maintenanceComponents ?? [],
  });
  console.log(defaultValues)
const fromRequest = !!defaultValues?.projectRequestId;
const lockProjectKind = fromRequest || !!defaultValues?.lockProjectKind;
const lockMaintenanceComponents = fromRequest || !!defaultValues?.lockMaintenanceComponents;

  const canEditType = false;

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

  // ✅ Maintenance UI states (chỉ FE, không đổi service)
  const projectOptions: Option[] = defaultValues?.projectOptions ?? []; // optional (nếu có thì pick base project đẹp hơn)
  const [maintCatalogId, setMaintCatalogId] = React.useState<Id | null>(null);
  const [maintCustom, setMaintCustom] = React.useState('');

  const addMaintComponent = (nameRaw: string) => {
    const name = norm(nameRaw);
    if (!name) return;

    setForm((prev) => {
      const exists = prev.maintenanceComponents.some(
        (c) => c.name.trim().toLowerCase() === name.toLowerCase(),
      );
      if (exists) return prev;

   return {
  ...prev,
  maintenanceComponents: [{ clientId: uid(), name, note: '' }, ...prev.maintenanceComponents],
};


    });

    // clear errors if any
    setErrors((prev) => {
      const { maintenanceComponents, ...rest } = prev as any;
      return rest as any;
    });
  };

  const removeMaintComponent = (clientId: string) => {
    setForm((prev) => ({
      ...prev,
      maintenanceComponents: prev.maintenanceComponents.filter((c) => c.clientId !== clientId),
    }));
  };

  const updateMaintComponent = (
    clientId: string,
    patch: Partial<{ name: string; note: string }>,
  ) => {
    setForm((prev) => ({
      ...prev,
      maintenanceComponents: prev.maintenanceComponents.map((c) =>
        c.clientId === clientId ? { ...c, ...patch } : c,
      ),
    }));
  };

  const toggleMaintenance = (on: boolean) => {
    setForm((prev) => {
      if (!on) {
        return {
          ...prev,
          isMaintenance: false,
          maintenanceForProjectId: null,
          maintenanceComponents: [],
        };
      }
      return { ...prev, isMaintenance: true };
    });

    setErrors((prev) => {
      const copy = { ...(prev as any) };
      delete copy.maintenanceForProjectId;
      delete copy.maintenanceComponents;
      return copy;
    });
  };
React.useEffect(() => {
  if (!open) return;

  setForm((prev) => ({
    ...prev,
    projectRequestId: defaultValues?.projectRequestId ?? prev.projectRequestId ?? null,
    companyRequestId: defaultValues?.companyRequestId ?? prev.companyRequestId ?? null,
    isHired: (defaultValues?.isHire ?? defaultValues?.isHired ?? prev.isHired) as any,
  }));
}, [open, defaultValues?.projectRequestId, defaultValues?.companyRequestId, defaultValues?.isHire, defaultValues?.isHired]);


  /* ===== Validate per step ===== */
  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.companyId) e.companyId = 'Company is required.';
    if (form.companyId && !isGuid(form.companyId)) e.companyId = 'Invalid company id.';
    if (!form.code.trim()) e.code = 'Project code is required.';
    if (!form.name.trim()) e.name = 'Project name is required.';
    if (!form.startDate) e.startDate = 'Start date is required.';
    if (!form.endDate) e.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'End date must be after start date.';
    if (!Number.isInteger(form.sprintLengthWeeks) || form.sprintLengthWeeks < 1) {
      e.sprintLengthWeeks = 'Sprint length must be an integer ≥ 1.';
    }

  if (form.isMaintenance) {
  const cleaned = (form.maintenanceComponents ?? [])
    .map((c) => ({ ...c, name: norm(c.name) }))
    .filter((c) => !!c.name);

  if (cleaned.length === 0) e.maintenanceComponents = 'Add at least 1 work area.';
  if (cleaned.length > 20) e.maintenanceComponents = 'Too many areas (max 20).';

  const seen = new Set<string>();
  const dup = cleaned.some((c) => {
    const k = c.name.toLowerCase();
    if (seen.has(k)) return true;
    seen.add(k);
    return false;
  });
  if (dup) e.maintenanceComponents = 'Duplicate areas detected. Please keep them unique.';
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
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;

    if (step < 3) setStep((s) => (s + 1) as any);
    else {
      try {
        setSaving(true);

        const payloadToPost: any = {
          ...form,
          workflowId: form.workflowId!,
            projectRequestId: form.projectRequestId ?? defaultValues?.projectRequestId ?? null,
        };
        delete payloadToPost.workflowMode;
        delete payloadToPost.workflowName;

        // ✅ Nếu không phải maintenance: không gửi field maintenance để BE khỏi dính rác
        if (!form.isMaintenance) {
          delete payloadToPost.maintenanceForProjectId;
          delete payloadToPost.maintenanceComponents;
        } else {
          // cleanup: bỏ clientId (FE-only), trim
          payloadToPost.maintenanceComponents = (form.maintenanceComponents ?? [])
            .map((c) => ({ name: norm(c.name), note: (c.note ?? '').trim() }))
            .filter((c) => !!c.name);
        }

        const res = await createProject(payloadToPost);

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
                    {errors.endDate && <p className="mt-1 text-xs text-rose-500">{errors.endDate}</p>}
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

               <Field label="Project kind">
  <div className="flex flex-wrap items-center gap-2">
    <Chip
      active={!form.isMaintenance}
      onClick={!lockProjectKind ? () => toggleMaintenance(false) : undefined}
      disabled={lockProjectKind}
    >
      Standard
    </Chip>

    <Chip
      active={form.isMaintenance}
      onClick={!lockProjectKind ? () => toggleMaintenance(true) : undefined}
      disabled={lockProjectKind}
    >
      Maintenance
    </Chip>

    <span className="text-xs text-slate-500">
      Use Maintenance for post-release fixes and improvements...
    </span>
  </div>

  {lockProjectKind && (
    <div className="mt-2 text-xs text-slate-500">
      Locked by Project Request
    </div>
  )}
</Field>


        {form.isMaintenance && (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
    <div>
      <div className="font-semibold text-slate-800">Maintenance scope</div>
      <div className="text-xs text-slate-600 mt-1">
        List the areas you’ll work on. Keep it specific for easier planning and reporting.
      </div>
    </div>

    <Field label="Work areas" required>
     <ComponentAdder
  options={DEFAULT_MAINT_COMPONENTS}
  onAdd={(name) => addMaintComponent(name)}
  placeholder="Search or type a work area…"
  disabled={lockMaintenanceComponents}
/>


      {(errors as any).maintenanceComponents && (
        <p className="mt-2 text-xs text-rose-500">{(errors as any).maintenanceComponents}</p>
      )}

      <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700">
            Added areas ({form.maintenanceComponents.length})
          </div>

       <button
  type="button"
  disabled={lockMaintenanceComponents}
  onClick={() => set('maintenanceComponents', [])}
  className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
>
  Clear all
</button>

        </div>

        {/* ✅ scroll list */}
        <div className="max-h-[260px] overflow-auto">
          {form.maintenanceComponents.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">
              No areas added yet. Add at least one to define the scope.
            </div>
          ) : (
            <div className="divide-y">
        {form.maintenanceComponents.map((c) => (
  <div key={c.clientId} className="p-3 relative">
    <button
      type="button"
      disabled={lockMaintenanceComponents}
      onClick={() => removeMaintComponent(c.clientId)}
      className="absolute right-3 top-3 inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <X className="size-4" />
    </button>

    {/* ✅ Give right padding so inputs don't overlap the X */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start pr-12">
      <div className="md:col-span-5">
        <div className="text-xs font-medium text-slate-600 mb-1">Area</div>
        <input
          value={c.name}
          disabled={lockMaintenanceComponents}
          onChange={(e) => updateMaintComponent(c.clientId, { name: e.target.value })}
          placeholder="e.g., UI / Frontend"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      <div className="md:col-span-7">
        <div className="text-xs font-medium text-slate-600 mb-1">Notes (optional)</div>
        <input
          value={c.note ?? ''}
          disabled={lockMaintenanceComponents}
          onChange={(e) => updateMaintComponent(c.clientId, { note: e.target.value })}
          placeholder="e.g., bug fixes, improvements, refactor…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>
    </div>
  </div>
))}


            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t bg-slate-50 text-xs text-slate-500">
          Tip: Use clear names (UI, API, Database) so the scope is easy to track.
        </div>
      </div>
    </Field>
  </div>
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
                    {errors.workflowId && <p className="text-xs text-rose-500">{errors.workflowId}</p>}
                  </div>
                )}

<Can code="WORKFLOW_CREATE">
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
</Can>
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
                    {errors.workflowName && <p className="-mt-2 text-xs text-rose-500">{errors.workflowName}</p>}
                    <div className="text-xs text-slate-500">
                      Tip: điền tên rồi mở Designer để chỉnh sửa status/transition. Save xong sẽ tự gán.
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
                          const p = people.find((x) => x.id === id) || { id, label: String(id), sub: '' };
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
                                onClick={() => set('memberIds', form.memberIds.filter((m) => m !== id))}
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
                  You can skip assignment now and invite people later from the Project → Members tab.
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
