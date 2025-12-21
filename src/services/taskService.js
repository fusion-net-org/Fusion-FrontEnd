import { axiosInstance } from '../apiConfig';
import { flashTaskCard, hexToRgba } from '@/utils/flash';

export const getAllTask = async ({
  pageNumber = 1,
  pageSize = 10,
  sortColumn = 'title',
  sortDescending = false,
  search = '',
  type = [],
  priority = [],
  status = [],
  dueDateFrom = '',
  dueDateTo = '',
  pointMin,
  pointMax,
} = {}) => {
  try {
    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
      SortColumn: sortColumn,
      SortDescending: sortDescending,
    };

    // Thêm các filter nếu có
    if (search) params.Search = search;
    if (Array.isArray(type) && type.length > 0) params.Type = type.join(',');
    if (Array.isArray(priority) && priority.length > 0) params.Priority = priority.join(',');
    if (Array.isArray(status) && status.length > 0) params.Status = status.join(',');
    if (dueDateFrom) params.DueDateFrom = dueDateFrom;
    if (dueDateTo) params.DueDateTo = dueDateTo;
    if (pointMin !== undefined) params.PointMin = pointMin;
    if (pointMax !== undefined) params.PointMax = pointMax;

    const response = await axiosInstance.get('/tasks', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching tasks');
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await axiosInstance.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const postTask = async (data) => {
  try {
    const payload = {
      //projectId: '6909CE3D-38DF-4C71-919E-82300C9984A3',
      //sprintId: 'EF92CB06-5C70-41C4-AAFA-DB00FE7E9313',
      projectId: '',
      sprintId: '',
      ...data,
    };
    const response = await axiosInstance.post('/tasks', payload);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
export const createProjectTask = async (data) => {
  try {
    const payload = {
      //projectId: '6909CE3D-38DF-4C71-919E-82300C9984A3',
      //sprintId: 'EF92CB06-5C70-41C4-AAFA-DB00FE7E9313',
      projectId: '',
      sprintId: '',
      ...data,
    };
    const response = await axiosInstance.post('/tasks', payload);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
export const putTask = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await axiosInstance.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
export const patchTaskStatusById = async (taskId, statusId, { flashColorHex } = {}) => {
  try {
    const res = await axiosInstance.patch(`/tasks/${taskId}/status-id`, { statusId });
    // ResponseModel => lấy data
    const dto = res?.data?.data ?? res?.data;
    // Flash tại DOM card
    flashTaskCard(taskId, { colorHex: flashColorHex });
    return dto;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Change status failed');
  }
};

export const putReorderTask = async (
  projectId,
  sprintId,
  { taskId, toStatusId, toIndex },
  { flashColorHex } = {},
) => {
  try {
    const res = await axiosInstance.put(
      `/projects/${projectId}/sprints/${sprintId}/tasks/reorder`,
      {
        taskId,
        toStatusId,
        toIndex,
      },
    );
    const dto = res?.data?.data ?? res?.data;
    flashTaskCard(taskId, { colorHex: flashColorHex });
    return dto;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Reorder failed');
  }
};

export const postMoveTask = async (taskId, toSprintId, { flashColorHex } = {}) => {
  try {
    const res = await axiosInstance.post(`/tasks/${taskId}/move`, { toSprintId });
    const dto = res?.data?.data ?? res?.data;
    flashTaskCard(taskId, { colorHex: flashColorHex });
    return dto;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Move to sprint failed');
  }
};

export const postTaskMarkDone = async (taskId, { flashColorHex } = {}) => {
  try {
    const res = await axiosInstance.post(`/tasks/${taskId}/mark-done`);
    const dto = res?.data?.data ?? res?.data;
    flashTaskCard(taskId, { colorHex: flashColorHex });
    return dto;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Mark done failed');
  }
};

export const postTaskSplit = async (taskId, { flashColorHexA, flashColorHexB } = {}) => {
  try {
    const res = await axiosInstance.post(`/tasks/${taskId}/split`);
    const dto = res?.data?.data ?? res?.data; // { partA, partB }
    // Flash cho cả A (update) và B (new)
    if (dto?.partA?.id) flashTaskCard(dto.partA.id, { colorHex: flashColorHexA });
    if (dto?.partB?.id) flashTaskCard(dto.partB.id, { colorHex: flashColorHexB ?? flashColorHexA });
    return dto;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Split failed');
  }
};
export const createTaskQuick = async (
  projectId,
  {
    title,
    sprintId = null,
    type = 'Feature',
    priority = 'Medium',
    severity = null,
    storyPoints = null, // map -> point
    estimateHours = null,
    dueDate = null, // ISO string hoặc null
    workflowStatusId = null, // ưu tiên id
    statusCode = null, // fallback nếu chỉ có code
    parentTaskId = null,
    sourceTaskId = null,
    assigneeIds = null, // optional: array<Guid>
  } = {},
) => {
  try {
    const payload = {
      projectId,
      sprintId,
      title: title?.trim() || '',
      type,
      priority,
      severity,
      point: storyPoints,
      estimateHours,
      dueDate,
      workflowStatusId,
      statusCode,
      parentTaskId,
      sourceTaskId,
      ...(Array.isArray(assigneeIds) && assigneeIds.length ? { assigneeIds } : {}),
    };

    const res = await axiosInstance.post('/tasks', payload);
    // BE trả ResponseModel => lấy thẳng data bên trong
    return res?.data?.data ?? res?.data;
  } catch (error) {
    const message = error?.response?.data?.message || 'Create task failed';
    throw new Error(message);
  }
};

export const GetTaskBySprintId = async (
  sprintId,
  Title = '',
  Status = '',
  Priority = '',
  CreatedFrom = '',
  CreatedTo = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/sprints/${sprintId}/tasks`, {
      params: {
        Title,
        Status,
        Priority,
        CreatedFrom,
        CreatedTo,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in GetTaskBySprintId:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};
/* =========================
 * CHECKLIST APIs
 * ========================= */

export const getTaskChecklist = async (taskId) => {
  try {
    const res = await axiosInstance.get(`/tasks/${taskId}/checklist`);
    // BE trả ResponseModel<List<...>> => data.data
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in getTaskChecklist:', error);
    throw new Error(error?.response?.data?.message || 'Error fetching checklist items');
  }
};

export const createTaskChecklistItem = async (taskId, label) => {
  try {
    const payload = { label };
    const res = await axiosInstance.post(`/tasks/${taskId}/checklist`, payload);
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in createTaskChecklistItem:', error);
    throw new Error(error?.response?.data?.message || 'Error creating checklist item');
  }
};

export const updateTaskChecklistItem = async (taskId, { id, label, done, orderIndex }) => {
  try {
    const payload = {
      label,
      isDone: done,
      orderIndex,
    };
    const res = await axiosInstance.put(`/tasks/${taskId}/checklist/${id}`, payload);
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in updateTaskChecklistItem:', error);
    throw new Error(error?.response?.data?.message || 'Error updating checklist item');
  }
};

export const toggleTaskChecklistItemDone = async (taskId, checklistId, isDone) => {
  try {
    const payload = typeof isDone === 'boolean' ? { isDone } : {}; // null => toggle server-side

    const res = await axiosInstance.patch(
      `/tasks/${taskId}/checklist/${checklistId}/done`,
      payload,
    );
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in toggleTaskChecklistItemDone:', error);
    throw new Error(error?.response?.data?.message || 'Error toggling checklist item');
  }
};

export const deleteTaskChecklistItem = async (taskId, checklistId) => {
  try {
    const res = await axiosInstance.delete(`/tasks/${taskId}/checklist/${checklistId}`);
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in deleteTaskChecklistItem:', error);
    throw new Error(error?.response?.data?.message || 'Error deleting checklist item');
  }
};
/* =========================
 * ATTACHMENT APIs
 * ========================= */

export const getTaskAttachments = async (taskId) => {
  try {
    const res = await axiosInstance.get(`/tasks/${taskId}/attachments`);
    const payload = res?.data?.data ?? res?.data ?? [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.attachments)) return payload.attachments;
    return [];
  } catch (error) {
    console.error('Error in getTaskAttachments:', error);
    throw new Error(error.response?.data?.message || 'Error fetching attachments');
  }
};

export const uploadTaskAttachments = async (taskId, files, description) => {
  try {
    const formData = new FormData();
    Array.from(files).forEach((f) => {
      if (f) formData.append('files', f); // trùng với TaskAttachmentUploadRequest.Files
    });
    if (description) formData.append('description', description);

    const res = await axiosInstance.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in uploadTaskAttachments:', error);
    throw new Error(error.response?.data?.message || 'Error uploading attachments');
  }
};

export const deleteTaskAttachment = async (taskId, attachmentId) => {
  try {
    const res = await axiosInstance.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in deleteTaskAttachment:', error);
    throw new Error(error.response?.data?.message || 'Error deleting attachment');
  }
};
/** POST /api/tasks/{taskId}/comments  (body + files) */

export async function createTaskComment(taskId, body, files) {
  try {
    const form = new FormData();

    if (body && body.trim().length > 0) {
      form.append('body', body.trim());
    }

    if (files && files.length) {
      const arr = Array.from(files);
      for (const f of arr) {
        if (f) {
          // tên "files" phải trùng với [FromForm] List<IFormFile> files
          form.append('files', f);
        }
      }
    }

    const { data } = await axiosInstance.post(`/tasks/${taskId}/comments`, form, {
      // *** QUAN TRỌNG: ép gửi multipart/form-data ***
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // response chuẩn của BE: { succeeded, message, data }
    return data?.data ?? data;
  } catch (error) {
    console.error('[TaskDetail] create comment failed', error);
    throw new Error(error.response?.data?.message || 'Error creating comment!');
  }
}

/** GET /api/tasks/{taskId}/comments */
export async function getTaskComments(taskId) {
  try {
    const res = await axiosInstance.get(`/tasks/${taskId}/comments`);
    const data = res?.data?.data ?? res?.data ?? [];
    // luôn trả về array cho FE
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.comments)) return data.comments;
    return [];
  } catch (error) {
    console.error('Error in getTaskComments:', error);
    throw new Error(error?.response?.data?.message || 'Error fetching comments');
  }
}
export const getMyTasks = async ({
  pageNumber = 1,
  pageSize = 200,
  sortColumn = 'DueDate',
  sortDescending = false,
  search = '',
  type = [],
  priority = [],
  status = [],
  dueDateFrom = '',
  dueDateTo = '',
  pointMin,
  pointMax,
} = {}) => {
  try {
    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
      SortColumn: sortColumn,
      SortDescending: sortDescending,
    };

    if (search) params.Search = search;
    if (Array.isArray(type) && type.length > 0) params.Type = type.join(',');
    if (Array.isArray(priority) && priority.length > 0) params.Priority = priority.join(',');
    if (Array.isArray(status) && status.length > 0) params.Status = status.join(',');
    if (dueDateFrom) params.DueDateFrom = dueDateFrom;
    if (dueDateTo) params.DueDateTo = dueDateTo;
    if (pointMin !== undefined) params.PointMin = pointMin;
    if (pointMax !== undefined) params.PointMax = pointMax;

    // Controller: [HttpGet("tasks/user")]
    const response = await axiosInstance.get('/tasks/user', { params });
    return response.data; // ResponseModel<PagedResult<TaskResponse>>
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Error fetching my tasks');
  }
};
/* =========================
 * DRAFT TASK APIs (BACKLOG / QUICK POOL)
 * ========================= */

/**
 * GET /api/projects/{projectId}/draft-tasks
 * Lấy danh sách task backlog (IsBacklog = true, chưa gán sprint).
 * Dùng cho QuickDraftPool hoặc màn Backlog riêng.
 */
export const getDraftTasks = async (
  projectId,
  {
    pageNumber = 1,
    pageSize = 50,
    sortColumn = 'CreatedAt',
    sortDescending = true,
    search = '',
    type = [],
    priority = [],
    createdFrom = '',
    createdTo = '',
  } = {},
) => {
  try {
    if (!projectId) {
      throw new Error('projectId is required to load draft tasks');
    }

    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
      SortColumn: sortColumn,
      SortDescending: sortDescending,
    };

    if (search) params.Search = search;
    if (Array.isArray(type) && type.length > 0) params.Type = type.join(',');
    if (Array.isArray(priority) && priority.length > 0) params.Priority = priority.join(',');
    if (createdFrom) params.CreatedFrom = createdFrom;
    if (createdTo) params.CreatedTo = createdTo;

    // BE: [HttpGet("projects/{projectId}/draft-tasks")]
    const res = await axiosInstance.get(`/projects/${projectId}/draft-tasks`, { params });

    return res?.data?.data ?? res?.data;
  } catch (error) {
    // cho log dễ debug
    console.error('Error in getDraftTasks:', error);
    throw new Error(error?.response?.data?.message || 'Error fetching draft tasks');
  }
};

/**
 * POST /api/projects/{projectId}/draft-tasks
 * Tạo 1 draft task (backlog, IsBacklog = true, chưa gán sprint).
 * Dùng cho QuickDraftPool: chỉ cần title, type, priority, estimateHours.
 */
export const createDraftTask = async (
  projectId,
  {
    title,
    type = 'Feature',
    priority = 'Medium',
    severity = null,
    estimateHours = null,
    dueDate = null,
    parentTaskId = null,
    sourceTaskId = null,
  } = {},
) => {
  try {
    if (!projectId) {
      throw new Error('projectId is required to create draft task');
    }

    const payload = {
      projectId,
      sprintId: null, // bắt buộc null để BE set IsBacklog = true
      title: title?.trim() || '',
      type,
      priority,
      severity,
      estimateHours,
      dueDate,
      parentTaskId,
      sourceTaskId,
      // BE có thể tự set IsBacklog = true nếu sprintId == null
      // nếu BE cho phép thì gửi luôn:
      // isBacklog: true,
    };

    const res = await axiosInstance.post(`/projects/${projectId}/draft-tasks`, payload);

    // response: ResponseModel<ProjectTaskResponse>
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in createDraftTask:', error);
    throw new Error(error?.response?.data?.message || 'Error creating draft task');
  }
};

/**
 * PUT /api/draft-tasks/{id}
 * Cập nhật nội dung draft (đổi title, priority, estimateHours, ...),
 * vẫn giữ trạng thái backlog (IsBacklog = true).
 */
export const updateDraftTask = async (
  draftTaskId,
  { title, type, priority, severity, estimateHours, dueDate, parentTaskId, sourceTaskId } = {},
) => {
  try {
    if (!draftTaskId) {
      throw new Error('draftTaskId is required to update draft task');
    }

    const payload = {
      // BE tái dùng ProjectTaskRequest nên gửi đúng field, cái nào không đổi có thể bỏ
      title,
      type,
      priority,
      severity,
      estimateHours,
      dueDate,
      parentTaskId,
      sourceTaskId,
      // luôn giữ backlog – không gán sprint
      sprintId: null,
      // isBacklog: true,
    };

    const res = await axiosInstance.put(`/draft-tasks/${draftTaskId}`, payload);

    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in updateDraftTask:', error);
    throw new Error(error?.response?.data?.message || 'Error updating draft task');
  }
};

/**
 * DELETE /api/draft-tasks/{id}
 * Xoá hẳn draft khỏi backlog (không phải soft delete task thật).
 */
export const deleteDraftTaskApi = async (draftTaskId) => {
  try {
    if (!draftTaskId) {
      throw new Error('draftTaskId is required to delete draft task');
    }

    const res = await axiosInstance.delete(`/draft-tasks/${draftTaskId}`);

    // ResponseModel<bool>
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in deleteDraftTaskApi:', error);
    throw new Error(error?.response?.data?.message || 'Error deleting draft task');
  }
};

/**
 * POST /api/draft-tasks/{id}/materialize
 * Convert 1 draft (backlog) thành task thật trong sprint:
 *  - Gán SprintId
 *  - Gán WorkflowStatusId (hoặc StatusCode)
 *  - Set IsBacklog = false, OrderInSprint phù hợp
 *
 * Dùng trong onDropDraftToSprint: khi kéo từ QuickDraftPool vào sprint.
 */
export const materializeDraftTask = async (
  draftTaskId,
  {
    sprintId,
    workflowStatusId = null,
    statusCode = null,
    orderInSprint = null,
    assigneeIds = null,
  } = {},
) => {
  try {
    if (!draftTaskId) {
      throw new Error('draftTaskId is required to materialize draft task');
    }
    if (!sprintId) {
      throw new Error('sprintId is required to materialize draft task');
    }

    const payload = {
      sprintId,
      workflowStatusId,
      statusCode,
      orderInSprint,
      ...(Array.isArray(assigneeIds) && assigneeIds.length ? { assigneeIds } : {}),
    };

    const res = await axiosInstance.post(`/draft-tasks/${draftTaskId}/materialize`, payload);

    // ResponseModel<ProjectTaskResponse> – trả về task thật đã được gán sprint
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in materializeDraftTask:', error);
    throw new Error(error?.response?.data?.message || 'Error converting draft to real task');
  }
};
export const getTicketTasks = async (
  ticketId,
  { pageNumber = 1, pageSize = 50, sortColumn = 'CreateAt', sortDescending = false } = {},
) => {
  try {
    if (!ticketId) {
      throw new Error('ticketId is required to load ticket tasks');
    }

    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
      SortColumn: sortColumn,
      SortDescending: sortDescending,
    };

    const res = await axiosInstance.get(`/tickets/${ticketId}/tasks`, {
      params,
    });

    // ResponseModel<PagedResult<ProjectTaskResponse>>
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in getTicketTasks:', error);
    throw new Error(error?.response?.data?.message || 'Error fetching ticket tasks');
  }
};

/**
 * POST /api/tickets/{ticketId}/tasks
 * Tạo 1 task backlog cho ticket:
 *  - projectId = project của ticket
 *  - sprintId = null  (backlog)
 *  - IsBacklog = true (BE xử lý)
 */
export const createTicketTask = async (
  ticketId,
  {
    projectId,
    title,
    type = 'Feature',
    priority = 'Medium',
    severity = null,
    estimateHours = null,
    dueDate = null,
  } = {},
) => {
  try {
    if (!ticketId) {
      throw new Error('ticketId is required to create ticket task');
    }

    const payload = {
      projectId, // BE có thể tự lấy từ ticket, nhưng cho vào cho chắc
      sprintId: null, // backlog
      title: title?.trim() || '',
      type,
      priority,
      severity,
      estimateHours,
      dueDate,
    };

    const res = await axiosInstance.post(`/tickets/${ticketId}/tasks`, payload);

    // ResponseModel<ProjectTaskResponse>
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('Error in createTicketTask:', error);
    throw new Error(error?.response?.data?.message || 'Error creating ticket task');
  }
};

export const getTaskDetailByIdAdmin = async (id) => {
  try {
    const response = await axiosInstance.get(`/tasks/admin/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
