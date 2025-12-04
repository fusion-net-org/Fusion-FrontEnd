/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Edit, Trash, UserPlus, Ban, Inbox } from 'lucide-react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Paging } from '@/components/Paging/Paging';
import { GetRolesPaged } from '@/services/companyRoleService.js';
import { useDebounce } from '@/hook/Debounce.js';
import LoadingOverlay from '@/common/LoadingOverlay.js';
import CreateRoleModal from '@/components/Company/Roles/CreateRoleModal';
import EditRoleModal from '@/components/Company/Roles/EditRoleModal';
import DeleteRoleModal from '@/components/Company/Roles/DeleteRoleModal';

const { RangePicker } = DatePicker;

interface IRole {
  id: number;
  roleName: string;
  description: string;
}

const CompanyRole: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();

  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500); // debounce 500ms
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [dateRange, setDateRange] = useState<[any, any]>([null, null]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  console.log('Selected Role:', selectedRole);
  const fetchRoles = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      const createdFrom = dateRange[0] ? dayjs(dateRange[0]).startOf('day').toISOString() : null;

      const createdTo = dateRange[1] ? dayjs(dateRange[1]).endOf('day').toISOString() : null;

      const data = await GetRolesPaged(
        companyId,
        debouncedSearch,
        statusFilter === 'All' ? null : statusFilter,
        createdFrom,
        createdTo,
        page,
        pageSize,
      );

      setRoles(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [companyId, debouncedSearch, statusFilter, dateRange, page, pageSize]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: 'bg-green-100 text-green-700',
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

  const activeCount = roles.filter((r) => r.status === 'Active').length;
  const inactiveCount = roles.filter((r) => r.status === 'Inactive').length;

  const handleEdit = (role: any) => {
    console.log('Edit role:', role);
    // TODO: navigate to edit form
  };

  const handleDelete = (role: any) => {
    console.log('Delete role:', role);
    // TODO: call API to delete
  };

  return (
    <div className="px-5 py-5 font-inter min-h-screen relative">
      <LoadingOverlay loading={loading} message="Loading roles..." />

      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 rounded-2xl p-6 mb-8 text-white shadow-lg border border-blue-300/30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Company Roles</h1>
            <p className="text-blue-100 text-sm">Manage and monitor company roles</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition text-sm"
            onClick={() => setOpenCreate(true)}
          >
            <UserPlus className="w-4 h-4" /> Create Role
          </button>
        </div>
      </div>

      {/* FILTER SUMMARY */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-4 py-1.5 bg-green-200 text-green-700 text-sm font-medium rounded-full">
          Active: {activeCount}
        </span>
        <span className="px-4 py-1.5 bg-red-200 text-red-700 text-sm font-medium rounded-full">
          Inactive: {inactiveCount}
        </span>
        <span className="px-4 py-1.5 bg-blue-200 text-blue-700 text-sm font-medium rounded-full">
          Total: {roles.length}
        </span>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-start justify-between gap-4 py-3 rounded-xl mb-4">
        <div className="flex flex-col w-full sm:w-1/3 relative">
          <label className="font-semibold text-sm text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search role, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 ml-auto">
          <div className="flex flex-col">
            <label className="font-semibold text-sm text-gray-600 mb-1">Created Date</label>
            <RangePicker
              format="DD/MM/YYYY"
              className="rounded-lg border border-gray-300 !h-[37.6px]"
              placeholder={['Date From', 'Date To']}
              value={dateRange}
              onChange={(val) => setDateRange(val || [null, null])}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="font-semibold text-sm text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
              className="rounded-lg border border-gray-300 px-3 text-sm !h-[37.6px]"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="font-semibold text-sm text-gray-500 flex items-center h-[37.6px] mt-6">
            {totalCount} results
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3 text-center">Role Name</th>
              <th className="px-6 py-3 text-center">Description</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-center">Created Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.length === 0 ? (
              <tr className="border-b border-gray-200 hover:bg-blue-50 transition duration-200">
                <td colSpan={5} className="py-10">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <Inbox className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500 text-sm font-medium">
                      {search ? `No roles found for "${search}".` : 'No roles available.'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {search
                        ? 'Try a different keyword or adjust your filters.'
                        : 'Please adjust your filters or try again later.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              roles.map((r) => (
                <tr
                  key={r.id}
                  className="border-b text-center border-gray-100 hover:bg-blue-50/60 transition-all duration-150"
                >
                  <td className="px-6 py-4 font-medium">{r.roleName}</td>
                  <td className="px-6 py-4">{r.description}</td>
                  <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                  <td className="px-6 py-4 font-medium">
                    {dayjs(r.createdAt).format('DD/MM/YYYY')}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-center gap-3">
                    {/* EDIT BUTTON */}
                    <Edit
                      className={`w-5 h-5 transition transform
                ${
                  r.status === 'Inactive'
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-blue-500 hover:text-blue-700 hover:scale-110 cursor-pointer'
                }`}
                      onClick={() => {
                        if (r.status === 'Inactive') return;
                        setSelectedRole(r);
                        setOpenEdit(true);
                      }}
                    />

                    {/* DELETE BUTTON */}
                    <Trash
                      className={`w-5 h-5 transition transform
                  ${
                    r.status === 'Inactive'
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-red-500 hover:text-red-700 hover:scale-110 cursor-pointer'
                  }`}
                      onClick={() => {
                        if (r.status === 'Inactive') return;
                        setSelectedRole(r);
                        setOpenDelete(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGING */}
      <div className="w-full mt-6">
        <Paging
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
      <CreateRoleModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        companyId={companyId!}
        onSuccess={() => fetchRoles()}
      />
      <EditRoleModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        roleId={selectedRole?.id}
        onSuccess={() => fetchRoles()}
      />

      <DeleteRoleModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        role={selectedRole}
        onSuccess={() => fetchRoles()}
      />
    </div>
  );
};

export default CompanyRole;
