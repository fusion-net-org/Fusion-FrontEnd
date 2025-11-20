import { axiosInstance } from "@/apiConfig";

// ---- helpers ----
const unwrap = (res) => res?.data?.data ?? res?.data;
const onError = (e) => {
  const msg = e?.response?.data?.message || e?.message || "Unexpected error";
  throw new Error(msg);
};

/**
 * GET /FeatureCatalog
 * params: FeatureCatalogPagedParams
 * return: PagedResult<FeatureResponse>
 */
export async function getFeaturesPaged(params) {
  try {
    const res = await axiosInstance.get("/FeatureCatalog", { params });
    return unwrap(res) ?? { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 };
  } catch (e) {
    onError(e);
  }
}

/**
 * GET /FeatureCatalog/{id}
 */
export async function getFeatureById(id) {
  try {
    const res = await axiosInstance.get(`/FeatureCatalog/${id}`);
    return unwrap(res) ?? null;
  } catch (e) {
    onError(e);
  }
}

/**
 * POST /FeatureCatalog/create
 * body: FeatureCreateRequest
 */
export async function createFeature(payload) {
  try {
    const res = await axiosInstance.post("/FeatureCatalog/create", payload);
    return unwrap(res);
  } catch (e) {
    onError(e);
  }
}

/**
 * PUT /FeatureCatalog
 * body: FeatureUpdateRequest
 */
export async function updateFeature(payload) {
  try {
    const res = await axiosInstance.put("/FeatureCatalog", payload);
    return unwrap(res);
  } catch (e) {
    onError(e);
  }
}

/**
 * PATCH /FeatureCatalog/{id}/toggle?active=bool
 * return: { id, active }
 */
export async function toggleFeature(id, active = true) {
  try {
    const res = await axiosInstance.patch(`/FeatureCatalog/${id}/toggle`, null, {
      params: { active },
    });
    return unwrap(res) ?? { id, active };
  } catch (e) {
    onError(e);
  }
}

/**
 * DELETE /FeatureCatalog/{id}
 * return: boolean
 */
export async function deleteFeature(id) {
  try {
    const res = await axiosInstance.delete(`/FeatureCatalog/${id}`);
    return !!unwrap(res);
  } catch (e) {
    onError(e);
  }
}

/**
 * GET /FeatureCatalog/active
 * return: FeatureActiveResponse[]
 */
export async function getActiveFeatures() {
  try {
    const res = await axiosInstance.get("/FeatureCatalog/active");
    return unwrap(res) ?? [];
  } catch (e) {
    onError(e);
  }
}
// ---- tiện ích cho dropdown trong Modal Plan ----
export async function getFeatureOptions() {
  const list = await getActiveFeatures();
  return (Array.isArray(list) ? list : []).map(x => ({ value: x.id, label: x.name }));
}