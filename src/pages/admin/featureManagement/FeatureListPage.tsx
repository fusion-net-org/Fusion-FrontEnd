import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Space, Spin, Table, Tag, message, Switch } from "antd";
import { Plus, Edit, Trash2, ArrowDown, ArrowUp, RotateCcw } from "lucide-react";

import type {
  FeatureResponse,
  FeatureCatalogPagedParams,
  FeatureCreateRequest,
  FeatureUpdateRequest,
} from "@/interfaces/Feature/FeatureCatalog";

import {
  getFeaturesPaged,
  getFeatureById,
  createFeature,
  updateFeature,
  toggleFeature,
  deleteFeature,
} from "@/services/featureService.js";

import FeatureModal from "@/pages/admin/featureManagement/FeatureModel";

const { Search } = Input;
const { Option } = Select;

type SortCol = "category" | "createdAt";

export default function FeatureListPage() {
  // data
  const [rows, setRows] = useState<FeatureResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // filters & paging
  const [keyword, setKeyword] = useState("");
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortCol>("createdAt");
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<FeatureResponse | null>(null);

  // load
  const fetchPaged = async (page = pageNumber, size = pageSize) => {
    setLoading(true);
    try {
      const params: FeatureCatalogPagedParams = {
        keyword: keyword || undefined,
        isActive: isActive ?? undefined,
        category: category || undefined,
        sortColumn,
        sortDescending,
        pageNumber: page,
        pageSize: size,
      };
      const paged = await getFeaturesPaged(params);
      setRows(paged?.items ?? []);
      setTotalCount(paged?.totalCount ?? 0);
      setPageNumber(paged?.pageNumber ?? page);
      setPageSize(paged?.pageSize ?? size);
    } catch (e: any) {
      message.error(e.message || "Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaged(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, isActive, category, sortColumn, sortDescending]);

  // handlers
  const resetFilters = () => {
    setKeyword("");
    setIsActive(null);
    setCategory(null);
    setSortColumn("createdAt");
    setSortDescending(true);
    fetchPaged(1, pageSize);
  };

  const openCreate = () => {
    setEditing(null);
    setOpenModal(true);
  };

  const openEdit = async (id: string) => {
    try {
      setLoading(true);
      const res = await getFeatureById(id);
      setEditing(res);
      setOpenModal(true);
    } catch (e: any) {
      message.error(e.message || "Cannot load feature");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: FeatureCreateRequest | FeatureUpdateRequest, isEdit: boolean) => {
    try {
      if (isEdit) await updateFeature(payload as FeatureUpdateRequest);
      else await createFeature(payload as FeatureCreateRequest);
      message.success(isEdit ? "Feature updated" : "Feature created");
      setOpenModal(false);
      setEditing(null);
      fetchPaged(pageNumber, pageSize);
    } catch (e: any) {
      message.error(e.message || "Failed");
    }
  };

  const handleToggle = async (r: FeatureResponse, active: boolean) => {
    try {
      await toggleFeature(r.id, active);
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: active } : x)));
    } catch (e: any) {
      message.error(e.message || "Toggle failed");
    }
  };

  const confirmDelete = (id: string) => {
    Modal.confirm({
      title: "Delete feature?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFeature(id);
          message.success("Deleted");
          fetchPaged(pageNumber, pageSize);
        } catch (e: any) {
          message.error(e.message || "Failed to delete");
        }
      },
    });
  };

  // columns
  const columns = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        render: (v: string) => <span className="font-medium text-gray-900">{v}</span>,
        width: 160,
      },
      { title: "Name", dataIndex: "name", key: "name", width: 240 },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        render: (v?: string) => (v ? <Tag>{v}</Tag> : <span className="text-gray-400">—</span>),
        width: 160,
      },
      {
          title: "Status",
        dataIndex: "isActive",
        key: "isActive",
        render: (v: boolean) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>,
        width: 160,
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (iso: string) => new Date(iso).toLocaleString(),
        width: 200,
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (iso: string) => new Date(iso).toLocaleString(),
        width: 200,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right" as const,
        render: (_: any, r: FeatureResponse) => (
          <Space>
            <Button type="link" onClick={() => openEdit(r.id)} icon={<Edit size={16} />} />
            <Button type="link" danger onClick={() => confirmDelete(r.id)} icon={<Trash2 size={16} />} />
          </Space>
        ),
        width: 140,
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
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold m-0">Feature Catalog</h1>
              <p className="text-sm text-gray-500 m-0">Manage features used by subscription plans</p>
            </div>
          </div>
          <Button type="primary" className="bg-indigo-600" icon={<Plus size={16} />} onClick={openCreate}>
            New Feature
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <Search
              placeholder="Search by code/name…"
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

            <Select value={sortColumn} onChange={(v: SortCol) => setSortColumn(v)} style={{ width: 180 }}>
              <Option value="createdAt">Sort by Created</Option>
              <Option value="category">Sort by Category</Option>
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
              scroll={{ x: 900 }}
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
      <FeatureModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        initial={editing}
        onSubmit={(payload) => handleSubmit(payload, !!editing)}
      />
    </div>
  );
}
