import React, { useEffect, useState } from 'react';
import { DollarSign, Trash2, Plus } from 'lucide-react';

interface Feature {
  featureKey: string;
  limitValue: number;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  features: Feature[];
  billingPeriod: string;
  periodCount: number;
  price: number;
  currency: string;
  refundWindowDays: number;
  refundFeePercent: number;
}

interface SubscriptionPlanPayload {
  code: string;
  name: string;
  description: string;
  features: Feature[];
  price: {
    billingPeriod: string;
    periodCount: number;
    price: number;
    currency: string;
    refundWindowDays: number;
    refundFeePercent: number;
  };
}

interface Props {
  isOpen: boolean;
  handleCancel: () => void;
  onSubmit?: (data: SubscriptionPlanPayload) => void;
  initialData?: any;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  features: [{ featureKey: 'Project', limitValue: 1 }],
  billingPeriod: 'Week',
  periodCount: 1,
  price: 0,
  currency: 'VND',
  refundWindowDays: 0,
  refundFeePercent: 0,
};

export default function SubscriptionPlanModal({
  isOpen,
  handleCancel,
  onSubmit,
  initialData,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    features: [{ featureKey: 'Project', limitValue: 1 }],
    billingPeriod: 'Week',
    periodCount: 1,
    price: 0,
    currency: 'VND',
    refundWindowDays: 0,
    refundFeePercent: 0,
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        description: initialData.description || '',
        features: initialData.features || [{ featureKey: 'Project', limitValue: 1 }],
        billingPeriod: initialData.price?.billingPeriod || 'Week',
        periodCount: initialData.price?.periodCount || 1,
        price: initialData.price?.price || 0,
        currency: initialData.price?.currency || 'VND',
        refundWindowDays: initialData.price?.refundWindowDays || 0,
        refundFeePercent: initialData.price?.refundFeePercent || 0,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, isOpen]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, { featureKey: '', limitValue: 0 }],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (index: number, key: 'featureKey' | 'limitValue', value: any) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [key]: value } : feature,
      ),
    }));
  };

  const defaultFormData: FormData = {
    code: '',
    name: '',
    description: '',
    features: [{ featureKey: 'Project', limitValue: 1 }],
    billingPeriod: 'Week',
    periodCount: 1,
    price: 0,
    currency: 'VND',
    refundWindowDays: 0,
    refundFeePercent: 0,
  };

  const handleSubmit = () => {
    const newErrors: any = {};

    if (!formData.code) newErrors.code = 'Code is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.description) newErrors.description = 'Description is required';

    formData.features.forEach((f, i) => {
      if (!f.featureKey) newErrors[`feature_${i}_key`] = 'Feature key required';
      if (f.limitValue <= 0) newErrors[`feature_${i}_value`] = 'Limit must be > 0';
    });

    if (formData.price <= 0) newErrors.price = 'Price must be > 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: SubscriptionPlanPayload = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      features: formData.features.map((f) => ({
        featureKey: f.featureKey,
        limitValue: f.limitValue,
      })),
      price: {
        billingPeriod: formData.billingPeriod,
        periodCount: formData.periodCount,
        price: formData.price,
        currency: formData.currency,
        refundWindowDays: formData.refundWindowDays,
        refundFeePercent: formData.refundFeePercent,
      },
    };

    if (onSubmit) {
      onSubmit(payload);
      setFormData(defaultFormData);
      setErrors({});
    }
    handleCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800 mb-0">
              Subscription Plan Configuration
            </h2>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
            <div className="space-y-4">
              {['code', 'name', 'description'].map((field) => (
                <div key={field}>
                  <label className="block font-medium text-gray-700">
                    {field.charAt(0).toUpperCase() + field.slice(1)} *
                  </label>
                  {field !== 'description' ? (
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${
                        errors[field] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData[field as keyof FormData] as string}
                      onChange={(e) => updateField(field as keyof FormData, e.target.value)}
                      placeholder={`Enter ${field}`}
                    />
                  ) : (
                    <textarea
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  )}
                  {errors[field] && (
                    <div className="text-red-500 text-sm mt-1">{errors[field]}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Features (feature key + limit value)
            </h3>
            <div className="space-y-3">
              {formData.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <input
                    type="text"
                    placeholder="Feature Key"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                      errors[`feature_${i}_key`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={feature.featureKey}
                    onChange={(e) => updateFeature(i, 'featureKey', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Limit"
                    min={0}
                    className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                      errors[`feature_${i}_value`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={feature.limitValue}
                    onChange={(e) => updateFeature(i, 'limitValue', parseInt(e.target.value) || 0)}
                  />
                  <button
                    onClick={() => removeFeature(i)}
                    disabled={formData.features.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button
                onClick={addFeature}
                className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={20} /> Add Feature
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Pricing Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Billing Period',
                  field: 'billingPeriod',
                  type: 'select',
                  options: ['Week', 'Month', 'Year'],
                },
                { label: 'Period Count', field: 'periodCount', type: 'number' },
                { label: 'Price', field: 'price', type: 'number' },
                {
                  label: 'Currency',
                  field: 'currency',
                  type: 'select',
                  options: ['VND', 'USD', 'EUR'],
                },
                { label: 'Refund Window (Days)', field: 'refundWindowDays', type: 'number' },
                {
                  label: 'Refund Fee (%)',
                  field: 'refundFeePercent',
                  type: 'number',
                  min: 0,
                  max: 100,
                },
              ].map((item) => (
                <div key={item.field}>
                  <label className="block font-medium text-gray-700 mb-2">{item.label}</label>
                  {item.type === 'select' ? (
                    <select
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData[item.field as keyof FormData] as string}
                      onChange={(e) => updateField(item.field as keyof FormData, e.target.value)}
                    >
                      {item.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={item.min ?? 0}
                      max={item.max ?? undefined}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData[item.field as keyof FormData] as number}
                      onChange={(e) =>
                        updateField(item.field as keyof FormData, parseInt(e.target.value) || 0)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md"
            >
              {initialData ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
