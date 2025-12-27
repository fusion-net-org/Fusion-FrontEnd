import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Divider } from "antd";
import { AlertTriangle } from "lucide-react";
import type {
  SubscriptionPlanDetailResponse,
  SubscriptionPlanCreateRequest,
  LicenseScope,
  BillingPeriod,
  PaymentMode,
  ChargeUnit,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";
import { getFeatureOptions } from "@/services/featureService.js";

const { Option } = Select;

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: SubscriptionPlanDetailResponse | null;
  onSubmit: (
    payload: SubscriptionPlanCreateRequest | (SubscriptionPlanCreateRequest & { id: string })
  ) => void;
};

const DEFAULT: SubscriptionPlanCreateRequest = {
  name: "",
  description: "",
  isActive: true,
  licenseScope: "Userlimits",
  isFullPackage: false,
  autoGrantMonthly: false,
  companyShareLimit: null,
  seatsPerCompanyLimit: null,
  price: {
    billingPeriod: "Month",
    periodCount: 1,
    chargeUnit: "PerSubscription",
    price: 0,
    currency: "VND",
    paymentMode: "Prepaid",
    installmentCount: null,
    installmentInterval: null,
    discounts: null,
  },
  featureIds: [],
  featureMonthlyLimits: [],
};

// simple className helper
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

