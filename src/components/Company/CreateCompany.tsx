/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Modal } from 'antd';
import { createCompany } from '@/services/companyService.js';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/common/LoadingOverlay';

interface FormCreateCompanyProps {
  onCreated?: () => void;
}
const FormCreateCompany: React.FC<FormCreateCompanyProps> = ({ onCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    taxCode: '',
    detail: '',
    email: '',
    avatar: null,
    banner: null,
  });

  // Handlers for modal visibility
  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  // Handlers for form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handlers for image uploads
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;

    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      // Nếu người dùng cancel => reset ảnh cũ
      setFormData({ ...formData, [name]: null });
    }

    e.target.value = '';
  };

  const handleImageClick = (name: string) => {
    setFormData((prev) => ({ ...prev, [name]: null }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (loading) return;
      handleClose();
      setLoading(true);
      const fd = new FormData();
      fd.append('Name', formData.companyName);
      fd.append('TaxCode', formData.taxCode);
      fd.append('Detail', formData.detail);
      fd.append('Email', formData.email);

      if (formData.avatar) fd.append('AvatarCompany', formData.avatar);
      if (formData.banner) fd.append('ImageCompany', formData.banner);

      const res = await createCompany(fd);

      const msg = res.data?.message || 'Company created successfully!';
      toast.success(msg);

      if (onCreated) onCreated();

      setFormData({
        companyName: '',
        taxCode: '',
        detail: '',
        email: '',
        avatar: null,
        banner: null,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create company!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay loading={loading} message="Creating a company, please wait..." />

      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-blue-600 h-[40px] text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
      >
        <Plus className="w-5 h-5" /> Create New Company
      </button>

      <Modal
        className="p-3 mb-2"
        open={isModalOpen}
        footer={null}
        onCancel={handleClose}
        closable
        centered
        width={500}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Company</h2>

        {/* Company Name */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Company Name</label>
            <input
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Input name"
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Tax Code */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tax code</label>
            <input
              name="taxCode"
              type="text"
              value={formData.taxCode}
              onChange={handleChange}
              placeholder="Input tax code"
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="text-sm font-medium text-gray-700">Detail</label>
            <input
              name="detail"
              type="text"
              value={formData.detail}
              onChange={handleChange}
              placeholder="Input Detail"
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              placeholder="Input Email"
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700">Avatar Image</label>
            <div className="mt-2 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onClick={() => handleImageClick('avatar')}
                onChange={handleImageChange}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 mb-2"
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
                  <p className="text-sm">
                    Drop your image here, or <span className="text-blue-500 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Supports: JPEG, PNG, SVG</p>
                </div>
              </label>

              {formData.avatar && (
                <img
                  src={URL.createObjectURL(formData.avatar)}
                  alt="Avatar Preview"
                  className="mt-3 w-40 h-40 object-cover rounded-lg border"
                />
              )}
            </div>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700">Banner Image</label>
            <div className="mt-2 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
              <input
                type="file"
                name="banner"
                accept="image/*"
                onClick={() => handleImageClick('banner')}
                onChange={handleImageChange}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 mb-2"
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
                  <p className="text-sm">
                    Drop your image here, or <span className="text-blue-500 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Supports: JPEG, PNG, SVG</p>
                </div>
              </label>

              {formData.banner && (
                <img
                  src={URL.createObjectURL(formData.banner)}
                  alt="Banner Preview"
                  className="mt-3 w-40 h-40 object-cover rounded-lg border"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FormCreateCompany;
