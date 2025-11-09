// src/services/companyMemberService.js
import { axiosInstance } from '@/apiConfig';

const isGuid = (s) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
export async function getCompanyMembersPaged(companyId, params = {}) {
  const { data } = await axiosInstance.get(`/companymember/paged/${companyId}`, { params });

  const payload = data?.data ?? data ?? {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  // chuẩn hoá một chút cho FE
  const mapped = items.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    companyName: r.companyName,
    memberId: r.memberId,
    memberName: r.memberName || r.email || 'Unknown',
    memberAvatar: r.memberAvatar || null,
    email: r.email || '',
    phone: r.phone || r.memberPhoneNumber || '',
    gender: r.gender || '',
    roleName: r.roleName || '',
    status: r.status || (r.isDeleted ? 'Inactive' : 'Active'),
    joinedAt: r.joinedAt,
  }));

  return {
    items: mapped,
    totalCount: payload.totalCount ?? 0,
    pageNumber: payload.pageNumber ?? 1,
    pageSize: payload.pageSize ?? 10,
  };
}
const normStatus = (s) => {
  const v = String(s || '').toLowerCase();
  if (['inprogress', 'in_progress', 'in-progress'].includes(v)) return 'InProgress';
  if (['onhold', 'on_hold', 'on-hold'].includes(v)) return 'OnHold';
  if (['completed', 'done'].includes(v)) return 'Completed';
  return 'Planned';
};

/* Nhận đủ các kiểu date (DateOnly, string ISO, ticks…) => 'yyyy-MM-dd' */
const toDateStr = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v;
  if (typeof v === 'object' && 'year' in v && 'month' in v && 'day' in v) {
    const m = String(v.month).padStart(2, '0');
    const d = String(v.day).padStart(2, '0');
    return `${v.year}-${m}-${d}`;
  }
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

/* Map bất chấp DTO backend khác tên */
const mapItemToProject = (r, currentCompanyId) => {
   const hasCompanyRequest =
     !!(r.companyRequestId ?? r.company_request_id ?? r.companyRequestID);
   const ptype =
     r.ptype /* BE đã trả sẵn nếu bạn đã map */
       ?? (hasCompanyRequest ? 'Outsourced' : 'Internal')
       ?? (r.isHired ? 'Outsourced' : 'Internal'); // fallback cũ

   // Ưu tiên flag từ BE; fallback theo companyRequestId == currentCompanyId
   const isRequest =
     typeof r.isRequest === 'boolean'
       ? r.isRequest
       : (hasCompanyRequest &&
          String(r.companyRequestId ?? r.company_request_id ?? r.companyRequestID)
            .toLowerCase() === String(currentCompanyId).toLowerCase());

   return {
     id: String(r.id),
     code: r.code || '',
     name: r.name || '',
     description: r.description || '',
     ownerCompany: r.ownerCompany || r.companyName || r.owner || r.company || '',
     hiredCompany: r.hiredCompany || r.companyHiredName || r.hiredCompanyName || null,
     workflow:
       r.workflow ||
       r.workflowName ||
       (r.workflowCompanyName && r.workflowName
         ? `${r.workflowCompanyName} — ${r.workflowName}`
         : null),
     startDate: toDateStr(r.startDate),
     endDate: toDateStr(r.endDate),
     status: normStatus(r.status),
     ptype,
     isRequest: !!isRequest,
   };
 };

/**
 * Lấy danh sách project (server có thể filter/sort/paging).
 * Nếu backend dùng route /companies/{companyId}/projects thì truyền companyId vào options.
 */
