// src/services/permissionService.js
import { axiosInstance } from "../apiConfig";

/** Lấy các role của user trong 1 company */
export const getMemberRoles = async (companyId, userId) => {
  try {
    const response = await axiosInstance.get(
      `/companies/${companyId}/members/${userId}/roles`
    );
    // [{ roleId, name, description }]
    return response.data?.data ?? [];
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Lấy chi tiết 1 role (kèm permissions) */
export const getRoleDetail = async (companyId, roleId) => {
  try {
    const response = await axiosInstance.get(
      `/companies/${companyId}/roles/${Number(roleId)}`
    );
    // { id, name, description, permissions: [{ functionId, functionCode, functionName, isAccess }] }
    return response.data?.data ?? null;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};

/** Hợp nhất quyền hiệu lực của user trong company (gộp từ các role) */
export const getEffectivePermissions = async (companyId, userId) => {
  try {
    const roles = await getMemberRoles(companyId, userId);
    const details = await Promise.all(
      roles.map((r) => getRoleDetail(companyId, Number(r.roleId)))
    );

    const codes = new Set(); // functionCode
    const ids = new Set();   // functionId
    const byRole = new Map(); // roleId -> { name, codes[] }

    details.forEach((d) => {
      if (!d) return;
      const granted = (d.permissions ?? []).filter((p) => p?.isAccess === true);
      const roleCodes = [];
      granted.forEach((p) => {
        if (p?.functionCode) {
          codes.add(String(p.functionCode));
          roleCodes.push(String(p.functionCode));
        }
        if (p?.functionId != null) ids.add(Number(p.functionId));
      });
      byRole.set(Number(d.id), { name: d.name ?? "", codes: roleCodes });
    });

    return { codes, ids, roles, byRole };
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error!");
  }
};
