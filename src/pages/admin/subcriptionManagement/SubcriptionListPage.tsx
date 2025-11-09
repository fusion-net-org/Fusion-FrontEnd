// import React, { useEffect, useMemo, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import {
//   Search,
//   Pencil,
//   Trash2,
//   ArrowUp,
//   ArrowDown as ArrowDownIcon,
//   Package,
//   RefreshCw,
// } from 'lucide-react';
// import Pagination from '@mui/material/Pagination';
// import Stack from '@mui/material/Stack';
// import { Modal, Form, Input, InputNumber } from 'antd';
// import { toast } from 'react-toastify';
// import {
//   GetSubscriptionForAdmin,
//   CreateSubscription,
//   UpdateSubscription,
//   DeleteSubscription,
// } from '@/services/subscriptionService.js';

// type Row = {
//   id: string;
//   name: string;
//   price: number;
//   quotaCompany: number;
//   quotaProject: number;
//   description?: string | null;
//   createdAt: string;
//   updatedAt?: string | null;
// };

// type SortKey = 'CreatedAt' | 'UpdatedAt' | 'Name' | 'Price' | 'QuotaCompany' | 'QuotaProject';

// const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// function uid() {
//   return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
// }

// const unwrap = (res: any) => (res?.data !== undefined ? res.data : res);

// function mapAdminDtoToRow(d: any): Row {
//   const get = (...keys: string[]) =>
//     keys.find((k) => d?.[k] !== undefined) ? d[keys.find((k) => d?.[k] !== undefined)!] : undefined;

//   return {
//     id: get('id', 'Id') ?? uid(),
//     name: get('name', 'Name') ?? '',
//     price: Number(get('price', 'Price') ?? 0),
//     quotaCompany: Number(get('quotaCompany', 'QuotaCompany', 'quota_company') ?? 0),
//     quotaProject: Number(get('quotaProject', 'QuotaProject', 'quota_project') ?? 0),
//     description: get('description', 'Description') ?? null,
//     createdAt: get('createdAt', 'createAt', 'CreatedAt', 'CreateAt') ?? new Date().toISOString(),
//     updatedAt: get('updatedAt', 'updateAt', 'UpdatedAt', 'UpdateAt') ?? null,
//   };
// }

// export default function SubcriptionListPage() {
//   const [params, setParams] = useSearchParams();

//   const q = params.get('q') ?? '';
//   const sort = (params.get('sort') as SortKey) || 'CreatedAt';
//   const dirDesc = (params.get('dir') || 'desc') !== 'asc';
//   const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
//   const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10) || 10);
//   const { confirm } = Modal;

//   const patchParams = (patch: Record<string, string | number | undefined>) => {
//     const next = new URLSearchParams(params);
//     Object.entries(patch).forEach(([k, v]) => {
//       if (v === undefined || v === '') next.delete(k);
//       else next.set(k, String(v));
//     });
//     setParams(next, { replace: true });
//   };

//   const SORT_OPTIONS = [
//     { key: 'CreatedAt', label: 'Created At' },
//     { key: 'UpdatedAt', label: 'Updated At' },
//     { key: 'Name', label: 'Name' },
//     { key: 'Price', label: 'Price' },
//     { key: 'QuotaCompany', label: 'Quota Company' },
//     { key: 'QuotaProject', label: 'Quota Project' },
//   ];

//   const resetFilters = () => {
//     patchParams({
//       q: '',
//       sort: 'CreatedAt',
//       dir: 'desc',
//       page: 1,
//       pageSize,
//     });
//   };

//   const [db, setDb] = useState<Row[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   const load = async () => {
//     setLoading(true);
//     try {
//       const raw = await GetSubscriptionForAdmin();
//       const list = unwrap(raw);
//       setDb(Array.isArray(list) ? list.map(mapAdminDtoToRow) : []);
//     } catch (err: any) {
//       toast.error(err?.message || 'Failed to load subscriptions');
//       setDb([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const { items, total } = useMemo(() => {
//     let list = db;

//     if (q.trim()) {
//       const k = q.trim().toLowerCase();
//       list = list.filter(
//         (x) => x.name.toLowerCase().includes(k) || (x.description ?? '').toLowerCase().includes(k),
//       );
//     }

