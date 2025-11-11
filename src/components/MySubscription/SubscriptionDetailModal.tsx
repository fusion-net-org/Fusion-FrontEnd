import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import StatusBadge from "@/components/MySubscription/StatusBadge";
import { getMySubscriptionById } from "@/services/userSubscription.js";
import { createCompanySubscription } from "@/services/companySubscription.js";
import { getCompaniesOfCurrentUser } from "@/services/companyService.js"; 
import type { UserSubscriptionDetailResponse } from "@/interfaces/UserSubscription/UserSubscription";

/* ===== Utils ===== */
const formatCurrency = (amount: number, currency?: string | null) => {
  const cur = (currency || "VND").toUpperCase();
  const opts: Intl.NumberFormatOptions = { style: "currency", currency: cur };
  if (cur === "VND") opts.maximumFractionDigits = 0;
  try {
    return new Intl.NumberFormat("vi-VN", opts).format(amount);
  } catch {
    const n = typeof amount === "number" ? amount.toLocaleString("vi-VN") : String(amount ?? "");
    return `${n} ${cur}`;
  }
};
const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "--";

/* ===== Constants ===== */
const FEATURE_ONLY = "Project";
const GUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type Props = {
  open: boolean;
  subscriptionId: string | null;
  onClose: () => void;
};

type CompanyListResponse = { id: string | null; companyName: string | null };

