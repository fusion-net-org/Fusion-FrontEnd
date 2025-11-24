import React from 'react';
import { Building2, Calendar, Workflow, ArrowRight } from 'lucide-react';

export type ProjectStatus = 'Planned' | 'InProgress' | 'OnHold' | 'Completed';
export type ProjectType = 'Internal' | 'Outsourced';
export type Project = {
  id: string;
  code: string;
  name: string;
  description?: string;
  ownerCompany: string;
  hiredCompany?: string | null;
  workflow: string;
  startDate?: string | null;
  endDate?: string | null;
  status: ProjectStatus;
  ptype: ProjectType;
  isRequest?: boolean;
};

const StatusDot = ({ color }: { color: string }) => (
  <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
);
const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const map: Record<ProjectStatus, { color: string; cls: string; text: string }> = {
    Planned: {
      color: '#f59e0b',
      cls: 'bg-amber-50 text-amber-700 border-amber-100',
      text: 'Planned',
    },
    InProgress: {
      color: '#3b82f6',
      cls: 'bg-blue-50 text-blue-700 border-blue-100',
      text: 'InProgress',
    },
    OnHold: {
      color: '#8b5cf6',
      cls: 'bg-violet-50 text-violet-700 border-violet-100',
      text: 'OnHold',
    },
    Completed: {
      color: '#22c55e',
      cls: 'bg-green-50 text-green-700 border-green-100',
      text: 'Completed',
    },
  };
  const v = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${v.cls}`}>
      <StatusDot color={v.color} /> {v.text}
    </span>
  );
};

const TypeBadge: React.FC<{ type: ProjectType }> = ({ type }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${
      type === 'Internal'
        ? 'bg-blue-50 text-blue-700 border-blue-100'
        : 'bg-slate-50 text-slate-700 border-slate-200'
    }`}
  >
    {type}
  </span>
);

export default function ProjectCard({
  data,
  selected,
  onOpen,
  onManage,
}: {
  data: Project;
  selected?: boolean;
  onOpen?: (p: Project) => void;
  onManage?: (p: Project) => void;
}) {
  const open = () => onOpen?.(data);
  const req = !!data.isRequest; // <-- flag từ BE/mapper

  return (
    <div
      role="button"
      onClick={open}
      className={[
        'group relative flex cursor-pointer flex-col rounded-2xl p-5 border transition backdrop-blur-sm',
        req
          ? 'border-amber-300 bg-amber-50/85 shadow-[0_1px_1px_rgba(146,64,14,0.08),0_10px_22px_-12px_rgba(217,119,6,0.35)] hover:shadow-[0_2px_6px_rgba(146,64,14,0.10),0_24px_32px_-12px_rgba(217,119,6,0.45)]'
          : 'border-slate-200 bg-white/90 shadow-[0_1px_1px_rgba(17,24,39,0.06),0_10px_22px_-12px_rgba(30,64,175,0.30)] hover:shadow-[0_2px_6px_rgba(17,24,39,0.08),0_24px_32px_-12px_rgba(30,64,175,0.38)]',
      ].join(' ')}
      style={{
        backgroundImage: req
          ? 'radial-gradient(1200px 140px at 50% -50px, rgba(245,158,11,.16), transparent 60%)'
          : 'radial-gradient(1200px 140px at 50% -50px, rgba(59,130,246,.12), transparent 60%)',
      }}
    >
      {/* dải màu subtle bên trái khi là request */}
      {req && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-amber-500/80"
        />
      )}

      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold tracking-wide text-blue-600">{data.code}</div>
        <div className="flex items-center gap-1.5">
          {req && (
            <span
              className="rounded-full bg-amber-500/95 px-2 py-0.5 text-[11px] font-medium text-white"
              title="This project is requested to your company"
            >
              Request
            </span>
          )}
          {selected && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
              Selected
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 text-base font-semibold text-slate-800">{data.name}</div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-slate-400" />
          <span>{data.ownerCompany}</span>
          {data.hiredCompany && (
            <>
              <span className="mx-1 text-slate-400">•</span>
              <span>{data.hiredCompany}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Workflow className="size-4 text-slate-400" />
          <span>{data.workflow}</span>
        </div>
        {data.startDate && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-slate-400" />
            <span>
              {data.startDate}
              {data.endDate ? ` — ${data.endDate}` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={data.status} />
        <TypeBadge type={data.ptype} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="line-clamp-2 text-sm text-slate-600">{data.description || '—'}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManage?.(data);
          }}
          className={[
            'ml-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm',
            req ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700',
          ].join(' ')}
        >
          Open <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
