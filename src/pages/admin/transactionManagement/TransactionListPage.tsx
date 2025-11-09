import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowUp,
  ArrowDown as ArrowDownIcon,
  CreditCard,
  RefreshCw,
  Calendar,
  DollarSign,
} from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { toast } from 'react-toastify';
import { getAllTransactionForAdmin } from '@/services/transactionService.js';
import dayjs from 'dayjs';
import { Modal, Descriptions } from 'antd';
import { Input, Select, Button, DatePicker } from 'antd';

const { RangePicker } = DatePicker;

type Transaction = {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  transactionCode: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type PagedResult = {
  items: Transaction[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

type SortKey = 'Amount' | 'Status' | 'TransactionCode' | 'PackageName' | 'UserName';
type StatusFilter = 'All' | 'Success' | 'Pending';

const STATUS_OPTIONS: StatusFilter[] = ['All', 'Success', 'Pending'];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function TransactionListPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const status = (params.get('status') as StatusFilter) || 'All';
  const sort = (params.get('sort') as SortKey) || 'TransactionCode';
  const dirDesc = (params.get('dir') || 'desc') !== 'asc';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10) || 10);
  const dateFrom = params.get('dateFrom') || '';
  const dateTo = params.get('dateTo') || '';
  const amountMin = params.get('amountMin') || '';
  const amountMax = params.get('amountMax') || '';

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  const SORT_OPTIONS = [
    { key: 'Amount', label: 'Amount' },
    { key: 'Status', label: 'Status' },
    { key: 'TransactionCode', label: 'Transaction Code' },
    { key: 'PackageName', label: 'Package Name' },
    { key: 'UserName', label: 'User Name' },
  ];

  const resetFilters = () => {
    patchParams({
      q: '',
      status: 'All',
      sort: 'TransactionCode',
      dir: 'desc',
      page: 1,
      pageSize,
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    });
  };

  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const beStatus = useMemo(() => {
    if (status === 'All') return undefined;
    return status;
  }, [status]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data: PagedResult = await getAllTransactionForAdmin({
        transactionCode: q || undefined,
        packageName: q || undefined,
        paymentDateFrom: dateFrom || undefined,
        paymentDateTo: dateTo || undefined,
        amountMin: amountMin ? Number(amountMin) : undefined,
        amountMax: amountMax ? Number(amountMax) : undefined,
        status: beStatus,
        pageNumber: page,
        pageSize: pageSize,
        sortColumn: sort,
        sortDescending: dirDesc,
      });
      console.log(data);
      setItems(data?.items ?? []);
      setTotal(data?.totalCount ?? 0);
    } catch (e: any) {
      setErr(e?.message ?? 'Load transactions failed');
      toast.error(e?.message ?? 'Load transactions failed');
    } finally {
      setLoading(false);
    }
  }, [q, beStatus, page, pageSize, sort, dirDesc, dateFrom, dateTo, amountMin, amountMax]);

  useEffect(() => {
    reload();
  }, [reload]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 m-0">
                    Transaction Management
                  </h1>
                  <p className="text-sm text-gray-500 m-0">View and manage all transactions</p>
                </div>
              </div>
            </div>

            {/* 🔹 Filter Section – identical to ProjectListPage */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <Input
                  placeholder="Search by transaction code or package name..."
                  allowClear
                  prefix={<Search size={16} className="text-gray-400" />}
                  value={q}
                  onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
                  style={{ width: 250 }}
                />

                {/* Sort Column */}
                <Select
                  value={sort}
                  onChange={(val) => patchParams({ sort: val, page: 1 })}
                  style={{ width: 180 }}
                  placeholder="Sort by"
                  options={SORT_OPTIONS.map((o) => ({
                    label: o.label,
                    value: o.key,
                  }))}
                />

                {/* Sort Direction */}
                <Button
                  icon={dirDesc ? <ArrowDownIcon size={16} /> : <ArrowUp size={16} />}
                  onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
                >
                  {dirDesc ? 'Descending' : 'Ascending'}
                </Button>

                {/* Status Filter */}
                <Select
                  value={status}
                  onChange={(val) => patchParams({ status: val, page: 1 })}
                  style={{ width: 160 }}
                  options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
                />
                <RangePicker
                  onChange={(dates, dateStrings) => {
                    patchParams({
                      dateFrom: dateStrings[0],
                      dateTo: dateStrings[1],
                      page: 1,
                    });
                  }}
                  style={{ height: 38 }}
                />

                {/* Reset Button */}
                <Button
                  icon={<RefreshCw size={16} />}
                  onClick={resetFilters}
                  className="flex items-center"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Package
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span className="text-sm text-gray-500">Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && err && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Failed to load transactions
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{err}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  !err &&
                  items.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setSelectedTransaction(t);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-medium text-gray-900">
                          {t.transactionCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{t.userName}</div>
                          <div
                            className="text-gray-500 text-xs truncate max-w-[150px]"
                            title={t.userId}
                          >
                            {t.userId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-900">{t.packageName}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          $
                          {t.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{t.paymentMethod || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            t.status,
                          )}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(t.status)}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center hidden lg:table-cell">
                        <div className="text-sm text-gray-600">
                          <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(t.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && !err && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No transactions found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{items.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>{' '}
                  transactions
                </span>
                <label className="inline-flex items-center gap-2">
                  <span className="text-gray-600">Rows per page:</span>
                  <select
                    className="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                    value={pageSize}
                    onChange={(e) => {
                      const size = Math.max(1, parseInt(e.target.value || '10', 10));
                      patchParams({ pageSize: size, page: 1 });
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Stack spacing={2}>
                <Pagination
                  count={Math.max(1, Math.ceil(total / pageSize))}
                  page={page}
                  onChange={(_, p) => patchParams({ page: p })}
                  color="primary"
                  variant="outlined"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Transaction Details</h2>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={650}
        className="transaction-modal"
      >
        {selectedTransaction ? (
          <div className="p-2">
            <Descriptions
              bordered
              column={1}
              size="small"
              labelStyle={{
                width: 180,
                backgroundColor: '#fafafa',
                fontWeight: 500,
              }}
              contentStyle={{
                backgroundColor: '#fff',
              }}
            >
              <Descriptions.Item label="Transaction Code">
                <span className="font-medium text-gray-800">
                  {selectedTransaction.transactionCode}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="User Name">
                <span className="font-medium text-gray-800">{selectedTransaction.userName}</span>
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                <span className="text-gray-500">{selectedTransaction.userId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Package Name">
                <span className="font-medium text-gray-700">
                  {selectedTransaction.packageName || '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <span className="text-green-600 font-semibold">
                  $
                  {selectedTransaction.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                <span className="uppercase text-gray-600">
                  {selectedTransaction.paymentMethod || '—'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    selectedTransaction.status,
                  )}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                      selectedTransaction.status,
                    )}`}
                  />
                  {selectedTransaction.status}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                <span className="text-gray-700">
                  {new Date(selectedTransaction.createdAt).toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                <span className="text-gray-700">
                  {new Date(selectedTransaction.updatedAt).toLocaleString()}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-4">No data available</p>
        )}
      </Modal>
    </>
  );
}
