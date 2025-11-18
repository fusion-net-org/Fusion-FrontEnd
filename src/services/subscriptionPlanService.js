// src/services/subscriptionPlanService.js
import { axiosInstance } from "@/apiConfig";

// --- helpers ---
const unwrap = (res) => res?.data?.data ?? res?.data;
const onError = (e) => {
  const msg = e?.response?.data?.message || e?.message || "Unexpected error";
  throw new Error(msg);
};

// Public (no paging)
export async function getPublicPlans() {
  try {
    const res = await axiosInstance.get("/SubscriptionPlan/public");
    return unwrap(res) ?? [];
  } catch (e) { onError(e); }
}

// Admin – paged list
export async function getPlansPaged(params) {
  try {
    const res = await axiosInstance.get("/SubscriptionPlan", { params });
    return unwrap(res) ?? { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 };
  } catch (e) { onError(e); }
}

// Detail
export async function getPlanById(id) {
  try {
    const res = await axiosInstance.get(`/SubscriptionPlan/${id}`);
    return unwrap(res) ?? null;
  } catch (e) { onError(e); }
}

// Create
export async function createPlan(payload) {
  try {
    const res = await axiosInstance.post("/SubscriptionPlan/create", payload);
    return unwrap(res);
  } catch (e) { onError(e); }
}

// Update
export async function updatePlan(payload) {
  try {
    const res = await axiosInstance.put("/SubscriptionPlan/update", payload);
    return unwrap(res);
  } catch (e) { onError(e); }
}

// Delete
export async function deletePlan(id) {
  try {
    const res = await axiosInstance.delete(`/SubscriptionPlan/${id}`);
    return !!unwrap(res);
  } catch (e) { onError(e); }
}
