// src/services/companySubscriptionService.js
import { axiosInstance } from "@/apiConfig";

const unwrap = (res) => res?.data?.data ?? res?.data;
const onError = (e) => {
  const msg = e?.response?.data?.message || e?.message || "Unexpected error";
  throw new Error(msg);
};

/**
 * POST /CompanySubscription
 * Body: CompanySubscriptionCreateRequest
 * Res: ResponseModel<CompanySubscriptionDetailResponse>
 */
export async function createCompanySubscription(payload) {
  try {
    const res = await axiosInstance.post("/CompanySubscription", payload);
    return unwrap(res) ?? null;
  } catch (e) {
    onError(e);
    return null;
  }
}

/**
 * GET /CompanySubscription/{id}
 * Res: ResponseModel<CompanySubscriptionDetailResponse>
 */
export async function getCompanySubscriptionDetail(id) {
  if (!id) throw new Error("companySubscriptionId is required");
  try {
    const res = await axiosInstance.get(`/CompanySubscription/${id}`);
    return unwrap(res) ?? null;
  } catch (e) {
    onError(e);
    return null;
  }
}

/**
 * GET /CompanySubscription/company/{companyId}
 * Res: ResponseModel<PagedResult<CompanySubscriptionListResponse>>
 */
export async function getCompanySubscriptionsByCompany(companyId, params = {}) {
  if (!companyId) throw new Error("companyId is required");

  const query = {
    keyword: params.keyword,
    status: params.status,
    pageNumber: params.pageNumber ?? 1,
    pageSize: params.pageSize ?? 10,
    sortColumn: params.sortColumn,       // "status" | "createdAt" | "expiredAt"
    sortDescending: params.sortDescending,
  };

  try {
    const res = await axiosInstance.get(
      `/CompanySubscription/company/${companyId}`,
      { params: query }
    );
    return unwrap(res) ?? null; // CompanySubscriptionPagedResult
  } catch (e) {
    onError(e);
    return null;
  }
}

/**
 * GET /CompanySubscription/company/{companyId}/active
 * Res: ResponseModel<List<CompanySubscriptionActiveResponse>>
 */
export async function getActiveCompanySubscriptions(companyId) {
  if (!companyId) throw new Error("companyId is required");
  try {
    const res = await axiosInstance.get(
      `/CompanySubscription/company/${companyId}/active`
    );
    return unwrap(res) ?? [];
  } catch (e) {
    onError(e);
    return [];
  }
}
