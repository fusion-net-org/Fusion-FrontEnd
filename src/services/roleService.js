// src/services/roleService.js
import { axiosInstance } from "../apiConfig";

/** Lấy danh sách role của 1 company (đã chuẩn hoá {id,name,description}) */
export const getRoles = async (companyId) => {
  try {
    const response = await axiosInstance.get(`/companies/${companyId}/roles`);
    const list = response.data?.data ?? response.data ?? [];
    return (Array.isArray(list) ? list : []).map(r => ({
      id: Number(r.id),
      name: r.name ?? r.roleName ?? `Role#${r.id}`,
      description: r.description ?? null,
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Alias (giữ tương thích nếu nơi khác gọi listRoles) */
export const listRoles = getRoles;

/** Lấy chi tiết 1 role */
export const getRole = async (companyId, roleId) => {
  try {
    const response = await axiosInstance.get(`/companies/${companyId}/roles/${Number(roleId)}`);
    return response.data?.data ?? response.data ?? null; // { id, name, description, ... }
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Tạo role mới */
export const createRole = async (companyId, payload /* { name, description?: string|null } */) => {
  try {
    const response = await axiosInstance.post(`/companies/${companyId}/roles`, payload);
    return response.data?.data ?? response.data; // role mới
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Cập nhật role (đổi tên/mô tả) */
export const updateRole = async (companyId, roleId, payload /* { name, description?: string|null } */) => {
  try {
    const response = await axiosInstance.post(`/companies/${companyId}/roles/${Number(roleId)}`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Xoá role */
export const deleteRole = async (companyId, roleId) => {
  try {
    await axiosInstance.delete(`/companies/${companyId}/roles/${Number(roleId)}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Lấy danh sách function (metadata) để render UI */
export const getFunctions = async (companyId) => {
  try {
    const response = await axiosInstance.get(`/companies/${companyId}/functions`);
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/**
 * Lấy các permission TRUE của 1 role → trả mảng functionId:number[]
 * (Giữ nguyên “hành vi cũ” để không phải sửa call-site)
 */
export const getRolePermissionIds = async (companyId, roleId) => {
  try {
    const response = await axiosInstance.get(`/companies/${companyId}/roles/${Number(roleId)}`);
    const d = response.data?.data ?? response.data;
    if (!d) return [];
    if (Array.isArray(d)) return d.map(Number); // trường hợp API trả thẳng [ids]
    if (Array.isArray(d.permissions)) return d.permissions.map(p => Number(p.functionId));
    return [];
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Ghi lại permissions (replace set) cho role */
export const saveRolePermissions = async (companyId, roleId, functionIds /* number[] */) => {
  // đảm bảo các phần tử là số
    const payload = { functionIdsToGrant: Array.isArray(functionIds) ? functionIds : [] };

  const res = await axiosInstance.put(
    `/companies/${companyId}/roles/${Number(roleId)}/permissions`,
    payload, // <-- sẽ serialize thành JSON array: [1,2,3]
    { headers: { "Content-Type": "application/json" } }
  );

  const d = res.data;
  return d?.succeeded === true || !!d;
};
