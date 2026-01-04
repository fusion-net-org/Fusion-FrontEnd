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

const toDateStr = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v;
  if (typeof v === 'object' && v && 'year' in v && 'month' in v && 'day' in v) {
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

const toInt = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* Map DTO project list -> Project VM */
const mapItemToProject = (r, currentCompanyId) => {
  const companyRequestId =
    r.companyRequestId ?? r.company_request_id ?? r.companyRequestID ?? null;

  const hasCompanyRequest = !!companyRequestId;

  const ptype =
    r.ptype ??
    (hasCompanyRequest ? 'Outsourced' : 'Internal') ??
    (r.isHired ? 'Outsourced' : 'Internal');

  const isRequest =
    typeof r.isRequest === 'boolean'
      ? r.isRequest
      : hasCompanyRequest &&
        String(companyRequestId).toLowerCase() === String(currentCompanyId).toLowerCase();

const isMaintenance = !!(r.isMaintenance ?? r.isMaintenace ?? r.is_maintenance ?? false);
console.log(isMaintenance)
  // backend có thể trả maintenanceComponentCount / componentCount / totalComponents...
  const maintenanceComponentCount = toInt(
    r.maintenanceComponentCount ?? r.componentCount ?? r.totalComponents ?? 0,
  );

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

    isClosed: r.isClosed,
    ptype,
    isRequest: !!isRequest,

    isMaintenance,
    maintenanceComponentCount,
    
  };
};

// ... các hàm ở trên (isGuid, getCompanyMembersPaged, normStatus, toDateStr, mapItemToProject) ...

// Map DTO member trong project -> VM dùng cho FE
const mapProjectMemberDto = (m) => ({
  userId: String(m.userId ?? m.id ?? m.memberId ?? m.user_id ?? m.member_id ?? ''),
  name: m.name ?? m.memberName ?? m.fullName ?? m.email ?? 'Unknown',
  email: m.email ?? '',
  roleName: m.roleName ?? m.projectRole ?? m.role ?? '',
  isPartner: !!(m.isPartner ?? m.isExternal ?? m.isCompanyHiredMember),
  isViewAll: !!(m.isViewAll ?? m.canViewAllTasks ?? m.isManager),
  joinedAt: m.joinedAt ?? m.createdAt ?? m.created_at ?? null,
});

// Map DTO project detail từ BE -> ProjectDetailVm cho FE
const mapProjectDetailDto = (r) => {
  const stats = r.stats ?? r.summary ?? {};
  const asNum = (v, fallback = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : fallback);

  const membersRaw = r.members ?? r.projectMembers ?? r.memberList ?? r.memberResponses ?? [];

  return {
    id: String(r.id ?? r.projectId ?? r.project_id ?? ''),
    code: r.code ?? r.projectCode ?? '',
    name: r.name ?? r.projectName ?? '',
    description: r.description ?? r.desc ?? null,
    status: normStatus(r.status ?? r.projectStatus),
    isHired: !!(r.isHired ?? r.is_hired ?? r.isOutsourced),
    companyId: String(r.companyId ?? r.ownerCompanyId ?? r.company_id ?? ''),
    companyName: r.companyName ?? r.ownerCompanyName ?? r.ownerCompany ?? '',
    companyHiredId: r.companyHiredId ?? r.hiredCompanyId ?? null,
    companyHiredName: r.companyHiredName ?? r.hiredCompanyName ?? null,
    workflowId: String(r.workflowId ?? r.workflow_id ?? ''),
    workflowName: r.workflowName ?? '',
    sprintLengthWeeks: r.sprintLengthWeeks ?? r.sprintLength ?? 1,
    startDate: toDateStr(r.startDate ?? r.start_date),
    endDate: toDateStr(r.endDate ?? r.end_date),
    createdAt: r.createdAt ?? r.created_at ?? new Date().toISOString(),
    createdByName: r.createdByName ?? r.createdBy ?? r.createdByUserName ?? '',

    stats: {
      totalSprints: asNum(
        stats.totalSprints ?? stats.sprintCount ?? r.totalSprints ?? r.sprintCount,
      ),
      activeSprints: asNum(
        stats.activeSprints ?? stats.activeSprintCount ?? r.activeSprints ?? r.activeSprintCount,
      ),
      totalTasks: asNum(stats.totalTasks ?? stats.taskCount ?? r.totalTasks ?? r.taskCount),
      doneTasks: asNum(stats.doneTasks ?? stats.doneTaskCount ?? r.doneTasks ?? r.doneTaskCount),
      totalStoryPoints: asNum(
        stats.totalStoryPoints ?? stats.storyPoints ?? r.totalStoryPoints ?? r.storyPoints,
      ),
    },

    members: Array.isArray(membersRaw) ? membersRaw.map(mapProjectMemberDto) : [],
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
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};
export const mapSprintDto = (r) => ({
  id: String(r.id),
  name: r.name || '',
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
    sortColumn = 'start_date',
    sortDescending = false,
    pageNumber = 1,
    pageSize = 200,
  } = {},
) {
  const params = {
    Q: q,
    'DateRange.From': dateFrom,
    'DateRange.To': dateTo,
    SortColumn: sortColumn,
    SortDescending: sortDescending,
    PageNumber: pageNumber,
    PageSize: pageSize,
  };
  const paramsSerializer = (p) => {
    const usp = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v != null && v !== '') usp.append(k, String(v));
    });
    (statuses || []).forEach((s) => usp.append('Statuses', s));
    return usp.toString();
  };

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

  return items.map(mapSprintDto);
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
    startDate,
    endDate,
    sprintLengthWeeks,
    workflowId,
    memberIds,

    isMaintenance,
    maintenanceForProjectId,
    maintenanceComponents,
  } = payload;

  if (!isGuid(companyId)) throw new Error('Invalid companyId');
  if (!isGuid(workflowId)) throw new Error('Invalid workflowId');

  const dto = {
    companyId,
    isHired: !!isHired,
    companyRequestId: isGuid(companyRequestId) ? companyRequestId : null,

    projectRequestId: isMaintenance ? null : (isGuid(projectRequestId) ? projectRequestId : null),

    code: code?.trim(),
    name: name?.trim(),
    description: description?.trim() || null,
    status,
    startDate,
    endDate,
    sprintLengthWeeks,
    workflowId,
    memberIds: (memberIds || []).filter(isGuid),

    isMaintenance: !!isMaintenance,
    maintenanceForProjectId: isGuid(maintenanceForProjectId) ? maintenanceForProjectId : null,
    maintenanceComponents: (maintenanceComponents || [])
      .map((c) => ({
        name: (c.name || '').trim(),
        note: (c.note || '').trim(),
      }))
      .filter((c) => !!c.name),
  };

  const { data } = await axiosInstance.post(`/companies/${companyId}/projects`, dto);
  return data?.data ?? data;
}


