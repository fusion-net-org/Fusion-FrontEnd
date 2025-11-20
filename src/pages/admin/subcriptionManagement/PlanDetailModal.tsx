import React from "react";
import { Modal, Descriptions, Tag, Space } from "antd";
import type {
  SubscriptionPlanDetailResponse,
  LicenseScope,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

type Props = {
  open: boolean;
  onClose: () => void;
  data: SubscriptionPlanDetailResponse | null;
  loading?: boolean;
};

const niceScope = (s?: LicenseScope) => {
  if (s === "Userlimits") return "User limits";
  if (s === "EntireCompany") return "Entire company";
  return "—";
};

const scopeColor = (s?: LicenseScope) =>
  s === "Userlimits" ? "purple" : "geekblue";

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");
const money = (n?: number, c?: string) =>
  typeof n === "number" ? `${n.toLocaleString()} ${c ?? ""}`.trim() : "—";

export default function PlanDetailModal({ open, onClose, data, loading }: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      centered
      title="Plan detail"
      destroyOnClose
      styles={{
        body: { maxHeight: "72vh", overflow: "auto", paddingTop: 12, paddingBottom: 20 },
      }}
    >
      {/* CSS nhỏ để tránh chữ đứng dọc + tràn */}
      <style>{`
        .plan-detail .ant-descriptions-view { table-layout: fixed; }
        .plan-detail .ant-descriptions-item-content { white-space: normal; word-break: break-word; }
        .plan-detail .nowrap { white-space: nowrap; }
        .plan-detail code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      `}</style>

      {loading ? (
        <div className="py-10 text-center">Loading…</div>
      ) : !data ? (
        <div className="py-10 text-center text-gray-400">No data</div>
      ) : (
        <div className="plan-detail space-y-16">
          {/* 1) General */}
          <Descriptions
            bordered
            column={{ xs: 1, sm: 1, md: 2, lg: 3 }}
            labelStyle={{ width: 160 }}
          >
            <Descriptions.Item label="Name" span={2}>
              {data.name}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={data.isActive ? "green" : "red"}>
                {data.isActive ? "Active" : "Inactive"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Description" span={3}>
              {data.description || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="License scope">
              <Tag color={scopeColor(data.licenseScope)}>
                {niceScope(data.licenseScope)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Package">
              {data.isFullPackage ? <Tag color="blue">Full feature</Tag> : <Tag>Custom</Tag>}
            </Descriptions.Item>

            <Descriptions.Item label="Limits">
              <Space size={8} wrap>
                <Tag className="nowrap">share: {data.companyShareLimit ?? "∞"}</Tag>
                <Tag className="nowrap">seats/company: {data.seatsPerCompanyLimit ?? "∞"}</Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Created at">
              {fmtDate(data.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated at">
              {fmtDate(data.updatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="ID">
              <code>{data.id}</code>
            </Descriptions.Item>
          </Descriptions>

          {/* 2) Pricing */}
          <Descriptions
            title="Pricing"
            bordered
            column={{ xs: 1, sm: 2, md: 3 }}
            labelStyle={{ width: 160 }}
          >
            {data.price ? (
              <>
                <Descriptions.Item label="Billing">
                  {data.price.periodCount} {data.price.billingPeriod}
                </Descriptions.Item>
                <Descriptions.Item label="Charge unit" className="nowrap">
                  {data.price.chargeUnit}
                </Descriptions.Item>
                <Descriptions.Item label="Payment mode">
                  <Tag color={data.price.paymentMode === "Prepaid" ? "cyan" : "volcano"}>
                    {data.price.paymentMode}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Price">
                  {money(Number(data.price.price), data.price.currency)}
                </Descriptions.Item>
                <Descriptions.Item label="Installment count">
                  {data.price.paymentMode === "Installments"
                    ? data.price.installmentCount ?? "—"
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Installment interval">
                  {data.price.paymentMode === "Installments"
                    ? data.price.installmentInterval ?? "—"
                    : "—"}
                </Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label="Pricing" span={3}>
                N/A
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* 2b) Discounts (installments only) */}
          {data.price && data.price.paymentMode === "Installments" && (
            <div>
              <div className="mb-3 text-base font-semibold">Discounts per installment</div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium w-32">
                        Installment
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium w-40">
                        Discount
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {(data.price.discounts && data.price.discounts.length > 0 ? (
                      data.price.discounts
                        .slice()
                        .sort((a, b) => a.installmentIndex - b.installmentIndex)
                        .map((d) => (
                          <tr key={d.installmentIndex} className="border-t">
                            <td className="px-4 py-2">Kỳ {d.installmentIndex}</td>
                            <td className="px-4 py-2">
                              {d.discountValue ?? 0}
                              <span className="ml-1 text-xs text-gray-500">%</span>
                            </td>
                            <td className="px-4 py-2">
                              {d.note && d.note.trim().length > 0 ? (
                                d.note
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr className="border-t">
                        <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                          No discounts configured for this plan.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3) Features */}
          <div>
            <div className="mb-3 text-base font-semibold">Features</div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">
                      Feature code
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">
                      Feature name
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">
                      Enabled
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {(data.features ?? []).map((f) => (
                    <tr key={`${f.featureId}-${f.featureCode ?? ""}`} className="border-t">
                      <td className="px-4 py-2">{f.featureCode ?? "—"}</td>
                      <td className="px-4 py-2">{f.featureName ?? "—"}</td>
                      <td className="px-4 py-2">
                        {f.enabled ? <Tag color="green">Enabled</Tag> : <Tag>Off</Tag>}
                      </td>
                    </tr>
                  ))}
                  {(!data.features || data.features.length === 0) && (
                    <tr className="border-t">
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        No features
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
