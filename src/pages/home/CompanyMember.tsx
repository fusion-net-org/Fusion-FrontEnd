/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Eye, Ban, UserPlus } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import LoadingOverlay from '@/common/LoadingOverlay';

// ✅ Dữ liệu giả
const fakeMembers = [
  {
    id: '1',
    fullName: 'Nguyễn Văn A',
    email: 'vana@example.com',
    role: 'Admin',
    status: 'Active',
    joinedAt: '2025-03-10',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    fullName: 'Trần Thị B',
    email: 'thib@example.com',
    role: 'Member',
    status: 'Pending',
    joinedAt: '2025-05-02',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    fullName: 'Lê Quốc Cường',
    email: 'cuongle@example.com',
    role: 'Moderator',
    status: 'Inactive',
    joinedAt: '2025-01-15',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    fullName: 'Phạm Hồng Dung',
    email: 'dungpham@example.com',
    role: 'Member',
    status: 'Active',
    joinedAt: '2024-12-10',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    fullName: 'Bùi Minh Đức',
    email: 'ducbm@example.com',
    role: 'Member',
    status: 'Pending',
    joinedAt: '2025-02-20',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const CompanyMember: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 3,
    totalCount: fakeMembers.length,
  });

  // 🟢 Badge trạng thái
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Inactive: 'bg-red-100 text-red-700',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status}
      </span>
    );
  };

  // 🟢 Giả lập fetch
  const fetchMembers = (pageNumber = 1) => {
    setLoading(true);
    setTimeout(() => {
      const start = (pageNumber - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      setMembers(fakeMembers.slice(start, end));
      setPagination((prev) => ({ ...prev, pageNumber }));
      setLoading(false);
    }, 300);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchMembers(value);
  };

  const handleSearch = useCallback(
    debounce((keyword: string) => {
      setLoading(true);
      setTimeout(() => {
        const filtered = fakeMembers.filter(
          (m) =>
            m.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
            m.email.toLowerCase().includes(keyword.toLowerCase()),
        );
        setMembers(filtered.slice(0, pagination.pageSize));
        setPagination((prev) => ({ ...prev, totalCount: filtered.length }));
        setLoading(false);
      }, 300);
    }, 400),
    [],
  );

  const handleFilterStatus = (status: string) => {
    setLoading(true);
    setTimeout(() => {
      const filtered =
        status === 'All' ? fakeMembers : fakeMembers.filter((m) => m.status === status);
      setMembers(filtered.slice(0, pagination.pageSize));
      setPagination((prev) => ({ ...prev, totalCount: filtered.length }));
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchMembers(1);
  }, []);

  return (
    <>
      <LoadingOverlay loading={loading} message="Đang tải danh sách thành viên..." />

      <div className="px-8 py-6 font-inter bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
        {/* Header */}
        <div className="relative backdrop-blur-xl bg-gradient-to-r from-blue-600/90 to-blue-400/80 rounded-2xl p-6 mb-8 text-white shadow-lg border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold">Thành viên công ty</h1>
              <p className="text-blue-100 text-sm mt-1">
                Quản lý và theo dõi hoạt động của thành viên
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-medium rounded-full shadow hover:bg-blue-50 transition">
              <UserPlus className="w-4 h-4" /> Mời thành viên
            </button>
          </div>
        </div>

        {/* Bộ lọc và tìm kiếm */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/80 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-sm mb-6 gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              handleSearch(value);
            }}
            className="w-full sm:w-1/3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <div className="flex items-center gap-3 text-sm">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={filterStatus}
              onChange={(e) => {
                const value = e.target.value;
                setFilterStatus(value);
                handleFilterStatus(value);
              }}
            >
              <option value="All">Tất cả</option>
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Ngưng hoạt động</option>
              <option value="Pending">Chờ xác nhận</option>
            </select>
            <span className="text-gray-500">{pagination.totalCount} thành viên</span>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Thành viên</th>
                <th className="px-6 py-3 text-left">Vai trò</th>
                <th className="px-6 py-3 text-left">Trạng thái</th>
                <th className="px-6 py-3 text-left">Ngày tham gia</th>
                <th className="px-6 py-3 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Ban className="w-6 h-6 text-gray-400" />
                      {searchTerm
                        ? `Không tìm thấy kết quả cho "${searchTerm}".`
                        : 'Không có thành viên.'}
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-blue-50/70 transition-all duration-150"
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={m.avatar}
                        alt={m.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{m.fullName}</p>
                        <p className="text-gray-500 text-xs">{m.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{m.role}</td>
                    <td className="px-6 py-4">{getStatusBadge(m.status)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(m.joinedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Eye className="w-4 h-4 mx-auto text-gray-600 hover:text-blue-600 cursor-pointer transition" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-6">
          <Stack spacing={2}>
            <Pagination
              count={Math.ceil(pagination.totalCount / pagination.pageSize)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              variant="outlined"
              shape="rounded"
              size="medium"
              showFirstButton
              showLastButton
            />
          </Stack>
        </div>
      </div>
    </>
  );
};

export default CompanyMember;
