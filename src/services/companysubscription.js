
import { axiosInstance } from "@/apiConfig";

function extractApiError(err) {
  // trả về message thân thiện từ ResponseModel hoặc ModelState
  const res = err?.response;
  if (!res) return err?.message || "Request failed";
  const data = res.data;
  // chuẩn ResponseModel<T>
  if (data?.message && typeof data.message === "string") return data.message;
  // ASP.NET ModelState
  const modelState = data?.errors || data?.ErrorData || data?.errorData;
  if (modelState) {
    if (typeof modelState === "string") return modelState;
    if (typeof modelState === "object") {
      const lines = [];
      Object.keys(modelState).forEach(k => {
        const arr = modelState[k];
        if (Array.isArray(arr)) arr.forEach(v => lines.push(`${k}: ${v}`));
        else if (arr) lines.push(`${k}: ${arr}`);
      });
      if (lines.length) return lines.join("\n");
    }
  }
  return `HTTP ${res.status} ${res.statusText}`;
}

export async function createCompanySubscription(body) {
  try {
    if (!body?.companyId) throw new Error("Missing companyId");
    if (!body?.userSubscriptionId) throw new Error("Missing userSubscriptionId");
    const list = body?.entitlements ?? [];
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Entitlements are required");
    }
    const res = await axiosInstance.post("/CompanySubscription", body);
    return res?.data?.data;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export async function getCompanySubscriptionsByCompany(companyId, q = {}) {
  const params = {
    status: q.status || undefined,
    Keyword: q.Keyword || undefined,
    PageNumber: q.PageNumber ?? 1,
    PageSize: q.PageSize ?? 10,
    SortColumn: q.SortColumn || undefined,
    SortDescending: q.SortDescending ?? undefined,
  };
  const { data } = await axiosInstance.get(`/CompanySubscription/company/${companyId}`, { params });
  return data?.data ?? data ?? {};
}

export async function getCompanySubscriptionById(id) {
  const { data } = await axiosInstance.get(`/CompanySubscription/${id}`);
  // ResponseModel<CompanySubscriptionDetailResponse>
  return data?.data ?? data ?? null;
}

export async function updateCompanySubscription(request) {
  // Điều chỉnh URL nếu controller của bạn khác (vd: /CompanySubscription/Update)
  const { data } = await axiosInstance.put(`/companysubscription`, request);
  return data?.data ?? data;
}