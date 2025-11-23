/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { Modal } from "antd";
import { Plus, Building2 } from "lucide-react";
import { toast } from "react-toastify";

import { createCompany } from "@/services/companyService.js";
import { getUserActiveSubscriptions } from "@/services/userSubscription.js";
import LoadingOverlay from "@/common/LoadingOverlay";

interface FormCreateCompanyProps {
  onCreated?: () => void;
}

const FormCreateCompany: React.FC<FormCreateCompanyProps> = ({ onCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    taxCode: "",
    detail: "",
    email: "",
    avatar: null as File | null,
    banner: null as File | null,
  });

  const [userSubs, setUserSubs] = useState<any[]>([]);
  const [userSubsLoading, setUserSubsLoading] = useState(false);
  const [selectedUserSubId, setSelectedUserSubId] = useState<string>("");

  const resetForm = () => {
    setFormData({
      companyName: "",
      taxCode: "",
      detail: "",
      email: "",
      avatar: null,
      banner: null,
    });
    setSelectedUserSubId("");
    setUserSubs([]);
  };

  // Load user subscriptions active
  const loadUserSubscriptions = async () => {
    try {
      setUserSubsLoading(true);
      const res = await getUserActiveSubscriptions();
      setUserSubs(res ?? []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setUserSubsLoading(false);
    }
  };

  // ========= Modal handlers =========
  const handleOpen = async () => {
    setIsModalOpen(true);
    await loadUserSubscriptions();
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  // ========= Form handlers =========
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;

    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] as any });
    } else {
      setFormData({ ...formData, [name]: null });
    }

    e.target.value = "";
  };

  const handleImageClick = (name: string) => {
    setFormData((prev) => ({ ...prev, [name]: null }));
  };

  const handleSelectSubscription = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedUserSubId(e.target.value);
  };

  const selectedSub = userSubs.find((x) => x.id === selectedUserSubId);

  // ========= Submit =========
  const handleSubmit = async () => {
    try {
      if (loading) return;

      if (!selectedUserSubId) {
        toast.error("Please select a subscription plan");
        return;
      }
      if (!formData.companyName.trim()) {
        toast.error("Please enter company name");
        return;
      }

      handleClose();
      setLoading(true);

      const fd = new FormData();
      fd.append("Name", formData.companyName);
      fd.append("TaxCode", formData.taxCode);
      fd.append("Detail", formData.detail);
      fd.append("Email", formData.email);
      fd.append("UserSubscriptionId", selectedUserSubId);

      if (formData.avatar) fd.append("AvatarCompany", formData.avatar);
      if (formData.banner) fd.append("ImageCompany", formData.banner);

      const res = await createCompany(fd);

      const msg = res?.data?.message || "Company created successfully!";
      toast.success(msg);

      onCreated?.();
      resetForm();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create company!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        loading={loading}
        message="Creating a company, please wait..."
      />

      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-blue-600 h-[40px] text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">Create New Company</span>
      </button>

      <Modal
        className="p-0"
        open={isModalOpen}
        footer={null}
        onCancel={handleClose}
        closable
        centered
        width={640}
        bodyStyle={{ padding: 0 }}
      >
        <div className="rounded-2xl bg-slate-50">
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Create New Company
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Link your company with an active subscription plan and set basic
                profile & branding.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-5 pb-4 pt-3">
            <div className="flex flex-col gap-5">
              {/* Subscription select */}
              <section className="rounded-xl bg-white border border-slate-200/80 px-4 py-3 shadow-[0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Subscription
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Choose an active subscription. Features will be inherited
                      by this company.
                    </p>
                  </div>
                  {userSubsLoading && (
                    <span className="text-[11px] text-slate-400">
                      Loading...
                    </span>
                  )}
                </div>

                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={selectedUserSubId}
                  onChange={handleSelectSubscription}
                >
                  <option value="">Select active subscription</option>
                  {userSubs.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameSubscription || "Unnamed subscription"}
                    </option>
                  ))}
                </select>

                {/* Features pills (ngang, màu nổi bật) */}
                {selectedSub && (
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-slate-500 mb-1">
                      Included features
                    </p>
                    {selectedSub.userSubscriptionEntitlements &&
                      selectedSub.userSubscriptionEntitlements.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSub.userSubscriptionEntitlements.map(
                          (f: any) => (
                            <span
                              key={f.id}
                              className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700"
                            >
                              {f.featureName}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        No feature entitlements.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Company info */}
              <section className="rounded-xl bg-white border border-slate-200/80 px-4 py-3 shadow-[0_0_0_1px_rgba(148,163,184,0.08)]">
                <p className="text-xs font-semibold text-slate-800 mb-2">
                  Company information
                </p>

                <div className="flex flex-col gap-4">
                  {/* Company name */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. FPT University"
                      className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-200 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>

                  {/* Tax code */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Tax code
                    </label>
                    <input
                      name="taxCode"
                      type="text"
                      value={formData.taxCode}
                      onChange={handleChange}
                      placeholder="Input tax code"
                      className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-200 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@company.com"
                      className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-200 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>

                  {/* Detail / description */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Detail / short description
                    </label>
                    <textarea
                      name="detail"
                      rows={4}
                      value={formData.detail}
                      onChange={handleChange}
                      placeholder="A short tagline about your company"
                      className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-200 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Branding images */}
              <section className="rounded-xl bg-white border border-slate-200/80 px-4 py-3 shadow-[0_0_0_1px_rgba(148,163,184,0.08)]">
                <p className="text-xs font-semibold text-slate-800 mb-2">
                  Branding images
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Avatar */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Avatar image
                    </label>
                    <div className="mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center bg-sky-50 text-sky-600 hover:bg-sky-100 transition">
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onClick={() => handleImageClick("avatar")}
                        onChange={handleImageChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-7 h-7 mb-1.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l3-3m-3 3l-3-3"
                            />
                          </svg>
                          <p className="text-[11px]">
                            Drop avatar, or{" "}
                            <span className="underline font-medium">
                              browse
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Recommended: square image, PNG/JPEG
                          </p>
                        </div>
                      </label>

                      {formData.avatar && (
                        <img
                          src={URL.createObjectURL(formData.avatar)}
                          alt="Avatar Preview"
                          className="mt-3 w-24 h-24 object-cover rounded-full border border-slate-200 bg-white"
                        />
                      )}
                    </div>
                  </div>

                  {/* Banner */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Banner image
                    </label>
                    <div className="mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center bg-sky-50 text-sky-600 hover:bg-sky-100 transition">
                      <input
                        type="file"
                        name="banner"
                        accept="image/*"
                        onClick={() => handleImageClick("banner")}
                        onChange={handleImageChange}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label htmlFor="banner-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-7 h-7 mb-1.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l3-3m-3 3l-3-3"
                            />
                          </svg>
                          <p className="text-[11px]">
                            Drop banner, or{" "}
                            <span className="underline font-medium">
                              browse
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Recommended: 16:9 wide banner
                          </p>
                        </div>
                      </label>

                      {formData.banner && (
                        <img
                          src={URL.createObjectURL(formData.banner)}
                          alt="Banner Preview"
                          className="mt-3 w-full h-20 object-cover rounded-lg border border-slate-200 bg-white"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-full bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Save company
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FormCreateCompany;
