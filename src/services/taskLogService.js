import { axiosInstance } from "../apiConfig";

/** =========================
 * ENDPOINTS
 * ========================= */
const PROJECT_ACTIVITIES_ENDPOINT = (projectId) => `/projects/${projectId}/activities`;
const PROJECT_ACTIVITY_BY_ID_ENDPOINT = (projectId, id) =>
  `/projects/${projectId}/activities/${id}`;

const TASK_LOGS_ENDPOINT = `/tasklogevents`;
const TASK_LOG_BY_ID_ENDPOINT = (id) => `/tasklogevents/${id}`;
const TASK_LOG_UPDATE_ISVIEW_ENDPOINT = `/tasklogevents/update_isView`;

/** =========================
 * NORMALIZERS
 * ========================= */
function unwrapResponse(payload) {
  // ResponseModel<T>: { data: ... } hoặc axios { data: { data: ... } }
  const root = payload?.data ?? payload ?? {};
  return root?.data ?? root;
}

function normalizePaged(payload, fallback = { pageNumber: 1, pageSize: 30 }) {
  const data = unwrapResponse(payload);

  const items =
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.Items) ? data.Items :
    Array.isArray(data) ? data :
    [];

  const totalCount = Number(data?.totalCount ?? data?.TotalCount ?? items.length ?? 0);
  const pageNumber = Number(data?.pageNumber ?? data?.PageNumber ?? fallback.pageNumber ?? 1);
  const pageSize = Number(data?.pageSize ?? data?.PageSize ?? fallback.pageSize ?? items.length ?? 30);

  return { items, totalCount, pageNumber, pageSize };
}

function normalizeOne(payload) {
  return unwrapResponse(payload);
}

// DateOnly safe: YYYY-MM-DD
function toDateOnly(v) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : (v?.toDate?.() ?? v);
  if (!(d instanceof Date) || Number.isNaN(d.valueOf())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** =========================
 * 1) PROJECT ACTIVITIES (existing)
 * GET /api/projects/{projectId}/activities
 * ========================= */
/**
 * opts:
 * - keyword, actions (array), actorId, from/to (Date|string), sortColumn
 * axiosConfig: { signal } để cancel khi gõ search nhanh
 */
export async function getProjectActivities(projectId, opts = {}, axiosConfig = {}) {
  const {
    pageNumber = 1,
    pageSize = 30,
    keyword = "",
    actions = [],
    actorId,
    from,
    to,
    sortColumn = "CreatedAt",
    sortDescending = true,
  } = opts;

  const params = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    SortColumn: sortColumn,
    SortDescending: sortDescending,
  };

  if (keyword) {
    params.Keyword = keyword; // BE field chuẩn
    params.Search = keyword;  // backward-compat controller của bạn
  }

  if (actorId) params.ActorId = actorId;

  if (Array.isArray(actions) && actions.length) {
    const csv = actions.filter(Boolean).join(",");
    params.Action = csv;   // BE field chuẩn (project activities repo support csv)
    params.Actions = csv;  // backward-compat
  }

  const f = toDateOnly(from);
  const t = toDateOnly(to);
  if (f) params.From = f;
  if (t) params.To = t;

  try {
    const res = await axiosInstance.get(PROJECT_ACTIVITIES_ENDPOINT(projectId), { params, ...axiosConfig });
    return normalizePaged(res?.data, { pageNumber, pageSize });
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error fetching activity logs");
  }
}

/** =========================
 * 2) PROJECT ACTIVITY BY ID
 * GET /api/projects/{projectId}/activities/{id}
 * ========================= */
export async function getProjectActivityById(projectId, id, axiosConfig = {}) {
  try {
    const res = await axiosInstance.get(PROJECT_ACTIVITY_BY_ID_ENDPOINT(projectId, id), axiosConfig);
    return normalizeOne(res?.data);
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error fetching activity by id");
  }
}

/** =========================
 * 3) TASK LOGS (NEW) - LOG RIÊNG 1 TASK
 * GET /api/tasklogevents?taskId=...&PageNumber=...&PageSize=...
 * ========================= */
/**
 * opts:
 * - pageNumber, pageSize
 * - keyword
 * - action (string)  (BE task log repo hiện đang filter 1 action)
 * - actions (array)  (nếu bạn đã update BE hỗ trợ csv giống project activities thì dùng được)
 * - actorId
 * - from/to (Date|string)
 * - sortColumn, sortDescending
 */
export async function getTaskLogEvents(taskId, opts = {}, axiosConfig = {}) {
  const {
    pageNumber = 1,
    pageSize = 20,
    keyword = "",
    action = "",
    actions = [],
    actorId,
    from,
    to,
    sortColumn = "CreatedAt",
    sortDescending = true,
  } = opts;

  const params = {
    taskId, // controller của bạn nhận FromQuery taskId
    PageNumber: pageNumber,
    PageSize: pageSize,
    SortColumn: sortColumn,
    SortDescending: sortDescending,
  };

  if (keyword) params.Keyword = keyword;
  if (actorId) params.ActorId = actorId;

  // NOTE: BE TaskLogEventRepository.GetPagedByTaskIdAsync hiện filter Action dạng = act (không csv).
  // -> ưu tiên "action" đơn. Nếu bạn đã sửa BE hỗ trợ csv thì có thể truyền actions array.
  if (action) {
    params.Action = action;
  } else if (Array.isArray(actions) && actions.length) {
    const csv = actions.filter(Boolean).join(",");
    params.Action = csv; // sẽ chỉ work nếu BE đã hỗ trợ csv cho task logs
  }

  const f = toDateOnly(from);
  const t = toDateOnly(to);
  if (f) params.From = f;
  if (t) params.To = t;

  try {
    const res = await axiosInstance.get(TASK_LOGS_ENDPOINT, { params, ...axiosConfig });
    return normalizePaged(res?.data, { pageNumber, pageSize });
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error fetching task logs");
  }
}

/** =========================
 * 4) TASK LOG BY ID
 * GET /api/tasklogevents/{id}
 * ========================= */
export async function getTaskLogEventById(id, axiosConfig = {}) {
  try {
    const res = await axiosInstance.get(TASK_LOG_BY_ID_ENDPOINT(id), axiosConfig);
    return normalizeOne(res?.data);
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error fetching task log by id");
  }
}

/** =========================
 * 5) UPDATE VISIBILITY FOR A TASK LOG SET
 * PUT /api/tasklogevents/update_isView?taskId=...&isView=true
 * ========================= */
export async function updateTaskLogsIsView(taskId, isView, axiosConfig = {}) {
  try {
    const params = { taskId, isView: !!isView };
    const res = await axiosInstance.put(TASK_LOG_UPDATE_ISVIEW_ENDPOINT, null, { params, ...axiosConfig });
    return normalizeOne(res?.data); // bool
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error updating log visibility");
  }
}
