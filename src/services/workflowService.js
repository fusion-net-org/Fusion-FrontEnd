import { axiosInstance } from '../apiConfig';

/**
 * ---- Types (JSDoc) ----------------------------------------------------------
 * @typedef {{ id:string, name:string }} WorkflowVm
 * @typedef {'success'|'failure'|'optional'} TransitionType
 * @typedef {{
 *   id?: number,
 *   fromStatusId: string,
 *   toStatusId: string,
 *   type: TransitionType,
 *   label?: string,
 *   rule?: string,
 *   roleNames?: string[]
 * }} TransitionVm
 * @typedef {{
 *   id: string, name: string, isStart: boolean, isEnd: boolean,
 *   x: number, y: number, roles: string[], color?: string
 * }} StatusVm
 * @typedef {{
 *   workflow: WorkflowVm,
 *   statuses: StatusVm[],
 *   transitions: TransitionVm[]
 * }} DesignerDto
 * -----------------------------------------------------------------------------
 */

const base = (companyId) => `/companies/${companyId}/workflows`;

// unwrap ResponseModel { data, message } hoặc trả thẳng nếu không bọc
const unwrap = (res) => (res?.data?.data ?? res?.data);

const toErr = (error, fallback) =>
  new Error(error?.response?.data?.message || fallback);

/** Lấy danh sách workflow của company */
export const getWorkflows = async (companyId) => {
  try {
    const res = await axiosInstance.get(base(companyId));
    return unwrap(res); // WorkflowVm[]
  } catch (error) {
    throw toErr(error, 'Get workflows failed!');
  }
};

/** Tạo workflow mới, trả về id (hoặc object tuỳ backend) */
export const postWorkflow = async (companyId, name) => {
  try {
    const res = await axiosInstance.post(base(companyId), { name });
    return unwrap(res); // string | { id:string, ... }
  } catch (error) {
    throw toErr(error, 'Create workflow failed!');
  }
};

/** Xoá workflow */
export const deleteWorkflow = async (companyId, workflowId) => {
  try {
    await axiosInstance.delete(`${base(companyId)}/${workflowId}`);
    return true;
  } catch (error) {
    throw toErr(error, 'Delete workflow failed!');
  }
};

/** Lấy dữ liệu Designer (statuses + transitions) */
export const getWorkflowDesigner = async (companyId, workflowId) => {
  try {
    const res = await axiosInstance.get(
      `${base(companyId)}/${workflowId}/designer`
    );
    return unwrap(res); // DesignerDto
  } catch (error) {
    throw toErr(error, 'Get designer failed!');
  }
};

/** Lưu Designer */
export const putWorkflowDesigner = async (companyId, workflowId, payload /*: DesignerDto */) => {
  try {
    const res = await axiosInstance.put(
      `${base(companyId)}/${workflowId}/designer`,
      payload
    );
    return unwrap(res); // void | anything backend returns
  } catch (error) {
    throw toErr(error, 'Save designer failed!');
  }
};
