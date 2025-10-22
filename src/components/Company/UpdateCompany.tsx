/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { updateCompany } from '@/services/companyService.js';

interface UpdateCompanyProps {
  company: any;
  section: 'overview' | 'image' | 'contact';
  onClose: () => void;
  onSave: (data: any) => void;
}

const UpdateCompany: React.FC<UpdateCompanyProps> = ({ company, section, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: company?.name || '',
    taxCode: company?.taxCode || '',
    detail: company?.detail || '',
    email: company?.email || '',
    phoneNumber: company?.phoneNumber || '',
    address: company?.address || '',
    website: company?.website || '',
  });

  const [imageCompany, setImageCompany] = useState<File | null>(null);
  const [avatarCompany, setAvatarCompany] = useState<File | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'avatar') setAvatarCompany(file);
      if (type === 'banner') setImageCompany(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('Name', form.name);
    data.append('TaxCode', form.taxCode);
    data.append('Detail', form.detail);
    data.append('Email', form.email);
    data.append('PhoneNumber', form.phoneNumber);
    data.append('Address', form.address);
    data.append('Website', form.website);
    if (imageCompany) data.append('ImageCompany', imageCompany);
    if (avatarCompany) data.append('AvatarCompany', avatarCompany);

    try {
      const res = await updateCompany(company.id, data);
      toast.success('Company updated successfully!');
      onSave(res.data); // cập nhật UI cha
      onClose(); // đóng modal
    } catch (err: any) {
      toast.error(err.message || 'Failed to update company!');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Update Company</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OVERVIEW */}
          {section === 'overview' && (
            <>
              <div>
                <label className="text-sm font-bold text-gray-600">Company Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600">Tax Code</label>
                <input
                  type="text"
                  name="taxCode"
                  value={form.taxCode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600">Detail</label>
                <textarea
                  name="detail"
                  value={form.detail}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* IMAGE */}
          {section === 'image' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Avatar Image</label>
                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-blue-50 transition"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarCompany ? (
                    <img
                      src={URL.createObjectURL(avatarCompany)}
                      alt="Avatar Preview"
                      className="h-32 w-32 object-cover rounded-lg shadow-md"
                    />
                  ) : company?.avatarCompany ? (
                    <img
                      src={company.avatarCompany}
                      alt="Avatar"
                      className="h-32 w-32 object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">Click to upload avatar</p>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-bold text-gray-600">Banner Image</label>
                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-blue-50 transition"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {imageCompany ? (
                    <img
                      src={URL.createObjectURL(imageCompany)}
                      alt="Banner Preview"
                      className="h-32 w-full object-cover rounded-lg shadow-md"
                    />
                  ) : company?.imageCompany ? (
                    <img
                      src={company.imageCompany}
                      alt="Banner"
                      className="h-32 w-full object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">Click to upload banner</p>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'banner')}
                  />
                </div>
              </div>
            </>
          )}

          {/* CONTACT */}
          {section === 'contact' && (
            <>
              <div>
                <label className="text-sm font-bold text-gray-600">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600">Phone</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600">Website</label>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UpdateCompany;
