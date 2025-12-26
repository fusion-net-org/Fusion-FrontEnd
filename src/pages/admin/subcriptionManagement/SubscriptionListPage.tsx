import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Space, Spin, Table, Tag, message, Tooltip, } from "antd";
import { Eye, Edit, Trash2, Package, ArrowDown, ArrowUp, RotateCcw, Plus, AlertTriangle, } from "lucide-react";
import type {
  GetPlansPagedParams,
  SubscriptionPlanListItemResponse,
  SubscriptionPlanDetailResponse,
  LicenseScope,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";
import {
  getPlansPaged,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/services/subscriptionPlanService.js";
import SubscriptionPlanModal from "@/pages/admin/subcriptionManagement/SubscriptionPlanModal";
import PlanDetailModal from "@/pages/admin/subcriptionManagement/PlanDetailModal";

const { Search } = Input;
const { Option } = Select;

// ===== helpers =====
type SortCol = "name" | "createdAt";
const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    : "—";

const scopeTagColor = (s?: LicenseScope) =>
  s === "Userlimits" ? "purple" : "geekblue";

const scopeLabel = (x?: LicenseScope) =>
  x === "Userlimits" ? "User limits" : "Entire company";

// ===================================================================

export default function SubscriptionListPage() {
  // data
  const [rows, setRows] = useState<SubscriptionPlanListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // filters & paging
  const [keyword, setKeyword] = useState("");
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [sortColumn, setSortColumn] = useState<SortCol>("createdAt");
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // modals
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlanDetailResponse | null>(null);

  // detail
  const [detail, setDetail] = useState<SubscriptionPlanDetailResponse | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // -------- load ----------
  const fetchPaged = async (page = pageNumber, size = pageSize) => {
    setLoading(true);
    try {
      const params: GetPlansPagedParams = {
        keyword: keyword || undefined,
        isActive: isActive ?? undefined,
        sortColumn,
        sortDescending,
        pageNumber: page,
        pageSize: size,
      } as any;
      const paged = await getPlansPaged(params);
      setRows(paged?.items ?? []);
      setTotalCount(paged?.totalCount ?? 0);
      setPageNumber(paged?.pageNumber ?? page);
      setPageSize(paged?.pageSize ?? size);
    } catch (e: any) {
      message.error(e.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaged(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, isActive, sortColumn, sortDescending]);

  // -------- handlers ----------
  const resetFilters = () => {
    setKeyword("");
    setIsActive(null);
    setSortColumn("createdAt");
    setSortDescending(true);
    fetchPaged(1, pageSize);
  };

  const openCreate = () => {
    setEditing(null);
    setOpenModal(true);
  };

  const openEdit = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await getPlanById(id);
      setEditing(res);
      setOpenModal(true);
    } catch (e: any) {
      message.error(e.message || "Cannot load plan");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (payload: any, isEdit: boolean) => {
    try {
      if (isEdit) await updatePlan(payload);
      else await createPlan(payload);
      message.success(isEdit ? "Updated" : "Created");
      setOpenModal(false);
      setEditing(null);
      fetchPaged(pageNumber, pageSize);
    } catch (e: any) {
      message.error(e.message || "Failed");
    }
  };

  const confirmDelete = (id: string) => {
    Modal.confirm({
      title: "Delete plan?",
      content: "This action cannot be undone.",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deletePlan(id);
          message.success("Deleted");
          fetchPaged(pageNumber, pageSize);
        } catch (e: any) {
          // ❗ Thay vì toast lỗi chung -> show warning popup đẹp
          Modal.warning({
            centered: true,
            icon: (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            ),
            title: (
              <span className="text-sm font-semibold text-slate-900">
                Plan cannot be deleted
              </span>
            ),
            content: (
              <div className="mt-1 text-xs leading-relaxed text-slate-600">
                <p>
                  This subscription plan has already been applied to one or more users.
                </p>
                <p className="mt-2">
                  Instead of deleting, please open the plan and change its{" "}
                  <span className="font-semibold text-amber-600 underline decoration-dotted">
                    status
                  </span>{" "}
                  to <span className="font-semibold">Inactive</span>. This will keep
                  existing users stable while preventing new assignments.
                </p>
              </div>
            ),
            okText: "I understand",
            okButtonProps: {
              className:
                "bg-indigo-600 hover:bg-indigo-700 border-none text-white font-semibold",
            },
          });
        }
      },
    });
  };
  const viewDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await getPlanById(id);
      setDetail(res);
      setOpenDetail(true);
    } catch (e: any) {
      message.error(e.message || "Cannot get detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  // -------- columns ----------
  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (v: string) => <span className="font-medium text-gray-900">{v}</span>,
      },
      {
        title: "Scope / Package",
        key: "scope",
        render: (_: any, r: SubscriptionPlanListItemResponse) => (
          <Space size={6} wrap>
            <Tag color={scopeTagColor(r.licenseScope)}>{scopeLabel(r.licenseScope)}</Tag>
            {r.isFullPackage && <Tag color="blue">Full Feature</Tag>}
            {r.autoGrantMonthly && <Tag color="gold">Auto monthly</Tag>}
          </Space>
        ),
      },
      {
        title: "Limits",
        key: "limits",
        render: (_: any, r: SubscriptionPlanListItemResponse) => {
          const share = r.companyShareLimit == null ? "∞" : r.companyShareLimit;
          const seats = r.seatsPerCompanyLimit == null ? "∞" : r.seatsPerCompanyLimit;
          return (
            <Space size={6} wrap>
              <Tooltip title="Company share limit">
                <Tag>share: {share}</Tag>
              </Tooltip>
              <Tooltip title="Seats per company">
                <Tag>seats/company: {seats}</Tag>
              </Tooltip>
            </Space>
          );
        },
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (iso: string) => <span className="text-gray-700">{fmtDate(iso)}</span>,
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (iso: string) => <span className="text-gray-700">{fmtDate(iso)}</span>,
      },
      {
        title: "Status",
        dataIndex: "isActive",
        key: "isActive",
        render: (v: boolean) =>
          v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, r: SubscriptionPlanListItemResponse) => (
          <Space>
            <Button type="link" onClick={() => viewDetail(r.id)} icon={<Eye size={16} />} />
            <Button type="link" onClick={() => openEdit(r.id)} icon={<Edit size={16} />} />
            <Button
              type="link"
              danger
              onClick={() => confirmDelete(r.id)}
              icon={<Trash2 size={16} />}
            />
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold m-0">Subscription Plans</h1>
              <p className="text-sm text-gray-500 m-0">Manage pricing & entitlements</p>
            </div>
          </div>
          <Button
            type="primary"
            className="bg-indigo-600"
            icon={<Plus size={16} />}
            onClick={openCreate}
          >
            New Plan
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <Search
              placeholder="Search keyword..."
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              placeholder="Active?"
              allowClear
              value={isActive as any}
              onChange={(v) => setIsActive(v === undefined ? null : v)}
              style={{ width: 140 }}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>

            <Select
              value={sortColumn}
              onChange={(v: SortCol) => setSortColumn(v)}
              style={{ width: 180 }}
            >
              <Option value="createdAt">Sort by Created</Option>
              <Option value="name">Sort by Name</Option>
            </Select>

            <Button
              icon={sortDescending ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              onClick={() => setSortDescending((x) => !x)}
            >
              {sortDescending ? "Descending" : "Ascending"}
            </Button>

            <Button icon={<RotateCcw size={16} />} onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns as any}
              dataSource={rows}
              pagination={{
                current: pageNumber,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                onChange: (p, s) => {
                  setPageNumber(p);
                  setPageSize(s);
                  fetchPaged(p, s);
                },
              }}
            />
          </Spin>
        </div>
      </div>

      {/* Create / Edit */}
      <SubscriptionPlanModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        initial={editing}
        onSubmit={(payload) => handleSubmit(payload, !!editing)}
      />

      {/* Detail */}
      <PlanDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        data={detail}
        loading={loadingDetail}
      />
    </div>
  );
}
