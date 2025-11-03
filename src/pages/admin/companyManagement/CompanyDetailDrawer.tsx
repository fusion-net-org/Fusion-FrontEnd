import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CompanyInfo } from '@/interfaces/Admin/Admin';
import CompanyStatsModal from './CompanyStatsModal';
import { fmtDate } from '@/utils/format';

interface CompanyDetailDrawerProps {
  row: CompanyInfo | null;
  loading: boolean;
  onClose: () => void;
}

export default function CompanyDetailDrawer({ row, loading, onClose }: CompanyDetailDrawerProps) {
  const [stats, setStats] = useState<{ open: boolean; tab: 'members' | 'projects' | 'partners' }>({
    open: false,
    tab: 'members',
  });

  useEffect(() => {
    if (!row) setStats({ open: false, tab: 'members' });
  }, [row]);

  if (!row) return null;

  const cover = row.imageCompany || 'https://placehold.co/1200x240?text=Cover';
  const avatar = row.avatarCompany || 'https://placehold.co/160x160?text=Avatar';

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid gap-1 border-b border-gray-100 pb-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900 break-words">{children || '-'}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <aside className="relative ml-auto h-full w-full max-w-[520px] bg-white shadow-2xl rounded-l-2xl overflow-y-auto animate-slideInRight">
        {/* Header */}
        <div className="relative">
          <div className="h-44 w-full overflow-hidden rounded-tl-2xl">
            <img src={cover} alt="cover" className="w-full h-full object-cover" />
          </div>
          <button
            className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="absolute left-6 -bottom-10 flex items-end gap-3">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="pb-2">
              <div className="text-xl font-semibold text-gray-900 leading-tight">{row.name}</div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  row.isDeleted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {row.isDeleted ? 'Deleted' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-14 px-6 pb-8 space-y-6">
          {loading && <div className="text-sm text-gray-500">Loading details…</div>}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Members', count: row.totalMember ?? 0, tab: 'members' },
              { label: 'Projects', count: row.totalProject ?? 0, tab: 'projects' },
              { label: 'Partners', count: row.totalPartners ?? 0, tab: 'partners' },
            ].map((s) => (
              <button
                key={s.label}
                className="rounded-xl border border-gray-200 p-3 text-center hover:bg-gray-50 transition"
                onClick={() => setStats({ open: true, tab: s.tab as any })}
              >
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-lg font-semibold text-gray-900">{s.count}</div>
              </button>
            ))}
          </div>

          {/* Info Fields */}
          <div className="space-y-4">
            <Field label="Tax Code">{row.taxCode}</Field>
            <Field label="Owner">
              {row.ownerUserName || (row.ownerUserId ?? '').slice(0, 8) || '-'}
            </Field>
            <Field label="Email">{row.email}</Field>
            <Field label="Phone">{row.phoneNumber}</Field>
            <Field label="Website">
              {row.website ? (
                <a
                  href={row.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {row.website.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                '-'
              )}
            </Field>
            <Field label="Created">{fmtDate(row.createdAt)}</Field>
            <Field label="Updated">{fmtDate(row.updatedAt)}</Field>
            <Field label="Address">{row.address}</Field>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</div>
              <div className="text-sm text-gray-900 whitespace-pre-line">{row.detail || '-'}</div>
            </div>
          </div>
        </div>

        {/* Stats Modal */}
        {stats.open && (
          <CompanyStatsModal
            tab={stats.tab}
            row={row}
            onClose={() => setStats((s) => ({ ...s, open: false }))}
          />
        )}
      </aside>
    </div>
  );
}
