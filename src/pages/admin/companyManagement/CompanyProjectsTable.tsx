import React from 'react';
import { FolderOpen, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { fmtDate } from '@/utils/format';

export default function CompanyProjectsTable({ rows }: { rows: any[] }) {
  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">No projects found</p>
        <p className="text-sm text-gray-500 mt-1">This company has no projects yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {rows.map((p, idx) => (
        <div
          key={p.id ?? idx}
          className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="p-4 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-gray-900 font-semibold text-base leading-tight">
                  {p.name ?? 'Untitled Project'}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{p.code ?? p.id}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  p.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : p.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {p.status ?? 'Unknown'}
              </span>
            </div>

            {/* Info */}
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Calendar size={14} className="mr-2 text-gray-400" />
              <span>
                {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'} →{' '}
                {p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-2">
              {p.isHired ? (
                <>
                  <CheckCircle2 size={14} className="mr-2 text-green-500" />
                  <span className="text-green-700 font-medium">Hired</span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="mr-2 text-gray-400" />
                  <span className="text-gray-500">Not hired</span>
                </>
              )}
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
              <Clock size={13} className="mr-1.5 text-gray-400" />
              <span>Created {fmtDate(p.createdAt ?? p.createAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
