import React from 'react';
import { fmtDate } from '@/utils/format';

export default function CompanyMembersTable({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div className="text-sm text-gray-500">No members.</div>;

  return (
    <div className="border rounded-xl overflow-auto max-h-[60vh]">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Gender</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Joined</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, idx) => (
            <tr key={m.id ?? idx} className="border-t">
              <td className="px-3 py-2">{m.memberName ?? '-'}</td>
              <td className="px-3 py-2 text-center">{m.email ?? '-'}</td>
              <td className="px-3 py-2 text-center">{m.memberPhoneNumber ?? m.phone ?? '-'}</td>
              <td className="px-3 py-2 text-center">{m.gender ?? '-'}</td>
              <td className="px-3 py-2 text-center">{m.isOwner ? 'Owner' : 'Member'}</td>
              <td className="px-3 py-2 text-center">{fmtDate(m.joinedAt)}</td>
              <td className="px-3 py-2 text-center">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.isDeleted ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  }`}
                >
                  {m.status ?? (m.isDeleted ? 'Deleted' : 'Active')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