// https://localhost:7160/api/projects/5E9AC255-E049-4106-85FB-43F0492D0637
export const GetProjectByProjectId = async (id) => {
  try {
    const response = await axiosInstance.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const GetProjectByCompanyRequest = async (id) => {
  try {
    const response = await axiosInstance.get(`/companies/${id}/projects-by-company-request`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const GetProjectProcess = async (id) => {
  try {
    const response = await axiosInstance.get(`/projects/${id}/progress`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const getAllProjectByAdmin = async ({
  CompanyName = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = false,
}) => {
  try {
    const response = await axiosInstance.get('/admin/projects', {
      params: {
        CompanyName,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });

    return response.data?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch admin projects.');
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await axiosInstance.get(`/admin/${id}`);
    return response.data;
    const { data } = await axiosInstance.get(`/projects/${projectId}`);
    // API có thể trả { succeeded, data: {...} } hoặc trả thẳng {...}
    return data?.data ?? data ?? {};
  } catch (error) {
    console.error('GetProjectByProjectId failed', error);
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
//================  Over view ====================
// 1. Project Growth And Completion
export const getProjectGrowthAndCompletionOverview = async (params = {}) => {
  const response = await axiosInstance.get('/growth-and-completion', {
    params,
  });

  const payload = response?.data ?? {};
  return payload.data ?? payload;
};

//2. Project Execution Overview (tasks & sprints)
export const getProjectExecutionOverview = async (params = {}) => {
  const response = await axiosInstance.get('/project-execution-overview', {
    params,
  });
  const payload = response?.data ?? {};
  return payload.data ?? payload;
};

// Gán member vào project
export async function assignMemberToProject(projectId, memberId, companyId) {
  if (!isGuid(projectId)) throw new Error('Invalid projectId');
  if (!isGuid(memberId)) throw new Error('Invalid memberId');
  if (!isGuid(companyId)) throw new Error('Invalid companyId');

  const dto = {
    projectId,
    companyId,
    memberId,
  };

  // ⚠️ Nếu BE dùng route khác, chỉ cần chỉnh path dưới đây
  const { data } = await axiosInstance.post('/projectmember', dto);
  return data?.data ?? data;
}

// Kick member khỏi project
export async function removeMemberFromProject(projectId, memberId) {
  if (!isGuid(projectId)) throw new Error('Invalid projectId');
  if (!isGuid(memberId)) throw new Error('Invalid memberId');

  // Ví dụ: DELETE /projectmember/project/{projectId}/member/{memberId}
  // chỉnh lại cho khớp route BE của bạn
  const { data } = await axiosInstance.delete(
    `/projectmember/project/${projectId}/member/${memberId}`,
  );
  return data?.data ?? data;
}

export async function updateProject(projectId, payload) {
  const res = await axiosInstance.put(`/projects/${projectId}`, payload);
  return res.data;
}

export async function deleteProject(projectId) {
  const res = await axiosInstance.delete(`/projects/${projectId}`);
  return res.data;
}
export async function closeProject(projectId) {
  if (!isGuid(projectId)) throw new Error('Invalid projectId');
  const { data } = await axiosInstance.post(`/projects/${projectId}/close`);
  return data?.data ?? data;
}

export async function reopenProject(projectId) {
  if (!isGuid(projectId)) throw new Error('Invalid projectId');
  const { data } = await axiosInstance.post(`/projects/${projectId}/reopen`);
  return data?.data ?? data;
}
export const checkProjectAccess = async (projectId) => {
  if (!isGuid(projectId)) throw new Error('Invalid projectId');

  const { data } = await axiosInstance.get(`/projects/${projectId}/access`);
  return data?.data ?? data;
};
