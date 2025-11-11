import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Table, Tag, Spin, Input, Select, Button, Space } from 'antd';
import { toast } from 'react-toastify';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionPlanById,
} from '@/services/subscriptionService.js';
import SubscriptionPlanModal from './SubscriptionPlanModal';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Edit, Trash2, Package, Eye } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

const { Search } = Input;
const { Option } = Select;

interface Feature {
  featureKey: string;
  limitValue: number;
}
interface Price {
  billingPeriod: string;
  periodCount: number;
  price: number;
  currency: string;
  refundWindowDays: number;
  refundFeePercent: number;
}
interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  features: Feature[];
  price: Price;
}

export default function SubscriptionListPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [keyword, setKeyword] = useState('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'code' | 'name' | 'description'>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  // Pagination
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // View detail
  const [viewingPlan, setViewingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchPlans = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await getSubscriptionPlans({
        keyword,
        isActive,
        billingPeriod,
        sortColumn,
        sortDescending,
        pageNumber: page,
        pageSize,
      });
      if (res?.succeeded && res?.data) {
        setPlans(res.data.items || []);
        setPagination({
          current: res.data.pageNumber || page,
          pageSize: res.data.pageSize || pageSize,
          total: res.data.totalCount || 0,
        });
      } else {
        toast.error(res?.message || 'Failed to load subscription plans');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error fetching subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [keyword, isActive, billingPeriod, sortColumn, sortDescending]);

  const handleCreatePlan = async (formData: any) => {
    try {
      await createSubscriptionPlan(formData);
      toast.success('Subscription plan created successfully!');
      closeModal();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subscription plan.');
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleUpdatePlan = async (formData: any) => {
    try {
      await updateSubscriptionPlan({ ...formData, id: editingPlan?.id });
      toast.success('Subscription plan updated successfully!');
      closeModal();
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update subscription plan.');
    }
  };

  const handleDeletePlan = (id: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this subscription plan?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSubscriptionPlan(id);
          toast.success('Subscription plan deleted successfully!');
          fetchPlans();
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete subscription plan.');
        }
      },
    });
  };

  const handleViewDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await getSubscriptionPlanById(id);
      if (res?.succeeded && res?.data) {
        setViewingPlan(res.data);
        setIsDetailModalOpen(true);
      } else {
        toast.error(res?.message || 'Failed to load subscription plan details');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error fetching subscription plan details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Billing Period',
      dataIndex: ['price', 'billingPeriod'],
      key: 'billingPeriod',
      render: (val: string) => {
        const color =
          val === 'Week'
            ? 'green'
            : val === 'Month'
            ? 'orange'
            : val === 'Year'
            ? 'blue'
            : 'default';
        return <Tag color={color}>{val || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Price',
      dataIndex: ['price', 'price'],
      key: 'price',
      render: (val: number | undefined, record: SubscriptionPlan) => {
        if (!record.price) return <span>N/A</span>;
        return (
          <span>
            {record.price.price.toLocaleString()} {record.price.currency}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) =>
        active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SubscriptionPlan) => (
        <Space>
          <Button
            icon={<Eye size={16} />}
            onClick={() => handleViewDetail(record.id)}
            type="link"
            className="text-blue-600"
          ></Button>

          <Button
            icon={<Edit size={16} />}
            onClick={() => openEditModal(record)}
            type="link"
            className="text-indigo-600"
          />
          <Button
            icon={<Trash2 size={16} />}
            onClick={() => handleDeletePlan(record.id)}
            type="link"
            danger
          />
        </Space>
      ),
    },
  ];

  const toggleSortDirection = () => setSortDescending((prev) => !prev);

  const handleResetFilters = () => {
    setKeyword('');
    setIsActive(null);
    setBillingPeriod(null);
    setSortColumn('name');
    setSortDescending(true);
    setPagination({ ...pagination, current: 1 });
    fetchPlans(1, pagination.pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 m-0">Subscription Management</h1>
              <p className="text-sm text-gray-500 m-0">
                Manage and edit all system subscription plans
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            className="bg-indigo-600 rounded-lg"
            onClick={openModal}
          >
            Add Subscription
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <Search
              placeholder="Search by keyword..."
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Is Active"
              allowClear
              style={{ width: 130 }}
              value={isActive as any}
              onChange={(val) => setIsActive(val === undefined ? null : val)}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
            <Select
              placeholder="Billing Period"
              allowClear
              style={{ width: 150 }}
              value={billingPeriod as any}
              onChange={(val) => setBillingPeriod(val === undefined ? null : val)}
            >
              <Option value="Week">Week</Option>
              <Option value="Month">Month</Option>
              <Option value="Year">Year</Option>
            </Select>
            <Select
              value={sortColumn}
              onChange={(val) => setSortColumn(val)}
              style={{ width: 160 }}
            >
              <Option value="code">Sort by Code</Option>
              <Option value="name">Sort by Name</Option>
              <Option value="description">Sort by Description</Option>
            </Select>
            <Button
              icon={sortDescending ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              onClick={toggleSortDirection}
            >
              {sortDescending ? 'Descending' : 'Ascending'}
            </Button>
            <Button
              icon={<RotateCcw size={16} />}
              onClick={handleResetFilters}
              className="border-gray-300 text-gray-700"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Spin spinning={loading}>
            <Table
              columns={columns.map((col) => ({
                ...col,
                onHeaderCell: () => ({
                  className: 'px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase',
                }),
              }))}
              dataSource={plans}
              rowKey="id"
              pagination={false}
            />
          </Spin>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{plans.length}</span> of{' '}
                <span className="font-semibold text-gray-900">
                  {pagination.total.toLocaleString()}
                </span>{' '}
                subscription plans
              </span>

              <label className="inline-flex items-center gap-2">
                <span className="text-gray-600">Rows per page:</span>
                <select
                  className="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                  value={pagination.pageSize}
                  onChange={(e) => {
                    const size = Math.max(1, parseInt(e.target.value || '10', 10));
                    setPagination((prev) => ({ ...prev, pageSize: size, current: 1 }));
                    fetchPlans(1, size);
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Stack spacing={2}>
              <Pagination
                count={Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
                page={pagination.current}
                onChange={(_, p) => {
                  setPagination((prev) => ({ ...prev, current: p }));
                  fetchPlans(p, pagination.pageSize);
                }}
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

      {/* Modal */}
      <SubscriptionPlanModal
        isOpen={isModalOpen}
        handleCancel={() => {
          closeModal();
          setEditingPlan(null);
        }}
        onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
        initialData={editingPlan}
      />
      <Modal
        title="Subscription Plan Details"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : viewingPlan ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Code">{viewingPlan.code || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Name">{viewingPlan.name || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Description">
              {viewingPlan.description || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {viewingPlan.isActive ? (
                <Tag color="green">Active</Tag>
              ) : (
                <Tag color="red">Inactive</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {viewingPlan.price
                ? `${viewingPlan.price.price.toLocaleString()} ${viewingPlan.price.currency} / ${
                    viewingPlan.price.periodCount
                  } ${viewingPlan.price.billingPeriod}`
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Refund Policy">
              {viewingPlan.price
                ? `${viewingPlan.price.refundFeePercent}% fee, window ${viewingPlan.price.refundWindowDays} days`
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Features">
              {viewingPlan.features?.length
                ? viewingPlan.features.map((f) => (
                    <Tag key={f.featureKey} color="blue">
                      {f.featureKey}: {f.limitValue}
                    </Tag>
                  ))
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {viewingPlan.createdAt ? new Date(viewingPlan.createdAt).toLocaleString() : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {viewingPlan.updatedAt ? new Date(viewingPlan.updatedAt).toLocaleString() : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-center text-gray-400 py-4">No data available</p>
        )}
      </Modal>
    </div>
  );
}
