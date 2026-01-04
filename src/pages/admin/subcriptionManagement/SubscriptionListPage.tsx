// src/pages/admin/subcriptionManagement/SubscriptionListPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message,
  Tooltip,
} from "antd";
import {
  Eye,
  Edit,
  Trash2,
  Package,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Plus,
  AlertTriangle,
  CalendarDays,
  Users,
  Building2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

type SortCol = "name" | "createdAt";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

// ===== helpers =====
const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

const scopeLabel = (x?: LicenseScope) =>
  x === "Userlimits" ? "User limits" : "Entire company";

const scopeTagColor = (s?: LicenseScope) =>
  s === "Userlimits" ? "purple" : "geekblue";

//  fallback PascalCase (BE có thể trả BillingPeriod/PeriodCount)
const getBillingPeriod = (r: any) => r?.billingPeriod ?? r?.BillingPeriod;
const getPeriodCount = (r: any) => r?.periodCount ?? r?.PeriodCount;

const fmtTerm = (r: any) => {
  // Auto-grant monthly: ưu tiên show theo business meaning
  if (r?.autoGrantMonthly) return "Monthly (Auto)";

  const bp = getBillingPeriod(r);
  const pc = getPeriodCount(r);

  if (!bp || pc == null) return "—";

  const unit =
    bp === "Year"
      ? pc === 1
        ? "year"
        : "years"
      : pc === 1
      ? "month"
      : "months";

  return `${pc} ${unit}`;
};

const fmtLimit = (n?: number | null) => (n == null ? "Unlimited" : n);

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
  const [editing, setEditing] = useState<SubscriptionPlanDetailResponse | null>(
    null
  );

  // detail
  const [detail, setDetail] = useState<SubscriptionPlanDetailResponse | null>(
    null
  );
  const [openDetail, setOpenDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ===== stats =====
  const stats = useMemo(() => {
    const active = rows.filter((x) => x.isActive).length;
    const inactive = rows.length - active;
    const auto = rows.filter((x) => (x as any).autoGrantMonthly).length;
    return { active, inactive, auto };
  }, [rows]);

  // -------- load ----------
  const fetchPaged = useCallback(
    async (page = pageNumber, size = pageSize) => {
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
        message.error(e?.message || "Failed to load plans");
      } finally {
        setLoading(false);
      }
    },
    [keyword, isActive, sortColumn, sortDescending, pageNumber, pageSize]
  );

  useEffect(() => {
    fetchPaged(1, pageSize);
  }, [fetchPaged, pageSize]);

  // -------- handlers ----------
  const resetFilters = useCallback(() => {
    setKeyword("");
    setIsActive(null);
    setSortColumn("createdAt");
    setSortDescending(true);
    fetchPaged(1, pageSize);
  }, [fetchPaged, pageSize]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpenModal(true);
  }, []);

  const openEdit = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await getPlanById(id);
      setEditing(res);
      setOpenModal(true);
    } catch (e: any) {
      message.error(e?.message || "Cannot load plan");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const viewDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await getPlanById(id);
      setDetail(res);
      setOpenDetail(true);
    } catch (e: any) {
      message.error(e?.message || "Cannot get detail");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (payload: any, isEditMode: boolean) => {
      try {
        if (isEditMode) await updatePlan(payload);
        else await createPlan(payload);

        message.success(
          isEditMode
            ? "Update subscription success"
            : "Create subscription success"
        );

        setOpenModal(false);
        setEditing(null);
        fetchPaged(pageNumber, pageSize);
      } catch (e: any) {
        const errText =
          e?.response?.data?.message || e?.message || "Unknown error";

        message.error(
          isEditMode
            ? `Update subscription fail: ${errText}`
            : `Create subscription fail: ${errText}`
        );
      }
    },
    [fetchPaged, pageNumber, pageSize]
  );

  const confirmDelete = useCallback(
    (id: string) => {
      Modal.confirm({
        centered: true,
        title: (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50">
              <Trash2 className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              Delete plan?
            </span>
          </div>
        ),
        content: (
          <div className="mt-2 text-xs leading-relaxed text-slate-600">
            This action cannot be undone. If this plan is already applied to
            users, consider setting it to <b>Inactive</b> instead.
          </div>
        ),
        okText: "Delete",
        cancelText: "Cancel",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deletePlan(id);
            message.success("Delete subscription success");
            fetchPaged(pageNumber, pageSize);
          } catch (e: any) {
            // warning popup đẹp cho case không xoá được
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
                    This subscription plan has already been applied to one or
                    more users.
                  </p>
                  <p className="mt-2">
                    Please change its{" "}
                    <span className="font-semibold text-amber-600 underline decoration-dotted">
                      status
                    </span>{" "}
                    to <span className="font-semibold">Inactive</span> to prevent
                    new assignments.
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
    },
    [fetchPaged, pageNumber, pageSize]
  );

  // -------- columns ----------
  const columns = useMemo(
    () => [
      {
        title: "Plan",
        dataIndex: "name",
        key: "name",
        render: (v: string, r: SubscriptionPlanListItemResponse) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{v}</span>
              {(r as any).autoGrantMonthly && (
                <Tag color="gold" className="m-0">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Auto monthly
                  </span>
                </Tag>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Term",
        key: "term",
        width: 160,
        render: (_: any, r: SubscriptionPlanListItemResponse) => {
          const label = fmtTerm(r as any);
          const bp = getBillingPeriod(r as any);
          const pc = getPeriodCount(r as any);
          const tip =
            (r as any).autoGrantMonthly
              ? "Auto-granted monthly quota"
              : bp && pc != null
              ? `Duration: ${pc} ${bp}`
              : "—";

          return (
            <Tooltip title={tip}>
              <Tag color={(r as any).autoGrantMonthly ? "gold" : "cyan"}>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {label}
                </span>
              </Tag>
            </Tooltip>
          );
        },
      },
      {
        title: "Scope / Package",
        key: "scope",
        render: (_: any, r: SubscriptionPlanListItemResponse) => (
          <Space size={6} wrap>
            <Tag color={scopeTagColor(r.licenseScope)}>
              <span className="inline-flex items-center gap-1">
                {r.licenseScope === "Userlimits" ? (
                  <Users className="h-3.5 w-3.5" />
                ) : (
                  <Building2 className="h-3.5 w-3.5" />
                )}
                {scopeLabel(r.licenseScope)}
              </span>
            </Tag>
            {(r as any).isFullPackage && (
              <Tag color="blue">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Full Feature
                </span>
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: "Limits",
        key: "limits",
        render: (_: any, r: SubscriptionPlanListItemResponse) => {
          const share = fmtLimit((r as any).companyShareLimit);
          const seats = fmtLimit((r as any).seatsPerCompanyLimit);

          return (
            <Space size={6} wrap>
              <Tooltip title="Company share limit">
                <Tag className="m-0">share: {share}</Tag>
              </Tooltip>
              <Tooltip title="Seats per company">
                <Tag className="m-0">seats/company: {seats}</Tag>
              </Tooltip>
            </Space>
          );
        },
      },
      {
        title: "Dates",
        key: "dates",
        width: 190,
        render: (_: any, r: SubscriptionPlanListItemResponse) => (
          <div className="text-xs">
            <div className="text-slate-700">
              <span className="text-slate-400">Created:</span>{" "}
              {fmtDate((r as any).createdAt)}
            </div>
            <div className="text-slate-700">
              <span className="text-slate-400">Updated:</span>{" "}
              {fmtDate((r as any).updatedAt)}
            </div>
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "isActive",
        key: "isActive",
        width: 110,
        render: (v: boolean) =>
          v ? (
            <Tag color="green" className="m-0">
              Active
            </Tag>
          ) : (
            <Tag color="red" className="m-0">
              Inactive
            </Tag>
          ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 140,
        render: (_: any, r: SubscriptionPlanListItemResponse) => (
          <Space>
            <Tooltip title="View detail">
              <Button
                type="text"
                onClick={() => viewDetail((r as any).id)}
                icon={<Eye size={16} />}
              />
            </Tooltip>

            <Tooltip title="Edit plan">
              <Button
                type="text"
                onClick={() => openEdit((r as any).id)}
                icon={<Edit size={16} />}
              />
            </Tooltip>

            <Tooltip title="Delete (or set inactive)">
              <Button
                type="text"
                danger
                onClick={() => confirmDelete((r as any).id)}
                icon={<Trash2 size={16} />}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [confirmDelete, openEdit, viewDetail]
  );

  return (
    <div className="space-y-6">
      {/* ===== Header Card ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-sky-600 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="m-0 text-xl font-semibold text-white">
                  Subscription Plans
                </h1>
                <p className="m-0 text-[12px] text-white/80">
                  Manage pricing, term, limits & entitlements.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="primary"
                className="bg-white text-indigo-700 hover:!text-indigo-700 hover:!bg-white"
                icon={<Plus size={16} />}
                onClick={openCreate}
              >
                New plan
              </Button>
              <Button
                className="border-white/30 bg-white/10 text-white hover:!bg-white/15 hover:!text-white"
                icon={<RotateCcw size={16} />}
                onClick={() => fetchPaged(pageNumber, pageSize)}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* mini stats */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Total (this page)</div>
              <div className="text-lg font-semibold text-white">{rows.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Active</div>
              <div className="text-lg font-semibold text-white">
                {stats.active}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Auto monthly</div>
              <div className="text-lg font-semibold text-white">{stats.auto}</div>
            </div>
          </div>
        </div>

        {/* ===== Filters ===== */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Search
                placeholder="Search by name..."
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 280 }}
              />

              <Select
                placeholder="Status"
                allowClear
                value={isActive as any}
                onChange={(v) => setIsActive(v === undefined ? null : v)}
                style={{ width: 160 }}
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
                {sortDescending ? "Desc" : "Asc"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={resetFilters} icon={<RotateCcw size={16} />}>
                Reset
              </Button>
            </div>
          </div>

          {/* quick hint */}
          <div className="mt-3 text-[11px] text-slate-500">
            Tip: Use <b>Inactive</b> instead of delete if the plan has been applied to users.
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="px-3 pb-4 pt-2">
          <Spin spinning={loading || loadingDetail}>
            <Table
              rowKey="id"
              columns={columns as any}
              dataSource={rows}
              size="middle"
              rowClassName={(r: any) =>
                cn(
                  "transition",
                  r?.isActive ? "bg-white" : "bg-slate-50/50"
                )
              }
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