const SubscriptionDetailModal: React.FC<Props> = ({ open, subscriptionId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<UserSubscriptionDetailResponse | null>(null);

  // Share state
  const [shareMode, setShareMode] = useState(false);
  const [shareCompanyId, setShareCompanyId] = useState("");
  const [shareQty, setShareQty] = useState<number>(0);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<CompanyListResponse[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companiesLoadedOnce, setCompaniesLoadedOnce] = useState(false);

  // helper: entitlement Project (nếu có)
  const projectEnt = useMemo(() => {
    const ents = data?.entitlements || [];
    return ents.find((e) => String(e.featureKey).toLowerCase() === "project");
  }, [data]);

  // available = Remaining (ưu tiên) hoặc Quantity
  const available = useMemo(() => {
    if (!projectEnt) return 0;
    const rem = Number.isFinite(projectEnt?.remaining) ? projectEnt?.remaining : undefined;
    const qty = Number.isFinite(projectEnt?.quantity) ? projectEnt?.quantity : 0;
    return typeof rem === "number" ? rem : qty;
  }, [projectEnt]);

  // Load detail mỗi khi open + id đổi
  useEffect(() => {
    if (!open || !subscriptionId) return;
    (async () => {
      setLoading(true);
      setErr(null);
      setData(null);
      setShareMode(false);
      setShareCompanyId("");
      setShareQty(0);
      setShareError(null);
      setShareSuccess(null);

      try {
        const resp = await getMySubscriptionById(subscriptionId);
        setData(resp);
        // preset số lượng mặc định = available của Project (nếu có)
        const ents = resp?.entitlements || [];
        const proj = ents.find((e: any) => String(e?.featureKey).toLowerCase() === "project");
        if (proj) {
          const suggest = Number.isFinite(proj?.remaining) ? proj.remaining : proj.quantity;
          setShareQty(Math.max(0, Number(suggest || 0)));
        } else {
          setShareQty(0);
        }
      } catch (e: any) {
        setErr(e?.message || "Cannot load subscription detail.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, subscriptionId]);

  // Load companies khi bật share lần đầu (lazy)
  useEffect(() => {
    if (!open || !shareMode || companiesLoadedOnce) return;
    (async () => {
      setCompaniesLoading(true);
      setCompaniesError(null);
      try {
        const list: CompanyListResponse[] = await getCompaniesOfCurrentUser();
        // lọc id hợp lệ GUID và sort theo tên
        const clean = (list || [])
          .filter((c) => c?.id && GUID.test(c.id))
          .sort((a, b) => (a.companyName || "").localeCompare(b.companyName || "", "vi"));
        setCompanies(clean);
        // default chọn công ty đầu nếu chưa chọn
        if (!shareCompanyId && clean.length) setShareCompanyId(clean[0].id!);
        setCompaniesLoadedOnce(true);
      } catch (e: any) {
        setCompaniesError(e?.message || "Không tải được danh sách công ty.");
      } finally {
        setCompaniesLoading(false);
      }
    })();
  }, [open, shareMode, companiesLoadedOnce, shareCompanyId]);

  if (!open) return null;

  const submitShare = async () => {
    try {
      setShareError(null);
      setShareSuccess(null);
      if (!data?.id) throw new Error("Missing UserSubscriptionId");
      if (!shareCompanyId) throw new Error("Vui lòng chọn Company");
      if (!GUID.test(shareCompanyId)) throw new Error("CompanyId không đúng định dạng GUID");
      if (!projectEnt) throw new Error("Subscription này không có entitlement Project.");

      const quantity = Math.max(0, Math.min(Number(shareQty || 0), Number(available || 0)));
      if (quantity <= 0) throw new Error("Số lượng Project phải > 0 và không vượt quá số còn lại.");

      setShareLoading(true);
      await createCompanySubscription({
        companyId: shareCompanyId,
        userSubscriptionId: data.id,
        entitlements: [{ featureKey: FEATURE_ONLY, quantity }], // chỉ gửi Project
      });

      setShareSuccess("Share thành công cho công ty!");
    } catch (e: any) {
      setShareError(e?.message || "Không thể tạo Company Subscription.");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      {/* dialog */}
      <div className="absolute left-1/2 top-12 w-[min(720px,92vw)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="text-base font-semibold text-slate-900">Subscription detail</div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h=[75vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-48 rounded bg-slate-200/70" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 w-full rounded bg-slate-200/70" />
                <div className="h-4 w-full rounded bg-slate-200/70" />
                <div className="h-4 w-1/2 rounded bg-slate-200/70" />
                <div className="h-4 w-1/2 rounded bg-slate-200/70" />
              </div>
              <div className="h-5 w-40 rounded bg-slate-200/70" />
              <div className="h-24 w-full rounded bg-slate-200/70" />
            </div>
          ) : err ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {err}
            </div>
          ) : data ? (
            <>
              {/* Header */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="text-xl font-semibold text-slate-900">{data.namePlan ?? "--"}</div>
                <StatusBadge value={data.status} />
                <div className="ml-auto text-sm text-slate-500">ID: {data.id.slice(0, 8)}…</div>
              </div>

              {/* Pricing & Timeline */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Pricing</div>
                  <div className="mt-1 text-sm text-slate-700">
                    {formatCurrency(data.price, data.currency)} — {(data.currency || "VND")?.toUpperCase()}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Timeline</div>
                  <div className="mt-1 text-sm text-slate-700">
                    Created: {formatDateTime(data.creatAt)} <br />
                    Expired: {formatDateTime(data.expiredAt)} <br />
                    Updated: {formatDateTime(data.updateAt)}
                  </div>
                </div>
              </div>

              {/* Entitlements (hiển thị đầy đủ) */}
              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold text-slate-800">Entitlements</div>
                {data.entitlements?.length ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Feature</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.entitlements.map((e) => (
                          <tr key={e.id}>
                            <td className="px-4 py-2 text-sm text-slate-800">{e.featureKey}</td>
                            <td className="px-4 py-2 text-sm text-slate-700">{e.quantity}</td>
                            <td className="px-4 py-2 text-sm text-slate-700">{e.remaining}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    There is no entitlement.
                  </div>
                )}
              </div>

              {/* Share panel — Project only */}
              {shareMode && (
                <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-800">Share to Company (Project only)</div>

                  {/* Company select */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-slate-600">Company</label>
                    <div className="mt-1">
                      {companiesLoading ? (
                        <div className="h-9 w-full animate-pulse rounded-lg border border-slate-300 bg-slate-100" />
                      ) : companiesError ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          {companiesError}
                        </div>
                      ) : companies.length === 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          Bạn chưa thuộc công ty nào để share.
                        </div>
                      ) : (
                        <select
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                          value={shareCompanyId}
                          onChange={(e) => setShareCompanyId(e.target.value)}
                        >
                          {companies.map((c) => (
                            <option key={c.id!} value={c.id!}>
                              {c.companyName || c.id}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Chỉ cho phép chia sẻ entitlement <b>Project</b>.
                    </p>
                  </div>

                  {/* Project row */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Feature</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Available</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Share quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!projectEnt ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-sm text-rose-600">
                              This subscription <b>does not have a Project</b> — cannot share.
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td className="px-4 py-2 text-sm text-slate-800">Project</td>
                            <td className="px-4 py-2 text-sm text-slate-700">{available}</td>
                            <td className="px-4 py-2 text-sm">
                              <input
                                type="number"
                                min={0}
                                max={available ?? undefined}
                                className="h-9 w-32 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                value={shareQty}
                                onChange={(evt) => {
                                  const n = Math.max(0, Math.min(Number(evt.target.value || 0), Number(available || 0)));
                                  setShareQty(n);
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {shareError && (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                      {shareError}
                    </div>
                  )}
                  {shareSuccess && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                      {shareSuccess}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShareMode(false)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      disabled={shareLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitShare}
                      className={[
                        "inline-flex items-center justify-center gap-2 rounded-lg",
                        "bg-indigo-600 px-4 py-2 text-sm font-semibold text-white",
                        "shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                        shareLoading ? "opacity-70" : "",
                      ].join(" ")}
                      disabled={shareLoading || !projectEnt || companies.length === 0}
                    >
                      {shareLoading && (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                      )}
                      Share now
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500">No data.</div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            onClick={() => setShareMode((s) => !s)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {shareMode ? "" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetailModal;
