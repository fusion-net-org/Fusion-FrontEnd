/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { Input, DatePicker, Spin } from 'antd';
import type { IProjectMemberItemV2 } from '@/interfaces/ProjectMember/projectMember';
import { getProjectMemberByProjectId } from '@/services/projectMember.js';
import { useDebounce } from '@/hook/Debounce';

const { RangePicker } = DatePicker;

interface MembersTabProps {
  projectId: string;
  rowsPerPage?: number;
  onMembersDataChange?: (data: any) => void;
}

const MembersTab: React.FC<MembersTabProps> = ({
  projectId,
  rowsPerPage = 10,
  onMembersDataChange,
}) => {
  const [members, setMembers] = useState<IProjectMemberItemV2[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const debouncedSearch = useDebounce(memberSearch, 500); // debounce 500ms
  const [memberRange, setMemberRange] = useState<any>(null);
  const [memberPage, setMemberPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
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
        memberPage,
        rowsPerPage,
      );
      if (res?.succeeded) {
        setMembers(res.data.items || []);
        if (onMembersDataChange) {
          onMembersDataChange(res.data);
        }
      }
      setTotalPages(Math.ceil((res.data.totalCount || 0) / rowsPerPage));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId, debouncedSearch, memberRange, memberPage, rowsPerPage, onMembersDataChange]);

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch, memberRange, memberPage]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col mb-2 gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mt-2">
          <Users className="text-indigo-500 w-5 h-5" /> Project Members
        </h2>

        {/* Search & Date Range */}
        <div className="flex items-center gap-3">
          <Input
            prefix={<Search size={20} />}
            placeholder="Search by name, email, phone..."
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setMemberPage(1);
            }}
            className="flex-1 min-w-[280px] max-w-[400px]"
          />
          <RangePicker
            onChange={(val) => {
              setMemberRange(val);
              setMemberPage(1);
            }}
            placeholder={['Start date', 'End date']}
            className="min-w-[220px] ml-auto"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin />
          </div>
        ) : (
          <table className="min=-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {members.length > 0 ? (
                members.map((m, index) => (
                  <tr key={m.userId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {(memberPage - 1) * rowsPerPage + index + 1}
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

      {/* Pagination */}
      <div className="mt-4 flex justify-end">
        <Stack spacing={2}>
          <Pagination
            count={totalPages}
            page={memberPage}
            onChange={(_, value) => setMemberPage(value)}
            color="primary"
            shape="rounded"
            siblingCount={totalPages}
            boundaryCount={totalPages}
          />
        </Stack>
      </div>
    </div>
  );
};

export default MembersTab;
