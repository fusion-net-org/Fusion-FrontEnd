// src/services/companyMemberService.js
import { axiosInstance } from "@/apiConfig";


export async function getCompanyMembersPaged(companyId, params = {}) {
  const { data } = await axiosInstance.get(
    `/companymember/paged/${companyId}`,
    { params }
  );

  const payload = data?.data ?? data ?? {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  // chuẩn hoá một chút cho FE
  const mapped = items.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    companyName: r.companyName,
    memberId: r.memberId,
    memberName: r.memberName || r.email || "Unknown",
    memberAvatar: r.memberAvatar || null,
    email: r.email || "",
    phone: r.phone || r.memberPhoneNumber || "",
    gender: r.gender || "",
    roleName: r.roleName || "",
    status: r.status || (r.isDeleted ? "Inactive" : "Active"),
    joinedAt: r.joinedAt,
  }));

  return {
    items: mapped,
    totalCount: payload.totalCount ?? 0,
    pageNumber: payload.pageNumber ?? 1,
    pageSize: payload.pageSize ?? 10,
  };
}

export async function getCompanyMemberOptions(companyId, params = {}) {
  const res = await getCompanyMembersPaged(companyId, params);
  return res.items.map((m) => ({
    id: String(m.memberId),
    label: m.memberName,
    sub: m.roleName || m.email || "",
  }));
}
