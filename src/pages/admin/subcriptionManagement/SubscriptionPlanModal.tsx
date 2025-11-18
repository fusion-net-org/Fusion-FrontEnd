import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Divider } from "antd";
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
  licenseScope: "SeatBased",
  isFullPackage: false,
  companyShareLimit: null,
  seatsPerCompanyLimit: null,
  featureIds: [],
  price: {
    billingPeriod: "Month",
    periodCount: 1,
    chargeUnit: "PerSubscription",
    price: 0,
    currency: "VND",
    paymentMode: "Prepaid",
    installmentCount: null,
    installmentInterval: null,
    // discounts FE có thể không send, để undefined
  } as any,
};

// simple className helper
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

export default function SubscriptionPlanModal({ open, onClose, initial, onSubmit }: Props) {
  const [form] = Form.useForm();
  const [featureOpts, setFeatureOpts] = useState<{ value: string; label: string }[]>([]);
  const isEdit = !!initial;

  useEffect(() => {
    getFeatureOptions().then(setFeatureOpts).catch(() => setFeatureOpts([]));
  }, []);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      // build discounts array theo index 1..installmentCount để bind vào form
      const ic = initial.price?.installmentCount ?? null;
      let discounts: Array<{ discountValue?: number; note?: string | null }> | undefined;

      if (ic && ic > 0) {
        discounts = Array.from({ length: ic }, (_, idx) => {
          const index = idx + 1;
          const found = initial.price?.discounts?.find((d) => d.installmentIndex === index);
          return {
            discountValue: found?.discountValue ?? undefined,
            note: found?.note ?? undefined,
          };
        });
      }

      form.setFieldsValue({
        name: initial.name,
        description: initial.description,
        isActive: initial.isActive,
        licenseScope: initial.licenseScope as LicenseScope,
        isFullPackage: initial.isFullPackage,
        companyShareLimit: initial.companyShareLimit ?? null,
        seatsPerCompanyLimit: initial.seatsPerCompanyLimit ?? null,
        featureIds:
          initial.features?.filter((f) => f.enabled).map((f) => f.featureId) ?? [],
        price: {
          billingPeriod: initial.price?.billingPeriod ?? "Month",
          periodCount: initial.price?.periodCount ?? 1,
          chargeUnit: initial.price?.chargeUnit ?? "PerSubscription",
          price: initial.price?.price ?? 0,
          currency: initial.price?.currency ?? "VND",
          paymentMode: initial.price?.paymentMode ?? "Prepaid",
          installmentCount: initial.price?.installmentCount ?? null,
          installmentInterval: initial.price?.installmentInterval ?? null,
          discounts, // có thể undefined nếu không có installment
        },
      });
    } else {
      form.setFieldsValue(DEFAULT);
    }
  }, [open, initial, form]);

  const paymentMode: PaymentMode =
    Form.useWatch(["price", "paymentMode"], form) || "Prepaid";
  const isFullPackage: boolean = Form.useWatch("isFullPackage", form) ?? false;
  const licenseScope: LicenseScope =
    Form.useWatch("licenseScope", form) || ("SeatBased" as LicenseScope);
  const installmentCount: number | null =
    Form.useWatch(["price", "installmentCount"], form) ?? null;

  const submit = async () => {
    const v = await form.validateFields();

    // chuẩn hoá discounts cho payload
    let discountsPayload: any[] | null = null;
    if (v.price.paymentMode === "Installments" && v.price.installmentCount) {
      const n = Number(v.price.installmentCount) || 0;
      const rawDiscounts: Array<{ discountValue?: number; note?: string }> =
        v.price.discounts ?? [];

      const arr: any[] = [];
      for (let i = 1; i <= n; i++) {
        const d = rawDiscounts?.[i - 1] ?? {};
        const value = Number(d.discountValue ?? 0);
        const note = (d.note ?? "").trim();
        // nếu không nhập gì thì bỏ qua kỳ đó
        if (!value && !note) continue;

        arr.push({
          installmentIndex: i,
          discountValue: value,
          note: note || null,
        });
      }
      discountsPayload = arr.length > 0 ? arr : null;
    }

    const payload: SubscriptionPlanCreateRequest = {
      name: v.name,
      description: v.description,
      isActive: !!v.isActive,
      licenseScope: v.licenseScope as LicenseScope,
      isFullPackage: !!v.isFullPackage,
      companyShareLimit: v.companyShareLimit ?? null,
      // CompanyWide => seatsPerCompanyLimit luôn null
      seatsPerCompanyLimit:
        v.licenseScope === "CompanyWide" ? null : v.seatsPerCompanyLimit ?? null,
      // FullPackage => không gửi featureIds (backend hiểu là full)
      featureIds: v.isFullPackage ? [] : v.featureIds ?? [],
      price: {
        billingPeriod: v.price.billingPeriod as BillingPeriod,
        periodCount: Number(v.price.periodCount),
        chargeUnit: v.price.chargeUnit as ChargeUnit,
        price: Number(v.price.price),
        currency: v.price.currency,
        paymentMode: v.price.paymentMode as PaymentMode,
        installmentCount:
          v.price.paymentMode === "Installments"
            ? Number(v.price.installmentCount || 0) || 0
            : null,
        installmentInterval:
          v.price.paymentMode === "Installments"
            ? (v.price.installmentInterval as BillingPeriod)
            : null,
        discounts: discountsPayload ?? undefined,
      } as any,
    };

    if (isEdit && initial) onSubmit({ ...(payload as any), id: initial.id });
    else onSubmit(payload);
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
      <Form
        form={form}
        layout="vertical"
        colon={false}
        className="mt-2 space-y-6"
      >
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
              <Form.Item
                name="isActive"
                valuePropName="checked"
                className="mb-0"
              >
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
                initialValue="SeatBased"
              >
                <Select>
                  <Option value="SeatBased">Seat based</Option>
                  <Option value="CompanyWide">Company wide</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Full package
                  </span>
                }
                name="isFullPackage"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Company share limit
                  </span>
                }
                name="companyShareLimit"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="null = unlimited"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Seats per company limit
                  </span>
                }
                name="seatsPerCompanyLimit"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder={
                    licenseScope === "CompanyWide"
                      ? "Not applicable for company-wide"
                      : "null = unlimited"
                  }
                  disabled={licenseScope === "CompanyWide"}
                />
              </Form.Item>
            </div>

            <Divider className="my-4">Features</Divider>

            <div
              className={cn(
                "rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3",
                isFullPackage && "opacity-60"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">
                  Included features
                </span>
                {isFullPackage && (
                  <span className="text-[11px] font-medium text-emerald-600">
                    Full package &mdash; all features included
                  </span>
                )}
              </div>
              <Form.Item
                name="featureIds"
                className="mb-0"
                extra={
                  !isFullPackage && (
                    <span className="text-[11px] text-slate-500">
                      Leave empty to create a shell plan and attach features
                      later.
                    </span>
                  )
                }
              >
                <Select
                  mode="multiple"
                  options={featureOpts}
                  allowClear
                  disabled={isFullPackage}
                  placeholder={
                    isFullPackage
                      ? "Full package: feature selection disabled"
                      : "Select features included in this plan"
                  }
                />
              </Form.Item>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-4">
            <div className="mb-3">
              <div className="text-sm font-medium text-slate-800">Pricing</div>
              <div className="text-[11px] text-slate-500">
                Define how often customers are billed and at what rate.
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
                <Select>
                  <Option value="Week">Week</Option>
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
                <InputNumber min={1} className="w-full" />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Charge unit
                  </span>
                }
                name={["price", "chargeUnit"]}
                initialValue="PerSubscription"
              >
                <Select>
                  <Option value="PerSubscription">Per subscription</Option>
                  <Option value="PerSeat">Per seat</Option>
                </Select>
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
                  className="w-full"
                  formatter={(v) =>
                    v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                  }
                  parser={(v) => (v ? v.replace(/,/g, "") : "") as any}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-slate-700">
                    Currency
                  </span>
                }
                name={["price", "currency"]}
                initialValue="VND"
              >
                <Select>
                  <Option value="VND">VND</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
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
                <Select>
                  <Option value="Prepaid">Prepaid</Option>
                  <Option value="Installments">Installments</Option>
                </Select>
              </Form.Item>

              {paymentMode === "Installments" && (
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
                      { required: true, message: "Installment interval is required" },
                    ]}
                  >
                    <Select>
                      <Option value="Week">Week</Option>
                      <Option value="Month">Month</Option>
                      <Option value="Year">Year</Option>
                    </Select>
                  </Form.Item>
                </>
              )}
            </div>

            {/* Discount per installment */}
{paymentMode === "Installments" && installmentCount && installmentCount > 0 && (
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
            {/* Cột 1: label Kỳ i */}
            <div className="flex items-center text-[11px] font-medium text-slate-600">
              Kỳ {index}
            </div>

            {/* Cột 2: % discount */}
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

            {/* Cột 3: Note rộng hơn */}
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
              Prices are before tax. Additional tax rules and discounts can be
              configured separately.
            </p>
          </div>
        </section>
      </Form>
    </Modal>
  );
}