//     const mul = dirDesc ? -1 : 1;
//     list = [...list].sort((a, b) => {
//       switch (sort) {
//         case 'Name':
//           return a.name.localeCompare(b.name) * mul;
//         case 'Price':
//           return (a.price - b.price) * mul;
//         case 'QuotaCompany':
//           return (a.quotaCompany - b.quotaCompany) * mul;
//         case 'QuotaProject':
//           return (a.quotaProject - b.quotaProject) * mul;
//         case 'UpdatedAt':
//           return (
//             (new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()) * mul
//           );
//         case 'CreatedAt':
//         default:
//           return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mul;
//       }
//     });

//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;
//     return { items: list.slice(start, end), total: list.length };
//   }, [db, q, sort, dirDesc, page, pageSize]);

//   const [modal, setModal] = useState<
//     | { open: false }
//     | { open: true; mode: 'create'; data?: undefined }
//     | { open: true; mode: 'edit'; data: Row }
//   >({ open: false });

//   return (
//     <>
//       <div className="space-y-6">
//         {/* Main Content Card */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//           {/* Header Section */}
//           <div className="p-6 border-b border-gray-200">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
//                   <Package className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-xl font-semibold text-gray-900 m-0">
//                     Subscription Management
//                   </h1>
//                   <p className="text-sm text-gray-500 m-0">Manage subscription packages</p>
//                 </div>
//               </div>
//               <button
//                 className="h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
//                 onClick={() => setModal({ open: true, mode: 'create' })}
//               >
//                 <span className="text-lg leading-none">+</span>
//                 New Package
//               </button>
//             </div>

//             {/* Filters Row */}
//             <div className="flex items-center gap-3">
//               {/* Search */}
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   className="w-full pl-10 pr-3 h-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                   placeholder="Search by name or description..."
//                   value={q}
//                   onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
//                 />
//               </div>

//               {/* Sort column */}
//               <select
//                 className="h-10 px-3 pr-8 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
//                 value={sort}
//                 onChange={(e) => patchParams({ sort: e.target.value, page: 1 })}
//               >
//                 {SORT_OPTIONS.map((o) => (
//                   <option key={o.key} value={o.key}>
//                     {o.label}
//                   </option>
//                 ))}
//               </select>

//               {/* Sort direction */}
//               <button
//                 className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors"
//                 onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
//                 aria-label="Toggle sort direction"
//                 title={dirDesc ? 'Descending' : 'Ascending'}
//               >
//                 {dirDesc ? (
//                   <ArrowDownIcon className="w-4 h-4 text-gray-600" />
//                 ) : (
//                   <ArrowUp className="w-4 h-4 text-gray-600" />
//                 )}
//               </button>

