/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
  Building2,
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
  ChevronDown,
  X,
} from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { GetProjectRequestById, AcceptProjectRequest } from '@/services/projectRequest.js';
import { getCompanyById } from '@/services/companyService.js';
import LoadingOverlay from '@/common/LoadingOverlay';
import { toast } from 'react-toastify';
import RejectReasonModal from '@/components/ProjectRequest/RejectProjectRequest';
import type { IProjectRequset } from '@/interfaces/ProjectRequest/projectRequest';
import type { CompanyRequest } from '@/interfaces/Company/company';
import EditProjectRequestModal from '@/components/ProjectRequest/EditProjectRequestModal';
import CreateProjectModal from '@/components/Company/ProjectCreate/CreateProjectModal';
import { createProject } from '@/services/projectService.js';
import { RestoreProjectRequest } from '@/services/projectRequest.js';
import DeleteProjectRequestModal from '@/components/ProjectRequest/DeleteProjectRequestModal';
import { getContractById } from '@/services/contractService.js';
export default function ProjectRequestDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const viewMode = (location.state as { viewMode?: string })?.viewMode ?? 'AsRequester';
  const contractId = (location.state as { contractId?: string })?.contractId;
  const { companyId, id } = useParams<{ companyId: string; id: string }>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteProjectId, setSelectedDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [projectCreateModalOpen, setProjectCreateModalOpen] = useState(false);
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
  const isDeleted = projectRequest?.isDeleted ?? false;
  const [contract, setContract] = useState<any>();

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
  const handleRestore = async () => {
    try {
      setDeleting(true);
      const res = await RestoreProjectRequest(id);
      if (res.succeeded) {
        toast.success('Project request restored successfully!');
        fetchData();
      } else {
        toast.error(res.message || 'Failed to restore project request');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to restore project request');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedDeleteProjectId(id);
    setDeleteModalOpen(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectRes = await GetProjectRequestById(id);
      const projectData = projectRes.data;
      console.log(projectData);
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

  useEffect(() => {
    const load = async () => {
      if (id) await fetchData();

      if (contractId) {
        try {
          const contractRes = await getContractById(contractId);
          setContract(contractRes.data);
        } catch (err) {
          console.error('Failed to fetch contract:', err);
        }
      }
    };
    load();
  }, [id, contractId]);

  return (
    <>
      {loading ? (
        <LoadingOverlay loading={loading} message="Loading Project Request..." />
      ) : (
        <div className="min-h-screen py-5 px-5">
          {accepting && <LoadingOverlay loading message="Accepting request..." />}
          <div className="mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-6 md:py-8 rounded-b-3xl shadow-md relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
                    {projectRequest?.projectName ?? 'Unnamed Project'}
                  </h1>
                  <p className="text-indigo-200 mt-1 text-sm font-medium">
                    {projectRequest?.code ? `#${projectRequest.code}` : '—'}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`flex items-center gap-2 mt-2 md:mt-0 px-5 py-2 text-sm font-semibold rounded-full transition
          ${
            projectRequest?.status === 'Accepted'
              ? 'bg-green-100 text-green-800'
              : projectRequest?.status === 'Rejected'
              ? 'bg-red-100 text-red-800'
              : projectRequest?.status === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-700'
          }`}
                >
                  {projectRequest?.status === 'Accepted' && <CheckCircle2 className="w-4 h-4" />}
                  {projectRequest?.status === 'Rejected' && <X className="w-4 h-4" />}
                  {projectRequest?.status === 'Pending' && <Layers className="w-4 h-4" />}
                  {projectRequest?.status ?? 'Unknown'}
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="p-10 space-y-10">
              {/* PROJECT INFO + OVERVIEW COMBINED */}
              <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition relative">
                {/* Overview Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    Project Overview
                  </h3>

                  {viewMode === 'AsRequester' && projectRequest?.status === 'Pending' && (
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md transition"
                    >
                      <Layers className="w-4 h-4" />
                      Edit Request
                    </button>
                  )}
                </div>

                {/* Overview Content */}
                <p className="text-gray-700 font-semibold leading-relaxed mb-6">
                  {projectRequest?.description || '—'}
                </p>

                {/* Compact Info List */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm font-semibold">
                  <InfoRow label="Project Code" value={projectRequest?.code} />
                  <InfoRow label="Created By" value={projectRequest?.createdName} />
                  <InfoRow
                    label="Start Date"
                    value={
                      projectRequest?.startDate
                        ? new Date(projectRequest.startDate).toLocaleDateString('vi-VN')
                        : '—'
                    }
                  />
                  <InfoRow
                    label="End Date"
                    value={
                      projectRequest?.endDate
                        ? new Date(projectRequest.endDate).toLocaleDateString('vi-VN')
                        : '—'
                    }
                  />
                </div>
              </div>

              {/* CONTRACT INFORMATION - COMPACT MODE */}
              {contractId && contract && (
                <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition relative">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Handshake className="text-indigo-500 w-5 h-5" />
                    Contract Information
                  </h3>

                  {/* Contract Main Info */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-sm">
                    <InfoRow label="Contract Code" value={contract.contractCode} />
                    <InfoRow label="Contract Name" value={contract.contractName} />
                    <InfoRow
                      label="Effective Date"
                      value={new Date(contract.effectiveDate).toLocaleDateString('vi-VN')}
                    />
                    <InfoRow
                      label="Expired Date"
                      value={new Date(contract.expiredDate).toLocaleDateString('vi-VN')}
                    />
                    <InfoRow
                      label="Budget"
                      value={`${contract.budget?.toLocaleString('vi-VN')} VND`}
                    />
                    <InfoRow label="Status" value={contract.status} />
                  </div>

                  {/* Appendices */}
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-600" />
                      Contract Appendices
                    </h3>

                    {contract.appendices?.length > 0 ? (
                      <div className="space-y-4">
                        {contract.appendices.map((item: any) => (
                          <details
                            key={item.id}
                            className="group border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5"
                          >
                            <summary className="cursor-pointer font-semibold flex justify-between items-center text-md">
                              <span>
                                {item.appendixCode} — {item.appendixName}
                              </span>

                              <span className="transition-transform duration-300 group-open:rotate-180">
                                <ChevronDown className="w-5 h-5" />
                              </span>
                            </summary>

                            <div className="mt-4 space-y-2 text-gray-700 leading-relaxed border-t pt-3">
                              <p className="whitespace-pre-line">{item.appendixDescription}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-gray-500 text-sm">No appendices found.</p>
                    )}
                  </div>

                  {/* Attachment */}
                  {contract.attachment && (
                    <button
                      onClick={() => window.open(contract.attachment, '_blank')}
                      className="mt-4 flex items-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow transition"
                    >
                      <ClipboardList className="w-4 h-4" />
                      View Contract Attachment
                    </button>
                  )}
                </div>
              )}

              {/* COMPANIES INFORMATION */}
              <div className="border rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition relative">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Requester Company
                </h3>
                <CompanyCard
                  data={companyRequest}
                  gradient="from-gray-50 to-gray-100"
                  onClick={() => navigate(`/company/${projectRequest?.requesterCompanyId}`)}
                />

                {/* Executor */}
                <h3 className="text-xl font-bold text-gray-800 mt-8 mb-6 flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-indigo-600" />
                  Executor Company
                </h3>
                <CompanyCard
                  data={companyExecutor}
                  gradient="from-gray-50 to-gray-100"
                  onClick={() => navigate(`/company/${projectRequest?.executorCompanyId}`)}
                />
              </div>

              <div className="flex justify-end gap-4">
                {/* Delete / Restore */}
                {(viewMode === 'AsRequester' || viewMode === 'AsExecutor') &&
                  projectRequest &&
                  (!projectRequest.isDeleted ? (
                    <ActionButton
                      color="red"
                      label={deleting ? 'Deleting...' : 'Delete'}
                      icon={<XCircle />}
                      onClick={() => openDeleteModal(projectRequest.id)}
                      disabled={deleting}
                    />
                  ) : (
                    <ActionButton
                      color="green"
                      label={deleting ? 'Restoring...' : 'Restore'}
                      icon={<CheckCircle2 />}
                      onClick={handleRestore}
                      disabled={deleting}
                    />
                  ))}

                {/* Accept / Decline */}
                {viewMode === 'AsExecutor' && projectRequest?.status === 'Pending' && (
                  <>
                    <ActionButton
                      color="green"
                      label="Accept Invitation"
                      icon={<CheckCircle2 />}
                      onClick={handleAccept}
                      disabled={isDeleted}
                    />
                    <ActionButton
                      color="red"
                      label="Reject Inviation"
                      icon={<XCircle />}
                      onClick={openRejectModal}
                      disabled={isDeleted}
                    />
                  </>
                )}

                {/* Navigate / Create Project */}
                {projectRequest?.status === 'Accepted' &&
                  (projectRequest?.isHaveProject ? (
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
                            : // : `/companies/${companyId}/project-company-request`;
                              `/companies/${companyId}/projectRequest/${projectRequest.convertedProjectId}`;

                        navigate(url);
                      }}
                      disabled={isDeleted}
                    />
                  ) : (
                    <></>
                  ))}

                {/* Navigate / Create Project */}
                {projectRequest?.status === 'Accepted' && !projectRequest?.isHaveProject && (
                  <ActionButton
                    color="green"
                    label="Create New Project Now"
                    icon={<CheckCircle2 />}
                    onClick={() => setProjectCreateModalOpen(true)}
                    disabled={isDeleted || viewMode === 'AsRequester'}
                  />
                )}
              </div>
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
          <CreateProjectModal
            open={projectCreateModalOpen}
            onClose={() => setProjectCreateModalOpen(false)}
            companyName={companyRequest?.name}
            defaultValues={{
              code: projectRequest?.code,
              name: projectRequest?.projectName,
              description: projectRequest?.description,
              startDate: projectRequest?.startDate,
              endDate: projectRequest?.endDate,
              companyRequestId: companyRequest?.id,
              companyId: companyExecutor?.id,
              isHire: true,
              projectRequestId: id,
            }}
            onSubmit={async (payload) => {
              try {
                const createdProject = await createProject(payload);
                toast.success('Project created successfully!');
                setProjectCreateModalOpen(false);
                navigate(`/companies/${companyId}/project`);
              } catch (err: any) {
                console.error('Create project failed:', err);
                toast.error(err?.response?.data?.message || 'Failed to create project');
              }
            }}
          />

          <DeleteProjectRequestModal
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            projectId={selectedDeleteProjectId}
            onSuccess={() => fetchData()}
          />
        </div>
      )}
    </>
  );
}

/* ---------------- SUB COMPONENTS ---------------- */
const InfoRow = ({ label, value }: any) => (
  <p className="flex items-center text-gray-700 gap-2 border-b pb-2">
    <span className="font-medium w-32">{label}:</span>
    <span className="text-gray-900">{value || '—'}</span>
  </p>
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

const ActionButton = ({ color, label, icon, onClick, disabled }: any) => {
  const colorClasses: any = {
    green: 'text-green-700 border-green-400 bg-green-50 hover:bg-green-100',
    red: 'text-red-700 border-red-400 bg-red-50 hover:bg-red-100',
    blue: 'text-blue-700 border-blue-400 bg-blue-50 hover:bg-blue-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors
        ${colorClasses[color]} ${
        disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
