/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  Globe,
  FileText,
  Activity,
  ClipboardList,
  Dot,
  Link as LinkIcon,
  HandCoins,
  User,
  Folder,
  Handshake,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
import { getCompanyById } from '@/services/companyService.js';
import type { CompanyRequest } from '@/interfaces/Company/company';
import LoadingOverlay from '@/common/LoadingOverlay';
import UnfriendPartner from '@/components/Partner/UnfriendPartner';
import { GetPartnerBetweenTwoCompanies } from '@/services/partnerService.js';
import type { Partner } from '@/interfaces/Partner/partner';

const cls = (...v: Array<string | false | undefined>) => v.filter(Boolean).join(' ');

const PartnerDetails: React.FC = () => {
  const { state } = useLocation();
  const myCompanyId = state?.companyId;
  const partnerId = state?.partnerId;

  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'activity'>('overview');
  const [partner, setPartner] = useState<CompanyRequest>();
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const [openDeleteModal, setOpenDeleteModel] = useState(false);
  const [partnerV2, setPartnerV2] = useState<Partner>();

  //call api get company by id
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [companyRes, partnerRes] = await Promise.all([
          getCompanyById(id),
          GetPartnerBetweenTwoCompanies(myCompanyId, id),
        ]);
        setPartner(companyRes.data);
        setPartnerV2(partnerRes.data);
      } catch (error: any) {
        console.error('error', error.message);
      } finally {
        setTimeout(() => setLoading(false), 200);
      }
    };

    fetchAllData();
  }, [id, myCompanyId]);

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
        label: 'Total Members',
        value: partner?.totalMember || 0,
        desc: 'Number of members in the company',
        icon: User,
        accent: 'text-blue-600',
      },
      {
        label: 'Total Projects',
        value: partner?.totalProject || 0,
        desc: 'Total number of projects the company has participated in',
        icon: Folder,
        accent: 'text-amber-600',
      },
      {
        label: 'Total Partners',
        value: partner?.totalApproved || 0,
        desc: 'Number of partner companies in collaboration',
        icon: Handshake,
        accent: 'text-indigo-600',
      },
      {
        label: 'Total Approved',
        value: partner?.totalApproved || 0,
        desc: 'Projects or requests that have been approved',
        icon: CheckCircle,
        accent: 'text-emerald-600',
      },
    ],
    [partner],
  );

  const statusPill = (status: 'Done' | 'Accepted' | string) => {
    if (status === 'Done') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (status === 'Accepted') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200';
  };

  return (
    <>
      <LoadingOverlay loading={loading} message="Loading Partner Details..." />
      {!loading && (
        <div className="w-full mx-auto max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="relative">
            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={partner?.imageCompany}
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
                  src={partner?.avatarCompany}
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
                    {partner?.name}
                  </h2>
                  {partner?.isDeleted === false ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 mt-1 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      <Dot className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 mt-1 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                      <Dot className="h-3.5 w-3.5" />
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray/90 drop-shadow-sm">
                  Since{' '}
                  {partner?.createAt ? new Date(partner.createAt).toLocaleDateString('vi-VN') : '—'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-sm font-medium text-gray-700 backdrop-blur hover:bg-white hover:shadow transition">
                Message
              </button>
              <button
                className={`
                rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200
                ${
                  partnerV2?.status?.toLowerCase() === 'active'
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md'
                    : partnerV2?.status?.toLowerCase() === 'pending'
                    ? 'border-amber-400 bg-amber-50 text-amber-600 cursor-not-allowed'
                    : 'border-gray-400 bg-gray-100 text-gray-600 cursor-not-allowed'
                }
              `}
                onClick={() => {
                  if (partnerV2?.status?.toLowerCase() === 'active') {
                    setOpenDeleteModel(true);
                  }
                }}
                disabled={partnerV2?.status?.toLowerCase() !== 'active'}
              >
                {partnerV2?.status?.toLowerCase() === 'active' && 'Unfriend'}
                {partnerV2?.status?.toLowerCase() === 'pending' && 'Wait for response'}
                {partnerV2?.status?.toLowerCase() === 'inactive' && 'Deleted'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div
                key={i}
                className={cls(
                  'rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 shadow-md hover:shadow-lg transition-all duration-300 p-5',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white ring-1 ring-gray-100 shadow-sm">
                    <s.icon className={cls('h-6 w-6', s.accent)} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{s.label}</p>
                    <p className={cls('text-3xl font-bold leading-none', s.accent)}>{s.value}</p>
                    <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
                  </div>
                </div>
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
                  <div className="rounded-xl border border-gray-1300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Company Name
                    </p>
                    <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                      <Building2 className="h-4 w-4 text-gray-500" /> {partner?.ownerUserName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-1300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Owner Name
                    </p>
                    <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                      <User className="h-4 w-4 text-gray-500" /> {partner?.ownerUserName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-1300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Email
                    </p>
                    <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                      <Mail className="h-4 w-4 text-gray-500" /> {partner?.email}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Phone
                    </p>
                    <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                      <Phone className="h-4 w-4 text-gray-500" /> {partner?.phoneNumber}
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
                      <Globe className="h-4 w-4" /> {partner?.website}{' '}
                      <LinkIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Tax Code
                    </p>
                    <p className="mt-1 flex items-center border-gray-300 gap-2 text-gray-800">
                      <HandCoins className="h-4 w-4 text-gray-500" /> {partner?.taxCode}
                    </p>
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
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                      Accepted
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                      Done
                    </span>
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
      )}
      {openDeleteModal && partnerId && (
        <UnfriendPartner
          open={openDeleteModal}
          partnerId={partnerId}
          onClose={() => setOpenDeleteModel(false)}
          onSuccess={async () => {
            setLoading(true);
            await Promise.all([
              getCompanyById(id).then((res: any) => setPartner(res.data)),
              GetPartnerBetweenTwoCompanies(myCompanyId, id).then((res: any) =>
                setPartnerV2(res.data),
              ),
            ]);
            setLoading(false);
          }}
        />
      )}{' '}
    </>
  );
};

export default PartnerDetails;