//               {/* Reset */}
//               <button
//                 className="h-10 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
//                 onClick={resetFilters}
//                 title="Reset filters"
//               >
//                 <RefreshCw className="w-4 h-4" />
//                 Reset
//               </button>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     Name
//                   </th>
//                   <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     Price (VND)
//                   </th>
//                   <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
//                     Quota Company
//                   </th>
//                   <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
//                     Quota Project
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
//                     Description
//                   </th>
//                   <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
//                     Created
//                   </th>
//                   <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">
//                     Updated
//                   </th>
//                   <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {loading && (
//                   <tr>
//                     <td colSpan={8} className="px-6 py-12 text-center">
//                       <div className="flex flex-col items-center gap-3">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//                         <span className="text-sm text-gray-500">Loading subscriptions...</span>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//                 {!loading &&
//                   items.map((p) => (
//                     <tr key={p.id} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-4">
//                         <div className="font-medium text-gray-900">{p.name}</div>
//                       </td>
//                       <td className="px-6 py-4 text-right">
//                         <span className="text-sm font-semibold text-gray-900">
//                           {p.price.toLocaleString(undefined, {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-center hidden md:table-cell">
//                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
//                           {p.quotaCompany}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-center hidden md:table-cell">
//                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
//                           {p.quotaProject}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 hidden lg:table-cell">
//                         <span
//                           className="text-sm text-gray-600 block max-w-[200px] truncate"
//                           title={p.description ?? undefined}
//                         >
//                           {p.description || '-'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-center hidden lg:table-cell">
//                         <span className="text-sm text-gray-600">
//                           {new Date(p.createdAt).toLocaleDateString()}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-center hidden xl:table-cell">
//                         <span className="text-sm text-gray-600">
//                           {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-right">
//                         <div className="flex items-center justify-end gap-1">
//                           <button
//                             className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
//                             title="Edit"
//                             onClick={() => setModal({ open: true, mode: 'edit', data: p })}
//                           >
//                             <Pencil className="w-4 h-4 text-yellow-600" />
//                           </button>
//                           <button
//                             className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
//                             title="Delete"
//                             onClick={() => {
//                               confirm({
//                                 title: 'Delete subscription package',
//                                 content: `Are you sure you want to delete "${p.name}"?`,
//                                 okText: 'Delete',
//                                 okType: 'danger',
//                                 cancelText: 'Cancel',
//                                 centered: true,
//                                 onOk: async () => {
//                                   try {
//                                     const ok = await DeleteSubscription(p.id);
//                                     const success =
//                                       ok === true || (ok && ok.status === 204) || ok?.data === true;
//                                     if (success) {
//                                       setDb((prev) => prev.filter((x) => x.id !== p.id));
//                                       toast.success(`Package ${p.name} deleted successfully.`);
//                                     } else {
//                                       toast.error('Delete failed');
//                                     }
//                                   } catch (err: any) {
//                                     console.error(err);
//                                     toast.error(err?.message || 'Failed to delete package.');
//                                   }
//                                 },
//                               });
//                             }}
//                           >
//                             <Trash2 className="w-4 h-4 text-red-600" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 {!loading && items.length === 0 && (
//                   <tr>
//                     <td colSpan={8} className="px-6 py-12 text-center">
//                       <div className="flex flex-col items-center gap-3">
//                         <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
//                           <Package className="w-8 h-8 text-gray-400" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">No packages found</p>
//                           <p className="text-sm text-gray-500 mt-1">
//                             Try adjusting your search or filter criteria
//                           </p>
//                         </div>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination Footer */}
//           <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
//             <div className="flex items-center justify-between gap-4">
//               <div className="flex items-center gap-4 text-sm">
//                 <span className="text-gray-600">
//                   Showing <span className="font-semibold text-gray-900">{items.length}</span> of{' '}
//                   <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>{' '}
//                   packages
//                 </span>
//                 <label className="inline-flex items-center gap-2">
//                   <span className="text-gray-600">Rows per page:</span>
//                   <select
//                     className="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
//                     value={pageSize}
//                     onChange={(e) => {
//                       const size = Math.max(1, parseInt(e.target.value || '10', 10));
//                       patchParams({ pageSize: size, page: 1 });
//                     }}
//                   >
//                     {PAGE_SIZE_OPTIONS.map((n) => (
//                       <option key={n} value={n}>
//                         {n}
//                       </option>
//                     ))}
//                   </select>
//                 </label>
//               </div>
//               <Stack spacing={2}>
//                 <Pagination
//                   count={Math.max(1, Math.ceil(total / pageSize))}
//                   page={page}
//                   onChange={(_, p) => patchParams({ page: p })}
//                   color="primary"
//                   variant="outlined"
//                   shape="rounded"
//                   showFirstButton
//                   showLastButton
//                 />
//               </Stack>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal AntD */}
//       {modal.open && (
//         <PackageModal
//           mode={modal.mode}
//           data={modal.mode === 'edit' ? modal.data : undefined}
//           onClose={() => setModal({ open: false })}
//           onSaved={async (payload) => {
//             try {
//               if (modal.mode === 'create') {
//                 const raw = await CreateSubscription(payload);
//                 const created = mapAdminDtoToRow(unwrap(raw));
//                 setDb((prev) => [created, ...prev]);
//                 toast.success('Created successfully');
//               } else if (modal.mode === 'edit' && modal.data) {
//                 const raw = await UpdateSubscription(modal.data.id, payload);
//                 const updated = mapAdminDtoToRow(unwrap(raw));
//                 setDb((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
//                 toast.success('Updated successfully');
//               }
//               setModal({ open: false });
//             } catch (err: any) {
//               toast.error(err?.message || 'Save failed');
//             }
//           }}
//         />
//       )}
//     </>
//   );
// }

// function PackageModal({
//   mode,
//   data,
//   onClose,
//   onSaved,
// }: {
//   mode: 'create' | 'edit';
//   data?: Row;
//   onClose: () => void;
//   onSaved: (p: Omit<Row, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
// }) {
//   const [form] = Form.useForm();

//   useEffect(() => {
//     form.setFieldsValue({
//       name: data?.name ?? '',
//       price: data?.price ?? 0,
//       quotaCompany: data?.quotaCompany ?? 1,
//       quotaProject: data?.quotaProject ?? 1,
//       description: data?.description ?? '',
//     });
//   }, [data, form]);

