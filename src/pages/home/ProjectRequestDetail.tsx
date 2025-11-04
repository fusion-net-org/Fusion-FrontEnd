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
} from 'lucide-react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { GetProjectRequestById } from '@/services/projectRequest.js';
import { getCompanyById } from '@/services/companyService.js';
import LoadingOverlay from '@/common/LoadingOverlay';
import type { IProjectRequset } from '@/interfaces/ProjectRequest/projectRequest';
import type { CompanyRequest } from '@/interfaces/Company/company';
import { AcceptProjectRequest } from '@/services/projectRequest.js';
import { toast } from 'react-toastify';
import RejectReasonModal from '@/components/ProjectRequest/RejectProjectRequest';

export default function ProjectRequestDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const viewMode = (location.state as { viewMode?: string })?.viewMode ?? 'AsRequester';
  const { companyId, id } = useParams<{ companyId: string; id: string }>();

  const [projectRequest, setProjectRequest] = useState<IProjectRequset>();
  const [companyRequest, setCompanyRequest] = useState<CompanyRequest>();
  const [companyExecutor, setCompanyExecutor] = useState<CompanyRequest>();
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  //open popup
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();

  //handing open
  const openRejectModal = () => {
    setSelectedProjectId(id);
    setRejectModalOpen(true);
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const res = await AcceptProjectRequest(id);
      console.log(res);
      if (res.succeeded) {
        toast.success('Request accepted successfully!');
        fetchData();
      } else {
        toast.error(res.message || 'Failed to accept request');
      }
    } catch (error) {
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
    if (id) {
      fetchData();
    }
  }, [id]);

  return (
    <>
      {loading ? (
        <LoadingOverlay loading={loading} message="Loading Project Request..." />
      ) : (
        <div className="min-h-screen py-5 px-5">
          {accepting && <LoadingOverlay loading={true} message="Accepting request..." />}
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

                {/* STATUS BADGE */}
                <span
                  className={`mt-4 md:mt-0 px-6 py-2 text-sm font-bold rounded-full shadow-md transition-all duration-300
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard
                  icon={<ClipboardList />}
                  label="Project Code"
                  value={projectRequest?.code}
                />
                <InfoCard icon={<User />} label="Create Name" value={projectRequest?.createdName} />
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

              {/* DESCRIPTION */}
              <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition">
                <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Layers className="text-indigo-500" />
                  Project Overview
                </h2>
                <p className="text-gray-700 leading-relaxed">{projectRequest?.description}</p>
              </div>

              {/* COMPANIES */}
              <div className="grid md:grid-cols-2 gap-8">
                <CompanyCard
                  title="Requester Company"
                  data={companyRequest}
                  gradient="from-[#2563eb]/10 to-[#4f46e5]/20"
                  onClick={() => navigate(`/company/${projectRequest?.requesterCompanyId}`)}
                />
                <CompanyCard
                  title="Executor Company"
                  data={companyExecutor}
                  gradient="from-[#6366f1]/10 to-[#4338ca]/20"
                  onClick={() => navigate(`/company/${projectRequest?.executorCompanyId}`)}
                />
              </div>

              {/* ACTIONS */}
              {viewMode === 'AsExecutor' && projectRequest?.status === 'Pending' ? (
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <ActionButton
                    color="green"
                    label="Accept Invitation"
                    icon={<CheckCircle2 />}
                    onClick={() => handleAccept()}
                    disabled={projectRequest?.status !== 'Pending'}
                  />
                  <ActionButton
                    color="red"
                    label="Decline"
                    icon={<XCircle />}
                    onClick={() => openRejectModal()}
                    disabled={projectRequest?.status !== 'Pending'}
                  />
                </div>
              ) : (
                <></>
              )}

              {projectRequest?.status === 'Accepted' && (
                <div className="flex justify-end gap-4 pt-6 border-t">
                  {projectRequest?.isHaveProject ? (
                    <ActionButton
                      color="green"
                      label="Navigate To Project"
                      icon={<Navigation />}
                      onClick={() => toast.success('Navigation To Project Successfully')}
                    />
                  ) : (
                    <ActionButton
                      color="green"
                      label="Create New Project Now"
                      icon={<CheckCircle2 />}
                      onClick={() => toast.success('Create Project Successfully')}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <RejectReasonModal
            open={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            projectId={selectedProjectId ?? null}
            onSuccess={() => {
              fetchData();
            }}
          />
        </div>
      )}
    </>
  );
}

/* SUB COMPONENTS */
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

const CompanyCard = ({ title, data, gradient, onClick }: any) => (
  <div
    className={`rounded-2xl border bg-gradient-to-br ${gradient} p-6 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer`}
    onClick={onClick}
  >
    {data ? (
      <>
        <div className="flex items-center gap-5 mb-5">
          <img
            src={data.avatarCompany || 'https://via.placeholder.com/120'}
            alt={data.name}
            className="w-20 h-20 rounded-full ring-4 ring-indigo-100 object-cover shadow-md"
          />
          <div>
            <h3 className="text-xl font-bold text-gray-800">{data.name}</h3>
            <p className="text-gray-500 text-sm">{title}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-gray-700 text-sm">
          <CompanyField icon={<User />} label="Representative" value={data.ownerUserName} />
          <CompanyField icon={<Mail />} label="Email" value={data.email} />
          <CompanyField icon={<Phone />} label="Phone" value={data.phoneNumber} />
          <CompanyField icon={<Globe />} label="Website" value={data.website} />
          <CompanyField icon={<Building2 />} label="Location" value={data.address} />
          <CompanyField icon={<ClipboardList />} label="Tax Code" value={data.taxCode} />
        </div>
      </>
    ) : (
      <p className="text-gray-500 italic">Loading company info...</p>
    )}
  </div>
);

const CompanyField = ({ icon, label, value }: any) => (
  <p className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition">
    <span className="text-indigo-400">{icon}</span>
    <span className="font-medium">{label}:</span> {value || '—'}
  </p>
);

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
      ${colorClasses[color]} ${disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}
      `}
    >
      {icon}
      {label}
    </button>
  );
};
