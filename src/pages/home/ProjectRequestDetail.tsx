/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  Mail,
  Phone,
  Globe,
  User,
  ClipboardList,
  Layers,
  CheckCircle2,
  XCircle,
  Navigation,
  Handshake,
} from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { GetProjectRequestById, AcceptProjectRequest } from '@/services/projectRequest.js';
import { getCompanyById } from '@/services/companyService.js';
import LoadingOverlay from '@/common/LoadingOverlay';
import { toast } from 'react-toastify';
import RejectReasonModal from '@/components/ProjectRequest/RejectProjectRequest';
import type { IProjectRequset } from '@/interfaces/ProjectRequest/projectRequest';
import type { CompanyRequest } from '@/interfaces/Company/company';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import EditProjectRequestModal from '@/components/ProjectRequest/EditProjectRequestModal';

export default function ProjectRequestDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const viewMode = (location.state as { viewMode?: string })?.viewMode ?? 'AsRequester';
  const { id } = useParams<{ companyId: string; id: string }>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [projectRequest, setProjectRequest] = useState<IProjectRequset>();
  const [companyRequest, setCompanyRequest] = useState<CompanyRequest>();
  const [companyExecutor, setCompanyExecutor] = useState<CompanyRequest>();
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const openRejectModal = () => {
    setSelectedProjectId(id);
    setRejectModalOpen(true);
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const res = await AcceptProjectRequest(id);
      if (res.succeeded) {
        toast.success('Request accepted successfully!');
        fetchData();
      } else {
        toast.error(res.message || 'Failed to accept request');
      }
    } catch {
      toast.error('Error while accepting request');
    } finally {
      setAccepting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectRes = await GetProjectRequestById(id);
      const projectData = projectRes.data;
      setProjectRequest(projectData);

      const [reqRes, exeRes] = await Promise.all([
        getCompanyById(projectData.requesterCompanyId),
        getCompanyById(projectData.executorCompanyId),
      ]);

      setCompanyRequest(reqRes.data);
      setCompanyExecutor(exeRes.data);
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  return (
    <>
      {loading ? (
        <LoadingOverlay loading={loading} message="Loading Project Request..." />
      ) : (
        <div className="min-h-screen py-5 px-5">
          {accepting && <LoadingOverlay loading message="Accepting request..." />}
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white px-10 py-8 rounded-b-3xl shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">
                    {projectRequest?.projectName ?? 'Unnamed Project'}
                  </h1>
                  <p className="text-indigo-100 mt-1 text-sm">
                    {projectRequest?.code ? `#${projectRequest.code}` : '—'}
                  </p>
                </div>
                <span
                  className={`mt-4 md:mt-0 px-6 py-2 text-sm font-bold rounded-full shadow-md
                    ${
                      projectRequest?.status === 'Accepted'
                        ? 'bg-green-500 text-white'
                        : projectRequest?.status === 'Rejected'
                        ? 'bg-red-500 text-white'
                        : projectRequest?.status === 'Pending'
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                >
                  {projectRequest?.status ?? 'Unknown'}
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="p-10 space-y-10">
              {/* PROJECT INFO */}
              <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition relative">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <ClipboardList className="text-indigo-500" />
                    Project Information
                  </h2>

                  {viewMode === 'AsRequester' && projectRequest?.status === 'Pending' && (
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md transition transform hover:-translate-y-0.5"
                    >
                      <Layers className="w-4 h-4" />
                      Edit Request
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoCard
                    icon={<ClipboardList />}
                    label="Project Code"
                    value={projectRequest?.code}
                  />
                  <InfoCard
                    icon={<User />}
                    label="Created By"
                    value={projectRequest?.createdName}
                  />
                  <InfoCard
                    icon={<Calendar />}
                    label="Start Date"
                    value={
                      projectRequest?.startDate
                        ? new Date(projectRequest.startDate).toLocaleDateString('vi-VN')
                        : '—'
                    }
                  />
                  <InfoCard
                    icon={<Calendar />}
                    label="End Date"
                    value={
                      projectRequest?.endDate
                        ? new Date(projectRequest.endDate).toLocaleDateString('vi-VN')
                        : '—'
                    }
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition">
                <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Layers className="text-indigo-500" />
                  Project Overview
                </h2>
                <p className="text-gray-700 leading-relaxed">{projectRequest?.description}</p>
              </div>

              {/* REQUESTER COMPANY */}
              <div className="space-y-4">
                <h3 className="text-gray-700 font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Requester Company
                </h3>
                <CompanyCard
                  data={companyRequest}
                  gradient="from-gray-50 to-gray-100"
                  onClick={() => navigate(`/company/${projectRequest?.requesterCompanyId}`)}
                />
                {companyRequest && <CompanyPerformanceChart companyName={companyRequest.name} />}
              </div>

              {/* EXECUTOR COMPANY */}
              <div className="space-y-4">
                <h3 className="text-gray-700 font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-indigo-500" />
                  Executor Company
                </h3>
                <CompanyCard
                  data={companyExecutor}
                  gradient="from-gray-50 to-gray-100"
                  onClick={() => navigate(`/company/${projectRequest?.executorCompanyId}`)}
                />
                {companyExecutor && <CompanyPerformanceChart companyName={companyExecutor.name} />}
              </div>

              {/* ACTIONS */}
              {viewMode === 'AsExecutor' && projectRequest?.status === 'Pending' && (
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <ActionButton
                    color="green"
                    label="Accept Invitation"
                    icon={<CheckCircle2 />}
                    onClick={handleAccept}
                  />
                  <ActionButton
                    color="red"
                    label="Decline"
                    icon={<XCircle />}
                    onClick={openRejectModal}
                  />
                </div>
              )}
              {/* http://localhost:5173/companies/16ab11c0-d1ce-49f6-924b-b9235d5b9acd/project */}
              {projectRequest?.status === 'Accepted' && (
                <div className="flex justify-end gap-4 pt-6 border-t">
                  {projectRequest?.isHaveProject ? (
                    <ActionButton
                      color="green"
                      label="Navigate To Project"
                      icon={<Navigation />}
                      onClick={() => {
                        const companyId =
                          viewMode === 'AsExecutor'
                            ? projectRequest.executorCompanyId
                            : projectRequest.requesterCompanyId;

                        const url =
                          viewMode === 'AsExecutor'
                            ? `/companies/${companyId}/project`
                            : `/companies/${companyId}/project-company-request`;

                        navigate(url);
                      }}
                    />
                  ) : (
                    <ActionButton
                      color="green"
                      label="Create New Project Now"
                      icon={<CheckCircle2 />}
                      onClick={() => {
                        toast.success('Create Project Successfully');
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MODAL */}
          <RejectReasonModal
            open={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            projectId={selectedProjectId ?? null}
            onSuccess={() => fetchData()}
          />
          <EditProjectRequestModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            project={projectRequest ?? null}
            onSuccess={() => fetchData()}
          />
        </div>
      )}
    </>
  );
}

/* ---------------- SUB COMPONENTS ---------------- */

const InfoCard = ({ icon, label, value }: any) => (
  <div className="bg-white border rounded-2xl shadow-sm p-4 hover:shadow-lg transition transform hover:-translate-y-1">
    <div className="flex items-center gap-3">
      <div className="text-indigo-600 bg-indigo-50 p-2 rounded-xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

const CompanyCard = ({ data, gradient, onClick }: any) => (
  <div
    className={`rounded-2xl border bg-gradient-to-br ${gradient} p-8 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer`}
    onClick={onClick}
  >
    {data ? (
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8">
        {/* LEFT: Avatar + Name */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/3">
          <img
            src={data.avatarCompany || 'https://via.placeholder.com/150'}
            alt={data.name}
            className="w-36 h-36 rounded-full ring-4 ring-gray-100 object-cover shadow-md mb-4"
          />
          <h3 className="text-2xl font-bold text-gray-800 text-center">{data.name}</h3>
        </div>

        {/* RIGHT: Company Info */}
        <div className="flex flex-col justify-center gap-3 text-gray-700 text-sm w-full md:w-2/3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
          <CompanyField icon={<User />} label="Representative" value={data.ownerUserName} />
          <CompanyField icon={<Mail />} label="Email" value={data.email} />
          <CompanyField icon={<Phone />} label="Phone" value={data.phoneNumber} />
          <CompanyField icon={<Globe />} label="Website" value={data.website} />
          <CompanyField icon={<Building2 />} label="Location" value={data.address} />
          <CompanyField icon={<ClipboardList />} label="Tax Code" value={data.taxCode} />
        </div>
      </div>
    ) : (
      <p className="text-gray-500 italic">Loading company info...</p>
    )}
  </div>
);

const CompanyField = ({ icon, label, value }: any) => (
  <p className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition">
    <span className="text-indigo-400">{icon}</span>
    <span className="font-medium">{label}:</span>
    <span className="text-gray-800">{value || '—'}</span>
  </p>
);

const CompanyPerformanceChart = ({ companyName }: any) => {
  const data = [
    { name: 'On-Time Release', value: 85 },
    { name: 'Violations', value: 3 },
    { name: 'Completed Projects', value: 47 },
  ];

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-inner p-5 border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
        {companyName} Performance Overview
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ActionButton = ({ color, label, icon, onClick, disabled }: any) => {
  const colorClasses: any = {
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-6 py-2.5 text-white font-semibold rounded-full shadow-md transition transform hover:-translate-y-0.5
      ${colorClasses[color]} ${
        disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