//   const handleOk = async () => {
//     try {
//       const values = await form.validateFields();
//       await onSaved(values);
//     } catch (err) {}
//   };

//   return (
//     <Modal
//       open
//       title={mode === 'create' ? 'Create Package' : 'Edit Package'}
//       onCancel={onClose}
//       onOk={handleOk}
//       okText="Save"
//     >
//       <Form form={form} layout="vertical">
//         <Form.Item
//           label="Name"
//           name="name"
//           rules={[{ required: true, message: 'Please input package name' }]}
//         >
//           <Input />
//         </Form.Item>

//         <Form.Item
//           label="Price"
//           name="price"
//           rules={[{ required: true, type: 'number', min: 0, message: 'Price must be >= 0' }]}
//         >
//           <InputNumber className="w-full" min={0} step={0.01} />
//         </Form.Item>

//         <Form.Item
//           label="Quota Company"
//           name="quotaCompany"
//           rules={[{ required: true, type: 'number', min: 0 }]}
//         >
//           <InputNumber className="w-full" min={1} />
//         </Form.Item>

//         <Form.Item
//           label="Quota Project"
//           name="quotaProject"
//           rules={[{ required: true, type: 'number', min: 0 }]}
//         >
//           <InputNumber className="w-full" min={1} />
//         </Form.Item>

//         <Form.Item label="Description" name="description">
//           <Input.TextArea rows={3} />
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// }

////////////////////////////////////////////////////////////////////////////////
import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Input, Select, Button, Modal } from 'antd';
import { toast } from 'react-toastify';
import {
  getSubscriptionPlans,
  createSubcriptionPlan,
  updateSubcriptionPlan,
  deleteSubcriptionPlan,
} from '@/services/subscriptionService.js';
import SubscriptionPlanModal from './SubscriptionPlanModal';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Edit, Trash2 } from 'lucide-react';

const { Search } = Input;
const { Option } = Select;

interface Feature {
  featureKey: string;
  limitValue: number;
}

interface Price {
  billingPeriod: number;
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
  const [billingPeriod, setBillingPeriod] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<'code' | 'name' | 'description'>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  // Pagination
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        pageSize: pageSize,
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

  // Create plan
  const handleCreatePlan = async (formData: any) => {
    try {
      await createSubcriptionPlan(formData);
      toast.success('Subscription plan created successfully!');
      closeModal();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subscription plan.');
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Update
  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleUpdatePlan = async (formData: any) => {
    try {
      console.log(formData);
      await updateSubcriptionPlan({ ...formData, id: editingPlan?.id });
      toast.success('Subscription plan updated successfully!');
      closeModal();
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update subscription plan.');
    }
  };

  // Delete
  const handleDeletePlan = (id: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this subscription plan?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSubcriptionPlan(id);
          toast.success('Subscription plan deleted successfully!');
          fetchPlans();
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete subscription plan.');
        }
      },
    });
  };

  // Columns
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
      render: (val: number, record: SubscriptionPlan) => (
        <span>
          {val} {record.price?.currency}
        </span>
      ),
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
        <div className="flex items-center gap-2">
          <Button
            icon={<Edit size={16} />}
            onClick={() => openEditModal(record)}
            type="link"
            className="text-indigo-600"
          ></Button>
          <Button
            icon={<Trash2 size={16} />}
            onClick={() => handleDeletePlan(record.id)}
            type="link"
            danger
          ></Button>
        </div>
      ),
    },
  ];

  const handleTableChange = (paginationConfig: any) => {
    const { current, pageSize } = paginationConfig;
    setPagination({ ...pagination, current, pageSize });
    fetchPlans(current, pageSize);
  };

  const toggleSortDirection = () => setSortDescending((prev) => !prev);

  // Reset filters
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Subscription Plans</h2>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          className="bg-indigo-600"
          onClick={openModal}
        >
          Add Subcription
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-4 rounded-lg shadow-sm">
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
          <Option value={'Week'}>Week</Option>
          <Option value={'Month'}>Month</Option>
          <Option value={'Year'}>Year</Option>
        </Select>

        <Select value={sortColumn} onChange={(val) => setSortColumn(val)} style={{ width: 160 }}>
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
          onClick={handleResetFilters}
          icon={<RotateCcw size={16} />}
          className="ml-2 border-gray-300 text-gray-700"
        >
          Reset
        </Button>
      </div>

      {/* Table */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Spin>

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
    </div>
  );
}
