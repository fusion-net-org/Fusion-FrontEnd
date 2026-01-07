import React from 'react';
import { Building2, Calendar, Workflow, ArrowRight } from 'lucide-react';

export type ProjectStatus =
  | 'Planned'
  | 'InProgress'
  | 'OnHold'
  | 'Completed'
  | 'Active'
  | 'Closed';

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
  isClosed?: boolean;
  isMaintenance?: boolean;
  maintenanceComponentCount?: number;
};

// ✅ Maintenance (Internal) - nâu
const MAINT_RGB = 'rgb(171, 77, 19)'; // #AB4D13
const MAINT_RGB_DARK = 'rgb(132, 57, 12)';
const MAINT_BG = 'rgb(255, 247, 237)';
const MAINT_BG_CHIP = 'rgb(253, 234, 215)';

// ✅ Maintenance Request (maintenance + request) - rose
const MAINT_REQ_RGB = 'rgb(190, 18, 60)'; // rose-700
const MAINT_REQ_RGB_DARK = 'rgb(159, 18, 57)'; // rose-800
const MAINT_REQ_BG = 'rgb(255, 241, 242)'; // rose-50
const MAINT_REQ_BG_CHIP = 'rgb(254, 226, 226)'; // rose-100

// ✅ NEW: Maintenance Outsourced (maintenance + outsourced + NOT request) - indigo
const MAINT_OUT_RGB = 'rgb(67, 56, 202)'; // indigo-700
const MAINT_OUT_RGB_DARK = 'rgb(55, 48, 163)'; // indigo-800
const MAINT_OUT_BG = 'rgb(238, 242, 255)'; // indigo-50
const MAINT_OUT_BG_CHIP = 'rgb(224, 231, 255)'; // indigo-100

const StatusDot = ({ color }: { color: string }) => (
  <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
);

