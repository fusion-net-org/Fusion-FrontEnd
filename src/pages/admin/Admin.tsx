// src/pages/admin/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  BadgeDollarSign,
  Receipt,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const nav = useNavigate();

  const cards = [
    {
      key: 'users',
      title: 'Users',
      desc: 'Create, edit, lock & manage all users.',
      to: '/admin/users',
      icon: Users,
      kpi: '1,284',
      badge: 'Manage',
    },
    {
      key: 'companies',
      title: 'Companies',
      desc: 'View & edit every company on the platform.',
      to: '/admin/companies',
      icon: Building2,
      kpi: '237',
      badge: 'Manage',
    },
    {
      key: 'subscriptions',
      title: 'Subscriptions',
      desc: 'Plans & quotas (package catalog).',
      to: '/admin/subscriptions',
      icon: BadgeDollarSign,
      kpi: '4',
      badge: 'Packages',
    },
    {
      key: 'transactions',
      title: 'Transactions',
      desc: 'Payment history & receipts.',
      to: '/admin/transactions',
      icon: Receipt,
      kpi: '1,129',
      badge: 'Billing',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Console</h1>
          <p className="text-gray-500 text-sm">System-wide management & quick links</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-gray-600">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm">Role: System Admin</span>
        </div>
      </div>

      {/* Quick cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => nav(c.to)}
              className="group bg-white border rounded-2xl p-4 text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.badge}</div>
                  </div>
                </div>
                <div className="text-xl font-semibold">{c.kpi}</div>
              </div>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{c.desc}</p>
              <div className="mt-3 text-blue-600 font-medium inline-flex items-center gap-1">
                <span>Open</span>
                <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          );
        })}
      </section>

      {/* Optional: mini activity (mock) */}
      <section className="bg-white border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-gray-600" />
          <div className="font-medium">Recent admin activity (mock)</div>
        </div>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>
            • Updated subscription <span className="font-medium">Pro</span>
          </li>
          <li>
            • Locked user <span className="font-medium">duy@fusion.dev</span>
          </li>
          <li>
            • Restored company <span className="font-medium">Alpha Software</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
