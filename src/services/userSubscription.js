import { axiosInstance } from "@/apiConfig";

export async function getMySubscriptions(q = {}) {
  const params = {
    status: q.status || undefined,
    Keyword: q.Keyword || undefined,
    PageNumber: q.PageNumber ?? 1,
    PageSize: q.PageSize ?? 10,
    SortColumn: q.SortColumn || undefined,
    SortDescending: q.SortDescending ?? undefined,
  };

  const res = await axiosInstance.get("/UserSubscription/user", { params });
  return res?.data?.data;
}

export async function getMySubscriptionById(id) {
  if (!id) throw new Error("Missing id");
  const res = await axiosInstance.get(`/UserSubscription/${id}`);
  // API trả về ResponseModel<T> => bóc .data.data
  return res?.data?.data;
}