const StatusBadge: React.FC<{ status: ProjectStatus; dim?: boolean }> = ({ status, dim }) => {
  const map: Record<ProjectStatus, { color: string; cls: string; text: string }> = {
    Planned: { color: '#f59e0b', cls: 'bg-amber-50 text-amber-700 border-amber-100', text: 'Planned' },
    InProgress: { color: '#3b82f6', cls: 'bg-blue-50 text-blue-700 border-blue-100', text: 'InProgress' },
    OnHold: { color: '#8b5cf6', cls: 'bg-violet-50 text-violet-700 border-violet-100', text: 'OnHold' },
    Completed: { color: '#22c55e', cls: 'bg-green-50 text-green-700 border-green-100', text: 'Completed' },
    Active: { color: '#3b82f6', cls: 'bg-blue-50 text-blue-700 border-blue-100', text: 'Active' },
    Closed: { color: '#64748b', cls: 'bg-slate-50 text-slate-700 border-slate-200', text: 'Closed' },
  };

  const v = map[status] ?? map.Planned;
  const dimCls = dim ? 'opacity-70 grayscale' : '';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${v.cls} ${dimCls}`}>
      <StatusDot color={v.color} /> {v.text}
    </span>
  );
};

const TypeBadge: React.FC<{ type: ProjectType; dim?: boolean }> = ({ type, dim }) => {
  const base =
    type === 'Internal'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : 'bg-slate-50 text-slate-700 border-slate-200';

  const dimCls = dim ? 'opacity-70 grayscale' : '';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${base} ${dimCls}`}>
      {type}
    </span>
  );
};

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

  // ✅ đọc maintenance chắc chắn
  const maint =
    data.isMaintenance === true ||
    String((data as any).isMaintenance).toLowerCase() === 'true' ||
    (data as any).isMaintenace === true ||
    String((data as any).isMaintenace).toLowerCase() === 'true' ||
    (data as any).is_maintenance === true ||
    String((data as any).is_maintenance).toLowerCase() === 'true';

  const compCount = Number.isFinite(Number(data.maintenanceComponentCount))
    ? Number(data.maintenanceComponentCount)
    : 0;

  // ✅ bool helper cho isRequest (tránh 1/"true")
  const toBool = (v: any) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
  const isReqFlag = toBool((data as any).isRequest ?? (data as any).is_request);

  // ✅ 3 loại maintenance:
  const maintReq = maint && isReqFlag; // maintenance + request
  const maintOut = maint && !isReqFlag && data.ptype === 'Outsourced'; // maintenance + outsourced + NOT request
  // còn lại: maint internal (maint && !maintReq && !maintOut)

  // giữ nguyên logic cũ: Request/Execute chỉ khi KHÔNG phải maintenance
  const req = !maint && isReqFlag;
  const exec = !maint && !req && data.ptype === 'Outsourced';
  const closed = !!data.isClosed;

  const cardBase =
    'group relative flex cursor-pointer flex-col rounded-2xl p-5 border transition backdrop-blur-sm';

  // shadow từng loại
  const maintVariant =
    'shadow-[0_1px_1px_rgba(69,26,3,0.10),0_10px_22px_-12px_rgba(69,26,3,0.28)] hover:shadow-[0_2px_6px_rgba(69,26,3,0.12),0_24px_32px_-12px_rgba(69,26,3,0.36)]';

  const maintReqVariant =
    'shadow-[0_1px_1px_rgba(136,19,55,0.10),0_10px_22px_-12px_rgba(136,19,55,0.28)] hover:shadow-[0_2px_6px_rgba(136,19,55,0.12),0_24px_32px_-12px_rgba(136,19,55,0.36)]';

  const maintOutVariant =
    'shadow-[0_1px_1px_rgba(55,48,163,0.10),0_10px_22px_-12px_rgba(55,48,163,0.28)] hover:shadow-[0_2px_6px_rgba(55,48,163,0.12),0_24px_32px_-12px_rgba(55,48,163,0.36)]';

  const cardVariant = maintReq
    ? maintReqVariant
    : maintOut
    ? maintOutVariant
    : maint
    ? maintVariant
    : req
    ? 'border-amber-300 bg-amber-50 shadow-[0_1px_1px_rgba(146,64,14,0.08),0_10px_22px_-12px_rgba(217,119,6,0.35)] hover:shadow-[0_2px_6px_rgba(146,64,14,0.10),0_24px_32px_-12px_rgba(217,119,6,0.45)]'
    : exec
    ? 'border-blue-300 bg-blue-50 shadow-[0_1px_1px_rgba(30,64,175,0.10),0_10px_22px_-12px_rgba(37,99,235,0.40)] hover:shadow-[0_2px_6px_rgba(30,64,175,0.12),0_24px_32px_-12px_rgba(37,99,235,0.48)]'
    : 'border-slate-200 bg-white shadow-[0_1px_1px_rgba(17,24,39,0.06),0_10px_22px_-12px_rgba(30,64,175,0.30)] hover:shadow-[0_2px_6px_rgba(17,24,39,0.08),0_24px_32px_-12px_rgba(30,64,175,0.38)]';

  const closedVariant =
    'border-slate-200 bg-slate-100 text-slate-500 shadow-[0_1px_1px_rgba(15,23,42,0.06),0_10px_22px_-14px_rgba(15,23,42,0.18)] hover:shadow-[0_2px_6px_rgba(15,23,42,0.08),0_24px_32px_-14px_rgba(15,23,42,0.22)]';

  const bgImage = closed
    ? 'radial-gradient(1200px 140px at 50% -50px, rgba(148,163,184,0.20), transparent 60%)'
    : maintReq
    ? 'radial-gradient(1200px 140px at 50% -50px, rgba(190,18,60,0.16), transparent 60%)'
    : maintOut
    ? 'radial-gradient(1200px 140px at 50% -50px, rgba(67,56,202,0.16), transparent 60%)'
    : maint
    ? 'radial-gradient(1200px 140px at 50% -50px, rgba(171,77,19,0.18), transparent 60%)'
    : req
    ? 'radial-gradient(1200px 140px at 50% -50px, rgba(245,158,11,0.16), transparent 60%)'
    : exec
    ? 'radial-gradient(1200px 140px at 50% -50px, rgba(37,99,235,0.16), transparent 60%)'
    : 'radial-gradient(1200px 140px at 50% -50px, rgba(59,130,246,0.12), transparent 60%)';

  const cardStyle: React.CSSProperties =
    maintReq && !closed
      ? { backgroundImage: bgImage, backgroundColor: MAINT_REQ_BG, borderColor: MAINT_REQ_RGB }
      : maintOut && !closed
      ? { backgroundImage: bgImage, backgroundColor: MAINT_OUT_BG, borderColor: MAINT_OUT_RGB }
      : maint && !closed
      ? { backgroundImage: bgImage, backgroundColor: MAINT_BG, borderColor: MAINT_RGB }
      : { backgroundImage: bgImage };

  const stripeColor = maintReq ? MAINT_REQ_RGB : maintOut ? MAINT_OUT_RGB : maint ? MAINT_RGB : undefined;
  const chipBg = maintReq ? MAINT_REQ_RGB : maintOut ? MAINT_OUT_RGB : MAINT_RGB;

  return (
    <div
      role="button"
      onClick={open}
      className={[
        cardBase,
        closed ? closedVariant : cardVariant,
        selected ? 'ring-2 ring-blue-600' : '',
      ].join(' ')}
      style={cardStyle}
    >
      {(maint || req || exec) && (
        <div
          aria-hidden
          className={[
            'pointer-events-none absolute left-0 top-0 h-full w-1.5 rounded-l-2xl',
            req ? 'bg-amber-500/80' : exec ? 'bg-blue-500/80' : '',
          ].join(' ')}
          style={stripeColor ? { backgroundColor: stripeColor } : undefined}
        />
      )}

      <div className="flex items-start justify-between">
        <div className={`text-[11px] font-semibold tracking-wide ${closed ? 'text-slate-600' : 'text-blue-600'}`}>
          {data.code}
        </div>

        <div className="flex items-center gap-1.5">
          {closed && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Closed
            </span>
          )}

          {/* ✅ chips maintenance theo 3 loại */}
          {maintReq && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: chipBg }}
              title="Maintenance request project"
            >
              Maintenance Request • {compCount} component{compCount === 1 ? '' : 's'}
            </span>
          )}

          {!maintReq && maintOut && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: chipBg }}
              title="Outsourced maintenance (executor side)"
            >
              Maintenance (Outsourced) • {compCount} component{compCount === 1 ? '' : 's'}
            </span>
          )}

          {!maintReq && !maintOut && maint && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: chipBg }}
              title="Maintenance project"
            >
              Maintenance • {compCount} component{compCount === 1 ? '' : 's'}
            </span>
          )}

          {/* giữ nguyên logic cũ */}
          {!maint && (req || exec) && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${
                req ? 'bg-amber-500/95' : 'bg-blue-600/95'
              } ${closed ? 'opacity-60' : ''}`}
              title={req ? 'This project is requested to your company' : 'Executor of the project'}
            >
              {req ? 'Request' : 'Execute'}
            </span>
          )}

          {selected && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
              Selected
            </span>
          )}
        </div>
      </div>

      <div className={['mt-1 text-base font-semibold', closed ? 'text-slate-700 line-through' : 'text-slate-800'].join(' ')}>
        {data.name}
      </div>

      <div className={['mt-3 space-y-1.5 text-xs', closed ? 'text-slate-500' : 'text-slate-600'].join(' ')}>
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={data.status} dim={closed} />

        {!maint && <TypeBadge type={data.ptype} dim={closed} />}

        {maint && (
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs"
            style={{
              borderColor: maintReq ? MAINT_REQ_RGB : maintOut ? MAINT_OUT_RGB : MAINT_RGB,
              backgroundColor: maintReq ? MAINT_REQ_BG_CHIP : maintOut ? MAINT_OUT_BG_CHIP : MAINT_BG_CHIP,
              color: maintReq ? MAINT_REQ_RGB : maintOut ? MAINT_OUT_RGB : MAINT_RGB,
            }}
          >
            Components:{' '}
            <span
              className="ml-1 font-semibold"
              style={{ color: maintReq ? MAINT_REQ_RGB : maintOut ? MAINT_OUT_RGB : MAINT_RGB }}
            >
              {compCount}
            </span>
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className={['line-clamp-2 text-sm', closed ? 'text-slate-500' : 'text-slate-600'].join(' ')}>
          {data.description || '—'}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onManage?.(data);
          }}
          className={[
            'ml-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm',
            closed
              ? 'bg-slate-600 hover:bg-slate-700'
              : maintReq || maintOut || maint
              ? 'hover:brightness-95 active:brightness-90'
              : req
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-blue-600 hover:bg-blue-700',
          ].join(' ')}
          style={
            !closed && (maintReq || maintOut || maint)
              ? { backgroundColor: maintReq ? MAINT_REQ_RGB : maintOut ? MAINT_OUT_RGB : MAINT_RGB }
              : undefined
          }
          onMouseEnter={(e) => {
            if (!closed && maintReq) e.currentTarget.style.backgroundColor = MAINT_REQ_RGB_DARK;
            else if (!closed && maintOut) e.currentTarget.style.backgroundColor = MAINT_OUT_RGB_DARK;
            else if (!closed && maint) e.currentTarget.style.backgroundColor = MAINT_RGB_DARK;
          }}
          onMouseLeave={(e) => {
            if (!closed && maintReq) e.currentTarget.style.backgroundColor = MAINT_REQ_RGB;
            else if (!closed && maintOut) e.currentTarget.style.backgroundColor = MAINT_OUT_RGB;
            else if (!closed && maint) e.currentTarget.style.backgroundColor = MAINT_RGB;
          }}
        >
          Open <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
