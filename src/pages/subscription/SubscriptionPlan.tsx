import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';

interface Feature {
  key: string;
  limitValue: string;
}

interface Plan {
  name: string;
  price: number;
  periodCount: number;
  billingPeriod: 'Week' | 'Month';
  features: Feature[];
  popular: boolean;
}

type Plans = {
  week: Plan[];
  month: Plan[];
};

const SubscriptionPlan: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'week' | 'month'>('month');

  const plans: Plans = {
    week: [
      {
        name: 'Basic',
        price: 99000,
        periodCount: 1,
        billingPeriod: 'Week',
        features: [
          { key: 'Projects', limitValue: '10' },
          { key: 'Companies', limitValue: '3' },
        ],
        popular: false,
      },
      {
        name: 'Professional',
        price: 199000,
        periodCount: 1,
        billingPeriod: 'Week',
        features: [
          { key: 'Projects', limitValue: '20' },
          { key: 'Companies', limitValue: '5' },
          { key: 'Team members', limitValue: '50' },
        ],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: 399000,
        periodCount: 1,
        billingPeriod: 'Week',
        features: [
          { key: 'Projects', limitValue: '20' },
          { key: 'Company', limitValue: '20' },
          { key: 'Team members', limitValue: '50' },
          { key: 'Support', limitValue: '100' },
          { key: 'Projects request', limitValue: '50' },
        ],
        popular: false,
      },
    ],
    month: [
      {
        name: 'Basic',
        price: 299000,
        periodCount: 1,
        billingPeriod: 'Month',
        features: [
          { key: 'Projects', limitValue: '10' },
          { key: 'Companies', limitValue: '3' },
        ],
        popular: false,
      },
      {
        name: 'Professional',
        price: 599000,
        periodCount: 1,
        billingPeriod: 'Month',
        features: [
          { key: 'Projects', limitValue: '20' },
          { key: 'Companies', limitValue: '5' },
          { key: 'Team members', limitValue: '50' },
        ],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: 1199000,
        periodCount: 1,
        billingPeriod: 'Month',
        features: [
          { key: 'Projects', limitValue: '20' },
          { key: 'Company', limitValue: '20' },
          { key: 'Team members', limitValue: '50' },
          { key: 'Support', limitValue: '100' },
          { key: 'Projects request', limitValue: '50' },
        ],
        popular: false,
      },
    ],
  };

  const currentPlans = plans[selectedTab];

  const handleBuy = (plan: Plan) => {
    alert(`You selected the ${plan.name} plan.`);
    // Xử lý api mua gói dưới này ha.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Subscription Plan</h1>
        </div>

        {/* Tab */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-1.5 shadow-lg border border-slate-200 inline-flex">
            <button
              onClick={() => setSelectedTab('week')}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedTab === 'week'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedTab('month')}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedTab === 'month'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="flex justify-center flex-wrap gap-6 max-w-6xl mx-auto">
          {currentPlans.map((plan, index) => (
            <div
              key={index}
              className={`w-72 relative bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                </div>

                {/* Duration */}
                <p className="text-slate-600 text-sm mb-4">
                  Duration: {plan.periodCount} {plan.billingPeriod}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-4 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-blue-600" />
                      </div>
                      <p className="text-sm text-slate-900 m-0">
                        {feature.key}: <span className="text-slate-600">{feature.limitValue}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handleBuy(plan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlan;
