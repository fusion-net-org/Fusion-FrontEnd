// src/services/workflowService.js
import { axiosInstance } from '../apiConfig';

const url = {
  list: (companyId) => `/companies/${companyId}/workflows`,
  create: (companyId) => `/companies/${companyId}/workflows`,
  remove: (companyId, workflowId) => `/companies/${companyId}/workflows/${workflowId}`,
  designerGet: (workflowId) => `/workflows/${workflowId}/designer`,
  designerPut: (companyId, workflowId) => `/workflows/${workflowId}/designer?companyId=${encodeURIComponent(companyId)}`,
    designerPost: (companyId) => `/companies/${companyId}/workflows/designer`, // NEW
  previews: (companyId) => `/companies/${companyId}/workflows/previews`,

};

const getErr = (error, fallback = 'Fail!') =>
  error?.response?.data?.message || error?.message || fallback;

/** Danh sách workflow của 1 công ty */
export const getWorkflows = async (companyId) => {
  try {
    const res = await axiosInstance.get(url.list(companyId));
   
    return res.data;
  } catch (error) {
    throw new Error(getErr(error, 'Cannot load workflows'));
  }
};

export const getWorkflowPreviews = async (companyId) => {
  try {
    const res = await axiosInstance.get(url.previews(companyId));
    return res.data?.data ?? res.data; // List<WorkflowPreviewVm>
  } catch (error) {
    throw new Error(getErr(error, 'Cannot load workflow previews'));
  }
};
/** Tạo workflow mới: trả về { id, ... } (tuỳ BE) */
export const postWorkflow = async (companyId, name) => {
  try {
    const res = await axiosInstance.post(
      url.create(companyId),
      { name },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data; // ví dụ: { id: "..." }
  } catch (error) {
    throw new Error(getErr(error, 'Cannot create workflow'));
  }
};

/** Xoá workflow */
export const deleteWorkflow = async (companyId, workflowId) => {
  try {
    await axiosInstance.delete(url.remove(companyId, workflowId));
    return true;
  } catch (error) {
    throw new Error(getErr(error, 'Cannot delete workflow'));
  }
};
// src/services/workflowService.js
export const postWorkflowWithDesigner = async (companyId, payload) => {
  try {
    const res = await axiosInstance.post(
      url.designerPost(companyId),
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErr(error, 'Cannot create workflow (designer)'));
  }
};


/** Lấy dữ liệu designer (statuses + transitions) */
export const getWorkflowDesigner = async (workflowId) => {
  try {
    const res = await axiosInstance.get(url.designerGet(workflowId));
    console.log(res.data)
    return res.data.data; // DesignerDto
  } catch (error) {
    throw new Error(getErr(error, 'Cannot load workflow designer'));
  }
};

/** Lưu designer */
export const putWorkflowDesigner = async (companyId, workflowId, payload) => {
  try {
    await axiosInstance.put(
      url.designerPut(companyId, workflowId),
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return true;
  } catch (error) {
    throw new Error(getErr(error, 'Cannot save workflow designer'));
  }
};

export default {
    getWorkflowPreviews,
  getWorkflows,
  postWorkflow,
  deleteWorkflow,
  getWorkflowDesigner,
  putWorkflowDesigner,
};
