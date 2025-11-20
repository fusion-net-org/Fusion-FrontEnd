/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search } from 'lucide-react';
import { Input, DatePicker, Spin } from 'antd';
import type { IProjectMemberItemV2 } from '@/interfaces/ProjectMember/projectMember';
import { getProjectMemberByProjectId } from '@/services/projectMember.js';
import { useDebounce } from '@/hook/Debounce';
import { Paging } from '@/components/Paging/Paging';

const { RangePicker } = DatePicker;

interface MembersTabProps {
  projectId: string;
}

const MembersTab: React.FC<MembersTabProps> = ({ projectId }) => {
  const [members, setMembers] = useState<IProjectMemberItemV2[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const debouncedSearch = useDebounce(memberSearch, 500); // debounce 500ms
  const [memberRange, setMemberRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const fromDate = memberRange?.[0]?.format('YYYY-MM-DD') || '';
      const toDate = memberRange?.[1]?.format('YYYY-MM-DD') || '';
      const res = await getProjectMemberByProjectId(
        projectId,
        debouncedSearch,
        fromDate,
        toDate,
        pagination.pageNumber,
        pagination.pageSize,
      );

      if (res?.succeeded) {
        setMembers(res.data.items || []);
        setPagination((prev) => ({
          ...prev,
          totalCount: res.data.totalCount || 0,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId, debouncedSearch, memberRange, pagination.pageNumber, pagination.pageSize]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
  }, [debouncedSearch, memberRange]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mt-2">
          <Users className="text-indigo-500 w-5 h-5" /> Project Members
        </h2>

        {/* Search & Filter */}
        <div className="flex items-end justify-between gap-6 mb-4">
          {/* LEFT — Search */}
          <div className="flex flex-col flex-1 max-w-[400px]">
            <label className="text-sm font-semibold text-gray-600 mb-1">Search</label>
            <Input
              prefix={<Search size={20} />}
              placeholder="Search by name, email, phone..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* RIGHT — Filter (Date Range) */}
          <div className="flex flex-col min-w-[240px]">
            <label className="text-sm font-semibold text-gray-600 mb-1">Filter (Joined Date)</label>
            <RangePicker
              onChange={(val) => setMemberRange(val)}
              placeholder={['Start date', 'End date']}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm mt-3">
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-10">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-40">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-auto">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {members.length > 0 ? (
                members.map((m, index) => (
                  <tr key={m.userId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">{m.userName}</td>
                    <td className="px-6 py-3 text-gray-600">{m.email}</td>
                    <td className="px-6 py-3 text-gray-600">{m.phone || '-'}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          m.gender === 'Male'
                            ? 'bg-blue-100 text-blue-700'
                            : m.gender === 'Female'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {m.gender || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">Member</td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(m.joinedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          m.status === 'True'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {m.status === 'True' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paging */}
      <div className="mt-4">
        <Paging
          page={pagination.pageNumber}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, pageNumber: page }))}
          onPageSizeChange={(size) =>
            setPagination((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }))
          }
        />
      </div>
    </div>
  );
};

export default MembersTab;