export default function SubscriptionPlanModal({
  open,
  onClose,
  initial,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();
  const [featureOpts, setFeatureOpts] = useState<{ value: string; label: string }[]>([]);
  const isEdit = !!initial;

  useEffect(() => {
    getFeatureOptions().then(setFeatureOpts).catch(() => setFeatureOpts([]));
  }, []);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      const mode = initial.price?.paymentMode ?? "Prepaid";
      const ic = initial.price?.installmentCount ?? null;
      let discounts:
        | Array<{ discountValue?: number; note?: string | null }>
        | undefined;

      if (mode === "Installments" && ic && ic > 0) {
        // map từng kỳ installment từ response -> form
        discounts = Array.from({ length: ic }, (_, idx) => {
          const index = idx + 1;
          const found = initial.price?.discounts?.find(
            (d) => d.installmentIndex === index
          );
          return {
            discountValue: found?.discountValue ?? undefined,
            note: found?.note ?? undefined,
          };
        });
      } else if (mode === "Prepaid") {
        // Prepaid: lấy discount kỳ 1 (nếu có) đưa vào index 0
        const found = initial.price?.discounts?.find(
          (d) => d.installmentIndex === 1
        );
        if (found) {
          discounts = [
            {
              discountValue: found.discountValue,
              note: found.note ?? undefined,
            },
          ];
        }
      }

      // map monthlyLimit cho từng feature (nếu response có)
      const featureLimits: Record<string, { monthlyLimit?: number | null }> = {};
      if (initial.features) {
        (initial.features as any[])
          .filter((f) => f.enabled)
          .forEach((f: any) => {
            if (typeof f.monthlyLimit !== "undefined" && f.monthlyLimit !== null) {
              featureLimits[f.featureId] = { monthlyLimit: f.monthlyLimit };
            }
          });
      }

      form.setFieldsValue({
        name: initial.name,
        description: initial.description,
        isActive: initial.isActive,
        licenseScope: initial.licenseScope as LicenseScope,
        isFullPackage: initial.isFullPackage,
        autoGrantMonthly: (initial as any).autoGrantMonthly ?? false,
        companyShareLimit: initial.companyShareLimit ?? null,
        seatsPerCompanyLimit: initial.seatsPerCompanyLimit ?? null,
        featureIds:
          initial.features?.filter((f) => f.enabled).map((f) => f.featureId) ?? [],
        featureLimits,
        price: {
          billingPeriod: initial.price?.billingPeriod ?? "Month",
          periodCount: initial.price?.periodCount ?? 1,
          chargeUnit: initial.price?.chargeUnit ?? "PerSubscription",
          price: initial.price?.price ?? 0,
          currency: initial.price?.currency ?? "VND",
          paymentMode: initial.price?.paymentMode ?? "Prepaid",
          installmentCount: initial.price?.installmentCount ?? null,
          installmentInterval: initial.price?.installmentInterval ?? null,
          discounts,
        },
      });
    } else {
      form.resetFields();
      form.setFieldsValue(DEFAULT);
    }
  }, [open, initial, form]);

  // watch các field
  const paymentMode: PaymentMode =
    (Form.useWatch(["price", "paymentMode"], form) as PaymentMode) || "Prepaid";
  const isFullPackage: boolean = Form.useWatch("isFullPackage", form) ?? false;
  const licenseScope: LicenseScope =
    (Form.useWatch("licenseScope", form) as LicenseScope) || "Userlimits";
  const installmentCount: number | null =
    Form.useWatch(["price", "installmentCount"], form) ?? null;
  const autoGrantMonthly: boolean =
    Form.useWatch("autoGrantMonthly", form) ?? false;
  const selectedFeatureIds: string[] =
    Form.useWatch("featureIds", form) ?? [];

  // Khi bật autoGrantMonthly: tắt full package + ép: Month / 1 / 0 / Prepaid / clear installments
  useEffect(() => {
    if (autoGrantMonthly) {
      const currentPrice = form.getFieldValue("price") || {};
      form.setFieldsValue({
        isFullPackage: false,
        price: {
          ...currentPrice,
          billingPeriod: "Month",
          periodCount: 1,
          price: 0,
          paymentMode: "Prepaid",
          installmentCount: null,
          installmentInterval: null,
          discounts: undefined,
        },
      });
    }
  }, [autoGrantMonthly, form]);

  const submit = async () => {
    const v = await form.validateFields();

    const autoGrantMonthlyFlag = !!v.autoGrantMonthly;

    // chuẩn hoá discounts cho payload
    let discountsPayload: any[] | null = null;

    if (!autoGrantMonthlyFlag) {
      if (v.price.paymentMode === "Installments" && v.price.installmentCount) {
        const n = Number(v.price.installmentCount) || 0;
        const rawDiscounts: Array<{ discountValue?: number; note?: string }> =
          v.price.discounts ?? [];

        const arr: any[] = [];
        for (let i = 1; i <= n; i++) {
          const d = rawDiscounts?.[i - 1] ?? {};
          const value = Number(d.discountValue ?? 0);
          const note = (d.note ?? "").trim();
          if (!value && !note) continue;

          arr.push({
            installmentIndex: i,
            discountValue: value,
            note: note || null,
          });
        }
        discountsPayload = arr.length > 0 ? arr : null;
      } else if (v.price.paymentMode === "Prepaid") {
        // Prepaid: chỉ 1 discount, installmentIndex = 1
        const first = (v.price.discounts?.[0] ??
          {}) as { discountValue?: number; note?: string };

        const value = Number(first.discountValue ?? 0);
        const note = (first.note ?? "").trim();

        if (value || note) {
          discountsPayload = [
            {
              installmentIndex: 1,
              discountValue: value,
              note: note || null,
            },
          ];
        }
      }
    }

    // chuẩn hoá featureMonthlyLimits cho autoGrantMonthly
    let featureMonthlyLimits:
      | { featureId: string; monthlyLimit: number | null }[]
      | undefined;

    if (autoGrantMonthlyFlag && Array.isArray(v.featureIds)) {
      const featureLimitsObj = v.featureLimits || {};
      featureMonthlyLimits = v.featureIds.map((fid: string) => {
        const entry = featureLimitsObj?.[fid] || {};
        const raw = entry?.monthlyLimit;
        const hasValue = raw !== undefined && raw !== null && raw !== "";
        return {
          featureId: fid,
          monthlyLimit: hasValue ? Number(raw) : null,
        };
      });
    }

    const payload: SubscriptionPlanCreateRequest = {
      name: v.name,
      description: v.description,
      isActive: !!v.isActive,
      licenseScope: v.licenseScope as LicenseScope,
      isFullPackage: !!v.isFullPackage,
      autoGrantMonthly: autoGrantMonthlyFlag,
      companyShareLimit: v.companyShareLimit ?? null,
      seatsPerCompanyLimit:
        v.licenseScope === "EntireCompany" ? null : v.seatsPerCompanyLimit ?? null,
      featureIds: v.isFullPackage ? [] : v.featureIds ?? [],
      featureMonthlyLimits,
      price: {
        billingPeriod: autoGrantMonthlyFlag
          ? "Month"
          : (v.price.billingPeriod as BillingPeriod),
        periodCount: autoGrantMonthlyFlag ? 1 : Number(v.price.periodCount),
        chargeUnit: v.price.chargeUnit as ChargeUnit,
        price: autoGrantMonthlyFlag ? 0 : Number(v.price.price),
        currency: v.price.currency,
        paymentMode: autoGrantMonthlyFlag
          ? "Prepaid"
          : (v.price.paymentMode as PaymentMode),
        installmentCount:
          !autoGrantMonthlyFlag && v.price.paymentMode === "Installments"
            ? Number(v.price.installmentCount || 0) || 0
            : null,
        installmentInterval:
          !autoGrantMonthlyFlag && v.price.paymentMode === "Installments"
            ? (v.price.installmentInterval as BillingPeriod)
            : null,
        discounts: autoGrantMonthlyFlag ? undefined : discountsPayload ?? undefined,
      },
    };

    // 🔸 XÁC NHẬN CHO UPDATE
    if (isEdit && initial) {
      Modal.confirm({
        centered: true,
        icon: (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
        ),
        title: (
          <span className="text-sm font-semibold text-slate-900">
            Confirm subscription plan update
          </span>
        ),
        content: (
          <div className="mt-1 text-xs leading-relaxed text-slate-600">
            <p>
              All changes to this subscription plan, especially its{" "}
              <span className="font-semibold text-amber-600 underline decoration-dotted">
                status
              </span>
              , will directly affect end users&apos; experience.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Please double-check limits, pricing and feature access before confirming
              this update.
            </p>
          </div>
        ),
        okText: "Confirm update",
        cancelText: "Cancel",
        okButtonProps: {
          className:
            "bg-indigo-600 hover:bg-indigo-700 border-none text-white font-semibold",
        },
        cancelButtonProps: {
          className: "border-slate-200 text-slate-600 hover:text-slate-800",
        },
        onOk: () => {
          onSubmit({ ...payload, id: initial.id });
        },
      });
      return;
    }

    // 🔹 CREATE + AUTO-GRANT MONTHLY → POPUP XÁC NHẬN
    if (!isEdit && autoGrantMonthlyFlag) {
      Modal.confirm({
        centered: true,
        icon: (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50">
            <AlertTriangle className="h-4 w-4 text-sky-600" />
          </div>
        ),
        title: (
          <span className="text-sm font-semibold text-slate-900">
            Create auto-grant monthly plan?
          </span>
        ),
        content: (
          <div className="mt-1 text-xs leading-relaxed text-slate-600">
            <p>
              This plan is marked as{" "}
              <span className="font-semibold text-sky-700 underline decoration-dotted">
                Auto-grant monthly
              </span>
              .
            </p>
            <p className="mt-2">
              Auto-grant monthly plans can be automatically applied by the system to
              users and companies across your workspace. Please double-check features
              and monthly limits before confirming this creation.
            </p>
          </div>
        ),
        okText: "Create plan",
        cancelText: "Cancel",
        okButtonProps: {
          className:
            "bg-indigo-600 hover:bg-indigo-700 border-none text-white font-semibold",
        },
        cancelButtonProps: {
          className: "border-slate-200 text-slate-600 hover:text-slate-800",
        },
        onOk: () => {
          onSubmit(payload);
        },
      });
      return;
    }

    // 🔹 CREATE thường: gửi luôn
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      width={880}
      centered
      destroyOnClose
      okText={isEdit ? "Update plan" : "Create plan"}
      className="subscription-plan-modal"
      title={
        <div className="flex flex-col gap-1">
          <div className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit subscription plan" : "New subscription plan"}
          </div>
          <div className="text-xs text-slate-500">
            Define pricing, limits and features for this plan.
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" colon={false} className="mt-2 space-y-6">
        {/* Header: Name + Status */}
        <section className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Plan name
                  </span>
                }
                name="name"
                rules={[{ required: true, message: "Plan name is required" }]}
                className="mb-2"
              >
                <Input placeholder="e.g. Startup, Business, Enterprise" />
              </Form.Item>
              <p className="text-[11px] text-slate-500">
                This name will be visible on invoices and inside the app.
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 md:items-end">
              <span className="text-xs font-medium text-slate-700">Status</span>
              <Form.Item name="isActive" valuePropName="checked" className="mb-0">
                <Switch
                  size="small"
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
            </div>
          </div>

          <div className="mt-3">
            <Form.Item
              label={
                <span className="text-xs font-medium text-slate-700">
                  Description
                </span>
              }
              name="description"
              className="mb-0"
            >
              <Input.TextArea
                rows={3}
                placeholder="Short internal note about who this plan is for"
              />
            </Form.Item>
          </div>
        </section>

        {/* Body: left = licensing & features, right = pricing */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* Licensing & limits & features */}
          <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">
                  Licensing & usage limits
                </div>
                <div className="text-[11px] text-slate-500">
                  Configure how this plan is applied to companies and seats.
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    License scope
                  </span>
                }
                name="licenseScope"
                initialValue="Userlimits"
              >
                <Select>
                  <Option value="Userlimits">User limits</Option>
                  <Option value="EntireCompany">Entire company</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Full feature
                  </span>
                }
                name="isFullPackage"
                valuePropName="checked"
              >
                <Switch disabled={autoGrantMonthly} />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-medium text-slate-700">Company share limit</span>}
                name="companyShareLimit"
                rules={[
                  {
                    validator: async (_, value) => {
                      if (value === null || value === undefined || value === "") return;
                      const n = Number(value);
                      if (Number.isNaN(n)) throw new Error("Invalid number");
                      if (n <= 0) throw new Error("Company share limit must be greater than 0");
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-medium text-slate-700">Seats per company limit</span>}
                name="seatsPerCompanyLimit"
                rules={[
                  {
                    validator: async (_, value) => {
                      // EntireCompany: field disabled -> skip validation
                      if (licenseScope === "EntireCompany") return;

                      // null/undefined = unlimited -> OK
                      if (value === null || value === undefined || value === "") return;

                      const n = Number(value);
                      if (Number.isNaN(n)) throw new Error("Invalid number");
                      if (n <= 0) throw new Error("Seats per company limit must be greater than 0");
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder={
                    licenseScope === "EntireCompany"
                      ? "Not applicable for entire-company plans"
                      : ""
                  }
                  disabled={licenseScope === "EntireCompany"}
                />
              </Form.Item>
            </div>

            {/* Auto grant monthly toggle */}
            <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div>
                <div className="text-xs font-medium text-slate-800">
                  Auto-grant monthly
                </div>
                <div className="text-[11px] text-slate-500">
                  When enabled, this plan is granted by the system as a free monthly
                  quota. Full feature mode is disabled; configure feature limits below.
                </div>
              </div>
              <Form.Item
                name="autoGrantMonthly"
                valuePropName="checked"
                className="mb-0"
              >
                <Switch size="small" />
              </Form.Item>
            </div>

            <Divider className="my-4">Features</Divider>

            <div
              className={cn(
                "rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3",
                isFullPackage && !autoGrantMonthly && "opacity-60"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">
                  Included features
                </span>
                {isFullPackage && !autoGrantMonthly && (
                  <span className="text-[11px] font-medium text-emerald-600">
                    Full feature &mdash; all features included
                  </span>
                )}
                {autoGrantMonthly && (
                  <span className="text-[11px] font-medium text-sky-600">
                    Auto-grant plan &mdash; select features and set monthly limits
                  </span>
                )}
              </div>
              <Form.Item
                name="featureIds"
                className="mb-0"
                extra={
                  !isFullPackage && !autoGrantMonthly && (
                    <span className="text-[11px] text-slate-500">
                      Leave empty to create a shell plan and attach features later.
                    </span>
                  )
                }
              >
                <Select
                  mode="multiple"
                  options={featureOpts}
                  allowClear
                  disabled={isFullPackage && !autoGrantMonthly}
                  placeholder={
                    isFullPackage && !autoGrantMonthly
                      ? "Full feature: feature selection disabled"
                      : "Select features included in this plan"
                  }
                />
              </Form.Item>

              {/* Monthly limit per feature when auto-grant monthly */}
              {autoGrantMonthly && (
                <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-white/80 px-3 py-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700">
                      Monthly limits per feature
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Empty = unlimited usage for that feature.
                    </span>
                  </div>

                  {selectedFeatureIds.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      Select at least one feature above to configure monthly limits.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedFeatureIds.map((fid) => {
                        const label =
                          featureOpts.find((o) => o.value === fid)?.label ?? fid;
                        return (
                          <div
                            key={fid}
                            className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
                          >
                            <div className="flex-1 text-[11px] font-medium text-slate-700">
                              {label}
                            </div>
                            <Form.Item
                              name={["featureLimits", fid, "monthlyLimit"]}
                              className="mb-0"
                            >
                              <InputNumber
                                min={0}
                                className="w-28"
                                placeholder="∞"
                              />
                            </Form.Item>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-4">
            <div className="mb-3">
              <div className="text-sm font-medium text-slate-800">Pricing</div>
              <div className="text-[11px] text-slate-500">
                {autoGrantMonthly
                  ? "This plan is auto-granted as a free monthly quota. Billing settings are informational only."
                  : "Define how often customers are billed and at what rate."}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Billing period
                  </span>
                }
                name={["price", "billingPeriod"]}
                initialValue="Month"
              >
                <Select disabled={autoGrantMonthly}>
                  <Option value="Month">Month</Option>
                  <Option value="Year">Year</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Period count
                  </span>
                }
                name={["price", "periodCount"]}
                initialValue={1}
                rules={[{ required: true, message: "Period count is required" }]}
              >
                <InputNumber min={1} className="w-full" disabled={autoGrantMonthly} />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Price
                  </span>
                }
                name={["price", "price"]}
                rules={[{ required: true, message: "Price is required" }]}
              >
                <InputNumber
                  min={0}
                  disabled={autoGrantMonthly}
                  className="w-full"
                  formatter={(v) =>
                    v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                  }
                  parser={(v) => (v ? v.replace(/,/g, "") : "") as any}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-medium text-slate-700">Currency</span>}
                name={["price", "currency"]}
                initialValue="VND"
              >
                <Select
                  className="w-full"
                  placeholder="Select currency"
                  options={[{ value: "VND", label: "VND" }]}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Payment mode
                  </span>
                }
                name={["price", "paymentMode"]}
                initialValue="Prepaid"
              >
                <Select disabled={autoGrantMonthly}>
                  <Option value="Prepaid">Prepaid</Option>
                  <Option value="Installments">Installments</Option>
                </Select>
              </Form.Item>

              {/* Installment config */}
              {paymentMode === "Installments" && !autoGrantMonthly && (
                <>
                  <Form.Item
                    label={
                      <span className="text-xs font-medium text-slate-700">
                        Installment count
                      </span>
                    }
                    name={["price", "installmentCount"]}
                    rules={[
                      { required: true, message: "Installment count is required" },
                    ]}
                  >
                    <InputNumber min={2} className="w-full" />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-xs font-medium text-slate-700">
                        Installment interval
                      </span>
                    }
                    name={["price", "installmentInterval"]}
                    initialValue="Month"
                    rules={[
                      {
                        required: true,
                        message: "Installment interval is required",
                      },
                    ]}
                  >
                    <Select>
                      <Option value="Month">Month</Option>
                      <Option value="Year">Year</Option>
                    </Select>
                  </Form.Item>
                </>
              )}
            </div>

            {/* Prepaid discount (one-time) */}
            {paymentMode === "Prepaid" && !autoGrantMonthly && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-700">
                    Discount
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                  <Form.Item
                    name={["price", "discounts", 0, "discountValue"]}
                    className="mb-0"
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      className="w-full"
                      addonAfter="%"
                      placeholder="0"
                    />
                  </Form.Item>

                  <Form.Item
                    name={["price", "discounts", 0, "note"]}
                    className="mb-0"
                  >
                    <Input
                      placeholder="Optional note for this discount"
                      maxLength={250}
                    />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* Discount per installment */}
            {paymentMode === "Installments" &&
              !autoGrantMonthly &&
              installmentCount &&
              installmentCount > 0 && (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-700">
                      Discounts per installment
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Leave blank = no discount for that installment.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {Array.from({ length: installmentCount }, (_, idx) => {
                      const index = idx + 1;
                      return (
                        <div
                          key={index}
                          className="grid gap-3 rounded-md bg-white px-3 py-2 md:grid-cols-[80px_160px_minmax(0,1fr)]"
                        >
                          <div className="flex items-center text-[11px] font-medium text-slate-600">
                            Period {index}
                          </div>

                          <Form.Item
                            name={["price", "discounts", idx, "discountValue"]}
                            className="mb-0"
                          >
                            <InputNumber
                              min={0}
                              max={100}
                              className="w-full"
                              addonAfter="%"
                              placeholder="0"
                            />
                          </Form.Item>

                          <Form.Item
                            name={["price", "discounts", idx, "note"]}
                            className="mb-0"
                          >
                            <Input
                              placeholder="Optional note for this installment"
                              maxLength={250}
                            />
                          </Form.Item>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            <p className="mt-3 text-[11px] text-slate-500">
              {autoGrantMonthly
                ? "This plan is granted automatically as a free monthly quota. No charges will be generated."
                : "Prices are before tax. Additional tax rules and discounts can be configured separately."}
            </p>
          </div>
        </section>
      </Form>
    </Modal>
  );
}
