import React, { useMemo, useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Globe,
  FileText,
  Activity,
  ClipboardList,
  Building2,
  CheckCircle2,
  Info,
  Hourglass,
  FilePlus2,
  Dot,
  Link as LinkIcon,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
const cls = (...v: Array<string | false | undefined>) => v.filter(Boolean).join(' ');

const PartnerDetails: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'activity'>('overview');

  const { id } = useParams();
  useEffect(() => {
    console.log('Partner ID:', id);
  }, [id]);

  const projectRequests = [
    {
      id: 'PRQ-001',
      status: 'Accepted' as const,
      date: '15/04/2025',
      desc: 'Project request accepted',
    },
    { id: 'PRQ-002', status: 'Done' as const, date: '04/02/2025', desc: 'Project completed' },
  ];

  const activities = [
    { date: '18/11/2025', action: 'Status of PRQ-002 changed to Done' },
    { date: '19/07/2025', action: 'PRQ-001 — Submitted' },
    { date: '15/04/2025', action: 'PRQ-001 — Accepted' },
    { date: '04/02/2025', action: 'PRQ-002 — Done' },
    { date: '22/03/2025', action: 'Created partnership request' },
    { date: '22/03/2025', action: 'Created partnership request' },
    { date: '22/03/2025', action: 'Created partnership request' },
    { date: '22/03/2025', action: 'Created partnership request' },
    { date: '22/03/2025', action: 'Created partnership request' },
    { date: '22/03/2025', action: 'Created partnership request' },
  ];

  const stats = useMemo(
    () => [
      {
        label: 'PRQ Total',
        value: 5,
        desc: 'Related project requests',
        icon: FilePlus2,
        accent: 'text-blue-600',
      },
      {
        label: 'Submitted',
        value: 1,
        desc: 'Awaiting review',
        icon: Hourglass,
        accent: 'text-amber-600',
      },
      {
        label: 'Review / Need Info',
        value: 3,
        desc: 'Pending details',
        icon: Info,
        accent: 'text-indigo-600',
      },
      {
        label: 'Approved',
        value: 1,
        desc: 'Validated successfully',
        icon: CheckCircle2,
        accent: 'text-emerald-600',
      },
    ],
    [],
  );

  const statusPill = (status: 'Done' | 'Accepted' | string) => {
    if (status === 'Done') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (status === 'Accepted') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200';
  };

  return (
    <div className="w-full mx-auto max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Banner */}
      <div className="relative">
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Scrim to improve text contrast */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-black/10 to-transparent" />
        </div>

        {/* Company header (avatar + name) */}
        <div className="absolute -bottom-14 left-8 flex items-center gap-4">
          <div className="relative">
            <img
              src="https://i.ibb.co/G5vT7pR/company-avatar.jpg"
              alt="Avatar"
              className="w-24 h-24 rounded-full ring-4 ring-white shadow-xl object-cover"
            />
            <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white shadow-md ring-1 ring-gray-200 grid place-items-center">
              <span className="h-5 w-5 rounded-full bg-emerald-500 ml-1" />
            </span>
          </div>
          <div className="pt-10">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                Beta Logistics
              </h2>
              <span className="inline-flex items-center gap- rounded-full bg-blue-50 px-2.5 mt-1 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                <Building2 className="h-3.5 w-3.5" /> BETA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 mt-1 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                <Dot className="h-3.5 w-3.5" />
                Connected
              </span>
            </div>
            <p className="text-sm text-gray/90 drop-shadow-sm">Since 16/10/2025</p>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-sm font-medium text-gray-700 backdrop-blur hover:bg-white hover:shadow transition">
            Message
          </button>
          <button className="rounded-full border border-red-300 bg-white/80 px-4 py-1.5 text-sm font-medium text-red-600 backdrop-blur hover:bg-red-50 hover:shadow transition">
            Unfriend
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-20 px-8 flex flex-wrap gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex-1 min-w-[220px] rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 shadow-[inset_0_-6px_12px_rgba(0,0,0,0.02)] hover:shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 place-items-center rounded-xl bg-white ring-1 ring-gray-200 shadow-sm">
                <s.icon className={cls('h-5 w-5 mt-[10px]', s.accent)} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{s.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className={cls('text-3xl font-bold leading-none', s.accent)}>
                    {s.value}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
              </div>
            </div>
            {/* <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" /> */}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 px-8">
        <div
          role="tablist"
          aria-label="Partner detail sections"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1"
        >
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'requests', label: 'Project Requests', icon: ClipboardList },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === (tab.id as typeof activeTab)}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cls(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                activeTab === (tab.id as typeof activeTab)
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800',
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {activeTab === 'overview' && (
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Company Overview</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5 text-sm">
              <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Business name
                </p>
                <p className="mt-1 font-medium text-gray-800">Beta Logistics</p>
              </div>
              <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Code
                </p>
                <p className="mt-1 font-medium text-gray-800">BETA</p>
              </div>
              <div className="rounded-xl border border-gray-1300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Email
                </p>
                <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                  <Mail className="h-4 w-4 text-gray-500" /> contact@beta.example
                </p>
              </div>
              <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Phone
                </p>
                <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                  <Phone className="h-4 w-4 text-gray-500" /> +84 90 3874 4858
                </p>
              </div>
              <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Website
                </p>
                <a
                  href="https://beta.example"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-2 text-blue-700 hover:underline"
                >
                  <Globe className="h-4 w-4" /> https://beta.example{' '}
                  <LinkIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>
        )}
        {/* project requests */}
        {activeTab === 'requests' && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Project Requests</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">All</span>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Accepted</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Done</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-300">
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b last:border-b-0 hover:bg-gray-50/70 transition"
                      >
                        <td className="px-4 py-3 font-medium text-blue-700">{req.id}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cls(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                              statusPill(req.status),
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{' '}
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{req.date}</td>
                        <td className="px-4 py-3 text-gray-600">{req.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {/* activity */}
        {activeTab === 'activity' && (
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="rounded-xl border border-gray-300 bg-white p-5">
              <div className="relative pl-8">
                {/* Timeline rail */}
                <span className="pointer-events-none absolute left-[2px] top-2 bottom-2 w-[5px] h-full bg-gradient-to-r from-blue-200 via-gray-200 to-transparent" />
                <ul className="space-y-8">
                  {activities.map((item, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[18px] top-5 grid h-4 w-4 place-items-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 " />
                      </span>
                      <p className="text-xs text-gray-500">{item.date}</p>
                      <p className="font-medium text-gray-800">{item.action}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PartnerDetails;
