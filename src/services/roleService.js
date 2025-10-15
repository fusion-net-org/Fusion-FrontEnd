import { axiosInstance } from '../apiConfig';

// Lấy danh sách role của 1 company
export async function getRoles(companyId) {
  const res = await axiosInstance.get(`/companies/${companyId}/roles`);
  // API wrapper của bạn trả { succeeded, data, ... }
  return res.data?.data ?? [];
}

// Lấy danh sách function (metadata tĩnh để render UI)
export async function getFunctions(companyId) {
  try {
    const res = await axiosInstance.get(`/companies/${companyId}/functions`);
    return res.data?.data ?? [];
  } catch {
    // Fallback JSON local khi API chưa có / lỗi mạng
    // -> bạn có thể chỉnh sửa file này để "hiển thị sẵn" các trang
    const fallback = await import('../static/functions.json');
    return fallback.default;
  }
}

// Lấy các permission TRUE của 1 role (trả về mảng functionId)
export async function getRolePermissionIds(companyId, roleId) {
  // Ưu tiên endpoint chuyên trả functionId[], nếu chưa có thì dùng /roles/{id}
  const res = await axiosInstance.get(`/companies/${companyId}/roles/${roleId}`);
  const data = res.data?.data;
  if (!data) return [];
  // Nếu API trả RoleDetailVm có permissions là object => map ra functionId
  if (Array.isArray(data)) return data; // trường hợp API đã trả thẳng [ids]
  if (Array.isArray(data.permissions)) {
    return data.permissions.map(p => p.functionId);
  }
  return [];
}

// Ghi lại permissions: replace set
export async function saveRolePermissions(companyId, roleId, functionIds) {
  const res = await axiosInstance.put(
    `/companies/${companyId}/roles/${roleId}/permissions`,
    functionIds
  );
  return res.data?.succeeded === true;
}
