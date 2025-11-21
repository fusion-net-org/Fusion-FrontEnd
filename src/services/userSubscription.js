import { axiosInstance } from "@/apiConfig";

// --- helpers ---
const unwrap = (res) => res?.data?.data ?? res?.data;
const onError = (e) => {
  const msg = e?.response?.data?.message || e?.message || "Unexpected error";
  throw new Error(msg);
};


export async function getUserSubscriptionsPaged(params) {
  try {
    const res = await axiosInstance.get("/UserSubscription/userpage", {
      params,
    });
    return res?.data?.data ?? null;
  } catch (e) {
    onError(e);
    return null;
  }
}

export async function getUserSubscriptionDetail(id) {
  try {
    const res = await axiosInstance.get(`/UserSubscription/${id}`);
    // ResponseModel<UserSubscriptionDetailResponse> hoặc UserSubscriptionDetailResponse
    const data = unwrap(res);
    console.log("UserSubscription detail raw:", data); // debug nếu cần
    return data ?? null;
  } catch (e) {
    onError(e);
    return null;
  }
}

export async function getUserActiveSubscriptions() {
  try {
    const res = await axiosInstance.get("/UserSubscription/allActive");
    return unwrap(res) ?? null;
  } catch (e) {
    onError(e);
    return null;
  }
}