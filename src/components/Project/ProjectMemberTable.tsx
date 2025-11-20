/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Mail, User, Calendar, CheckCircle2, Clock3, Ban } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedDate: string;
  status: 'Active' | 'Pending' | 'Removed';
  avatarUrl?: string;
}

interface ProjectMemberTableProps {
  members: Member[];
}

export default function ProjectMemberTable({ members }: ProjectMemberTableProps) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50 rounded-t-2xl flex items-center gap-2">
        <User className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-700">Project Members</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-medium">Member</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Joined Date</th>
              <th className="px-6 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((m) => (
                <tr
                  key={m.id}
                  className="border-t hover:bg-indigo-50/40 transition-colors duration-200"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={
                        m.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          m.name,
                        )}&background=E0E7FF&color=4338CA`
                      }
                      alt={m.name}
                      className="w-9 h-9 rounded-full object-cover border border-indigo-100"
                    />
                    <span className="font-medium text-gray-800">{m.name}</span>
                  </td>

                  <td className="px-6 py-4 text-gray-700">{m.role}</td>

                  <td className="px-6 py-4 flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {m.email}
                  </td>

                  <td className="px-6 py-4 flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {m.joinedDate}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {m.status === 'Active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-green-600 bg-green-100/70 rounded-full font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Active
                      </span>
                    )}
                    {m.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-yellow-600 bg-yellow-100/70 rounded-full font-medium">
                        <Clock3 className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                    {m.status === 'Removed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-gray-600 bg-gray-100/70 rounded-full font-medium">
                        <Ban className="w-4 h-4" />
                        Removed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic bg-gray-50">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
