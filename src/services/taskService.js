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

export const putReorderTask = async (projectId, sprintId, { taskId, toStatusId, toIndex }, { flashColorHex } = {}) => {
  try {
    const res = await axiosInstance.put(`/projects/${projectId}/sprints/${sprintId}/tasks/reorder`, {
      taskId, toStatusId, toIndex,
    });
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
