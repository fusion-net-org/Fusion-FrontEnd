import React from 'react';
import { fmtDate } from '@/utils/format';

export default function CompanyProjectsTable({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div className="text-sm text-gray-500">No projects.</div>;

  return (
    <div className="border rounded-xl overflow-auto max-h-[60vh]">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Hired</th>
            <th className="px-3 py-2">Start</th>
            <th className="px-3 py-2">End</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, idx) => (
            <tr key={p.id ?? idx} className="border-t">
              <td className="px-3 py-2 text-left">{p.code ?? p.id ?? '-'}</td>
              <td className="px-3 py-2 text-left">{p.name ?? '-'}</td>
              <td className="px-3 py-2 text-center">{p.status ?? '-'}</td>
              <td className="px-3 py-2 text-center">{p.isHired ? 'Yes' : 'No'}</td>
              <td className="px-3 py-2 text-center">{p.startDate ?? '-'}</td>
              <td className="px-3 py-2 text-center">{p.endDate ?? '-'}</td>
              <td className="px-3 py-2 text-center">{fmtDate(p.createdAt ?? p.createAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
