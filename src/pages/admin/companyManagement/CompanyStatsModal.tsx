import React from 'react';
import { X } from 'lucide-react';
import type { CompanyInfo } from '@/interfaces/Admin/Admin';
import CompanyMembersTable from './CompanyMembersTable';
import CompanyProjectsTable from './CompanyProjectsTable';

interface CompanyStatsModalProps {
  tab: 'members' | 'projects' | 'partners';
  row: CompanyInfo;
  onClose: () => void;
}

export default function CompanyStatsModal({ tab, row, onClose }: CompanyStatsModalProps) {
  const title = tab === 'members' ? 'Members' : tab === 'projects' ? 'Projects' : 'Partners';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[760px] max-w-[95vw] rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {tab === 'members' && <CompanyMembersTable rows={row.listMembers ?? []} />}
        {tab === 'projects' && <CompanyProjectsTable rows={row.listProjects ?? []} />}
        {tab === 'partners' && (
          <div className="text-sm text-gray-700">
            API hiện chưa trả danh sách đối tác. Tổng số: <b>{row.totalPartners ?? 0}</b>. Vui lòng
            bổ sung <code>listPartners</code> vào response để hiển thị chi tiết.
          </div>
        )}
      </div>
    </div>
  );
}
