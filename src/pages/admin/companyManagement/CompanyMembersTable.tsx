import React from 'react';
import { fmtDate } from '@/utils/format';

export default function CompanyMembersTable({ rows }: { rows: any[] }) {
  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-sm font-medium text-gray-900">No members found</p>
        <p className="text-sm text-gray-500 mt-1">This company currently has no members</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((m, i) => (
        <div
          key={i}
          className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{m.memberName ?? 'Unknown'}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                m.isDeleted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {m.status ?? (m.isDeleted ? 'Deleted' : 'Active')}
            </span>
          </div>

          {/* Info */}
          <div className="text-sm text-gray-700">
            <p className="m-0">
              <span className="font-medium text-gray-800">Email:</span>{' '}
              {m.email ? (
                <span className="text-gray-600">{m.email}</span>
              ) : (
                <span className="italic text-gray-400">Not provided</span>
              )}
            </p>

            <p className="m-0">
              <span className="font-medium text-gray-800">Phone:</span>{' '}
              {m.memberPhoneNumber || m.phone ? (
                <span className="text-gray-600">{m.memberPhoneNumber ?? m.phone}</span>
              ) : (
                <span className="italic text-gray-400">Not provided</span>
              )}
            </p>

            <p className="m-0">
              <span className="font-medium text-gray-800">Role:</span>{' '}
              <span className="text-gray-600">{m.isOwner ? 'Owner' : 'Member'}</span>
            </p>

            <p className="m-0">
              <span className="font-medium text-gray-800">Gender:</span>{' '}
              {m.gender ? (
                <span className="text-gray-600">{m.gender}</span>
              ) : (
                <span className="italic text-gray-400">Not provided</span>
              )}
            </p>

            <p className="m-0">
              <span className="font-medium text-gray-800">Joined:</span>{' '}
              {m.joinedAt ? (
                <span className="text-gray-600">{fmtDate(m.joinedAt)}</span>
              ) : (
                <span className="italic text-gray-400">Not available</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