export async function loadProjects({
  companyId,
  q,
  statuses = [],
  sort = 'recent',
  pageNumber = 1,
  pageSize = 50,
} = {}) {
  if (!companyId) throw new Error('companyId is required');

  const params = { q, sort, pageNumber, pageSize };
  // Đẩy mảng statuses dạng repeated key: ?statuses=A&statuses=B
  const paramsSerializer = (p) => {
    const usp = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v == null || v === '') return;
      if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
      else usp.append(k, String(v));
    });
    statuses.forEach((s) => usp.append('statuses', s));
    return usp.toString();
  };

  const { data } = await axiosInstance.get(`/companies/${companyId}/projects`, {
    params,
    paramsSerializer,
  });

  const payload = data?.data ?? data ?? {};
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload)
    ? payload
    : [];

  return {
   items: items.map((r) => mapItemToProject(r, companyId)),
    totalCount: payload.totalCount ?? items.length,
    pageNumber: payload.pageNumber ?? pageNumber,
    pageSize: payload.pageSize ?? pageSize,
  };
}
export async function getCompanyMemberOptions(companyId, params = {}) {
  const res = await getCompanyMembersPaged(companyId, params);
  return res.items.map((m) => ({
    id: String(m.memberId),
    label: m.memberName,
    sub: m.roleName || m.email || '',
  }));
}
const toDDMMYYYY = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};
export const mapSprintDto = (r) => ({
  id: String(r.id),
  name: r.name || "",
  startDate: toDDMMYYYY(r.startDate),
  endDate: toDDMMYYYY(r.endDate),
});

// ---- ONLY: get sprints by project (giữ các hàm khác nguyên)
export async function getSprintsByProject(
  projectId,
  {
    statuses = [],
    dateFrom,
    dateTo,
    q,
    sortColumn = "start_date",
    sortDescending = false,
    pageNumber = 1,
    pageSize = 200,
  } = {}
) {
  const params = {
    Q: q,
    "DateRange.From": dateFrom,
    "DateRange.To": dateTo,
    SortColumn: sortColumn,
    SortDescending: sortDescending,
    PageNumber: pageNumber,
    PageSize: pageSize,
  };
  const paramsSerializer = (p) => {
    const usp = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v != null && v !== "") usp.append(k, String(v));
    });
    (statuses || []).forEach((s) => usp.append("Statuses", s));
    return usp.toString();
  };

  // ✅ đúng route mới
  const { data } = await axiosInstance.get(`/sprints/projects/${projectId}`, {
    params,
    paramsSerializer,
  });

  const payload = data?.data ?? data ?? {};
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload)
    ? payload
    : [];

  return items.map(mapSprintDto); // ⬅️ KHÔNG còn ReferenceError
}
export async function createProject(payload) {
  const {
    companyId,
    isHired,
    companyRequestId,
    projectRequestId,
    code,
    name,
    description,
    status,
    startDate, // 'yyyy-MM-dd'
    endDate, // 'yyyy-MM-dd'
    sprintLengthWeeks, // int >= 1 (bỏ nếu BE không dùng)
    workflowId, // GUID
    memberIds,
  } = payload;

  if (!isGuid(companyId)) throw new Error('Invalid companyId');
  if (!isGuid(workflowId)) throw new Error('Invalid workflowId');

  const dto = {
    companyId,
    isHired: !!isHired,
    companyRequestId: isGuid(companyRequestId) ? companyRequestId : null,
    projectRequestId: isGuid(projectRequestId) ? projectRequestId : null,
    code: code?.trim(),
    name: name?.trim(),
    description: description?.trim() || null,
    status,
    startDate, // giữ nguyên yyyy-MM-dd
    endDate, // giữ nguyên yyyy-MM-dd
    sprintLengthWeeks,
    workflowId,
    memberIds: (memberIds || []).filter(isGuid),
  };

  // 👉 Nếu BE dùng /projects (không có /companies/{id}/...), đổi path ở đây
  const { data } = await axiosInstance.post(`/companies/${companyId}/projects`, dto);
  return data?.data ?? data;
}

// https://localhost:7160/api/projects/5E9AC255-E049-4106-85FB-43F0492D0637
export const GetProjectByProjectId = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
